import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { assign, card, clearBoard, createGuest, dayFromToday, lane, openBoard, rest, seedLabels, seedMembers, seedTasks, tag, type GuestState } from './helpers';

let guest: GuestState; // One guest per file, because sign-ins are rate limited.
test.beforeAll(async ({ browser }) => {
  guest = await createGuest(browser);
});

const SHOTS = 'test-results/screenshots'; // Generated for review, and not committed.

/**
 * A believable board, so the screenshots show real hierarchy. All names are invented.
 * @param context - The guest's browser context.
 */
async function seedRealistic(context: BrowserContext) {
  await clearBoard(context);
  const [mina, jo, tala, sam] = await seedMembers(context, [
    { name: 'Mina Kato', color: 'plum' },
    { name: 'Jo Okafor', color: 'teal' },
    { name: 'Tala Aziz', color: 'rust' },
    { name: 'Sam Rivera', color: 'cobalt' },
  ]);
  const [design, ops, docs, billing] = await seedLabels(context, [
    { name: 'Design', color: 'cobalt' },
    { name: 'Ops', color: 'rose' },
    { name: 'Docs', color: 'moss' },
    { name: 'Billing', color: 'ochre' },
  ]);
  /**
   * Creates a task with its assignees and labels.
   * @param task - The task fields.
   * @param members - The members to assign.
   * @param labels - The labels to add.
   * @returns The created task row.
   */
  const add = async (task: Record<string, unknown>, members: any[] = [], labels: any[] = []) => {
    const [row] = await seedTasks(context, [task]);
    if (members.length) await assign(context, row.id, members.map((m) => m.id));
    if (labels.length) await tag(context, row.id, labels.map((l) => l.id));
    return row;
  };
  await add({ title: 'Draft onboarding checklist for new contractors', due_date: dayFromToday(1) }, [mina], [ops, docs]);
  await add({ title: 'Renew SSL certificate' });
  await add({ title: 'Reconcile the Q3 vendor invoices against the purchase ledger before the audit window closes', priority: 'high', due_date: dayFromToday(-2) }, [jo, tala], [billing]);
  await add({ title: 'Plan the January offsite', priority: 'low', due_date: dayFromToday(40) }, [sam]);
  const rewrite = await add({ title: 'Rewrite the billing email templates', status: 'in_progress', due_date: dayFromToday(12), description: 'Cover failed payments, renewals and refunds. Keep the tone plain.' }, [jo], [billing]);
  await add({ title: 'Audit colour contrast on settings', status: 'in_progress', priority: 'high' }, [mina, sam, tala, jo], [design]);
  await add({ title: 'Review the new pricing page copy', status: 'in_review', due_date: dayFromToday(0) }, [tala], [design, docs]);
  await add({ title: 'Move the status page to its own domain', status: 'done' }, [tala], [ops]);
  await add({ title: 'Archive the 2024 support macros', status: 'done', due_date: dayFromToday(-20) });
  await rest(context, 'comments', { method: 'POST', body: [{ task_id: rewrite.id, body: 'Finance wants the refund wording checked before this ships.' }] });
  await rest(context, `tasks?id=eq.${rewrite.id}`, { method: 'PATCH', body: { status: 'in_review' } });
  await rest(context, `tasks?id=eq.${rewrite.id}`, { method: 'PATCH', body: { status: 'in_progress', priority: 'high' } });
}

/**
 * Lets entrance animations finish so a screenshot doesn't catch them midway.
 * @param page - The page to act on.
 * @returns A promise that resolves once the wait is over.
 */
