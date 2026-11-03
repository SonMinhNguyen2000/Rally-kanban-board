import { expect, type Browser, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Local stack settings, read the same way Next.js does. Seeding goes straight to PostgREST.
const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.includes('='))
    .map((line) => {
      const at = line.indexOf('=');
      return [line.slice(0, at), line.slice(at + 1).replace(/^"|"$/g, '')];
    }),
);
export const SUPABASE_URL: string = env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLISHABLE_KEY: string = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!/127\.0\.0\.1|localhost/.test(SUPABASE_URL)) throw new Error('e2e only runs against a local stack');

/** The saved browser state of a guest. */
export type GuestState = Awaited<ReturnType<BrowserContext['storageState']>>;

/**
 * Starts a new anonymous guest through the real app and returns their browser state.
 * @param browser - The browser to create it in.
 * @returns The guest's saved browser state.
 */
export async function createGuest(browser: Browser): Promise<GuestState> {
  const context = await browser.newContext({ baseURL: `http://127.0.0.1:${process.env.E2E_PORT ?? '3000'}` });
  const page = await context.newPage();
  await page.goto('/board');
  await expect(page.getByRole('main', { name: 'Task board' })).toBeVisible();
  const state = await context.storageState();
  await context.close();
  return state;
}

/**
 * Decodes the guest's JWT and user id from the Supabase session cookie, which may be chunked.
 * @param context - The guest's browser context.
 * @returns The guest's access token and user id.
 */
