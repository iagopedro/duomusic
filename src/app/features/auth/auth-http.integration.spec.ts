import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { authInterceptor } from '../../core/auth/auth.interceptor';
import { StorageService } from '../../core/storage/storage.service';
import { environment } from '../../../environments/environment';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { authErrorCases } from '../../../../tests/fixtures/auth-error-cases';

const forms = [
  { name: 'login', component: LoginComponent, endpoint: '/auth/login/json' },
  { name: 'register', component: RegisterComponent, endpoint: '/auth/register' },
];

describe.each(forms)('$name HTTP-to-DOM integration', ({ component, endpoint, name }) => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [component],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: StorageService, useValue: { get: () => null, set: vi.fn(), remove: vi.fn() } },
      ],
    }).compileComponents();
  });

  function renderForm() {
    const fixture = TestBed.createComponent<LoginComponent | RegisterComponent>(component);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    for (const [id, value] of Object.entries({
      email: 'learner@example.com',
      password: 'synthetic-password',
      ...(name === 'register' ? { confirmPassword: 'synthetic-password' } : {}),
    })) {
      const input = host.querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    fixture.detectChanges();
    const submit = () =>
      host
        .querySelector('form')!
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    return { fixture, host, submit };
  }

  it.each(authErrorCases)(
    'renders $name as accessible text through real HTTP and service',
    async ({ status, body, message }) => {
      const { fixture, host, submit } = renderForm();
      submit();
      fixture.detectChanges();
      expect(host.querySelector<HTMLButtonElement>('[type="submit"]')?.disabled).toBe(true);
      expect(host.querySelector('[role="status"]')?.textContent).toContain('Aguarde');
      submit();
      const request = TestBed.inject(HttpTestingController).expectOne(
        environment.apiUrl + endpoint,
      );
      if (status === 0) request.error(new ProgressEvent('error'));
      else request.flush(body, { status, statusText: 'Error' });
      await fixture.whenStable();
      fixture.detectChanges();

      expect(typeof TestBed.inject(AuthService).error()).toBe('string');
      expect(host.querySelector('[role="alert"]')?.textContent?.trim()).toBe(message);
      expect(host.textContent).not.toContain('[object Object]');
      expect(host.textContent).not.toContain('private-detail');
      expect(host.querySelector<HTMLButtonElement>('[type="submit"]')?.disabled).toBe(false);
      expect(host.querySelector('[role="status"]')).toBeNull();
      expect(TestBed.inject(StorageService).set).not.toHaveBeenCalled();
      expect(TestBed.inject(Router).url).toBe('/');

      submit();
      fixture.detectChanges();
      expect(host.querySelector('[role="alert"]')).toBeNull();
      TestBed.inject(HttpTestingController)
        .expectOne(environment.apiUrl + endpoint)
        .flush({}, { status: 401, statusText: 'Unauthorized' });
      await fixture.whenStable();
    },
  );

  it('does not carry an error to a newly opened auth form', async () => {
    const { fixture, submit } = renderForm();
    submit();
    TestBed.inject(HttpTestingController)
      .expectOne(environment.apiUrl + endpoint)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();
    expect(TestBed.inject(AuthService).error()).toBeTruthy();
    fixture.destroy();
    const next = renderForm();
    expect(next.host.querySelector('[role="alert"]')).toBeNull();
    expect(TestBed.inject(AuthService).error()).toBeNull();
  });
});

describe('Saved authentication with the real HTTP interceptor', () => {
  it('restores the user without refreshing a valid token or a circular injection', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: StorageService,
          useValue: {
            get: () => ({ accessToken: 'test-access', refreshToken: 'test-refresh' }),
            set: vi.fn(),
            remove: vi.fn(),
          },
        },
      ],
    });
    const auth = TestBed.inject(AuthService);
    await Promise.resolve();
    const http = TestBed.inject(HttpTestingController);
    const request = http.expectOne(environment.apiUrl + '/auth/me');
    expect(request.request.headers.has('Authorization')).toBe(true);
    request.flush({ id: 'test-user', email: 'learner@example.com' });
    await auth.initialized;
    expect(auth.isAuthenticated()).toBe(true);
    http.expectNone(environment.apiUrl + '/auth/refresh');
    http.verify();
  });
});
