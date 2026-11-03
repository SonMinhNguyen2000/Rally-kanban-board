import { useQuery } from '@tanstack/react-query';
import { ensureUserId } from './anonymousSession';

/**
 * The signed-in guest's id, starting a session on first launch. Runs only in the browser.
 * @returns The query holding the user id, or its pending or error state.
 */
export function useUserId() {
  return useQuery({
    queryKey: ['session'],
    queryFn: ensureUserId,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
