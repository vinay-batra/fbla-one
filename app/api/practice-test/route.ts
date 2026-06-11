import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getCompetition } from "@/lib/competitions";
import { FORMAT_LABEL } from "@/lib/competitions";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { evaluateExpression } from "@/lib/calc";

// A 50-question Haiku generation can run well past Vercel's plan default
// function timeout (~10-15s), which would sever the stream mid-test. Pin the
// runtime and raise the limit so large tests finish. (Raise further on a plan
// that allows it.)
export const runtime = "nodejs";
export const maxDuration = 60;

// The model computes every number through this tool (lib/calc evaluates it with a
// real parser - exact arithmetic, correct precedence and parentheses, never eval),
// so numeric answer keys are no longer the model's flaky mental math.
const CALCULATOR_TOOL: Anthropic.Tool = {
  name: "calculator",
  description:
    "Evaluate an arithmetic expression and return the exact result. You MUST use this for EVERY calculation - never do arithmetic yourself. Supports + - * / and ^ (exponentiation, including negative and fractional exponents), parentheses, and standard operator precedence. Use explicit parentheses so precedence is unambiguous. Examples: '45 * 1.6', '720 + (18 * 1.5 * 2)', '2000 * ((1 - (1.07)^-6) / 0.07)'. Use only digits and the operators + - * / ^ and parentheses - no variables, units, percent signs, or functions (write 5% as 0.05).",
  input_schema: {
    type: "object",
    properties: {
      expression: {
        type: "string",
        description: "The arithmetic expression to evaluate, e.g. '(84 * (1 - 0.25))'",
      },
    },
    required: ["expression"],
  },
};

// Trim floating-point noise while keeping enough precision for money and ratios.
function formatNumber(n: number): string {
  return String(Math.round(n * 1e6) / 1e6);
}

const SYSTEM_PROMPT = `You are an expert question writer for FBLA (Future Business Leaders of America) competitive events. You write realistic objective questions that match the style, vocabulary, and difficulty of actual FBLA national-level tests, and every keyed answer is factually correct.

CRITICAL OUTPUT FORMAT - follow exactly:
- Output ONLY raw NDJSON: one valid JSON object per line, nothing else
- No markdown, no code fences, no commentary, no blank lines between questions
- Each line must be a complete, valid JSON object with this exact schema:
{"id":1,"question":"Question text here?","options":{"A":"First option","B":"Second option","C":"Third option","D":"Fourth option"},"correct":"A","explanation":"States the correct answer in words and why it is right, then names the most tempting wrong choice by its wording and why it is wrong. Never mentions option letters.","topic":"Exact topic name from the list","calc":"OPTIONAL: the arithmetic expression that evaluates to the correct numeric answer - include for computed-number questions, omit for conceptual ones"}

ACCURACY - this matters more than anything else:
- Before writing a question, work out its single correct answer yourself. Put that exact answer as the text of one option and set "correct" to that option's letter. Re-read the question and confirm the keyed option genuinely answers it before you emit the line.
- Only write questions you are certain of. If you are not fully confident the keyed answer is factually correct, write an easier question on a concept you ARE certain about. A wrong answer key is the worst possible failure - it teaches the student the wrong thing.
- Exactly ONE option may be correct. The other three must be clearly and verifiably wrong, not "also defensible." No two options may mean the same thing.
- Do not use "All of the above", "None of the above", "Both A and B", or any option that refers to another option.
- CALCULATIONS: You have a calculator tool. For EVERY numeric value that takes any arithmetic - in the question, the correct answer, or a distractor - you MUST call the calculator tool and use its exact returned value. NEVER compute a number yourself, not even a simple one. Write the full expression with explicit parentheses (for example "2000 * ((1 - (1.07)^-6) / 0.07)" for the present value of an annuity, or "720 + (18 * 1.5 * 2)" for overtime pay). Because the calculator guarantees the arithmetic, realistic multi-step calculation questions are encouraged: markup and discount, payroll with overtime, present and future value, annuities, loan payments, ratios, probability, depreciation. Build distractors from common mistakes by computing those with the tool too (for example forgetting to discount, or using the wrong rate). Keep a healthy mix of conceptual and calculation questions - do not make every question a calculation. For every question whose correct answer is a computed number, also include a top-level "calc" field set to the exact expression you sent to the calculator for that answer (digits and + - * / ^ ( ) only); the app re-checks it against the options. Omit "calc" on conceptual questions.

EXPLANATIONS - shown to the student after they submit:
- Write 1 to 3 clear sentences: say what the correct answer is (in words) and why it is right, then name the single most tempting wrong choice by its WORDING and why it is wrong.
- NEVER reference option letters (A, B, C, D) or positions like "the first option." The options are randomly reordered before display, so a letter reference would point at the wrong choice. Refer to each choice by its content. Good: "Net income is revenue minus all expenses, so the 4,200 figure is correct; the 9,000 distractor is gross profit, which ignores operating expenses." Bad: "A is correct because..."

QUESTION QUALITY:
- The "topic" field MUST be copied verbatim from the numbered topic list in the user message (the single best fit). It powers each student's weak-topic analysis, so it must be accurate.
- Distractors must be plausible - rooted in common student misconceptions, not obviously wrong.
- All four options must be similar in length, structure, and specificity. The correct answer must NOT be the longest or most detailed - that is a giveaway. Give the distractors equal detail.
- Spread the correct letter roughly evenly across A, B, C, and D; never default to one position.
- Use precise professional vocabulary. Mix definition (about 25%), scenario or application (about 55%), and compare and contrast (about 20%). Never test the same concept twice in one test.
- Match real FBLA national difficulty: challenging but fair.
- Use plain hyphens, never em dashes or en dashes. No emojis or decorative symbols in any field.`;

