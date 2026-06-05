import { inject, Injectable } from '@angular/core';
import { EpisodeService } from '@aj/core';
import { Episode } from '@aj/core';
import { EpisodeGenreService } from '@aj/core';
import { EpisodeTagService } from '@aj/core';
import { GenreService } from '@aj/core';
import { TagService } from '@aj/core';
import { TransferCacheService } from '@aj/core';
import { SearchAutoCompleteOption } from './explore.model';

@Injectable({ providedIn: 'root' })
export class ExploreSearchService {
  private episodeService = inject(EpisodeService);
  private genreService = inject(GenreService);
  private tagService = inject(TagService);
  private episodeGenreService = inject(EpisodeGenreService);
  private episodeTagService = inject(EpisodeTagService);
  private transferCache = inject(TransferCacheService);

  async getAutoCompleteOptions(): Promise<SearchAutoCompleteOption[]> {
    return this.transferCache.cached('explorer.autoComplete', async () => {
      const [episodes, genres, tags] = await Promise.all([
        this.episodeService.getVisibleEpisodes(),
        this.genreService.getAllGenres(),
        this.tagService.getAllTags(),
      ]);
      return [
        ...episodes.map((e) => ({ type: 'episode' as const, value: e.title, id: e.id })),
        ...genres.map((g) => ({ type: 'genre' as const, value: g.name, id: g.id })),
        ...tags.map((t) => ({ type: 'tag' as const, value: t.name, id: t.id })),
      ];
    });
  }

  async searchEpisodes(option: SearchAutoCompleteOption): Promise<Episode[]> {
    let results: Episode[] = [];
    if (option.type === 'episode') {
      if (option.id) {
        try {
          const episode = await this.episodeService.getEpisodeById(option.id);
          if (episode.isVisible) {
            results = [episode];
          }
        } catch {
          results = [];
        }
      }
    } else if (option.type === 'genre') {
      if (option.id) {
        results = await this.episodeGenreService.getEpisodesByGenreId(option.id);
      }
    } else {
      if (option.id) {
        results = await this.episodeTagService.getEpisodesByTagId(option.id);
      }
    }
    const deduped = Array.from(new Map(results.map((e) => [e.id, e])).values());
    return deduped.sort(
      (a, b) => b.episodeDate.toMillis() - a.episodeDate.toMillis()
    );
  }
}
