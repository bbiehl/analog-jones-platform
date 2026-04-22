import { Episode } from '../../../../../libs/episode/episode.model';

interface ExploreSearchState {
  searchTerm: string;
  results: Episode[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ExploreSearchState = {
  searchTerm: '',
  results: [],
  isLoading: false,
  error: null,
};
