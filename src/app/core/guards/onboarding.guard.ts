import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StorageService } from '../storage/storage.service';

export const onboardingGuard: CanActivateFn = () => {
  const storage = inject(StorageService);
  const router = inject(Router);
  const done = storage.get<boolean>('musicteoria_onboarding_done', false);
  if (done) {
    router.navigate(['/home']);
    return false;
  }
  return true;
};

export const requireOnboardingGuard: CanActivateFn = () => {
  const storage = inject(StorageService);
  const router = inject(Router);
  const done = storage.get<boolean>('musicteoria_onboarding_done', false);
  if (!done) {
    router.navigate(['/onboarding']);
    return false;
  }
  return true;
};
