import { DndContext } from '@dnd-kit/core';
import { type ReactNode } from 'react';
import { TrayTarget } from '@/components/features/TrayTarget';
import { cx } from '@/lib/ui/cx';
import { useMediaQuery } from '@/lib/ui/useMediaQuery';
import type { Label } from '@/types/label';
import type { TaskActions } from '@/lib/data/useTaskActions';
import type { Status, Task } from '@/types/task';
import type { TeamMember } from '@/types/team';
import { BoardDragOverlay } from './BoardDragOverlay';
import { BoardLanes } from './BoardLanes';
import { collisionDetection } from './collisionDetection';
import styles from './Board.module.css';
import { useBoardDrag } from '../../../lib/ui/useBoardDrag';

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

export function Board({ tasks, members, labels, actions, selectedId, onSelect, onAdd, emptyNotice }: BoardProps) {
  const isPhone = useMediaQuery('(max-width: 719px)');
  const { columns, drag, dragged, taskById, sensors, dropAnimation, announcements, onDragStart, onDragOver, onDragEnd, onDragCancel, measuring } =
    useBoardDrag({ tasks, actions });
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={measuring}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            'Press Enter to open this task. To move it, press Space, use the arrow keys, then press Space again to drop or Escape to cancel.',
        },
      }}
    >
      <main className={cx(styles.board, drag && styles.dragging)} aria-label="Task board">
        <BoardLanes
          tasks={tasks}
          columns={columns}
          members={members}
          labels={labels}
          selectedId={selectedId}
          onSelect={onSelect}
          onDelete={(id) => actions.remove({ id })}
          onAdd={onAdd}
          emptyNotice={emptyNotice}
          taskById={taskById}
          dragOrigin={drag?.origin}
          draggedId={drag?.id}
        />
      </main>
      {isPhone && drag && (
        <div className={styles.tray} aria-hidden="true">
          {(['todo', 'in_progress', 'in_review', 'done'] as const).map((status) => (
            <TrayTarget key={status} status={status} />
          ))}
        </div>
      )}
      <BoardDragOverlay task={dragged} members={members} labels={labels} dropAnimation={dropAnimation} />
    </DndContext>
  );
}
