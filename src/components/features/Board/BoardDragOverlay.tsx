import { DragOverlay } from '@dnd-kit/core';
import { TaskCard } from '@/components/features/TaskCard';
import type { Label } from '@/types/label';
import type { Task } from '@/types/task';
import type { TeamMember } from '@/types/team';

interface BoardDragOverlayProps {
  task?: Task;
  members: TeamMember[];
  labels: Label[];
  dropAnimation: Parameters<typeof DragOverlay>[0]['dropAnimation'];
}

export function BoardDragOverlay({ task, members, labels, dropAnimation }: BoardDragOverlayProps) {
  return (
    <DragOverlay dropAnimation={dropAnimation} zIndex={80}>
      {task && (
        <TaskCard
          task={task}
          members={task.assignee_ids.flatMap((id) => members.filter((member) => member.id === id))}
          labels={task.label_ids.flatMap((id) => labels.filter((label) => label.id === id))}
          lifted
        />
      )}
    </DragOverlay>
  );
}
