import { STATUSES, type Status, type Task } from '@/types/task';

/** Card ids per lane, in display order. */
export type Columns = Record<Status, string[]>;

/**
 * Groups tasks into lanes, ordered by position, with creation time breaking ties.
 * @param tasks - The tasks to group.
 * @returns Card ids per lane, in display order.
 */
export function groupIntoColumns(tasks: Task[]): Columns {
  const columns: Columns = { todo: [], in_progress: [], in_review: [], done: [] };
  const sorted = [...tasks].sort(
    (a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at),
  );
  for (const task of sorted) columns[task.status].push(task.id);
  return columns;
}

/**
 * Finds which lane holds a card.
 * @param columns - The current lanes.
 * @param id - The card's task id.
 * @returns The lane holding the card, or undefined if none does.
 */
export function laneOf(columns: Columns, id: string): Status | undefined {
  return STATUSES.find((status) => columns[status].includes(id));
}

/**
 * Moves a card to an index in a lane, clamped. Returns a new object and leaves the input alone.
 * @param columns - The current lanes.
 * @param id - The card's task id.
 * @param to - The lane to move it to.
 * @param index - Its position in that lane.
 * @returns The lanes after the move.
 */
export function moveCard(columns: Columns, id: string, to: Status, index: number): Columns {
  const next: Columns = {
    todo: columns.todo.filter((x) => x !== id),
    in_progress: columns.in_progress.filter((x) => x !== id),
    in_review: columns.in_review.filter((x) => x !== id),
    done: columns.done.filter((x) => x !== id),
  };
  const clamped = Math.max(0, Math.min(index, next[to].length));
  next[to] = [...next[to].slice(0, clamped), id, ...next[to].slice(clamped)];
  return next;
}
