'use server';

import { toResult } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types/action';

/** Posts a comment on a task.
 * @param taskId - The ID of the task to comment on.
 * @param body - The text of the comment.
 * @returns - An ActionResult indicating success or failure.
 */
export async function addComment(taskId: string, body: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('comments').insert({ task_id: taskId, body });
  return toResult(error);
}

/** Deletes a comment. 
 * The timeline will keep a note that one existed. 
 * @param id - The ID of the comment to delete.
 * @returns - An ActionResult indicating success or failure.
*/
export async function deleteComment(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('comments').delete().eq('id', id);
  return toResult(error);
}
