import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { I18nService } from '../../../core/i18n/i18n.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  readonly form: FormGroup = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      displayName: ['', [Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator }
  );

  readonly isLoading = this.authService.isLoading;
  readonly error = this.authService.error;
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password, displayName } = this.form.value;
    const success = await this.authService.register({
      email,
      password,
      displayName: displayName || undefined,
    });

    if (success) {
      this.router.navigate(['/onboarding']);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(v => !v);
  }

  getErrorMessage(field: string): string {
    const control = this.form.get(field);
    if (!control?.errors || !control.touched) return '';

    if (control.errors['required']) {
      return this.i18n.t('validation.required');
    }
    if (control.errors['email']) {
      return this.i18n.t('validation.email');
    }
    if (control.errors['minlength']) {
      return this.i18n.t('validation.minLength', {
        min: control.errors['minlength'].requiredLength,
      });
    }
    if (control.errors['maxlength']) {
      return this.i18n.t('validation.maxLength', {
        max: control.errors['maxlength'].requiredLength,
      });
    }
    return '';
  }

  getPasswordMatchError(): string {
    if (
      this.form.errors?.['passwordMismatch'] &&
      this.form.get('confirmPassword')?.touched
    ) {
      return this.i18n.t('validation.passwordMismatch');
    }
    return '';
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password?.value !== confirmPassword?.value) {
      return { passwordMismatch: true };
    }
    return null;
  }
}
