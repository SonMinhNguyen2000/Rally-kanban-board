import { expect, test, type Page } from '@playwright/test';
import { assign, card, clearBoard, createGuest, nextAction, openBoard, rest, seedLabels, seedMembers, seedTasks, tag, type GuestState } from './helpers';

let guest: GuestState; // One guest per file, because sign-ins are rate limited.
test.beforeAll(async ({ browser }) => {
  guest = await createGuest(browser);
});
test.use({ storageState: async ({}, use) => use(guest) });
test.beforeEach(async ({ context }) => clearBoard(context));

/**
 * Opens the Team and labels dialog.
 * @param page - The page to act on.
 * @returns A locator for the open dialog.
 */
async function openManage(page: Page) {
  await page.getByRole('button', { name: 'Team and labels' }).click();
  return page.getByRole('dialog', { name: 'Team and labels' });
}

test.describe('team and labels', () => {
  test('adds members and labels, with distinct palette names stored', async ({ page, context }) => {
    await openBoard(page);
    const dialog = await openManage(page);
    for (const name of ['Mina Kato', 'Jo Okafor']) {
      await dialog.getByLabel('New member name').fill(name);
      await dialog.getByLabel('New member name').press('Enter');
      await expect(dialog.getByLabel('Member name', { exact: true }).last()).toHaveValue(name);
    }
    await dialog.getByLabel('New label name').fill('Design');
    await dialog.getByLabel('New label name').press('Enter');
    await expect(dialog.getByLabel('Label name', { exact: true }).last()).toHaveValue('Design');

    const members = await rest(context, 'team_members?select=name,color&order=created_at');
    expect(members.map((m: any) => m.name)).toEqual(['Mina Kato', 'Jo Okafor']);
    expect(members[0].color).not.toBe(members[1].color);
  });

  test('a duplicate label shows a clear error and keeps the text', async ({ page, context }) => {
    await seedLabels(context, [{ name: 'Design' }]);
    await openBoard(page);
    const dialog = await openManage(page);
    await dialog.getByLabel('New label name').fill('  design ');
    await dialog.getByLabel('New label name').press('Enter');
    await expect(dialog.getByRole('alert')).toHaveText('That name is already in use. Try a different one.');
    await expect(dialog.getByLabel('New label name')).toHaveValue('  design ');
  });

  test('renames a member and changes a colour', async ({ page, context }) => {
    await seedMembers(context, [{ name: 'Old name', color: 'rose' }]);
    await openBoard(page);
    const dialog = await openManage(page);
    let saved = nextAction(page);
    await dialog.getByLabel('Member name', { exact: true }).fill('New name');
    await dialog.getByLabel('Member name', { exact: true }).press('Enter');
    await saved;
    saved = nextAction(page);
    await dialog.getByRole('button', { name: /Colour for/ }).first().click();
    await page.getByRole('menuitemradio', { name: 'Plum' }).click();
    await saved;
    const [row] = await rest(context, 'team_members?select=name,color');
    expect(row).toEqual({ name: 'New name', color: 'plum' });
  });
});

test.describe('on a task', () => {
  test('assigns several members and labels, shown on the card and persisted', async ({ page, context }) => {
    await seedTasks(context, [{ title: 'Shared work' }]);
    await seedMembers(context, [{ name: 'Mina Kato', color: 'plum' }, { name: 'Jo Okafor', color: 'teal' }]);
    await seedLabels(context, [{ name: 'Design', color: 'cobalt' }, { name: 'Ops', color: 'rose' }]);
    await openBoard(page);
    await card(page, 'Shared work').click();
    const panel = page.locator('aside');

    await panel.getByRole('button', { name: 'Add assignee' }).click();
    for (const name of ['Mina Kato', 'Jo Okafor']) {
      const saved = nextAction(page);
      await page.getByRole('menuitemcheckbox', { name }).click();
      await saved;
    }
    await page.keyboard.press('Escape');
    await panel.getByRole('button', { name: 'Add label' }).click();
    for (const name of ['Design', 'Ops']) {
      const saved = nextAction(page);
      await page.getByRole('menuitemcheckbox', { name }).click();
      await saved;
    }
    await page.keyboard.press('Escape');
    await expect(panel, 'Escape on a menu must keep the panel open').toBeVisible();

    await page.reload();
    const shared = card(page, 'Shared work');
    await expect(shared.getByRole('img', { name: 'Mina Kato' })).toBeVisible();
    await expect(shared.getByRole('img', { name: 'Jo Okafor' })).toBeVisible();
    await expect(shared).toContainText('Design');
    await expect(shared).toContainText('Ops');
  });

  test('avatars on a card collapse to +N after three', async ({ page, context }) => {
    const [task] = await seedTasks(context, [{ title: 'Crowded' }]);
    const members = await seedMembers(context, ['Aa', 'Bb', 'Cc', 'Dd', 'Ee'].map((name) => ({ name })));
    await assign(context, task.id, members.map((m) => m.id));
    await openBoard(page);
    await expect(card(page, 'Crowded').getByRole('img')).toHaveCount(3);
    await expect(card(page, 'Crowded')).toContainText('+2');
  });

  test('deleting a member removes them from tasks and history keeps the name', async ({ page, context }) => {
    const [task] = await seedTasks(context, [{ title: 'Owned' }]);
    const [member] = await seedMembers(context, [{ name: 'Mina Kato' }]);
    await assign(context, task.id, [member.id]);
    await openBoard(page);
    await expect(card(page, 'Owned').getByRole('img', { name: 'Mina Kato' })).toBeVisible();

    const dialog = await openManage(page);
    await dialog.getByRole('button', { name: 'Delete Mina Kato' }).click();
    const saved = nextAction(page);
    await page.getByRole('dialog', { name: 'Delete Mina Kato?' }).getByRole('button', { name: 'Delete member' }).click();
    await saved;
    await page.reload();
    await expect(card(page, 'Owned').getByRole('img')).toHaveCount(0);

    await card(page, 'Owned').click();
    await expect(page.locator('aside')).toContainText('Unassigned Mina Kato');
  });

  test('deleting a label takes it off tasks', async ({ page, context }) => {
    const [task] = await seedTasks(context, [{ title: 'Tagged' }]);
    const [label] = await seedLabels(context, [{ name: 'Temp' }]);
    await tag(context, task.id, [label.id]);
    await openBoard(page);
    await expect(card(page, 'Tagged')).toContainText('Temp');
    const dialog = await openManage(page);
    await dialog.getByRole('button', { name: 'Delete Temp' }).click();
    const saved = nextAction(page);
    await page.getByRole('dialog', { name: 'Delete Temp?' }).getByRole('button', { name: 'Delete label' }).click();
    await saved;
    await page.reload();
    await expect(card(page, 'Tagged')).not.toContainText('Temp');
  });
});
