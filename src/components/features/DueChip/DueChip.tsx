import { AlertTriangle, CalendarDays, Clock } from 'lucide-react';
import { dueLabel, dueState } from '@/lib/board/dates';
import { cx } from '@/lib/ui/cx';
import type { Task } from '@/types/task';
import styles from './DueChip.module.css';

/**
 * A task's due date. Overdue and due soon are tinted, and each state has its own icon.
 * @param props.task - The task's due date and status.
 * @returns The chip, or nothing if the task has no due date.
 */
export function DueChip({ task }: { task: Pick<Task, 'due_date' | 'status'> }) {
  const state = dueState(task);
  if (state === 'none') return null;
  const Icon = state === 'overdue' ? AlertTriangle : state === 'soon' ? Clock : CalendarDays;
  return (
    <span className={cx(styles.due, state === 'overdue' && styles.overdue, state === 'soon' && styles.soon)}>
      <Icon size={12} aria-hidden="true" />
      {dueLabel(task)}
    </span>
  );
}
