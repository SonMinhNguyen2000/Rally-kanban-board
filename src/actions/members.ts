'use server';

import { toResult } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types/action';
import type { PaletteColor } from '@/types/palette';

/**
 * Adds a team member.
 * @param name - The member's name.
 * @param color - The member's palette colour.
 * @returns Success, or the database error as a value.
 */
export async function createMember(name: string, color: PaletteColor): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('team_members').insert({ name, color });
  return toResult(error);
}

/**
 * Renames or recolours a team member.
 * @param id - The member to change.
 * @param patch - The new name, colour or both.
 * @returns Success, or the database error as a value.
 */
export async function updateMember(
  id: string,
  patch: { name?: string; color?: PaletteColor },
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('team_members')
    .update({ name: patch.name, color: patch.color })
    .eq('id', id);
  return toResult(error);
}

/**
 * Removes a team member and their assignments. Task history keeps their name.
 * @param id - The member to remove.
 * @returns Success, or the database error as a value.
 */
export async function deleteMember(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('team_members').delete().eq('id', id);
  return toResult(error);
}
