import type { Task } from '@/types/task';

// Milliseconds in a day, for converting between dates and whole days.
const DAY_MS = 86_400_000;

/** A task counts as due soon when it's due within this many days. */
export const DUE_SOON_DAYS = 2;

/** How a due date should be presented. */
export type DueState = 'none' | 'done' | 'overdue' | 'soon' | 'later';

/**
 * Reads a due date as local midnight, because due dates are calendar days with no time zone.
 * @param date - A date as YYYY-MM-DD.
 * @returns That day at local midnight.
 */
export function parseDay(date: string): Date {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Drops the time of day.
 * @param date - Any moment in the day.
 * @returns Local midnight on that day.
 */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Whole calendar days until the date, rounded so daylight saving changes can't shift it.
 * @param date - A date as YYYY-MM-DD.
 * @param now - The current time, which tests can fix.
 * @returns The days until that date, negative if it has passed.
 */
export function daysUntil(date: string, now = new Date()): number {
  return Math.round((parseDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS);
}

/**
 * Classifies a task's due date. Finished work is never flagged.
 * @param task - The task's due date and status.
 * @param now - The current time, which tests can fix.
 * @returns The state that decides how the due date looks.
 */
export function dueState(task: Pick<Task, 'due_date' | 'status'>, now = new Date()): DueState {
  if (!task.due_date) return 'none';
  if (task.status === 'done') return 'done';
  const days = daysUntil(task.due_date, now);
  if (days < 0) return 'overdue';
  return days <= DUE_SOON_DAYS ? 'soon' : 'later';
}

/**
 * Short date such as "Nov 14", adding the year only when it isn't this year.
 * @param date - A date as YYYY-MM-DD.
 * @param now - The current time, which tests can fix.
 * @returns The formatted date.
 */
export function formatDay(date: string, now = new Date()): string {
  const parsed = parseDay(date);
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(parsed.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  });
}

/**
 * The words on a due chip, such as "Due tomorrow" or "Overdue 2d".
 * @param task - The task's due date and status.
 * @param now - The current time, which tests can fix.
 * @returns The chip's text, or an empty string with no due date.
 */
export function dueLabel(task: Pick<Task, 'due_date' | 'status'>, now = new Date()): string {
  if (!task.due_date) return '';
  const state = dueState(task, now);
  if (state === 'done' || state === 'later') return formatDay(task.due_date, now);
  const days = daysUntil(task.due_date, now);
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days > 1) return `Due in ${days} days`;
  return `Overdue ${-days}d`;
}

/**
 * A timeline timestamp, such as "2 hours ago", falling back to the date after a week.
 * @param iso - The moment as an ISO timestamp.
 * @param now - The current time, which tests can fix.
 * @returns The time in words.
 */
export function relativeTime(iso: string, now = new Date()): string {
  const then = new Date(iso);
  const seconds = Math.round((now.getTime() - then.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  const days = Math.round((startOfDay(now).getTime() - startOfDay(then).getTime()) / DAY_MS);
  if (days <= 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(then.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  });
}
