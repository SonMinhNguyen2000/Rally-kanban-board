import { expect, test, type Page } from '@playwright/test';
import { card, clearBoard, createGuest, dragTo, lane, openBoard, rest, seedTasks, type GuestState } from './helpers';

let guest: GuestState; // One guest per file, because sign-ins are rate limited.
test.beforeAll(async ({ browser }) => {
  guest = await createGuest(browser);
});

/**
 * Makes every server action fail at the network level.
 * @param page - The page to act on.
 */
async function failActions(page: Page) {
  await page.route('**/board', async (route) => {
    if (route.request().headers()['next-action']) await route.abort('failed');
    else await route.continue();
  });
}

/**
 * Makes every server action return a server error.
 * @param page - The page to act on.
 */
async function failActionsWith500(page: Page) {
  await page.route('**/board', async (route) => {
    if (route.request().headers()['next-action']) await route.fulfill({ status: 500, body: 'boom' });
    else await route.continue();
  });
}

test.describe('with a session', () => {
  test.use({ storageState: async ({}, use) => use(guest) });
  test.beforeEach(async ({ context }) => clearBoard(context));

  for (const [name, fail] of [['network failure', failActions], ['server error', failActionsWith500]] as const) {
    test(`a failed drop rolls back and explains: ${name}`, async ({ page, context }) => {
      await seedTasks(context, [{ title: 'Stubborn' }]);
      await openBoard(page);
      await fail(page);
      await dragTo(page, card(page, 'Stubborn'), lane(page, 'Done'));
      await page.mouse.up();
      await expect(page.getByRole('status').getByText('Couldn’t move the task. It’s back where it was.')).toBeVisible();
      await expect(card(lane(page, 'To Do'), 'Stubborn')).toBeVisible();
      const [row] = await rest(context, 'tasks?select=status');
      expect(row.status).toBe('todo');
    });
  }

  test('a failed edit rolls back and explains', async ({ page, context }) => {
    await seedTasks(context, [{ title: 'Unchanged' }]);
    await openBoard(page);
    await card(page, 'Unchanged').click();
    await failActions(page);
    const panel = page.locator('aside');
    await panel.getByRole('button', { name: /^Priority:/ }).click();
    await page.getByRole('menuitemradio', { name: 'High' }).click();
    await expect(page.getByRole('status').getByText('Couldn’t save that change', { exact: false })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Priority: Normal. Change priority' })).toBeVisible();
  });

  test('a failed create keeps the dialog and the text', async ({ page }) => {
    await openBoard(page);
    await failActions(page);
    await page.getByRole('button', { name: 'New task' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'New task' });
    await dialog.getByLabel('Title').fill('Precious text');
    await dialog.getByRole('button', { name: 'Create task' }).click();
    await expect(dialog.getByRole('alert')).toContainText('Couldn’t create the task');
    await expect(dialog.getByLabel('Title')).toHaveValue('Precious text');
    await expect(dialog.getByRole('button', { name: 'Create task' })).toBeEnabled();
  });

  test('a failed comment keeps the text', async ({ page, context }) => {
    await seedTasks(context, [{ title: 'Commented' }]);
    await openBoard(page);
    await card(page, 'Commented').click();
    await failActions(page);
    const panel = page.locator('aside');
    await panel.getByLabel('Add a comment').fill('Do not lose me');
    await panel.getByRole('button', { name: 'Comment' }).click();
    await expect(page.getByRole('status').getByText('Couldn’t post your comment', { exact: false })).toBeVisible();
    await expect(panel.getByLabel('Add a comment')).toHaveValue('Do not lose me');
  });

  test('the board failure screen offers a retry that works', async ({ page, context }) => {
    await seedTasks(context, [{ title: 'Survivor' }]);
    await page.route('**/rest/v1/tasks*', (route) => route.abort('failed'));
    await page.goto('/board');
    const heading = page.getByRole('heading', { name: 'Can’t reach your board' });
    await expect(heading).toBeVisible({ timeout: 40_000 });
    await page.unroute('**/rest/v1/tasks*');
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(card(page, 'Survivor')).toBeVisible();
  });

  test('DEFECT: the board failure screen appears within 10 seconds', async ({ page }) => {
    await page.route('**/rest/v1/tasks*', (route) => route.abort('failed'));
    await page.goto('/board');
    await expect(page.getByRole('heading', { name: 'Can’t reach your board' })).toBeVisible({ timeout: 10_000 });
  });

  test('a failed background refresh keeps the loaded board on screen', async ({ page, context }) => {
    await seedTasks(context, [{ title: 'Still here' }]);
    await openBoard(page);
    let failedReads = 0; // Attempts at the refetch, so the check waits for it to really give up.
    await page.route('**/rest/v1/tasks*', async (route) => {
      failedReads += 1;
      await route.abort('failed');
    });
    await card(page, 'Still here').click();
    const title = page.getByRole('textbox', { name: 'Title' }); // By role, because the search box mentions titles too.
    await title.fill('Still here, renamed');
    await title.press('Enter');
    // The first attempt and React Query's one retry.
    await expect.poll(() => failedReads, { timeout: 15_000 }).toBeGreaterThanOrEqual(2);
    await expect(page.getByRole('heading', { name: 'Can’t reach your board' })).toHaveCount(0);
    await expect(card(page, 'Still here, renamed')).toBeVisible();
  });

  test('shows a skeleton, not a blank page, while loading', async ({ page }) => {
    await page.route('**/rest/v1/tasks*', async (route) => {
      await new Promise((done) => setTimeout(done, 1200));
      await route.continue();
    });
    await page.goto('/board');
    await expect(page.locator('[aria-busy="true"]')).toBeVisible();
    await expect(page.getByRole('main', { name: 'Task board' })).toBeVisible();
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  });
});

test.describe('without a session', () => {
  test('the session failure screen offers a retry that works', async ({ page }) => {
    await page.route('**/auth/v1/signup*', (route) => route.abort('failed'));
    await page.goto('/board');
    await expect(page.getByRole('heading', { name: 'Can’t start your board' })).toBeVisible({ timeout: 40_000 });
    await page.unroute('**/auth/v1/signup*');
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByRole('main', { name: 'Task board' })).toBeVisible();
  });
});
