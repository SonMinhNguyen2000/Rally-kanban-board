import { describe, expect, it } from 'vitest';
import { PALETTE } from '@/types/palette';
import { STATUSES } from '@/types/task';
import { daysUntil } from './dates';
import { dueDateIn, SAMPLE_LABELS, SAMPLE_MEMBERS, SAMPLE_TASKS } from './sampleBoard';

describe('sample board', () => {
  it('only refers to people and labels that exist', () => {
    const members = new Set(SAMPLE_MEMBERS.map((member) => member.name));
    const labels = new Set(SAMPLE_LABELS.map((label) => label.name));
    for (const task of SAMPLE_TASKS) {
      for (const name of task.assignees) expect(members).toContain(name);
      for (const name of task.labels) expect(labels).toContain(name);
    }
  });

  it('uses only palette colours the database accepts', () => {
    for (const item of [...SAMPLE_MEMBERS, ...SAMPLE_LABELS]) expect(PALETTE).toContain(item.color);
  });

  it('has unique names, because the database rejects duplicate labels', () => {
    const lower = SAMPLE_LABELS.map((label) => label.name.toLowerCase());
    expect(new Set(lower).size).toBe(lower.length);
  });

  it('fills every lane', () => {
    for (const status of STATUSES) {
      expect(SAMPLE_TASKS.some((task) => task.status === status)).toBe(true);
    }
  });

  it('shows the due date states: overdue and due soon on open work', () => {
    const open = SAMPLE_TASKS.filter((task) => task.status !== 'done' && task.dueInDays !== null);
    expect(open.some((task) => (task.dueInDays as number) < 0)).toBe(true);
    expect(open.some((task) => (task.dueInDays as number) >= 0 && (task.dueInDays as number) <= 2)).toBe(true);
  });
});

describe('dueDateIn', () => {
  // A fixed "today": 2 Nov 2026, 15:00 local.
  const now = new Date(2026, 10, 2, 15, 0);

  it('formats today', () => expect(dueDateIn(0, now)).toBe('2026-11-02'));
  it('crosses a month backwards', () => expect(dueDateIn(-3, now)).toBe('2026-10-30'));
  it('crosses a year forwards', () => expect(dueDateIn(60, now)).toBe('2027-01-01'));
  it('agrees with daysUntil', () => expect(daysUntil(dueDateIn(5, now), now)).toBe(5));
});
