import {
  defaultDropAnimationSideEffects,
  DndContext,
  DragOverlay,
  KeyboardCode,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimation,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Lane } from '@/components/features/Lane';
import { TaskCard } from '@/components/features/TaskCard';
import { TrayTarget } from '@/components/features/TrayTarget';
import { groupIntoColumns, laneOf, moveCard, type Columns } from '@/lib/board/columns';
import { isLaneId, isTrayId, statusFromDropId } from '@/lib/board/dropTargets';
import { positionBetween } from '@/lib/board/positions';
import type { TaskActions } from '@/lib/data/useTaskActions';
import { cx } from '@/lib/ui/cx';
import { useMediaQuery } from '@/lib/ui/useMediaQuery';
import type { Label } from '@/types/label';
import { LANE, STATUSES, type Status, type Task } from '@/types/task';
import type { TeamMember } from '@/types/team';
import { collisionDetection } from './collisionDetection';
import styles from './Board.module.css';

/** Props for the board. `emptyNotice` replaces the To Do lane's empty text, where new work would appear. */
interface BoardProps {
  tasks: Task[];
  members: TeamMember[];
  labels: Label[];
  actions: TaskActions;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (status: Status) => void;
  emptyNotice?: ReactNode;
}

/**
 * The four lanes and the drag and drop that connects them.
 * @param props.tasks - The tasks to show, after any filters.
 * @param props.members - Every team member, for the cards' avatars.
 * @param props.labels - Every label, for the cards' chips.
 * @param props.actions - The task operations used to save a move or delete a card.
 * @param props.selectedId - The task open in the panel, if any.
 * @param props.onSelect - Opens a task in the panel.
 * @param props.onAdd - Starts a new task in a lane.
 * @param props.emptyNotice - Replaces the To Do lane's empty text.
 * @returns The lanes, the phone drag tray while dragging, and the drag overlay.
 */
