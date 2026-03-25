import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { StorageService } from '../storage/storage.service';
import { onboardingGuard, requireOnboardingGuard } from './onboarding.guard';

function runGuard(
  guard: typeof onboardingGuard,
  onboardingDone: boolean,
): boolean | unknown {
  const routerSpy = { navigate: vi.fn() };
  const storageSpy = { get: vi.fn().mockReturnValue(onboardingDone), set: vi.fn() };

  TestBed.configureTestingModule({
    providers: [
      { provide: Router, useValue: routerSpy },
      { provide: StorageService, useValue: storageSpy },
    ],
  });

  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;
  return TestBed.runInInjectionContext(() => guard(route, state));
}

describe('onboardingGuard', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should allow navigation when onboarding is NOT done', () => {
    const result = runGuard(onboardingGuard, false);
    expect(result).toBe(true);
  });

  it('should block navigation and redirect to /home when onboarding IS done', () => {
    const routerSpy = { navigate: vi.fn() };
    const storageSpy = { get: vi.fn().mockReturnValue(true), set: vi.fn() };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: StorageService, useValue: storageSpy },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      onboardingGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });
});

describe('requireOnboardingGuard', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should allow navigation when onboarding IS done', () => {
    const routerSpy = { navigate: vi.fn() };
    const storageSpy = { get: vi.fn().mockReturnValue(true), set: vi.fn() };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: StorageService, useValue: storageSpy },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      requireOnboardingGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result).toBe(true);
  });

  it('should block navigation and redirect to /onboarding when onboarding NOT done', () => {
    const routerSpy = { navigate: vi.fn() };
    const storageSpy = { get: vi.fn().mockReturnValue(false), set: vi.fn() };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: StorageService, useValue: storageSpy },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      requireOnboardingGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/onboarding']);
  });
});
