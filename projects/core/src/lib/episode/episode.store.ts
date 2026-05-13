import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { EpisodeCategoryService } from '../junction/episode-category.service';
import { EpisodeGenreService } from '../junction/episode-genre.service';
import { EpisodeTagService } from '../junction/episode-tag.service';
import { Episode, EpisodeWithRelations } from './episode.model';
import { EpisodeService } from './episode.service';

interface EpisodeState {
  episodes: Episode[];
  currentEpisode: Episode | null;
  recentEpisodes: Episode[];
  selectedEpisode: EpisodeWithRelations | null;
  totalVisible: number;
  loading: boolean;
  error: string | null;
}

const initialState: EpisodeState = {
  episodes: [],
  currentEpisode: null,
  recentEpisodes: [],
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
    const episodeCategoryService = inject(EpisodeCategoryService);
    const episodeGenreService = inject(EpisodeGenreService);
    const episodeTagService = inject(EpisodeTagService);
    let loadEpisodeByIdToken = 0;

    return {
      async loadHomeData() {
        patchState(store, { loading: true, error: null });
        try {
          const { episodes, total } = await episodeService.getHomeEpisodes();
          const featured = episodes[0] ?? null;
          let selectedEpisode: EpisodeWithRelations | null = null;
          if (featured?.id) {
            const featuredId = featured.id;
            const [categories, genres, tags] = await Promise.all([
              episodeCategoryService.getEpisodeCategoriesByEpisodeId(featuredId),
              episodeGenreService.getEpisodeGenresByEpisodeId(featuredId),
              episodeTagService.getEpisodeTagsByEpisodeId(featuredId),
            ]);
            selectedEpisode = { ...featured, categories, genres, tags };
          }
          patchState(store, {
            episodes,
            totalVisible: total,
            selectedEpisode,
            loading: false,
          });
        } catch (e) {
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      async loadEpisodes() {
        patchState(store, { loading: true, error: null });
        try {
          const episodes = await episodeService.getAllEpisodes();
          patchState(store, { episodes, loading: false });
        } catch (e) {
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      async loadCurrentEpisode() {
        patchState(store, { loading: true, error: null });
        try {
          const currentEpisode = await episodeService.getCurrentEpisode();
          patchState(store, { currentEpisode, loading: false });
        } catch (e) {
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      async loadRecentEpisodes() {
        patchState(store, { loading: true, error: null });
        try {
          const recentEpisodes = await episodeService.getRecentEpisodes();
          patchState(store, { recentEpisodes, loading: false });
        } catch (e) {
          patchState(store, { loading: false, error: (e as Error).message });
        }
      },

      async loadVisibleEpisodes(searchTerm?: string) {
        patchState(store, { loading: true, error: null });
        try {
          const episodes = await episodeService.getVisibleEpisodes(searchTerm);
          patchState(store, { episodes, loading: false });
        } catch (e) {
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
        episode: Omit<Episode, 'id'>,
        categoryIds: string[],
        genreIds: string[],
        tagIds: string[],
        posterFile?: File
      ) {
        patchState(store, { loading: true, error: null });
        try {
          await episodeService.createEpisode(episode, categoryIds, genreIds, tagIds, posterFile);
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
        posterFile?: File,
        removePoster?: boolean
      ) {
        patchState(store, { loading: true, error: null });
        try {
          await episodeService.updateEpisode(
            id,
            episode,
            categoryIds,
            genreIds,
            tagIds,
            posterFile,
            removePoster
          );
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

      clearSelectedEpisode() {
        loadEpisodeByIdToken++;
        patchState(store, { selectedEpisode: null });
      },
    };
  })
);
