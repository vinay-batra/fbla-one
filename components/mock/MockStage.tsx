"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QrImage } from "@/components/QrImage";
import Link from "next/link";
import { getCompetition } from "@/lib/competitions";
import { PenCheck } from "@/components/PenMarks";
import {
  chapterAverage,
  endSession,
  formatCountdown,
  getQuestionStats,
  getReview,
  hardestQuestion,
  joinUrl,
  ordinal,
  rankParticipants,
  removeParticipant,
  startSession,
  type MockQuestion,
  type QuestionStat,
} from "@/lib/mock";
import { useMockClock } from "./useMockClock";
import { useMockSession } from "./useMockSession";

// After the clock hits zero, wait for the students' auto-submits (the server
// allows a 10 second grace) before calling time and grading any drafts.
const AUTO_END_AFTER_MS = 12_000;

/** A loose red-pen ring, drawn around the winning score. */
function PenRing() {
  return (
    <svg className="pen mock-ring" viewBox="0 0 150 90" aria-hidden="true">
      <path d="M18 40C22 16 64 6 104 10c30 3 42 20 36 38-7 22-54 34-94 28C14 71 4 56 12 40c7-13 28-21 50-23" />
    </svg>
  );
}

/**
 * The host's projector: lobby (code, QR, who has joined), the live board (clock
 * and who has turned in), then the final results. Always full-window so it reads
 * from the back of a classroom; the Full screen button hides browser chrome too.
 */
