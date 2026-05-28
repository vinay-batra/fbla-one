import Anthropic from "@anthropic-ai/sdk";
import { getCompetition } from "@/lib/competitions";
import { FORMAT_LABEL } from "@/lib/competitions";

const SYSTEM_PROMPT = `You are an expert question writer for FBLA (Future Business Leaders of America) competitive events. You create realistic practice questions that exactly match the style, vocabulary, and difficulty of actual FBLA national-level objective tests.

CRITICAL OUTPUT FORMAT — follow exactly:
- Output ONLY raw NDJSON: one valid JSON object per line, nothing else
- No markdown, no code fences, no commentary, no blank lines between questions
- Each line must be a complete, valid JSON object with this exact schema:
{"id":1,"question":"Question text here?","options":{"A":"First option","B":"Second option","C":"Third option","D":"Fourth option"},"correct":"A","explanation":"A is correct because [specific reason]. B is wrong because [reason]. C is wrong because [reason]. D is wrong because [reason]."}

Question quality rules:
- Distractors must be plausible — rooted in common misconceptions, not obviously wrong
- Use precise professional vocabulary appropriate to the subject
- Mix question types: definition (20%), scenario/application (50%), compare/contrast (20%), calculation when applicable (10%)
- Never repeat the same concept twice across the test
- Difficulty should match actual FBLA national competition level — challenging but fair`;

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

export async function POST(req: Request): Promise<Response> {
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
          model: "claude-sonnet-4-5",
          max_tokens: 8000,
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
