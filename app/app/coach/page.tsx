"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { COMPETITIONS, getCompetition, FORMAT_LABEL, isAiTestable } from "@/lib/competitions";
import { addPracticeLog, toTopicResults, getRegistered, recordTopicResults, getWeakTopics, onStorageChange, type WeakTopic } from "@/lib/storage";
import { AI_LOG_PREFIX } from "@/lib/chapter";
import { PenCircle, PenCheck, PenCross } from "@/components/PenMarks";
import {
  OPTION_KEYS,
  buildPaper,
  questionKey,
  shuffleQuestionOptions,
  splitTopics,
  type BuildProgress,
  type Option,
  type Question,
} from "@/components/coach/engine";
import { GeneratingView } from "@/components/coach/GeneratingView";
import { PageHeader } from "@/components/app/PageHeader";
import { EventCombobox } from "@/components/dashboard/EventCombobox";
import {
  bankCount,
  getBank,
  onMistakesChange,
  pickFromBank,
  recordTestForBank,
  type BankedQuestion,
  type BankResult,
} from "@/lib/mistakes";

// ── Types ──────────────────────────────────────────────────────

type Phase = "idle" | "generating" | "taking" | "reviewing";
/** What the student picks on the idle screen. */
type Mode = "practice" | "simulation" | "mistakes";
/** What is actually on the desk right now. */
type Run = Mode | "retry";

// ── Eligible competitions (any event with an objective test) ───

const ELIGIBLE = COMPETITIONS.filter(isAiTestable);

// ── Constants ──────────────────────────────────────────────────

/** FBLA objective tests: 100 questions in 50 minutes. */
const SIM_QUESTIONS = 100;
const SIM_MS = 50 * 60 * 1000;
const SIM_SECTIONS = 4;
/** The student may start a simulation once this many are ready. */
const SIM_START_AT = 25;
/** Share of a practice test drawn from the mistake bank. */
const BANK_SHARE = 0.3;
/** A Mistakes review holds at most this many. */
const REVIEW_MAX = 50;

// ── Helpers ────────────────────────────────────────────────────

// MM:SS formatter for the stopwatch and the countdown.
/** "a" or "an" before a spoken number: an 8-question test, an 11-question test. */
function articleFor(n: number): string {
  return n === 8 || n === 11 || n === 18 || (n >= 80 && n < 90) ? "an" : "a";
}

function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
// Countdown rounds up, so it reads 0:01 until the last second is really gone.
function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function scoreMeta(pct: number): { label: string } {
  if (pct >= 90) return { label: "Outstanding" };
  if (pct >= 80) return { label: "Strong" };
  if (pct >= 70) return { label: "Good" };
  if (pct >= 60) return { label: "Passing" };
  return { label: "Needs work" };
}

function shuffled<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A banked question back on the paper, options reshuffled so position is not memorized. */
function fromBank(b: BankedQuestion): Question {
  return shuffleQuestionOptions({
    id: 0,
    question: b.question,
    options: b.options,
    correct: b.correct,
    explanation: b.explanation,
    topic: b.topic,
    bankId: b.id,
  });
}

function newTestId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  }
}

function bankSentence(r: BankResult): string {
  const parts: string[] = [];
  if (r.added > 0) parts.push(`${r.added} added to your mistake bank`);
  if (r.cleared > 0) parts.push(`${r.cleared} cleared`);
  if (parts.length === 0) {
    return r.stillIn > 0
      ? `No new misses. ${r.stillIn} ${r.stillIn === 1 ? "question is" : "questions are"} still in your mistake bank.`
      : "No misses, and your mistake bank is empty.";
  }
  const s = parts.join(", ");
  return `${s.charAt(0).toUpperCase()}${s.slice(1)}.`;
}

const EMPTY_PROGRESS: BuildProgress = { target: 0, written: 0, checked: 0, kept: 0, dropped: 0, checker: "on" };

// ── Main component (wrapped in Suspense for useSearchParams) ───

