import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getCompetition } from "@/lib/competitions";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { consumeDailyQuota } from "@/lib/ai-quota";
import { MAX_VERIFY_BATCH, VERIFIER_MODEL, parseVerifyInput, verifyQuestions, type VerifyInput } from "./verifier";

// Two claude-sonnet-5 calls run side by side per request (a blind solve and a
// keyed audit). Measured about 7s for 6 questions and 22s for 25, so the
// client sends small batches in parallel and this limit is only a backstop.
export const runtime = "nodejs";
export const maxDuration = 60;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function POST(req: Request): Promise<Response> {
  // Same gate as /api/practice-test: a signed-in session or the preview cookie.
  const cookieStore = await cookies();
  // A signed-in account always wins over a leftover preview cookie.
  const supabase = await getSupabaseServer();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const inPreview = !user && cookieStore.get("fbla_preview")?.value === "1";
  let rateKey: string;
  let identity: { userId: string } | { ip: string };
  if (user) {
    rateKey = `verify:user:${user.id}`;
    identity = { userId: user.id };
  } else if (inPreview) {
    rateKey = `verify:preview:${getClientIP(req)}`;
    identity = { ip: getClientIP(req) };
  } else {
    return json({ error: "Sign in to check practice questions." }, 401);
  }
  // Its own namespace so checking never eats into the generation budget. One
  // test is several small batches (a full 100-question simulation is about 15),
  // so the cap is higher than the generator's.
  if (!rateLimit(rateKey, inPreview ? 60 : 150, 10 * 60 * 1000)) {
    return json({ error: "Rate limit reached. Try again in a few minutes." }, 429);
  }

  if (!process.env.ANTHROPIC_API_KEY) return json({ error: "ANTHROPIC_API_KEY not configured" }, 500);

  let slug: unknown;
  let questions: VerifyInput[];
  try {
    const body = (await req.json()) as Record<string, unknown>;
    slug = body?.slug;
    const raw = body?.questions;
    if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_VERIFY_BATCH) throw new Error();
    const parsed = raw.map(parseVerifyInput);
    if (parsed.some((q) => q === null)) throw new Error();
    questions = parsed as VerifyInput[];
  } catch {
    return json({ error: `Send 1 to ${MAX_VERIFY_BATCH} well-formed questions.` }, 400);
  }

  const comp = typeof slug === "string" ? getCompetition(slug) : undefined;
  if (!comp) return json({ error: "Competition not found" }, 404);

  // Daily cap, counted in questions checked. It sits above the question cap,
  // so a real student runs out of new questions before checks.
  const capped = await consumeDailyQuota(identity, "checks", questions.length);
  if (capped) {
    return json({ error: capped }, 429);
  }

  // One attempt, bounded under maxDuration. The coach treats any failure as
  // "checker unavailable" and falls back, so a slow retry would only delay it.
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 50_000, maxRetries: 0 });

  try {
    const { results, audited } = await verifyQuestions(
      client,
      { name: comp.name, topics: comp.topics ?? [], overview: comp.longDescription ?? comp.description },
      questions
    );
    return json({ results, audited, model: VERIFIER_MODEL });
  } catch (err) {
    console.error("verify-questions:", err); // server side: goes to the private Vercel logs
    return json({ error: "The answer checker is unavailable right now." }, 502);
  }
}
