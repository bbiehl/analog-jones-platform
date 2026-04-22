import { inject, Injectable } from '@angular/core';
import { Episode } from '../../../../../libs/episode/episode.model';
import { GenreService } from '../../../../../libs/genre/genre.service';
import { EpisodeGenreService } from '../../../../../libs/shared/episode-genre.service';

@Injectable({
  providedIn: 'root',
})
export class EpisodeListService {
  private genreService = inject(GenreService);
  private episodeGenreService = inject(EpisodeGenreService);

  async getEpisodesByGenre(): Promise<Record<string, Episode[]>> {
    const genres = await this.genreService.getAllGenres();
    const result: Record<string, Episode[]> = {};

    for (const genre of genres) {
      if (!genre.id) continue;
      const episodes = await this.episodeGenreService.getEpisodesByGenreId(genre.id);
      if (episodes.length === 0) continue;
      episodes.sort((a, b) => b.episodeDate.toMillis() - a.episodeDate.toMillis());
      result[genre.name] = episodes;
    }

    return result;
  }
}
