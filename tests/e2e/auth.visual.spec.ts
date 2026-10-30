import { test, expect, fillAuth, expectNoHorizontalOverflow, expectTextContrast } from './fixtures';
import validationError from '../fixtures/auth-validation-error.json';

for (const form of ['login', 'register'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    for (const width of [320, 390, 768, 1440]) {
      test(`${form} ${theme} ${width}: empty, invalid and API error`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.addInitScript((darkTheme) => {
          localStorage.setItem(
            'duomusic_settings',
            JSON.stringify({
              darkTheme,
              reduceAnimations: true,
              volume: 0,
            }),
          );
        }, theme === 'dark');
        const endpoint = form === 'login' ? 'login/json' : 'register';
        await page.route(`**/api/auth/${endpoint}`, (route) =>
          route.fulfill({
            status: 422,
            json: validationError,
          }),
        );
        await page.goto(`/auth/${form}`);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        const card = page.locator('.auth-card');
        await expect(card).toHaveScreenshot(`${form}-${theme}-${width}-empty.png`);
        const email = page.getByLabel('Email', { exact: true });
        await email.fill('iago@gmail');
        await email.blur();
        await expect(page.locator('#email-error')).toHaveText('Digite um email válido');
        await expect(card).toHaveScreenshot(`${form}-${theme}-${width}-invalid.png`);
        await fillAuth(page, form);
        await page.locator('[type="submit"]').click();
        await expect(page.getByRole('alert')).toHaveText('Email: Digite um email válido');
        await expectNoHorizontalOverflow(page);
        await expect(card).toHaveScreenshot(`${form}-${theme}-${width}-422.png`);
      });
    }
  }
}

for (const preference of ['system', 'profile'] as const) {
  test(`loading respects ${preference} reduced motion`, async ({ page }) => {
    await page.emulateMedia({
      reducedMotion: preference === 'system' ? 'reduce' : 'no-preference',
    });
    if (preference === 'profile') {
      await page.addInitScript(() =>
        localStorage.setItem(
          'duomusic_settings',
          JSON.stringify({
            darkTheme: true,
            reduceAnimations: true,
            volume: 0,
          }),
        ),
      );
    }
    let release: () => void = () => {};
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/api/auth/login/json', async (route) => {
      await pending;
      await route.fulfill({ status: 503, json: {} });
    });
    await page.goto('/auth/login');
    await fillAuth(page, 'login');
    await page.locator('[type="submit"]').click();
    await expect(page.getByRole('status')).toHaveText('Aguarde...');
    const duration = await page
      .locator('.spinner')
      .evaluate((el) => parseFloat(getComputedStyle(el).animationDuration));
    expect(duration).toBeLessThanOrEqual(0.001);
    release();
    await expect(page.getByRole('alert')).toBeVisible();
  });
}

test('long server text wraps on mobile and HTML is rendered as text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  const message = `<b>Confira</b> ${'texto'.repeat(80)}`;
  await page.route('**/api/auth/login/json', (route) =>
    route.fulfill({
      status: 400,
      json: { detail: message },
    }),
  );
  await page.goto('/auth/login');
  await fillAuth(page, 'login');
  await page.locator('[type="submit"]').click();
  await expect(page.getByRole('alert')).toHaveText(message);
  await expect(page.getByRole('alert').locator('b')).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

for (const darkTheme of [false, true]) {
  test(`auth text contrast meets WCAG AA in ${darkTheme ? 'dark' : 'light'} theme`, async ({
    page,
  }) => {
    await page.addInitScript(
      (darkTheme) =>
        localStorage.setItem(
          'duomusic_settings',
          JSON.stringify({
            darkTheme,
            reduceAnimations: true,
            volume: 0,
          }),
        ),
      darkTheme,
    );
    await page.route('**/api/auth/login/json', (route) =>
      route.fulfill({ status: 422, json: validationError }),
    );
    await page.goto('/auth/login');
    await fillAuth(page, 'login');
    await page.locator('[type="submit"]').click();
    await expect(page.getByRole('alert')).toBeVisible();
    const pairs = [
      ['.auth-title', '.auth-card'],
      ['.auth-subtitle', '.auth-card'],
      ['label', '.auth-card'],
      ['input', 'input'],
      ['.toggle-password', 'input'],
      ['.error-banner', '.error-banner'],
      ['.submit-button', '.submit-button'],
      ['.auth-footer a', '.auth-card'],
    ];
    for (const [foreground, background] of pairs) {
      await expectTextContrast(page, foreground, background);
    }
  });
}
