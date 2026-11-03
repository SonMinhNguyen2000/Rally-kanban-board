import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

/**
 * Runs before each matched request to keep the guest's session fresh.
 * @param request - The incoming request.
 * @returns The response to continue with, carrying any refreshed cookies.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

/** Skips static files, which never need a session. */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.svg).*)'],
};
