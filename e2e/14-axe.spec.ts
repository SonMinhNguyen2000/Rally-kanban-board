import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { PALETTE } from '../src/types/palette';
import {
  assign,
  card,
  clearBoard,
  createGuest,
  dayFromToday,
  openBoard,
  rest,
  seedLabels,
  seedMembers,
  seedTasks,
  tag,
  type GuestState,
} from './helpers';

// The standards axe checks against. No rules are excluded.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa'];

// Each lane in board order, for spreading cards out so none are scrolled out of view.
const LANES = ['todo', 'in_progress', 'in_review', 'done'];

let guest: GuestState; // One guest per file, because sign-ins are rate limited.
test.beforeAll(async ({ browser }) => {
  guest = await createGuest(browser);
});
test.use({
  storageState: async ({}, use) => use(guest),
  // Entrances fade, and axe would measure text contrast halfway through one.
  contextOptions: { reducedMotion: 'reduce' },
});
test.beforeEach(async ({ context }) => clearBoard(context));

/**
 * Scans the page and fails with one readable line per violating element.
 * @param page - The page to act on.
 * @returns The full axe results.
 */
async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const violations = results.violations.flatMap((violation) =>
    violation.nodes.map((node) => `${violation.id} (${violation.impact}): ${node.target.join(' ')}\n  ${violation.help}`),
  );
  expect(violations, violations.join('\n')).toEqual([]);
  return results;
}

/**
 * Seeds a board with every kind of content a card can show, and opens it.
 * @param page - The page to act on.
 * @param context - The guest's browser context.
 */
async function openPopulatedBoard(page: Page, context: Parameters<typeof clearBoard>[0]) {
  const [member] = await seedMembers(context, [{ name: 'Mina Kato', color: 'plum' }]);
  const [label] = await seedLabels(context, [{ name: 'Billing', color: 'ochre' }]);
  const [first] = await seedTasks(context, [
    { title: 'Rewrite the billing emails', description: 'Cover refunds.', priority: 'high', due_date: dayFromToday(1) },
    { title: 'Overdue audit', status: 'in_progress', due_date: dayFromToday(-2) },
    { title: 'Low priority note', status: 'in_review', priority: 'low', due_date: dayFromToday(30) },
    { title: 'Finished work', status: 'done' },
  ]);
  await assign(context, first.id, [member.id]);
  await tag(context, first.id, [label.id]);
  await rest(context, 'comments', { method: 'POST', body: [{ task_id: first.id, body: 'Check the wording.' }] });
  await openBoard(page);
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`axe, ${colorScheme} theme`, () => {
    test.use({ colorScheme });

    test('populated board', async ({ page, context }) => {
      await openPopulatedBoard(page, context);
      await expectNoViolations(page);
    });

    test('first-run board', async ({ page }) => {
      await openBoard(page);
      await expect(page.getByRole('heading', { name: 'Start with one task' })).toBeVisible();
      await expectNoViolations(page);
    });

    test('open task panel', async ({ page, context }) => {
      await openPopulatedBoard(page, context);
      await card(page, 'Rewrite the billing emails').click();
      await expect(page.getByText('Created in To Do')).toBeVisible();
      await expectNoViolations(page);
    });

    test('New task dialog', async ({ page }) => {
      await openBoard(page);
      await page.getByRole('button', { name: 'New task' }).first().click();
      await expect(page.getByRole('dialog', { name: 'New task' })).toBeVisible();
      await expectNoViolations(page);
    });

    test('Team and labels dialog', async ({ page, context }) => {
      await openPopulatedBoard(page, context);
      await page.getByRole('button', { name: 'Team and labels' }).click();
      await expect(page.getByRole('dialog', { name: 'Team and labels' })).toBeVisible();
      await expectNoViolations(page);
    });

    test('open picker menu', async ({ page, context }) => {
      await openPopulatedBoard(page, context);
      await page.getByRole('button', { name: 'Label', exact: true }).click();
      await expect(page.getByRole('menu', { name: 'Filter by label' })).toBeVisible();
      await expectNoViolations(page);
    });

    test('no-results board', async ({ page, context }) => {
      await openPopulatedBoard(page, context);
      await page.getByPlaceholder('Search tasks').fill('nothing matches this');
      await expect(page.getByRole('heading', { name: 'No tasks match' })).toBeVisible();
      await expectNoViolations(page);
    });

    test('all ten palette colours, as labels and as members', async ({ page, context }) => {
      const members = await seedMembers(context, PALETTE.map((color) => ({ name: `Person ${color}`, color })));
      const labels = await seedLabels(context, PALETTE.map((color) => ({ name: `Label ${color}`, color })));
      const tasks = await seedTasks(
        context,
        PALETTE.map((color, index) => ({ title: color, status: LANES[index % LANES.length] })),
      );
      for (const [index, task] of tasks.entries()) {
        await assign(context, task.id, [members[index].id]);
        await tag(context, task.id, [labels[index].id]);
      }
      await openBoard(page);
      await expect(page.locator('[data-task-id]')).toHaveCount(PALETTE.length);

      const results = await expectNoViolations(page);
      // The control: a pass only counts if axe really measured every chip and avatar.
      const measured = results.passes.find((rule) => rule.id === 'color-contrast')?.nodes.length ?? 0;
      expect(measured).toBeGreaterThanOrEqual(PALETTE.length * 2);
    });
  });
}
