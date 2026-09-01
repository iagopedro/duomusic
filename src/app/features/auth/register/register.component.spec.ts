/**
 * Testes para RegisterComponent.
 *
 * Casos de uso cobertos:
 * - Renderização inicial do formulário
 * - Validação de email obrigatório e formato
 * - Validação de senha obrigatória e tamanho mínimo
 * - Validação de confirmação de senha
 * - Validação de displayName (opcional, max 50 chars)
 * - Toggle de visibilidade da senha/confirmação
 * - Exibição de erro do servidor (email duplicado)
 * - Navegação para /onboarding após registro bem-sucedido
 * - Formulário inválido não faz submit
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { RegisterComponent } from './register.component';
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
    register: vi.fn().mockResolvedValue(true),
  };
}

function makeI18nSpy() {
  return {
    t: vi.fn((key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'auth.register.title': 'Criar conta',
        'auth.register.subtitle': 'Junte-se ao DuoMusic!',
        'auth.email': 'Email',
        'auth.password': 'Senha',
        'auth.confirmPassword': 'Confirmar senha',
        'auth.displayName': 'Nome de exibição',
        'auth.optional': 'opcional',
        'auth.register.submit': 'Criar conta',
        'auth.register.hasAccount': 'Já tem conta?',
        'auth.register.loginLink': 'Entrar',
        'validation.required': 'Este campo é obrigatório',
        'validation.email': 'Digite um email válido',
        'validation.minLength': `Mínimo de ${params?.['min'] || 8} caracteres`,
        'validation.maxLength': `Máximo de ${params?.['max'] || 50} caracteres`,
        'validation.passwordMismatch': 'As senhas não coincidem',
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

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authSpy: ReturnType<typeof makeAuthServiceSpy>;
  let i18nSpy: ReturnType<typeof makeI18nSpy>;
  let routerSpy: ReturnType<typeof makeRouterSpy>;

  beforeEach(async () => {
    vi.clearAllMocks();
    authSpy = makeAuthServiceSpy();
    i18nSpy = makeI18nSpy();
    routerSpy = makeRouterSpy();

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule],
      providers: [
        provideNoopAnimations(),
        { provide: AuthService, useValue: authSpy },
        { provide: I18nService, useValue: i18nSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: makeActivatedRouteSpy() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have all form controls', () => {
      expect(component.form.get('email')).toBeTruthy();
      expect(component.form.get('displayName')).toBeTruthy();
      expect(component.form.get('password')).toBeTruthy();
      expect(component.form.get('confirmPassword')).toBeTruthy();
    });

    it('should initialize with empty values', () => {
      expect(component.form.get('email')?.value).toBe('');
      expect(component.form.get('displayName')?.value).toBe('');
      expect(component.form.get('password')?.value).toBe('');
      expect(component.form.get('confirmPassword')?.value).toBe('');
    });

    it('should initialize with passwords hidden', () => {
      expect(component.showPassword()).toBe(false);
      expect(component.showConfirmPassword()).toBe(false);
    });
  });

  describe('Form validation - Email', () => {
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
  });

  describe('Form validation - Password', () => {
    it('should require password', () => {
      const password = component.form.get('password');
      password?.setValue('');
      expect(password?.hasError('required')).toBe(true);
    });

    it('should require minimum password length of 8', () => {
      const password = component.form.get('password');
      password?.setValue('1234567');
      expect(password?.hasError('minlength')).toBe(true);

      password?.setValue('12345678');
      expect(password?.hasError('minlength')).toBe(false);
    });

    it('should require confirmPassword', () => {
      const confirmPassword = component.form.get('confirmPassword');
      confirmPassword?.setValue('');
      expect(confirmPassword?.hasError('required')).toBe(true);
    });
  });

  describe('Form validation - Password match', () => {
    it('should set passwordMismatch error when passwords do not match', () => {
      component.form.patchValue({
        password: 'password123',
        confirmPassword: 'different123',
      });

      expect(component.form.hasError('passwordMismatch')).toBe(true);
    });

    it('should not set passwordMismatch error when passwords match', () => {
      component.form.patchValue({
        password: 'password123',
        confirmPassword: 'password123',
      });

      expect(component.form.hasError('passwordMismatch')).toBe(false);
    });
  });

  describe('Form validation - Display name', () => {
    it('should not require displayName (optional)', () => {
      const displayName = component.form.get('displayName');
      displayName?.setValue('');
      expect(displayName?.hasError('required')).toBe(false);
    });

    it('should limit displayName to 50 characters', () => {
      const displayName = component.form.get('displayName');
      displayName?.setValue('a'.repeat(51));
      expect(displayName?.hasError('maxlength')).toBe(true);

      displayName?.setValue('a'.repeat(50));
      expect(displayName?.hasError('maxlength')).toBe(false);
    });
  });

  describe('getErrorMessage()', () => {
    it('should return required error for touched empty email', () => {
      const email = component.form.get('email');
      email?.setValue('');
      email?.markAsTouched();
      expect(component.getErrorMessage('email')).toBe('Este campo é obrigatório');
    });

    it('should return email format error', () => {
      const email = component.form.get('email');
      email?.setValue('invalid');
      email?.markAsTouched();
      expect(component.getErrorMessage('email')).toBe('Digite um email válido');
    });

    it('should return minlength error for password', () => {
      const password = component.form.get('password');
      password?.setValue('1234567');
      password?.markAsTouched();
      expect(component.getErrorMessage('password')).toBe('Mínimo de 8 caracteres');
    });

    it('should return maxlength error for displayName', () => {
      const displayName = component.form.get('displayName');
      displayName?.setValue('a'.repeat(51));
      displayName?.markAsTouched();
      expect(component.getErrorMessage('displayName')).toBe('Máximo de 50 caracteres');
    });
  });

  describe('getPasswordMatchError()', () => {
    it('should return empty when confirmPassword not touched', () => {
      component.form.patchValue({
        password: 'password123',
        confirmPassword: 'different',
      });
      // confirmPassword not touched
      expect(component.getPasswordMatchError()).toBe('');
    });

    it('should return error when passwords do not match and confirmPassword touched', () => {
      component.form.patchValue({
        password: 'password123',
        confirmPassword: 'different',
      });
      component.form.get('confirmPassword')?.markAsTouched();

      expect(component.getPasswordMatchError()).toBe('As senhas não coincidem');
    });

    it('should return empty when passwords match', () => {
      component.form.patchValue({
        password: 'password123',
        confirmPassword: 'password123',
      });
      component.form.get('confirmPassword')?.markAsTouched();

      expect(component.getPasswordMatchError()).toBe('');
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

  describe('toggleConfirmPasswordVisibility()', () => {
    it('should toggle showConfirmPassword signal', () => {
      expect(component.showConfirmPassword()).toBe(false);
      component.toggleConfirmPasswordVisibility();
      expect(component.showConfirmPassword()).toBe(true);
      component.toggleConfirmPasswordVisibility();
      expect(component.showConfirmPassword()).toBe(false);
    });
  });

  describe('onSubmit()', () => {
    it('should not call register when form is invalid', async () => {
      component.form.patchValue({
        email: '',
        password: '',
        confirmPassword: '',
      });

      component.onSubmit();
      await flushPromises();

      expect(authSpy.register).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when form is invalid', async () => {
      component.onSubmit();
      await flushPromises();

      expect(component.form.get('email')?.touched).toBe(true);
      expect(component.form.get('password')?.touched).toBe(true);
      expect(component.form.get('confirmPassword')?.touched).toBe(true);
    });

    it('should call register with correct data when form is valid', async () => {
      component.form.patchValue({
        email: 'new@example.com',
        displayName: 'New User',
        password: 'password123',
        confirmPassword: 'password123',
      });

      component.onSubmit();
      await flushPromises();

      expect(authSpy.register).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        displayName: 'New User',
      });
    });

    it('should call register with undefined displayName when empty', async () => {
      component.form.patchValue({
        email: 'new@example.com',
        displayName: '',
        password: 'password123',
        confirmPassword: 'password123',
      });

      component.onSubmit();
      await flushPromises();

      expect(authSpy.register).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        displayName: undefined,
      });
    });

    it('should navigate to /onboarding on successful registration', async () => {
      authSpy.register.mockResolvedValue(true);

      component.form.patchValue({
        email: 'new@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      component.onSubmit();
      await flushPromises();

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/onboarding']);
    });

    it('should not navigate on failed registration', async () => {
      authSpy.register.mockResolvedValue(false);

      component.form.patchValue({
        email: 'existing@example.com',
        password: 'password123',
        confirmPassword: 'password123',
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
      fixture = TestBed.createComponent(RegisterComponent);
      component = fixture.componentInstance;

      expect(component.isLoading()).toBe(true);
    });

    it('should expose error from AuthService', () => {
      expect(component.error()).toBeNull();

      authSpy.error = signal('Este email já está cadastrado');
      fixture = TestBed.createComponent(RegisterComponent);
      component = fixture.componentInstance;

      expect(component.error()).toBe('Este email já está cadastrado');
    });
  });
});