function buildUserPrompt(slug: string, count: number, focusTopic?: string): string {
  const c = getCompetition(slug);
  if (!c) throw new Error("Competition not found");

  const topicList = (c.topics ?? []).map((t, i) => `${i + 1}. ${t}`).join("\n");
  const durationLine = c.duration ? `Duration: ${c.duration}` : "";

  // Targeted drill: focus every question on one weak topic (still tag it).
  const validFocus = focusTopic && (c.topics ?? []).includes(focusTopic) ? focusTopic : null;
  const coverageLine = validFocus
    ? `FOCUS: every question must test the single topic "${validFocus}" in depth (different angles and difficulties). Set "topic" to "${validFocus}" on every question.`
    : "Topics to cover (distribute questions proportionally across all topics):";

  return `Generate exactly ${count} practice questions for the FBLA ${c.name} event.

Format: ${FORMAT_LABEL[c.format]}${durationLine ? `\n${durationLine}` : ""}

${coverageLine}
${topicList || "General business knowledge relevant to this event"}

Event overview: ${c.longDescription ?? c.description}

Output exactly ${count} questions as NDJSON (one JSON object per line). ${validFocus ? "Stay on the focus topic." : "Cover every major topic area."} Vary difficulty from recall to analysis. Use the calculator tool for EVERY computation - never do mental math. Write each explanation referring to choices by their wording, never by letter.`;
}

export async function POST(req: Request): Promise<Response> {
  // Gate: require an authenticated session OR an active preview cookie before
  // spending Anthropic tokens. Preview mode is intentionally open (advisors try
  // without signing up), so anonymous preview traffic is rate limited per IP.
  const cookieStore = await cookies();
  const inPreview = cookieStore.get("fbla_preview")?.value === "1";
  let rateKey: string;
  if (inPreview) {
    rateKey = `preview:${getClientIP(req)}`;
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
  // Caps practice-test generations per identity in a 10-minute window. Simple
  // in-memory sliding window (lib/rate-limit) - the same limiter Corvo and Lark
  // use, per serverless instance, sufficient for Vercel's single region.
  if (!rateLimit(rateKey, inPreview ? 12 : 40, 10 * 60 * 1000)) {
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
  let focusTopic: string | undefined;
  try {
    const body = await req.json();
    slug = body.slug;
    count = Math.min(Math.max(Number(body.count) || 10, 5), 50);
    focusTopic = typeof body.focusTopic === "string" ? body.focusTopic.slice(0, 200) : undefined;
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
        // Tool-use loop. The model writes the questions and calls the calculator
        // for every number; we evaluate each expression exactly and feed it back.
        // Text deltas stream to the client across turns, and the client's NDJSON
        // line buffer reassembles any line split across a calculator call. Bounded
        // so a misbehaving model can never loop forever.
        const messages: Anthropic.MessageParam[] = [
          { role: "user", content: buildUserPrompt(slug, count, focusTopic) },
        ];
        for (let turn = 0; turn < 8; turn++) {
          const turnStream = client.messages.stream({
            // Haiku 4.5 keeps generation fast; the calculator tool, not the model,
            // now owns arithmetic, so wrong keys from mental math are gone.
            model: "claude-haiku-4-5-20251001",
            // Lower than the default temperature: a high temperature is the main
            // driver of wrong keys and implausible options. Topic spread still
            // keeps tests varied.
            temperature: 0.5,
            // Scale with question count; concise explanations keep this modest.
            max_tokens: Math.min(12000, count * 220 + 600),
            system: SYSTEM_PROMPT,
            tools: [CALCULATOR_TOOL],
            messages,
          });
          turnStream.on("text", (delta) => controller.enqueue(encoder.encode(delta)));
          const message = await turnStream.finalMessage();

          if (message.stop_reason !== "tool_use") break;

          const toolUses = message.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
          );
          messages.push({ role: "assistant", content: message.content });
          messages.push({
            role: "user",
            content: toolUses.map((tu) => {
              const expr = String((tu.input as { expression?: unknown }).expression ?? "");
              let result: string;
              try {
                result = formatNumber(evaluateExpression(expr));
              } catch (e) {
                result = `ERROR: ${(e as Error).message}. Use only digits and + - * / ^ ( ).`;
              }
              return { type: "tool_result" as const, tool_use_id: tu.id, content: result };
            }),
          });
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
