import { signalStore, withMethods, withState } from '@ngrx/signals';
import { Episode } from '../../../../../libs/episode/episode.model';
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

// loadAutoCompleteOptions() - Fetch episode titles, genre names, and tag names from the backend and populate the autoCompleteOptions state. Handle loading and error states appropriately.

// selectSearchOption(option: SearchAutoCompleteOption) - Update the selectedSearchOption state when a user selects an option from the autocomplete dropdown. Trigger the search for episodes based on the selected option.

// searchEpisodes() - Fetch episodes that match the selected autocomplete option from the backend. Update the results state with the fetched episodes, and handle loading and error states appropriately. Make sure to remove duplicates from the results if an episode matches multiple search criteria.
