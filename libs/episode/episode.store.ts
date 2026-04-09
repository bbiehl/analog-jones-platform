import { Episode } from './episode.model';

interface EpisodeState {
  episodes: Episode[];
  loading: boolean;
  error: string | null;
}

const initalState: EpisodeState = {
  episodes: [],
  loading: false,
  error: null,
};