export function MockStage({ sessionId }: { sessionId: string }) {
  const { session, participants, loaded, refresh } = useMockSession(sessionId, {
    intervalMs: 2000,
    withParticipants: true,
    keepWhenHidden: true,
  });
  const { now, synced } = useMockClock(250);
  const stageRef = useRef<HTMLDivElement>(null);
  const autoEnded = useRef(false);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<"start" | "end" | "cancel" | null>(null);
  const [error, setError] = useState("");
  const [isFull, setIsFull] = useState(false);
  const [key, setKey] = useState<MockQuestion[] | null>(null);
  const [stats, setStats] = useState<QuestionStat[]>([]);

  const comp = session ? getCompetition(session.event_slug) : undefined;
  const eventName = comp?.name ?? session?.event_slug ?? "";
  const status = session?.status;
  const endsAt = session?.ends_at ? new Date(session.ends_at).getTime() : null;
  const remaining = endsAt != null ? endsAt - now : 0;

  // Lock page scroll under the stage.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onFs = () => setIsFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, []);

  // Pencils down: when the clock (plus grace) runs out, end it so drafts are graded.
  useEffect(() => {
    if (!synced || status !== "live" || endsAt == null || autoEnded.current) return;
    if (now > endsAt + AUTO_END_AFTER_MS) {
      autoEnded.current = true;
      endSession(sessionId).then(() => refresh());
    }
  }, [synced, status, endsAt, now, sessionId, refresh]);

  // Final results need the key (for the hardest question) and per-question stats.
  useEffect(() => {
    if (status !== "ended") return;
    let alive = true;
    Promise.all([getReview(sessionId), getQuestionStats(sessionId)]).then(([r, s]) => {
      if (!alive) return;
      setKey(r?.questions ?? []);
      setStats(s);
    });
    return () => {
      alive = false;
    };
  }, [status, sessionId, participants.length]);

  const ranked = useMemo(() => rankParticipants(participants), [participants]);
  const turnedIn = useMemo(
    () =>
      participants
        .filter((p) => p.submitted_at)
        .sort((a, b) => new Date(a.submitted_at!).getTime() - new Date(b.submitted_at!).getTime()),
    [participants]
  );
  const writing = participants.filter((p) => !p.submitted_at);

  async function act(kind: "start" | "end" | "cancel") {
    if (confirm !== kind) {
      setConfirm(kind);
      return;
    }
    setBusy(true);
    setError("");
    const err = kind === "start" ? await startSession(sessionId) : await endSession(sessionId);
    setBusy(false);
    setConfirm(null);
    if (err) setError(err);
    refresh();
  }

  function toggleFull() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else stageRef.current?.requestFullscreen?.().catch(() => {});
  }

  if (loaded && !session) {
    return (
      <div className="mock-stage" ref={stageRef}>
        <div className="mock-stage-empty">
          <h2>Session not found</h2>
          <p>It may have been deleted, or it belongs to another chapter.</p>
          <Link href="/app/mock" className="btn btn-accent">Back to Mock Regionals</Link>
        </div>
      </div>
    );
  }

  const code = session?.code ?? "";
  const link = code ? joinUrl(code) : "";
  const shortLink = link.replace(/^https?:\/\//, "").replace(/\/join\/.*$/, "");

  return (
    <div className="mock-stage" ref={stageRef} role="region" aria-label="Mock Regionals projector">
      <header className="mock-stage-bar">
        <div className="mock-stage-brand">
          <span className="mock-stage-kicker">Mock Regionals</span>
          <span className="mock-stage-event">{eventName}</span>
        </div>
        <div className="mock-stage-controls">
          {error && <span role="alert" className="mock-stage-error">{error}</span>}
          {status === "lobby" && (
            <>
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => act("cancel")}>
                {confirm === "cancel" ? "Tap again to cancel" : "Cancel session"}
              </button>
              <button type="button" className="btn btn-accent" disabled={busy} onClick={() => act("start")}>
                {confirm === "start"
                  ? participants.length === 0
                    ? "Nobody has joined. Start anyway?"
                    : `Start for ${participants.length}`
                  : "Start the clock"}
              </button>
            </>
          )}
          {status === "live" && (
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => act("end")}>
              {confirm === "end" ? "Tap again to call time" : "Call time now"}
            </button>
          )}
          {status === "ended" && (
            <Link href="/app/mock" className="btn btn-accent btn-sm">New session</Link>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={toggleFull} aria-pressed={isFull}>
            {isFull ? "Exit full screen" : "Full screen"}
          </button>
          <Link href="/app/mock" className="btn btn-ghost btn-sm">Close</Link>
        </div>
      </header>

      {!session && <p className="mock-stage-loading" role="status">Setting up the room...</p>}

      {/* ── LOBBY ── */}
      {status === "lobby" && (
        <main className="mock-stage-body mock-lobby">
          <div className="mock-lobby-join">
            <p className="mock-stage-kicker">Go to <strong>{shortLink}</strong> and enter</p>
            <p className="mock-code" aria-label={`Join code ${code.split("").join(" ")}`}>
              {code.split("").map((ch, i) => (
                <span key={i} aria-hidden="true">{ch}</span>
              ))}
            </p>
            <p className="mock-stage-sub">
              {session?.question_count} questions. {Math.round((session?.duration_sec ?? 0) / 60)} minutes. Phones away
              once the clock starts.
            </p>
          </div>
          <div className="mock-qr">
            {/* White plate is intentional and theme-independent: a QR code needs a
                light quiet zone to scan reliably. */}
            <div className="mock-qr-plate">
              <QrImage text={link} size={320} alt={`QR code that opens the join link for code ${code}`} />
            </div>
            <p className="mock-stage-sub">or scan to join</p>
          </div>

          <section className="mock-roster" aria-live="polite">
            <h2 className="mock-roster-title">
              {participants.length === 0
                ? "Waiting for the first name..."
                : `${participants.length} ${participants.length === 1 ? "member has" : "members have"} joined`}
            </h2>
            <ul className="mock-roster-names">
              {participants.map((p) => (
                <li key={p.id} className="mock-roster-name">
                  {p.display_name}
                  <button
                    type="button"
                    className="mock-roster-x"
                    aria-label={`Remove ${p.display_name}`}
                    onClick={async () => {
                      await removeParticipant(p.id);
                      refresh();
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                      <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </main>
      )}

      {/* ── LIVE ── */}
      {status === "live" && (
        <main className="mock-stage-body mock-live">
          <div className="mock-live-head">
            <p
              className={`mock-clock-big${remaining <= 60_000 ? " is-low" : ""}`}
              role="timer"
              aria-label={`Time remaining ${formatCountdown(remaining)}`}
            >
              {remaining > 0 ? formatCountdown(remaining) : "Time"}
            </p>
            <p className="mock-live-count">
              <strong>{turnedIn.length}</strong> of {participants.length} turned in
            </p>
            <p className="mock-stage-sub">Scores are revealed when time is called.</p>
          </div>
          <ol className="mock-board" aria-label="Who has turned in">
            {turnedIn.map((p) => (
              <li key={p.id} className="mock-board-row is-in">
                <span className="mock-board-mark">
                  <PenCheck />
                </span>
                <span className="mock-board-name">{p.display_name}</span>
                <span className="sr-only">turned in</span>
              </li>
            ))}
            {writing.map((p) => (
              <li key={p.id} className="mock-board-row">
                <span className="mock-board-mark" aria-hidden="true">
                  <span className="mock-dot" />
                </span>
                <span className="mock-board-name">{p.display_name}</span>
                <span className="mock-board-note">writing</span>
              </li>
            ))}
          </ol>
        </main>
      )}

      {/* ── FINAL ── */}
      {status === "ended" && session && (
        <FinalBoard
          ranked={ranked}
          total={session.question_count}
          average={chapterAverage(participants, session.question_count)}
          keyQuestions={key}
          stats={stats}
          cancelled={!session.started_at}
        />
      )}
    </div>
  );
}

function FinalBoard({
  ranked,
  total,
  average,
  keyQuestions,
  stats,
  cancelled,
}: {
  ranked: ReturnType<typeof rankParticipants>;
  total: number;
  average: number | null;
  keyQuestions: MockQuestion[] | null;
  stats: QuestionStat[];
  cancelled: boolean;
}) {
  if (cancelled) {
    return (
      <main className="mock-stage-body mock-stage-empty">
        <h2>Session cancelled</h2>
        <p>It was closed before the clock started, so there are no results.</p>
      </main>
    );
  }
  if (ranked.length === 0) {
    return (
      <main className="mock-stage-body mock-stage-empty">
        <h2>Time</h2>
        <p>Nobody turned in a paper this round.</p>
      </main>
    );
  }

  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const hard = hardestQuestion(stats);
  const hardQ = hard && keyQuestions ? keyQuestions[hard.index] : null;

  return (
    <main className="mock-stage-body mock-final">
      <h2 className="mock-final-title">Final standings</h2>

      <ol className="mock-podium">
        {podium.map((p, i) => (
          <li key={p.id} className={`mock-podium-step place-${i + 1}`}>
            <span className="mock-podium-place">{ordinal(p.rank)}</span>
            <span className="mock-podium-name">{p.display_name}</span>
            <span className="mock-podium-score">
              <span className="mock-podium-num">
                {p.score}
                <span className="mock-podium-of">/{total}</span>
              </span>
              {p.rank === 1 && <PenRing />}
            </span>
          </li>
        ))}
      </ol>

      <div className="mock-final-grid">
        <dl className="mock-final-stats">
          <div>
            <dt>Chapter average</dt>
            <dd>{average != null ? `${average}%` : "N/A"}</dd>
          </div>
          <div>
            <dt>Sat the paper</dt>
            <dd>{ranked.length}</dd>
          </div>
        </dl>

        {hard && (
          <section className="mock-hardest" aria-label="Hardest question">
            <p className="mock-hardest-kicker">
              Hardest question: number {hard.index + 1}, {hard.pct}% got it right
            </p>
            {hardQ && (
              <>
                <p className="mock-hardest-q">{hardQ.question}</p>
                <p className="mock-hardest-a">
                  <span className="why-mark">Answer.</span> {hardQ.options[hardQ.correct]}
                </p>
              </>
            )}
          </section>
        )}
      </div>

      {rest.length > 0 && (
        <ol className="mock-rest" aria-label="Everyone else">
          {rest.map((p) => (
            <li key={p.id}>
              <span className="mock-rest-place">{ordinal(p.rank)}</span>
              <span className="mock-rest-name">{p.display_name}</span>
              <span className="mock-rest-score">
                {p.score}/{total}
              </span>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
