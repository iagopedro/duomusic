import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { I18nService } from '../../../core/i18n/i18n.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  readonly form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly isLoading = this.authService.isLoading;
  readonly error = this.authService.error;
  readonly showPassword = signal(false);

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.value;
    const success = await this.authService.login({ email, password });

    if (success) {
      this.router.navigate(['/home']);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
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
    return '';
  }
}
