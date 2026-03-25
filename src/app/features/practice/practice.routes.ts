import { Routes } from '@angular/router';

export const PRACTICE_ROUTES: Routes = [
  {
    path: ':moduleId',
    loadComponent: () =>
      import('./practice.component').then(m => m.PracticeComponent),
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
];
