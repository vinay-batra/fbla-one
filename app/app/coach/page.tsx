"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { COMPETITIONS, getCompetition, FORMAT_LABEL } from "@/lib/competitions";
import { addPracticeLog, getRegistered } from "@/lib/storage";

// ── Types ──────────────────────────────────────────────────────

type Option = "A" | "B" | "C" | "D";

type Question = {
  id: number;
  question: string;
  options: Record<Option, string>;
  correct: Option;
  explanation: string;
};

type Phase = "idle" | "generating" | "taking" | "reviewing";

// ── Eligible competitions (objective tests only) ───────────────

const ELIGIBLE = COMPETITIONS.filter(
  (c) =>
    c.contentStatus === "complete" &&
    (c.format === "objective-test" ||
      c.format === "objective-and-presentation" ||
      c.format === "team-test")
);

// ── Score helpers ──────────────────────────────────────────────

function scoreMeta(pct: number): { label: string; color: string; bg: string } {
  if (pct >= 90) return { label: "Outstanding", color: "var(--green)", bg: "rgba(var(--green-rgb), 0.1)" };
  if (pct >= 80) return { label: "Strong", color: "var(--green)", bg: "rgba(var(--green-rgb), 0.08)" };
  if (pct >= 70) return { label: "Good", color: "var(--accent)", bg: "var(--accent-dim)" };
  if (pct >= 60) return { label: "Passing", color: "var(--warning)", bg: "rgba(var(--warning-rgb, 193,124,32), 0.1)" };
  return { label: "Needs work", color: "var(--red)", bg: "rgba(var(--red-rgb), 0.08)" };
}

// ── Main component (wrapped in Suspense for useSearchParams) ───

