import { createClient } from '@/lib/supabase/client';

// The attempt in progress. React StrictMode mounts twice in development, and an unguarded
// second call would create a second anonymous user.
let pending: Promise<string> | null = null;

/**
 * Finds the current guest, or signs a new one in. A guest who no longer exists gets a fresh
 * session, but an outage throws instead, because signing in again would strand their board.
 * @returns The guest's user id.
 */
async function resolveUserId(): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    const { data: userData, error } = await supabase.auth.getUser();
    if (userData.user) return userData.user.id;
    // Only a 4xx means the server looked and the guest is gone.
    const status = (error as { status?: number } | null)?.status ?? 0;
    if (status < 400 || status >= 500) throw error ?? new Error('Could not verify the session');
    await supabase.auth.signOut({ scope: 'local' });
  }
  const { data: created, error } = await supabase.auth.signInAnonymously();
  if (error || !created.user) throw error ?? new Error('Could not start a session');
  return created.user.id;
}

/**
 * Returns the guest's user id, sharing a single attempt between simultaneous callers.
 * @returns A promise for the guest's user id.
 */
export function ensureUserId(): Promise<string> {
  pending ??= resolveUserId().finally(() => {
    pending = null;
  });
  return pending;
}
