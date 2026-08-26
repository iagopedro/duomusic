/**
 * Testes para LoginComponent.
 *
 * Casos de uso cobertos:
 * - Renderização inicial do formulário
 * - Validação de email obrigatório e formato
 * - Validação de senha obrigatória e tamanho mínimo
 * - Toggle de visibilidade da senha
 * - Exibição de erro do servidor
 * - Navegação para /home após login bem-sucedido
 * - Formulário inválido não faz submit
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/auth/auth.service';
import { I18nService } from '../../../core/i18n/i18n.service';

/** Aguarda todas as promessas pendentes. */
function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function makeAuthServiceSpy() {
  return {
    isLoading: signal(false),
    error: signal<string | null>(null),
    login: vi.fn().mockResolvedValue(true),
  };
}

function makeI18nSpy() {
  return {
    t: vi.fn((key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'auth.login.title': 'Entrar',
        'auth.login.subtitle': 'Bem-vindo de volta!',
        'auth.email': 'Email',
        'auth.password': 'Senha',
        'auth.login.submit': 'Entrar',
        'auth.login.noAccount': 'Não tem conta?',
        'auth.login.registerLink': 'Cadastre-se',
        'validation.required': 'Este campo é obrigatório',
        'validation.email': 'Digite um email válido',
        'validation.minLength': `Mínimo de ${params?.['min'] || 8} caracteres`,
      };
      return translations[key] || key;
    }),
  };
}

function makeRouterSpy() {
  return {
    navigate: vi.fn().mockResolvedValue(true),
  };
}

function makeActivatedRouteSpy() {
  return {};
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authSpy: ReturnType<typeof makeAuthServiceSpy>;
  let i18nSpy: ReturnType<typeof makeI18nSpy>;
  let routerSpy: ReturnType<typeof makeRouterSpy>;

  beforeEach(async () => {
    vi.clearAllMocks();
    authSpy = makeAuthServiceSpy();
    i18nSpy = makeI18nSpy();
    routerSpy = makeRouterSpy();

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        provideNoopAnimations(),
        { provide: AuthService, useValue: authSpy },
        { provide: I18nService, useValue: i18nSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: makeActivatedRouteSpy() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have email and password form controls', () => {
      expect(component.form.get('email')).toBeTruthy();
      expect(component.form.get('password')).toBeTruthy();
    });

    it('should initialize with empty values', () => {
      expect(component.form.get('email')?.value).toBe('');
      expect(component.form.get('password')?.value).toBe('');
    });

    it('should initialize with password hidden', () => {
      expect(component.showPassword()).toBe(false);
    });
  });

  describe('Form validation', () => {
    it('should require email', () => {
      const email = component.form.get('email');
      email?.setValue('');
      expect(email?.hasError('required')).toBe(true);
    });

    it('should validate email format', () => {
      const email = component.form.get('email');
      email?.setValue('invalid-email');
      expect(email?.hasError('email')).toBe(true);

      email?.setValue('valid@email.com');
      expect(email?.hasError('email')).toBe(false);
    });

    it('should require password', () => {
      const password = component.form.get('password');
      password?.setValue('');
      expect(password?.hasError('required')).toBe(true);
    });

    it('should require minimum password length of 8', () => {
      const password = component.form.get('password');
      password?.setValue('1234567'); // 7 chars
      expect(password?.hasError('minlength')).toBe(true);

      password?.setValue('12345678'); // 8 chars
      expect(password?.hasError('minlength')).toBe(false);
    });

    it('should mark form as invalid when empty', () => {
      expect(component.form.valid).toBe(false);
    });

    it('should mark form as valid with correct values', () => {
      component.form.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(component.form.valid).toBe(true);
    });
  });

  describe('getErrorMessage()', () => {
    it('should return required error message for untouched empty field', () => {
      const email = component.form.get('email');
      email?.setValue('');
      // Not touched yet — no message
      expect(component.getErrorMessage('email')).toBe('');
    });

    it('should return required error message for touched empty field', () => {
      const email = component.form.get('email');
      email?.setValue('');
      email?.markAsTouched();
      expect(component.getErrorMessage('email')).toBe('Este campo é obrigatório');
    });

    it('should return email format error message', () => {
      const email = component.form.get('email');
      email?.setValue('invalid');
      email?.markAsTouched();
      expect(component.getErrorMessage('email')).toBe('Digite um email válido');
    });

    it('should return minlength error message for password', () => {
      const password = component.form.get('password');
      password?.setValue('1234567');
      password?.markAsTouched();
      expect(component.getErrorMessage('password')).toBe('Mínimo de 8 caracteres');
    });
  });

  describe('togglePasswordVisibility()', () => {
    it('should toggle showPassword signal', () => {
      expect(component.showPassword()).toBe(false);

      component.togglePasswordVisibility();
      expect(component.showPassword()).toBe(true);

      component.togglePasswordVisibility();
      expect(component.showPassword()).toBe(false);
    });
  });

  describe('onSubmit()', () => {
    it('should not call login when form is invalid', async () => {
      component.form.patchValue({
        email: '',
        password: '',
      });

      component.onSubmit();
      await flushPromises();

      expect(authSpy.login).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when form is invalid', async () => {
      component.form.patchValue({
        email: '',
        password: '',
      });

      component.onSubmit();
      await flushPromises();

      expect(component.form.get('email')?.touched).toBe(true);
      expect(component.form.get('password')?.touched).toBe(true);
    });

    it('should call login with correct credentials when form is valid', async () => {
      component.form.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      component.onSubmit();
      await flushPromises();

      expect(authSpy.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should navigate to /home on successful login', async () => {
      authSpy.login.mockResolvedValue(true);

      component.form.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      component.onSubmit();
      await flushPromises();

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should not navigate on failed login', async () => {
      authSpy.login.mockResolvedValue(false);

      component.form.patchValue({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      component.onSubmit();
      await flushPromises();

      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  describe('AuthService integration', () => {
    it('should expose isLoading from AuthService', () => {
      expect(component.isLoading()).toBe(false);

      authSpy.isLoading = signal(true);
      fixture = TestBed.createComponent(LoginComponent);
      component = fixture.componentInstance;

      expect(component.isLoading()).toBe(true);
    });

    it('should expose error from AuthService', () => {
      expect(component.error()).toBeNull();

      authSpy.error = signal('Credenciais inválidas');
      fixture = TestBed.createComponent(LoginComponent);
      component = fixture.componentInstance;

      expect(component.error()).toBe('Credenciais inválidas');
    });
  });
});
