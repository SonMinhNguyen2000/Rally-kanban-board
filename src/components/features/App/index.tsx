'use client';

import { BoardScreen } from '@/components/features/BoardScreen';
import { BoardSkeleton } from '@/components/features/BoardSkeleton';
import { Failure } from '@/components/features/Failure';
import { useUserId } from '@/lib/auth/useUserId';
import { isConfigured } from '@/lib/supabase/client';

/**
 * Gets a guest session, then shows the board, or says what went wrong.
 * @returns The board, its loading skeleton, or a failure message.
 */
export function App() {
  const session = useUserId();

  if (!isConfigured) {
    return (
      <Failure
        title="Rally isn’t connected yet"
        body="Copy .env.example to .env.local, set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, then restart the dev server."
      />
    );
  }
  if (session.isPending) return <BoardSkeleton />;
  if (session.isError) {
    return (
      <Failure
        title="Can’t start your board"
        body="Rally couldn’t set up your session. Check your connection and try again."
        onRetry={() => void session.refetch()}
      />
    );
  }
  return <BoardScreen uid={session.data} />;
}
