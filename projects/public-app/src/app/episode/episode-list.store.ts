import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { Episode } from '@aj/core';
import { EpisodeListService } from './episode-list.service';

interface EpisodeListState {
  episodesByCategory: { [category: string]: Episode[] };
  episodesByGenre: { [genre: string]: Episode[] };
  genreLoaded: boolean;
  categoryLoaded: boolean;
  error: string | null;
}

const initialState: EpisodeListState = {
  episodesByCategory: {},
  episodesByGenre: {},
  genreLoaded: false,
  categoryLoaded: false,
  error: null,
};

export const EpisodeListStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    isLoading: computed(() => !store.genreLoaded()),
  })),
  withMethods((store) => {
    const episodeListService = inject(EpisodeListService);
    let generation = 0;

    return {
      async load() {
        const gen = ++generation;
        patchState(store, {
          genreLoaded: false,
          categoryLoaded: false,
          error: null,
        });

        let categoryPromise: Promise<Record<string, Episode[]>>;
        try {
          const shelves = await episodeListService.getShelves();
          if (gen !== generation) return;
          categoryPromise = shelves.episodesByCategory;
          patchState(store, {
            episodesByGenre: shelves.episodesByGenre,
            episodesByCategory: {},
            genreLoaded: true,
          });
        } catch (e) {
          if (gen !== generation) return;
          patchState(store, {
            genreLoaded: true,
            categoryLoaded: true,
            error: e instanceof Error ? e.message : 'Failed to load episodes',
          });
          return;
        }

        try {
          const categoryShelves = await categoryPromise;
          if (gen !== generation) return;
          patchState(store, {
            episodesByCategory: categoryShelves,
            categoryLoaded: true,
          });
        } catch {
          if (gen !== generation) return;
          patchState(store, { categoryLoaded: true });
        }
      },
    };
  })
);
