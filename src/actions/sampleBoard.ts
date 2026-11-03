'use server';

import { toResult } from '@/lib/errors';
import { POSITION_STEP } from '@/lib/board/positions';
import { dueDateIn, SAMPLE_LABELS, SAMPLE_MEMBERS, SAMPLE_TASKS } from '@/lib/board/sampleBoard';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types/action';

/**
 * Matches names the way the database's label rule does, ignoring case and surrounding spaces.
 * @param name - The name to normalise.
 * @returns The name in its comparable form.
 */
function nameKey(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Fills an empty board with the sample tasks, as the signed-in guest, so RLS applies as usual.
 * Does nothing if the board already has tasks, and reuses any member or label with the same name.
 * Tasks start in To Do and are then moved, so their timelines show real moves.
 * @returns Success, or the first database error as a value.
 */
export async function loadSampleBoard(): Promise<ActionResult> {
  const supabase = await createClient();

  const existing = await supabase.from('tasks').select('id').limit(1);
  if (existing.error) return toResult(existing.error);
  if (existing.data.length > 0) return toResult(null);

  const [members, labels] = await Promise.all([
    supabase.from('team_members').select('id, name'),
    supabase.from('labels').select('id, name'),
  ]);
  if (members.error) return toResult(members.error);
  if (labels.error) return toResult(labels.error);

  const memberIds = new Map(members.data.map((row) => [nameKey(row.name), row.id as string]));
  const labelIds = new Map(labels.data.map((row) => [nameKey(row.name), row.id as string]));

  const newMembers = SAMPLE_MEMBERS.filter((member) => !memberIds.has(nameKey(member.name)));
  if (newMembers.length > 0) {
    const inserted = await supabase.from('team_members').insert(newMembers).select('id, name');
    if (inserted.error) return toResult(inserted.error);
    for (const row of inserted.data) memberIds.set(nameKey(row.name), row.id);
  }

  const newLabels = SAMPLE_LABELS.filter((label) => !labelIds.has(nameKey(label.name)));
  if (newLabels.length > 0) {
    const inserted = await supabase.from('labels').insert(newLabels).select('id, name');
    if (inserted.error) return toResult(inserted.error);
    for (const row of inserted.data) labelIds.set(nameKey(row.name), row.id);
  }

  // Generated here, because the rows below have to refer to their tasks.
  const planned = SAMPLE_TASKS.map((task) => ({ ...task, id: crypto.randomUUID() }));
  const inLane = new Map<string, number>(); // Cards placed in each lane so far, for their order.

  const created = await supabase.from('tasks').insert(
    planned.map((task) => {
      const place = (inLane.get(task.status) ?? 0) + 1;
      inLane.set(task.status, place);
      return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: 'todo',
        priority: task.priority,
        due_date: task.dueInDays === null ? null : dueDateIn(task.dueInDays),
        position: place * POSITION_STEP,
      };
    }),
  );
  if (created.error) return toResult(created.error);

  const results = await Promise.all([
    ...planned
      .filter((task) => task.status !== 'todo')
      .map((task) => supabase.from('tasks').update({ status: task.status }).eq('id', task.id)),
    supabase.from('task_assignees').insert(
      planned.flatMap((task) =>
        task.assignees.map((name) => ({ task_id: task.id, member_id: memberIds.get(nameKey(name)) })),
      ),
    ),
    supabase.from('task_labels').insert(
      planned.flatMap((task) =>
        task.labels.map((name) => ({ task_id: task.id, label_id: labelIds.get(nameKey(name)) })),
      ),
    ),
    supabase.from('comments').insert(
      planned.flatMap((task) => task.comments.map((body) => ({ task_id: task.id, body }))),
    ),
  ]);

  const failed = results.find((result) => result.error)?.error;
  if (failed) {
    // Not left half-built, so the guest can simply try again.
    await supabase.from('tasks').delete().in('id', planned.map((task) => task.id));
    return toResult(failed);
  }
  return toResult(null);
}
