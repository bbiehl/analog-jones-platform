import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', loadComponent: () => import('./pages/home/home').then((m) => m.Home) },
      {
        path: 'categories',
        loadComponent: () => import('./pages/categories/categories').then((m) => m.Categories),
      },
      {
        path: 'categories/:slug',
        loadComponent: () =>
          import('./pages/categories/category-detail/category-detail').then(
            (m) => m.CategoryDetail,
          ),
      },
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
        path: 'genres',
        loadComponent: () => import('./pages/genres/genres').then((m) => m.Genres),
      },
      {
        path: 'genres/:slug',
        loadComponent: () =>
          import('./pages/genres/genre-detail/genre-detail').then((m) => m.GenreDetail),
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
