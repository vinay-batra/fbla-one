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
import { DAILY_LIMITS } from "./ai-limits";

export { DAILY_LIMITS };
export type QuotaKind = keyof typeof DAILY_LIMITS;

/**
 * One cap for the whole site, on top of the per-account and per-IP caps, so a
 * flood of throwaway accounts or rotating IPs cannot run up an unbounded bill.
 * At the costs above this is roughly $60 a day at most. Raise it when real
 * traffic needs more; until then hitting it means something is off.
 */
export const GLOBAL_DAILY_LIMITS: Record<QuotaKind, number> = {
  questions: 3000,
  checks: 3900,
  judge: 600,
  chat: 3000,
};

const GLOBAL_MESSAGE =
  "ChapterPrep has hit its daily limit for AI practice. It resets at midnight Eastern.";

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
    preview: `You've used all ${DAILY_LIMITS.chat.preview} free messages for today. Sign up for free to keep going.`,
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

async function consume(client: SupabaseClient, key: string, kind: QuotaKind, amount: number, limit: number): Promise<boolean> {
  try {
    const { data, error } = await client.rpc("consume_ai_quota", {
      p_key: key,
      p_kind: kind,
      p_amount: Math.ceil(amount),
      p_limit: limit,
    });
    if (error || typeof data !== "number") {
      // Failing open keeps students working through an outage, but it also
      // means no caps: say so in the logs instead of silently.
      console.warn("ai quota check failed, allowing the request:", error?.message ?? data);
      return true;
    }
    return data >= 0;
  } catch (e) {
    console.warn("ai quota check threw, allowing the request:", e);
    return true;
  }
}

/**
 * Counts `amount` against today's caps: first the account's (or IP's), then
 * the whole site's. Returns null when the request may go ahead, or the message
 * to show when a cap is reached. Any other failure (no service key, migration
 * not applied yet, Supabase down) lets the request through: students should
 * never be locked out by an outage, and the burst limiter still applies.
 */
export async function consumeDailyQuota(
  identity: { userId: string } | { ip: string },
  kind: QuotaKind,
  amount = 1
): Promise<string | null> {
  const client = adminClient();
  if (!client) console.warn("ai quota: no Supabase service key, so daily caps are off");
  if (!client || amount < 1) return null;
  const isAccount = "userId" in identity;
  const key = isAccount ? `user:${identity.userId}` : `ip:${identity.ip}`;
  if (!(await consume(client, key, kind, amount, DAILY_LIMITS[kind][isAccount ? "account" : "preview"]))) {
    return quotaMessage(kind, isAccount);
  }
  if (!(await consume(client, "global", kind, amount, GLOBAL_DAILY_LIMITS[kind]))) {
    return GLOBAL_MESSAGE;
  }
  return null;
}

export function quotaMessage(kind: QuotaKind, isAccount: boolean): string {
  return QUOTA_MESSAGES[kind][isAccount ? "account" : "preview"];
}