export async function sessionOf(context: BrowserContext): Promise<{ token: string; userId: string }> {
  const cookies = (await context.cookies())
    .filter((cookie) => /^sb-.*-auth-token(\.\d+)?$/.test(cookie.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  if (cookies.length === 0) throw new Error('No Supabase session cookie');
  const raw = cookies.map((cookie) => decodeURIComponent(cookie.value)).join('');
  const session = JSON.parse(Buffer.from(raw.replace(/^base64-/, ''), 'base64url').toString('utf8'));
  return { token: session.access_token, userId: session.user.id };
}

/**
 * Calls PostgREST as the guest. Seeds and cleans up without going through the UI.
 * @param context - The guest's browser context.
 * @param path - The PostgREST path and query.
 * @param init - The HTTP method and JSON body.
 * @returns The parsed response, or null if it was empty.
 */
export async function rest(
  context: BrowserContext,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<any> {
  const { token } = await sessionOf(context);
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: init.method ?? 'GET',
    headers: {
      apikey: PUBLISHABLE_KEY,
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      prefer: 'return=representation',
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${path}: ${response.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

/**
 * Removes everything the guest owns, so each test starts from an empty board.
 * @param context - The guest's browser context.
 */
export async function clearBoard(context: BrowserContext) {
  await rest(context, 'tasks?id=not.is.null', { method: 'DELETE' });
  await rest(context, 'team_members?id=not.is.null', { method: 'DELETE' });
  await rest(context, 'labels?id=not.is.null', { method: 'DELETE' });
}

/**
 * Inserts tasks directly, returning the rows. One request each, because the position trigger
 * can't see other rows from its own statement, and PostgREST needs matching keys in a batch.
 * @param context - The guest's browser context.
 * @param tasks - The task rows to insert.
 * @returns The inserted rows.
 */
export async function seedTasks(context: BrowserContext, tasks: Record<string, unknown>[]) {
  const rows: any[] = [];
  for (const task of tasks) rows.push(...(await rest(context, 'tasks', { method: 'POST', body: [task] })));
  return rows;
}

/**
 * Inserts team members directly, returning the rows.
 * @param context - The guest's browser context.
 * @param members - The members to insert.
 * @returns The inserted rows.
 */
export async function seedMembers(context: BrowserContext, members: { name: string; color?: string }[]) {
  return rest(context, 'team_members', { method: 'POST', body: members }) as Promise<any[]>;
}

/**
 * Inserts labels directly, returning the rows.
 * @param context - The guest's browser context.
 * @param labels - The labels to insert.
 * @returns The inserted rows.
 */
export async function seedLabels(context: BrowserContext, labels: { name: string; color?: string }[]) {
  return rest(context, 'labels', { method: 'POST', body: labels }) as Promise<any[]>;
}

/**
 * Links members to a task.
 * @param context - The guest's browser context.
 * @param taskId - The task.
 * @param memberIds - The members to assign.
 */
export async function assign(context: BrowserContext, taskId: string, memberIds: string[]) {
  await rest(context, 'task_assignees', {
    method: 'POST',
    body: memberIds.map((member_id) => ({ task_id: taskId, member_id })),
  });
}

/**
 * Links labels to a task.
 * @param context - The guest's browser context.
 * @param taskId - The task.
 * @param labelIds - The labels to add.
 */
export async function tag(context: BrowserContext, taskId: string, labelIds: string[]) {
  await rest(context, 'task_labels', {
    method: 'POST',
    body: labelIds.map((label_id) => ({ task_id: taskId, label_id })),
  });
}

/**
 * Opens the board and waits until it has rendered.
 * @param page - The page to act on.
 */
export async function openBoard(page: Page) {
  await page.goto('/board');
  await expect(page.getByRole('main', { name: 'Task board' })).toBeVisible();
}

/**
 * A lane by its visible name.
 * @param page - The page to act on.
 * @param name - The lane's name.
 * @returns A locator for the lane.
 */
export const lane = (page: Page, name: string) => page.getByRole('region', { name, exact: true });

/**
 * A card by its title.
 * @param scope - The page or lane to search in.
 * @param title - The card's title.
 * @returns A locator for the card.
 */
export const card = (scope: Page | Locator, title: string) =>
  scope.locator('[data-task-id]').filter({ hasText: title });

/**
 * The card titles in a lane, top to bottom.
 * @param page - The page to act on.
 * @param name - The lane's name.
 * @returns The titles, top to bottom.
 */
export const laneTitles = (page: Page, name: string) => lane(page, name).locator('[data-task-id] h3').allTextContents();

/**
 * A date string some number of days from today, in local time.
 * @param days - How many days ahead, negative for the past.
 * @returns The date as YYYY-MM-DD.
 */
export function dayFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  /**
   * Pads a date part to two digits.
   * @param value - The month or day number.
   * @returns The number with a leading zero if it needs one.
   */
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Whether a response finished a Next.js server action.
 * @param response - A network response.
 * @returns True if it answered a server action.
 */
export const isActionResponse = (response: { request(): { headers(): Record<string, string> } }) =>
  'next-action' in response.request().headers();

/**
 * Waits for the next server action to finish. Call before the step that triggers it.
 * @param page - The page to act on.
 * @returns A promise for that action's response.
 */
export const nextAction = (page: Page) => page.waitForResponse(isActionResponse);

/**
 * Drags a card with the mouse to a point, in steps so the sensor sees real movement.
 * @param page - The page to act on.
 * @param from - The card to pick up.
 * @param to - The element to drag over.
 * @param offsetY - Which part of the target to aim for.
 */
export async function dragTo(page: Page, from: Locator, to: Locator, offsetY: 'top' | 'middle' | 'bottom' = 'middle') {
  const start = await from.boundingBox();
  const end = await to.boundingBox();
  if (!start || !end) throw new Error('Drag endpoints are not visible');
  const y = offsetY === 'top' ? end.y + 4 : offsetY === 'bottom' ? end.y + end.height - 4 : end.y + end.height / 2;
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2 + 8, start.y + start.height / 2 + 8, { steps: 4 });
  await page.mouse.move(end.x + end.width / 2, y, { steps: 16 });
  await page.waitForTimeout(250); // Lets the target lane settle before the drop.
  await page.mouse.move(end.x + end.width / 2, y + 1);
}

/**
 * Collects page errors and console errors for later assertion.
 * @param page - The page to act on.
 * @returns A live list of the error messages seen so far.
 */
export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
}
