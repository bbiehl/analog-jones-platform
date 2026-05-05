import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Genre, GenreWithRelations } from './genre.model';
import { GenreService } from './genre.service';

interface GenreState {
  genres: Genre[];
  selectedGenre: GenreWithRelations | null;
  loading: boolean;
  error: string | null;
}

const initialState: GenreState = {
  genres: [],
  selectedGenre: null,
  loading: false,
  error: null,
};

export const GenreStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const genreService = inject(GenreService);

    return {
      async loadGenres() {
        patchState(store, { loading: true, error: null });
        try {
          const genres = await genreService.getAllGenres();
          patchState(store, { genres, loading: false });
        } catch (e) {
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      async loadGenreById(id: string) {
        patchState(store, { loading: true, error: null });
        try {
          const genre = await genreService.getGenreById(id);
          patchState(store, {
            selectedGenre: { ...genre, episodes: [] },
            loading: false,
          });
        } catch (e) {
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      async createGenre(genre: Omit<Genre, 'id'>) {
        patchState(store, { loading: true, error: null });
        try {
          await genreService.createGenre(genre);
          const genres = await genreService.getAllGenres();
          patchState(store, { genres, loading: false });
        } catch (e) {
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      async updateGenre(id: string, genre: Partial<Genre>) {
        patchState(store, { loading: true, error: null });
        try {
          await genreService.updateGenre(id, genre);
          const genres = await genreService.getAllGenres();
          patchState(store, { genres, loading: false });
        } catch (e) {
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      async deleteGenre(id: string) {
        patchState(store, { loading: true, error: null });
        try {
          await genreService.deleteGenre(id);
          const genres = await genreService.getAllGenres();
          patchState(store, { genres, loading: false });
        } catch (e) {
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      clearSelectedGenre() {
        patchState(store, { selectedGenre: null });
      },
    };
  })
);
