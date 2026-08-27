import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { StorageService } from '../storage/storage.service';
import {
  AuthState,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  User,
} from './auth.models';

const TOKENS_KEY = 'duomusic_tokens';
const API_URL = 'http://localhost:8000/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);

  private readonly _state = signal<AuthState>({ status: 'idle' });
  readonly state = this._state.asReadonly();

  readonly isAuthenticated = computed(
    () => this._state().status === 'authenticated'
  );

  readonly isLoading = computed(() => this._state().status === 'loading');

  readonly currentUser = computed(() => {
    const state = this._state();
    return state.status === 'authenticated' ? state.user : null;
  });

  readonly error = computed(() => {
    const state = this._state();
    return state.status === 'error' ? state.error : null;
  });

  /** Promise resolvida quando o estado inicial de autenticação é conhecido. Usada no APP_INITIALIZER para evitar que os guards rodem com o status 'idle'. */
  readonly initialized: Promise<void>;

  constructor() {
    this.initialized = this.initializeAuth();
  }

  /**
   * Inicializa o estado de autenticação a partir de tokens salvos.
   */
  private async initializeAuth(): Promise<void> {
    const tokens = this.storage.get<AuthTokens | null>(TOKENS_KEY, null);

    if (!tokens) {
      this._state.set({ status: 'unauthenticated' });
      return;
    }

    try {
      await this.loadCurrentUser();
    } catch {
      // Token inválido ou expirado — tenta refresh
      const refreshed = await this.refreshToken();
      if (!refreshed) {
        this.clearAuthState();
      }
    }
  }

  /**
   * Carrega os dados do usuário atual do backend.
   */
  private async loadCurrentUser(): Promise<void> {
    const user = await firstValueFrom(
      this.http.get<User>(`${API_URL}/auth/me`)
    );
    this._state.set({ status: 'authenticated', user });
  }

  /**
   * Faz login com email e senha.
   */
  async login(credentials: LoginRequest): Promise<boolean> {
    this._state.set({ status: 'loading' });

    try {
      const tokens = await firstValueFrom(
        this.http.post<AuthTokens>(`${API_URL}/auth/login/json`, credentials)
      );

      this.storage.set(TOKENS_KEY, tokens);
      await this.loadCurrentUser();

      return true;
    } catch (error) {
      this.handleAuthError(error);
      return false;
    }
  }

  /**
   * Registra um novo usuário.
   */
  async register(data: RegisterRequest): Promise<boolean> {
    this._state.set({ status: 'loading' });

    try {
      const tokens = await firstValueFrom(
        this.http.post<AuthTokens>(`${API_URL}/auth/register`, data)
      );

      this.storage.set(TOKENS_KEY, tokens);
      await this.loadCurrentUser();

      return true;
    } catch (error) {
      this.handleAuthError(error);
      return false;
    }
  }

  /**
   * Faz logout do usuário.
   */
  async logout(): Promise<void> {
    const tokens = this.storage.get<AuthTokens | null>(TOKENS_KEY, null);

    if (tokens) {
      try {
        await firstValueFrom(
          this.http.post(`${API_URL}/auth/logout`, {
            refreshToken: tokens.refreshToken,
          })
        );
      } catch {
        // Ignora erros de logout — limpamos localmente de qualquer forma
      }
    }

    this.clearAuthState();
    this.router.navigate(['/auth/login']);
  }

  /**
   * Tenta renovar o access token usando o refresh token.
   */
  async refreshToken(): Promise<boolean> {
    const tokens = this.storage.get<AuthTokens | null>(TOKENS_KEY, null);

    if (!tokens?.refreshToken) {
      return false;
    }

    try {
      const newTokens = await firstValueFrom(
        this.http.post<AuthTokens>(`${API_URL}/auth/refresh`, {
          refreshToken: tokens.refreshToken,
        })
      );

      this.storage.set(TOKENS_KEY, newTokens);
      await this.loadCurrentUser();

      return true;
    } catch {
      this.clearAuthState();
      return false;
    }
  }

  /**
   * Obtém o access token atual.
   */
  getAccessToken(): string | null {
    const tokens = this.storage.get<AuthTokens | null>(TOKENS_KEY, null);
    return tokens?.accessToken ?? null;
  }

  /**
   * Limpa o estado de autenticação.
   */
  private clearAuthState(): void {
    this.storage.remove(TOKENS_KEY);
    this._state.set({ status: 'unauthenticated' });
  }

  /**
   * Trata erros de autenticação.
   */
  private handleAuthError(error: unknown): void {
    let message = 'Erro desconhecido';

    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        message = 'Email ou senha incorretos';
      } else if (error.status === 409) {
        message = 'Este email já está cadastrado';
      } else if (error.error?.detail) {
        message = error.error.detail;
      }
    }

    this._state.set({ status: 'error', error: message });
  }
}