export function Board({ tasks, members, labels, actions, selectedId, onSelect, onAdd, emptyNotice }: BoardProps) {
  // The live arrangement during a drag. Null at rest, when the arrangement comes from `tasks`.
  const [drag, setDrag] = useState<{ id: string; origin: Status; columns: Columns } | null>(null);
  // Outlives the drag, because the drop animation is chosen after the drag has ended.
  const [keyboardDrag, setKeyboardDrag] = useState(false);
  const isPhone = useMediaQuery('(max-width: 719px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const memberById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const labelById = useMemo(() => new Map(labels.map((label) => [label.id, label])), [labels]);
  const settled = useMemo(() => groupIntoColumns(tasks), [tasks]); // The saved arrangement.
  const columns = drag?.columns ?? settled; // What's on screen.

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    // A long press, so a swipe across cards still scrolls the board.
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Enter is left free to open the card.
      keyboardCodes: {
        start: [KeyboardCode.Space],
        cancel: [KeyboardCode.Esc],
        end: [KeyboardCode.Space, KeyboardCode.Enter],
      },
    }),
  );

  // A task can vanish mid-drag if another tab deletes it.
  useEffect(() => {
    if (drag && !taskById.has(drag.id)) setDrag(null);
  }, [drag, taskById]);

  const dragged = drag ? taskById.get(drag.id) : undefined; // The card in the overlay.

  /**
   * Finds the lane a drop target belongs to, whether it's a lane or a card.
   * @param overId - The id of the drop target.
   * @param current - The arrangement to look the card up in.
   * @returns The lane, or undefined if the target isn't on the board.
   */
  function targetLane(overId: unknown, current: Columns): Status | undefined {
    if (isLaneId(overId)) return statusFromDropId(overId);
    return laneOf(current, String(overId));
  }

  /**
   * Records which card was picked up and where it came from.
   * @param event.active - The card that was picked up.
   * @param event.activatorEvent - The input that started the drag, which shows if it was the keyboard.
   */
  function onDragStart({ active, activatorEvent }: DragStartEvent) {
    setKeyboardDrag(activatorEvent instanceof KeyboardEvent);
    const id = String(active.id);
    const origin = laneOf(settled, id);
    if (origin) setDrag({ id, origin, columns: settled });
  }

  /**
   * Moves the card into another lane live, so that lane's cards make room during the drag.
   * @param event.active - The card being dragged.
   * @param event.over - The drop target under it, if any.
   */
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

  /**
   * Saves a card's new place, renumbering the lane if its neighbours have no gap left.
   * @param id - The card that moved.
   * @param status - The lane it landed in.
   * @param order - The lane's card ids in their new order.
   */
  function commit(id: string, status: Status, order: string[]) {
    const index = order.indexOf(id);

    /**
     * The saved position of the card at an index in the new order.
     * @param at - The index to look at, which may fall outside the lane.
     * @returns The card's position, or undefined if there is no card at that index.
     */
    const position = (at: number) => {
      const neighbour = order[at];
      return neighbour === undefined ? undefined : taskById.get(neighbour)?.position;
    };

    const next = positionBetween(position(index - 1), position(index + 1));
    if (next === null) actions.renumber({ ids: order, movedId: id, status });
    else actions.move({ id, status, position: next });
  }

  /**
   * Works out where the card landed and saves it, unless it ended up where it started.
   * @param event.active - The card that was dropped.
   * @param event.over - The drop target it landed on, if any.
   */
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
      order.every((x, i) => x === settled[status][i]);
    if (!unchanged) commit(id, status, order);
  }

  // The overlay settling into its slot. Matches --dur-drop and --ease-out in tokens.css.
  // A keyboard drop lands at once, because keyboard actions shouldn't wait on an animation.
  const dropAnimation: DropAnimation | null = reducedMotion || keyboardDrag
    ? null
    : {
        duration: 220,
        easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
        sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0' } } }),
      };

  /**
   * Describes where the dragged card is, for screen readers.
   * @param id - The drop target the card is over.
   * @returns The lane and position in words, such as "To Do, position 1 of 3".
   */
  const describeSpot = (id: unknown) => {
    const lane = isLaneId(id) ? statusFromDropId(id) : laneOf(columns, String(id));
    if (!lane) return 'the board';
    const index = columns[lane].indexOf(String(drag?.id));
    return `${LANE[lane].name}, position ${index + 1} of ${columns[lane].length}`;
  };

  /**
   * A task's title, for screen reader messages.
   * @param id - The task's id.
   * @returns The title, or "Task" if the task is no longer on the board.
   */
  const titleOf = (id: unknown) => taskById.get(String(id))?.title ?? 'Task';

  // What a screen reader hears at each step of a drag.
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${titleOf(active.id)}. Use the arrow keys to move it, Space to drop it.`,
    // A card starts over itself. Announcing that would overwrite the pick-up message at once.
    onDragOver: ({ active, over }) =>
      over && over.id !== active.id ? `${titleOf(active.id)} is over ${describeSpot(over.id)}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `Dropped ${titleOf(active.id)} in ${describeSpot(over.id)}.` : `${titleOf(active.id)} was not moved.`,
    onDragCancel: ({ active }) => `Cancelled. ${titleOf(active.id)} is back where it was.`,
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDrag(null)}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            'Press Enter to open this task. To move it, press Space, use the arrow keys, then press Space again to drop or Escape to cancel.',
        },
      }}
    >
      <main className={cx(styles.board, drag && styles.dragging)} aria-label="Task board">
        {STATUSES.map((status) => (
          <Lane
            key={status}
            status={status}
            ids={columns[status]}
            share={tasks.length === 0 ? 0 : columns[status].length / tasks.length}
            isTarget={Boolean(drag && drag.origin !== status && laneOf(columns, drag.id) === status)}
            taskById={taskById}
            memberById={memberById}
            labelById={labelById}
            selectedId={selectedId}
            onSelect={onSelect}
            onDelete={(id) => actions.remove({ id })}
            onAdd={onAdd}
            emptyContent={status === 'todo' ? emptyNotice : undefined}
          />
        ))}
      </main>

      {isPhone && drag && (
        <div className={styles.tray} aria-hidden="true">
          {STATUSES.map((status) => (
            <TrayTarget key={status} status={status} />
          ))}
        </div>
      )}

      <DragOverlay dropAnimation={dropAnimation} zIndex={80}>
        {dragged && (
          <TaskCard
            task={dragged}
            members={dragged.assignee_ids.flatMap((id) => memberById.get(id) ?? [])}
            labels={dragged.label_ids.flatMap((id) => labelById.get(id) ?? [])}
            lifted
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
