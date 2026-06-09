import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

const SYSTEM = `You are a helpful assistant for FBLA One, a free all-in-one prep platform for FBLA (Future Business Leaders of America) chapters at fbla.one. Answer questions about FBLA competitive events, how to prepare, study strategies, the 55 competition guides, AI practice tests, deadlines, chapter management, and general business concepts that show up on FBLA objective tests (accounting, business law, economics, marketing, etc).

Keep every reply short: 2 to 4 sentences, under 70 words. Lead with the answer, skip preamble and filler. Be encouraging and practical. No em dashes. No asterisks. No emojis.`;

// In-memory per-IP rate limit. 5 messages per IP per 24-hour window.
// Only applies to unauthenticated users - signed-in users are unlimited.
// Resets on cold starts but provides solid protection against casual abuse.
// Cap to 2000 IPs to prevent unbounded memory growth.
const IP_LIMIT = 5;
const WINDOW_MS = 24 * 60 * 60 * 1000;
const _store = new Map<string, number[]>();

function getIp(req: NextRequest): string {
  // Prefer Vercel's own header (set at the edge, not client-controllable) over
  // the spoofable x-real-ip / x-forwarded-for a caller can inject.
  return (
    (req.headers.get("x-vercel-forwarded-for") || "").split(",")[0].trim() ||
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

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

function isRateLimited(ip: string): boolean {
  // Fail CLOSED when we can't identify the caller, instead of bucketing every
  // header-less request into one shared "unknown" key that anyone can exhaust /
  // ride past the cap. NOTE: this Map is per serverless instance and resets on
  // cold start - a true global limit needs a shared store (Vercel KV / Upstash);
  // tracked as issue #20.
  if (!ip || ip === "unknown") return true;
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const hits = (_store.get(ip) || []).filter((t) => t > cutoff);
  if (hits.length >= IP_LIMIT) {
    _store.set(ip, hits);
    return true;
  }
  hits.push(now);
  _store.set(ip, hits);
  if (_store.size > 2000) {
    _store.delete(_store.keys().next().value as string);
  }
  return false;
}

async function isSignedIn(): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();
    if (!supabase) return false;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  // Reject oversized bodies before we parse them into memory (the array is
  // trimmed by sanitizeMessages afterwards, but cap the raw payload first).
  const len = Number(req.headers.get("content-length") || 0);
  if (len > 64 * 1024) {
    return Response.json({ content: "Message too large." }, { status: 413 });
  }

  // Signed-in users are unlimited on public AI chat.
  const signedIn = await isSignedIn();

  if (!signedIn) {
    const ip = getIp(req);
    if (isRateLimited(ip)) {
      return Response.json(
        { content: "You've used all 5 free messages for today. Sign up for free to keep going." },
        { status: 429 }
      );
    }
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
