import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { boardKey } from './boardQuery';
import { isWriting } from './optimisticWrite';

// Every table the board displays. All of them are in the supabase_realtime publication.
const TABLES = ['tasks', 'team_members', 'labels', 'task_assignees', 'task_labels', 'comments', 'task_activity'];

// One write fires several events, so they are gathered up into a single refetch.
const FLUSH_MS = 150;

/**
 * Keeps the cache in step with other tabs and devices. Events only trigger a refetch, so RLS
 * remains the single source of what this user can see. Returns false while disconnected.
 * @param uid - The guest's user id.
 * @returns True while connected, false while reconnecting.
 */
export function useRealtimeSync(uid: string): boolean {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined; // The pending flush.

    /** Refetches, unless a write is saving, which would refetch itself and could be undone. */
    const flush = () => {
      if (isWriting(qc)) {
        timer = setTimeout(flush, FLUSH_MS);
        return;
      }
      void qc.invalidateQueries({ queryKey: boardKey(uid) });
      void qc.invalidateQueries({ queryKey: ['timeline'] });
    };

    /** Restarts the wait, so a burst of events causes one refetch. */
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(flush, FLUSH_MS);
    };

    const channel = supabase.channel(`board:${uid}`);
    for (const table of TABLES) {
      channel.on(
        'postgres_changes',
        // The filter keeps other users' DELETE events away.
        { event: '*', schema: 'public', table, filter: `user_id=eq.${uid}` },
        schedule,
      );
    }
    // SUBSCRIBED arrives before the listener is ready, so this is the moment to catch up on
    // anything missed, including while disconnected.
    channel.on('system', {}, (message: { extension?: string; status?: string }) => {
      if (message.extension === 'postgres_changes' && message.status === 'ok') {
        setConnected(true);
        schedule();
      }
    });
    channel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') setConnected(false);
    });

    return () => {
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [qc, uid]);

  return connected;
}
