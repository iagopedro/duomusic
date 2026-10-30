import { ValidatorFn, Validators } from '@angular/forms';

// Angular aceita dominios locais; a API publica usa EmailStr e exige um dominio completo.
export const emailValidator: ValidatorFn = (control) => {
  if (Validators.email(control)) return { email: true };
  const value: unknown = control.value;
  if (!value) return null;
  if (typeof value !== 'string') return { email: true };
  const domain = value.slice(value.lastIndexOf('@') + 1);
  return domain.includes('.') && !domain.endsWith('.') ? null : { email: true };
};
