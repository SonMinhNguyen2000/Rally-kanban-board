import type { Label } from './label';
import type { Task } from './task';
import type { TeamMember } from './team';

/** Everything the board screen loads as one cached query. */
export interface Board {
  tasks: Task[];
  members: TeamMember[];
  labels: Label[];
}
