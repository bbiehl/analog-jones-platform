import { inject, Injectable } from '@angular/core';
import {
  CategoryService,
  Episode,
  EpisodeService,
  GenreService,
  TransferCacheService,
} from '@aj/core';
import { FIRESTORE, FIRESTORE_OPS } from '@aj/core';

const FEATURED_CATEGORY_SLUGS = ['nerd-news', 'interviews'] as const;

@Injectable({
  providedIn: 'root',
})
export class EpisodeListService {
  private firestore = inject(FIRESTORE);
  private ops = inject(FIRESTORE_OPS);
  private genreService = inject(GenreService);
  private categoryService = inject(CategoryService);
  private episodeService = inject(EpisodeService);
  private transferCache = inject(TransferCacheService);

  async getShelves(): Promise<{
    episodesByCategory: Record<string, Episode[]>;
    episodesByGenre: Record<string, Episode[]>;
  }> {
    let episodesPromise: Promise<Episode[]> | undefined;
    const getEpisodes = () =>
      (episodesPromise ??= this.episodeService.getVisibleEpisodes());

    const [byGenreResult, byCategoryResult] = await Promise.allSettled([
      this.transferCache.cached('episodes.byGenre', () => this.buildEpisodesByGenre(getEpisodes)),
      this.transferCache.cached('episodes.byFeaturedCategory', () =>
        this.buildEpisodesByFeaturedCategory(getEpisodes)
      ),
    ]);

    if (byGenreResult.status === 'rejected') {
      throw byGenreResult.reason;
    }

    if (byCategoryResult.status === 'rejected') {
      // Featured-category shelves are ancillary; let the page render the
      // genre shelves even if categories/episodeCategories reads fail. The
      // failed branch is not cached, so a later navigation will retry.
      console.error('Failed to load featured-category shelves', byCategoryResult.reason);
    }

    return {
      episodesByGenre: byGenreResult.value,
      episodesByCategory:
        byCategoryResult.status === 'fulfilled' ? byCategoryResult.value : {},
    };
  }

  async getEpisodesByGenre(): Promise<Record<string, Episode[]>> {
    return this.transferCache.cached('episodes.byGenre', () =>
      this.buildEpisodesByGenre(() => this.episodeService.getVisibleEpisodes())
    );
  }

  async getEpisodesByFeaturedCategory(): Promise<Record<string, Episode[]>> {
    return this.transferCache.cached('episodes.byFeaturedCategory', () =>
      this.buildEpisodesByFeaturedCategory(() => this.episodeService.getVisibleEpisodes())
    );
  }

  private async buildEpisodesByGenre(
    getEpisodes: () => Promise<Episode[]>
  ): Promise<Record<string, Episode[]>> {
    const [episodes, genres, junctionSnap] = await Promise.all([
      getEpisodes(),
      this.genreService.getAllGenres(),
      this.ops.getDocs(this.ops.collection(this.firestore, 'episodeGenres')),
    ]);

    const episodesById = new Map(episodes.map((e) => [e.id!, e]));
    const episodeIdsByGenre = new Map<string, string[]>();
    for (const doc of junctionSnap.docs) {
      const data = doc.data();
      const genreId = data['genreId'] as string;
      const episodeId = data['episodeId'] as string;
      const list = episodeIdsByGenre.get(genreId) ?? [];
      list.push(episodeId);
      episodeIdsByGenre.set(genreId, list);
    }

    const result: Record<string, Episode[]> = {};
    for (const genre of genres) {
      if (!genre.id) continue;
      const ids = episodeIdsByGenre.get(genre.id) ?? [];
      const genreEpisodes = ids
        .map((id) => episodesById.get(id))
        .filter((e): e is Episode => !!e);
      if (genreEpisodes.length === 0) continue;
      genreEpisodes.sort((a, b) => b.episodeDate.toMillis() - a.episodeDate.toMillis());
      result[genre.name] = genreEpisodes;
    }

    return result;
  }

  private async buildEpisodesByFeaturedCategory(
    getEpisodes: () => Promise<Episode[]>
  ): Promise<Record<string, Episode[]>> {
    const [episodes, categories, junctionSnap] = await Promise.all([
      getEpisodes(),
      this.categoryService.getAllCategories(),
      this.ops.getDocs(this.ops.collection(this.firestore, 'episodeCategories')),
    ]);

    const episodesById = new Map(episodes.map((e) => [e.id!, e]));
    const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
    const episodeIdsByCategory = new Map<string, string[]>();
    for (const doc of junctionSnap.docs) {
      const data = doc.data();
      const categoryId = data['categoryId'] as string;
      const episodeId = data['episodeId'] as string;
      const list = episodeIdsByCategory.get(categoryId) ?? [];
      list.push(episodeId);
      episodeIdsByCategory.set(categoryId, list);
    }

    const result: Record<string, Episode[]> = {};
    for (const slug of FEATURED_CATEGORY_SLUGS) {
      const category = categoryBySlug.get(slug);
      if (!category?.id) continue;
      const ids = episodeIdsByCategory.get(category.id) ?? [];
      const categoryEpisodes = ids
        .map((id) => episodesById.get(id))
        .filter((e): e is Episode => !!e);
      if (categoryEpisodes.length === 0) continue;
      categoryEpisodes.sort((a, b) => b.episodeDate.toMillis() - a.episodeDate.toMillis());
      result[category.name] = categoryEpisodes;
    }

    return result;
  }
}
