import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Episode } from '@aj/core';
import { ExploreSearchService } from './explore-search.service';
import { SearchAutoCompleteOption } from './explore.model';

interface ExploreSearchState {
  autoCompleteOptions: SearchAutoCompleteOption[];
  selectedSearchOption: SearchAutoCompleteOption | null;
  results: Episode[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ExploreSearchState = {
  autoCompleteOptions: [],
  selectedSearchOption: null,
  results: [],
  isLoading: false,
  error: null,
};

export const ExploreSearchStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const exploreSearchService = inject(ExploreSearchService);

    const searchEpisodes = async () => {
      const option = store.selectedSearchOption();
      if (!option) {
        return;
      }
      patchState(store, { isLoading: true, error: null });
      try {
        const results = await exploreSearchService.searchEpisodes(option);
        if (store.selectedSearchOption() !== option) {
          return;
        }
        patchState(store, { results, isLoading: false });
      } catch (e) {
        if (store.selectedSearchOption() !== option) {
          return;
        }
        patchState(store, {
          isLoading: false,
          error: e instanceof Error ? e.message : 'Failed to load results',
        });
      }
    };

    return {
      async loadAutoCompleteOptions() {
        patchState(store, { isLoading: true, error: null });
        try {
          const autoCompleteOptions = await exploreSearchService.getAutoCompleteOptions();
          patchState(store, { autoCompleteOptions, isLoading: false });
        } catch (e) {
          patchState(store, {
            isLoading: false,
            error: e instanceof Error ? e.message : 'Failed to load search options',
          });
        }
      },
      async selectSearchOption(option: SearchAutoCompleteOption) {
        patchState(store, { selectedSearchOption: option });
        await searchEpisodes();
      },
      clearSearch() {
        patchState(store, {
          selectedSearchOption: null,
          results: [],
          error: null,
          isLoading: false,
        });
      },
      searchEpisodes,
    };
  })
);
