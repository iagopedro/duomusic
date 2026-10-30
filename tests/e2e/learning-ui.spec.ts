import { test, expect, signIn, expectNoHorizontalOverflow, expectTextContrast } from './fixtures';

for (const theme of ['light', 'dark']) {
  for (const width of [320, 390, 768, 1440]) {
    test(`learning surfaces: ${theme} at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await signIn(page);
      await page.addInitScript((darkTheme) => {
        localStorage.setItem(
          'duomusic_settings',
          JSON.stringify({ darkTheme, reduceAnimations: true, volume: 0 }),
        );
        localStorage.setItem('duomusic_piano_tutorial_seen', 'true');
      }, theme === 'dark');
      await page.goto('/home');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const progress = page.locator('.home__hero-progress [role="progressbar"]');
      await expect(progress).toHaveAttribute('aria-valuenow', '0');
      await expect(progress).toHaveAttribute('aria-valuemax', '11');
      const nav = page.getByRole('navigation', { name: 'Navegação principal' });
      await expect(nav.getByRole('link', { name: 'Jornada' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      for (const link of await nav.getByRole('link').all()) {
        const box = await link.boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44);
        expect(box!.width).toBeGreaterThanOrEqual(44);
      }
      if (width <= 760) {
        const mainBox = await page.locator('main').boundingBox();
        const navBox = await nav.boundingBox();
        expect(mainBox!.y + mainBox!.height).toBeLessThanOrEqual(navBox!.y);
        await expectTextContrast(page, '.app-shell__nav-btn--active', '.app-shell__bottom-nav');
      }
      await expectTextContrast(page, '.home__hero p', '.home__hero', '--color-hero-start');
      await expectTextContrast(page, '.home__hero p', '.home__hero', '--color-hero-end');
      await expectTextContrast(page, '.home__cta button', '.home__cta button');
      await expectTextContrast(page, '.home__unit-desc', '.home__unit');
      await expectNoHorizontalOverflow(page);
      await page.screenshot({ path: testInfo.outputPath('home.png') });

      await nav.getByRole('link', { name: 'Conquistas' }).click();
      await expect(page.locator('.badge-chip--locked').first()).toContainText('A conquistar');
      await expectTextContrast(page, '.badge-chip__status', '.badge-chip__status');
      await expectNoHorizontalOverflow(page);
      await page.screenshot({ path: testInfo.outputPath('achievements.png') });

      await nav.getByRole('link', { name: 'Perfil' }).click();
      await expect(page.getByRole('switch', { name: 'Tema escuro' })).toBeChecked({
        checked: theme === 'dark',
      });
      await expectTextContrast(page, '.profile__stat-label', '.profile__stat');
      await expectNoHorizontalOverflow(page);
      await page.screenshot({ path: testInfo.outputPath('profile.png') });

      await nav.getByRole('link', { name: 'Jornada' }).click();
      await page.getByRole('button', { name: 'Fundamentos: Lição 1', exact: true }).click();
      await expect(nav).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
      await page.getByRole('button', { name: 'Começar prática', exact: true }).click();
      await expect(page.locator('.practice__intro-card')).toHaveCount(0);
      await expect(page.locator('.practice__exercise-card')).toBeVisible();
      await expectTextContrast(page, '.practice__q-label', '.practice__exercise-card .glass-panel');
      await expectNoHorizontalOverflow(page);
      await page.screenshot({ path: testInfo.outputPath('practice.png') });
    });
  }
}

for (const preference of ['system', 'profile']) {
  test(`learning motion and keyboard access: ${preference}`, async ({ page }) => {
    await signIn(page);
    await page.emulateMedia({
      reducedMotion: preference === 'system' ? 'reduce' : 'no-preference',
    });
    await page.addInitScript((reduceAnimations) => {
      localStorage.setItem(
        'duomusic_settings',
        JSON.stringify({ darkTheme: false, reduceAnimations, volume: 0 }),
      );
    }, preference === 'profile');
    await page.goto('/home');
    const node = page.getByRole('button', { name: 'Fundamentos: Lição 1', exact: true });
    const duration = await node.evaluate((el) =>
      parseFloat(getComputedStyle(el).animationDuration),
    );
    expect(duration).toBeLessThanOrEqual(0.001);
    const skip = page.getByRole('link', { name: 'Pular para o conteúdo' });
    await skip.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
    await node.focus();
    expect(await node.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/practice\/fundamentals\?lesson=0$/);
    await expect(page.locator('h1')).toBeFocused();
    const activeMotion = () =>
      page.evaluate(() =>
        document.getAnimations().flatMap((animation) => {
          const timing = animation.effect?.getTiming();
          return timing && typeof timing.duration === 'number' && timing.duration > 1
            ? [timing.duration]
            : [];
        }),
      );
    expect(await activeMotion(), 'Route transitions must respect reduced motion').toEqual([]);
    await page.getByRole('button', { name: 'Começar prática', exact: true }).click();
    expect(await activeMotion(), 'Practice transitions must respect reduced motion').toEqual([]);
  });
}
