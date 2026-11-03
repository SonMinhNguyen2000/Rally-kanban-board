import { StatusMark } from '@/components/ui/StatusMark';
import { STATUSES, type Status } from '@/types/task';
import styles from './BoardSkeleton.module.css';

// Placeholder card heights per lane, chosen to look like a real board.
const SKELETON_HEIGHTS: Record<Status, string[]> = {
  todo: ['5.5rem', '3rem', '6.75rem'],
  in_progress: ['6.75rem', '4.5rem'],
  in_review: ['4.5rem'],
  done: ['3rem', '5.5rem'],
};

/**
 * The loading state, shaped like the real board so nothing jumps when it arrives.
 * @returns Placeholder bars, lanes and cards.
 */
export function BoardSkeleton() {
  return (
    <div className={styles.app} aria-busy="true" aria-label="Loading your board">
      <div className={styles.bar} />
      <div className={styles.filter} />
      <div className={styles.board}>
        {STATUSES.map((status) => (
          <div key={status} className={styles.lane}>
            <div className={styles.head}>
              <StatusMark status={status} />
            </div>
            {SKELETON_HEIGHTS[status].map((height, index) => (
              <div key={index} className={styles.card} style={{ height }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
