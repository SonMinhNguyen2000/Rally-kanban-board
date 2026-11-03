import { expect, test, type Page } from '@playwright/test';
import { assign, card, clearBoard, createGuest, dayFromToday, openBoard, seedLabels, seedMembers, seedTasks, tag, type GuestState } from './helpers';

let guest: GuestState; // One guest per file, because sign-ins are rate limited.
test.beforeAll(async ({ browser }) => {
  guest = await createGuest(browser);
});
test.use({ storageState: async ({}, use) => use(guest) });

const UNBROKEN = 'x'.repeat(200); // The longest title the database allows, with nowhere to wrap.
const LONG_NAME = 'Maximiliana Wolfeschlegelsteinhausenbergerdorff-Featherstonehaugh-Cholmondeley'.slice(0, 80);

/**
 * Lists elements inside the root whose content spills past their right edge.
 * @param page - The page to act on.
 * @param selector - The root element to look inside.
 * @returns A description of each overflowing element.
 */
async function overflowing(page: Page, selector: string) {
  return page.locator(selector).evaluateAll((elements) =>
    elements
      .filter((element) => {
        const box = element.getBoundingClientRect();
        return [...element.querySelectorAll('*')].some((child) => {
          const inner = child.getBoundingClientRect();
          return inner.width > 0 && inner.right > box.right + 1;
        });
      })
      .map((element) => (element.textContent ?? '').slice(0, 40)),
  );
}

/**
 * Whether the page itself has gained a sideways scrollbar.
 * @param page - The page to act on.
 * @returns True if the page is wider than the window.
 */
const pageScrollsSideways = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test.describe('worst-case data', () => {
  test.beforeEach(async ({ context }) => {
    await clearBoard(context);
    const tasks = await seedTasks(context, [
      { title: UNBROKEN, due_date: dayFromToday(-400), priority: 'high' },
      { title: 'Emoji 🦊🧑🏽‍💻🇯🇵 and 日本語のタイトル and العربية', status: 'in_progress' },
      { title: 'a', status: 'in_review' },
      { title: 'Many of everything', priority: 'high', due_date: dayFromToday(1), status: 'done' },
    ]);
    const members = await seedMembers(context, [
      { name: LONG_NAME, color: 'plum' },
      { name: '🦊', color: 'teal' },
      { name: '日本語 名前', color: 'rust' },
      { name: 'A', color: 'moss' },
      { name: 'Bo Li', color: 'azure' },
      { name: 'Ana Ruiz', color: 'rose' },
    ]);
    const labels = await seedLabels(
      context,
      Array.from({ length: 12 }, (_, index) => ({
        name: index === 0 ? 'L'.repeat(50) : `Label number ${index}`,
        color: 'cobalt',
      })),
    );
    await assign(context, tasks[3].id, members.map((m) => m.id));
    await assign(context, tasks[0].id, [members[0].id]);
    await tag(context, tasks[3].id, labels.map((l) => l.id));
  });

  for (const width of [1440, 900, 390]) {
    test(`nothing on a card overflows at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openBoard(page);
      await expect(page.locator('[data-task-id]')).toHaveCount(4);
      expect(await overflowing(page, '[data-task-id]')).toEqual([]);
      expect(await pageScrollsSideways(page)).toBe(false);
    });
  }

  test('an unbroken title is clamped to three lines on the card', async ({ page }) => {
    await openBoard(page);
    const title = page.locator('[data-task-id] h3').filter({ hasText: 'xxxxx' });
    const box = await title.boundingBox();
    expect(box?.height ?? 999).toBeLessThanOrEqual(62);
  });

  test('the panel holds long names and many labels', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openBoard(page);
    await card(page, 'Many of everything').click();
    expect(await overflowing(page, 'aside')).toEqual([]);
    await expect(page.locator('aside')).toContainText(LONG_NAME);
  });

  test('the panel holds an unbroken title', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openBoard(page);
    await card(page, 'xxxxx').click();
    expect(await overflowing(page, 'aside')).toEqual([]);
  });

  test('the team dialog holds a long name', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openBoard(page);
    await page.getByRole('button', { name: 'Team and labels' }).click();
    const dialog = page.getByRole('dialog', { name: 'Team and labels' });
    await expect(dialog.getByLabel('Member name', { exact: true }).first()).toHaveValue(LONG_NAME);
    expect(await overflowing(page, 'dialog[open]')).toEqual([]);
  });

  test('initials render for emoji, non-Latin and one-letter names', async ({ page }) => {
    await openBoard(page);
    const initials = await card(page, 'Many of everything').getByRole('img').allTextContents();
    expect(initials).toHaveLength(3);
    for (const text of initials) expect(text.trim().length).toBeGreaterThan(0);
  });

  test('picks up 40 tasks in a lane and the lane scrolls', async ({ page, context }) => {
    await seedTasks(context, Array.from({ length: 40 }, (_, index) => ({ title: `Bulk task ${index}`, status: 'in_review' })));
    await openBoard(page);
    const cards = page.getByRole('region', { name: 'In Review', exact: true }).locator('ul');
    const metrics = await cards.evaluate((el) => ({ scroll: el.scrollHeight, client: el.clientHeight }));
    expect(metrics.scroll).toBeGreaterThan(metrics.client);
    expect(await pageScrollsSideways(page)).toBe(false);
  });
});