function CoachInner() {
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get("slug") ?? searchParams.get("event") ?? "";

  const [phase, setPhase] = useState<Phase>("idle");
  const [mode, setMode] = useState<Mode>("practice");
  const [run, setRun] = useState<Run>("practice");
  const [selectedSlug, setSelectedSlug] = useState(initialSlug);
  const [questionCount, setQuestionCount] = useState(10);
  const [drillTopic, setDrillTopic] = useState<string | null>(null);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [bankSize, setBankSize] = useState(0);
  // Honor the user's default length from Settings.
  useEffect(() => {
    try {
      const n = Number(localStorage.getItem("fbla_default_test_len"));
      if ([10, 25, 50].includes(n)) setQuestionCount(n);
    } catch {}
  }, []);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [progress, setProgress] = useState<BuildProgress>(EMPTY_PROGRESS);
  const [bankOnPaper, setBankOnPaper] = useState(0);
  const [paperTotal, setPaperTotal] = useState(0);
  const [building, setBuilding] = useState(false);
  const [checkerOff, setCheckerOff] = useState(false);
  // Why a paper came out shorter than asked (usually a daily cap), shown on the report.
  const [shortReason, setShortReason] = useState("");
  const [genError, setGenError] = useState("");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Option>>({});
  const [logged, setLogged] = useState(false);
  const loggedRef = useRef(false);
  const [bankResult, setBankResult] = useState<BankResult | null>(null);
  const [confirmTurnIn, setConfirmTurnIn] = useState(false);
  // Review screen: show only the questions you missed.
  const [missesOnly, setMissesOnly] = useState(false);
  // Stopwatch (practice) or time used (simulation).
  const [elapsedMs, setElapsedMs] = useState(0);
  // Simulation countdown.
  const [remainingMs, setRemainingMs] = useState(SIM_MS);
  const [timedOut, setTimedOut] = useState(false);
  const [politeNote, setPoliteNote] = useState("");
  const [urgentNote, setUrgentNote] = useState("");
  const testStartRef = useRef<number | null>(null);
  const deadlineRef = useRef<number | null>(null);
  const warnedRef = useRef<Set<number>>(new Set());
  const abortRef = useRef<AbortController | null>(null);
  const testIdRef = useRef("");
  // Topic stats and the mistake bank are recorded exactly once per test, and
  // never for an in-session retry of missed questions.
  const recordedRef = useRef(false);
  // Cross-tab storage tick so weak topics and the bank reflect other tabs.
  const [storeTick, setStoreTick] = useState(0);
  useEffect(() => onStorageChange(() => setStoreTick((t) => t + 1)), []);
  useEffect(() => onMistakesChange(() => setStoreTick((t) => t + 1)), []);

  const registered = getRegistered();
  const registeredComps = registered
    .map((s) => getCompetition(s))
    .filter((c): c is NonNullable<typeof c> =>
      Boolean(c) && ELIGIBLE.some((e) => e.slug === c!.slug)
    );

  // No event in the URL: start on the student's own event.
  const myEligible = registeredComps[0]?.slug ?? "";
  useEffect(() => {
    if (!initialSlug && myEligible) setSelectedSlug((s) => s || myEligible);
  }, [initialSlug, myEligible]);

  // Auto-select if slug passed via URL
  useEffect(() => {
    if (initialSlug && ELIGIBLE.some((c) => c.slug === initialSlug)) {
      setSelectedSlug(initialSlug);
    }
  }, [initialSlug]);

  // Recompute weak topics and the bank size for the selected event.
  useEffect(() => {
    setWeakTopics(selectedSlug ? getWeakTopics(selectedSlug) : []);
    setBankSize(selectedSlug ? bankCount(selectedSlug) : 0);
  }, [selectedSlug, phase, storeTick]);

  // Nothing banked for this event: fall back from the Mistakes mode.
  useEffect(() => {
    if (mode === "mistakes" && bankSize === 0) setMode("practice");
  }, [mode, bankSize]);

  // Stop any background writing when the page goes away.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Keyboard: A/B/C/D and arrow navigation during a test
  useEffect(() => {
    if (phase !== "taking") return;
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const key = e.key.toUpperCase() as Option;
      if (OPTION_KEYS.includes(key)) {
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

  // Stopwatch for untimed tests: starts when the test enters the taking phase.
  useEffect(() => {
    if (phase !== "taking" || run === "simulation") return;
    if (testStartRef.current === null) testStartRef.current = Date.now();
    const tick = () => {
      if (testStartRef.current !== null) setElapsedMs(Date.now() - testStartRef.current);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, run]);

  // ── Resetting ────────────────────────────────────────────────

  const resetTest = useCallback(() => {
    setQuestions([]);
    setAnswers({});
    setCurrentIdx(0);
    setLogged(false);
    loggedRef.current = false;
    setMissesOnly(false);
    setGenError("");
    setBankResult(null);
    setConfirmTurnIn(false);
    setProgress(EMPTY_PROGRESS);
    setBankOnPaper(0);
    setPaperTotal(0);
    setBuilding(false);
    setCheckerOff(false);
    setShortReason("");
    setTimedOut(false);
    setPoliteNote("");
    setUrgentNote("");
    setElapsedMs(0);
    setRemainingMs(SIM_MS);
    testStartRef.current = null;
    deadlineRef.current = null;
    warnedRef.current = new Set();
    recordedRef.current = false;
    testIdRef.current = newTestId();
  }, []);

  // ── Practice test (and drills) ───────────────────────────────

  const generate = useCallback(async (focusTopic?: string) => {
    if (!selectedSlug) return;
    abortRef.current?.abort();
    resetTest();
    setRun("practice");
    setDrillTopic(focusTopic ?? null);

    // Up to 30% of the paper comes from the student's own missed questions.
    const bankPicks = pickFromBank(selectedSlug, Math.floor(questionCount * BANK_SHARE), focusTopic);
    const need = questionCount - bankPicks.length;
    setBankOnPaper(bankPicks.length);
    setPaperTotal(questionCount);
    setProgress({ ...EMPTY_PROGRESS, target: need });
    setBuilding(true);
    setPhase("generating");

    const abort = new AbortController();
    abortRef.current = abort;

    // A little over the target: the second model sets some aside. More than 25
    // goes out as parallel batches (each with its own slice of the outline,
    // unless this is a one-topic drill) so no single request nears the 60s
    // function limit.
    const total = Math.max(5, need + Math.ceil(need * 0.2));
    const parts = Math.ceil(total / 25);
    const slices = focusTopic || parts === 1 ? null : splitTopics(getCompetition(selectedSlug)?.topics ?? [], parts);
    const batches = Array.from({ length: parts }, (_, i) => ({
      count: Math.ceil(total / parts),
      ...(slices ? { section: { topics: slices[i], part: i + 1, parts } } : {}),
    }));

    try {
      const result = await buildPaper({
        slug: selectedSlug,
        target: need,
        focusTopic,
        batches,
        exclude: bankPicks.map((b) => questionKey(b.question)),
        signal: abort.signal,
        onProgress: setProgress,
      });
      const paper = shuffled([...result.questions, ...bankPicks.map(fromBank)]).map((q, i) => ({ ...q, id: i + 1 }));
      setCheckerOff(result.checker === "off");
      setShortReason(result.shortReason ?? "");
      setQuestions(paper);
      setBuilding(false);
      setPhase("taking");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setBuilding(false);
      setGenError((err as Error).message ?? "Something went wrong");
      setPhase("idle");
    }
  }, [selectedSlug, questionCount, resetTest]);

  // ── Mistakes review: instant, straight from the bank ─────────

  const startMistakes = useCallback(() => {
    if (!selectedSlug) return;
    const picks = pickFromBank(selectedSlug, REVIEW_MAX);
    if (picks.length === 0) return;
    abortRef.current?.abort();
    resetTest();
    setRun("mistakes");
    setDrillTopic(null);
    setQuestions(shuffled(picks.map(fromBank)).map((q, i) => ({ ...q, id: i + 1 })));
    setPhase("taking");
  }, [selectedSlug, resetTest]);

  // ── Full simulation: 100 questions, 50:00 ────────────────────

  const startSimulation = useCallback(async () => {
    const comp = getCompetition(selectedSlug);
    if (!comp) return;
    abortRef.current?.abort();
    resetTest();
    setRun("simulation");
    setDrillTopic(null);
    setPaperTotal(SIM_QUESTIONS);
    setProgress({ ...EMPTY_PROGRESS, target: SIM_QUESTIONS });
    setBuilding(true);
    setPhase("generating");

    const abort = new AbortController();
    abortRef.current = abort;
    // Four sections written in parallel, each with its own slice of the
    // outline, so coverage is even and duplicates are unlikely. 28 each leaves
    // room for the checker to set a few aside.
    const slices = splitTopics(comp.topics ?? [], SIM_SECTIONS);
    const batches = slices.map((topics, i) => ({
      count: 28,
      section: { topics, part: i + 1, parts: SIM_SECTIONS },
    }));

    try {
      const result = await buildPaper({
        slug: comp.slug,
        target: SIM_QUESTIONS,
        batches,
        maxTopUps: 3,
        signal: abort.signal,
        onProgress: setProgress,
        // Questions join the paper as they clear the check, so the student
        // can start with the first 25 while the rest are still being written.
        onAccept: (q) => setQuestions((prev) => [...prev, { ...q, id: prev.length + 1 }]),
      });
      setCheckerOff(result.checker === "off");
      setShortReason(result.shortReason ?? "");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setGenError((err as Error).message ?? "Something went wrong");
      setPhase("idle");
    } finally {
      if (abortRef.current === abort) setBuilding(false);
    }
  }, [selectedSlug, resetTest]);

  const beginSimulation = useCallback(() => {
    const now = Date.now();
    testStartRef.current = now;
    deadlineRef.current = now + SIM_MS;
    setRemainingMs(SIM_MS);
    setPhase("taking");
  }, []);

  // ── Submitting ───────────────────────────────────────────────

  const submitTest = useCallback((opts?: { timedOut?: boolean }) => {
    // A simulation still writing in the background stops here.
    abortRef.current?.abort();
    setBuilding(false);
    setConfirmTurnIn(false);

    if (!recordedRef.current && run !== "retry") {
      // Weak-topic stats come from fresh questions only: banked questions are
      // by definition ones the student already missed, so they would skew it.
      if (run !== "mistakes") {
        const results = questions
          .filter((q) => q.topic && !q.bankId)
          .map((q) => ({ topic: q.topic as string, correct: answers[q.id - 1] === q.correct }));
        if (results.length) recordTopicResults(selectedSlug, results);
      }
      setBankResult(
        recordTestForBank(
          selectedSlug,
          testIdRef.current,
          questions.map((q) => ({
            question: q.question,
            options: q.options,
            correct: q.correct,
            explanation: q.explanation,
            topic: q.topic,
            answer: answers[q.id - 1],
          }))
        )
      );
      recordedRef.current = true;
    }

    // Freeze the precise final time.
    if (testStartRef.current !== null) {
      const used = Date.now() - testStartRef.current;
      setElapsedMs(run === "simulation" ? Math.min(SIM_MS, used) : used);
    }
    if (opts?.timedOut) setTimedOut(true);
    setPhase("reviewing");
    window.scrollTo({ top: 0 });
  }, [run, questions, answers, selectedSlug]);

  // The countdown calls the latest submit without re-arming its interval.
  const submitRef = useRef(submitTest);
  useEffect(() => {
    submitRef.current = submitTest;
  }, [submitTest]);

  // Simulation countdown: 50:00, warnings at 10, 5 and 1 minutes, turn in at 0:00.
  useEffect(() => {
    if (phase !== "taking" || run !== "simulation") return;
    const tick = () => {
      const deadline = deadlineRef.current;
      if (deadline === null) return;
      const left = deadline - Date.now();
      setRemainingMs(left);
      for (const mins of [10, 5, 1]) {
        if (left <= mins * 60_000 && !warnedRef.current.has(mins)) {
          warnedRef.current.add(mins);
          if (mins === 1) setUrgentNote("One minute left. The test turns itself in at 0:00.");
          else setPoliteNote(`${mins} minutes left.`);
        }
      }
      if (left <= 0) submitRef.current({ timedOut: true });
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [phase, run]);

  function logScore() {
    // Idempotent: a double-click or a repeated effect must not write two rows.
    if (loggedRef.current) return;
    loggedRef.current = true;
    setLogged(true);
    const correct = questions.filter((q) => answers[q.id - 1] === q.correct).length;
    // A mistakes review is not a fresh AI test, so it does not carry the
    // prefix that chapter assignments count.
    const notes =
      run === "mistakes"
        ? `Mistake review: ${correct}/${questions.length}`
        : run === "simulation"
          ? `${AI_LOG_PREFIX} (full simulation): ${correct}/${questions.length}`
          : `${AI_LOG_PREFIX}: ${correct}/${questions.length}`;
    addPracticeLog({
      competitionSlug: selectedSlug,
      score: correct,
      outOf: questions.length,
      durationMin: elapsedMs > 0 ? Math.max(1, Math.round(elapsedMs / 60000)) : null,
      notes,
      // Per-topic tally for the advisor's readiness report. Same rule as the
      // local weak-topic stats: fresh questions only, never retries, mistake
      // reviews or banked questions, which would double-count known misses.
      topicResults:
        run === "mistakes" || run === "retry"
          ? null
          : toTopicResults(
              selectedSlug,
              questions
                .filter((q) => q.topic && !q.bankId)
                .map((q) => ({ topic: q.topic as string, correct: answers[q.id - 1] === q.correct }))
            ),
    });
  }

  // Every graded test saves itself to practice history (the dashboard, streak,
  // assignments and the advisor's readiness report all read it). An in-session
  // retry of missed questions is not a new test, so it is never saved.
  const logScoreRef = useRef(logScore);
  useEffect(() => {
    logScoreRef.current = logScore;
  });
  useEffect(() => {
    if (phase === "reviewing" && run !== "retry") logScoreRef.current();
  }, [phase, run]);

  function restart() {
    abortRef.current?.abort();
    resetTest();
    setDrillTopic(null);
    setPhase("idle");
  }

  // Re-quiz only the questions you got wrong, in session. Not recorded again.
  function retryMisses() {
    const missed = questions
      .filter((q) => answers[q.id - 1] !== q.correct)
      .map((q, i) => ({ ...q, id: i + 1 }));
    if (missed.length === 0) return;
    const keepBank = bankResult;
    resetTest();
    setBankResult(keepBank);
    setRun("retry");
    setQuestions(missed);
    setPhase("taking");
  }

  function startSelected() {
    if (mode === "simulation") void startSimulation();
    else if (mode === "mistakes") startMistakes();
    else void generate();
  }

  // Dashboard shortcuts: ?slug=X&start=1 begins a test right away, with
  // &topic=Y for a drill, &mode=mistakes for an instant review or
  // &mode=simulation for the full 100-question paper. The flags
  // are dropped from the URL first, so a reload or Back never writes (and
  // spends quota on) another test.
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (autoStartedRef.current || searchParams.get("start") !== "1") return;
    if (!initialSlug || selectedSlug !== initialSlug || !ELIGIBLE.some((c) => c.slug === initialSlug)) return;
    autoStartedRef.current = true;
    const topic = searchParams.get("topic") ?? undefined;
    const want = searchParams.get("mode");
    window.history.replaceState(null, "", `/app/coach?slug=${encodeURIComponent(initialSlug)}`);
    if (want === "mistakes" && bankCount(initialSlug) > 0) {
      setMode("mistakes");
      startMistakes();
    } else if (want === "simulation") {
      setMode("simulation");
      void startSimulation();
    } else {
      void generate(topic);
    }
  }, [searchParams, initialSlug, selectedSlug, generate, startMistakes, startSimulation]);

  const comp = getCompetition(selectedSlug);
  const answeredCount = questions.reduce((n, _, i) => n + (answers[i] !== undefined ? 1 : 0), 0);
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const correctCount = questions.filter((q) => answers[q.id - 1] === q.correct).length;
  const pct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const meta = scoreMeta(pct);
  // Per-topic results for the report card, weakest first.
  const topicRows = (() => {
    const by = new Map<string, { right: number; total: number }>();
    questions.forEach((q, i) => {
      if (!q.topic) return;
      const row = by.get(q.topic) ?? { right: 0, total: 0 };
      row.total += 1;
      if (answers[i] === q.correct) row.right += 1;
      by.set(q.topic, row);
    });
    return [...by.entries()]
      .map(([topic, r]) => ({ topic, ...r }))
      .sort((a, b) => a.right / a.total - b.right / b.total || b.total - a.total);
  })();

  // ── IDLE ──────────────────────────────────────────────────────
  if (phase === "idle") {
    const bankMix = Math.min(bankSize, Math.floor(questionCount * BANK_SHARE));
    const startLabel =
      mode === "simulation"
        ? "Start full simulation"
        : mode === "mistakes"
          ? `Review ${Math.min(bankSize, REVIEW_MAX)} missed ${bankSize === 1 ? "question" : "questions"}`
          : `Generate ${questionCount}-question test`;
    const canStart = Boolean(selectedSlug) && !(mode === "mistakes" && bankSize === 0);
    return (
      <div className="app-page">
        <PageHeader
          eyebrow="AI Practice"
          title={<>Practice <em>the real test.</em></>}
          sub="Questions built from your event's official topic outline. A second AI checks every answer before you see it."
        />

        {genError && <div role="alert" className="cp-error">{genError}</div>}

        <div className="cp-grid">
          <section className="db-sheet" aria-labelledby="cp-setup-title">
            <div className="db-sheet-head">
              <span id="cp-setup-title" className="db-sheet-kicker">New paper</span>
              {comp && <span className="db-sheet-kicker"><b>{comp.name}</b></span>}
            </div>
            <div className="db-sheet-body cp-body">
              <div className="cp-field">
                <label htmlFor="coach-event" className="db-field-label">Event</label>
                <EventCombobox
                  id="coach-event"
                  value={selectedSlug}
                  onChange={setSelectedSlug}
                  events={ELIGIBLE}
                  placeholder="Type an event with a test"
                  className="is-compact"
                />
              </div>

              <div className="cp-field">
                <p id="coach-mode-label" className="db-field-label">Paper</p>
                <div className="cp-modes" role="group" aria-labelledby="coach-mode-label">
                  <button type="button" className="cp-mode" aria-pressed={mode === "practice"} onClick={() => setMode("practice")}>
                    <span className="cp-mode-name">Practice test</span>
                    <span className="cp-mode-sub">10, 25 or 50 questions, untimed</span>
                  </button>
                  <button type="button" className="cp-mode" aria-pressed={mode === "simulation"} onClick={() => setMode("simulation")}>
                    <span className="cp-mode-name">Full simulation</span>
                    <span className="cp-mode-sub">100 questions in 50:00</span>
                  </button>
                  <button type="button" className="cp-mode" aria-pressed={mode === "mistakes"} onClick={() => setMode("mistakes")} disabled={bankSize === 0}>
                    <span className="cp-mode-name">Mistakes{bankSize > 0 ? ` (${bankSize})` : ""}</span>
                    <span className="cp-mode-sub">
                      {!selectedSlug ? "Pick an event first" : bankSize > 0 ? "Instant review, no waiting" : "Nothing missed yet"}
                    </span>
                  </button>
                </div>
              </div>

              {mode === "practice" && (
                <div className="cp-field">
                  <p id="coach-count-label" className="db-field-label">Questions</p>
                  <div className="cp-counts" role="group" aria-labelledby="coach-count-label">
                    {[10, 25, 50].map((n) => (
                      <button key={n} type="button" className="cp-count" aria-pressed={questionCount === n} onClick={() => setQuestionCount(n)}>
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="cp-note">
                    {questionCount === 10 && "A quick warm-up."}
                    {questionCount === 25 && "A solid half-length run."}
                    {questionCount === 50 && "A long run, still untimed."}
                    {bankMix > 0 && ` Includes ${bankMix} of your missed questions.`}
                  </p>
                </div>
              )}
              {mode === "simulation" && (
                <p className="cp-note">
                  Like the real objective test: the clock counts down and turns the paper in at 0:00. Explanations wait until the end. Writing and checking takes a minute or two, and you can start once the first 25 are ready.
                </p>
              )}
              {mode === "mistakes" && bankSize > 0 && (
                <p className="cp-note">
                  A question leaves your bank once you get it right in two different tests.
                  {bankSize > REVIEW_MAX ? ` This review takes the ${REVIEW_MAX} you have missed most.` : ""}
                </p>
              )}

              <button type="button" onClick={startSelected} disabled={!canStart} className="db-begin cp-begin">
                {startLabel}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </section>

          <aside className="cp-side">
            {comp ? (
              <div className="cp-card">
                <p className="db-notes-head"><span>About the event</span></p>
                <div className="cp-chips">
                  <span className="chip chip-brand">{comp.category}</span>
                  <span className="chip">{FORMAT_LABEL[comp.format]}</span>
                </div>
                <p className="cp-desc">{comp.description}</p>
                {comp.topics && comp.topics.length > 0 && (
                  <>
                    <p className="db-notes-head" style={{ marginTop: 16 }}><span>Topics on the test</span></p>
                    <ul className="cp-topics">
                      {comp.topics.map((t) => <li key={t}>{t}</li>)}
                    </ul>
                  </>
                )}
              </div>
            ) : (
              <div className="cp-card cp-card-empty">
                <p className="cp-desc">Pick an event to see the topics its test covers.</p>
              </div>
            )}

            {selectedSlug && weakTopics.length > 0 && (
              <div className="cp-card">
                <p className="db-notes-head"><span>Your weakest topics</span><span>% right</span></p>
                <ul className="db-topics">
                  {weakTopics.slice(0, 4).map((w) => (
                    <li key={w.topic} className="db-topic">
                      <span className="db-topic-name"><span>{w.topic}</span><span>{w.pct}%</span></span>
                      <span className="db-bar" aria-hidden="true">
                        <i className={w.pct >= 80 ? "is-ok" : ""} style={{ width: `${Math.max(4, w.pct)}%` }} />
                      </span>
                      <button type="button" className="db-drill" onClick={() => generate(w.topic)} aria-label={`Drill ${w.topic}`}>
                        Drill
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    );
  }

  // ── GENERATING ────────────────────────────────────────────────
  if (phase === "generating") {
    return (
      <div className="coach-gen-wrap">
        <GeneratingView
          eventName={comp?.name ?? ""}
          kind={run === "simulation" ? "simulation" : drillTopic ? "drill" : "practice"}
          drillTopic={drillTopic}
          progress={progress}
          fromBank={bankOnPaper}
          total={paperTotal}
          building={building}
          canStart={run === "simulation" && (questions.length >= SIM_START_AT || (!building && questions.length > 0))}
          onStart={beginSimulation}
          onCancel={restart}
        />
      </div>
    );
  }

  // ── TAKING ────────────────────────────────────────────────────
  if (phase === "taking") {
    const q = questions[currentIdx];
    const selectedAnswer = answers[currentIdx];
    const isSim = run === "simulation";
    const gridSize = isSim && building ? Math.max(questions.length, SIM_QUESTIONS) : questions.length;
    const blanks = questions.length - answeredCount;
    const lowTime = isSim && remainingMs <= 60_000;
    const atLastLoaded = currentIdx >= questions.length - 1;

    const grid = (
      <div className="coach-grid" role="group" aria-label="Jump to a question">
        {Array.from({ length: gridSize }, (_, i) => {
          const loaded = i < questions.length;
          return (
            <button
              key={i}
              type="button"
              onClick={() => loaded && setCurrentIdx(i)}
              disabled={!loaded}
              className={`coach-grid-cell${i === currentIdx ? " is-current" : ""}${answers[i] !== undefined ? " is-answered" : ""}${loaded ? "" : " is-pending"}`}
              aria-label={`Question ${i + 1}${!loaded ? ", still being written" : answers[i] !== undefined ? ", answered" : ""}`}
              aria-current={i === currentIdx ? "step" : undefined}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    );

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}>
        {/* Header */}
        <div className="coach-take-head">
          <div style={{ minWidth: 0 }}>
            <p className="eyebrow" style={{ marginBottom: 4 }}>
              {run === "mistakes" ? "Mistake review" : isSim ? "Full simulation" : comp?.name}
            </p>
            <p style={{ fontSize: 13, color: "var(--text3)" }}>
              {answeredCount} of {isSim && building ? SIM_QUESTIONS : questions.length} answered
            </p>
          </div>
          <div className="coach-take-tools">
            {isSim ? (
              <span role="timer" aria-label="Time remaining" className={`coach-clock is-countdown${lowTime ? " is-low" : ""}`}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" />
                </svg>
                {formatCountdown(remainingMs)}
              </span>
            ) : (
              <span role="timer" aria-label="Time elapsed" className="coach-clock">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" />
                </svg>
                {formatClock(elapsedMs)}
              </span>
            )}
            <button type="button" onClick={restart} className="btn btn-ghost btn-sm">
              Exit test
            </button>
          </div>
        </div>

        {/* Timer announcements for screen readers. */}
        {isSim && (
          <>
            <p className="sr-only" role="status" aria-live="polite">{politeNote}</p>
            <p className="sr-only" aria-live="assertive" aria-atomic="true">{urgentNote}</p>
          </>
        )}
        {lowTime && (
          <p className="coach-time-warning" aria-hidden="true">
            One minute left. The test turns itself in at 0:00.
          </p>
        )}
        {isSim && building && (
          <p className="coach-building-note" role="status" aria-live="polite">
            {questions.length} of {SIM_QUESTIONS} ready. The rest are still being written and checked, and appear in the grid as they clear.
          </p>
        )}

        {/* Answer grid: one numbered bubble per question, like a scantron. A
            100-question paper folds it away so the question stays in view. */}
        {gridSize > 50 ? (
          <details className="coach-grid-fold">
            <summary>
              Answer grid <span className="coach-grid-fold-count">{answeredCount} answered{blanks > 0 && !building ? `, ${blanks} blank` : ""}</span>
            </summary>
            {grid}
          </details>
        ) : (
          grid
        )}

        {/* The question, on a sheet of exam paper. */}
        {q && (
          <div className="sheet-stack">
            <div key={currentIdx} className="sheet coach-sheet turn-in">
              <div className="sheet-head">
                <span className="sheet-meta">
                  Question {currentIdx + 1} <span className="sheet-of">of {isSim && building ? SIM_QUESTIONS : questions.length}</span>
                </span>
                <span className="sheet-event">{comp?.name}</span>
              </div>

              {q.bankId && run !== "mistakes" && <p className="coach-from-bank">From your mistakes</p>}

              <p className="sheet-q">{q.question}</p>

              <div className="sheet-opts" role="group" aria-label="Answer choices">
                {OPTION_KEYS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className="opt"
                    aria-pressed={selectedAnswer === opt}
                    onClick={() => setAnswers((prev) => ({ ...prev, [currentIdx]: opt }))}
                  >
                    <span className="bubble">{opt}</span>
                    <span className="opt-text">{q.options[opt]}</span>
                  </button>
                ))}
              </div>

              <div className="sheet-foot">
                <span className="sheet-hint">Press A, B, C or D to answer. Arrow keys move between questions.</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="coach-nav">
          <button
            type="button"
            onClick={() => setCurrentIdx((i) => Math.max(i - 1, 0))}
            disabled={currentIdx === 0}
            className="btn btn-ghost btn-sm"
            style={{ opacity: currentIdx === 0 ? 0.3 : 1 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          {isSim ? (
            atLastLoaded && !building ? null : (
              <button
                type="button"
                onClick={() => setCurrentIdx((i) => Math.min(i + 1, questions.length - 1))}
                disabled={atLastLoaded}
                className="btn btn-ghost btn-sm"
                style={{ opacity: atLastLoaded ? 0.45 : 1 }}
              >
                {atLastLoaded ? "More on the way" : "Next"}
                {!atLastLoaded && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            )
          ) : currentIdx < questions.length - 1 && !allAnswered ? (
            <button
              type="button"
              onClick={() => setCurrentIdx((i) => Math.min(i + 1, questions.length - 1))}
              className="btn btn-ghost btn-sm"
            >
              Next
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => submitTest()}
              disabled={!allAnswered}
              className="btn btn-accent btn-pill"
              style={{ opacity: allAnswered ? 1 : 0.45 }}
            >
              Submit test
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M5 12l5 5L20 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Simulation: turn in any time once the whole paper is here. Blanks
            are marked wrong, as on the real test, so ask once first. */}
        {isSim && (
          <div className="coach-turn-in">
            {confirmTurnIn ? (
              <>
                <p className="coach-turn-in-q">
                  {blanks} {blanks === 1 ? "question is" : "questions are"} still blank and will be marked wrong. Turn in anyway?
                </p>
                <div className="coach-turn-in-actions">
                  <button type="button" className="btn btn-ghost btn-sm btn-pill" onClick={() => setConfirmTurnIn(false)}>
                    Keep working
                  </button>
                  <button type="button" className="btn btn-accent btn-sm btn-pill" onClick={() => submitTest()}>
                    Turn in
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-accent btn-pill"
                disabled={building}
                style={{ opacity: building ? 0.45 : 1 }}
                onClick={() => (blanks > 0 ? setConfirmTurnIn(true) : submitTest())}
              >
                Turn in test
              </button>
            )}
          </div>
        )}

        <p style={{ fontSize: 11, color: "var(--text3)", textAlign: "center" }}>
          The correct answer and a full explanation for every question appear after you {isSim ? "turn in" : "submit"}.
        </p>

        {!isSim && !allAnswered && (
          <p style={{ fontSize: 11, color: "var(--text3)", textAlign: "center" }}>
            Answer all questions to submit. Use the grid above to jump to unanswered questions.
          </p>
        )}
      </div>
    );
  }

  // ── REVIEWING ─────────────────────────────────────────────────
  const isSim = run === "simulation";
  const blanksAtEnd = questions.length - answeredCount;
  const bankLeft = selectedSlug ? getBank(selectedSlug).length : 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720 }}>
      {/* Report card: the graded front page of the test */}
      <div className="sheet coach-report">
        <div className="sheet-head">
          <span className="sheet-meta">{isSim ? "Full simulation, graded" : run === "mistakes" ? "Mistake review, graded" : "Graded"}</span>
          <span className="sheet-event">{comp?.name}</span>
        </div>

        <div className="report-score">
          <div className="report-big" aria-label={`${correctCount} out of ${questions.length}`}>
            <span>
              {correctCount}
              <span className="report-slash">/</span>
              {questions.length}
            </span>
            <svg className="pen report-circle" viewBox="0 0 120 80" aria-hidden="true">
              <path d="M18 30C28 10 70 4 94 14c18 8 22 30 8 46-16 16-56 18-76 6C6 56 6 38 20 24c8-8 22-12 34-12" />
            </svg>
          </div>
          <div>
            <p className="report-verdict">{meta.label}.</p>
            <p className="coach-report-sub">
              {isSim
                ? `${pct}%. Time used ${formatClock(elapsedMs)} of 50:00${blanksAtEnd > 0 ? `, ${blanksAtEnd} left blank` : ""}.`
                : `${pct}% on ${articleFor(questions.length)} ${questions.length}-question ${run === "mistakes" ? "review" : "test"}${elapsedMs > 0 ? `, finished in ${formatClock(elapsedMs)}` : ""}`}
            </p>
            {isSim && timedOut && <p className="coach-report-sub">Time ran out, so the test was turned in automatically.</p>}
            {isSim && questions.length < SIM_QUESTIONS && (
              <p className="coach-report-sub">
                {questions.length} of {SIM_QUESTIONS} questions were ready and checked in time, so this paper is scored out of {questions.length}.
              </p>
            )}
          </div>
        </div>

        {bankResult && (
          <p className="coach-bank-line">
            {bankSentence(bankResult)}
            {bankLeft > 0 && run !== "retry" && (
              <>
                {" "}
                <button
                  type="button"
                  className="coach-link"
                  onClick={() => {
                    setMode("mistakes");
                    startMistakes();
                  }}
                >
                  Review {Math.min(bankLeft, REVIEW_MAX)} missed {bankLeft === 1 ? "question" : "questions"}
                </button>
              </>
            )}
          </p>
        )}
        {checkerOff && (
          <p className="coach-report-sub">
            The second-model answer check was unavailable during this test, so some questions carry the calculator check only.
          </p>
        )}
        {shortReason && (
          <p className="coach-report-sub">This paper came out shorter than you asked for. {shortReason}</p>
        )}

        {topicRows.length > 1 && (
          <div className="coach-topics">
            <p className="coach-topics-title">By topic, weakest first</p>
            {topicRows.map((t) => (
              <div key={t.topic} className="coach-topic-row">
                <span className="coach-topic-name">{t.topic}</span>
                <span className="coach-topic-bar" aria-hidden="true">
                  <span
                    className={t.right / t.total < 0.6 ? "is-weak" : ""}
                    style={{ width: `${Math.round((t.right / t.total) * 100)}%` }}
                  />
                </span>
                <span className="coach-topic-score">
                  {t.right}/{t.total}
                </span>
                {t.right < t.total ? (
                  <button type="button" className="coach-topic-drill" onClick={() => generate(t.topic)}>
                    Drill
                  </button>
                ) : (
                  <span className="coach-topic-drill is-done" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="sheet-foot coach-report-actions">
          {logged && (
            <span className="btn btn-ghost btn-sm btn-pill" style={{ pointerEvents: "none" }}>
              Saved to your practice history
            </span>
          )}
          {correctCount < questions.length && (
            <button type="button" onClick={retryMisses} className="btn btn-ghost btn-sm btn-pill">
              Retry the {questions.length - correctCount} you missed
            </button>
          )}
          <button type="button" onClick={startSelected} className="btn btn-ghost btn-sm btn-pill">
            {mode === "simulation" ? "New simulation" : mode === "mistakes" ? "Review mistakes again" : "New test"}
          </button>
          <button type="button" onClick={restart} className="btn btn-ghost btn-sm btn-pill">
            Change event
          </button>
        </div>
      </div>

      {/* Every question, graded in red pen, with the explanation in the margin */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="coach-review-head">
          <h2 style={{ fontSize: 26 }}>Review</h2>
          {correctCount < questions.length && correctCount > 0 && (
            <div className="coach-review-toggle" role="group" aria-label="Which questions to show">
              <button type="button" aria-pressed={!missesOnly} onClick={() => setMissesOnly(false)}>
                All {questions.length}
              </button>
              <button type="button" aria-pressed={missesOnly} onClick={() => setMissesOnly(true)}>
                Misses only
              </button>
            </div>
          )}
        </div>
        {questions.map((q, i) => {
          const userAns = answers[i];
          const isCorrect = userAns === q.correct;
          if (missesOnly && isCorrect) return null;
          return (
            <div key={q.id} className="sheet coach-review-item">
              <div className="sheet-head">
                <span className="sheet-meta">Question {i + 1}</span>
                <span className={`coach-review-verdict${isCorrect ? "" : " is-wrong"}`}>
                  {isCorrect ? "Correct" : userAns === undefined ? "Blank" : "Missed"}
                </span>
              </div>
              {q.bankId && run !== "mistakes" && <p className="coach-from-bank">From your mistakes</p>}
              <p className="sheet-q coach-review-q">{q.question}</p>
              <div className="sheet-opts">
                {OPTION_KEYS.map((opt) => {
                  const isUser = userAns === opt;
                  const isRight = q.correct === opt;
                  const state = isRight ? " is-correct" : isUser ? " is-wrong" : " is-dim";
                  return (
                    <div key={opt} className={`opt${state}${isUser ? " is-picked" : ""}`}>
                      <span className="bubble">
                        {opt}
                        {isRight && <PenCircle />}
                        {isUser && !isRight && <PenCross />}
                      </span>
                      <span className="opt-text">
                        {q.options[opt]}
                        {isUser && <span className="sr-only"> (your answer)</span>}
                        {isRight && <span className="sr-only"> (correct answer)</span>}
                      </span>
                      {isRight ? <PenCheck /> : <span />}
                    </div>
                  );
                })}
              </div>
              <div className="sheet-why is-open">
                <div className="why-inner">
                  <span className="why-mark">{isCorrect ? "Right." : "Here's why."}</span> {q.explanation}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingBottom: 32 }}>
        <button type="button" onClick={startSelected} className="btn btn-accent btn-pill">
          {mode === "simulation" ? "Start a new simulation" : mode === "mistakes" ? "Review mistakes again" : "Generate new test"}
        </button>
        <button type="button" onClick={restart} className="btn btn-ghost btn-pill">
          Change event
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
