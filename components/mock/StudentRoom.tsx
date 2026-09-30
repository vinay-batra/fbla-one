"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getCompetition } from "@/lib/competitions";
import { formatCountdown, getPaper, joinSession, type Paper } from "@/lib/mock";
import { useMockClock } from "./useMockClock";
import { useMockSession } from "./useMockSession";
import { MockExam } from "./MockExam";
import { MockResults } from "./MockResults";

/**
 * A member's view of one session: join, wait in the lobby, sit the paper,
 * wait for time to be called, then see the graded paper and review.
 */
export function StudentRoom({ sessionId, userId }: { sessionId: string; userId: string }) {
  const { session, participants, loaded, refresh } = useMockSession(sessionId, {
    intervalMs: 2500,
    withParticipants: true,
  });
  const { now, synced } = useMockClock(500);
  const [paper, setPaper] = useState<Paper | null | undefined>(undefined);
  const [turnedInNote, setTurnedInNote] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  const status = session?.status;

  const loadPaper = useCallback(async () => {
    setPaper(await getPaper(sessionId));
  }, [sessionId]);

  // Re-fetch the paper whenever the session changes phase (lobby -> live -> ended).
  useEffect(() => {
    if (!status) return;
    loadPaper();
  }, [status, loadPaper]);

  const me = participants.find((p) => p.user_id === userId);
  const joined = Boolean(me) || Boolean(paper?.joined);
  const submitted = Boolean(me?.submitted_at) || Boolean(paper?.submitted) || Boolean(turnedInNote);
  const comp = session ? getCompetition(session.event_slug) : undefined;
  const eventName = comp?.name ?? session?.event_slug ?? "";
  const endsAt = session?.ends_at ? new Date(session.ends_at).getTime() : null;
  const timeUp = endsAt != null && now >= endsAt;

  async function join() {
    setJoining(true);
    setJoinError("");
    const err = await joinSession(sessionId, userId);
    setJoining(false);
    if (err) setJoinError(err);
    await refresh();
    loadPaper();
  }

  if (!loaded || (session && paper === undefined)) {
    return <p className="mock-muted mock-page" role="status">Finding your seat...</p>;
  }

  if (!session) {
    return (
      <div className="mock-page">
        <div className="card mock-note">
          <h3>Session not found</h3>
          <p>Check the code on the projector. Sessions are only visible to members of the chapter that runs them.</p>
          <Link href="/app/mock" className="btn btn-accent btn-sm">Enter a code</Link>
        </div>
      </div>
    );
  }

  // Finished: results for everyone in the chapter (a score only if you sat it).
  if (status === "ended") {
    return (
      <div className="mock-page">
        <MockResults
          sessionId={sessionId}
          userId={userId}
          eventSlug={session.event_slug}
          eventName={eventName}
          total={session.question_count}
          participants={participants}
        />
      </div>
    );
  }

  // Not joined yet: offer a seat while the session still takes players.
  if (!joined) {
    const open = status === "lobby" || (status === "live" && !timeUp);
    return (
      <div className="mock-page">
        <div className="sheet-stack">
          <div className="sheet mock-wait">
            <div className="sheet-head">
              <span className="sheet-meta">Mock Regionals</span>
              <span className="sheet-event">{eventName}</span>
            </div>
            <h2 className="mock-wait-title">{open ? "Take a seat" : "This session is closed"}</h2>
            <p className="mock-muted">
              {open
                ? `${session.question_count} questions, ${Math.round(session.duration_sec / 60)} minutes.${status === "live" ? " It has already started, so the clock is running." : ""}`
                : "The clock has run out. Results appear here once your advisor calls time."}
            </p>
            {joinError && <p role="alert" className="mock-alert">{joinError}</p>}
            {open && (
              <button type="button" className="btn btn-accent btn-lg" disabled={joining} onClick={join}>
                {joining ? "Joining..." : "Join this session"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Lobby: waiting for the advisor to press Start.
  if (status === "lobby") {
    return (
      <div className="mock-page">
        <div className="sheet-stack">
          <div className="sheet mock-wait" aria-live="polite">
            <div className="sheet-head">
              <span className="sheet-meta">Seat taken</span>
              <span className="sheet-event">{eventName}</span>
            </div>
            <h2 className="mock-wait-title">You&apos;re in, {me?.display_name ?? "friend"}.</h2>
            <p className="mock-muted">
              Eyes on the projector. The paper appears here the moment your advisor starts the clock. {participants.length}{" "}
              {participants.length === 1 ? "member is" : "members are"} seated.
            </p>
            <p className="mock-wait-pulse" aria-hidden="true">
              <span />
              <span />
              <span />
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Live and turned in: wait for the board. (When time runs out mid-test the
  // exam stays mounted so its auto-submit can fire, then lands here.)
  if (submitted) {
    return (
      <div className="mock-page">
        <div className="sheet-stack">
          <div className="sheet mock-wait" aria-live="polite">
            <div className="sheet-head">
              <span className="sheet-meta">Turned in</span>
              <span className="sheet-event">{eventName}</span>
            </div>
            <h2 className="mock-wait-title">Pencils down.</h2>
            <p className="mock-muted">
              {turnedInNote || "Your paper is in."} Scores and your review open when time is called
              {endsAt != null && !timeUp ? `, in ${formatCountdown(endsAt - now)}` : ""}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Live and writing.
  if (!paper || paper.questions.length === 0 || endsAt == null) {
    return <p className="mock-muted mock-page" role="status">Handing out the paper...</p>;
  }

  return (
    <div className="mock-page">
      <MockExam
        sessionId={sessionId}
        userId={userId}
        eventName={eventName}
        questions={paper.questions}
        initialAnswers={paper.myAnswers}
        endsAt={endsAt}
        now={now}
        clockSynced={synced}
        onTurnedIn={(note) => {
          setTurnedInNote(note);
          refresh();
        }}
      />
    </div>
  );
}
