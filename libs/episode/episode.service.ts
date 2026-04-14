import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
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
    const q = query(collection(this.firestore, 'episodes'), orderBy('createdAt', 'desc'));
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
      orderBy('createdAt', 'desc'),
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
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Episode);
  }

  async getVisibleEpisodes(searchTerm?: string): Promise<Episode[]> {
    const q = query(
      collection(this.firestore, 'episodes'),
      where('isVisible', '==', true),
      orderBy('createdAt', 'desc')
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
    const docRef = await addDoc(collection(this.firestore, 'episodes'), {
      createdAt: episode.createdAt,
      episodeDate: episode.episodeDate,
      episodeDuration: episode.episodeDuration,
      intelligence: episode.intelligence,
      isVisible: episode.isVisible,
      links: episode.links,
      posterUrl: null,
      title: episode.title,
      year: episode.year,
    });

    const episodeId = docRef.id;

    if (posterFile) {
      const posterUrl = await this.imageUploadService.uploadPoster(episodeId, posterFile);
      await updateDoc(doc(this.firestore, 'episodes', episodeId), { posterUrl });
    }

    await Promise.all([
      ...categoryIds.map((cId) => this.episodeCategoryService.createEpisodeCategory(episodeId, cId)),
      ...genreIds.map((gId) => this.episodeGenreService.createEpisodeGenre(episodeId, gId)),
      ...tagIds.map((tId) => this.episodeTagService.createEpisodeTag(episodeId, tId)),
    ]);

    return episodeId;
  }

  async updateEpisode(
    id: string,
    episode: Partial<Episode>,
    categoryIds?: string[],
    genreIds?: string[],
    tagIds?: string[],
    posterFile?: File
  ): Promise<void> {
    const { id: _id, ...data } = episode as Episode;

    if (posterFile) {
      const posterUrl = await this.imageUploadService.uploadPoster(id, posterFile);
      data.posterUrl = posterUrl;
    }

    await updateDoc(doc(this.firestore, 'episodes', id), data);

    const updates: Promise<void>[] = [];

    if (categoryIds) {
      updates.push(
        this.episodeCategoryService.deleteEpisodeCategoriesByEpisodeId(id).then(() =>
          Promise.all(
            categoryIds.map((cId) => this.episodeCategoryService.createEpisodeCategory(id, cId))
          ).then(() => undefined)
        )
      );
    }

    if (genreIds) {
      updates.push(
        this.episodeGenreService.deleteEpisodeGenresByEpisodeId(id).then(() =>
          Promise.all(
            genreIds.map((gId) => this.episodeGenreService.createEpisodeGenre(id, gId))
          ).then(() => undefined)
        )
      );
    }

    if (tagIds) {
      updates.push(
        this.episodeTagService.deleteEpisodeTagsByEpisodeId(id).then(() =>
          Promise.all(
            tagIds.map((tId) => this.episodeTagService.createEpisodeTag(id, tId))
          ).then(() => undefined)
        )
      );
    }

    await Promise.all(updates);
  }

  async deleteEpisode(id: string): Promise<void> {
    await Promise.all([
      this.episodeCategoryService.deleteEpisodeCategoriesByEpisodeId(id),
      this.episodeGenreService.deleteEpisodeGenresByEpisodeId(id),
      this.episodeTagService.deleteEpisodeTagsByEpisodeId(id),
      this.imageUploadService.deletePoster(id),
    ]);
    await deleteDoc(doc(this.firestore, 'episodes', id));
  }
}
