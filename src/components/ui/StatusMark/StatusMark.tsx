import { LANE, type Status } from '@/types/task';
import styles from './StatusMark.module.css';

/**
 * The Rally mark: four status bars that fill from the left as a task advances. Decorative.
 * @param props.status - The lane, which decides how many bars fill and their colour.
 * @returns The SVG mark.
 */
export function StatusMark({ status }: { status: Status }) {
  const { level } = LANE[status]; // How many status bars to fill.
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" aria-hidden="true" className={styles.mark} data-status={status}>
      {[0, 1, 2, 3].map((index) => (
        <rect key={index} x={index * 4} width="2" height="12" rx="1" data-on={index < level ? '' : undefined} />
      ))}
    </svg>
  );
}
