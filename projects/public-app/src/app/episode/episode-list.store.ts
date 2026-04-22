import { Episode } from "../../../../../libs/episode/episode.model";

interface EpisodeListState {
  episodesByGenre: { [genre: string]: Episode[] };
  isLoading: boolean;
  error: string | null;
}

const initialState: EpisodeListState = {
  episodesByGenre: {},
  isLoading: false,
  error: null,
};