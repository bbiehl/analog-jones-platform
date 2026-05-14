import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Episode } from '@aj/core';
import { EpisodeListService } from './episode-list.service';

interface EpisodeListState {
  episodesByCategory: { [category: string]: Episode[] };
  episodesByGenre: { [genre: string]: Episode[] };
  isLoading: boolean;
  error: string | null;
}

const initialState: EpisodeListState = {
  episodesByCategory: {},
  episodesByGenre: {},
  isLoading: false,
  error: null,
};

export const EpisodeListStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const episodeListService = inject(EpisodeListService);

    return {
      async load() {
        patchState(store, { isLoading: true, error: null });
        try {
          const { episodesByCategory, episodesByGenre } = await episodeListService.getShelves();
          patchState(store, { episodesByCategory, episodesByGenre, isLoading: false });
        } catch (e) {
          patchState(store, {
            isLoading: false,
            error: e instanceof Error ? e.message : 'Failed to load episodes',
          });
        }
      },
    };
  })
);
