import { closestCenter, closestCorners, pointerWithin, type CollisionDetection } from '@dnd-kit/core';
import { isLaneId, isTrayId, statusFromDropId } from '@/lib/board/dropTargets';

/**
 * Chooses the drop target for a dragged card. The phone tray wins if the pointer is on it.
 * Otherwise, for a pointer, the lane under it decides, then the nearest card inside that lane.
 * Using the pointer rather than card corners stops the target flickering between tall lanes.
 * A keyboard drag has no pointer, so geometry decides.
 * @param args - The drop targets, the dragged card's position and the pointer, from dnd-kit.
 * @returns The chosen drop targets, or an empty list if the pointer is off the board.
 */
export const collisionDetection: CollisionDetection = (args) => {
  const containers = args.droppableContainers;
  const tray = containers.filter((container) => isTrayId(container.id));
  const trayHit = pointerWithin({ ...args, droppableContainers: tray });
  if (trayHit.length > 0) return trayHit;

  const board = containers.filter((container) => !isTrayId(container.id));
  if (!args.pointerCoordinates) return closestCorners({ ...args, droppableContainers: board });

  const lanes = board.filter((container) => isLaneId(container.id));
  const laneHit = pointerWithin({ ...args, droppableContainers: lanes })[0];
  if (!laneHit) return [];

  const laneStatus = statusFromDropId(String(laneHit.id)); // The lane under the pointer.
  const cards = board.filter(
    (container) => !isLaneId(container.id) && container.data.current?.status === laneStatus,
  );
  if (cards.length === 0) return [laneHit];
  return closestCenter({ ...args, droppableContainers: cards });
};
