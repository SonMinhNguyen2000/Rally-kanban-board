import type { ActionResult } from '@/types/action';

/** 
 * Turns a database or network error into a sentence that says what to do next. 
 * @param error - The error to convert.
 * @param fallback - The fallback message to use if the error cannot be converted.
 * @returns A user-friendly error message.
 */
export function friendlyError(error: unknown, fallback: string): string {
  const { code, message } = (error ?? {}) as { code?: string; message?: string };
  if (code === '23505') return 'That name is already in use. Try a different one.';
  if (code === '23514') return 'That value isn’t allowed. Check it and try again.';
  if (code === '42501' || code === 'PGRST301') return 'Your session has expired. Reload the page to continue.';
  if (message?.toLowerCase().includes('fetch')) return `${fallback} Check your connection and try again.`;
  return fallback;
}

/** 
 * Builds a server action's result from a Supabase error, or from none. 
 * @param error - The error to convert, or null if there is no error.
 * @returns An ActionResult object.
 */
export function toResult(error: { code?: string; message: string } | null): ActionResult {
  return error
    ? { ok: false, error: { code: error.code, message: error.message } }
    : { ok: true, data: undefined };
}

/** 
 * Returns a server action's data, or throws its error so a mutation can roll back.
 * @param result - The result of a server action.
 * @returns The data from the result, or throws the error if the result is not ok.
 */
export function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw result.error;
  return result.data;
}
