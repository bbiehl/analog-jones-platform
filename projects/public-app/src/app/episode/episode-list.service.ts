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
    const genres = (await this.genreService.getAllGenres()).filter((g) => g.id);
    const episodesByGenre = await Promise.all(
      genres.map((g) => this.episodeGenreService.getEpisodesByGenreId(g.id!)),
    );
    const result: Record<string, Episode[]> = {};

    genres.forEach((genre, i) => {
      const episodes = episodesByGenre[i];
      if (episodes.length === 0) return;
      episodes.sort((a, b) => b.episodeDate.toMillis() - a.episodeDate.toMillis());
      result[genre.name] = episodes;
    });

    return result;
  }
}
