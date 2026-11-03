import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addComment, deleteComment } from '@/actions/comments';
import { friendlyError, unwrap } from '@/lib/errors';
import { createClient } from '@/lib/supabase/client';
import { showToast } from '@/lib/ui/toast';
import type { Activity, Comment, TimelineEntry } from '@/types/timeline';
import { boardKey } from './boardQuery';

/**
 * The cache key for one task's timeline.
 * @param taskId - The task.
 * @returns The query key.
 */
export const timelineKey = (taskId: string) => ['timeline', taskId] as const;

/**
 * Sort value for ties. Comments sort after activity entries from the same moment.
 * @param entry - The timeline entry.
 * @returns The activity id, or the highest possible value for a comment.
 */
const tieBreak = (entry: TimelineEntry) =>
  entry.type === 'activity' ? entry.activity.id : Number.MAX_SAFE_INTEGER;

/**
 * Loads a task's comments and history, merged into one chronological list.
 * @param taskId - The task.
 * @returns The task's comments and activity, oldest first.
 */
async function fetchTimeline(taskId: string): Promise<TimelineEntry[]> {
  const supabase = createClient();
  const [comments, activity] = await Promise.all([
    // retry(false): React Query is the one retry policy. See fetchBoard.
    supabase.from('comments').select('id, task_id, body, created_at').eq('task_id', taskId).retry(false),
    supabase
      .from('task_activity')
      .select('id, task_id, kind, payload, created_at')
      .eq('task_id', taskId)
      .retry(false),
  ]);
  if (comments.error) throw comments.error;
  if (activity.error) throw activity.error;

  const commentRows = comments.data as Comment[];
  const present = new Set(commentRows.map((comment) => comment.id)); // Comments that still exist.

  const entries: TimelineEntry[] = [
    ...commentRows.map(
      (comment): TimelineEntry => ({ type: 'comment', at: comment.created_at, key: `c${comment.id}`, comment }),
    ),
    ...(activity.data as Activity[])
      // A comment that still exists appears as itself, so its log line would be a duplicate.
      .filter((entry) => !(entry.kind === 'comment_added' && present.has(entry.payload.comment_id ?? '')))
      .map(
        (entry): TimelineEntry => ({ type: 'activity', at: entry.created_at, key: `a${entry.id}`, activity: entry }),
      ),
  ];

  // created_at is the transaction time, so entries from one write tie.
  return entries.sort((a, b) => a.at.localeCompare(b.at) || tieBreak(a) - tieBreak(b));
}

/**
 * A task's timeline, kept in the query cache.
 * @param taskId - The task.
 * @returns The timeline query.
 */
export function useTimeline(taskId: string) {
  return useQuery({ queryKey: timelineKey(taskId), queryFn: () => fetchTimeline(taskId), retry: 1 });
}

/**
 * Adding and deleting comments. Both refresh the timeline and the card's comment count.
 * @param uid - The guest's user id.
 * @param taskId - The task being commented on.
 * @returns The add and remove mutations.
 */
export function useCommentActions(uid: string, taskId: string) {
  const qc = useQueryClient();

  /**
   * Refetches everything a comment appears in.
   * @returns A promise that settles once both refetches have finished.
   */
  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: timelineKey(taskId) }),
      qc.invalidateQueries({ queryKey: boardKey(uid) }),
    ]);

  const add = useMutation({
    mutationFn: async (body: string) => unwrap(await addComment(taskId, body)),
    onSuccess: refresh,
    onError: (error) => showToast(friendlyError(error, 'Couldn’t post your comment.'), 'danger'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => unwrap(await deleteComment(id)),
    onSuccess: refresh,
    onError: (error) => showToast(friendlyError(error, 'Couldn’t delete that comment.'), 'danger'),
  });

  return { add, remove };
}
