import { expect, test } from '@playwright/test';
import { card, clearBoard, createGuest, dayFromToday, lane, nextAction, openBoard, rest, seedTasks, type GuestState } from './helpers';

let guest: GuestState; // One guest per file, because sign-ins are rate limited.
test.beforeAll(async ({ browser }) => {
  guest = await createGuest(browser);
});
test.use({ storageState: async ({}, use) => use(guest) });
test.beforeEach(async ({ context }) => clearBoard(context));

test.describe('creating tasks', () => {
  test('creates a task with every field, and it persists', async ({ page, context }) => {
    await openBoard(page);
    await page.getByRole('button', { name: 'New task' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'New task' });
    await dialog.getByLabel('Title').fill('Ship the release notes');
    await dialog.getByLabel('Description').fill('Cover the migration');
    await dialog.getByRole('button', { name: 'Status: To Do' }).click();
    await page.getByRole('menuitemradio', { name: 'In Review' }).click();
    await dialog.getByRole('button', { name: 'Priority: Normal' }).click();
    await page.getByRole('menuitemradio', { name: 'High' }).click();
    await dialog.getByLabel('Due date').fill('2031-03-15');
    await dialog.getByRole('button', { name: 'Create task' }).click();

    await expect(dialog).toBeHidden();
    await page.reload();
    const created = card(lane(page, 'In Review'), 'Ship the release notes');
    await expect(created).toBeVisible();
    await expect(created).toContainText('High');

    const [row] = await rest(context, 'tasks?select=*');
    expect(row).toMatchObject({
      title: 'Ship the release notes',
      description: 'Cover the migration',
      status: 'in_review',
      priority: 'high',
      due_date: '2031-03-15',
    });
  });

  test('refuses a blank title with a message and does not save', async ({ page, context }) => {
    await openBoard(page);
    await page.getByRole('button', { name: 'New task' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'New task' });
    await dialog.getByLabel('Title').fill('    ');
    await dialog.getByRole('button', { name: 'Create task' }).click();
    await expect(dialog.getByRole('alert')).toHaveText('Add a title so this task can be found later.');
    await expect(dialog).toBeVisible();
    expect(await rest(context, 'tasks?select=id')).toEqual([]);
  });

  test('shows a loading state while saving', async ({ page }) => {
    await openBoard(page);
    // Holds the action so the in-between state can be seen.
    await page.route('**/board', async (route) => {
      if (route.request().headers()['next-action']) await new Promise((done) => setTimeout(done, 800));
      await route.continue();
    });
    await page.getByRole('button', { name: 'New task' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'New task' });
    await dialog.getByLabel('Title').fill('Slow save');
    await dialog.getByRole('button', { name: 'Create task' }).click();
    await expect(dialog.getByRole('button', { name: 'Creating…' })).toBeDisabled();
    await expect(dialog).toBeHidden();
  });

  test('a lane add button starts the task in that lane', async ({ page }) => {
    await openBoard(page);
    await page.getByRole('button', { name: 'Add a task to Done' }).click();
    const dialog = page.getByRole('dialog', { name: 'New task' });
    await expect(dialog.getByRole('button', { name: 'Status: Done' })).toBeVisible();
    await dialog.getByLabel('Title').fill('Already finished');
    await dialog.getByRole('button', { name: 'Create task' }).click();
    await expect(card(lane(page, 'Done'), 'Already finished')).toBeVisible();
  });
});

test.describe('editing in the panel', () => {
  test('edits title, description, priority and due date, all persisted', async ({ page, context }) => {
    await seedTasks(context, [{ title: 'Original' }]);
    await openBoard(page);
    await card(page, 'Original').click();
    const panel = page.locator('aside');

    let saved = nextAction(page);
    await panel.getByLabel('Title').fill('Renamed');
    await panel.getByLabel('Title').press('Enter');
    await saved;

    saved = nextAction(page);
    await panel.getByLabel('Description').fill('Some detail');
    await panel.getByLabel('Description').press('Tab');
    await saved;

    saved = nextAction(page);
    await panel.getByRole('button', { name: /^Priority:/ }).click();
    await page.getByRole('menuitemradio', { name: 'Low' }).click();
    await saved;

    saved = nextAction(page);
    await panel.getByLabel('Due date').fill(dayFromToday(30));
    await saved;

    await page.reload();
    const [row] = await rest(context, 'tasks?select=*');
    expect(row).toMatchObject({ title: 'Renamed', description: 'Some detail', priority: 'low', due_date: dayFromToday(30) });
    await expect(card(page, 'Renamed')).toContainText('Low');
  });

  test('refuses a blank title and restores the previous one', async ({ page }) => {
    await page.goto('/board');
    await page.getByRole('button', { name: 'New task' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'New task' });
    await dialog.getByLabel('Title').fill('Keep me');
    await dialog.getByRole('button', { name: 'Create task' }).click();
    await expect(dialog).toBeHidden();
    await card(page, 'Keep me').click();
    const panel = page.locator('aside');
    await panel.getByLabel('Title').fill('   ');
    await panel.getByLabel('Title').press('Enter');
    await expect(panel.getByRole('alert')).toContainText('A task needs a title');
    await expect(panel.getByLabel('Title')).toHaveValue('Keep me');
  });

  test('changes status from the panel', async ({ page, context }) => {
    await seedTasks(context, [{ title: 'Status me' }]);
    await openBoard(page);
    await card(page, 'Status me').click();
    const saved = nextAction(page);
    await page.locator('aside').getByRole('button', { name: /^Status:/ }).click();
    await page.getByRole('menuitemradio', { name: 'Done' }).click();
    await saved;
    await expect(card(lane(page, 'Done'), 'Status me')).toBeVisible();
    const [row] = await rest(context, 'tasks?select=status');
    expect(row.status).toBe('done');
  });

  test('Escape closes the panel and returns focus to the card', async ({ page, context }) => {
    await seedTasks(context, [{ title: 'Focus me' }]);
    await openBoard(page);
    await card(page, 'Focus me').click();
    await expect(page.locator('aside')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('aside')).toBeHidden();
    await expect(card(page, 'Focus me')).toBeFocused();
  });
});

test.describe('deleting', () => {
  test('asks first, can cancel, and deletes for good', async ({ page, context }) => {
    await seedTasks(context, [{ title: 'Delete me' }]);
    await openBoard(page);
    await card(page, 'Delete me').click();
    const panel = page.locator('aside');

    await panel.getByRole('button', { name: 'Delete task' }).click();
    let confirm = page.getByRole('dialog', { name: 'Delete this task?' });
    await confirm.getByRole('button', { name: 'Cancel' }).click();
    await expect(confirm).toBeHidden();
    await expect(card(page, 'Delete me')).toBeVisible();

    await panel.getByRole('button', { name: 'Delete task' }).click();
    confirm = page.getByRole('dialog', { name: 'Delete this task?' });
    const saved = nextAction(page);
    await confirm.getByRole('button', { name: 'Delete task' }).click();
    await saved;
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Start with one task' })).toBeVisible();
    expect(await rest(context, 'tasks?select=id')).toEqual([]);
  });
});
