/** A comment on a task. */
export interface Comment {
  id: string;
  task_id: string;
  body: string;
  created_at: string;
}

/** Every kind of history entry. Must match the task_activity_kind_valid constraint. */
export type ActivityKind =
  | 'created'
  | 'title_edited'
  | 'description_edited'
  | 'moved'
  | 'priority_changed'
  | 'due_date_changed'
  | 'assignee_added'
  | 'assignee_removed'
  | 'label_added'
  | 'label_removed'
  | 'comment_added';

/** A task_activity row, written only by database triggers. Payloads are in docs/SCHEMA.md. */
export interface Activity {
  id: number;
  task_id: string;
  kind: ActivityKind;
  payload: Record<string, string | null | undefined>;
  created_at: string;
}

/** One row of the task panel's merged, chronological timeline. */
export type TimelineEntry =
  | { type: 'comment'; at: string; key: string; comment: Comment }
  | { type: 'activity'; at: string; key: string; activity: Activity };
