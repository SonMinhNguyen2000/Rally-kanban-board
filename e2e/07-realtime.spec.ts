import { expect, test, type Page } from '@playwright/test';
import { card, clearBoard, createGuest, dragTo, lane, nextAction, openBoard, seedTasks, type GuestState } from './helpers';

let guest: GuestState; // One guest per file, because sign-ins are rate limited.
test.beforeAll(async ({ browser }) => {
  guest = await createGuest(browser);
});
test.use({ storageState: async ({}, use) => use(guest) });
test.beforeEach(async ({ context }) => clearBoard(context));

/**
 * Opens a page and waits until its Realtime listener has reported ready.
 * @param page - The page to act on.
 */
async function openListening(page: Page) {
  const ready = page.waitForEvent('websocket', { timeout: 15_000 }).then(
    (socket) =>
      new Promise<void>((resolve) => {
        socket.on('framereceived', (frame) => {
          if (String(frame.payload).includes('Subscribed to PostgreSQL')) resolve();
        });
      }),
  );
  await openBoard(page);
  await ready;
}

test.describe('realtime', () => {
  test('a task created in one tab appears in another without a reload', async ({ page, context }) => {
    const other = await context.newPage();
    await openListening(other);
    await openBoard(page);
    await page.getByRole('button', { name: 'New task' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'New task' });
    await dialog.getByLabel('Title').fill('From the first tab');
    await dialog.getByRole('button', { name: 'Create task' }).click();
    await expect(card(other, 'From the first tab')).toBeVisible({ timeout: 15_000 });
  });

  test('a move in one tab shows in another, and a delete too', async ({ page, context }) => {
    await seedTasks(context, [{ title: 'Traveller' }]);
    const other = await context.newPage();
    await openListening(other);
    await openBoard(page);

    await dragTo(page, card(page, 'Traveller'), lane(page, 'Done'));
    let saved = nextAction(page);
    await page.mouse.up();
    await saved;
    await expect(card(lane(other, 'Done'), 'Traveller')).toBeVisible({ timeout: 15_000 });

    await card(page, 'Traveller').click();
    await page.locator('aside').getByRole('button', { name: 'Delete task' }).click();
    saved = nextAction(page);
    await page.getByRole('dialog', { name: 'Delete this task?' }).getByRole('button', { name: 'Delete task' }).click();
    await saved;
    await expect(card(other, 'Traveller')).toHaveCount(0, { timeout: 15_000 });
  });

  test('an open panel updates its timeline from another tab', async ({ page, context }) => {
    await seedTasks(context, [{ title: 'Watched' }]);
    const other = await context.newPage();
    await openListening(other);
    await card(other, 'Watched').click();
    await openBoard(page);
    await card(page, 'Watched').click();
    const panel = page.locator('aside');
    await panel.getByLabel('Add a comment').fill('Hello from tab one');
    await panel.getByRole('button', { name: 'Comment' }).click();
    await expect(other.locator('aside').getByText('Hello from tab one')).toBeVisible({ timeout: 15_000 });
  });
});
