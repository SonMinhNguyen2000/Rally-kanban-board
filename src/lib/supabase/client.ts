import { createBrowserClient } from '@supabase/ssr';

// Read by name, because Next.js inlines NEXT_PUBLIC_ values into the browser bundle by text match.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** False until .env.local is filled in. The app shows a setup message rather than failing. */
export const isConfigured = Boolean(url && publishableKey);

/**
 * The browser's Supabase client: anonymous sign-in, reads and Realtime. It keeps the session
 * in cookies, which is what lets server actions act as the same guest. Placeholders keep the
 * import safe when unconfigured, and createBrowserClient reuses one instance per browser tab.
 * @returns The browser's Supabase client.
 */
export function createClient() {
  return createBrowserClient(url ?? 'http://localhost', publishableKey ?? 'missing');
}
