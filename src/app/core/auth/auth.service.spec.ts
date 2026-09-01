/**
 * Testes para AuthService.
 *
 * Casos de uso cobertos:
 * - Inicialização do estado de autenticação
 * - Login com credenciais válidas/inválidas
 * - Registro de novo usuário
 * - Logout
 * - Refresh de token
 * - Tratamento de erros HTTP
 */

import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { AuthService } from './auth.service';
import { StorageService } from '../storage/storage.service';
import { AuthTokens, User } from './auth.models';

/** Aguarda microtasks pendentes. */
function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function makeStorageSpy() {
  return {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    remove: vi.fn(),
  };
}

function makeRouterSpy() {
  return {
    navigate: vi.fn().mockResolvedValue(true),
  };
}

function makeMockTokens(): AuthTokens {
  return {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    tokenType: 'bearer',
    expiresIn: 1800,
  };
}

function makeMockUser(): User {
  return {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    createdAt: '2026-08-26T00:00:00Z',
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let storageSpy: ReturnType<typeof makeStorageSpy>;
  let routerSpy: ReturnType<typeof makeRouterSpy>;

  beforeEach(() => {
    vi.clearAllMocks();
    storageSpy = makeStorageSpy();
    routerSpy = makeRouterSpy();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        provideNoopAnimations(),
        { provide: StorageService, useValue: storageSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Inicialização', () => {
    it('should set unauthenticated state when no tokens stored', async () => {
      storageSpy.get.mockReturnValue(null);

      service = TestBed.inject(AuthService);
      await flushMicrotasks();

      expect(service.isAuthenticated()).toBe(false);
      expect(service.state().status).toBe('unauthenticated');
    });

    it('should load user when valid tokens exist', async () => {
      storageSpy.get.mockReturnValue(makeMockTokens());

      service = TestBed.inject(AuthService);
      await flushMicrotasks();

      const req = httpMock.expectOne('http://localhost:8000/api/auth/me');
      req.flush(makeMockUser());
      await flushMicrotasks();

      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()?.email).toBe('test@example.com');
    });

    it('should try refresh when /me returns 401', async () => {
      storageSpy.get.mockReturnValue(makeMockTokens());

      service = TestBed.inject(AuthService);
      await flushMicrotasks();

      // First call to /me fails with 401
      const meReq = httpMock.expectOne('http://localhost:8000/api/auth/me');
      meReq.flush({ detail: 'Token expired' }, { status: 401, statusText: 'Unauthorized' });
      await flushMicrotasks();

      // Should try refresh
      const refreshReq = httpMock.expectOne('http://localhost:8000/api/auth/refresh');
      refreshReq.flush(makeMockTokens());
      await flushMicrotasks();

      // Then load user again
      const meReq2 = httpMock.expectOne('http://localhost:8000/api/auth/me');
      meReq2.flush(makeMockUser());
      await flushMicrotasks();

      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('login()', () => {
    beforeEach(async () => {
      storageSpy.get.mockReturnValue(null);
      service = TestBed.inject(AuthService);
      await flushMicrotasks();
    });

    it('should set loading state while logging in', async () => {
      const loginPromise = service.login({ email: 'test@example.com', password: 'password123' });

      expect(service.isLoading()).toBe(true);

      const loginReq = httpMock.expectOne('http://localhost:8000/api/auth/login/json');
      loginReq.flush(makeMockTokens());
      await flushMicrotasks();

      const meReq = httpMock.expectOne('http://localhost:8000/api/auth/me');
      meReq.flush(makeMockUser());
      await flushMicrotasks();

      await loginPromise;
    });

    it('should return true and set authenticated state on success', async () => {
      const resultPromise = service.login({ email: 'test@example.com', password: 'password123' });
      await flushMicrotasks();

      const loginReq = httpMock.expectOne('http://localhost:8000/api/auth/login/json');
      loginReq.flush(makeMockTokens());
      await flushMicrotasks();

      const meReq = httpMock.expectOne('http://localhost:8000/api/auth/me');
      meReq.flush(makeMockUser());
      await flushMicrotasks();

      const result = await resultPromise;

      expect(result).toBe(true);
      expect(service.isAuthenticated()).toBe(true);
      expect(storageSpy.set).toHaveBeenCalledWith('duomusic_tokens', expect.any(Object));
    });

    it('should return false and set error state on 401', async () => {
      const resultPromise = service.login({ email: 'test@example.com', password: 'wrong' });
      await flushMicrotasks();

      const loginReq = httpMock.expectOne('http://localhost:8000/api/auth/login/json');
      loginReq.flush({ detail: 'Incorrect email or password' }, { status: 401, statusText: 'Unauthorized' });
      await flushMicrotasks();

      const result = await resultPromise;

      expect(result).toBe(false);
      expect(service.isAuthenticated()).toBe(false);
      expect(service.error()).toBe('Email ou senha incorretos');
    });

    it('should handle network errors', async () => {
      const resultPromise = service.login({ email: 'test@example.com', password: 'password123' });
      await flushMicrotasks();

      const loginReq = httpMock.expectOne('http://localhost:8000/api/auth/login/json');
      loginReq.error(new ProgressEvent('error'));
      await flushMicrotasks();

      const result = await resultPromise;

      expect(result).toBe(false);
      expect(service.state().status).toBe('error');
    });
  });

  describe('register()', () => {
    beforeEach(async () => {
      storageSpy.get.mockReturnValue(null);
      service = TestBed.inject(AuthService);
      await flushMicrotasks();
    });

    it('should return true on successful registration', async () => {
      const resultPromise = service.register({
        email: 'new@example.com',
        password: 'password123',
        displayName: 'New User',
      });
      await flushMicrotasks();

      const registerReq = httpMock.expectOne('http://localhost:8000/api/auth/register');
      registerReq.flush(makeMockTokens());
      await flushMicrotasks();

      const meReq = httpMock.expectOne('http://localhost:8000/api/auth/me');
      meReq.flush(makeMockUser());
      await flushMicrotasks();

      const result = await resultPromise;

      expect(result).toBe(true);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should handle duplicate email error (409)', async () => {
      const resultPromise = service.register({
        email: 'existing@example.com',
        password: 'password123',
      });
      await flushMicrotasks();

      const registerReq = httpMock.expectOne('http://localhost:8000/api/auth/register');
      registerReq.flush({ detail: 'Email already registered' }, { status: 409, statusText: 'Conflict' });
      await flushMicrotasks();

      const result = await resultPromise;

      expect(result).toBe(false);
      expect(service.error()).toBe('Este email já está cadastrado');
    });
  });

  describe('logout()', () => {
    beforeEach(async () => {
      storageSpy.get.mockReturnValue(makeMockTokens());
      service = TestBed.inject(AuthService);
      await flushMicrotasks();

      const meReq = httpMock.expectOne('http://localhost:8000/api/auth/me');
      meReq.flush(makeMockUser());
      await flushMicrotasks();
    });

    it('should clear state and navigate to login', async () => {
      service.logout();
      await flushMicrotasks();

      const logoutReq = httpMock.expectOne('http://localhost:8000/api/auth/logout');
      logoutReq.flush(null);
      await flushMicrotasks();

      expect(service.isAuthenticated()).toBe(false);
      expect(storageSpy.remove).toHaveBeenCalledWith('duomusic_tokens');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should clear state even if logout request fails', async () => {
      service.logout();
      await flushMicrotasks();

      const logoutReq = httpMock.expectOne('http://localhost:8000/api/auth/logout');
      logoutReq.error(new ProgressEvent('error'));
      await flushMicrotasks();

      expect(service.isAuthenticated()).toBe(false);
      expect(storageSpy.remove).toHaveBeenCalledWith('duomusic_tokens');
    });
  });

  describe('refreshToken()', () => {
    beforeEach(async () => {
      storageSpy.get.mockReturnValue(makeMockTokens());
      service = TestBed.inject(AuthService);
      await flushMicrotasks();

      const meReq = httpMock.expectOne('http://localhost:8000/api/auth/me');
      meReq.flush(makeMockUser());
      await flushMicrotasks();
    });

    it('should return true on successful refresh', async () => {
      const resultPromise = service.refreshToken();
      await flushMicrotasks();

      const refreshReq = httpMock.expectOne('http://localhost:8000/api/auth/refresh');
      refreshReq.flush({
        ...makeMockTokens(),
        accessToken: 'new-access-token',
      });
      await flushMicrotasks();

      const meReq = httpMock.expectOne('http://localhost:8000/api/auth/me');
      meReq.flush(makeMockUser());
      await flushMicrotasks();

      const result = await resultPromise;

      expect(result).toBe(true);
      expect(storageSpy.set).toHaveBeenCalledWith('duomusic_tokens', expect.objectContaining({
        accessToken: 'new-access-token',
      }));
    });

    it('should return false and clear state on refresh failure', async () => {
      const resultPromise = service.refreshToken();
      await flushMicrotasks();

      const refreshReq = httpMock.expectOne('http://localhost:8000/api/auth/refresh');
      refreshReq.flush({ detail: 'Invalid refresh token' }, { status: 401, statusText: 'Unauthorized' });
      await flushMicrotasks();

      const result = await resultPromise;

      expect(result).toBe(false);
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return false when no refresh token available', async () => {
      storageSpy.get.mockReturnValue(null);

      const result = await service.refreshToken();
      await flushMicrotasks();

      expect(result).toBe(false);
    });
  });

  describe('getAccessToken()', () => {
    beforeEach(async () => {
      storageSpy.get.mockReturnValue(null);
      service = TestBed.inject(AuthService);
      await flushMicrotasks();
    });

    it('should return access token when available', () => {
      storageSpy.get.mockReturnValue(makeMockTokens());
      expect(service.getAccessToken()).toBe('mock-access-token');
    });

    it('should return null when no tokens', () => {
      storageSpy.get.mockReturnValue(null);
      expect(service.getAccessToken()).toBeNull();
    });
  });

  describe('Computed signals', () => {
    beforeEach(async () => {
      storageSpy.get.mockReturnValue(null);
      service = TestBed.inject(AuthService);
      await flushMicrotasks();
    });

    it('isAuthenticated should be reactive', async () => {
      expect(service.isAuthenticated()).toBe(false);

      service.login({ email: 'test@example.com', password: 'password123' });
      await flushMicrotasks();

      const loginReq = httpMock.expectOne('http://localhost:8000/api/auth/login/json');
      loginReq.flush(makeMockTokens());
      await flushMicrotasks();

      const meReq = httpMock.expectOne('http://localhost:8000/api/auth/me');
      meReq.flush(makeMockUser());
      await flushMicrotasks();

      expect(service.isAuthenticated()).toBe(true);
    });

    it('currentUser should return user when authenticated', async () => {
      expect(service.currentUser()).toBeNull();

      storageSpy.get.mockReturnValue(makeMockTokens());

      service.login({ email: 'test@example.com', password: 'password123' });
      await flushMicrotasks();

      const loginReq = httpMock.expectOne('http://localhost:8000/api/auth/login/json');
      loginReq.flush(makeMockTokens());
      await flushMicrotasks();

      const meReq = httpMock.expectOne('http://localhost:8000/api/auth/me');
      meReq.flush(makeMockUser());
      await flushMicrotasks();

      expect(service.currentUser()?.email).toBe('test@example.com');
    });

    it('error should return message when in error state', async () => {
      expect(service.error()).toBeNull();

      service.login({ email: 'test@example.com', password: 'wrong' });
      await flushMicrotasks();

      const loginReq = httpMock.expectOne('http://localhost:8000/api/auth/login/json');
      loginReq.flush({ detail: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
      await flushMicrotasks();

      expect(service.error()).toBe('Email ou senha incorretos');
    });
  });
});
