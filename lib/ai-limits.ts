/**
 * The daily AI caps, kept apart from lib/ai-quota.ts (which imports the
 * Supabase client) so pages that only show the numbers, like the FAQ, do not
 * ship a database client to the browser.
 */
export const DAILY_LIMITS = {
  /** Practice questions written (includes top-ups for dropped questions). */
  questions: { account: 200, preview: 40 },
  /** Questions sent to the second-model check. */
  checks: { account: 260, preview: 60 },
  /** AI Judge calls (a round is two or three calls). */
  judge: { account: 30, preview: 6 },
  /** Public chat messages ("preview" here means signed out, capped per IP). */
  chat: { account: 60, preview: 7 },
} as const;
