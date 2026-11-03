import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * A Supabase client for server actions, acting as the guest in the request's cookies. It uses
 * only the publishable key, so RLS applies exactly as it does in the browser. Create one per request.
 * @returns A Supabase client acting as the request's guest.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
    {
      cookies: {
        /**
         * Hands the request's cookies to Supabase.
         * @returns All cookies on the request.
         */
        getAll() {
          return cookieStore.getAll();
        },
        /**
         * Stores a refreshed session on the response.
         * @param cookiesToSet - The refreshed session cookies.
         */
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        },
      },
    },
  );
}