function CoachInner() {
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get("slug") ?? "";

  const [phase, setPhase] = useState<Phase>("idle");
  const [selectedSlug, setSelectedSlug] = useState(initialSlug);
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [generatedSoFar, setGeneratedSoFar] = useState(0);
  const [genError, setGenError] = useState("");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Option>>({});
  const [logged, setLogged] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const registered = getRegistered();
  const registeredComps = registered
    .map((s) => getCompetition(s))
    .filter((c): c is NonNullable<typeof c> =>
      Boolean(c) && ELIGIBLE.some((e) => e.slug === c!.slug)
    );

  // Auto-select if slug passed via URL
  useEffect(() => {
    if (initialSlug && ELIGIBLE.some((c) => c.slug === initialSlug)) {
      setSelectedSlug(initialSlug);
    }
  }, [initialSlug]);

  // Keyboard: A/B/C/D and arrow navigation during test
  useEffect(() => {
    if (phase !== "taking") return;
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase() as Option;
      if (["A", "B", "C", "D"].includes(key)) {
        setAnswers((prev) => ({ ...prev, [currentIdx]: key }));
      } else if (e.key === "ArrowRight") {
        setCurrentIdx((i) => Math.min(i + 1, questions.length - 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentIdx((i) => Math.max(i - 1, 0));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, currentIdx, questions.length]);

  const generate = useCallback(async () => {
    if (!selectedSlug) return;
    setGenError("");
    setQuestions([]);
    setGeneratedSoFar(0);
    setAnswers({});
    setCurrentIdx(0);
    setLogged(false);
    setPhase("generating");

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const res = await fetch("/api/practice-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: selectedSlug, count: questionCount }),
        signal: abort.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to start generation");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const parsed: Question[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const raw = JSON.parse(trimmed) as Record<string, unknown>;
            if (raw.error) throw new Error(String(raw.error));
            const q = raw as unknown as Question;
            if (q.question && q.options && q.correct) {
              parsed.push({ ...q, id: parsed.length + 1 });
              setGeneratedSoFar(parsed.length);
              setQuestions([...parsed]);
            }
          } catch (parseErr) {
            // Skip malformed lines, keep going
            if ((parseErr as Error).message && !(parseErr instanceof SyntaxError)) {
              throw parseErr;
            }
          }
        }
      }

      if (parsed.length === 0) throw new Error("No questions were generated. Try again.");
      setQuestions(parsed);
      setPhase("taking");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setGenError((err as Error).message ?? "Something went wrong");
      setPhase("idle");
    }
  }, [selectedSlug, questionCount]);

  function submitTest() {
    setPhase("reviewing");
  }

  function logScore() {
    const correct = questions.filter((q) => answers[q.id - 1] === q.correct).length;
    addPracticeLog({
      competitionSlug: selectedSlug,
      score: correct,
      outOf: questions.length,
      durationMin: null,
      notes: `AI practice test — ${correct}/${questions.length}`,
    });
    setLogged(true);
  }

  function restart() {
    setPhase("idle");
    setQuestions([]);
    setAnswers({});
    setCurrentIdx(0);
    setLogged(false);
    setGenError("");
  }

  const comp = getCompetition(selectedSlug);
  const allAnswered = questions.length > 0 && questions.every((_, i) => answers[i] !== undefined);
  const correctCount = questions.filter((q) => answers[q.id - 1] === q.correct).length;
  const pct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const meta = scoreMeta(pct);

  // ── IDLE ──────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 700 }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: 8, color: "var(--accent)" }}>AI-powered</p>
          <h1 style={{ fontSize: 30, letterSpacing: "-0.02em" }}>Practice Test Generator</h1>
          <p style={{ fontSize: 14, color: "var(--text3)", marginTop: 6, lineHeight: 1.6 }}>
            Claude generates realistic practice questions tailored to each competition's exact topics and difficulty level. Unlimited tests, instant explanations.
          </p>
        </div>

        {genError && (
          <div style={{ padding: "12px 16px", background: "rgba(var(--red-rgb), 0.08)", border: "0.5px solid var(--red)", borderRadius: 10, fontSize: 13, color: "var(--red)" }}>
            {genError}
          </div>
        )}

        <div style={{ background: "var(--card-bg)", border: "0.5px solid var(--border)", borderRadius: 16, padding: 28, display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Competition picker */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label className="font-mono" style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Competition
            </label>

            {registeredComps.length > 0 && (
              <div>
                <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8 }}>Your registered events</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {registeredComps.map((c) => (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => setSelectedSlug(c.slug)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        border: selectedSlug === c.slug ? "1.5px solid var(--accent)" : "0.5px solid var(--border)",
                        background: selectedSlug === c.slug ? "var(--accent-dim)" : "transparent",
                        color: selectedSlug === c.slug ? "var(--accent)" : "var(--text2)",
                        fontSize: 12,
                        fontWeight: selectedSlug === c.slug ? 600 : 400,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: registeredComps.length > 0 ? 4 : 0 }}>
              {registeredComps.length > 0 && (
                <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8 }}>Or pick from all events</p>
              )}
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="input-field"
              >
                <option value="">-- Select a competition --</option>
                {ELIGIBLE.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Competition preview */}
          {comp && (
            <div style={{ padding: "14px 16px", background: "var(--bg2)", borderRadius: 10, border: "0.5px solid var(--border)" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <span className="chip chip-brand" style={{ fontSize: 10 }}>{comp.category}</span>
                <span className="chip" style={{ fontSize: 10 }}>{FORMAT_LABEL[comp.format]}</span>
                {comp.duration && <span className="chip" style={{ fontSize: 10 }}>{comp.duration}</span>}
              </div>
              <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.55 }}>{comp.description}</p>
              {comp.topics && (
                <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 8 }}>
                  <span style={{ fontWeight: 600 }}>Topics: </span>
                  {comp.topics.slice(0, 5).join(" · ")}{comp.topics.length > 5 ? ` · +${comp.topics.length - 5} more` : ""}
                </p>
              )}
            </div>
          )}

          {/* Question count */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label className="font-mono" style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Questions
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {[10, 25, 50].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuestionCount(n)}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: 10,
                    border: questionCount === n ? "1.5px solid var(--accent)" : "0.5px solid var(--border)",
                    background: questionCount === n ? "var(--accent-dim)" : "transparent",
                    color: questionCount === n ? "var(--accent)" : "var(--text2)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "var(--text3)" }}>
              {questionCount === 10 && "Quick 10-minute warm-up"}
              {questionCount === 25 && "Solid half-length practice run"}
              {questionCount === 50 && "Full-length simulation — closest to the real thing"}
            </p>
          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={generate}
            disabled={!selectedSlug}
            className="btn btn-accent btn-pill"
            style={{ fontSize: 15, padding: "14px 28px", width: "100%", gap: 10, opacity: selectedSlug ? 1 : 0.45 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3L13.5 8.5H19L14.5 11.5L16 17L12 14L8 17L9.5 11.5L5 8.5H10.5L12 3Z" />
            </svg>
            Generate {questionCount}-question test
          </button>
        </div>

        <p style={{ fontSize: 12, color: "var(--text3)", textAlign: "center", lineHeight: 1.6 }}>
          Questions are generated by Claude AI using FBLA competition topic guides. Results are logged to your{" "}
          <Link href="/app/tracker" style={{ color: "var(--accent)" }}>practice tracker</Link>.
        </p>
      </div>
    );
  }

  // ── GENERATING ────────────────────────────────────────────────
  if (phase === "generating") {
    const progress = Math.min((generatedSoFar / questionCount) * 100, 100);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 700, alignItems: "center", paddingTop: 48 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 20 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 2s linear infinite" }}>
              <path d="M12 3L13.5 8.5H19L14.5 11.5L16 17L12 14L8 17L9.5 11.5L5 8.5H10.5L12 3Z" />
            </svg>
          </div>
          <h2 style={{ fontSize: 22, letterSpacing: "-0.02em" }}>Generating your practice test</h2>
          <p style={{ color: "var(--text3)", marginTop: 8, fontSize: 14 }}>
            Claude is writing {questionCount} questions for <strong style={{ color: "var(--text)" }}>{comp?.name}</strong>
          </p>
        </div>

        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span className="font-mono" style={{ fontSize: 11, color: "var(--text3)" }}>Progress</span>
            <span className="font-mono" style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700 }}>
              {generatedSoFar} / {questionCount}
            </span>
          </div>
          <div style={{ height: 6, background: "var(--bg3)", borderRadius: 999, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                background: "var(--accent)",
                borderRadius: 999,
                width: `${progress}%`,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {generatedSoFar > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", maxWidth: 420 }}>
            {Array.from({ length: questionCount }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: i < generatedSoFar ? "var(--accent)" : "var(--bg3)",
                  transition: "background 0.2s ease",
                }}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => { abortRef.current?.abort(); setPhase("idle"); }}
          className="btn btn-ghost btn-sm btn-pill"
        >
          Cancel
        </button>
      </div>
    );
  }

  // ── TAKING ────────────────────────────────────────────────────
  if (phase === "taking") {
    const q = questions[currentIdx];
    const selectedAnswer = answers[currentIdx];
    const OPTIONS: Option[] = ["A", "B", "C", "D"];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 4 }}>{comp?.name}</p>
            <p style={{ fontSize: 13, color: "var(--text3)" }}>
              {Object.keys(answers).length} of {questions.length} answered
            </p>
          </div>
          <button type="button" onClick={restart} className="btn btn-ghost btn-sm">
            Exit test
          </button>
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {questions.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentIdx(i)}
              title={`Question ${i + 1}`}
              style={{
                width: 28,
                height: 6,
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                background:
                  i === currentIdx
                    ? "var(--accent)"
                    : answers[i] !== undefined
                    ? "var(--brand)"
                    : "var(--bg3)",
                transition: "background 0.15s",
                flexShrink: 0,
              }}
            />
          ))}
        </div>

        {/* Question card */}
        <div style={{ background: "var(--card-bg)", border: "0.5px solid var(--border)", borderRadius: 16, padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <span
              className="font-mono"
              style={{
                fontSize: 10,
                letterSpacing: "0.18em",
                background: "var(--accent-dim)",
                color: "var(--accent)",
                padding: "3px 10px",
                borderRadius: 999,
                fontWeight: 700,
              }}
            >
              Q{currentIdx + 1} / {questions.length}
            </span>
            <span style={{ fontSize: 11, color: "var(--text3)" }}>
              Press A B C D to answer · ← → to navigate
            </span>
          </div>

          <p style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.65, color: "var(--text)", marginBottom: 24 }}>
            {q.question}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {OPTIONS.map((opt) => {
              const isSelected = selectedAnswer === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAnswers((prev) => ({ ...prev, [currentIdx]: opt }))}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "14px 16px",
                    borderRadius: 10,
                    border: isSelected ? "1.5px solid var(--accent)" : "0.5px solid var(--border)",
                    background: isSelected ? "var(--accent-dim)" : "var(--bg2)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.12s",
                  }}
                >
                  <span
                    className="font-mono"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                      background: isSelected ? "var(--accent)" : "var(--bg3)",
                      color: isSelected ? "var(--bg)" : "var(--text3)",
                      transition: "all 0.12s",
                    }}
                  >
                    {opt}
                  </span>
                  <span style={{ fontSize: 14, color: isSelected ? "var(--text)" : "var(--text2)", lineHeight: 1.55 }}>
                    {q.options[opt]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={() => setCurrentIdx((i) => Math.max(i - 1, 0))}
            disabled={currentIdx === 0}
            className="btn btn-ghost btn-sm"
            style={{ opacity: currentIdx === 0 ? 0.3 : 1 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          {currentIdx < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIdx((i) => Math.min(i + 1, questions.length - 1))}
              className="btn btn-ghost btn-sm"
            >
              Next
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={submitTest}
              disabled={!allAnswered}
              className="btn btn-accent btn-pill"
              style={{ opacity: allAnswered ? 1 : 0.45 }}
            >
              Submit test
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12l5 5L20 7" />
              </svg>
            </button>
          )}
        </div>

        {!allAnswered && (
          <p style={{ fontSize: 11, color: "var(--text3)", textAlign: "center" }}>
            Answer all questions to submit. Use the dots above to jump to unanswered questions.
          </p>
        )}
      </div>
    );
  }

  // ── REVIEWING ─────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720 }}>
      {/* Score banner */}
      <div
        className="coach-score-banner"
        style={{
          background: meta.bg,
          border: `0.5px solid ${meta.color}`,
          borderRadius: 16,
          padding: "28px 32px",
          display: "flex",
          alignItems: "center",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div style={{ textAlign: "center", minWidth: 90 }}>
          <div className="font-mono" style={{ fontSize: 48, fontWeight: 700, lineHeight: 1, color: meta.color }}>
            {pct}
            <span style={{ fontSize: 24 }}>%</span>
          </div>
          <div className="font-mono" style={{ fontSize: 11, color: "var(--text3)", marginTop: 4, letterSpacing: "0.1em" }}>
            {correctCount} / {questions.length}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: meta.color, letterSpacing: "-0.01em" }}>{meta.label}</p>
          <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 4, lineHeight: 1.5 }}>
            {comp?.name} · {questions.length}-question AI practice test
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            {!logged ? (
              <button type="button" onClick={logScore} className="btn btn-accent btn-sm btn-pill">
                Log score to tracker
              </button>
            ) : (
              <span className="btn btn-ghost btn-sm" style={{ pointerEvents: "none", color: "var(--green)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12l5 5L20 7" />
                </svg>
                Logged
              </span>
            )}
            <button type="button" onClick={generate} className="btn btn-ghost btn-sm btn-pill">
              New test
            </button>
            <button type="button" onClick={restart} className="btn btn-ghost btn-sm btn-pill">
              Change competition
            </button>
          </div>
        </div>
      </div>

      {/* Question review */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>Review</h3>
        {questions.map((q, i) => {
          const userAns = answers[i];
          const isCorrect = userAns === q.correct;
          return (
            <div
              key={q.id}
              style={{
                background: "var(--card-bg)",
                border: `0.5px solid ${isCorrect ? "var(--border)" : "rgba(var(--red-rgb), 0.3)"}`,
                borderRadius: 12,
                padding: 20,
                borderLeft: `3px solid ${isCorrect ? "var(--green)" : "var(--red)"}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                <span
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontWeight: 700,
                    background: isCorrect ? "rgba(var(--green-rgb), 0.12)" : "rgba(var(--red-rgb), 0.1)",
                    color: isCorrect ? "var(--green)" : "var(--red)",
                    flexShrink: 0,
                  }}
                >
                  Q{i + 1}
                </span>
                <p style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.6, color: "var(--text)" }}>{q.question}</p>
              </div>

              <div className="coach-options-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
                {(["A", "B", "C", "D"] as Option[]).map((opt) => {
                  const isUser = userAns === opt;
                  const isRight = q.correct === opt;
                  let bg = "transparent";
                  let color = "var(--text3)";
                  let borderColor = "var(--border-dim)";
                  if (isRight) { bg = "rgba(var(--green-rgb), 0.08)"; color = "var(--green)"; borderColor = "rgba(var(--green-rgb), 0.3)"; }
                  if (isUser && !isRight) { bg = "rgba(var(--red-rgb), 0.08)"; color = "var(--red)"; borderColor = "rgba(var(--red-rgb), 0.3)"; }
                  return (
                    <div
                      key={opt}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: `0.5px solid ${borderColor}`,
                        background: bg,
                      }}
                    >
                      <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, color, flexShrink: 0 }}>
                        {opt}{isRight ? " ✓" : isUser && !isRight ? " ✗" : ""}
                      </span>
                      <span style={{ fontSize: 12, color, lineHeight: 1.5 }}>{q.options[opt]}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ padding: "10px 14px", background: "var(--bg2)", borderRadius: 8, border: "0.5px solid var(--border)" }}>
                <p className="font-mono" style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4, fontWeight: 700 }}>
                  Explanation
                </p>
                <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{q.explanation}</p>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 600px) {
          .coach-options-grid { grid-template-columns: 1fr !important; }
          .coach-score-banner { flex-direction: column !important; }
        }
      `}</style>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingBottom: 32 }}>
        <button type="button" onClick={generate} className="btn btn-accent btn-pill">
          Generate new test
        </button>
        <button type="button" onClick={restart} className="btn btn-ghost btn-pill">
          Change competition
        </button>
        <Link href="/app/tracker" className="btn btn-ghost btn-pill">
          View tracker
        </Link>
      </div>
    </div>
  );
}

export default function CoachPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "var(--text3)" }}>Loading...</div>}>
      <CoachInner />
    </Suspense>
  );
}
