import { EpisodeWithRelations } from '@aj/core';
import { SITE_NAME } from './origin.token';
import { absoluteUrl, stripMarkdown } from './seo.text';

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function organization(origin: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${origin}/#organization`,
    name: SITE_NAME,
    url: origin,
    logo: absoluteUrl(origin, '/web-app-manifest-512x512.png'),
  };
}

export function website(origin: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${origin}/#website`,
    name: SITE_NAME,
    url: origin,
    publisher: { '@id': `${origin}/#organization` },
    inLanguage: 'en-US',
  };
}

export function podcastSeries(origin: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'PodcastSeries',
    '@id': `${origin}/#podcast`,
    name: SITE_NAME,
    url: origin,
    description:
      'A film podcast digging through cult, action, anime, and oddball cinema — one tape at a time.',
    inLanguage: 'en-US',
    publisher: { '@id': `${origin}/#organization` },
    image: absoluteUrl(origin, '/web-app-manifest-512x512.png'),
  };
}

export function podcastEpisode(
  episode: EpisodeWithRelations,
  origin: string,
): Record<string, unknown> {
  const path = `/episodes/${episode.id}`;
  const url = absoluteUrl(origin, path);
  const description = stripMarkdown(episode.intelligence, 300);
  const datePublished = episode.episodeDate?.toDate?.().toISOString();
  const image = episode.posterUrl ?? absoluteUrl(origin, '/og-default.png');

  const associatedMedia: Record<string, unknown>[] = [];
  if (episode.links?.spotify) {
    associatedMedia.push({
      '@type': 'AudioObject',
      contentUrl: episode.links.spotify,
      encodingFormat: 'audio/mpeg',
    });
  }
  if (episode.links?.youtube) {
    associatedMedia.push({
      '@type': 'VideoObject',
      name: episode.title,
      contentUrl: episode.links.youtube,
      embedUrl: episode.links.youtube,
      thumbnailUrl: image,
      uploadDate: datePublished,
      description: description || episode.title,
    });
  }

  const keywords = [
    ...(episode.categories?.map((c) => c.name) ?? []),
    ...(episode.genres?.map((g) => g.name) ?? []),
    ...(episode.tags?.map((t) => t.name) ?? []),
  ].filter(Boolean);

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    '@id': `${url}#episode`,
    url,
    name: episode.title,
    description: description || episode.title,
    image,
    datePublished,
    partOfSeries: { '@id': `${origin}/#podcast` },
    inLanguage: 'en-US',
  };

  if (associatedMedia.length) schema['associatedMedia'] = associatedMedia;
  if (keywords.length) schema['keywords'] = keywords.join(', ');

  return schema;
}

export function breadcrumbList(
  origin: string,
  items: BreadcrumbItem[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(origin, item.path),
    })),
  };
}
