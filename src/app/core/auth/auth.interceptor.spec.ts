/**
 * Testes para authInterceptor.
 *
 * Casos de uso cobertos:
 * - Adicionar Bearer token em requisições autenticadas
 * - Não adicionar token em rotas públicas
 * - Retry automático após 401 com refresh de token
 * - Propagar erro se refresh falhar
 */

import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { StorageService } from '../storage/storage.service';
import { AuthTokens } from './auth.models';

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

function makeAuthServiceSpy() {
  return {
    refreshToken: vi.fn().mockResolvedValue(false),
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

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let storageSpy: ReturnType<typeof makeStorageSpy>;
  let authServiceSpy: ReturnType<typeof makeAuthServiceSpy>;

  beforeEach(() => {
    vi.clearAllMocks();
    storageSpy = makeStorageSpy();
    authServiceSpy = makeAuthServiceSpy();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: StorageService, useValue: storageSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Token attachment', () => {
    it('should add Authorization header when tokens exist', () => {
      storageSpy.get.mockReturnValue(makeMockTokens());

      http.get('/api/modules').subscribe();

      const req = httpMock.expectOne('/api/modules');
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-access-token');
      req.flush([]);
    });

    it('should not add Authorization header when no tokens', () => {
      storageSpy.get.mockReturnValue(null);

      http.get('/api/modules').subscribe();

      const req = httpMock.expectOne('/api/modules');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush([]);
    });
  });

  describe('Public URLs', () => {
    it('should not add token to /auth/login', () => {
      storageSpy.get.mockReturnValue(makeMockTokens());

      http.post('/api/auth/login', { email: 'test@example.com', password: 'pass' }).subscribe();

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should not add token to /auth/register', () => {
      storageSpy.get.mockReturnValue(makeMockTokens());

      http.post('/api/auth/register', { email: 'test@example.com', password: 'pass' }).subscribe();

      const req = httpMock.expectOne('/api/auth/register');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should not add token to /auth/refresh', () => {
      storageSpy.get.mockReturnValue(makeMockTokens());

      http.post('/api/auth/refresh', { refreshToken: 'token' }).subscribe();

      const req = httpMock.expectOne('/api/auth/refresh');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });
  });

  describe('401 handling with refresh', () => {
    it('should retry request after successful token refresh', async () => {
      const tokens = makeMockTokens();
      storageSpy.get.mockReturnValue(tokens);

      // Configure authService to succeed refresh and update storage
      authServiceSpy.refreshToken.mockImplementation(async () => {
        storageSpy.get.mockReturnValue({
          ...tokens,
          accessToken: 'new-access-token',
        });
        return true;
      });

      let response: unknown;
      http.get('/api/modules').subscribe(r => response = r);

      // First request fails with 401
      const req1 = httpMock.expectOne('/api/modules');
      expect(req1.request.headers.get('Authorization')).toBe('Bearer mock-access-token');
      req1.flush({ detail: 'Token expired' }, { status: 401, statusText: 'Unauthorized' });
      await flushMicrotasks();

      // After refresh, retried request should have new token
      const req2 = httpMock.expectOne('/api/modules');
      expect(req2.request.headers.get('Authorization')).toBe('Bearer new-access-token');
      req2.flush({ data: 'success' });
      await flushMicrotasks();

      expect(response).toEqual({ data: 'success' });
      expect(authServiceSpy.refreshToken).toHaveBeenCalled();
    });

    it('should propagate error when refresh fails', async () => {
      storageSpy.get.mockReturnValue(makeMockTokens());
      authServiceSpy.refreshToken.mockResolvedValue(false);

      let error: HttpErrorResponse | undefined;
      http.get('/api/modules').subscribe({
        error: e => error = e,
      });

      const req = httpMock.expectOne('/api/modules');
      req.flush({ detail: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
      await flushMicrotasks();

      expect(error?.status).toBe(401);
      expect(authServiceSpy.refreshToken).toHaveBeenCalled();
    });

    it('should not try refresh when no refresh token', async () => {
      storageSpy.get.mockReturnValue({
        accessToken: 'token',
        refreshToken: null,
      });

      let error: HttpErrorResponse | undefined;
      http.get('/api/modules').subscribe({
        error: e => error = e,
      });

      const req = httpMock.expectOne('/api/modules');
      req.flush({ detail: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
      await flushMicrotasks();

      expect(error?.status).toBe(401);
      expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
    });
  });

  describe('Non-401 errors', () => {
    it('should propagate 500 errors without refresh attempt', async () => {
      storageSpy.get.mockReturnValue(makeMockTokens());

      let error: HttpErrorResponse | undefined;
      http.get('/api/modules').subscribe({
        error: e => error = e,
      });

      const req = httpMock.expectOne('/api/modules');
      req.flush({ detail: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
      await flushMicrotasks();

      expect(error?.status).toBe(500);
      expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
    });

    it('should propagate 403 errors without refresh attempt', async () => {
      storageSpy.get.mockReturnValue(makeMockTokens());

      let error: HttpErrorResponse | undefined;
      http.get('/api/admin').subscribe({
        error: e => error = e,
      });

      const req = httpMock.expectOne('/api/admin');
      req.flush({ detail: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
      await flushMicrotasks();

      expect(error?.status).toBe(403);
      expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
    });
  });
});
