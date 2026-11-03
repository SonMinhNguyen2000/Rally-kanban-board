import { expect, test } from '@playwright/test';
import { card, clearBoard, createGuest, nextAction, openBoard, rest, seedLabels, seedMembers, seedTasks, sessionOf } from './helpers';

test.describe('two users', () => {
  test('B sees none of A\'s data, and can\'t change it through a server action', async ({ browser }) => {
    const contextA = await browser.newContext({ storageState: await createGuest(browser), baseURL: `http://127.0.0.1:${process.env.E2E_PORT ?? '3000'}` });
    const contextB = await browser.newContext({ storageState: await createGuest(browser), baseURL: `http://127.0.0.1:${process.env.E2E_PORT ?? '3000'}` });
    await clearBoard(contextA);
    await clearBoard(contextB);
    expect((await sessionOf(contextA)).userId).not.toBe((await sessionOf(contextB)).userId);

    const [taskA] = await seedTasks(contextA, [{ title: 'A private task' }]);
    await seedMembers(contextA, [{ name: 'A private member' }]);
    await seedLabels(contextA, [{ name: 'A private label' }]);
    const [taskB] = await seedTasks(contextB, [{ title: 'B own task' }]);

    const pageB = await contextB.newPage();
    await openBoard(pageB);
    await expect(card(pageB, 'B own task')).toBeVisible();
    await expect(pageB.getByText('A private task')).toHaveCount(0);
    await pageB.getByRole('search').getByRole('button', { name: 'Assignee' }).click();
    await expect(pageB.getByText('A private member')).toHaveCount(0);
    await pageB.keyboard.press('Escape');
    await pageB.getByRole('search').getByRole('button', { name: 'Label' }).click();
    await expect(pageB.getByText('A private label')).toHaveCount(0);
    await pageB.keyboard.press('Escape');

    // B renames B's own task, but the request is rewritten in flight to target A's task. This
    // is what a modified client could send, because server actions are public endpoints.
    let rewrote = false;
    await pageB.route('**/board', async (route) => {
      const body = route.request().postData();
      if (route.request().headers()['next-action'] && body?.includes(taskB.id)) {
        rewrote = true;
        await route.continue({ postData: body.replaceAll(taskB.id, taskA.id) });
        return;
      }
      await route.continue();
    });
    await card(pageB, 'B own task').click();
    const panel = pageB.locator('aside');
    const saved = nextAction(pageB);
    await panel.getByLabel('Title').fill('hacked by B');
    await panel.getByLabel('Title').press('Enter');
    await saved;
    expect(rewrote).toBe(true);

    const [after] = await rest(contextA, `tasks?id=eq.${taskA.id}&select=title,user_id`);
    expect(after.title).toBe('A private task');
    expect(after.user_id).toBe((await sessionOf(contextA)).userId);

    // B's view settles back to the truth rather than keeping the false rename.
    await expect(card(pageB, 'B own task')).toBeVisible();

    const pageA = await contextA.newPage();
    await openBoard(pageA);
    await expect(card(pageA, 'A private task')).toBeVisible();
    await expect(pageA.getByText('B own task')).toHaveCount(0);

    await contextA.close();
    await contextB.close();
  });
});
