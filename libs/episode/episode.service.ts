import { inject, Injectable } from '@angular/core';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { FIRESTORE } from '../shared/firebase.token';
import { EpisodeCategoryService } from '../shared/episode-category.service';
import { EpisodeGenreService } from '../shared/episode-genre.service';
import { EpisodeTagService } from '../shared/episode-tag.service';
import { ImageUploadService } from '../shared/image-upload.service';
import { Episode, EpisodeWithRelations } from './episode.model';

@Injectable({ providedIn: 'root' })
export class EpisodeService {
  private firestore = inject(FIRESTORE);
  private episodeCategoryService = inject(EpisodeCategoryService);
  private episodeGenreService = inject(EpisodeGenreService);
  private episodeTagService = inject(EpisodeTagService);
  private imageUploadService = inject(ImageUploadService);

  async getAllEpisodes(): Promise<Episode[]> {
    const q = query(collection(this.firestore, 'episodes'), orderBy('episodeDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Episode);
  }

  async toggleEpisodeVisibility(id: string, isVisible: boolean): Promise<void> {
    await updateDoc(doc(this.firestore, 'episodes', id), { isVisible });
  }

  async getCurrentEpisode(): Promise<Episode | null> {
    const q = query(
      collection(this.firestore, 'episodes'),
      where('isVisible', '==', true),
      orderBy('episodeDate', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Episode;
  }

  async getRecentEpisodes(): Promise<Episode[]> {
    const q = query(
      collection(this.firestore, 'episodes'),
      where('isVisible', '==', true),
      orderBy('episodeDate', 'desc'),
      limit(5)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Episode);
  }

  async getVisibleEpisodes(searchTerm?: string): Promise<Episode[]> {
    const q = query(
      collection(this.firestore, 'episodes'),
      where('isVisible', '==', true),
      orderBy('episodeDate', 'desc')
    );
    const snapshot = await getDocs(q);
    let episodes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Episode);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      episodes = episodes.filter((e) => e.title.toLowerCase().includes(term));
    }

    return episodes;
  }

  async getEpisodeById(id: string): Promise<EpisodeWithRelations> {
    const snap = await getDoc(doc(this.firestore, 'episodes', id));
    if (!snap.exists()) {
      throw new Error(`Episode with id "${id}" not found`);
    }

    const episode = { id: snap.id, ...snap.data() } as Episode;
    const [categories, genres, tags] = await Promise.all([
      this.episodeCategoryService.getEpisodeCategoriesByEpisodeId(id),
      this.episodeGenreService.getEpisodeGenresByEpisodeId(id),
      this.episodeTagService.getEpisodeTagsByEpisodeId(id),
    ]);

    return { ...episode, categories, genres, tags };
  }

  async createEpisode(
    episode: Omit<Episode, 'id'>,
    categoryIds: string[],
    genreIds: string[],
    tagIds: string[],
    posterFile?: File
  ): Promise<string> {
    const episodeRef = doc(collection(this.firestore, 'episodes'));
    const episodeId = episodeRef.id;

    // Upload poster before batch — Storage can't participate in Firestore batches
    let posterUrl: string | null = null;
    if (posterFile) {
      posterUrl = await this.imageUploadService.uploadPoster(episodeId, posterFile);
    }

    try {
      // Batch episode doc + all junction docs in a single atomic write
      const batch = writeBatch(this.firestore);

      batch.set(episodeRef, {
        createdAt: episode.createdAt,
        episodeDate: episode.episodeDate,
        intelligence: episode.intelligence,
        isVisible: episode.isVisible,
        links: episode.links,
        posterUrl,
        title: episode.title,
      });

      for (const cId of categoryIds) {
        batch.set(doc(collection(this.firestore, 'episodeCategories')), {
          episodeId,
          categoryId: cId,
        });
      }
      for (const gId of genreIds) {
        batch.set(doc(collection(this.firestore, 'episodeGenres')), {
          episodeId,
          genreId: gId,
        });
      }
      for (const tId of tagIds) {
        batch.set(doc(collection(this.firestore, 'episodeTags')), {
          episodeId,
          tagId: tId,
        });
      }

      await batch.commit();
      return episodeId;
    } catch (e) {
      // Rollback poster upload if batch fails
      if (posterUrl) {
        await this.imageUploadService.deletePoster(episodeId).catch(() => {});
      }
      throw e;
    }
  }

  async updateEpisode(
    id: string,
    episode: Partial<Episode>,
    categoryIds?: string[],
    genreIds?: string[],
    tagIds?: string[],
    posterFile?: File,
    removePoster?: boolean
  ): Promise<void> {
    const { id: _id, ...data } = episode as Episode;

    // Handle poster outside batch — Storage can't participate in Firestore batches
    if (posterFile) {
      data.posterUrl = await this.imageUploadService.uploadPoster(id, posterFile);
    } else if (removePoster) {
      await this.imageUploadService.deletePoster(id);
      data.posterUrl = null;
    }

    // Query existing junctions that need replacement (reads before batch)
    const [existingCategories, existingGenres, existingTags] = await Promise.all([
      categoryIds
        ? getDocs(
            query(
              collection(this.firestore, 'episodeCategories'),
              where('episodeId', '==', id)
            )
          )
        : null,
      genreIds
        ? getDocs(
            query(collection(this.firestore, 'episodeGenres'), where('episodeId', '==', id))
          )
        : null,
      tagIds
        ? getDocs(
            query(collection(this.firestore, 'episodeTags'), where('episodeId', '==', id))
          )
        : null,
    ]);

    // Batch episode update + junction delete/recreate atomically
    const batch = writeBatch(this.firestore);

    batch.update(doc(this.firestore, 'episodes', id), data);

    if (categoryIds && existingCategories) {
      existingCategories.docs.forEach((d) => batch.delete(d.ref));
      for (const cId of categoryIds) {
        batch.set(doc(collection(this.firestore, 'episodeCategories')), {
          episodeId: id,
          categoryId: cId,
        });
      }
    }

    if (genreIds && existingGenres) {
      existingGenres.docs.forEach((d) => batch.delete(d.ref));
      for (const gId of genreIds) {
        batch.set(doc(collection(this.firestore, 'episodeGenres')), {
          episodeId: id,
          genreId: gId,
        });
      }
    }

    if (tagIds && existingTags) {
      existingTags.docs.forEach((d) => batch.delete(d.ref));
      for (const tId of tagIds) {
        batch.set(doc(collection(this.firestore, 'episodeTags')), {
          episodeId: id,
          tagId: tId,
        });
      }
    }

    await batch.commit();
  }

  async deleteEpisode(id: string): Promise<void> {
    // Query all junctions first (reads before batch)
    const [categories, genres, tags] = await Promise.all([
      getDocs(
        query(collection(this.firestore, 'episodeCategories'), where('episodeId', '==', id))
      ),
      getDocs(
        query(collection(this.firestore, 'episodeGenres'), where('episodeId', '==', id))
      ),
      getDocs(
        query(collection(this.firestore, 'episodeTags'), where('episodeId', '==', id))
      ),
    ]);

    // Batch all Firestore deletes atomically
    const batch = writeBatch(this.firestore);
    categories.docs.forEach((d) => batch.delete(d.ref));
    genres.docs.forEach((d) => batch.delete(d.ref));
    tags.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(this.firestore, 'episodes', id));
    await batch.commit();

    // Best-effort poster cleanup after Firestore state is consistent
    await this.imageUploadService.deletePoster(id).catch(() => {});
  }
}