const settle = (page: Page) => page.waitForTimeout(450);

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} theme`, () => {
    test.use({ storageState: async ({}, use) => use(guest), colorScheme: scheme });

    test('all screens', async ({ page, context }) => {
      test.setTimeout(120_000);
      await seedRealistic(context);

      for (const [width, height] of [[1440, 900], [900, 800], [390, 844]] as const) {
        await page.setViewportSize({ width, height });
        await openBoard(page);
        await expect(card(page, 'Renew SSL certificate')).toBeVisible();
        await settle(page);
        await page.screenshot({ path: `${SHOTS}/app-board-${width}-${scheme}.png` });

        await card(page, 'Rewrite the billing email templates').scrollIntoViewIfNeeded();
        await card(page, 'Rewrite the billing email templates').click();
        await expect(page.locator('aside')).toContainText('Moved from');
        await settle(page);
        await page.screenshot({ path: `${SHOTS}/app-panel-${width}-${scheme}.png` });
        await page.keyboard.press('Escape');

        await page.getByRole('button', { name: 'New task' }).first().click();
        await settle(page);
        await page.screenshot({ path: `${SHOTS}/app-dialog-${width}-${scheme}.png` });
        await page.keyboard.press('Escape');
      }

      // Dragging, mid-air over another lane.
      await page.setViewportSize({ width: 1440, height: 900 });
      await openBoard(page);
      const from = await card(page, 'Renew SSL certificate').boundingBox();
      const to = await lane(page, 'In Review').boundingBox();
      if (!from || !to) throw new Error('Nothing to drag');
      await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
      await page.mouse.down();
      await page.mouse.move(from.x + from.width / 2 + 10, from.y + 30, { steps: 4 });
      await page.mouse.move(to.x + to.width / 2, to.y + 200, { steps: 14 });
      await settle(page);
      await page.screenshot({ path: `${SHOTS}/app-dragging-1440-${scheme}.png` });
      await page.keyboard.press('Escape');
      await page.mouse.up();

      // Team dialog with content.
      await page.getByRole('button', { name: 'Team and labels' }).click();
      await settle(page);
      await page.screenshot({ path: `${SHOTS}/app-manage-1440-${scheme}.png` });
      await page.keyboard.press('Escape');

      // A filter menu open with one choice set.
      await page.getByRole('search').getByRole('button', { name: 'Label' }).click();
      await page.getByRole('menuitemcheckbox', { name: 'Billing' }).click();
      await settle(page);
      await page.screenshot({ path: `${SHOTS}/app-filter-1440-${scheme}.png` });
      await page.keyboard.press('Escape');

      // No results.
      await page.getByRole('searchbox').fill('zzz');
      await settle(page);
      await page.screenshot({ path: `${SHOTS}/app-noresults-1440-${scheme}.png` });

      // First run.
      await clearBoard(context);
      await openBoard(page);
      await settle(page);
      await page.screenshot({ path: `${SHOTS}/app-firstrun-1440-${scheme}.png` });

      // Failure screen.
      await page.route('**/rest/v1/tasks*', (route) => route.abort('failed'));
      await page.goto('/board');
      await expect(page.getByRole('heading', { name: 'Can’t reach your board' })).toBeVisible({ timeout: 40_000 });
      await page.screenshot({ path: `${SHOTS}/app-failure-1440-${scheme}.png` });
    });

    test('worst case', async ({ page, context }) => {
      await clearBoard(context);
      const members = await seedMembers(context, [
        { name: 'Maximiliana Wolfeschlegelsteinhausenbergerdorff-Featherstonehaugh', color: 'plum' },
        { name: '🦊', color: 'teal' },
        { name: '日本語 名前', color: 'rust' },
        { name: 'A', color: 'moss' },
        { name: 'Bo Li', color: 'azure' },
      ]);
      const labels = await seedLabels(context, Array.from({ length: 10 }, (_, index) => ({
        name: index === 0 ? 'L'.repeat(50) : `Label number ${index}`,
        color: (['cobalt', 'rose', 'moss', 'ochre', 'plum'] as const)[index % 5],
      })));
      const [crowded, unbroken] = await seedTasks(context, [
        { title: 'Many of everything on one card', priority: 'high', due_date: dayFromToday(-400) },
        { title: 'x'.repeat(200), status: 'in_progress' },
        { title: 'Emoji 🦊🧑🏽‍💻🇯🇵 and 日本語のタイトル', status: 'in_review' },
      ]);
      await assign(context, crowded.id, members.map((m) => m.id));
      await assign(context, unbroken.id, [members[0].id]);
      await tag(context, crowded.id, labels.map((l) => l.id));

      await page.setViewportSize({ width: 1440, height: 900 });
      await openBoard(page);
      await settle(page);
      await page.screenshot({ path: `${SHOTS}/app-worstcase-1440-${scheme}.png` });
      await card(page, 'Many of everything').click();
      await settle(page);
      await page.screenshot({ path: `${SHOTS}/app-worstcase-panel-1440-${scheme}.png` });
    });
  });
}
