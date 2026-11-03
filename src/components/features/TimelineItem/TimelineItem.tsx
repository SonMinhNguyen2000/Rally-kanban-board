import { Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton/IconButton';
import { describeActivity } from '@/lib/board/activity';
import { relativeTime } from '@/lib/board/dates';
import type { TimelineEntry } from '@/types/timeline';
import styles from './TimelineItem.module.css';

/**
 * One timeline row: a compact line for history, or a full row with a delete button for a comment.
 * @param props.entry - The comment or history entry to show.
 * @param props.onDelete - Deletes a comment by its id.
 * @returns The list item for the entry.
 */
export function TimelineItem({ entry, onDelete }: { entry: TimelineEntry; onDelete: (id: string) => void }) {
  // Relative in the text, with the exact time on hover.
  const stamp = (
    <time dateTime={entry.at} title={new Date(entry.at).toLocaleString()}>
      {relativeTime(entry.at)}
    </time>
  );

  if (entry.type === 'activity') {
    return (
      <li className={styles.logEntry}>
        <span className={styles.dot} aria-hidden="true" />
        <span>
          {describeActivity(entry.activity)} · {stamp}
        </span>
      </li>
    );
  }

  return (
    <li className={styles.comment}>
      <div className={styles.commentMeta}>
        <span>Comment · {stamp}</span>
        <IconButton label="Delete comment" className={styles.commentDelete} onClick={() => onDelete(entry.comment.id)}>
          <Trash2 size={14} aria-hidden="true" />
        </IconButton>
      </div>
      <p className={styles.commentBody}>{entry.comment.body}</p>
    </li>
  );
}
