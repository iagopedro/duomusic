import { test, expect, signIn, expectNoHorizontalOverflow } from './fixtures';
import { EXERCISES } from '../../src/app/data/exercises.data';

test('protected pages redirect guests to login', async ({ page }) => {
  await page.goto('/home');
  await expect(page).toHaveURL('/auth/login');
  await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible();
});

test('onboarding steps lead to the journey and persist completion', async ({ page }) => {
  await signIn(page, false);
  await page.goto('/onboarding');
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ouça, responda e evolua' })).toBeVisible();
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await page.getByRole('button', { name: 'Começar', exact: true }).click();
  await expect(page).toHaveURL('/home');
  expect(await page.evaluate(() => localStorage.getItem('duomusic_onboarding_done'))).toBe('true');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sua jornada musical' })).toBeVisible();
});

for (const width of [390, 1440]) {
  test(`journey, locked lesson and profile preferences at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page);
    await page.goto('/home');
    await expect(
      page.getByRole('button', { name: 'Fundamentos: Lição 1', exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByRole('button', { name: 'Fundamentos: Lição 2', exact: true }),
    ).toBeDisabled();
    const nav = page.getByRole('navigation', { name: 'Navegação principal' });
    await nav.getByRole('link', { name: 'Conquistas' }).click();
    await expect(page).toHaveURL('/achievements');
    await nav.getByRole('link', { name: 'Perfil' }).click();
    await page.getByRole('switch', { name: 'Tema escuro' }).click();
    await page.getByRole('switch', { name: 'Reduzir animações' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('html')).toHaveClass(/reduce-motion/);
    await expectNoHorizontalOverflow(page);
    await page.reload();
    await expect(page.getByRole('switch', { name: 'Tema escuro' })).not.toBeChecked();
    await expect(page.getByRole('switch', { name: 'Reduzir animações' })).toBeChecked();
  });
}

test('practice supports error, review, educational feedback, reward and saved progress', async ({
  page,
}) => {
  await signIn(page);
  const note = EXERCISES.find((exercise) => exercise.id === 'n-1')!;
  await page.route('**/api/exercises/generate?*', (route) => route.fulfill({ json: [note] }));
  await page.goto('/practice/fundamentals?mode=free');
  await page.getByRole('button', { name: 'Começar prática', exact: true }).click();
  const tutorial = page.getByRole('dialog');
  await expect(tutorial).toBeVisible();
  await expect(tutorial.getByRole('button', { name: 'Entendi!', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(tutorial.getByRole('button', { name: 'Entendi!', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(tutorial).toHaveCount(0);
  await page.locator('.practice__note-options button:not([aria-label="Nota C4"])').first().click();
  await expect(page.getByRole('heading', { name: 'Mais uma chance de aprender.' })).toBeVisible();
  await expect(page.locator('.practice__feedback-explanation')).not.toBeEmpty();
  await page.getByRole('button', { name: 'Revisar no final', exact: true }).click();
  await page.getByRole('button', { name: 'Duas', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Você está afinando o ouvido!' })).toBeVisible();
  await page.getByRole('button', { name: 'Próximo desafio', exact: true }).click();
  await expect(page.locator('.practice__session-status')).toContainText('Rodada de revisão');
  await page
    .locator('.practice__note-options')
    .getByRole('button', { name: 'Nota C4', exact: true })
    .click();
  await page.getByRole('button', { name: 'Ver meu progresso', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sua música está evoluindo.' })).toBeVisible();
  await expect(page.locator('app-session-result')).toContainText('2 de 2 desafios dominados');
  const progressBeforeReload = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('duomusic_progress')!),
  );
  expect(progressBeforeReload.exerciseHistory).toHaveLength(3);
  expect(progressBeforeReload.xp).toBeGreaterThanOrEqual(15);
  expect(progressBeforeReload.earnedAchievementIds).toContain('first-exercise');
  expect(progressBeforeReload.completedModuleIds).not.toContain('fundamentals');
  await page.getByRole('button', { name: 'Continuar jornada', exact: false }).click();
  await expect(page).toHaveURL('/home');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sua jornada musical' })).toBeVisible();
  const persisted = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('duomusic_progress')!),
  );
  expect(persisted.xp).toBe(progressBeforeReload.xp);
  expect(persisted.exerciseHistory).toEqual(progressBeforeReload.exerciseHistory);
});

for (const scenario of [
  { id: 'r-1', module: 'fundamentals', heading: 'Ritmo', control: 'Iniciar ritmo' },
  { id: 'm-1', module: 'fundamentals', heading: 'Repetir melodia', control: 'Repetir no piano' },
  { id: 'i-1', module: 'intervals', heading: 'Treino de intervalos', control: 'Ouvir novamente' },
  { id: 'c-1', module: 'chords', heading: 'Qualidade do acorde', control: 'Ouvir novamente' },
]) {
  test(`exercise surface: ${scenario.id}`, async ({ page }) => {
    await signIn(page);
    await page.addInitScript(() => localStorage.setItem('duomusic_piano_tutorial_seen', 'true'));
    const exercise = EXERCISES.find((item) => item.id === scenario.id)!;
    await page.route('**/api/exercises/generate?*', (route) => route.fulfill({ json: [exercise] }));
    await page.goto(`/practice/${scenario.module}?mode=free`);
    await page.getByRole('button', { name: 'Começar prática', exact: true }).click();
    await expect(page.locator('.practice__intro-card')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: scenario.heading, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: scenario.control, exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Voltar', exact: true }).click();
    const exit = page.getByRole('alertdialog', { name: 'Encerrar esta sessão?' });
    await expect(exit).toBeVisible();
    await exit.getByRole('button', { name: 'Continuar praticando', exact: true }).click();
    await expect(exit).toHaveCount(0);
    await page.getByRole('button', { name: 'Voltar', exact: true }).click();
    await page.getByRole('button', { name: 'Voltar à trilha', exact: true }).click();
    await expect(page).toHaveURL('/home');
  });
}

test('unavailable catalog has an explicit offline recovery screen', async ({ page }) => {
  await page.route('**/api/modules', (route) => route.fulfill({ status: 503, json: {} }));
  await page.goto('/auth/login');
  await expect(page).toHaveURL('/offline');
  await expect(page.getByRole('heading', { name: 'Servidor indisponível' })).toBeVisible();
  const retry = page.getByRole('button', { name: 'Tentar novamente', exact: true });
  await expect(retry).toBeEnabled();

  await retry.click();
  await expect(page.getByRole('status')).toContainText('O servidor ainda não respondeu');
  await expect(page).toHaveURL('/offline');

  await page.unroute('**/api/modules');
  await retry.click();
  await expect(page).toHaveURL('/auth/login');
});

test('offline page leaves automatically when the server is available', async ({ page }) => {
  await signIn(page);
  await page.goto('/offline');
  await expect(page).toHaveURL('/home');
  await expect(page.getByRole('heading', { name: 'Sua jornada musical' })).toBeVisible();
});
