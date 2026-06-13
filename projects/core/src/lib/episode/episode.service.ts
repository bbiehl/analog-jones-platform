import { inject, Injectable } from '@angular/core';
import { FIRESTORE, FIRESTORE_OPS } from '../shared/firebase.token';
import { EpisodeCategoryService } from '../junction/episode-category.service';
import { EpisodeGenreService } from '../junction/episode-genre.service';
import { EpisodeTagService } from '../junction/episode-tag.service';
import { TransferCacheService } from '../shared/transfer-state.helpers';
import { Episode, EpisodeWithRelations } from './episode.model';

export class EpisodeNotFoundError extends Error {
  constructor(id: string) {
    super(`Episode with id "${id}" not found`);
    this.name = 'EpisodeNotFoundError';
  }
}

@Injectable({ providedIn: 'root' })
export class EpisodeService {
  private firestore = inject(FIRESTORE);
  private ops = inject(FIRESTORE_OPS);
  private episodeCategoryService = inject(EpisodeCategoryService);
  private episodeGenreService = inject(EpisodeGenreService);
  private episodeTagService = inject(EpisodeTagService);
  private transferCache = inject(TransferCacheService);

  async getHomeEpisodes(
    max = 9,
  ): Promise<{ episodes: Episode[]; total: number; featured: EpisodeWithRelations | null }> {
    return this.transferCache.cached(`episodes.home.${max}`, async () => {
      const collectionRef = this.ops.collection(this.firestore, 'episodes');
      const baseFilter = this.ops.where('isVisible', '==', true);
      const limitedQuery = this.ops.query(
        collectionRef,
        baseFilter,
        this.ops.orderBy('episodeDate', 'desc'),
        this.ops.limit(max),
      );
      const countQuery = this.ops.query(collectionRef, baseFilter);
      const [snapshot, countSnap] = await Promise.all([
        this.ops.getDocs(limitedQuery),
        this.ops.getCountFromServer(countQuery),
      ]);
      const episodes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Episode);
      const total = countSnap.data().count;

      const featuredBase = episodes[0] ?? null;
      let featured: EpisodeWithRelations | null = null;
      if (featuredBase?.id) {
        const [categories, genres, tags] = await Promise.all([
          this.episodeCategoryService.getEpisodeCategoriesByEpisodeId(featuredBase.id),
          this.episodeGenreService.getEpisodeGenresByEpisodeId(featuredBase.id),
          this.episodeTagService.getEpisodeTagsByEpisodeId(featuredBase.id),
        ]);
        featured = { ...featuredBase, categories, genres, tags };
      }

      return { episodes, total, featured };
    });
  }

  async getAllEpisodes(): Promise<Episode[]> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodes'),
      this.ops.orderBy('episodeDate', 'desc'),
    );
    const snapshot = await this.ops.getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Episode);
  }

  async toggleEpisodeVisibility(id: string, isVisible: boolean): Promise<void> {
    await this.ops.updateDoc(this.ops.doc(this.firestore, 'episodes', id), { isVisible });
  }

  async getCurrentEpisode(): Promise<Episode | null> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodes'),
      this.ops.where('isVisible', '==', true),
      this.ops.orderBy('episodeDate', 'desc'),
      this.ops.limit(1),
    );
    const snapshot = await this.ops.getDocs(q);
    if (snapshot.empty) {
      return null;
    }
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Episode;
  }

  async getRecentEpisodes(): Promise<Episode[]> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodes'),
      this.ops.where('isVisible', '==', true),
      this.ops.orderBy('episodeDate', 'desc'),
      this.ops.limit(5),
    );
    const snapshot = await this.ops.getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Episode);
  }

  async getVisibleEpisodes(searchTerm?: string): Promise<Episode[]> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodes'),
      this.ops.where('isVisible', '==', true),
      this.ops.orderBy('episodeDate', 'desc'),
    );
    const snapshot = await this.ops.getDocs(q);
    let episodes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Episode);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      episodes = episodes.filter((e) => e.title.toLowerCase().includes(term));
    }

    return episodes;
  }

  /**
   * Visible episodes for the archive list view (`/episodes`), transfer-cached so
   * the server-rendered route serializes the full list instead of a loading
   * skeleton and the browser reuses it without a second Firestore read.
   *
   * The list only renders id/title/episodeDate, so the unbounded `intelligence`
   * markdown is dropped before caching — otherwise the whole archive's
   * intelligence text would be inlined into the SSR transfer-state payload and
   * bloat the page. Callers needing the full document use `getVisibleEpisodes`.
   */
  async getVisibleEpisodeList(): Promise<Episode[]> {
    return this.transferCache.cached('episodes.visibleList', async () => {
      const q = this.ops.query(
        this.ops.collection(this.firestore, 'episodes'),
        this.ops.where('isVisible', '==', true),
        this.ops.orderBy('episodeDate', 'desc'),
      );
      const snapshot = await this.ops.getDocs(q);
      return snapshot.docs.map((d) => ({ ...d.data(), id: d.id, intelligence: null }) as Episode);
    });
  }

  async getEpisodeById(id: string): Promise<EpisodeWithRelations> {
    const snap = await this.ops.getDoc(this.ops.doc(this.firestore, 'episodes', id));
    if (!snap.exists()) {
      throw new EpisodeNotFoundError(id);
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
  ): Promise<string> {
    const episodeRef = this.ops.doc(this.ops.collection(this.firestore, 'episodes'));
    const episodeId = episodeRef.id;

    // Batch episode doc + all junction docs in a single atomic write
    const batch = this.ops.writeBatch(this.firestore);

    batch.set(episodeRef, {
      createdAt: episode.createdAt,
      episodeDate: episode.episodeDate,
      intelligence: episode.intelligence,
      isVisible: episode.isVisible,
      links: episode.links,
      title: episode.title,
    });

    for (const cId of categoryIds) {
      batch.set(this.ops.doc(this.ops.collection(this.firestore, 'episodeCategories')), {
        episodeId,
        categoryId: cId,
      });
    }
    for (const gId of genreIds) {
      batch.set(this.ops.doc(this.ops.collection(this.firestore, 'episodeGenres')), {
        episodeId,
        genreId: gId,
      });
    }
    for (const tId of tagIds) {
      batch.set(this.ops.doc(this.ops.collection(this.firestore, 'episodeTags')), {
        episodeId,
        tagId: tId,
      });
    }

    await batch.commit();
    return episodeId;
  }

  async updateEpisode(
    id: string,
    episode: Partial<Episode>,
    categoryIds?: string[],
    genreIds?: string[],
    tagIds?: string[],
  ): Promise<void> {
    const { id: _id, ...data } = episode as Episode;

    // Query existing junctions that need replacement (reads before batch)
    const [existingCategories, existingGenres, existingTags] = await Promise.all([
      categoryIds
        ? this.ops.getDocs(
            this.ops.query(
              this.ops.collection(this.firestore, 'episodeCategories'),
              this.ops.where('episodeId', '==', id),
            ),
          )
        : null,
      genreIds
        ? this.ops.getDocs(
            this.ops.query(
              this.ops.collection(this.firestore, 'episodeGenres'),
              this.ops.where('episodeId', '==', id),
            ),
          )
        : null,
      tagIds
        ? this.ops.getDocs(
            this.ops.query(
              this.ops.collection(this.firestore, 'episodeTags'),
              this.ops.where('episodeId', '==', id),
            ),
          )
        : null,
    ]);

    // Batch episode update + junction delete/recreate atomically
    const batch = this.ops.writeBatch(this.firestore);

    batch.update(this.ops.doc(this.firestore, 'episodes', id), data);

    if (categoryIds && existingCategories) {
      existingCategories.docs.forEach((d) => batch.delete(d.ref));
      for (const cId of categoryIds) {
        batch.set(this.ops.doc(this.ops.collection(this.firestore, 'episodeCategories')), {
          episodeId: id,
          categoryId: cId,
        });
      }
    }

    if (genreIds && existingGenres) {
      existingGenres.docs.forEach((d) => batch.delete(d.ref));
      for (const gId of genreIds) {
        batch.set(this.ops.doc(this.ops.collection(this.firestore, 'episodeGenres')), {
          episodeId: id,
          genreId: gId,
        });
      }
    }

    if (tagIds && existingTags) {
      existingTags.docs.forEach((d) => batch.delete(d.ref));
      for (const tId of tagIds) {
        batch.set(this.ops.doc(this.ops.collection(this.firestore, 'episodeTags')), {
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
      this.ops.getDocs(
        this.ops.query(
          this.ops.collection(this.firestore, 'episodeCategories'),
          this.ops.where('episodeId', '==', id),
        ),
      ),
      this.ops.getDocs(
        this.ops.query(
          this.ops.collection(this.firestore, 'episodeGenres'),
          this.ops.where('episodeId', '==', id),
        ),
      ),
      this.ops.getDocs(
        this.ops.query(
          this.ops.collection(this.firestore, 'episodeTags'),
          this.ops.where('episodeId', '==', id),
        ),
      ),
    ]);

    // Batch all Firestore deletes atomically
    const batch = this.ops.writeBatch(this.firestore);
    categories.docs.forEach((d) => batch.delete(d.ref));
    genres.docs.forEach((d) => batch.delete(d.ref));
    tags.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(this.ops.doc(this.firestore, 'episodes', id));
    await batch.commit();
  }
}
