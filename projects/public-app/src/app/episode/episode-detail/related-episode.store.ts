import { Episode } from "../../../../../../libs/episode/episode.model";

interface RelatedEpisodeState {
  relatedEpisodes: Episode[];
  loading: boolean;
  error: string | null;
}

const initialRelatedEpisodeState: RelatedEpisodeState = {
  relatedEpisodes: [],
  loading: false,
  error: null,
};