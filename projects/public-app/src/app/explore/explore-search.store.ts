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
