import { FormControl, Validators } from '@angular/forms';
import { emailValidator } from './email.validator';

describe('Public email validation', () => {
  it.each([
    'iago@gmail',
    'no-at',
    'a@',
    '@example.com',
    'a b@example.com',
    'a@b..com',
    'a@example.com.',
  ])('rejects %s', (value) => {
    expect(new FormControl(value, emailValidator).hasError('email')).toBe(true);
  });

  it.each([
    'learner@example.com',
    'learner+music@sub.example.com',
    'A.B@example.com',
    'a@my-domain.com',
  ])('preserves valid format %s', (value) => {
    expect(new FormControl(value, emailValidator).valid).toBe(true);
  });

  it('leaves empty values to the required validator', () => {
    const control = new FormControl('', [Validators.required, emailValidator]);
    expect(control.errors).toEqual({ required: true });
  });
});
