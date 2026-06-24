import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Episode } from '@aj/core';
import { RelatedEpisodesService } from './related-episodes.service';

interface RelatedEpisodeState {
  relatedEpisodes: Episode[];
  loading: boolean;
  // True once a load attempt has completed (success or error). Stays false on
  // the server (related is browser-only) and until the first browser load
  // resolves, so the view can show a skeleton instead of prematurely asserting
  // "no related episodes exist".
  loaded: boolean;
  error: string | null;
}

const initialRelatedEpisodeState: RelatedEpisodeState = {
  relatedEpisodes: [],
  loading: false,
  loaded: false,
  error: null,
};

export const RelatedEpisodeStore = signalStore(
  { providedIn: 'root' },
  withState(initialRelatedEpisodeState),
  withMethods((store) => {
    const service = inject(RelatedEpisodesService);
    let loadRelatedEpisodesToken = 0;

    return {
      async loadRelatedEpisodes(episode: Episode) {
        const token = ++loadRelatedEpisodesToken;
        patchState(store, { loading: true, error: null });
        try {
          const relatedEpisodes = await service.getRelatedEpisodes(episode);
          if (token !== loadRelatedEpisodesToken) return;
          patchState(store, { relatedEpisodes, loading: false, loaded: true });
        } catch (e) {
          if (token !== loadRelatedEpisodesToken) return;
          patchState(store, { loading: false, loaded: true, error: (e as Error).message });
        }
      },

      clearRelatedEpisodes() {
        loadRelatedEpisodesToken++;
        patchState(store, { relatedEpisodes: [], loaded: false });
      },
    };
  }),
);
