import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', loadComponent: () => import('./pages/home/home').then((m) => m.Home) },
      {
        path: 'contact',
        loadComponent: () => import('./pages/contact/contact').then((m) => m.Contact),
      },
      {
        path: 'episodes',
        loadComponent: () => import('./pages/episodes/episodes').then((m) => m.Episodes),
      },
      {
        path: 'episodes/:id',
        loadComponent: () =>
          import('./pages/episodes/episode-detail/episode-detail').then((m) => m.EpisodeDetail),
      },
      {
        path: 'privacy',
        loadComponent: () => import('./pages/privacy/privacy').then((m) => m.Privacy),
      },
      { path: 'tags', loadComponent: () => import('./pages/tags/tags').then((m) => m.Tags) },
      {
        path: 'tags/:slug',
        loadComponent: () => import('./pages/tags/tag-detail/tag-detail').then((m) => m.TagDetail),
      },
      { path: 'terms', loadComponent: () => import('./pages/terms/terms').then((m) => m.Terms) },
    ],
  },
  { path: '**', redirectTo: '' },
];
