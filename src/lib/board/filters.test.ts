import { describe, expect, it } from 'vitest';
import { makeTask } from '@/lib/testing/makeTask';
import { NO_FILTERS, type Filters } from '@/types/filters';
import { filterTasks, hasFilters } from './filters';

describe('filters', () => {
  // One task for each thing the filters can match on.
  const tasks = [
    makeTask({ id: 'a', title: 'Fix Login', priority: 'high', assignee_ids: ['m1'], label_ids: ['l1'] }),
    makeTask({ id: 'b', title: 'Write docs', priority: 'low', assignee_ids: ['m2'], label_ids: ['l2'] }),
    makeTask({ id: 'c', title: 'Login copy', priority: 'low' }),
  ];

  /**
   * Ids of the tasks left after applying the given filters.
   * @param filters - The filters to apply over the defaults.
   * @returns The matching task ids.
   */
  const ids = (filters: Partial<Filters>) =>
    filterTasks(tasks, { ...NO_FILTERS, ...filters }).map((task) => task.id);

  it('returns everything with no filters', () => expect(ids({})).toEqual(['a', 'b', 'c']));
  it('searches titles ignoring case', () => expect(ids({ search: ' login ' })).toEqual(['a', 'c']));
  it('widens within one filter', () => expect(ids({ assignees: ['m1', 'm2'] })).toEqual(['a', 'b']));
  it('narrows across filters', () => expect(ids({ priorities: ['low'], labels: ['l2'] })).toEqual(['b']));

  it('reports whether any filter is on', () => {
    expect(hasFilters(NO_FILTERS)).toBe(false);
    expect(hasFilters({ ...NO_FILTERS, search: '  ' })).toBe(false);
    expect(hasFilters({ ...NO_FILTERS, labels: ['l1'] })).toBe(true);
  });
});
