import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

/**
 * Guard que protege rotas que requerem autenticação.
 * Redireciona para /auth/login se o usuário não estiver autenticado.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};

/**
 * Guard que impede usuários autenticados de acessar páginas de login/registro.
 * Redireciona para /home se o usuário já estiver autenticado.
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/home']);
  return false;
};
