import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Episode, EpisodeListItem } from './episode.model';
import { EpisodeService } from './episode.service';

interface EpisodeState {
  episodes: Episode[];
  listItems: EpisodeListItem[];
  selectedEpisode: Episode | null;
  totalVisible: number;
  loading: boolean;
  error: string | null;
}

const initialState: EpisodeState = {
  episodes: [],
  listItems: [],
  selectedEpisode: null,
  totalVisible: 0,
  loading: false,
  error: null,
};

export const EpisodeStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const episodeService = inject(EpisodeService);
    let loadEpisodeByIdToken = 0;
    // Shared token for every loader that writes `episodes`. The store is a root
    // singleton, so home/archive navigation can leave two list loads in flight
    // at once; whichever STARTED last wins, regardless of which resolves first.
    // Without this, a slow `loadHomeData` could land after `loadVisibleEpisodes`
    // and overwrite the full archive with the home page's truncated set.
    let episodesToken = 0;
    // Separate token for the archive's slim `listItems` slice — it writes a
    // different field than `episodes`, so it races independently.
    let listItemsToken = 0;

    return {
      async loadHomeData() {
        const token = ++episodesToken;
        patchState(store, { loading: true, error: null });
        try {
          const { episodes, total, featured } = await episodeService.getHomeEpisodes();
          if (token !== episodesToken) return;
          patchState(store, {
            episodes,
            totalVisible: total,
            selectedEpisode: featured,
            loading: false,
          });
        } catch (e) {
          if (token !== episodesToken) return;
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      async loadEpisodes() {
        const token = ++episodesToken;
        patchState(store, { loading: true, error: null });
        try {
          const episodes = await episodeService.getAllEpisodes();
          if (token !== episodesToken) return;
          patchState(store, { episodes, loading: false });
        } catch (e) {
          if (token !== episodesToken) return;
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      async loadEpisodeListItems() {
        const token = ++listItemsToken;
        patchState(store, { loading: true, error: null });
        try {
          const listItems = await episodeService.getEpisodeListItems();
          if (token !== listItemsToken) return;
          patchState(store, { listItems, loading: false });
        } catch (e) {
          if (token !== listItemsToken) return;
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      async loadEpisodeById(id: string) {
        const token = ++loadEpisodeByIdToken;
        patchState(store, { loading: true, error: null });
        try {
          const episode = await episodeService.getEpisodeById(id);
          if (token !== loadEpisodeByIdToken) return;
          patchState(store, { selectedEpisode: episode, loading: false });
        } catch (e) {
          if (token !== loadEpisodeByIdToken) return;
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      async toggleEpisodeVisibility(id: string, isVisible: boolean) {
        patchState(store, { loading: true, error: null });
        try {
          await episodeService.toggleEpisodeVisibility(id, isVisible);
          const episodes = await episodeService.getAllEpisodes();
          patchState(store, { episodes, loading: false });
        } catch (e) {
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      async createEpisode(
        episode: Omit<Episode, 'id' | 'categories' | 'genres' | 'tags'>,
        categoryIds: string[],
        genreIds: string[],
        tagIds: string[],
      ) {
        patchState(store, { loading: true, error: null });
        try {
          await episodeService.createEpisode(episode, categoryIds, genreIds, tagIds);
          const episodes = await episodeService.getAllEpisodes();
          patchState(store, { episodes, loading: false });
        } catch (e) {
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      async updateEpisode(
        id: string,
        episode: Partial<Episode>,
        categoryIds?: string[],
        genreIds?: string[],
        tagIds?: string[],
      ) {
        patchState(store, { loading: true, error: null });
        try {
          await episodeService.updateEpisode(id, episode, categoryIds, genreIds, tagIds);
          const episodes = await episodeService.getAllEpisodes();
          patchState(store, { episodes, loading: false });
        } catch (e) {
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      async deleteEpisode(id: string) {
        patchState(store, { loading: true, error: null });
        try {
          await episodeService.deleteEpisode(id);
          const episodes = await episodeService.getAllEpisodes();
          patchState(store, { episodes, loading: false });
        } catch (e) {
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      setSelectedEpisode(episode: Episode) {
        loadEpisodeByIdToken++;
        patchState(store, { selectedEpisode: episode, loading: false, error: null });
      },

      clearSelectedEpisode() {
        loadEpisodeByIdToken++;
        patchState(store, { selectedEpisode: null });
      },
    };
  }),
);
