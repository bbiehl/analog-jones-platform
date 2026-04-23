import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Episode, EpisodeWithRelations } from '../../../../../../libs/episode/episode.model';
import { RelatedEpisodesService } from './related-episodes.service';

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

export const RelatedEpisodeStore = signalStore(
  { providedIn: 'root' },
  withState(initialRelatedEpisodeState),
  withMethods((store) => {
    const service = inject(RelatedEpisodesService);

    return {
      async loadRelatedEpisodes(episode: EpisodeWithRelations) {
        patchState(store, { loading: true, error: null });
        try {
          const relatedEpisodes = await service.getRelatedEpisodes(episode);
          patchState(store, { relatedEpisodes, loading: false });
        } catch (e) {
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      clearRelatedEpisodes() {
        patchState(store, { relatedEpisodes: [] });
      },
    };
  })
);
