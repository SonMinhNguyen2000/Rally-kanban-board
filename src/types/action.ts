/**
 * What every server action returns. Failures are values because Next.js replaces thrown error
 * messages with a generic one in production, which would lose the Postgres code the UI needs.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: { code?: string; message: string } };
