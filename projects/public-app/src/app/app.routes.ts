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
        children: [
          {
            path: 'categories',
            loadComponent: () =>
              import('./pages/explorer/categories/categories').then((c) => c.Categories),
          },
          {
            path: 'categories/:slug',
            loadComponent: () =>
              import('./pages/explorer/categories/category-detail/category-detail').then(
                (c) => c.CategoryDetail,
              ),
          },
          {
            path: 'genres',
            loadComponent: () => import('./pages/explorer/genres/genres').then((c) => c.Genres),
          },
          {
            path: 'genres/:slug',
            loadComponent: () =>
              import('./pages/explorer/genres/genre-detail/genre-detail').then(
                (c) => c.GenreDetail,
              ),
          },
          {
            path: 'tags',
            loadComponent: () => import('./pages/explorer/tags/tags').then((c) => c.Tags),
          },
          {
            path: 'tags/:slug',
            loadComponent: () =>
              import('./pages/explorer/tags/tag-detail/tag-detail').then((c) => c.TagDetail),
          },
        ],
      },

      {
        path: 'privacy',
        loadComponent: () => import('./pages/privacy/privacy').then((c) => c.Privacy),
      },

      { path: 'terms', loadComponent: () => import('./pages/terms/terms').then((c) => c.Terms) },
    ],
  },
  { path: '**', redirectTo: '' },
];
