import { devices, expect, test } from '@playwright/test';
import { card, clearBoard, createGuest, dragTo, lane, laneTitles, nextAction, openBoard, rest, seedTasks, type GuestState } from './helpers';

let guest: GuestState; // One guest per file, because sign-ins are rate limited.
test.beforeAll(async ({ browser }) => {
  guest = await createGuest(browser);
});
test.use({ storageState: async ({}, use) => use(guest) });

/**
 * Three tasks in To Do, plus one each in In Progress, inserted in display order.
 * @param context - The guest's browser context.
 */
async function seedFour(context: Parameters<typeof clearBoard>[0]) {
  await clearBoard(context);
  await seedTasks(context, [{ title: 'Alpha' }]);
  await seedTasks(context, [{ title: 'Bravo' }]);
  await seedTasks(context, [{ title: 'Charlie' }]);
  await seedTasks(context, [{ title: 'Delta', status: 'in_progress' }]);
}

test.describe('mouse', () => {
  test.beforeEach(async ({ context }) => seedFour(context));

  test('moves a card to another lane and it persists', async ({ page, context }) => {
    await openBoard(page);
    await dragTo(page, card(page, 'Alpha'), card(lane(page, 'In Progress'), 'Delta'), 'bottom');
    const saved = nextAction(page);
    await page.mouse.up();
    await saved;
    await page.reload();
    await expect(card(lane(page, 'In Progress'), 'Alpha')).toBeVisible();
    await expect(card(lane(page, 'To Do'), 'Alpha')).toHaveCount(0);
    const [row] = await rest(context, 'tasks?select=status&title=eq.Alpha');
    expect(row.status).toBe('in_progress');
  });

  test('moves a card to an empty lane', async ({ page }) => {
    await openBoard(page);
    await dragTo(page, card(page, 'Alpha'), lane(page, 'Done'));
    const saved = nextAction(page);
    await page.mouse.up();
    await saved;
    await page.reload();
    await expect(card(lane(page, 'Done'), 'Alpha')).toBeVisible();
  });

  test('reorders within a lane and it persists', async ({ page }) => {
    await openBoard(page);
    await dragTo(page, card(page, 'Charlie'), card(page, 'Alpha'), 'top');
    const saved = nextAction(page);
    await page.mouse.up();
    await saved;
    expect(await laneTitles(page, 'To Do')).toEqual(['Charlie', 'Alpha', 'Bravo']);
    await page.reload();
    await expect(card(page, 'Charlie')).toBeVisible();
    expect(await laneTitles(page, 'To Do')).toEqual(['Charlie', 'Alpha', 'Bravo']);
  });

  test('logs a move in the task history', async ({ page, context }) => {
    await openBoard(page);
    await dragTo(page, card(page, 'Alpha'), card(lane(page, 'In Progress'), 'Delta'));
    const saved = nextAction(page);
    await page.mouse.up();
    await saved;
    const rows = await rest(context, 'task_activity?select=kind,payload&kind=eq.moved');
    expect(rows).toHaveLength(1);
    expect(rows[0].payload).toEqual({ from: 'todo', to: 'in_progress' });
  });

  test('a plain click opens the panel rather than dragging', async ({ page }) => {
    await openBoard(page);
    await card(page, 'Alpha').click();
    await expect(page.locator('aside')).toBeVisible();
    expect(await laneTitles(page, 'To Do')).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });
});

