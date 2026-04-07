import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((c) => c.Shell),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then((c) => c.Dashboard),
      },
      {
        path: 'access-denied',
        loadComponent: () =>
          import('./pages/access-denied/access-denied').then((c) => c.AccessDenied),
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users/users').then((c) => c.Users),
      },
      {
        path: 'episodes',
        loadComponent: () => import('./pages/episodes/episodes').then((c) => c.Episodes),
      },
      {
        path: 'episodes/add',
        loadComponent: () =>
          import('./pages/episodes/episode-add/episode-add').then((c) => c.EpisodeAdd),
      },
      {
        path: 'episodes/edit/:id',
        loadComponent: () =>
          import('./pages/episodes/episode-edit/episode-edit').then((c) => c.EpisodeEdit),
      },
      {
        path: 'categories',
        loadComponent: () => import('./pages/categories/categories').then((c) => c.Categories),
      },
      {
        path: 'categories/add',
        loadComponent: () =>
          import('./pages/categories/category-add/category-add').then((c) => c.CategoryAdd),
      },
      {
        path: 'categories/edit/:id',
        loadComponent: () =>
          import('./pages/categories/category-edit/category-edit').then((c) => c.CategoryEdit),
      },
      {
        path: 'genres',
        loadComponent: () => import('./pages/genres/genres').then((c) => c.Genres),
      },
      {
        path: 'genres/add',
        loadComponent: () => import('./pages/genres/genre-add/genre-add').then((c) => c.GenreAdd),
      },
      {
        path: 'genres/edit/:id',
        loadComponent: () =>
          import('./pages/genres/genre-edit/genre-edit').then((c) => c.GenreEdit),
      },
      {
        path: 'tags',
        loadComponent: () => import('./pages/tags/tags').then((c) => c.Tags),
      },
      {
        path: 'tags/add',
        loadComponent: () => import('./pages/tags/tag-add/tag-add').then((c) => c.TagAdd),
      },
      {
        path: 'tags/edit/:id',
        loadComponent: () => import('./pages/tags/tag-edit/tag-edit').then((c) => c.TagEdit),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
