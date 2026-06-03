import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getCompetition } from "@/lib/competitions";
import { FORMAT_LABEL } from "@/lib/competitions";

const SYSTEM_PROMPT = `You are an expert question writer for FBLA (Future Business Leaders of America) competitive events. You create realistic practice questions that exactly match the style, vocabulary, and difficulty of actual FBLA national-level objective tests.

CRITICAL OUTPUT FORMAT - follow exactly:
- Output ONLY raw NDJSON: one valid JSON object per line, nothing else
- No markdown, no code fences, no commentary, no blank lines between questions
- Each line must be a complete, valid JSON object with this exact schema:
{"id":1,"question":"Question text here?","options":{"A":"First option","B":"Second option","C":"Third option","D":"Fourth option"},"correct":"A","explanation":"Why A is correct, plus the key reason the most tempting wrong option is wrong."}

Question quality rules:
- Distractors must be plausible - rooted in common misconceptions, not obviously wrong
- Use precise professional vocabulary appropriate to the subject
- Mix question types: definition (20%), scenario/application (50%), compare/contrast (20%), calculation when applicable (10%)
- Never repeat the same concept twice across the test
- Difficulty should match actual FBLA national competition level - challenging but fair
- Keep each explanation to ONE or TWO sentences: why the correct answer is right and the single biggest reason a student picks the wrong one. Do not walk through all four options. Concise explanations matter - the whole test must stream quickly.
- Use plain hyphens, never em dashes or en dashes. No emojis or decorative symbols in any field. The question and explanation strings are shown verbatim to students.`;

function buildUserPrompt(slug: string, count: number): string {
  const c = getCompetition(slug);
  if (!c) throw new Error("Competition not found");

  const topicList = (c.topics ?? []).map((t, i) => `${i + 1}. ${t}`).join("\n");
  const durationLine = c.duration ? `Duration: ${c.duration}` : "";

  return `Generate exactly ${count} practice questions for the FBLA ${c.name} event.

Format: ${FORMAT_LABEL[c.format]}${durationLine ? `\n${durationLine}` : ""}

Topics to cover (distribute questions proportionally across all topics):
${topicList || "General business knowledge relevant to this event"}

Event overview: ${c.longDescription ?? c.description}

Output exactly ${count} questions as NDJSON (one JSON object per line). Cover every major topic area. Vary difficulty from recall to analysis.`;
}

// Best-effort in-memory rate limiter (per serverless instance). Caps practice
// test generations per identity within a rolling window. Durable cross-instance
// protection would need a shared store (e.g. Upstash) - tracked as a follow-up.
const RATE_BUCKET = new Map<string, { n: number; reset: number }>();
function rateLimited(key: string, limit: number, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const e = RATE_BUCKET.get(key);
  if (!e || now > e.reset) {
    RATE_BUCKET.set(key, { n: 1, reset: now + windowMs });
    return false;
  }
  e.n += 1;
  return e.n > limit;
}

export async function POST(req: Request): Promise<Response> {
  // Gate: require an authenticated session OR an active preview cookie before
  // spending Anthropic tokens. Preview mode is intentionally open (advisors try
  // without signing up), so anonymous preview traffic is rate limited per IP.
  const cookieStore = await cookies();
  const inPreview = cookieStore.get("fbla_preview")?.value === "1";
  let rateKey: string;
  if (inPreview) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
    rateKey = `preview:${ip}`;
  } else {
    const supabase = await getSupabaseServer();
    const user = supabase ? (await supabase.auth.getUser()).data.user : null;
    if (!user) {
      return new Response(JSON.stringify({ error: "Sign in to generate practice tests." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    rateKey = `user:${user.id}`;
  }
  if (rateLimited(rateKey, inPreview ? 12 : 40)) {
    return new Response(JSON.stringify({ error: "Rate limit reached. Try again in a few minutes." }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let slug: string;
  let count: number;
  try {
    const body = await req.json();
    slug = body.slug;
    count = Math.min(Math.max(Number(body.count) || 10, 5), 50);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const comp = getCompetition(slug);
  if (!comp) {
    return new Response(JSON.stringify({ error: "Competition not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          // Haiku 4.5 generates objective MCQs ~2-3x faster than Sonnet at
          // comparable quality for this calibrated, well-specified task - the
          // single biggest lever on "the tests take too long". Combined with
          // the now-concise one-line explanations, a 25-question test streams
          // in a fraction of the previous time.
          model: "claude-haiku-4-5-20251001",
          // Scale with question count; concise explanations keep this modest.
          max_tokens: Math.min(12000, count * 220 + 600),
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: buildUserPrompt(slug, count) }],
        });

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Generation failed";
        controller.enqueue(encoder.encode(`\n{"error":${JSON.stringify(msg)}}\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
