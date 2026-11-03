import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { SortableCard } from '@/components/features/SortableCard/SortableCard';
import { IconButton } from '@/components/ui/IconButton/IconButton';
import { StatusMark } from '@/components/ui/StatusMark/StatusMark';
import { laneDropId } from '@/lib/board/dropTargets';
import { cx } from '@/lib/ui/cx';
import type { Label } from '@/types/label';
import { LANE, type Status, type Task } from '@/types/task';
import type { TeamMember } from '@/types/team';
import styles from './Lane.module.css';

/**
 * Props for a lane. `share` is this lane's fraction of the visible tasks, from 0 to 1.
 * `emptyContent` replaces the lane's usual empty text.
 */
interface LaneProps {
  status: Status;
  ids: string[];
  share: number;
  isTarget: boolean;
  taskById: Map<string, Task>;
  memberById: Map<string, TeamMember>;
  labelById: Map<string, Label>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (status: Status) => void;
  emptyContent?: ReactNode;
}

/**
 * One column of the board: header, load rule and sortable cards. Empty lanes accept drops.
 * @param props.status - The lane this column shows.
 * @param props.ids - The card ids in this lane, in display order.
 * @param props.share - This lane's fraction of the visible tasks, from 0 to 1.
 * @param props.isTarget - Whether a card dragged from another lane is over this one.
 * @param props.taskById - Looks up each card's task.
 * @param props.memberById - Looks up the people assigned to each card.
 * @param props.labelById - Looks up the labels on each card.
 * @param props.selectedId - The task open in the panel, if any.
 * @param props.onSelect - Opens a task in the panel.
 * @param props.onDelete - Deletes a task.
 * @param props.onAdd - Starts a new task in this lane.
 * @param props.emptyContent - Replaces the lane's usual empty text.
 * @returns The lane section, registered as a drop target.
 */
export function Lane({
  status,
  ids,
  share,
  isTarget,
  taskById,
  memberById,
  labelById,
  selectedId,
  onSelect,
  onDelete,
  onAdd,
  emptyContent,
}: LaneProps) {
  const { setNodeRef } = useDroppable({ id: laneDropId(status) });
  const lane = LANE[status]; // This lane's display details.

  return (
    <section
      ref={setNodeRef}
      className={cx(styles.lane, isTarget && styles.laneTarget)}
      aria-label={lane.name}
      data-lane={status}
    >
      <header className={styles.laneHead}>
        <StatusMark status={status} />
        <h2 className={styles.laneName}>{lane.name}</h2>
        <span className={styles.count} data-tnum>
          {ids.length}
        </span>
        <IconButton label={`Add a task to ${lane.name}`} className={styles.laneAdd} onClick={() => onAdd(status)}>
          <Plus size={16} aria-hidden="true" />
        </IconButton>
      </header>
      <div className={styles.loadTrack} aria-hidden="true">
        <span className={styles.loadFill} data-status={status} style={{ transform: `scaleX(${share})` }} />
      </div>
      <SortableContext id={status} items={ids} strategy={verticalListSortingStrategy}>
        <ul className={styles.cards}>
          {ids.map((id) => {
            const task = taskById.get(id);
            if (!task) return null;
            return (
              <SortableCard
                key={id}
                task={task}
                status={status}
                members={task.assignee_ids.flatMap((memberId) => memberById.get(memberId) ?? [])}
                labels={task.label_ids.flatMap((labelId) => labelById.get(labelId) ?? [])}
                selected={selectedId === id}
                onSelect={onSelect}
                onDelete={onDelete}
              />
            );
          })}
          {ids.length === 0 && <li className={styles.empty}>{emptyContent ?? lane.empty}</li>}
        </ul>
      </SortableContext>
    </section>
  );
}
