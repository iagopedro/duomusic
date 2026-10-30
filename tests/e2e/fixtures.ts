import { test as base, expect, Page } from '@playwright/test';
import { MODULES } from '../../src/app/data/modules.data';
import { EXERCISES } from '../../src/app/data/exercises.data';
import { ACHIEVEMENTS } from '../../src/app/data/achievements.data';

export { expect };
export const user = {
  id: 'ui-test-user',
  email: 'learner@example.com',
  displayName: 'Estudante',
  createdAt: '2026-10-29T12:00:00Z',
};
export const tokens = {
  accessToken: 'ui-test-access',
  refreshToken: 'ui-test-refresh',
  tokenType: 'bearer',
  expiresIn: 1800,
};

export const test = base.extend<{ isolatedApp: void }>({
  isolatedApp: [
    async ({ page }, use) => {
      const unexpected: string[] = [];
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.clock.setFixedTime(new Date('2026-10-29T12:00:00Z'));
      // Baselines exercise the system-font fallback without depending on a font CDN.
      await page.route('https://fonts.googleapis.com/**', (route) =>
        route.fulfill({
          contentType: 'text/css',
          body: '',
        }),
      );
      await page.route('**/api/**', async (route) => {
        const path = new URL(route.request().url()).pathname;
        const catalog: Record<string, object> = {
          '/api/modules': MODULES,
          '/api/exercises': EXERCISES,
          '/api/achievements': ACHIEVEMENTS,
        };
        if (route.request().method() === 'GET' && catalog[path]) {
          await route.fulfill({ json: catalog[path] });
        } else {
          unexpected.push(`${route.request().method()} ${path}`);
          await route.abort('failed');
        }
      });
      await use();
      expect(unexpected, 'Unexpected API requests must be explicitly modeled').toEqual([]);
      expect(errors, 'Unhandled browser errors').toEqual([]);
    },
    { auto: true },
  ],
});

export async function fillAuth(page: Page, form: 'login' | 'register') {
  await page.getByLabel('Email', { exact: true }).fill(user.email);
  await page.getByLabel('Senha', { exact: true }).fill('synthetic-password');
  if (form === 'register') {
    await page.getByLabel('Confirmar senha', { exact: true }).fill('synthetic-password');
  }
}

export async function signIn(page: Page, onboardingDone = true) {
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: user }));
  await page.addInitScript(
    ({ tokens, onboardingDone }) => {
      if (localStorage.getItem('duomusic_tokens') === null) {
        localStorage.setItem('duomusic_tokens', JSON.stringify(tokens));
      }
      if (localStorage.getItem('duomusic_onboarding_done') === null) {
        localStorage.setItem('duomusic_onboarding_done', JSON.stringify(onboardingDone));
      }
    },
    { tokens, onboardingDone },
  );
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflows = await page.evaluate(() => {
    const selectors = ['html', 'body', 'main', '.auth-container', '.auth-card', '.error-banner'];
    return selectors.filter((selector) => {
      const element = document.querySelector<HTMLElement>(selector);
      return element && element.scrollWidth > element.clientWidth + 1;
    });
  });
  expect(overflows, 'Containers must wrap content, not hide horizontal overflow').toEqual([]);
}

export async function expectTextContrast(
  page: Page,
  foreground: string,
  background: string,
  backgroundProperty = 'background-color',
) {
  const ratio = await page.evaluate(
    ({ foreground, background, backgroundProperty }) => {
      const luminance = (color: string) => {
        const rgb = color.trim().startsWith('#')
          ? color
              .trim()
              .slice(1)
              .match(/.{2}/g)!
              .map((channel) => parseInt(channel, 16))
          : color
              .match(/\d+(\.\d+)?/g)!
              .slice(0, 3)
              .map(Number);
        const channels = rgb.map((value) => {
          const channel = value / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      };
      const front = luminance(getComputedStyle(document.querySelector(foreground)!).color);
      const back = luminance(
        getComputedStyle(document.querySelector(background)!).getPropertyValue(backgroundProperty),
      );
      return (Math.max(front, back) + 0.05) / (Math.min(front, back) + 0.05);
    },
    { foreground, background, backgroundProperty },
  );
  expect(ratio, `Contrast of ${foreground} against ${background}`).toBeGreaterThanOrEqual(4.5);
}
