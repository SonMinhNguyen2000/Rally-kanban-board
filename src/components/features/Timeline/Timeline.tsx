import { TimelineItem } from '@/components/features/TimelineItem/TimelineItem';
import { useCommentActions, useTimeline } from '@/lib/data/timeline';
import styles from './Timeline.module.css';

/**
 * A task's comments and history in one chronological list, with its own loading and error states.
 * @param props.uid - The signed-in guest, which scopes comment deletes.
 * @param props.taskId - The task whose timeline to show.
 * @returns The timeline section.
 */
export function Timeline({ uid, taskId }: { uid: string; taskId: string }) {
  const timeline = useTimeline(taskId);
  const { remove } = useCommentActions(uid, taskId);

  return (
    <section className={styles.timeline} aria-label="Comments and activity">
      <h3 className={styles.sectionTitle}>Activity</h3>
      {timeline.isPending && <p className={styles.quiet}>Loading activity…</p>}
      {timeline.isError && (
        <p className={styles.quiet}>
          Couldn’t load the activity.{' '}
          <button type="button" className={styles.retry} onClick={() => void timeline.refetch()}>
            Try again
          </button>
        </p>
      )}
      {timeline.data && (
        <ol className={styles.entries}>
          {timeline.data.map((entry) => (
            <TimelineItem key={entry.key} entry={entry} onDelete={(id) => remove.mutate(id)} />
          ))}
        </ol>
      )}
    </section>
  );
}
