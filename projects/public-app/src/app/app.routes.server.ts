import { RenderMode, ServerRoute } from '@angular/ssr';

const prerender = (path: string): ServerRoute => ({ path, renderMode: RenderMode.Prerender });
const server = (path: string): ServerRoute => ({ path, renderMode: RenderMode.Server });

export const serverRoutes: ServerRoute[] = [
  // Server-rendered (dynamic, SEO-important)
  server(''),
  server('episodes'),
  server('episodes/:id'),
  server('explorer/categories/:slug'),
  server('explorer/genres/:slug'),
  server('explorer/tags/:slug'),

  // Prerendered (static)
  prerender('contact'),
  prerender('explorer'),
  prerender('privacy'),
  prerender('terms'),

  // Client-rendered (fallback)
  { path: '**', renderMode: RenderMode.Client },
];
