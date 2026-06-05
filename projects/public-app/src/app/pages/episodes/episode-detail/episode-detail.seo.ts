import { EpisodeWithRelations } from '@aj/core';
import { SeoInput } from '../../../seo/seo.service';
import {
  breadcrumbList,
  organization,
  podcastEpisode,
  website,
} from '../../../seo/seo.schemas';
import { stripMarkdown } from '../../../seo/seo.text';

export function buildEpisodeSeoInput(ep: EpisodeWithRelations, origin: string): SeoInput {
  const path = `/episodes/${ep.id}`;
  const description =
    stripMarkdown(ep.intelligence, 160) ||
    `Episode of ${ep.title} on Analog Jones and the Temple of Film.`;
  return {
    title: ep.title,
    description,
    path,
    image: ep.posterUrl ?? undefined,
    type: 'article',
    jsonLd: [
      organization(origin),
      website(origin),
      podcastEpisode(ep, origin),
      breadcrumbList(origin, [
        { name: 'Home', path: '/' },
        { name: 'Episodes', path: '/episodes' },
        { name: ep.title, path },
      ]),
    ],
  };
}
