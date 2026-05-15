import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import {
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

  let episode: EpisodeWithRelations | null = null;
  try {
    episode = await transferCache.cached(`episode.byId.${id}`, () =>
      episodeService.getEpisodeById(id),
    );
  } catch {
    episode = null;
  }

  if (!episode || !episode.isVisible) {
    return new RedirectCommand(router.parseUrl('/not-found'));
  }

  episodeStore.setSelectedEpisode(episode);
  seo.setHead(buildEpisodeSeoInput(episode, origin));

  return episode;
};
