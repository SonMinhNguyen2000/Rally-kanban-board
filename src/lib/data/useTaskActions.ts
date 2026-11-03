import { useQueryClient } from '@tanstack/react-query';
import {
  createTask,
  deleteTask,
  moveTask,
  renumberLane,
  setTaskAssignee,
  setTaskLabel,
  updateTask,
} from '@/actions/tasks';
import { POSITION_STEP } from '@/lib/board/positions';
import { unwrap } from '@/lib/errors';
import { showToast } from '@/lib/ui/toast';
import type { Board } from '@/types/board';
import type { NewTask, Status, Task, TaskPatch } from '@/types/task';
import { boardKey } from './boardQuery';
import { useBoardWrite } from './optimisticWrite';

/**
 * Replaces one task on the board.
 * @param board - The current board.
 * @param id - The task to replace.
 * @param change - Produces the new version of the task.
 * @returns The board with that task replaced.
 */
function changeTask(board: Board, id: string, change: (task: Task) => Task): Board {
  return { ...board, tasks: board.tasks.map((task) => (task.id === id ? change(task) : task)) };
}

/**
 * Adds an id to a list or removes it.
 * @param ids - The current ids.
 * @param id - The id to add or remove.
 * @param on - True to add it, false to remove it.
 * @returns The updated ids.
 */
function toggleId(ids: string[], id: string, on: boolean): string[] {
  return on ? [...ids, id] : ids.filter((item) => item !== id);
}

/**
 * Everything a user can do to tasks. All but creation are optimistic.
 * @param uid - The guest's user id.
 * @returns The create, patch, move, renumber, remove, setAssignee and setLabel actions.
 */
export function useTaskActions(uid: string) {
  const qc = useQueryClient();

  const patch = useBoardWrite<{ id: string; patch: TaskPatch }>(
    uid,
    (vars) => updateTask(vars.id, vars.patch),
    (board, vars) => changeTask(board, vars.id, (task) => ({ ...task, ...vars.patch })),
    'Couldn’t save that change, so it was undone.',
  );

  const move = useBoardWrite<{ id: string; status: Status; position: number }>(
    uid,
    (vars) => moveTask(vars.id, vars.status, vars.position),
    (board, { id, status, position }) => changeTask(board, id, (task) => ({ ...task, status, position })),
    'Couldn’t move the task. It’s back where it was.',
  );

  const renumber = useBoardWrite<{ ids: string[]; movedId: string; status: Status }>(
    uid,
    (vars) => renumberLane(vars.ids, vars.movedId, vars.status),
    (board, { ids, movedId, status }) => ({
      ...board,
      tasks: board.tasks.map((task) => {
        const index = ids.indexOf(task.id);
        if (index < 0) return task;
        return {
          ...task,
          position: (index + 1) * POSITION_STEP,
          status: task.id === movedId ? status : task.status,
        };
      }),
    }),
    'Couldn’t move the task. It’s back where it was.',
  );

  const remove = useBoardWrite<{ id: string }>(
    uid,
    (vars) => deleteTask(vars.id),
    (board, { id }) => ({ ...board, tasks: board.tasks.filter((task) => task.id !== id) }),
    'Couldn’t delete the task. It’s been restored.',
  );

  const setAssignee = useBoardWrite<{ taskId: string; memberId: string; on: boolean }>(
    uid,
    (vars) => setTaskAssignee(vars.taskId, vars.memberId, vars.on),
    (board, { taskId, memberId, on }) =>
      changeTask(board, taskId, (task) => ({ ...task, assignee_ids: toggleId(task.assignee_ids, memberId, on) })),
    'Couldn’t update the assignees.',
  );

  const setLabel = useBoardWrite<{ taskId: string; labelId: string; on: boolean }>(
    uid,
    (vars) => setTaskLabel(vars.taskId, vars.labelId, vars.on),
    (board, { taskId, labelId, on }) =>
      changeTask(board, taskId, (task) => ({ ...task, label_ids: toggleId(task.label_ids, labelId, on) })),
    'Couldn’t update the labels.',
  );

  /**
   * Not optimistic: the dialog stays open with its text until the task is really saved.
   * @param task - The new task, with its assignees and labels.
   */
  const create = async (task: NewTask) => {
    const { linksSaved } = unwrap(await createTask(task));
    await qc.invalidateQueries({ queryKey: boardKey(uid) });
    if (!linksSaved) showToast('The task was created, but some assignees or labels weren’t added.', 'danger');
  };

  return { create, patch, move, renumber, remove, setAssignee, setLabel };
}

/** The task operations components receive as a prop. */
export type TaskActions = ReturnType<typeof useTaskActions>;
