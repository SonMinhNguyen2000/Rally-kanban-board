import { expect, test, type Page } from '@playwright/test';
import { assign, card, clearBoard, createGuest, dayFromToday, openBoard, seedLabels, seedMembers, seedTasks, tag, type GuestState } from './helpers';

let guest: GuestState; // One guest per file, because sign-ins are rate limited.
test.beforeAll(async ({ browser }) => {
  guest = await createGuest(browser);
});
test.use({ storageState: async ({}, use) => use(guest) });

/**
 * The titles currently on the board, sorted.
 * @param page - The page to act on.
 * @returns The card titles, sorted.
 */
async function visibleTitles(page: Page) {
  // Cards only, because a notice in an empty lane has a heading too.
  return (await page.getByRole('main', { name: 'Task board' }).locator('[data-task-id] h3').allTextContents()).sort();
}

/**
 * Ticks choices in a filter menu, then closes it.
 * @param page - The page to act on.
 * @param filter - The filter button's name.
 * @param names - The menu choices to tick.
 */
async function choose(page: Page, filter: string, names: string[]) {
  await page.getByRole('search').getByRole('button', { name: filter }).click();
  for (const name of names) await page.getByRole('menuitemcheckbox', { name }).click();
  await page.keyboard.press('Escape');
}

/**
 * The value of one figure in the top bar.
 * @param page - The page to act on.
 * @param name - The figure's label.
 * @returns A locator for the figure's value.
 */
const stat = (page: Page, name: string) =>
  page.getByRole('group', { name: 'Board statistics' }).getByRole('button', { name }).locator('[data-tnum]');

test.describe('filters and stats', () => {
  test.beforeEach(async ({ context, page }) => {
    await clearBoard(context);
    const tasks = await seedTasks(context, [
      { title: 'Fix login', priority: 'high', due_date: dayFromToday(-3) },
      { title: 'Write docs', priority: 'low', due_date: dayFromToday(1), status: 'in_progress' },
      { title: 'Login copy', priority: 'normal', due_date: dayFromToday(30), status: 'in_review' },
      { title: 'Old finished', priority: 'normal', due_date: dayFromToday(-30), status: 'done' },
    ]);
    const [mina, jo] = await seedMembers(context, [{ name: 'Mina', color: 'plum' }, { name: 'Jo', color: 'teal' }]);
    const [design, ops] = await seedLabels(context, [{ name: 'Design', color: 'cobalt' }, { name: 'Ops', color: 'rose' }]);
    await assign(context, tasks[0].id, [mina.id]);
    await assign(context, tasks[1].id, [jo.id]);
    await tag(context, tasks[0].id, [design.id]);
    await tag(context, tasks[2].id, [ops.id]);
    await openBoard(page);
    await expect(card(page, 'Fix login')).toBeVisible();
  });

  test('search matches titles ignoring case', async ({ page }) => {
    await page.getByRole('searchbox').fill('LOGIN');
    expect(await visibleTitles(page)).toEqual(['Fix login', 'Login copy']);
  });

  test('filters by priority', async ({ page }) => {
    await choose(page, 'Priority', ['High', 'Low']);
    expect(await visibleTitles(page)).toEqual(['Fix login', 'Write docs']);
  });

  test('filters by assignee', async ({ page }) => {
    await choose(page, 'Assignee', ['Jo']);
    expect(await visibleTitles(page)).toEqual(['Write docs']);
  });

  test('filters by label and shows a removable chip', async ({ page }) => {
    await choose(page, 'Label', ['Ops']);
    expect(await visibleTitles(page)).toEqual(['Login copy']);
    await page.getByRole('search').getByRole('button', { name: 'Remove Ops' }).click();
    expect(await visibleTitles(page)).toHaveLength(4);
  });

  test('combines filters, narrowing across them', async ({ page }) => {
    await page.getByRole('searchbox').fill('login');
    await choose(page, 'Priority', ['High']);
    expect(await visibleTitles(page)).toEqual(['Fix login']);
    await choose(page, 'Label', ['Ops']);
    expect(await visibleTitles(page)).toEqual([]);
  });

  test('shows a no-results state that clears the filters', async ({ page }) => {
    await page.getByRole('searchbox').fill('zzz nothing');
    await expect(page.getByRole('heading', { name: 'No tasks match' })).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page.getByRole('searchbox')).toHaveValue('');
    expect(await visibleTitles(page)).toHaveLength(4);
  });

  test('stats count the whole board, whatever the filters show', async ({ page }) => {
    await expect(stat(page, 'task')).toHaveText('4');
    await expect(stat(page, 'completed')).toHaveText('1');
    await expect(stat(page, 'overdue')).toHaveText('1');
    await page.getByRole('searchbox').fill('docs');
    await expect(stat(page, 'task')).toHaveText('4');
  });

  test('the stats show their tasks on the board, and pressing one again shows all', async ({ page }) => {
    const button = (name: string) => page.getByRole('group', { name: 'Board statistics' }).getByRole('button', { name });
    const cards = page.locator('[data-task-id]');
    await expect(cards).toHaveCount(4);
    await button('overdue').click();
    await expect(button('overdue')).toHaveAttribute('aria-pressed', 'true');
    await expect(cards).toHaveCount(1);
    await button('completed').click();
    await expect(cards).toHaveCount(1);
    await button('completed').click();
    await expect(button('task')).toHaveAttribute('aria-pressed', 'true');
    await expect(cards).toHaveCount(4);
  });

  test('flags overdue and due soon, and never flags finished work', async ({ page }) => {
    await expect(card(page, 'Fix login')).toContainText('Overdue 3d');
    await expect(card(page, 'Write docs')).toContainText('Due tomorrow');
    await expect(card(page, 'Login copy')).not.toContainText(/Due |Overdue/);
    await expect(card(page, 'Old finished')).not.toContainText('Overdue');
  });

  test('the overdue and due soon states are distinct colours', async ({ page }) => {
    /**
     * Reads the background colour of a due chip.
     * @param title - The card's title.
     * @param text - The chip's text.
     * @returns The chip's computed background colour.
     */
    const colour = (title: string, text: RegExp) =>
      card(page, title).getByText(text).evaluate((el) => getComputedStyle(el).backgroundColor);
    const overdue = await colour('Fix login', /Overdue/);
    const soon = await colour('Write docs', /Due tomorrow/);
    expect(overdue).not.toBe(soon);
    expect(overdue).not.toBe('rgba(0, 0, 0, 0)');
  });
});
