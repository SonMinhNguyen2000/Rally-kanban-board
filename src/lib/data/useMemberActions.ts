import { useQueryClient } from '@tanstack/react-query';
import { createMember, deleteMember, updateMember } from '@/actions/members';
import { unwrap } from '@/lib/errors';
import type { PaletteColor } from '@/types/palette';
import { boardKey } from './boardQuery';
import { useBoardWrite } from './optimisticWrite';

/**
 * Everything a user can do to team members.
 * @param uid - The guest's user id.
 * @returns The create, update and remove actions.
 */
export function useMemberActions(uid: string) {
  const qc = useQueryClient();

  const update = useBoardWrite<{ id: string; patch: { name?: string; color?: PaletteColor } }>(
    uid,
    (vars) => updateMember(vars.id, vars.patch),
    (board, { id, patch }) => ({
      ...board,
      members: board.members.map((member) => (member.id === id ? { ...member, ...patch } : member)),
    }),
    'Couldn’t save that team member.',
  );

  const remove = useBoardWrite<{ id: string }>(
    uid,
    (vars) => deleteMember(vars.id),
    (board, { id }) => ({
      ...board,
      members: board.members.filter((member) => member.id !== id),
      tasks: board.tasks.map((task) => ({
        ...task,
        assignee_ids: task.assignee_ids.filter((memberId) => memberId !== id),
      })),
    }),
    'Couldn’t remove that team member.',
  );

  /**
   * Not optimistic: the name stays in the form until it has really been added.
   * @param name - The member's name.
   * @param color - The member's palette colour.
   */
  const create = async (name: string, color: PaletteColor) => {
    unwrap(await createMember(name, color));
    await qc.invalidateQueries({ queryKey: boardKey(uid) });
  };

  return { create, update, remove };
}

/** The member operations components receive as a prop. */
export type MemberActions = ReturnType<typeof useMemberActions>;
