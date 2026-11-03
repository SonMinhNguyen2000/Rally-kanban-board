import type { Priority } from './task';

/** Which tasks the top bar's stats have the board show. */
export type TaskView = 'all' | 'completed' | 'overdue';

/** The filter state. An empty list means that filter is off. */
export interface Filters {
  search: string;
  priorities: Priority[];
  assignees: string[];
  labels: string[];
  view: TaskView;
}

/** The board with nothing applied. */
export const NO_FILTERS: Filters = { search: '', priorities: [], assignees: [], labels: [], view: 'all' };
