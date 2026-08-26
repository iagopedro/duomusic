import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/auth/auth.guard';
import { onboardingGuard, requireOnboardingGuard } from './core/guards/onboarding.guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: 'onboarding',
    canActivate: [authGuard, onboardingGuard],
    loadChildren: () =>
      import('./features/onboarding/onboarding.routes').then(m => m.ONBOARDING_ROUTES),
  },
  {
    path: 'home',
    canActivate: [authGuard, requireOnboardingGuard],
    loadChildren: () =>
      import('./features/home/home.routes').then(m => m.HOME_ROUTES),
  },
  {
    path: 'practice',
    canActivate: [authGuard, requireOnboardingGuard],
    loadChildren: () =>
      import('./features/practice/practice.routes').then(m => m.PRACTICE_ROUTES),
  },
  {
    path: 'achievements',
    canActivate: [authGuard, requireOnboardingGuard],
    loadChildren: () =>
      import('./features/achievements/achievements.routes').then(m => m.ACHIEVEMENTS_ROUTES),
  },
  {
    path: 'profile',
    canActivate: [authGuard, requireOnboardingGuard],
    loadChildren: () =>
      import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES),
  },
  {
    path: 'offline',
    loadChildren: () =>
      import('./features/offline/offline.routes').then(m => m.OFFLINE_ROUTES),
  },
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
