import { expect, test } from '@playwright/test';
import { card, clearBoard, createGuest, isActionResponse, lane, laneTitles, openBoard, rest, type GuestState } from './helpers';

let guest: GuestState; // One guest per file, because sign-ins are rate limited.
test.beforeAll(async ({ browser }) => {
  guest = await createGuest(browser);
});
test.use({ storageState: async ({}, use) => use(guest) });

// The server's date can be a day apart from the guest's, so the extremes on both sides are checked.
for (const timezoneId of ['Pacific/Kiritimati', 'Pacific/Pago_Pago']) {
  test.describe(`sample board in ${timezoneId}`, () => {
    test.use({ timezoneId });
    test.beforeEach(async ({ context }) => clearBoard(context));

    test('due dates follow the guest\'s own date', async ({ page }) => {
      await openBoard(page);
      await page.getByRole('button', { name: 'Load sample board' }).click();
      await expect(card(page, 'Run keyboard accessibility pass').getByText('Overdue 1d')).toBeVisible();
      await expect(card(page, 'Outline the Q4 launch plan').getByText('Due tomorrow')).toBeVisible();
      await expect(page.getByRole('group', { name: 'Board statistics' }).getByText('overdue')).toBeVisible();
    });
  });
}

test.describe('sample board', () => {
  test.beforeEach(async ({ context }) => clearBoard(context));

  test('fills every lane in one click, and it persists', async ({ page, context }) => {
    await openBoard(page);
    await page.getByRole('button', { name: 'Load sample board' }).click();
    await expect(card(lane(page, 'To Do'), 'Outline the Q4 launch plan')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Start with one task' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Load sample board' })).toHaveCount(0);

    for (const name of ['To Do', 'In Progress', 'In Review', 'Done']) {
      expect(await laneTitles(page, name)).toHaveLength(3);
    }
    expect(await rest(context, 'task_assignees?select=task_id')).not.toHaveLength(0);
    expect(await rest(context, 'task_labels?select=task_id')).not.toHaveLength(0);

    await page.reload();
    await expect(card(lane(page, 'Done'), 'Ship the board refresh')).toBeVisible();
  });

  test('shows real history and comments in the panel', async ({ page }) => {
    await openBoard(page);
    await page.getByRole('button', { name: 'Load sample board' }).click();
    await card(page, 'Add optimistic task updates').click();
    await expect(page.getByText('Moved from To Do → In Progress')).toBeVisible();
    await expect(page.getByText('Optimistic deletes now restore the card')).toBeVisible();
  });

  test('shows due dates relative to today, with one overdue', async ({ page }) => {
    await openBoard(page);
    await page.getByRole('button', { name: 'Load sample board' }).click();
    await expect(card(page, 'Run keyboard accessibility pass').getByText('Overdue 1d')).toBeVisible();
    await expect(card(page, 'Outline the Q4 launch plan').getByText('Due tomorrow')).toBeVisible();
  });

  test('can be loaded again after clearing the tasks, reusing members and labels', async ({ page, context }) => {
    await openBoard(page);
    await page.getByRole('button', { name: 'Load sample board' }).click();
    await expect(card(page, 'Outline the Q4 launch plan')).toBeVisible();
    await rest(context, 'tasks?id=not.is.null', { method: 'DELETE' });

    await page.reload();
    await page.getByRole('button', { name: 'Load sample board' }).click();
    await expect(card(page, 'Outline the Q4 launch plan')).toBeVisible();
    expect(await rest(context, 'labels?select=id')).toHaveLength(8);
    expect(await rest(context, 'team_members?select=id')).toHaveLength(6);
  });

  test('explains a failure and leaves the board empty', async ({ page }) => {
    await openBoard(page);
    await page.route('**/board', async (route) => {
      if (route.request().headers()['next-action']) await route.abort('failed');
      else await route.continue();
    });
    await page.getByRole('button', { name: 'Load sample board' }).click();
    await expect(page.getByRole('status').getByText('Couldn’t load the sample board.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Load sample board' })).toBeEnabled();
    await expect(page.getByRole('heading', { name: 'Start with one task' })).toBeVisible();
  });

  test('shows a loading state while it works', async ({ page }) => {
    await openBoard(page);
    await page.route('**/board', async (route) => {
      if (route.request().headers()['next-action']) await new Promise((done) => setTimeout(done, 800));
      await route.continue();
    });
    const finished = page.waitForResponse(isActionResponse);
    await page.getByRole('button', { name: 'Load sample board' }).click();
    await expect(page.getByRole('button', { name: 'Loading…' })).toBeDisabled();
    await finished;
    await expect(card(page, 'Outline the Q4 launch plan')).toBeVisible();
  });
});
