import { boardStats } from '@/lib/board/stats';
import { cx } from '@/lib/ui/cx';
import type { TaskView } from '@/types/filters';
import type { Task } from '@/types/task';
import styles from './BoardStats.module.css';

/** Props for the board stats. */
interface BoardStatsProps {
  tasks: Task[];
  view: TaskView;
  onViewChange: (view: TaskView) => void;
  className?: string;
}

/**
 * The board's counts, as buttons that show those tasks. Pressing the active one shows all tasks again.
 * @param props.tasks - All tasks on the board, which the counts are computed from.
 * @param props.view - The tasks the board is showing.
 * @param props.onViewChange - Receives the view to show.
 * @param props.className - Classes for placing the group in its parent.
 * @returns The group of buttons.
 */
export function BoardStats({ tasks, view, onViewChange, className }: BoardStatsProps) {
  const stats = boardStats(tasks);
  const items: { view: TaskView; count: number; label: string; tone?: string }[] = [
    { view: 'all', count: stats.total, label: stats.total === 1 ? 'task' : 'tasks' },
    { view: 'completed', count: stats.completed, label: 'completed', tone: stats.completed > 0 ? styles.completed : undefined },
    { view: 'overdue', count: stats.overdue, label: 'overdue', tone: stats.overdue > 0 ? styles.overdue : undefined },
  ];

  return (
    <div className={cx(styles.stats, className)} role="group" aria-label="Board statistics">
      {items.map((item) => (
        <button
          key={item.view}
          type="button"
          className={cx(styles.stat, item.tone)}
          aria-pressed={view === item.view}
          onClick={() => onViewChange(view === item.view ? 'all' : item.view)}
        >
          <span className={styles.count} data-tnum>
            {item.count}
          </span>
          {item.label}
        </button>
      ))}
    </div>
  );
}
