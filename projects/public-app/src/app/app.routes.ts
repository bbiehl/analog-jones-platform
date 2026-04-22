import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((c) => c.Shell),
    children: [
      { path: '', loadComponent: () => import('./pages/home/home').then((c) => c.Home) },
      {
        path: 'contact',
        loadComponent: () => import('./pages/contact/contact').then((c) => c.Contact),
      },
      {
        path: 'episodes',
        loadComponent: () => import('./pages/episodes/episodes').then((c) => c.Episodes),
      },
      {
        path: 'episodes/:id',
        loadComponent: () =>
          import('./pages/episodes/episode-detail/episode-detail').then((c) => c.EpisodeDetail),
      },
      {
        path: 'explorer',
        loadComponent: () => import('./pages/explorer/explorer').then((c) => c.Explorer),
      },

      {
        path: 'privacy',
        loadComponent: () => import('./pages/privacy/privacy').then((c) => c.Privacy),
      },

      { path: 'terms', loadComponent: () => import('./pages/terms/terms').then((c) => c.Terms) },
      {
        path: '**',
        loadComponent: () => import('./pages/not-found/not-found').then((c) => c.NotFound),
      },
    ],
  },
];
