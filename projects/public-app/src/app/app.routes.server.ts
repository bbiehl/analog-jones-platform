import { RenderMode, ServerRoute } from '@angular/ssr';

const prerender = (path: string): ServerRoute => ({ path, renderMode: RenderMode.Prerender });
const server = (path: string): ServerRoute => ({ path, renderMode: RenderMode.Server });

export const serverRoutes: ServerRoute[] = [
  // Server-rendered (dynamic, SEO-important)
  server(''),
  server('episodes'),
  server('episodes/:id'),

  // Prerendered (static)
  prerender('contact'),
  prerender('explorer'),
  prerender('privacy'),
  prerender('terms'),

  // Not-found: server-rendered with a real 404 so crawlers see noindex + 404
  { path: 'not-found', renderMode: RenderMode.Server, status: 404 },
  { path: '**', renderMode: RenderMode.Server, status: 404 },
];
