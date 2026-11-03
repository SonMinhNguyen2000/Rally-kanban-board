import type { Status } from '@/types/task';

// Drop target ids carry a prefix, so they can't collide with task ids (which are UUIDs).
const LANE_PREFIX = 'lane:';
const TRAY_PREFIX = 'tray:';

/**
 * The drop target id for a whole lane.
 * @param status - The lane.
 * @returns The lane's drop target id.
 */
export const laneDropId = (status: Status) => `${LANE_PREFIX}${status}`;

/**
 * The drop target id for a lane's button in the phone drag tray.
 * @param status - The lane.
 * @returns The drop target id of the lane's tray button.
 */
export const trayDropId = (status: Status) => `${TRAY_PREFIX}${status}`;

/**
 * Whether a drop target is a whole lane.
 * @param id - A drop target id.
 * @returns True for a lane's id.
 */
export function isLaneId(id: unknown): id is string {
  return typeof id === 'string' && id.startsWith(LANE_PREFIX);
}

/**
 * Whether a drop target is a tray button.
 * @param id - A drop target id.
 * @returns True for a tray button's id.
 */
export function isTrayId(id: unknown): id is string {
  return typeof id === 'string' && id.startsWith(TRAY_PREFIX);
}

/**
 * The lane a lane or tray drop target stands for.
 * @param id - A lane or tray drop target id.
 * @returns The lane it stands for.
 */
export function statusFromDropId(id: string): Status {
  return id.slice(id.indexOf(':') + 1) as Status;
}
