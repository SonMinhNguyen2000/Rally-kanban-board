import { LANE, PRIORITY_NAME, type Priority, type Status } from '@/types/task';
import type { Activity } from '@/types/timeline';
import { formatDay } from './dates';

/**
 * A lane's display name from a stored status.
 * @param value - The stored status.
 * @returns The lane's name, or "Unknown" for a value it doesn't recognise.
 */
const laneName = (value: string | null | undefined) => LANE[value as Status]?.name ?? 'Unknown';

/**
 * A priority's display name from a stored value.
 * @param value - The stored priority.
 * @returns The priority's name, or "Unknown" for a value it doesn't recognise.
 */
const priorityName = (value: string | null | undefined) => PRIORITY_NAME[value as Priority] ?? 'Unknown';

/**
 * Words a history entry for the timeline, such as "Moved from To Do → In Progress".
 * @param entry - The history entry, with its kind and payload.
 * @param now - The current time, which tests can fix.
 * @returns One line of timeline text.
 */
export function describeActivity(entry: Pick<Activity, 'kind' | 'payload'>, now = new Date()): string {
  const { from, to, name, status } = entry.payload;
  switch (entry.kind) {
    case 'created':
      return `Created in ${laneName(status)}`;
    case 'title_edited':
      return `Renamed from "${from ?? ''}" to "${to ?? ''}"`;
    case 'description_edited':
      return 'Edited the description';
    case 'moved':
      return `Moved from ${laneName(from)} → ${laneName(to)}`;
    case 'priority_changed':
      return `Changed priority from ${priorityName(from)} → ${priorityName(to)}`;
    case 'due_date_changed':
      if (!to) return 'Removed the due date';
      return from
        ? `Changed due date from ${formatDay(from, now)} → ${formatDay(to, now)}`
        : `Set due date to ${formatDay(to, now)}`;
    case 'assignee_added':
      return `Assigned ${name ?? 'a member'}`;
    case 'assignee_removed':
      return `Unassigned ${name ?? 'a member'}`;
    case 'label_added':
      return `Added label ${name ?? ''}`.trim();
    case 'label_removed':
      return `Removed label ${name ?? ''}`.trim();
    case 'comment_added':
      return 'Left a comment, since deleted';
  }
}
