/**
 * Testes para authGuard e guestGuard.
 *
 * Casos de uso cobertos:
 * - authGuard permite acesso a usuários autenticados
 * - authGuard redireciona para /auth/login se não autenticado
 * - guestGuard permite acesso a usuários não autenticados
 * - guestGuard redireciona para /home se já autenticado
 */

import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { authGuard, guestGuard } from './auth.guard';
import { AuthService } from './auth.service';

function makeAuthServiceSpy(isAuthenticated: boolean) {
  return {
    isAuthenticated: vi.fn().mockReturnValue(isAuthenticated),
  };
}

function makeRouterSpy() {
  return {
    navigate: vi.fn().mockResolvedValue(true),
  };
}

describe('authGuard', () => {
  let authServiceSpy: ReturnType<typeof makeAuthServiceSpy>;
  let routerSpy: ReturnType<typeof makeRouterSpy>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow access when user is authenticated', () => {
    authServiceSpy = makeAuthServiceSpy(true);
    routerSpy = makeRouterSpy();

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result).toBe(true);
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to /auth/login when user is not authenticated', () => {
    authServiceSpy = makeAuthServiceSpy(false);
    routerSpy = makeRouterSpy();

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should call isAuthenticated on AuthService', () => {
    authServiceSpy = makeAuthServiceSpy(true);
    routerSpy = makeRouterSpy();

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(authServiceSpy.isAuthenticated).toHaveBeenCalled();
  });
});

describe('guestGuard', () => {
  let authServiceSpy: ReturnType<typeof makeAuthServiceSpy>;
  let routerSpy: ReturnType<typeof makeRouterSpy>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow access when user is not authenticated', () => {
    authServiceSpy = makeAuthServiceSpy(false);
    routerSpy = makeRouterSpy();

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result).toBe(true);
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to /home when user is already authenticated', () => {
    authServiceSpy = makeAuthServiceSpy(true);
    routerSpy = makeRouterSpy();

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should call isAuthenticated on AuthService', () => {
    authServiceSpy = makeAuthServiceSpy(false);
    routerSpy = makeRouterSpy();

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    TestBed.runInInjectionContext(() =>
      guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(authServiceSpy.isAuthenticated).toHaveBeenCalled();
  });
});
