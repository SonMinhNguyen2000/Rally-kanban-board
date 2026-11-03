'use server';

import { toResult } from '@/lib/errors';
import { POSITION_STEP } from '@/lib/board/positions';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types/action';
import type { NewTask, Status, TaskPatch } from '@/types/task';

// Server actions are public endpoints, so every one names the columns it writes rather than
// passing on what the client sent. RLS and column grants remain the real boundary.

/**
 * Creates a task, then its assignees and labels. Reports whether those links all saved.
 * @param task - The new task, with its assignees and labels.
 * @returns Whether the assignees and labels all saved, or the database error as a value.
 */
export async function createTask(task: NewTask): Promise<ActionResult<{ linksSaved: boolean }>> {
  const supabase = await createClient();
  const created = await supabase.from('tasks').insert({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    due_date: task.due_date,
  });
  if (created.error) return { ok: false, error: { code: created.error.code, message: created.error.message } };

  const [assignees, labels] = await Promise.all([
    task.assignee_ids.length > 0
      ? supabase
          .from('task_assignees')
          .insert(task.assignee_ids.map((member_id) => ({ task_id: task.id, member_id })))
      : { error: null },
    task.label_ids.length > 0
      ? supabase.from('task_labels').insert(task.label_ids.map((label_id) => ({ task_id: task.id, label_id })))
      : { error: null },
  ]);
  return { ok: true, data: { linksSaved: !assignees.error && !labels.error } };
}

/**
 * Saves edits from the task panel.
 * @param id - The task to change.
 * @param patch - The edited fields.
 * @returns Success, or the database error as a value.
 */
export async function updateTask(id: string, patch: TaskPatch): Promise<ActionResult> {
  const { title, description, status, priority, due_date } = patch;
  const supabase = await createClient();
  const { error } = await supabase
    .from('tasks')
    .update({ title, description, status, priority, due_date })
    .eq('id', id);
  return toResult(error);
}

/**
 * Saves a card's new lane and sort position after a drop.
 * @param id - The task to move.
 * @param status - Its new lane.
 * @param position - Its new sort position.
 * @returns Success, or the database error as a value.
 */
export async function moveTask(id: string, status: Status, position: number): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('tasks').update({ status, position }).eq('id', id);
  return toResult(error);
}

/**
 * Respaces a whole lane, for when repeated drops have worn a gap between cards to nothing.
 * @param ids - The lane's task ids, in display order.
 * @param movedId - The task that was just dropped.
 * @param status - The lane being renumbered.
 * @returns Success, or the first database error as a value.
 */
export async function renumberLane(ids: string[], movedId: string, status: Status): Promise<ActionResult> {
  const supabase = await createClient();
  const results = await Promise.all(
    ids.map((id, index) => {
      const position = (index + 1) * POSITION_STEP;
      return supabase
        .from('tasks')
        .update(id === movedId ? { status, position } : { position })
        .eq('id', id);
    }),
  );
  return toResult(results.find((result) => result.error)?.error ?? null);
}

/**
 * Deletes a task. Its comments, links and history go with it through foreign keys.
 * @param id - The task to delete.
 * @returns Success, or the database error as a value.
 */
export async function deleteTask(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  return toResult(error);
}

/**
 * Assigns a member to a task, or removes them.
 * @param taskId - The task.
 * @param memberId - The member.
 * @param on - True to assign, false to remove.
 * @returns Success, or the database error as a value.
 */
export async function setTaskAssignee(taskId: string, memberId: string, on: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = on
    ? await supabase.from('task_assignees').insert({ task_id: taskId, member_id: memberId })
    : await supabase.from('task_assignees').delete().eq('task_id', taskId).eq('member_id', memberId);
  return toResult(error);
}

/**
 * Puts a label on a task, or takes it off.
 * @param taskId - The task.
 * @param labelId - The label.
 * @param on - True to add it, false to take it off.
 * @returns Success, or the database error as a value.
 */
export async function setTaskLabel(taskId: string, labelId: string, on: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = on
    ? await supabase.from('task_labels').insert({ task_id: taskId, label_id: labelId })
    : await supabase.from('task_labels').delete().eq('task_id', taskId).eq('label_id', labelId);
  return toResult(error);
}
