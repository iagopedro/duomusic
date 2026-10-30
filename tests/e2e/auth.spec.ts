import { test, expect, fillAuth, tokens, user, expectNoHorizontalOverflow } from './fixtures';
import { authErrorCases } from '../fixtures/auth-error-cases';

for (const form of ['login', 'register'] as const) {
  const endpoint = form === 'login' ? 'login/json' : 'register';
  const submitLabel = form === 'login' ? 'Entrar' : 'Criar conta';

  test(`${form}: screenshot email, validation and keyboard visibility toggle`, async ({ page }) => {
    await page.goto(`/auth/${form}`);
    const email = page.getByLabel('Email', { exact: true });
    const password = page.getByLabel('Senha', { exact: true });
    const submit = page.getByRole('button', { name: submitLabel, exact: true });
    await expect(submit).toBeDisabled();
    await email.fill('iago@gmail');
    await email.press('Tab');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toHaveAttribute('aria-describedby', 'email-error');
    await expect(page.locator('#email-error')).toHaveText('Digite um email válido');
    await expect(submit).toBeDisabled();
    await fillAuth(page, form);
    await password.focus();
    await password.press('Tab');
    const toggle = page.getByRole('button', { name: 'Mostrar senha', exact: true }).first();
    await expect(toggle).toBeFocused();
    expect(await toggle.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');
    await page.keyboard.press('Enter');
    await expect(password).toHaveAttribute('type', 'text');
    await page.keyboard.press('Enter');
    await expect(password).toHaveAttribute('type', 'password');
    await expect(submit).toBeEnabled();
    await expectNoHorizontalOverflow(page);
  });

  for (const scenario of authErrorCases) {
    test(`${form}: ${scenario.name}`, async ({ page }) => {
      let requests = 0;
      await page.route(`**/api/auth/${endpoint}`, async (route) => {
        requests++;
        if (scenario.status === 0) await route.abort('failed');
        else await route.fulfill({ status: scenario.status, json: scenario.body });
      });
      await page.goto(`/auth/${form}`);
      await fillAuth(page, form);
      await page.getByRole('button', { name: submitLabel, exact: true }).click();
      const alert = page.getByRole('alert');
      await expect(alert).toHaveText(scenario.message);
      await expect(alert).not.toContainText('[object Object]');
      await expect(alert).not.toContainText('private-detail');
      await expect(page).toHaveURL(`/auth/${form}`);
      await expect(page.getByRole('button', { name: submitLabel, exact: true })).toBeEnabled();
      expect(requests).toBe(1);
      expect(await page.evaluate(() => localStorage.getItem('duomusic_tokens'))).toBeNull();
    });
  }

  test(`${form}: slow response, duplicate submit, retry and successful navigation`, async ({
    page,
  }) => {
    let release: () => void = () => {};
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    let requests = 0;
    await page.route(`**/api/auth/${endpoint}`, async (route) => {
      requests++;
      if (requests === 1) {
        await pending;
        await route.fulfill({ status: 503, json: {} });
      } else await route.fulfill({ json: tokens });
    });
    await page.route('**/api/auth/me', (route) => route.fulfill({ json: user }));
    if (form === 'login') {
      await page.addInitScript(() => localStorage.setItem('duomusic_onboarding_done', 'true'));
    }
    await page.goto(`/auth/${form}`);
    await fillAuth(page, form);
    await page.getByLabel('Senha', { exact: true }).press('Enter');
    await expect(page.getByRole('status')).toHaveText('Aguarde...');
    await expect(page.locator('[type="submit"]')).toBeDisabled();
    await page.locator('form').dispatchEvent('submit');
    expect(requests).toBe(1);
    release();
    await expect(page.getByRole('alert')).toContainText('indisponível');
    await page.getByRole('button', { name: submitLabel, exact: true }).click();
    await expect(page).toHaveURL(form === 'login' ? '/home' : '/onboarding');
    expect(requests).toBe(2);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('duomusic_tokens')!))).toEqual(
      tokens,
    );
    await page.reload();
    await expect(page).toHaveURL(form === 'login' ? '/home' : '/onboarding');
    await expect(
      page.getByRole('heading', {
        name: form === 'login' ? 'Sua jornada musical' : 'Aprenda música com prática',
        exact: true,
      }),
    ).toBeVisible();
  });
}

test('changing auth forms clears an error instead of showing it on an untouched form', async ({
  page,
}) => {
  await page.route('**/api/auth/login/json', (route) => route.fulfill({ status: 401, json: {} }));
  await page.goto('/auth/login');
  await fillAuth(page, 'login');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('link', { name: 'Cadastre-se' }).click();
  await expect(page).toHaveURL('/auth/register');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('link', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('registration field boundaries and mismatch are explained before any HTTP request', async ({
  page,
}) => {
  await page.goto('/auth/register');
  await fillAuth(page, 'register');
  const password = page.getByLabel('Senha', { exact: true });
  const confirmation = page.getByLabel('Confirmar senha', { exact: true });
  const name = page.getByLabel('Nome de exibição', { exact: false });
  for (const length of [7, 129]) {
    await password.fill('a'.repeat(length));
    await password.blur();
    await expect(page.locator('#password-error')).toHaveText(
      length === 7 ? 'Mínimo de 8 caracteres' : 'Máximo de 128 caracteres',
    );
    await expect(page.locator('[type="submit"]')).toBeDisabled();
  }
  await password.fill('a'.repeat(128));
  await confirmation.fill('different-password');
  await confirmation.blur();
  await expect(page.locator('#match-error')).toHaveText('As senhas não coincidem');
  await confirmation.fill('a'.repeat(128));
  await name.fill('a'.repeat(51));
  await name.blur();
  await expect(page.locator('#name-error')).toHaveText('Máximo de 50 caracteres');
  await name.fill('a'.repeat(50));
  await expect(page.locator('[type="submit"]')).toBeEnabled();
});
