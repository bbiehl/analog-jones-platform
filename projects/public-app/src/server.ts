import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { join } from 'node:path';
import { CANONICAL_ORIGIN } from './app/seo/origin.token';
import { stripMarkdown } from './app/seo/seo.text';
import { firestore } from './app/firebase';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine({ trustProxyHeaders: true });

const SITE_DESCRIPTION =
  'A film podcast digging through cult, action, anime, and oddball cinema — one tape at a time.';

interface EpisodeDoc {
  title?: string;
  intelligence?: string | null;
  posterUrl?: string | null;
  links?: { spotify?: string; youtube?: string };
  episodeDate?: { toDate?: () => Date };
}

/** Visible episodes, newest first — shared by the sitemap, llms.txt, and JSON API routes. */
async function getVisibleEpisodes() {
  const snapshot = await getDocs(
    query(
      collection(firestore, 'episodes'),
      where('isVisible', '==', true),
      orderBy('episodeDate', 'desc'),
    ),
  );
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as EpisodeDoc) }));
}

app.get('/sitemap-episodes.xml', async (_req, res, next) => {
  try {
    const episodes = await getVisibleEpisodes();

    const urls = episodes
      .map((episode) => {
        const lastmod = episode.episodeDate?.toDate?.().toISOString();
        const loc = `${CANONICAL_ORIGIN}/episodes/${episode.id}`;
        return lastmod
          ? `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`
          : `  <url><loc>${loc}</loc></url>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.send(xml);
  } catch (err) {
    next(err);
  }
});

/**
 * Plain-text site map for LLM crawlers (the llms.txt convention). Lists the main
 * pages plus every visible episode with a stripped one-line summary.
 */
app.get('/llms.txt', async (_req, res, next) => {
  try {
    const episodes = await getVisibleEpisodes();

    const episodeLines = episodes
      .map((episode) => {
        const url = `${CANONICAL_ORIGIN}/episodes/${episode.id}`;
        const title = episode.title ?? 'Untitled episode';
        const summary = stripMarkdown(episode.intelligence);
        return summary ? `- [${title}](${url}): ${summary}` : `- [${title}](${url})`;
      })
      .join('\n');

    const body = `# Analog Jones and the Temple of Film

> ${SITE_DESCRIPTION}

## Pages
- [Home](${CANONICAL_ORIGIN}/)
- [Episodes](${CANONICAL_ORIGIN}/episodes)
- [Explorer](${CANONICAL_ORIGIN}/explorer)
- [Contact](${CANONICAL_ORIGIN}/contact)

## Episodes
${episodeLines}
`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.send(body);
  } catch (err) {
    next(err);
  }
});

/**
 * Read-only JSON feed of visible episodes for programmatic / AI-agent consumption.
 * Core fields and links only — no category/genre/tag relations.
 */
app.get('/api/episodes', async (_req, res, next) => {
  try {
    const episodes = await getVisibleEpisodes();

    const payload = {
      site: CANONICAL_ORIGIN,
      count: episodes.length,
      episodes: episodes.map((episode) => ({
        id: episode.id,
        title: episode.title ?? null,
        url: `${CANONICAL_ORIGIN}/episodes/${episode.id}`,
        episodeDate: episode.episodeDate?.toDate?.().toISOString() ?? null,
        summary: stripMarkdown(episode.intelligence),
        posterUrl: episode.posterUrl ?? null,
        links: {
          spotify: episode.links?.spotify ?? null,
          youtube: episode.links?.youtube ?? null,
        },
      })),
    };

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 *
 * Episode and listing pages are CDN-cacheable, but only when they render
 * successfully. A resolver-issued 404 (missing or hidden episode) must not be
 * cached as if it were a real page — otherwise the edge would keep serving a
 * stale 404 after the episode is published. The cache header is therefore
 * applied after render and gated on a 200 status.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => {
      if (!response) return next();
      if (
        req.method === 'GET' &&
        response.status === 200 &&
        /^\/(episodes(\/[^/]+)?)?\/?$/.test(req.path)
      ) {
        res.setHeader(
          'Cache-Control',
          'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
        );
      }
      return writeResponseToNodeResponse(response, res);
    })
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
