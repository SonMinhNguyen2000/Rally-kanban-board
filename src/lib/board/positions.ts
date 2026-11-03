/** Gap between cards in a freshly numbered lane. Matches private.set_task_position. */
export const POSITION_STEP = 1024;

// Below this the midpoint is close to double precision's limit, so the lane gets renumbered.
const MIN_GAP = 1e-6;

/**
 * Sort key for a card dropped between two neighbours. Returns null when the gap has become
 * too small to split, in which case the caller renumbers the lane.
 * @param before - The position of the card above, if there is one.
 * @param after - The position of the card below, if there is one.
 * @returns The new sort key, or null when the lane needs renumbering.
 */
export function positionBetween(before: number | undefined, after: number | undefined): number | null {
  if (before === undefined && after === undefined) return POSITION_STEP;
  if (before === undefined) return (after as number) - POSITION_STEP;
  if (after === undefined) return before + POSITION_STEP;
  if (after - before < MIN_GAP) return null;
  return (before + after) / 2;
}
