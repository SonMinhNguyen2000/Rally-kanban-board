import type { ReactNode } from 'react';
import styles from './BoardNotice.module.css';

/**
 * A message in the To Do lane, where new work would appear: first run, or filters that match nothing.
 * @param props.title - The heading.
 * @param props.body - The sentence explaining what to do next.
 * @param props.action - An optional button.
 * @returns The notice.
 */
export function BoardNotice({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className={styles.notice}>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}
