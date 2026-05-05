import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Episode, EpisodeWithRelations } from '@aj/core';
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
    let loadRelatedEpisodesToken = 0;

    return {
      async loadRelatedEpisodes(episode: EpisodeWithRelations) {
        const token = ++loadRelatedEpisodesToken;
        patchState(store, { loading: true, error: null });
        try {
          const relatedEpisodes = await service.getRelatedEpisodes(episode);
          if (token !== loadRelatedEpisodesToken) return;
          patchState(store, { relatedEpisodes, loading: false });
        } catch (e) {
          if (token !== loadRelatedEpisodesToken) return;
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      clearRelatedEpisodes() {
        loadRelatedEpisodesToken++;
        patchState(store, { relatedEpisodes: [] });
      },
    };
  })
);
