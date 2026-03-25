import { Routes } from '@angular/router';

export const ACHIEVEMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./achievements.component').then(m => m.AchievementsComponent),
  },
];
