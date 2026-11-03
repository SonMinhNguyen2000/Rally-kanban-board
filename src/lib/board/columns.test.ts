import { describe, expect, it } from 'vitest';
import { makeTask } from '@/lib/testing/makeTask';
import { groupIntoColumns, laneOf, moveCard } from './columns';

describe('columns', () => {
  it('sorts by position within a lane', () => {
    const columns = groupIntoColumns([
      makeTask({ id: 'b', position: 2 }),
      makeTask({ id: 'a', position: 1 }),
      makeTask({ id: 'c', position: 1, status: 'done' }),
    ]);
    expect(columns.todo).toEqual(['a', 'b']);
    expect(columns.done).toEqual(['c']);
    expect(laneOf(columns, 'c')).toBe('done');
  });

  it('moves a card across lanes without changing the input', () => {
    const start = { todo: ['a', 'b'], in_progress: ['c'], in_review: [], done: [] };
    const moved = moveCard(start, 'a', 'in_progress', 1);
    expect(moved.todo).toEqual(['b']);
    expect(moved.in_progress).toEqual(['c', 'a']);
    expect(start.todo).toEqual(['a', 'b']);
  });

  it('clamps an out-of-range index', () => {
    const start = { todo: ['a'], in_progress: ['c'], in_review: [], done: [] };
    expect(moveCard(start, 'a', 'in_progress', 99).in_progress).toEqual(['c', 'a']);
  });
});
