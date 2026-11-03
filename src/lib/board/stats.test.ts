import { describe, expect, it } from 'vitest';
import { makeTask } from '@/lib/testing/makeTask';
import { boardStats } from './stats';

describe('boardStats', () => {
  it('counts total, completed and overdue, excluding finished work from overdue', () => {
    expect(
      boardStats(
        [
          makeTask({ status: 'done', due_date: '2020-01-01' }),
          makeTask({ due_date: '2020-01-01' }),
          makeTask({ due_date: '2030-01-01' }),
          makeTask(),
        ],
        new Date(2026, 10, 2),
      ),
    ).toEqual({ total: 4, completed: 1, overdue: 1 });
  });
});
