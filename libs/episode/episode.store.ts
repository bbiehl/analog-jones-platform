import { Episode, EpisodeWithRelations } from './episode.model';

interface EpisodeState {
  episodes: Episode[];
  selectedEpisode: EpisodeWithRelations | null;
  loading: boolean;
  error: string | null;
}

const initialState: EpisodeState = {
  episodes: [],
  selectedEpisode: null,
  loading: false,
  error: null,
};
