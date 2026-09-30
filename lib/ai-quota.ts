import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Daily AI caps, stored in Supabase (migration 0021) so they hold across
 * server restarts and every serverless instance. They reset at midnight US
 * Eastern. The in-memory limiter in lib/rate-limit still handles bursts.
 *
 * Measured costs behind the numbers (Sept 2026 prices): a 20-question test is
 * about $0.25 (most of it the second-model check), a full 100-question
 * simulation about $1.20 (roughly 130 questions are written to keep 100), and
 * a judge round about $0.10. The account caps below cost at most about $3.50 a
 * day per account, and a normal student uses a fraction of that.
 *
 * "checks" sits above "questions" on purpose: a question can only be checked
 * after it is written, so a real student hits the question cap first. If the
 * checker were capped first, questions would reach students unchecked.
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

export type QuotaKind = keyof typeof DAILY_LIMITS;

export const QUOTA_MESSAGES: Record<QuotaKind, { account: string; preview: string }> = {
  questions: {
    account: "You have used today's practice questions. They reset at midnight Eastern.",
    preview: "You have used today's free preview questions. Sign up free to keep practicing.",
  },
  checks: {
    account: "You have used today's practice questions. They reset at midnight Eastern.",
    preview: "You have used today's free preview questions. Sign up free to keep practicing.",
  },
  judge: {
    account: "You have used today's judge rounds. They reset at midnight Eastern.",
    preview: "You have used today's free judge rounds. Sign up free to keep practicing.",
  },
  chat: {
    account: "You have used today's chat messages. They reset at midnight Eastern.",
    preview: "You've used all 7 free messages for today. Sign up for free to keep going.",
  },
};

let admin: SupabaseClient | null | undefined;
function adminClient(): SupabaseClient | null {
  if (admin !== undefined) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  admin = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return admin;
}

/**
 * Counts `amount` against today's cap. Returns false only when the database
 * says the cap is reached. Any other failure (no service key, migration not
 * applied yet, Supabase down) lets the request through: students should never
 * be locked out by an outage, and the burst limiter still applies.
 */
export async function consumeDailyQuota(
  identity: { userId: string } | { ip: string },
  kind: QuotaKind,
  amount = 1
): Promise<boolean> {
  const client = adminClient();
  if (!client || amount < 1) return true;
  const isAccount = "userId" in identity;
  const key = isAccount ? `user:${identity.userId}` : `ip:${identity.ip}`;
  const limit = DAILY_LIMITS[kind][isAccount ? "account" : "preview"];
  try {
    const { data, error } = await client.rpc("consume_ai_quota", {
      p_key: key,
      p_kind: kind,
      p_amount: Math.ceil(amount),
      p_limit: limit,
    });
    if (error || typeof data !== "number") return true;
    return data >= 0;
  } catch {
    return true;
  }
}

export function quotaMessage(kind: QuotaKind, isAccount: boolean): string {
  return QUOTA_MESSAGES[kind][isAccount ? "account" : "preview"];
}
