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
import { firestore } from './app/firebase';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine({ trustProxyHeaders: true });

app.get('/sitemap-episodes.xml', async (_req, res, next) => {
  try {
    const snapshot = await getDocs(
      query(
        collection(firestore, 'episodes'),
        where('isVisible', '==', true),
        orderBy('episodeDate', 'desc'),
      ),
    );

    const urls = snapshot.docs
      .map((doc) => {
        const data = doc.data() as { episodeDate?: { toDate?: () => Date } };
        const lastmod = data.episodeDate?.toDate?.().toISOString();
        const loc = `${CANONICAL_ORIGIN}/episodes/${doc.id}`;
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
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
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
