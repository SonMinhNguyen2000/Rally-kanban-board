import { describe, expect, it } from 'vitest';
import { positionBetween } from './positions';

describe('positionBetween', () => {
  it('starts an empty lane at one step', () => expect(positionBetween(undefined, undefined)).toBe(1024));
  it('places above the first card', () => expect(positionBetween(undefined, 1024)).toBe(0));
  it('places below the last card', () => expect(positionBetween(2048, undefined)).toBe(3072));
  it('takes the midpoint', () => expect(positionBetween(1024, 2048)).toBe(1536));
  it('asks for a renumber when the gap is exhausted', () =>
    expect(positionBetween(1, 1 + 1e-9)).toBeNull());

  it('keeps order through repeated inserts until it has to renumber', () => {
    let before = 1024; // Walks towards `after` with each insert.
    const after = 2048;
    let splits = 0;
    for (;;) {
      const mid = positionBetween(before, after);
      if (mid === null) break;
      expect(mid).toBeGreaterThan(before);
      expect(mid).toBeLessThan(after);
      before = mid;
      splits += 1;
    }
    expect(splits).toBeGreaterThan(20);
  });
});
