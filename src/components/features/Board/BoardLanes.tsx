import type { ReactNode } from 'react';
import { Lane } from '@/components/features/Lane';
import type { Label } from '@/types/label';
import type { Status, Task } from '@/types/task';
import type { TeamMember } from '@/types/team';
import type { Columns } from '@/lib/board/columns';

interface BoardLanesProps {
  tasks: Task[];
  columns: Columns;
  members: TeamMember[];
  labels: Label[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (status: Status) => void;
  emptyNotice?: ReactNode;
  taskById: Map<string, Task>;
  dragOrigin?: Status;
  draggedId?: string;
}

export function BoardLanes({
  tasks,
  columns,
  members,
  labels,
  selectedId,
  onSelect,
  onDelete,
  onAdd,
  emptyNotice,
  taskById,
  dragOrigin,
  draggedId,
}: BoardLanesProps) {
  const memberById = new Map(members.map((member) => [member.id, member]));
  const labelById = new Map(labels.map((label) => [label.id, label]));

  return (
    <>
      {(['todo', 'in_progress', 'in_review', 'done'] as const).map((status) => (
        <Lane
          key={status}
          status={status}
          ids={columns[status]}
          share={tasks.length === 0 ? 0 : columns[status].length / tasks.length}
          isTarget={Boolean(dragOrigin && dragOrigin !== status && columns[status].includes(draggedId ?? ''))}
          taskById={taskById}
          memberById={memberById}
          labelById={labelById}
          selectedId={selectedId}
          onSelect={onSelect}
          onDelete={onDelete}
          onAdd={onAdd}
          emptyContent={status === 'todo' ? emptyNotice : undefined}
        />
      ))}
    </>
  );
}
