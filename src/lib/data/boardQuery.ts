import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Board } from '@/types/board';
import type { Label } from '@/types/label';
import type { Task } from '@/types/task';
import type { TeamMember } from '@/types/team';

/**
 * The cache key for one guest's board.
 * @param uid - The guest's user id.
 * @returns The query key.
 */
export const boardKey = (uid: string) => ['board', uid] as const;

/** A tasks row as PostgREST returns it, with embedded relations. */
interface TaskRow extends Omit<Task, 'assignee_ids' | 'label_ids' | 'comment_count'> {
  task_assignees: { member_id: string }[];
  task_labels: { label_id: string }[];
  comments: { count: number }[];
}

/**
 * Loads the whole board in the browser. RLS limits every query to this guest's rows.
 * retry(false) turns off postgrest-js's own retries on GETs, which would otherwise multiply
 * with React Query's and keep the failure screen waiting. React Query is the one retry policy.
 * @returns The guest's tasks, members and labels.
 */
async function fetchBoard(): Promise<Board> {
  const supabase = createClient();
  const [tasks, members, labels] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, task_assignees(member_id), task_labels(label_id), comments(count)')
      .order('position')
      .retry(false),
    supabase.from('team_members').select('id, name, color, created_at').order('created_at').retry(false),
    supabase.from('labels').select('id, name, color, created_at').order('created_at').retry(false),
  ]);
  if (tasks.error) throw tasks.error;
  if (members.error) throw members.error;
  if (labels.error) throw labels.error;

  return {
    tasks: (tasks.data as unknown as TaskRow[]).map(({ task_assignees, task_labels, comments, ...task }) => ({
      ...task,
      assignee_ids: task_assignees.map((row) => row.member_id),
      label_ids: task_labels.map((row) => row.label_id),
      comment_count: comments[0]?.count ?? 0,
    })),
    members: members.data as TeamMember[],
    labels: labels.data as Label[],
  };
}

/**
 * The guest's board, kept in the query cache.
 * @param uid - The guest's user id.
 * @returns The board query.
 */
export function useBoard(uid: string) {
  return useQuery({ queryKey: boardKey(uid), queryFn: fetchBoard, retry: 1 });
}
