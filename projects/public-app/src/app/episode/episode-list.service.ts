import { inject, Injectable } from '@angular/core';
import { Episode, EpisodeService, GenreService } from '@aj/core';
import { FIRESTORE, FIRESTORE_OPS } from '@aj/core';

@Injectable({
  providedIn: 'root',
})
export class EpisodeListService {
  private firestore = inject(FIRESTORE);
  private ops = inject(FIRESTORE_OPS);
  private genreService = inject(GenreService);
  private episodeService = inject(EpisodeService);

  async getEpisodesByGenre(): Promise<Record<string, Episode[]>> {
    const [genres, episodes, junctionSnap] = await Promise.all([
      this.genreService.getAllGenres(),
      this.episodeService.getVisibleEpisodes(),
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
}
