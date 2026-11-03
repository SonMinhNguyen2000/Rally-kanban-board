import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KeyboardEvent } from 'react';
import { TaskCard } from '@/components/features/TaskCard';
import type { Label } from '@/types/label';
import type { Status, Task } from '@/types/task';
import type { TeamMember } from '@/types/team';
import styles from './SortableCard.module.css';

/** Props for a draggable card. `status` is the lane it is currently rendered in. */
interface SortableCardProps {
  task: Task;
  status: Status;
  members: TeamMember[];
  labels: Label[];
  selected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * A task card that can be dragged. Click or Enter opens it, and Space picks it up.
 * @param props.task - The task to show.
 * @param props.status - The lane the card is currently rendered in.
 * @param props.members - The people assigned to the task.
 * @param props.labels - The labels on the task.
 * @param props.selected - Whether the task is open in the panel.
 * @param props.onSelect - Opens a task in the panel.
 * @param props.onDelete - Deletes a task.
 * @returns The list item holding the card.
 */
export function SortableCard({ task, status, members, labels, selected, onSelect, onDelete }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { status }, // Read by collision detection to find the cards in a lane.
    // Neighbours making room. Matches --dur-reorder and --ease-out in tokens.css.
    transition: { duration: 200, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
  });

  // Kept separately, because this card's own key handler wraps it.
  const startKeyboardDrag = listeners?.onKeyDown as ((event: KeyboardEvent) => void) | undefined;

  return (
    <li
      ref={setNodeRef}
      className={styles.cardItem}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <TaskCard
        task={task}
        members={members}
        labels={labels}
        selected={selected}
        onDetails={() => onSelect(task.id)}
        onDelete={() => onDelete(task.id)}
        placeholder={isDragging}
        rootProps={{
          ...attributes,
          ...listeners,
          'aria-roledescription': 'draggable task',
          'data-task-id': task.id,
          onClick: () => onSelect(task.id),
          onKeyDown: (event: KeyboardEvent) => {
            if (event.key === 'Enter' && !isDragging) {
              event.preventDefault();
              onSelect(task.id);
              return;
            }
            startKeyboardDrag?.(event);
          },
        }}
      />
    </li>
  );
}
