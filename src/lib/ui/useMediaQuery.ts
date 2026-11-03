import { useSyncExternalStore } from 'react';

/** 
 * Tracks a CSS media query.
 * @param query - The CSS media query to track.
 * @returns A boolean indicating whether the media query matches.
 * */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (listener) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', listener);
      return () => list.removeEventListener('change', listener);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
