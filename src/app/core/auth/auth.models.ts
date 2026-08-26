/**
 * Modelos de autenticação para o DuoMusic.
 */

/** Usuário autenticado. */
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
}

/** Tokens de autenticação retornados pelo backend. */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

/** Requisição de login. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Requisição de registro. */
export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

/** Estado de autenticação. */
export type AuthState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'authenticated'; user: User }
  | { status: 'unauthenticated' }
  | { status: 'error'; error: string };
