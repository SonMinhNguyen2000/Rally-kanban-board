import { expect, test } from '@playwright/test';
import { card, clearBoard, createGuest, nextAction, openBoard, rest, seedTasks, type GuestState } from './helpers';

let guest: GuestState; // One guest per file, because sign-ins are rate limited.
test.beforeAll(async ({ browser }) => {
  guest = await createGuest(browser);
});
test.use({ storageState: async ({}, use) => use(guest) });
test.beforeEach(async ({ context }) => clearBoard(context));

test.describe('comments and timeline', () => {
  test('posts comments, updates the card count, and persists', async ({ page }) => {
    await page.goto('/board');
    await page.getByRole('button', { name: 'New task' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'New task' });
    await dialog.getByLabel('Title').fill('Discuss');
    await dialog.getByRole('button', { name: 'Create task' }).click();
    await expect(dialog).toBeHidden();

    await card(page, 'Discuss').click();
    const panel = page.locator('aside');
    await panel.getByLabel('Add a comment').fill('First thought');
    await panel.getByRole('button', { name: 'Comment' }).click();
    await expect(panel.getByText('First thought')).toBeVisible();
    await expect(panel.getByLabel('Add a comment')).toHaveValue('');

    await panel.getByLabel('Add a comment').fill('Second thought');
    await panel.getByLabel('Add a comment').press('Control+Enter');
    await expect(panel.getByText('Second thought')).toBeVisible();

    await expect(card(page, 'Discuss').getByLabel('2 comments')).toBeVisible();
    await page.reload();
    await expect(card(page, 'Discuss').getByLabel('2 comments')).toBeVisible();
    await card(page, 'Discuss').click();
    await expect(page.locator('aside').getByText('First thought')).toBeVisible();
  });

  test('an empty comment cannot be sent', async ({ page, context }) => {
    await seedTasks(context, [{ title: 'Quiet' }]);
    await openBoard(page);
    await card(page, 'Quiet').click();
    const panel = page.locator('aside');
    await expect(panel.getByRole('button', { name: 'Comment' })).toBeDisabled();
    await panel.getByLabel('Add a comment').fill('   ');
    await expect(panel.getByRole('button', { name: 'Comment' })).toBeDisabled();
  });

  test('a comment draft does not follow you to another task', async ({ page, context }) => {
    await seedTasks(context, [{ title: 'One' }]);
    await seedTasks(context, [{ title: 'Two' }]);
    await openBoard(page);
    await card(page, 'One').click();
    await page.locator('aside').getByLabel('Add a comment').fill('For task one');
    await card(page, 'Two').click();
    await expect(page.locator('aside').getByLabel('Title')).toHaveValue('Two');
    await expect(page.locator('aside').getByLabel('Add a comment')).toHaveValue('');
  });

  test('shows history in plain wording, in chronological order', async ({ page, context }) => {
    await seedTasks(context, [{ title: 'History' }]);
    await openBoard(page);
    await card(page, 'History').click();
    const panel = page.locator('aside');
    const timeline = panel.getByRole('region', { name: 'Comments and activity' });

    let saved = nextAction(page);
    await panel.getByRole('button', { name: /^Status:/ }).click();
    await page.getByRole('menuitemradio', { name: 'In Progress' }).click();
    await saved;
    await expect(timeline).toContainText('Moved from To Do → In Progress · just now');

    await panel.getByLabel('Add a comment').fill('Middle comment');
    await panel.getByRole('button', { name: 'Comment' }).click();
    await expect(timeline.getByText('Middle comment')).toBeVisible();

    saved = nextAction(page);
    await panel.getByRole('button', { name: /^Priority:/ }).click();
    await page.getByRole('menuitemradio', { name: 'High' }).click();
    await saved;
    await expect(timeline).toContainText('Changed priority from Normal → High');

    const items = await timeline.getByRole('listitem').allTextContents();
    /**
     * Finds where a timeline row sits.
     * @param text - Text the timeline row contains.
     * @returns The row's index, or -1 if there is none.
     */
    const at = (text: string) => items.findIndex((item) => item.includes(text));
    expect(at('Created in To Do')).toBeGreaterThanOrEqual(0);
    expect(at('Created in To Do')).toBeLessThan(at('Moved from'));
    expect(at('Moved from')).toBeLessThan(at('Middle comment'));
    expect(at('Middle comment')).toBeLessThan(at('Changed priority'));
  });

  test('a deleted comment leaves a note in the timeline and lowers the count', async ({ page, context }) => {
    const [task] = await seedTasks(context, [{ title: 'Retract' }]);
    await rest(context, 'comments', { method: 'POST', body: [{ task_id: task.id, body: 'Oops' }] });
    await openBoard(page);
    await expect(card(page, 'Retract').getByLabel('1 comment')).toBeVisible();
    await card(page, 'Retract').click();
    const panel = page.locator('aside');
    await panel.getByRole('button', { name: 'Delete comment' }).click();
    await expect(panel.getByText('Oops')).toHaveCount(0);
    await expect(panel).toContainText('Left a comment, since deleted');
    await expect(card(page, 'Retract').getByLabel('1 comment')).toHaveCount(0);
  });
});
