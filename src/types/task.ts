/** Every lane, in board order. Must match the tasks_status_valid constraint. */
export const STATUSES = ['todo', 'in_progress', 'in_review', 'done'] as const;
export type Status = (typeof STATUSES)[number];

/** Every priority, highest first. Must match the tasks_priority_valid constraint. */
export const PRIORITIES = ['high', 'normal', 'low'] as const;
export type Priority = (typeof PRIORITIES)[number];

/** Display details per lane. `level` is how many status bars the mark fills. */
export const LANE: Record<Status, { name: string; empty: string; level: 1 | 2 | 3 | 4 }> = {
  todo: { name: 'To Do', empty: 'Nothing to do', level: 1 },
  in_progress: { name: 'In Progress', empty: 'Nothing in progress', level: 2 },
  in_review: { name: 'In Review', empty: 'Nothing in review', level: 3 },
  done: { name: 'Done', empty: 'Nothing finished yet', level: 4 },
};

/** Display name per priority. */
export const PRIORITY_NAME: Record<Priority, string> = { high: 'High', normal: 'Normal', low: 'Low' };

/** A tasks row, flattened with its assignee ids, label ids and comment count. */
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  due_date: string | null;
  position: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  assignee_ids: string[];
  label_ids: string[];
  comment_count: number;
}

/** What the New task dialog submits. The client generates the id. */
export interface NewTask {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  due_date: string | null;
  assignee_ids: string[];
  label_ids: string[];
}

/** The task fields a user can edit from the panel. */
export type TaskPatch = Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'due_date'>>;
