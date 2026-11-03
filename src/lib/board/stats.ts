import type { Task } from '@/types/task';
import { dueState } from './dates';

/**
 * The top bar's figures. They always cover the whole board, whatever the filters show.
 * @param tasks - All tasks on the board.
 * @param now - The current time, which tests can fix.
 * @returns The total, completed and overdue counts.
 */
export function boardStats(tasks: Task[], now = new Date()) {
  return {
    total: tasks.length,
    completed: tasks.filter((task) => task.status === 'done').length,
    overdue: tasks.filter((task) => dueState(task, now) === 'overdue').length,
  };
}
