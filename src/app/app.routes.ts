import { Routes } from '@angular/router';
import { onboardingGuard, requireOnboardingGuard } from './core/guards/onboarding.guard';

export const routes: Routes = [
  {
    path: 'onboarding',
    canActivate: [onboardingGuard],
    loadChildren: () =>
      import('./features/onboarding/onboarding.routes').then(m => m.ONBOARDING_ROUTES),
  },
  {
    path: 'home',
    canActivate: [requireOnboardingGuard],
    loadChildren: () =>
      import('./features/home/home.routes').then(m => m.HOME_ROUTES),
  },
  {
    path: 'practice',
    canActivate: [requireOnboardingGuard],
    loadChildren: () =>
      import('./features/practice/practice.routes').then(m => m.PRACTICE_ROUTES),
  },
  {
    path: 'achievements',
    canActivate: [requireOnboardingGuard],
    loadChildren: () =>
      import('./features/achievements/achievements.routes').then(m => m.ACHIEVEMENTS_ROUTES),
  },
  {
    path: 'profile',
    canActivate: [requireOnboardingGuard],
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
    redirectTo: 'onboarding',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
