import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import {
  EpisodeNotFoundError,
  EpisodeService,
  EpisodeStore,
  EpisodeWithRelations,
  TransferCacheService,
} from '@aj/core';
import { ORIGIN } from '../../../seo/origin.token';
import { SeoService } from '../../../seo/seo.service';
import { buildEpisodeSeoInput } from './episode-detail.seo';

export const episodeDetailResolver: ResolveFn<EpisodeWithRelations | RedirectCommand> = async (
  route,
) => {
  const router = inject(Router);
  const id = route.paramMap.get('id');
  if (!id) return new RedirectCommand(router.parseUrl('/not-found'));

  const episodeService = inject(EpisodeService);
  const episodeStore = inject(EpisodeStore);
  const seo = inject(SeoService);
  const origin = inject(ORIGIN);
  const transferCache = inject(TransferCacheService);

  let episode: EpisodeWithRelations;
  try {
    episode = await transferCache.cached(`episode.byId.${id}`, async () => {
      const ep = await episodeService.getEpisodeById(id);
      if (!ep.isVisible) throw new EpisodeNotFoundError(id);
      return ep;
    });
  } catch (err) {
    if (err instanceof EpisodeNotFoundError) {
      return new RedirectCommand(router.parseUrl('/not-found'));
    }
    throw err;
  }

  episodeStore.setSelectedEpisode(episode);
  seo.setHead(buildEpisodeSeoInput(episode, origin));

  return episode;
};
