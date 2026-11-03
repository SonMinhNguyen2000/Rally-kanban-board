import { expect, test } from '@playwright/test';
import { openBoard, sessionOf, watchErrors } from './helpers';

test.describe('first launch', () => {
  test('/ redirects to /board and shows the empty state', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/board$/);
    await expect(page.getByRole('heading', { name: 'Start with one task' })).toBeVisible();
    for (const name of ['To Do', 'In Progress', 'In Review', 'Done']) {
      await expect(page.getByRole('region', { name, exact: true })).toBeVisible();
    }
  });

  test('creates exactly one anonymous session, which survives a reload', async ({ page, context }) => {
    let signups = 0; // Sign-in requests, which should stop at one.
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().includes('/auth/v1/signup')) signups += 1;
    });
    await openBoard(page);
    expect(signups).toBe(1);
    const first = await sessionOf(context);

    await page.reload();
    await expect(page.getByRole('main', { name: 'Task board' })).toBeVisible();
    expect(signups).toBe(1);
    expect((await sessionOf(context)).userId).toBe(first.userId);
  });

  test('has no hydration or console errors', async ({ page }) => {
    const errors = watchErrors(page);
    await openBoard(page);
    await page.reload();
    await expect(page.getByRole('main', { name: 'Task board' })).toBeVisible();
    await page.waitForTimeout(1500);
    expect(errors).toEqual([]);
  });

  test('the first run offers one filled action', async ({ page }) => {
    await openBoard(page);
    await expect(page.getByRole('button', { name: 'New task' })).toHaveCount(2);
    const filled = await page.getByRole('button', { name: 'New task' }).evaluateAll((buttons) =>
      buttons.filter((button) => button.className.includes('primary')).length,
    );
    expect(filled).toBe(1);
  });
});
