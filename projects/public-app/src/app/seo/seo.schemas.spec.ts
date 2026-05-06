import { EpisodeWithRelations } from '@aj/core';
import { SITE_NAME } from './origin.token';
import {
  breadcrumbList,
  organization,
  podcastEpisode,
  podcastSeries,
  website,
} from './seo.schemas';

const ORIGIN = 'https://example.test';

describe('organization', () => {
  it('returns a schema.org Organization with id, name, url, and logo', () => {
    const result = organization(ORIGIN);
    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${ORIGIN}/#organization`,
      name: SITE_NAME,
      url: ORIGIN,
      logo: `${ORIGIN}/web-app-manifest-512x512.png`,
    });
  });
});

describe('website', () => {
  it('returns a WebSite schema referencing the organization id', () => {
    const result = website(ORIGIN);
    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${ORIGIN}/#website`,
      name: SITE_NAME,
      url: ORIGIN,
      publisher: { '@id': `${ORIGIN}/#organization` },
      inLanguage: 'en-US',
    });
  });
});

describe('podcastSeries', () => {
  it('returns a PodcastSeries schema with publisher reference and absolute image', () => {
    const result = podcastSeries(ORIGIN);
    expect(result['@type']).toBe('PodcastSeries');
    expect(result['@id']).toBe(`${ORIGIN}/#podcast`);
    expect(result['name']).toBe(SITE_NAME);
    expect(result['url']).toBe(ORIGIN);
    expect(result['inLanguage']).toBe('en-US');
    expect(result['publisher']).toEqual({ '@id': `${ORIGIN}/#organization` });
    expect(result['image']).toBe(`${ORIGIN}/web-app-manifest-512x512.png`);
    expect(typeof result['description']).toBe('string');
  });
});

describe('breadcrumbList', () => {
  it('maps items to 1-indexed ListItem entries with absolute URLs', () => {
    const result = breadcrumbList(ORIGIN, [
      { name: 'Home', path: '/' },
      { name: 'Episodes', path: 'episodes' },
    ]);
    expect(result['@type']).toBe('BreadcrumbList');
    expect(result['itemListElement']).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: 'Episodes', item: `${ORIGIN}/episodes` },
    ]);
  });

  it('passes absolute URLs in items through unchanged', () => {
    const result = breadcrumbList(ORIGIN, [{ name: 'External', path: 'https://other.test/x' }]);
    expect((result['itemListElement'] as Array<Record<string, unknown>>)[0]['item']).toBe(
      'https://other.test/x',
    );
  });
});

