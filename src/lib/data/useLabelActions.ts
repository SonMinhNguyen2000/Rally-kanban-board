import { useQueryClient } from '@tanstack/react-query';
import { createLabel, deleteLabel, updateLabel } from '@/actions/labels';
import { unwrap } from '@/lib/errors';
import type { PaletteColor } from '@/types/palette';
import { boardKey } from './boardQuery';
import { useBoardWrite } from './optimisticWrite';

/**
 * Everything a user can do to labels.
 * @param uid - The guest's user id.
 * @returns The create, update and remove actions.
 */
export function useLabelActions(uid: string) {
  const qc = useQueryClient();

  const update = useBoardWrite<{ id: string; patch: { name?: string; color?: PaletteColor } }>(
    uid,
    (vars) => updateLabel(vars.id, vars.patch),
    (board, { id, patch }) => ({
      ...board,
      labels: board.labels.map((label) => (label.id === id ? { ...label, ...patch } : label)),
    }),
    'Couldn’t save that label.',
  );

  const remove = useBoardWrite<{ id: string }>(
    uid,
    (vars) => deleteLabel(vars.id),
    (board, { id }) => ({
      ...board,
      labels: board.labels.filter((label) => label.id !== id),
      tasks: board.tasks.map((task) => ({
        ...task,
        label_ids: task.label_ids.filter((labelId) => labelId !== id),
      })),
    }),
    'Couldn’t delete that label.',
  );

  /**
   * Not optimistic: the name stays in the form until it has really been added.
   * @param name - The label's name.
   * @param color - The label's palette colour.
   */
  const create = async (name: string, color: PaletteColor) => {
    unwrap(await createLabel(name, color));
    await qc.invalidateQueries({ queryKey: boardKey(uid) });
  };

  return { create, update, remove };
}

/** The label operations components receive as a prop. */
export type LabelActions = ReturnType<typeof useLabelActions>;
