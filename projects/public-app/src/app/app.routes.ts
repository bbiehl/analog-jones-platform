import { Routes } from '@angular/router';
import type { RouteSeo } from './seo/seo-title.strategy';

const seo = (data: RouteSeo) => ({ seo: data });

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((c) => c.Shell),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home').then((c) => c.Home),
        data: seo({
          title: 'Analog Jones and the Temple of Film',
          titleSuffix: false,
          description:
            'A film podcast digging through cult, action, anime, and oddball cinema — one tape at a time. Recent episodes, hosts, and the full archive.',
          type: 'website',
          includePodcastSeries: true,
          breadcrumbs: [{ name: 'Home', path: '/' }],
        }),
      },
      {
        path: 'contact',
        loadComponent: () => import('./pages/contact/contact').then((c) => c.Contact),
        data: seo({
          title: 'Contact',
          description:
            'Get in touch with the hosts of Analog Jones and the Temple of Film — pitches, fan mail, and tape recommendations welcome.',
          breadcrumbs: [
            { name: 'Home', path: '/' },
            { name: 'Contact', path: '/contact' },
          ],
        }),
      },
      {
        path: 'episodes',
        loadComponent: () => import('./pages/episodes/episodes').then((c) => c.Episodes),
        data: seo({
          title: 'Episodes',
          description:
            'Browse every episode of Analog Jones and the Temple of Film — cult, action, anime, and oddball cinema, ordered by air date.',
          breadcrumbs: [
            { name: 'Home', path: '/' },
            { name: 'Episodes', path: '/episodes' },
          ],
        }),
      },
      {
        path: 'episodes/:id',
        loadComponent: () =>
          import('./pages/episodes/episode-detail/episode-detail').then((c) => c.EpisodeDetail),
        data: seo({
          title: 'Episode',
          description: 'Episode details on Analog Jones and the Temple of Film.',
          dynamic: true,
        }),
      },
      {
        path: 'explorer',
        loadComponent: () => import('./pages/explorer/explorer').then((c) => c.Explorer),
        data: seo({
          title: 'Explorer',
          description:
            'Search and filter the Analog Jones archive by genre, category, and tag — find your next tape.',
          breadcrumbs: [
            { name: 'Home', path: '/' },
            { name: 'Explorer', path: '/explorer' },
          ],
        }),
      },
      {
        path: 'privacy',
        loadComponent: () => import('./pages/privacy/privacy').then((c) => c.Privacy),
        data: seo({
          title: 'Privacy Policy',
          description: 'Privacy policy for Analog Jones and the Temple of Film.',
          breadcrumbs: [
            { name: 'Home', path: '/' },
            { name: 'Privacy', path: '/privacy' },
          ],
        }),
      },
      {
        path: 'terms',
        loadComponent: () => import('./pages/terms/terms').then((c) => c.Terms),
        data: seo({
          title: 'Terms of Service',
          description: 'Terms of service for Analog Jones and the Temple of Film.',
          breadcrumbs: [
            { name: 'Home', path: '/' },
            { name: 'Terms', path: '/terms' },
          ],
        }),
      },
      {
        path: '**',
        loadComponent: () => import('./pages/not-found/not-found').then((c) => c.NotFound),
        data: seo({
          title: 'Not Found',
          description: 'The page you requested could not be found.',
          robots: 'noindex,follow',
        }),
      },
    ],
  },
];
