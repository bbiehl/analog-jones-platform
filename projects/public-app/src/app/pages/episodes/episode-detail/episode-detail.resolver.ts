import { inject, PLATFORM_ID, RESPONSE_INIT } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { ResolveFn } from '@angular/router';
import {
  Episode,
  EpisodeNotFoundError,
  EpisodeService,
  EpisodeStore,
  TransferCacheService,
} from '@aj/core';
import { ORIGIN } from '../../../seo/origin.token';
import { SeoService } from '../../../seo/seo.service';
import { buildEpisodeSeoInput } from './episode-detail.seo';

export const episodeDetailResolver: ResolveFn<Episode | null> = async (route) => {
  const isServer = isPlatformServer(inject(PLATFORM_ID));
  const responseInit = isServer ? inject(RESPONSE_INIT, { optional: true }) : null;
  const episodeStore = inject(EpisodeStore);
  const seo = inject(SeoService);
  const origin = inject(ORIGIN);

  const renderNotFound = (path: string): null => {
    // Serve the original URL with a real 404 so crawlers/caches see the
    // resource as missing rather than a redirect. The component renders the
    // not-found UI inline.
    if (responseInit) responseInit.status = 404;
    episodeStore.clearSelectedEpisode();
    seo.setHead({
      title: 'Not Found',
      description: 'The page you requested could not be found.',
      path,
      robots: 'noindex,follow',
    });
    return null;
  };

  const id = route.paramMap.get('id');
  const path = id ? `/episodes/${id}` : '/episodes';
  if (!id) return renderNotFound(path);

  const episodeService = inject(EpisodeService);
  const transferCache = inject(TransferCacheService);

  let episode: Episode;
  try {
    episode = await transferCache.cached(
      `episode.byId.${id}`,
      async () => {
        const ep = await episodeService.getEpisodeById(id);
        if (!ep.isVisible) throw new EpisodeNotFoundError(id);
        return ep;
      },
      { memoize: false },
    );
  } catch (err) {
    if (err instanceof EpisodeNotFoundError) {
      return renderNotFound(path);
    }
    throw err;
  }

  episodeStore.setSelectedEpisode(episode);
  seo.setHead(buildEpisodeSeoInput(episode, origin));

  return episode;
};
