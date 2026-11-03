import type { Priority } from './task';

/** The filter bar's state. An empty list means that filter is off. */
export interface Filters {
  search: string;
  priorities: Priority[];
  assignees: string[];
  labels: string[];
}

/** The filter bar with nothing applied. */
export const NO_FILTERS: Filters = { search: '', priorities: [], assignees: [], labels: [] };
