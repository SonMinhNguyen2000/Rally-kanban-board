import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { friendlyError, unwrap } from '@/lib/errors';
import { showToast } from '@/lib/ui/toast';
import type { ActionResult } from '@/types/action';
import type { Board } from '@/types/board';
import { boardKey } from './boardQuery';

// Shared by every board write, so "is anything saving?" has one answer.
const WRITE_KEY = ['board-write'];

/**
 * Whether a board write is in flight. A refetch started now could undo its optimistic change.
 * @param qc - The query client.
 * @returns True while any board write is saving.
 */
export function isWriting(qc: QueryClient) {
  return qc.isMutating({ mutationKey: WRITE_KEY }) > 0;
}

/**
 * A board write with an optimistic local change. The cache updates in the same tick as the
 * call, which is what lets a dropped card stay put with no flicker. On failure it rolls back
 * and explains. Refetching waits for the last write, so an in-flight read can't undo a newer
 * optimistic change.
 *
 * @param uid - The signed-in guest, which scopes the cache entry.
 * @param write - The server action to call.
 * @param apply - Produces the board as it should look once the write succeeds.
 * @param failure - The message shown if the write fails.
 * @returns A function that starts the write and reports failure through a toast.
 */
export function useBoardWrite<V>(
  uid: string,
  write: (vars: V) => Promise<ActionResult>,
  apply: (board: Board, vars: V) => Board,
  failure: string,
) {
  const qc = useQueryClient();
  const key = boardKey(uid); // The cache entry this write changes.

  const mutation = useMutation({
    mutationKey: WRITE_KEY,
    mutationFn: async ({ vars }: { vars: V; previous: Board | undefined }) => unwrap(await write(vars)),
    onError: (error, { previous }) => {
      if (previous) qc.setQueryData(key, previous);
      showToast(friendlyError(error, failure), 'danger');
    },
    onSettled: () => {
      // This mutation still counts at this point, so 1 means it is the last.
      if (qc.isMutating({ mutationKey: WRITE_KEY }) <= 1) {
        void qc.invalidateQueries({ queryKey: key });
      }
    },
  });

  return (vars: V) => {
    // revert: false, because restoring the pre-fetch state would overwrite the change below.
    void qc.cancelQueries({ queryKey: key }, { revert: false });
    const previous = qc.getQueryData<Board>(key);
    if (previous) qc.setQueryData(key, apply(previous, vars));
    mutation.mutate({ vars, previous });
  };
}
