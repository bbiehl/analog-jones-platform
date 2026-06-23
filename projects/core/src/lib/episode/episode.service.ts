import { inject, Injectable } from '@angular/core';
import { FIRESTORE, FIRESTORE_OPS } from '../shared/firebase.token';
import { CategoryService } from '../category/category.service';
import { GenreService } from '../genre/genre.service';
import { TagService } from '../tag/tag.service';
import { TransferCacheService } from '../shared/transfer-state.helpers';
import { Episode } from './episode.model';

export class EpisodeNotFoundError extends Error {
  constructor(id: string) {
    super(`Episode with id "${id}" not found`);
    this.name = 'EpisodeNotFoundError';
  }
}

interface FirestoreDocLike {
  id: string;
  data(): Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class EpisodeService {
  private firestore = inject(FIRESTORE);
  private ops = inject(FIRESTORE_OPS);
  private categoryService = inject(CategoryService);
  private genreService = inject(GenreService);
  private tagService = inject(TagService);
  private transferCache = inject(TransferCacheService);

  /**
   * Map a Firestore episode doc to an Episode, defaulting the embedded taxonomy
   * arrays so callers can trust the type even against docs that predate the
   * junction→embedded migration (which the data owner backfills separately).
   */
  private toEpisode(doc: FirestoreDocLike): Episode {
    const data = doc.data();
    return {
      ...(data as object),
      id: doc.id,
      categories: (data['categories'] as Episode['categories']) ?? [],
      genres: (data['genres'] as Episode['genres']) ?? [],
      tags: (data['tags'] as Episode['tags']) ?? [],
    } as Episode;
  }

  async getHomeEpisodes(
    max = 9,
  ): Promise<{ episodes: Episode[]; total: number; featured: Episode | null }> {
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
      const episodes = snapshot.docs.map((d) => this.toEpisode(d));
      const total = countSnap.data().count;
      const featured = episodes[0] ?? null;

      return { episodes, total, featured };
    });
  }

  async getAllEpisodes(): Promise<Episode[]> {
    const q = this.ops.query(
      this.ops.collection(this.firestore, 'episodes'),
      this.ops.orderBy('episodeDate', 'desc'),
    );
    const snapshot = await this.ops.getDocs(q);
    return snapshot.docs.map((d) => this.toEpisode(d));
  }

  async toggleEpisodeVisibility(id: string, isVisible: boolean): Promise<void> {
    await this.ops.updateDoc(this.ops.doc(this.firestore, 'episodes', id), { isVisible });
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
      return snapshot.docs.map((d) => ({ ...this.toEpisode(d), intelligence: null }));
    });
  }

  async getEpisodeById(id: string): Promise<Episode> {
    const snap = await this.ops.getDoc(this.ops.doc(this.firestore, 'episodes', id));
    if (!snap.exists()) {
      throw new EpisodeNotFoundError(id);
    }
    return this.toEpisode(snap);
  }

  /**
   * Resolve the selected taxonomy IDs to the full denormalized objects embedded
   * on the episode document, reading the (small) master collections once.
   */
  private async resolveTaxonomy(
    categoryIds: string[],
    genreIds: string[],
    tagIds: string[],
  ): Promise<Pick<Episode, 'categories' | 'genres' | 'tags'>> {
    const [allCategories, allGenres, allTags] = await Promise.all([
      this.categoryService.getAllCategories(),
      this.genreService.getAllGenres(),
      this.tagService.getAllTags(),
    ]);
    const catSet = new Set(categoryIds);
    const genreSet = new Set(genreIds);
    const tagSet = new Set(tagIds);
    return {
      categories: allCategories.filter((c) => c.id && catSet.has(c.id)),
      genres: allGenres.filter((g) => g.id && genreSet.has(g.id)),
      tags: allTags.filter((t) => t.id && tagSet.has(t.id)),
    };
  }

  async createEpisode(
    episode: Omit<Episode, 'id' | 'categories' | 'genres' | 'tags'>,
    categoryIds: string[],
    genreIds: string[],
    tagIds: string[],
  ): Promise<string> {
    const taxonomy = await this.resolveTaxonomy(categoryIds, genreIds, tagIds);
    const episodeRef = this.ops.doc(this.ops.collection(this.firestore, 'episodes'));

    const batch = this.ops.writeBatch(this.firestore);
    batch.set(episodeRef, {
      createdAt: episode.createdAt,
      episodeDate: episode.episodeDate,
      intelligence: episode.intelligence,
      isVisible: episode.isVisible,
      links: episode.links,
      title: episode.title,
      ...taxonomy,
    });
    await batch.commit();
    return episodeRef.id;
  }

  async updateEpisode(
    id: string,
    episode: Partial<Episode>,
    categoryIds?: string[],
    genreIds?: string[],
    tagIds?: string[],
  ): Promise<void> {
    const { id: _id, ...data } = episode as Episode;

    // Re-resolve embedded taxonomy only when the caller provided a selection.
    const taxonomy =
      categoryIds || genreIds || tagIds
        ? await this.resolveTaxonomy(categoryIds ?? [], genreIds ?? [], tagIds ?? [])
        : null;

    await this.ops.updateDoc(this.ops.doc(this.firestore, 'episodes', id), {
      ...data,
      ...(categoryIds ? { categories: taxonomy!.categories } : {}),
      ...(genreIds ? { genres: taxonomy!.genres } : {}),
      ...(tagIds ? { tags: taxonomy!.tags } : {}),
    });
  }

  async deleteEpisode(id: string): Promise<void> {
    // Taxonomy now lives on the episode doc, so deleting the doc is the whole job.
    const batch = this.ops.writeBatch(this.firestore);
    batch.delete(this.ops.doc(this.firestore, 'episodes', id));
    await batch.commit();
  }
}
