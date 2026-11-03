import type { PaletteColor } from '@/types/palette';
import type { Priority, Status } from '@/types/task';

/** One task on the sample board. People and labels are referred to by name. */
export interface SampleTask {
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  /** Days from today, negative for the past. Relative, so the board never goes stale. */
  dueInDays: number | null;
  assignees: string[];
  labels: string[];
  comments: string[];
}

/** The invented team on the sample board. */
export const SAMPLE_MEMBERS: { name: string; color: PaletteColor }[] = [
  { name: 'Maya Chen', color: 'rose' },
  { name: 'Theo Brooks', color: 'azure' },
  { name: 'Priya Shah', color: 'ochre' },
  { name: 'Jonah Williams', color: 'teal' },
  { name: 'Sofia Alvarez', color: 'plum' },
  { name: 'Marcus Green', color: 'cobalt' },
];

/** The labels on the sample board. */
export const SAMPLE_LABELS: { name: string; color: PaletteColor }[] = [
  { name: 'Design', color: 'rose' },
  { name: 'Engineering', color: 'azure' },
  { name: 'Research', color: 'plum' },
  { name: 'Growth', color: 'moss' },
  { name: 'Urgent', color: 'rust' },
  { name: 'Accessibility', color: 'teal' },
  { name: 'Planning', color: 'ochre' },
  { name: 'Launch', color: 'cobalt' },
];

/** The sample tasks, in display order within each lane. They mix overdue, due soon and later. */
export const SAMPLE_TASKS: SampleTask[] = [
  {
    title: 'Outline the Q4 launch plan',
    description: 'Bring the product, marketing, and support milestones into one launch plan.',
    status: 'todo',
    priority: 'high',
    dueInDays: 1,
    assignees: ['Maya Chen', 'Priya Shah'],
    labels: ['Planning', 'Launch'],
    comments: [
      'I added the support handoff and beta feedback milestones to the outline.',
      'Let’s review the launch risks together before Thursday.',
    ],
  },
  {
    title: 'Review mobile navigation',
    description: 'Check the compact navigation flows and document any friction before handoff.',
    status: 'todo',
    priority: 'normal',
    dueInDays: 5,
    assignees: ['Sofia Alvarez'],
    labels: ['Design', 'Accessibility'],
    comments: [],
  },
  {
    title: 'Interview five active customers',
    description: 'Learn where teams lose momentum between planning and shipping.',
    status: 'todo',
    priority: 'low',
    dueInDays: 9,
    assignees: ['Priya Shah'],
    labels: ['Research'],
    comments: [],
  },
  {
    title: 'Write onboarding empty states',
    description: 'Draft concise guidance for a new workspace, empty lane, and first task.',
    status: 'in_progress',
    priority: 'high',
    dueInDays: 0,
    assignees: ['Maya Chen', 'Jonah Williams'],
    labels: ['Design', 'Growth'],
    comments: ['The first draft uses the same language as the empty filters state.'],
  },
  {
    title: 'Add optimistic task updates',
    description: 'Keep cards responsive while edits, moves, and deletes are being saved.',
    status: 'in_progress',
    priority: 'high',
    dueInDays: 2,
    assignees: ['Theo Brooks'],
    labels: ['Engineering', 'Urgent'],
    comments: ['Optimistic deletes now restore the card and show a toast when the request fails.'],
  },
  {
    title: 'Persist theme preference',
    description: 'Save system, light, and dark theme choices across visits.',
    status: 'in_progress',
    priority: 'normal',
    dueInDays: null,
    assignees: ['Theo Brooks'],
    labels: ['Engineering'],
    comments: [],
  },
  {
    title: 'Run keyboard accessibility pass',
    description: 'Verify focus order, menu keyboard behavior, drag announcements, and dialog escape.',
    status: 'in_review',
    priority: 'high',
    dueInDays: -1,
    assignees: ['Marcus Green', 'Maya Chen'],
    labels: ['Accessibility', 'Launch'],
    comments: ['The menu and confirmation dialog are ready for a keyboard-only pass.'],
  },
  {
    title: 'Test narrow board layout',
    description: 'Check filters, task cards, and the details panel at phone and tablet widths.',
    status: 'in_review',
    priority: 'normal',
    dueInDays: 4,
    assignees: ['Sofia Alvarez'],
    labels: ['Design'],
    comments: ['The details panel covers the board below the wide-screen breakpoint.'],
  },
  {
    title: 'Confirm release checklist',
    description: 'Review migrations, error states, analytics, and the final handoff notes.',
    status: 'in_review',
    priority: 'low',
    dueInDays: 7,
    assignees: ['Jonah Williams'],
    labels: ['Launch'],
    comments: [],
  },
  {
    title: 'Ship the board refresh',
    description: 'The updated board is live with the new visual system and task interactions.',
    status: 'done',
    priority: 'high',
    dueInDays: -3,
    assignees: ['Theo Brooks'],
    labels: ['Growth'],
    comments: ['The initial events are visible in the local dashboard.'],
  },
  {
    title: 'Set up product metrics',
    description: 'Track task creation, completion, filtering, and time to first useful action.',
    status: 'done',
    priority: 'normal',
    dueInDays: -2,
    assignees: ['Priya Shah'],
    labels: ['Planning'],
    comments: [],
  },
  {
    title: 'Archive the old visual tokens',
    description: 'Remove references to the retired palette after the migration is verified.',
    status: 'done',
    priority: 'low',
    dueInDays: null,
    assignees: ['Marcus Green'],
    labels: ['Engineering'],
    comments: [],
  },
];

/**
 * Turns a day offset into a due date.
 * @param days - Days from `now`, negative for the past.
 * @param now - The day to count from.
 * @returns The date as YYYY-MM-DD.
 */
export function dueDateIn(days: number, now = new Date()): string {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
