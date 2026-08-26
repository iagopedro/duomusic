import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';

import { StorageService } from '../storage/storage.service';
import { AuthTokens } from './auth.models';
import { AuthService } from './auth.service';

const TOKENS_KEY = 'duomusic_tokens';

/** URLs que não precisam de autenticação. */
const PUBLIC_URLS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
];

/**
 * Interceptor que adiciona o Bearer token às requisições autenticadas.
 * Em caso de 401, tenta renovar o token e reenviar a requisição.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const storage = inject(StorageService);

  // Não adiciona token em rotas públicas
  if (PUBLIC_URLS.some(url => req.url.includes(url))) {
    return next(req);
  }

  // Adiciona o token se disponível
  const tokens = storage.get<AuthTokens | null>(TOKENS_KEY, null);
  let authReq = req;

  if (tokens?.accessToken) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${tokens.accessToken}` },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Se receber 401, tenta renovar o token
      if (error.status === 401 && tokens?.refreshToken) {
        return from(authService.refreshToken()).pipe(
          switchMap(success => {
            if (success) {
              // Token renovado — tenta novamente com o novo token
              const newTokens = storage.get<AuthTokens | null>(TOKENS_KEY, null);
              if (newTokens?.accessToken) {
                const retryReq = req.clone({
                  setHeaders: { Authorization: `Bearer ${newTokens.accessToken}` },
                });
                return next(retryReq);
              }
            }
            return throwError(() => error);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
