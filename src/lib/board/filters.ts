import type { Filters } from '@/types/filters';
import type { Task } from '@/types/task';
import { dueState } from './dates';

/**
 * Whether any filter is narrowing the board. Blank search text doesn't count.
 * @param filters - The filter bar's state.
 * @returns True if any filter is narrowing the board.
 */
export function hasFilters(filters: Filters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.priorities.length > 0 ||
    filters.assignees.length > 0 ||
    filters.labels.length > 0 ||
    filters.view !== 'all'
  );
}

/**
 * Choices within one filter widen the result. Different filters narrow it.
 * @param tasks - All tasks on the board.
 * @param filters - The filter bar's state.
 * @param now - The current time, which tests can fix.
 * @returns The tasks that match.
 */
export function filterTasks(tasks: Task[], filters: Filters, now = new Date()): Task[] {
  const query = filters.search.trim().toLocaleLowerCase();
  return tasks.filter(
    (task) =>
      (query === '' || task.title.toLocaleLowerCase().includes(query)) &&
      (filters.priorities.length === 0 || filters.priorities.includes(task.priority)) &&
      (filters.assignees.length === 0 || task.assignee_ids.some((id) => filters.assignees.includes(id))) &&
      (filters.labels.length === 0 || task.label_ids.some((id) => filters.labels.includes(id))) &&
      (filters.view !== 'completed' || task.status === 'done') &&
      (filters.view !== 'overdue' || dueState(task, now) === 'overdue'),
  );
}
