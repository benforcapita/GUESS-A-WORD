import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const key = 'guess-a-word:v1';
const initial = { version: 1, wordId: 'banana', guesses: [] };
async function seed(page, state = initial) {
  await page.goto('/');
  await page.evaluate(
    ({ key, state }) => sessionStorage.setItem(key, JSON.stringify(state)),
    { key, state },
  );
  await page.reload();
}
async function guesses(page) {
  return page.evaluate(
    (key) => JSON.parse(sessionStorage.getItem(key)).guesses,
    key,
  );
}

test('keyboard guesses reveal repeat letters, ignore invalid keys and preserve chances on repeats', async ({
  page,
}) => {
  await seed(page);
  await page.keyboard.press('a');
  await expect(
    page.getByRole('group', { name: 'Word: blank A blank A blank A' }),
  ).toBeVisible();
  await page.keyboard.press('a');
  await page.keyboard.press('1');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Control+x');
  await expect.poll(() => guesses(page)).toEqual(['A']);
  await page.keyboard.press('x');
  await page.keyboard.press('x');
  await expect(page.getByTestId('chances')).toHaveText('5');
  await expect.poll(() => guesses(page)).toEqual(['A', 'X']);
});

test('touch/click keyboard works and reload resumes the exact round', async ({
  page,
  isMobile,
}) => {
  await seed(page);
  const a = page.getByRole('button', { name: 'Guess A', exact: true });
  if (isMobile) await a.tap();
  else await a.click();
  const x = page.getByRole('button', { name: 'Guess X', exact: true });
  if (isMobile) await x.tap();
  else await x.click();
  await page.reload();
  await expect(page.getByTestId('chances')).toHaveText('5');
  await expect(
    page.getByRole('button', { name: 'A, correct', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'X, incorrect', exact: true }),
  ).toBeDisabled();
  await expect.poll(() => guesses(page)).toEqual(['A', 'X']);
});

test('restart protects progress, Escape and cancel preserve it, confirmation resets without navigation', async ({
  page,
}) => {
  await seed(page);
  await page.keyboard.press('a');
  await page.getByRole('button', { name: 'New word', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('x');
  await expect.poll(() => guesses(page)).toEqual(['A']);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(
    page.getByRole('button', { name: 'New word', exact: true }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'New word', exact: true }).click();
  await page.getByRole('button', { name: 'Keep playing' }).click();
  await expect.poll(() => guesses(page)).toEqual(['A']);
  await page.getByRole('button', { name: 'New word', exact: true }).click();
  await page.getByRole('button', { name: 'Start a new word' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect.poll(() => guesses(page)).toEqual([]);
  await expect(page.getByTestId('chances')).toHaveText('6');
  await expect(page).toHaveURL('/');
  expect(
    await page.evaluate(
      (key) => JSON.parse(sessionStorage.getItem(key)).wordId,
      key,
    ),
  ).not.toBe('banana');
});

test('win locks guesses, survives reload, and play again makes a fresh round', async ({
  page,
}) => {
  await seed(page);
  await page.keyboard.type('ban');
  await expect(
    page.getByRole('heading', { name: 'Nicely done!' }),
  ).toBeFocused();
  await page.keyboard.press('x');
  await expect.poll(() => guesses(page)).toEqual(['B', 'A', 'N']);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Nicely done!' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Play another word' }).click();
  await expect.poll(() => guesses(page)).toEqual([]);
  await expect(
    page.getByRole('heading', { name: 'Nicely done!' }),
  ).not.toBeVisible();
});

test('loss happens at exactly six misses, reveals answer, and stays at zero', async ({
  page,
}) => {
  await seed(page);
  await page.keyboard.type('cdefgh');
  await expect(
    page.getByRole('heading', { name: 'A good word for next time.' }),
  ).toBeVisible();
  await expect(page.getByTestId('answer')).toHaveText('BANANA');
  await page.keyboard.type('jklban');
  await expect(page.getByTestId('chances')).toHaveText('0');
  await expect.poll(() => guesses(page)).toEqual([...'CDEFGH']);
  await page.reload();
  await expect(page.getByTestId('chances')).toHaveText('0');
  await page.getByRole('button', { name: 'Play another word' }).click();
  await expect(page.getByTestId('chances')).toHaveText('6');
});

test('corrupt saved data recovers and blocked storage never crashes the game', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate((key) => sessionStorage.setItem(key, '{broken'), key);
  await page.reload();
  await expect(page.getByTestId('chances')).toHaveText('6');
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', {
      get() {
        throw new Error('Storage blocked');
      },
    });
  });
  await page.reload();
  await expect(page.getByRole('group', { name: /Word:/ })).toBeVisible();
  await page.getByRole('button', { name: 'Guess A', exact: true }).click();
  await expect(
    page.getByText(
      'Saving is unavailable. This round will reset if you refresh.',
    ),
  ).toBeVisible();
});

test('accessible play, help and confirmation dialog have no serious automated violations', async ({
  page,
}) => {
  await seed(page);
  await page.locator('summary').click();
  await expect(
    page.getByText('Every correct guess reveals all matching letters.'),
  ).toBeVisible();
  for (const stage of ['playing', 'dialog']) {
    if (stage === 'dialog') {
      await page.keyboard.press('a');
      await page.getByRole('button', { name: 'New word', exact: true }).click();
    }
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(result.violations).toEqual([]);
  }
});

test('narrow screens and long words fit without horizontal scrolling or page errors', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await seed(page, { ...initial, wordId: 'rainbow' });
  await page.setViewportSize({ width: 320, height: 740 });
  await expect(page.getByRole('group', { name: /Word:/ })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Guess R', exact: true }).click();
  await page.keyboard.type('ainbow');
  await expect(
    page.getByRole('heading', { name: 'Nicely done!' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('capture the playable layout at each supported viewport', async ({
  page,
}, testInfo) => {
  await seed(page);
  await page.keyboard.press('a');
  await expect(
    page.getByRole('group', { name: 'Word: blank A blank A blank A' }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('playing.png'),
    fullPage: true,
  });
  await page.keyboard.type('bn');
  await expect(
    page.getByRole('heading', { name: 'Nicely done!' }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('won.png'),
    fullPage: true,
  });
});
