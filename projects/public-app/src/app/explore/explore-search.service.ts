import { inject, Injectable } from '@angular/core';
import { CategoryService } from '@aj/core';
import { EpisodeService } from '@aj/core';
import { Episode } from '@aj/core';
import { GenreService } from '@aj/core';
import { TagService } from '@aj/core';
import { TransferCacheService } from '@aj/core';
import { SearchAutoCompleteOption } from './explore.model';

// Only these categories are exposed as explorer search options.
const EXPLORER_CATEGORY_NAMES = ['Nerd News', 'Interviews'];

@Injectable({ providedIn: 'root' })
export class ExploreSearchService {
  private episodeService = inject(EpisodeService);
  private categoryService = inject(CategoryService);
  private genreService = inject(GenreService);
  private tagService = inject(TagService);
  private transferCache = inject(TransferCacheService);

  async getAutoCompleteOptions(): Promise<SearchAutoCompleteOption[]> {
    return this.transferCache.cached('explorer.autoComplete', async () => {
      const [categories, genres, tags] = await Promise.all([
        this.categoryService.getAllCategories(),
        this.genreService.getAllGenres(),
        this.tagService.getAllTags(),
      ]);
      const allowedCategories = categories.filter((c) =>
        EXPLORER_CATEGORY_NAMES.some((n) => n.toLowerCase() === c.name.toLowerCase()),
      );
      return [
        ...allowedCategories.map((c) => ({ type: 'category' as const, value: c.name, id: c.id })),
        ...genres.map((g) => ({ type: 'genre' as const, value: g.name, id: g.id })),
        ...tags.map((t) => ({ type: 'tag' as const, value: t.name, id: t.id })),
      ];
    });
  }

  async searchEpisodes(option: SearchAutoCompleteOption): Promise<Episode[]> {
    let results: Episode[] = [];
    if (option.type === 'category') {
      if (option.id) {
        results = await this.episodesWithTaxonomy('categories', option.id);
      }
    } else if (option.type === 'genre') {
      if (option.id) {
        results = await this.episodesWithTaxonomy('genres', option.id);
      }
    } else if (option.type === 'tag') {
      if (option.id) {
        results = await this.episodesWithTaxonomy('tags', option.id);
      }
    }
    const deduped = Array.from(new Map(results.map((e) => [e.id, e])).values());
    return deduped.sort((a, b) => b.episodeDate.toMillis() - a.episodeDate.toMillis());
  }

  /**
   * Visible episodes whose embedded `categories`/`genres`/`tags` array contains `id`.
   * Uses the transfer-cached `getVisibleEpisodeList` (which drops the unbounded
   * `intelligence` markdown) so a public search click costs one shared read of
   * the lightweight list, not a full-document fetch of the whole archive.
   */
  private async episodesWithTaxonomy(
    field: 'categories' | 'genres' | 'tags',
    id: string,
  ): Promise<Episode[]> {
    const episodes = await this.episodeService.getVisibleEpisodeList();
    return episodes.filter((e) => e[field].some((item) => item.id === id));
  }
}