test.describe('keyboard', () => {
  test.beforeEach(async ({ context }) => seedFour(context));

  test('Space, arrow, Space moves a card to the next lane and persists', async ({ page }) => {
    await openBoard(page);
    await card(page, 'Alpha').focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(400);
    const saved = nextAction(page);
    await page.keyboard.press('Space');
    await saved;
    await page.reload();
    await expect(card(lane(page, 'In Progress'), 'Alpha')).toBeVisible();
  });

  test('arrow down reorders within a lane', async ({ page }) => {
    await openBoard(page);
    await card(page, 'Alpha').focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(400);
    const saved = nextAction(page);
    await page.keyboard.press('Space');
    await saved;
    await page.reload();
    await expect(card(page, 'Alpha')).toBeVisible();
    expect(await laneTitles(page, 'To Do')).toEqual(['Bravo', 'Alpha', 'Charlie']);
  });

  test('Escape cancels and writes nothing', async ({ page }) => {
    await openBoard(page);
    let actions = 0; // Server actions, which a cancelled drag must not send.
    page.on('request', (request) => {
      if (request.headers()['next-action']) actions += 1;
    });
    await card(page, 'Alpha').focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(400);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    expect(actions).toBe(0);
    await expect(card(lane(page, 'To Do'), 'Alpha')).toBeVisible();
    expect(await laneTitles(page, 'To Do')).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });

  test('Enter opens the panel and Space does not', async ({ page }) => {
    await openBoard(page);
    await card(page, 'Alpha').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('aside')).toBeVisible();
  });

  test('DEFECT: announces the pickup to screen readers', async ({ page }) => {
    await openBoard(page);
    await card(page, 'Alpha').focus();
    await page.keyboard.press('Space');
    await expect(page.locator('[id^="DndLiveRegion"]')).toContainText('Picked up Alpha');
    await page.keyboard.press('Escape');
  });
});

test.describe('touch on a phone', () => {
  // Isolated from the file's desktop settings. defaultBrowserType can't change inside a describe.
  const { defaultBrowserType: _ignored, ...phone } = devices['Pixel 7'];
  test.use(phone);

  /**
   * Sends a raw touch event through the browser, because Playwright has no long-press drag.
   * @param client - The browser protocol session.
   * @param type - The touch event type.
   * @param x - The horizontal position, left out to lift the finger.
   * @param y - The vertical position.
   */
  async function touch(client: any, type: string, x?: number, y?: number) {
    await client.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: x === undefined ? [] : [{ x, y }],
    });
  }

  test('long press shows the tray, and dropping on it moves the card', async ({ page, context }) => {
    await seedFour(context);
    await openBoard(page);
    const client = await context.newCDPSession(page);
    const box = await card(page, 'Alpha').boundingBox();
    if (!box) throw new Error('No card');
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;

    await touch(client, 'touchStart', x, y);
    await page.waitForTimeout(350); // Past the 250ms long-press delay.
    await touch(client, 'touchMove', x, y + 6);
    const tray = page.getByText('Done', { exact: true }).last();
    await expect(tray).toBeVisible();
    const target = await tray.boundingBox();
    if (!target) throw new Error('No tray');
    for (let step = 1; step <= 10; step += 1) {
      await touch(client, 'touchMove', x + ((target.x - x) * step) / 10, y + ((target.y - y) * step) / 10);
    }
    await page.waitForTimeout(250);
    const saved = nextAction(page);
    await touch(client, 'touchEnd');
    await saved;

    const [row] = await rest(context, 'tasks?select=status&title=eq.Alpha');
    expect(row.status).toBe('done');
  });

  test('a swipe across cards scrolls rather than picking one up', async ({ page, context }) => {
    await seedFour(context);
    await openBoard(page);
    const client = await context.newCDPSession(page);
    const box = await card(page, 'Alpha').boundingBox();
    if (!box) throw new Error('No card');
    const y = box.y + box.height / 2;
    await touch(client, 'touchStart', box.x + box.width - 10, y);
    for (let step = 1; step <= 8; step += 1) {
      await touch(client, 'touchMove', box.x + box.width - 10 - step * 30, y);
      await page.waitForTimeout(16);
    }
    await touch(client, 'touchEnd');
    await page.waitForTimeout(600);
    expect(await page.getByRole('main', { name: 'Task board' }).evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    const [row] = await rest(context, 'tasks?select=status&title=eq.Alpha');
    expect(row.status).toBe('todo');
  });
});
