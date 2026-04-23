import { inject, Injectable } from '@angular/core';
import { EpisodeService } from '../../../../../libs/episode/episode.service';
import { Episode } from '../../../../../libs/episode/episode.model';
import { GenreService } from '../../../../../libs/genre/genre.service';
import { TagService } from '../../../../../libs/tag/tag.service';
import { EpisodeGenreService } from '../../../../../libs/shared/episode-genre.service';
import { EpisodeTagService } from '../../../../../libs/shared/episode-tag.service';
import { SearchAutoCompleteOption } from './explore.model';

@Injectable({ providedIn: 'root' })
export class ExploreSearchService {
  private episodeService = inject(EpisodeService);
  private genreService = inject(GenreService);
  private tagService = inject(TagService);
  private episodeGenreService = inject(EpisodeGenreService);
  private episodeTagService = inject(EpisodeTagService);

  async getAutoCompleteOptions(): Promise<SearchAutoCompleteOption[]> {
    const [episodes, genres, tags] = await Promise.all([
      this.episodeService.getVisibleEpisodes(),
      this.genreService.getAllGenres(),
      this.tagService.getAllTags(),
    ]);
    return [
      ...episodes.map((e) => ({ type: 'episode' as const, value: e.title })),
      ...genres.map((g) => ({ type: 'genre' as const, value: g.name })),
      ...tags.map((t) => ({ type: 'tag' as const, value: t.name })),
    ];
  }

  async searchEpisodes(option: SearchAutoCompleteOption): Promise<Episode[]> {
    let results: Episode[] = [];
    if (option.type === 'episode') {
      results = await this.episodeService.getVisibleEpisodes(option.value);
    } else if (option.type === 'genre') {
      const genres = await this.genreService.getAllGenres();
      const genre = genres.find((g) => g.name === option.value);
      if (genre?.id) {
        results = await this.episodeGenreService.getEpisodesByGenreId(genre.id);
      }
    } else {
      const tags = await this.tagService.getAllTags();
      const tag = tags.find((t) => t.name === option.value);
      if (tag) {
        results = await this.episodeTagService.getEpisodesByTagSlug(tag.slug);
      }
    }
    return Array.from(new Map(results.map((e) => [e.id, e])).values());
  }
}
