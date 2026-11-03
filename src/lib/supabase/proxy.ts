import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refreshes an expiring session before the request reaches a page or server action, and passes
 * the new cookies along in both directions. It never creates a session or redirects. A new
 * guest signs in from their own browser, because Supabase rate limits anonymous sign-ins per
 * IP address, and signing in from here would make every guest share the server's address.
 * @param request - The incoming request.
 * @returns The response to continue with, carrying any refreshed cookies.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  // Reassigned when cookies change, because the response must be built from the updated request.
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      /**
       * Hands the request's cookies to Supabase.
       * @returns All cookies on the request.
       */
      getAll() {
        return request.cookies.getAll();
      },
      /**
       * Copies a refreshed session onto the request and the response.
       * @param cookiesToSet - The refreshed session cookies.
       */
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  // This call is what triggers the refresh. Its result isn't needed: with no session or an
  // outage it reports an error, and the page handles that itself.
  await supabase.auth.getUser();

  return response;
}
