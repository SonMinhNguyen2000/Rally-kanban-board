import { expect, test } from '@playwright/test';
import { createGuest, openBoard, SUPABASE_URL, watchErrors, type GuestState } from './helpers';

let guest: GuestState; // One guest per file, because sign-ins are rate limited.
test.beforeAll(async ({ browser }) => {
  guest = await createGuest(browser);
});
test.use({ storageState: async ({}, use) => use(guest) });

test.describe('theme', () => {
  test('a saved theme causes no hydration warning', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('rally-theme', 'dark'));
    const errors = watchErrors(page);
    await openBoard(page);
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('the theme menu selects and remembers system, light and dark', async ({ page }) => {
    await openBoard(page);
    const html = page.locator('html');
    await page.getByRole('button', { name: 'Theme: system' }).click();
    await page.getByRole('menuitemradio', { name: 'Light' }).click();
    await expect(html).toHaveAttribute('data-theme', 'light');
    await page.getByRole('button', { name: 'Theme: light' }).click();
    await page.getByRole('menuitemradio', { name: 'Dark' }).click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('button', { name: 'Theme: dark' }).click();
    await page.getByRole('menuitemradio', { name: 'System' }).click();
    await expect(html).toHaveAttribute('data-theme', 'light');
    expect(await page.evaluate(() => localStorage.getItem('rally-theme'))).toBe('system');
  });

  test('follows the system with no saved choice', async ({ browser }) => {
    const context = await browser.newContext({ storageState: guest, colorScheme: 'dark', baseURL: `http://127.0.0.1:${process.env.E2E_PORT ?? '3000'}` });
    const page = await context.newPage();
    await openBoard(page);
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(16, 19, 43)');
    await context.close();
  });
});

test.describe('font', () => {
  test('is served from the same origin, with no third-party requests', async ({ page }) => {
    const urls: string[] = []; // Every URL the page asks for.
    page.on('request', (request) => urls.push(request.url()));
    await openBoard(page);
    await page.waitForLoadState('networkidle');

    const fonts = urls.filter((url) => /\.(woff2?|ttf|otf)(\?|$)/.test(url));
    expect(fonts.length).toBeGreaterThan(0);
    for (const url of fonts) expect(url.startsWith(`http://127.0.0.1:${process.env.E2E_PORT ?? '3000'}/`)).toBe(true);

    const allowed = [`http://127.0.0.1:${process.env.E2E_PORT ?? '3000'}/`, SUPABASE_URL, SUPABASE_URL.replace('http', 'ws')];
    const thirdParty = urls.filter((url) => !allowed.some((origin) => url.startsWith(origin)) && !url.startsWith('data:'));
    expect(thirdParty).toEqual([]);

    expect(await page.evaluate(() => document.fonts.check('14px "Schibsted Grotesk Variable"'))).toBe(true);
    const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(family).toContain('Schibsted Grotesk Variable');
  });
});
