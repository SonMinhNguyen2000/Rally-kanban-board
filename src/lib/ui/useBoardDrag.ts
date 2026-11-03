import {
  defaultDropAnimationSideEffects,
  KeyboardCode,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DndContextProps,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimation,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useEffect, useMemo, useState } from 'react';
import { groupIntoColumns, laneOf, moveCard, type Columns } from '@/lib/board/columns';
import { isLaneId, isTrayId, statusFromDropId } from '@/lib/board/dropTargets';
import { positionBetween } from '@/lib/board/positions';
import type { TaskActions } from '@/lib/data/useTaskActions';
import { useMediaQuery } from '@/lib/ui/useMediaQuery';
import { LANE, type Status, type Task } from '@/types/task';

type DragState = { id: string; origin: Status; columns: Columns };

interface UseBoardDragOptions {
  tasks: Task[];
  actions: TaskActions;
}

export function useBoardDrag({ tasks, actions }: UseBoardDragOptions) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [keyboardDrag, setKeyboardDrag] = useState(false);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const settled = useMemo(() => groupIntoColumns(tasks), [tasks]);
  const columns = drag?.columns ?? settled;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: {
        start: [KeyboardCode.Space],
        cancel: [KeyboardCode.Esc],
        end: [KeyboardCode.Space, KeyboardCode.Enter],
      },
    }),
  );

  useEffect(() => {
    if (drag && !taskById.has(drag.id)) setDrag(null);
  }, [drag, taskById]);

  function targetLane(overId: unknown, current: Columns): Status | undefined {
    if (isLaneId(overId)) return statusFromDropId(overId);
    return laneOf(current, String(overId));
  }

  function onDragStart({ active, activatorEvent }: DragStartEvent) {
    setKeyboardDrag(activatorEvent instanceof KeyboardEvent);
    const id = String(active.id);
    const origin = laneOf(settled, id);
    if (origin) setDrag({ id, origin, columns: settled });
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over || isTrayId(over.id)) return;
    const id = String(active.id);
    setDrag((state) => {
      if (!state) return state;
      const from = laneOf(state.columns, id);
      const to = targetLane(over.id, state.columns);
      if (!from || !to || from === to) return state;
      const overIndex = state.columns[to].indexOf(String(over.id));
      const index = overIndex >= 0 ? overIndex : state.columns[to].length;
      return { ...state, columns: moveCard(state.columns, id, to, index) };
    });
  }

  function commit(id: string, status: Status, order: string[]) {
    const index = order.indexOf(id);
    const position = (at: number) => {
      const neighbour = order[at];
      return neighbour === undefined ? undefined : taskById.get(neighbour)?.position;
    };
    const next = positionBetween(position(index - 1), position(index + 1));
    if (next === null) actions.renumber({ ids: order, movedId: id, status });
    else actions.move({ id, status, position: next });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    const state = drag;
    setDrag(null);
    if (!state || !over) return;
    const id = String(active.id);

    if (isTrayId(over.id)) {
      const status = statusFromDropId(over.id);
      commit(id, status, [...settled[status].filter((x) => x !== id), id]);
      return;
    }

    const status = laneOf(state.columns, id);
    if (!status) return;
    let order = state.columns[status];
    const overIndex = order.indexOf(String(over.id));
    const fromIndex = order.indexOf(id);
    if (overIndex >= 0 && overIndex !== fromIndex) order = arrayMove(order, fromIndex, overIndex);

    const unchanged =
      status === state.origin &&
      order.length === settled[status].length &&
      order.every((item, index) => item === settled[status][index]);
    if (!unchanged) commit(id, status, order);
  }

  const describeSpot = (id: unknown) => {
    const lane = isLaneId(id) ? statusFromDropId(id) : laneOf(columns, String(id));
    if (!lane) return 'the board';
    const index = columns[lane].indexOf(String(drag?.id));
    return `${LANE[lane].name}, position ${index + 1} of ${columns[lane].length}`;
  };
  const titleOf = (id: unknown) => taskById.get(String(id))?.title ?? 'Task';
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${titleOf(active.id)}. Use the arrow keys to move it, Space to drop it.`,
    onDragOver: ({ active, over }) =>
      over && over.id !== active.id ? `${titleOf(active.id)} is over ${describeSpot(over.id)}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `Dropped ${titleOf(active.id)} in ${describeSpot(over.id)}.` : `${titleOf(active.id)} was not moved.`,
    onDragCancel: ({ active }) => `Cancelled. ${titleOf(active.id)} is back where it was.`,
  };

  const dropAnimation: DropAnimation | null = reducedMotion || keyboardDrag
    ? null
    : {
        duration: 220,
        easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
        sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0' } } }),
      };

  return {
    columns,
    drag,
    dragged: drag ? taskById.get(drag.id) : undefined,
    taskById,
    sensors,
    dropAnimation,
    announcements,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel: () => setDrag(null),
    measuring: { droppable: { strategy: MeasuringStrategy.Always } } satisfies DndContextProps['measuring'],
  };
}