describe('podcastEpisode', () => {
  function makeEpisode(overrides: Partial<EpisodeWithRelations> = {}): EpisodeWithRelations {
    return {
      id: 'abc123',
      title: 'A Great Episode',
      intelligence: 'Some **bold** intelligence about the film.',
      links: {},
      posterUrl: null,
      categories: [],
      genres: [],
      tags: [],
      episodeDate: {
        toDate: () => new Date('2024-01-15T00:00:00Z'),
      },
      ...overrides,
    } as unknown as EpisodeWithRelations;
  }

  it('produces a PodcastEpisode schema with core fields', () => {
    const result = podcastEpisode(makeEpisode(), ORIGIN);
    expect(result['@type']).toBe('PodcastEpisode');
    expect(result['@id']).toBe(`${ORIGIN}/episodes/abc123#episode`);
    expect(result['url']).toBe(`${ORIGIN}/episodes/abc123`);
    expect(result['name']).toBe('A Great Episode');
    expect(result['partOfSeries']).toEqual({ '@id': `${ORIGIN}/#podcast` });
    expect(result['inLanguage']).toBe('en-US');
    expect(result['datePublished']).toBe('2024-01-15T00:00:00.000Z');
  });

  it('uses the markdown-stripped intelligence as description', () => {
    const result = podcastEpisode(makeEpisode(), ORIGIN);
    expect(result['description']).toBe('Some bold intelligence about the film.');
  });

  it('falls back to the title when intelligence is null', () => {
    const result = podcastEpisode(makeEpisode({ intelligence: null }), ORIGIN);
    expect(result['description']).toBe('A Great Episode');
  });

  it('falls back to the title when intelligence is empty', () => {
    const result = podcastEpisode(makeEpisode({ intelligence: '' }), ORIGIN);
    expect(result['description']).toBe('A Great Episode');
  });

  it('caps the description at 300 characters', () => {
    const long = 'word '.repeat(100).trim();
    const result = podcastEpisode(makeEpisode({ intelligence: long }), ORIGIN);
    expect((result['description'] as string).length).toBeLessThanOrEqual(301);
    expect((result['description'] as string).endsWith('…')).toBe(true);
  });

  it('uses posterUrl when present', () => {
    const result = podcastEpisode(
      makeEpisode({ posterUrl: 'https://cdn.example/poster.jpg' }),
      ORIGIN,
    );
    expect(result['image']).toBe('https://cdn.example/poster.jpg');
  });

  it('falls back to the default OG image when posterUrl is missing', () => {
    const result = podcastEpisode(makeEpisode(), ORIGIN);
    expect(result['image']).toBe(`${ORIGIN}/og-default.png`);
  });

  it('leaves datePublished undefined when episodeDate has no toDate', () => {
    const result = podcastEpisode(makeEpisode({ episodeDate: undefined as never }), ORIGIN);
    expect(result['datePublished']).toBeUndefined();
  });

  it('omits associatedMedia when no links are set', () => {
    const result = podcastEpisode(makeEpisode(), ORIGIN);
    expect(result['associatedMedia']).toBeUndefined();
  });

  it('includes a Spotify AudioObject when links.spotify is set', () => {
    const result = podcastEpisode(
      makeEpisode({ links: { spotify: 'https://spotify.test/ep' } }),
      ORIGIN,
    );
    expect(result['associatedMedia']).toEqual([
      {
        '@type': 'AudioObject',
        contentUrl: 'https://spotify.test/ep',
        encodingFormat: 'audio/mpeg',
      },
    ]);
  });

  it('includes a YouTube VideoObject when links.youtube is set', () => {
    const episode = makeEpisode({
      links: { youtube: 'https://youtube.test/watch' },
      posterUrl: 'https://cdn.example/poster.jpg',
    });
    const result = podcastEpisode(episode, ORIGIN);
    expect(result['associatedMedia']).toEqual([
      {
        '@type': 'VideoObject',
        name: 'A Great Episode',
        contentUrl: 'https://youtube.test/watch',
        embedUrl: 'https://youtube.test/watch',
        thumbnailUrl: 'https://cdn.example/poster.jpg',
        uploadDate: '2024-01-15T00:00:00.000Z',
        description: 'Some bold intelligence about the film.',
      },
    ]);
  });

  it('uses the title as VideoObject description when intelligence is empty', () => {
    const episode = makeEpisode({
      intelligence: null,
      links: { youtube: 'https://youtube.test/watch' },
    });
    const media = podcastEpisode(episode, ORIGIN)['associatedMedia'] as Array<
      Record<string, unknown>
    >;
    expect(media[0]['description']).toBe('A Great Episode');
  });

  it('includes both Spotify and YouTube entries when both links are set', () => {
    const episode = makeEpisode({
      links: { spotify: 'https://spotify.test/ep', youtube: 'https://youtube.test/watch' },
    });
    const media = podcastEpisode(episode, ORIGIN)['associatedMedia'] as Array<
      Record<string, unknown>
    >;
    expect(media).toHaveLength(2);
    expect(media[0]['@type']).toBe('AudioObject');
    expect(media[1]['@type']).toBe('VideoObject');
  });

  it('joins category, genre, and tag names into a keywords string', () => {
    const episode = makeEpisode({
      categories: [{ name: 'Cult' } as never, { name: 'Action' } as never],
      genres: [{ name: 'Horror' } as never],
      tags: [{ name: '80s' } as never, { name: 'VHS' } as never],
    });
    expect(podcastEpisode(episode, ORIGIN)['keywords']).toBe('Cult, Action, Horror, 80s, VHS');
  });

  it('omits keywords when no categories, genres, or tags are present', () => {
    const result = podcastEpisode(makeEpisode(), ORIGIN);
    expect(result['keywords']).toBeUndefined();
  });
});
