import { expect, test, type Page } from '@playwright/test';
import { card, clearBoard, createGuest, openBoard, seedTasks, type GuestState } from './helpers';

let guest: GuestState; // One guest per file, because sign-ins are rate limited.
test.beforeAll(async ({ browser }) => {
  guest = await createGuest(browser);
});
test.use({ storageState: async ({}, use) => use(guest) });
test.beforeEach(async ({ context }) => clearBoard(context));

/**
 * Lists controls with no accessible name. A small stand-in for a full audit tool.
 * @param page - The page to act on.
 * @returns A description of each unnamed control.
 */
async function unnamedControls(page: Page) {
  return page.locator('button, input, textarea, select, a[href]').evaluateAll((elements) =>
    elements
      .filter((element) => {
        const el = element as HTMLInputElement;
        const named =
          el.getAttribute('aria-label') ||
          el.getAttribute('aria-labelledby') ||
          el.getAttribute('title') ||
          (el.textContent ?? '').trim() ||
          (el.labels && el.labels.length > 0);
        return !named;
      })
      .map((element) => element.outerHTML.slice(0, 120)),
  );
}

test.describe('keyboard and accessibility', () => {
  test('every control has a name: board, panel and dialogs', async ({ page, context }) => {
    await seedTasks(context, [{ title: 'Named' }]);
    await openBoard(page);
    expect(await unnamedControls(page)).toEqual([]);
    await card(page, 'Named').click();
    expect(await unnamedControls(page)).toEqual([]);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'New task' }).first().click();
    expect(await unnamedControls(page)).toEqual([]);
  });

  test('tab order reaches the top bar, filters, lanes and cards', async ({ page, context }) => {
    await seedTasks(context, [{ title: 'Reachable' }]);
    await openBoard(page);
    const seen: string[] = []; // What focus lands on, in order.
    for (let index = 0; index < 14; index += 1) {
      await page.keyboard.press('Tab');
      seen.push(
        await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          return el?.getAttribute('aria-label') ?? el?.getAttribute('data-task-id') ?? el?.textContent ?? '';
        }),
      );
    }
    expect(seen.some((name) => /Theme/.test(name))).toBe(true);
    expect(seen.some((name) => /New task/.test(name))).toBe(true);
    expect(seen.some((name) => /Add a task to To Do/.test(name))).toBe(true);
    const cardId = await card(page, 'Reachable').getAttribute('data-task-id');
    expect(seen).toContain(cardId);
  });

  test('focus is visible on a card, a toolbar button and a field', async ({ page, context }) => {
    await seedTasks(context, [{ title: 'Ringed' }]);
    await openBoard(page);
    await card(page, 'Ringed').focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    const ring = await card(page, 'Ringed').evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(ring).toBe('solid');

    await page.getByRole('searchbox').focus();
    const frame = await page.getByRole('searchbox').evaluate((el) => {
      const label = el.closest('label') as HTMLElement;
      const style = getComputedStyle(label);
      return `${style.outlineStyle} ${style.borderColor}`;
    });
    expect(frame.startsWith('solid')).toBe(true);
  });

  test('DEFECT: a menu opened by keyboard takes focus, supports arrows and Escape, and returns focus', async ({ page, context }) => {
    await seedTasks(context, [{ title: 'Menu' }]);
    await openBoard(page);
    const trigger = page.getByRole('search').getByRole('button', { name: 'Priority' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitemcheckbox', { name: 'High' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitemcheckbox', { name: 'Normal' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('DEFECT: the New task dialog puts focus on its title field', async ({ page }) => {
    await openBoard(page);
    await page.getByRole('button', { name: 'New task' }).first().click();
    await expect(page.getByRole('dialog', { name: 'New task' }).getByLabel('Title')).toBeFocused();
  });

  test('a dialog traps focus, closes on Escape and returns focus', async ({ page, context }) => {
    await seedTasks(context, [{ title: 'Trap' }]);
    await openBoard(page);
    const opener = page.getByRole('button', { name: 'New task' }).first();
    await opener.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'New task' });
    await expect(dialog).toBeVisible();
    for (let index = 0; index < 20; index += 1) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(
        () => document.activeElement === document.body || Boolean(document.activeElement?.closest('dialog')),
      );
      expect(inside).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('the panel moves focus inside when it opens', async ({ page, context }) => {
    await seedTasks(context, [{ title: 'Panel focus' }]);
    await openBoard(page);
    await card(page, 'Panel focus').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('aside').getByRole('button', { name: 'Close panel' })).toBeFocused();
  });

  test('DEFECT: on small screens, focus cannot reach the board behind the open panel', async ({ page, context }) => {
    await seedTasks(context, [{ title: 'Behind' }]);
    await page.setViewportSize({ width: 390, height: 844 });
    await openBoard(page);
    await card(page, 'Behind').click();
    await expect(page.locator('aside')).toBeVisible();
    for (let index = 0; index < 25; index += 1) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(
        () => document.activeElement === document.body || Boolean(document.activeElement?.closest('aside')),
      );
      expect(inside, 'focus escaped the panel onto the covered board').toBe(true);
    }
  });

  test('touch targets reach 44px on a coarse pointer', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: guest,
      hasTouch: true,
      isMobile: true,
      viewport: { width: 390, height: 844 },
      baseURL: `http://127.0.0.1:${process.env.E2E_PORT ?? '3000'}`,
    });
    const page = await context.newPage();
    await openBoard(page);
    const small = await page.locator('button').evaluateAll((buttons) =>
      buttons
        .filter((button) => {
          const box = button.getBoundingClientRect();
          return box.width > 0 && (box.height < 44 || box.width < 44);
        })
        .map((button) => button.getAttribute('aria-label') ?? button.textContent),
    );
    expect(small).toEqual([]);
    await context.close();
  });

  test('reduced motion removes the panel slide', async ({ browser, }) => {
    const context = await browser.newContext({ storageState: guest, reducedMotion: 'reduce', baseURL: `http://127.0.0.1:${process.env.E2E_PORT ?? '3000'}` });
    await seedTasks(context, [{ title: 'Still' }]);
    const page = await context.newPage();
    await openBoard(page);
    await card(page, 'Still').click();
    const duration = await page.locator('aside').evaluate((el) => getComputedStyle(el).animationDuration);
    expect(parseFloat(duration)).toBeLessThanOrEqual(0.001);
    await context.close();
  });
});
