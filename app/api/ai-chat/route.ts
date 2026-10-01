import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { consumeDailyQuota, quotaMessage } from "@/lib/ai-quota";
import { COMPETITIONS, FORMAT_LABEL } from "@/lib/competitions";

export const maxDuration = 30;

// The real event list, so the chat never has to guess which events are tests,
// role plays or presentations (it once called Business Ethics a role play).
const EVENT_LIST = COMPETITIONS.map((c) => `- ${c.name}: ${FORMAT_LABEL[c.format]}.${c.duration ? ` ${c.duration}` : ""}`).join("\n");

const SYSTEM = `You are a helpful assistant for ChapterPrep, a free all-in-one prep platform for FBLA (Future Business Leaders of America) chapters at chapterprep.com. Answer questions about FBLA competitive events, how to prepare, study strategies, the competition guides, AI practice tests, deadlines, chapter management, and general business concepts that show up on FBLA objective tests (accounting, business law, economics, marketing, etc).

Keep every reply short: 2 to 4 sentences, under 70 words. Lead with the answer, skip preamble and filler. Be encouraging and practical. No em dashes. No asterisks. No emojis.

IMPORTANT: ChapterPrep is an independent student project. It is NOT affiliated with, endorsed by, or sponsored by Future Business Leaders of America, Inc. If anyone asks whether you are official, affiliated with FBLA, or speak for FBLA, say plainly that you are not and point them to fbla.org for official information. Never imply endorsement or affiliation. For anything binding (eligibility, rules, deadlines, advancement), tell the user to confirm with their chapter advisor and FBLA's official event guidelines.

Here is every high school event and how it is judged. Use only this list for event names and formats; never call an event a role play, test or presentation unless this list says so. If something is not covered here, say you are not sure and point to the event's page on chapterprep.com/competitions.
${EVENT_LIST}`;

// Signed out: 7 messages per IP per day; signed in: 60 per account per day.
// The daily caps live in Supabase (lib/ai-quota, migration 0021). The
// in-memory window below is only a burst guard per serverless instance.
const IP_LIMIT = 7;
const WINDOW_MS = 24 * 60 * 60 * 1000;

// Keep the conversation we forward to Anthropic small and well-formed: a public
// endpoint must not let a caller POST a giant array or inject arbitrary roles.
type ChatMsg = { role: "user" | "assistant"; content: string };
function sanitizeMessages(raw: unknown): ChatMsg[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: ChatMsg[] = [];
  for (const m of raw.slice(-12)) {
    if (!m || typeof m !== "object") continue;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if ((role === "user" || role === "assistant") && typeof content === "string" && content.trim()) {
      out.push({ role, content: content.slice(0, 2000) });
    }
  }
  // Bound the TOTAL forwarded size too: keep the most recent messages within
  // ~10k chars so a caller cannot force a large (costly) prompt by padding turns.
  const capped: ChatMsg[] = [];
  let total = 0;
  for (let i = out.length - 1; i >= 0; i--) {
    if (capped.length && total + out[i].content.length > 10000) break;
    total += out[i].content.length;
    capped.unshift(out[i]);
  }
  return capped.length ? capped : null;
}

async function signedInUserId(): Promise<string | null> {
  try {
    const supabase = await getSupabaseServer();
    if (!supabase) return null;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  // Reject oversized bodies before we parse them into memory (the array is
  // trimmed by sanitizeMessages afterwards, but cap the raw payload first).
  const len = Number(req.headers.get("content-length") || 0);
  if (len > 64 * 1024) {
    return Response.json({ content: "Message too large." }, { status: 413 });
  }

  const userId = await signedInUserId();

  if (!userId && !rateLimit(`aichat:${getClientIP(req)}`, IP_LIMIT, WINDOW_MS)) {
    return Response.json({ content: quotaMessage("chat", false) }, { status: 429 });
  }
  const capped = await consumeDailyQuota(userId ? { userId } : { ip: getClientIP(req) }, "chat");
  if (capped) {
    return Response.json({ content: capped }, { status: 429 });
  }

  try {
    const body = await req.json().catch(() => null);
    const messages = sanitizeMessages(body?.messages);
    if (!messages) {
      return Response.json({ content: "Please send a valid message." }, { status: 400 });
    }
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return Response.json({ content: "AI chat is not configured on this deployment." });

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: SYSTEM,
        messages,
      }),
      // A hung upstream must not hold the function open until the platform kills it.
      signal: AbortSignal.timeout(20000),
    });

    if (!r.ok) {
      return Response.json(
        { content: "The assistant is busy right now. Please try again in a moment." },
        { status: 503 }
      );
    }
    const data = await r.json();
    return Response.json({ content: data.content?.[0]?.text ?? "Something went wrong." });
  } catch {
    return Response.json({ content: "Something went wrong. Please try again." }, { status: 500 });
  }
}
