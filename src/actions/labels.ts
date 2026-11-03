'use server';

import { toResult } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types/action';
import type { PaletteColor } from '@/types/palette';

/**
 * Adds a label. A duplicate name comes back as code 23505.
 * @param name - The label's name.
 * @param color - The label's palette colour.
 * @returns Success, or the database error as a value.
 */
export async function createLabel(name: string, color: PaletteColor): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('labels').insert({ name, color });
  return toResult(error);
}

/**
 * Renames or recolours a label.
 * @param id - The label to change.
 * @param patch - The new name, colour or both.
 * @returns Success, or the database error as a value.
 */
export async function updateLabel(
  id: string,
  patch: { name?: string; color?: PaletteColor },
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('labels').update({ name: patch.name, color: patch.color }).eq('id', id);
  return toResult(error);
}

/**
 * Deletes a label and takes it off its tasks. Task history keeps its name.
 * @param id - The label to delete.
 * @returns Success, or the database error as a value.
 */
export async function deleteLabel(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('labels').delete().eq('id', id);
  return toResult(error);
}
