import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loadSampleBoard } from '@/actions/sampleBoard';
import { friendlyError, unwrap } from '@/lib/errors';
import { showToast } from '@/lib/ui/toast';
import { boardKey } from './boardQuery';

/**
 * Loads the sample tasks into an empty board. Not optimistic: the button shows its loading state
 * until the board has really been filled.
 * @param uid - The signed-in guest, which scopes the cache entry.
 * @returns The mutation, whose `mutate` starts the load and `isPending` covers the refetch too.
 */
export function useSampleBoard(uid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => unwrap(await loadSampleBoard()),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardKey(uid) }),
    onError: (error) => showToast(friendlyError(error, 'Couldn’t load the sample board.'), 'danger'),
  });
}
