import { describe, expect, it } from 'vitest';
import { makeTask } from '@/lib/testing/makeTask';
import { daysUntil, dueLabel, dueState, relativeTime } from './dates';

// A fixed "today": 2 Nov 2026, 15:00 local.
const now = new Date(2026, 10, 2, 15, 0);

describe('due dates', () => {
  it('counts calendar days, regardless of the time of day', () => {
    expect(daysUntil('2026-11-02', now)).toBe(0);
    expect(daysUntil('2026-11-03', now)).toBe(1);
    expect(daysUntil('2026-11-01', now)).toBe(-1);
  });

  it('is not overdue on the day it is due', () =>
    expect(dueState(makeTask({ due_date: '2026-11-02' }), now)).toBe('soon'));

  it('classifies each state', () => {
    expect(dueState(makeTask(), now)).toBe('none');
    expect(dueState(makeTask({ due_date: '2026-11-01' }), now)).toBe('overdue');
    expect(dueState(makeTask({ due_date: '2026-11-04' }), now)).toBe('soon');
    expect(dueState(makeTask({ due_date: '2026-11-05' }), now)).toBe('later');
  });

  it('never flags finished work', () =>
    expect(dueState(makeTask({ due_date: '2020-01-01', status: 'done' }), now)).toBe('done'));

  it('words the label', () => {
    expect(dueLabel(makeTask({ due_date: '2026-11-02' }), now)).toBe('Due today');
    expect(dueLabel(makeTask({ due_date: '2026-11-03' }), now)).toBe('Due tomorrow');
    expect(dueLabel(makeTask({ due_date: '2026-10-31' }), now)).toBe('Overdue 2d');
  });
});

describe('relativeTime', () => {
  /**
   * The ISO time a given number of milliseconds before the fixed "today".
   * @param ms - How far back, in milliseconds.
   * @returns That moment as an ISO timestamp.
   */
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

  it('words each range', () => {
    expect(relativeTime(ago(5_000), now)).toBe('just now');
    expect(relativeTime(ago(60_000), now)).toBe('1 minute ago');
    expect(relativeTime(ago(2 * 3_600_000), now)).toBe('2 hours ago');
    expect(relativeTime(ago(24 * 3_600_000), now)).toBe('yesterday');
    expect(relativeTime(ago(3 * 86_400_000), now)).toBe('3 days ago');
  });
});
