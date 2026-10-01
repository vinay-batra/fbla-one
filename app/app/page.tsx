"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/Card";
import { Sparkbars } from "@/components/Sparkbars";
import { StudyPlan } from "@/components/StudyPlan";
import { ChapterRankChip } from "@/components/ChapterRankChip";
import { judgeModeFor } from "@/components/judge/rubric";
import {
  CATEGORIES,
  COMPETITIONS,
  getCompetition,
  FORMAT_LABEL,
  isAiTestable,
} from "@/lib/competitions";
import {
  getRegistered,
  getPracticeLogs,
  getSavedResources,
  getDisplayName,
  getUpcomingDeadlines,
  getWeakTopics,
  onStorageChange,
  registerCompetition,
  type PracticeLog,
} from "@/lib/storage";
import { bankCount, onMistakesChange } from "@/lib/mistakes";
import { getSupabase } from "@/lib/supabase";
import { relativeTime, dayKeyET } from "@/lib/format";
import {
  isScoredTest,
  parseJudgeNote,
  judgeModeLabel,
  computeReadinessRow,
  getMyProfile,
  getChapterById,
  getChapterReadiness,
  READINESS_LABEL,
  type ReadinessRow,
  type ReadinessStatus,
} from "@/lib/chapter";
import type { Competition } from "@/lib/competitions";

// ── Score trend chart ──────────────────────────────────────────

function ScoreTrends({ logs, registeredCompetitions }: { logs: PracticeLog[]; registeredCompetitions: Competition[] }) {
  // Per-competition: last 8 scored tests, only comps with 2+ scored tests.
  // Judge rounds are rubric points, not test percentages, so they stay out.
  const entries = registeredCompetitions
    .map((comp) => {
      const compLogs = logs
        .filter((l) => l.competitionSlug === comp.slug && isScoredTest(l))
        .slice(0, 8);
      if (compLogs.length < 2) return null;
      const pcts = compLogs.map((l) => Math.round((l.score! / l.outOf!) * 100)).reverse();
      const latest = pcts[pcts.length - 1];
      const avg = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
      return { comp, pcts, latest, avg };
    })
    .filter(Boolean)
    .slice(0, 4) as { comp: Competition; pcts: number[]; latest: number; avg: number }[];

  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader
        eyebrow="AI Practice"
        title="Score trends"
        tagline="Your last 8 scored practice tests per event."
        right={
          <Link href="/app/coach" className="btn btn-ghost btn-sm">
            New test
          </Link>
        }
      />
      <div
        className="score-trends-grid"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginTop: 18 }}
      >
        {entries.map(({ comp, pcts, latest, avg }) => (
          <Link
            key={comp.slug}
            href={`/app/coach?slug=${comp.slug}`}
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 10,
                border: "0.5px solid var(--border)",
                background: "var(--bg2)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-border)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <p style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>{comp.name}</p>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 }}>
                <Sparkbars values={pcts} variant="score" ariaLabel={`Last ${pcts.length} practice scores for ${comp.name}`} />
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p className="font-mono" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1, color: latest >= 80 ? "var(--green)" : latest >= 60 ? "var(--accent)" : "var(--red)" }}>
                    {latest}<span style={{ fontSize: 12 }}>%</span>
                  </p>
                  <p style={{ fontSize: 11.5, color: "var(--text3)", marginTop: 2 }}>avg {avg}%</p>
                </div>
              </div>
              <p style={{ fontSize: 11.5, color: "var(--text3)" }}>{pcts.length} test{pcts.length !== 1 ? "s" : ""} logged</p>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function timeOfDay(): string {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** Where "start" goes for an event: an AI test, a Judge round, or its guide. */
function startFor(comp: Competition): { href: string; label: string } {
  if (isAiTestable(comp)) return { href: `/app/coach?slug=${comp.slug}&start=1`, label: "Start a 10-question test" };
  if (judgeModeFor(comp.format)) return { href: `/app/judge?event=${comp.slug}`, label: "Start a judge round" };
  return { href: `/competitions/${comp.slug}`, label: "Open the event guide" };
}

// ── Event picker (first run, and "Change") ─────────────────────

const BY_CATEGORY = CATEGORIES.map((cat) => ({
  cat,
  events: COMPETITIONS.filter((c) => c.category === cat).sort((a, b) => a.name.localeCompare(b.name)),
})).filter((g) => g.events.length > 0);

function EventPicker({ initial, onCancel }: { initial?: string; onCancel?: () => void }) {
  const router = useRouter();
  const [slug, setSlug] = useState(initial ?? "");
  const comp = slug ? getCompetition(slug) ?? null : null;
  const start = comp ? startFor(comp) : null;

  function go() {
    if (!comp || !start) return;
    registerCompetition(comp.slug);
    router.push(start.href);
  }

  return (
    <div className="dash-picker">
      <label htmlFor="dash-event" className="dash-picker-label">Your event</label>
      <div className="dash-picker-row">
        <select
          id="dash-event"
          className="input-field dash-picker-select"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        >
          <option value="">Choose your event</option>
          {BY_CATEGORY.map((g) => (
            <optgroup key={g.cat} label={g.cat}>
              {g.events.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <button type="button" className="btn btn-accent btn-lg" onClick={go} disabled={!comp}>
          {start?.label ?? "Start a 10-question test"}
        </button>
      </div>
      <p className="dash-picker-note">
        {comp
          ? `${FORMAT_LABEL[comp.format]}. ${isAiTestable(comp)
              ? "Every question is checked by a second AI before you see it."
              : judgeModeFor(comp.format)
                ? "You are scored on your event's rating sheet."
                : "This event has no test or judge round to practice here yet."}`
          : (
            <>
              Not sure which event is yours? <Link href="/#find-your-event">Take the one-minute quiz</Link>.
            </>
          )}
        {onCancel && (
          <>
            {" "}
            <button type="button" className="dash-linkbtn" onClick={onCancel}>Cancel</button>
          </>
        )}
      </p>
    </div>
  );
}

// ── Your event, once picked ────────────────────────────────────

const STATUS_CLASS: Record<ReadinessStatus, string> = {
  attention: "is-attention",
  "on-track": "is-on-track",
  ready: "is-ready",
};

function EventHero({ comp, row, mistakes, onChange }: {
  comp: Competition;
  row: ReadinessRow;
  mistakes: number;
  onChange: () => void;
}) {
  const testable = isAiTestable(comp);
  const judged = judgeModeFor(comp.format) !== null;
  const start = startFor(comp);
  const practiced = row.testsTotal + row.judgeRounds > 0;
  // Weak topics come from synced test logs; fall back to this device's tallies.
  const weak = row.weakTopics.length ? row.weakTopics : getWeakTopics(comp.slug).slice(0, 3);

  const bigNumber = row.avgTestPct != null
    ? { value: `${row.avgTestPct}%`, label: `Test average, last ${Math.min(row.scoredTests, 5)}` }
    : row.latestJudge
      ? { value: `${row.latestJudge.score}`, label: "Latest judge score, out of 100" }
      : null;

  return (
    <section className="dash-hero" aria-labelledby="dash-hero-title">
      <div className="dash-hero-top">
        <div style={{ minWidth: 0 }}>
          <p className="eyebrow" style={{ marginBottom: 6 }}>Competing in</p>
          <h2 id="dash-hero-title" className="dash-hero-title">
            <Link href={`/competitions/${comp.slug}`}>{comp.name}</Link>
          </h2>
          <p className="dash-hero-meta">{comp.category} · {FORMAT_LABEL[comp.format]}</p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onChange}>Change event</button>
      </div>

      {!practiced ? (
        <div className="dash-hero-first">
          <p className="dash-hero-lede">
            {testable
              ? "Take a 10-question test built from your event's topic outline. You get a score, the answer to every question, and your weakest topics."
              : judged
                ? "Draw a case, prep on the clock, and get scored on your event's rating sheet."
                : "Read the event guide to see how it is scored and what to prepare."}
          </p>
          <div className="dash-hero-actions">
            <Link href={start.href} className="btn btn-accent btn-lg">{start.label}</Link>
            {testable && judged && (
              <Link href={`/app/judge?event=${comp.slug}`} className="btn btn-ghost btn-lg">Practice the judged part</Link>
            )}
          </div>
        </div>
      ) : (
        <div className="dash-hero-grid">
          <div className="dash-score">
            {bigNumber ? (
              <>
                <p className="dash-score-num">{bigNumber.value}</p>
                <p className="dash-score-label">{bigNumber.label}</p>
              </>
            ) : (
              <>
                <p className="dash-score-num">{row.testsTotal}</p>
                <p className="dash-score-label">Practice {row.testsTotal === 1 ? "session" : "sessions"} logged</p>
              </>
            )}
            <p className={`dash-status ${STATUS_CLASS[row.status]}`}>
              <strong>{READINESS_LABEL[row.status]}</strong>
              {row.reasons[0] && row.status !== "ready" ? <span>{row.reasons[0]}</span> : null}
            </p>
            {row.trendDelta != null && row.trendDelta !== 0 && (
              <p className="dash-score-trend">
                Your last 3 tests average {Math.abs(row.trendDelta)} points {row.trendDelta > 0 ? "higher" : "lower"} than the ones before
              </p>
            )}
          </div>

          <div className="dash-focus">
            {weak.length > 0 && (
              <div>
                <p className="dash-focus-head">Your weakest topics</p>
                <ul className="dash-weak">
                  {weak.map((t) => (
                    <li key={t.topic}>
                      <span className="dash-weak-name">{t.topic}</span>
                      <span className="dash-weak-pct font-mono">{t.pct}%</span>
                      {testable && (
                        <Link
                          href={`/app/coach?slug=${comp.slug}&topic=${encodeURIComponent(t.topic)}&start=1`}
                          className="dash-weak-drill"
                          aria-label={`Drill ${t.topic}`}
                        >
                          Drill
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {mistakes > 0 && testable && (
              <Link href={`/app/coach?slug=${comp.slug}&mode=mistakes&start=1`} className="dash-mistakes">
                <span className="dash-mistakes-n font-mono">{mistakes}</span>
                <span>
                  {mistakes === 1 ? "missed question is" : "missed questions are"} waiting.
                  <strong> Review them</strong>
                </span>
              </Link>
            )}
            {weak.length === 0 && mistakes === 0 && (
              <p className="dash-focus-empty">
                {testable
                  ? "Take a couple more tests and your weakest topics show up here."
                  : "Each judge round is saved here with its score."}
              </p>
            )}
          </div>

          <div className="dash-hero-actions dash-hero-actions-wide">
            <Link href={testable ? `/app/coach?slug=${comp.slug}&start=1` : start.href} className="btn btn-accent btn-lg">
              {testable ? "Next test" : start.label}
            </Link>
            {testable && judged && (
              <Link href={`/app/judge?event=${comp.slug}`} className="btn btn-ghost btn-lg">Judge round</Link>
            )}
            {testable && (
              <Link href={`/app/coach?slug=${comp.slug}`} className="dash-linkbtn">Full simulation and more</Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// ── Advisors: the chapter comes first ──────────────────────────

type AdvisorView = {
  chapterId: string | null;
  name: string | null;
  members: number;
  counts: Record<ReadinessStatus, number> | null;
};

function useAdvisorView(): AdvisorView | null {
  const [view, setView] = useState<AdvisorView | null>(null);
  useEffect(() => {
    const supa = getSupabase();
    if (!supa) return;
    let cancelled = false;
    (async () => {
      const { data } = await supa.auth.getSession();
      const uid = data.session?.user?.id;
      if (!uid) return;
      const prof = await getMyProfile(uid);
      if (cancelled || !prof || prof.role !== "advisor") return;
      if (!prof.chapter_id) {
        setView({ chapterId: null, name: null, members: 0, counts: null });
        return;
      }
      const [chapter, readiness] = await Promise.all([
        getChapterById(prof.chapter_id),
        getChapterReadiness(prof.chapter_id),
      ]);
      if (cancelled) return;
      const counts: Record<ReadinessStatus, number> = { attention: 0, "on-track": 0, ready: 0 };
      for (const r of readiness?.rows ?? []) counts[r.status] += 1;
      setView({
        chapterId: prof.chapter_id,
        name: chapter?.name ?? null,
        members: readiness?.rows.length ?? 0,
        counts: readiness ? counts : null,
      });
    })().catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return view;
}

function AdvisorHero({ view }: { view: AdvisorView }) {
  if (!view.chapterId) {
    return (
      <section className="dash-hero" aria-labelledby="dash-adv-title">
        <p className="eyebrow" style={{ marginBottom: 6 }}>For advisors</p>
        <h2 id="dash-adv-title" className="dash-hero-title">Create your chapter</h2>
        <p className="dash-hero-lede">
          Name your chapter and you get an invite link and a QR code. Members who join show up on your readiness report.
        </p>
        <div className="dash-hero-actions">
          <Link href="/app/chapter" className="btn btn-accent btn-lg">Create your chapter</Link>
        </div>
      </section>
    );
  }
  return (
    <section className="dash-hero" aria-labelledby="dash-adv-title">
      <div className="dash-hero-top">
        <div style={{ minWidth: 0 }}>
          <p className="eyebrow" style={{ marginBottom: 6 }}>Your chapter</p>
          <h2 id="dash-adv-title" className="dash-hero-title">{view.name ?? "Your chapter"}</h2>
          <p className="dash-hero-meta">
            {view.members === 0 ? "No members yet" : `${view.members} ${view.members === 1 ? "member" : "members"}`}
          </p>
        </div>
      </div>
      {view.members === 0 ? (
        <p className="dash-hero-lede">Share your invite link or QR code from the chapter page. Members join with one tap.</p>
      ) : view.counts ? (
        <ul className="dash-adv-counts">
          {(["ready", "on-track", "attention"] as ReadinessStatus[]).map((s) => (
            <li key={s} className={STATUS_CLASS[s]}>
              <span className="dash-score-num">{view.counts![s]}</span>
              <span className="dash-score-label">{READINESS_LABEL[s]}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="dash-hero-actions">
        <Link href="/app/chapter" className="btn btn-accent btn-lg">
          {view.members === 0 ? "Invite members" : "Open the readiness report"}
        </Link>
        <Link href="/app/mock" className="btn btn-ghost btn-lg">Run a Mock Regionals</Link>
      </div>
    </section>
  );
}

// ── Page ───────────────────────────────────────────────────────

export default function Dashboard() {
  const [tick, setTick] = useState(0);
  useEffect(() => onStorageChange(() => setTick((t) => t + 1)), []);
  useEffect(() => onMistakesChange(() => setTick((t) => t + 1)), []);
  const [changing, setChanging] = useState(false);
  const advisor = useAdvisorView();

  const displayName = getDisplayName();

  // Derive everything once per storage change (tick), not on every render.
  const { logs, saved, logsThisWeek, streakDays, upcomingDeadlines, registeredCompetitions } = useMemo(() => {
    void tick; // recompute when localStorage changes
    const registered = getRegistered();
    const logs = getPracticeLogs();
    const saved = getSavedResources();

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const logsThisWeek = logs.filter((l) => new Date(l.loggedAt).getTime() >= weekAgo).length;

    // Practice streak: consecutive days (ending today or yesterday) with >=1 log.
    const streakDays = (() => {
      // Use one fixed day-boundary basis (America/New_York) everywhere so the
      // streak and the public-chat daily cap agree on when a day rolls over.
      const days = new Set(logs.map((l) => dayKeyET(new Date(l.loggedAt))));
      if (days.size === 0) return 0;
      const oneDay = 86400000;
      const cur = new Date();
      cur.setHours(0, 0, 0, 0);
      const todayKey = dayKeyET(cur);
      // Count even if today has no log yet (start from yesterday).
      if (!days.has(todayKey)) cur.setTime(cur.getTime() - oneDay);
      let n = 0;
      while (days.has(dayKeyET(cur))) {
        n++;
        cur.setTime(cur.getTime() - oneDay);
      }
      return n;
    })();

    const upcomingDeadlines = getUpcomingDeadlines(3);

    const registeredCompetitions = registered
      .map((slug) => getCompetition(slug))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));

    return { logs, saved, logsThisWeek, streakDays, upcomingDeadlines, registeredCompetitions };
  }, [tick]);

  // Single-event model: you compete in ONE event.
  const myEvent = registeredCompetitions[0] ?? null;
  const hasPractice = logs.length > 0;

  // The same readiness rule the advisor's report uses, on this student's own logs.
  const row = useMemo(() => {
    if (!myEvent) return null;
    return computeReadinessRow(
      { id: "me", name: "", email: null, eventSlug: myEvent.slug },
      logs.map((l) => ({
        slug: l.competitionSlug,
        score: l.score,
        outOf: l.outOf,
        notes: l.notes,
        t: new Date(l.loggedAt).getTime(),
        loggedAt: l.loggedAt,
        topics: l.topicResults ?? null,
      }))
    );
  }, [myEvent, logs]);
  const mistakes = useMemo(() => {
    void tick;
    return myEvent ? bankCount(myEvent.slug) : 0;
  }, [myEvent, tick]);

  const practicedEvent = row ? row.testsTotal + row.judgeRounds > 0 : false;
  const headline = advisor
    ? advisor.chapterId ? "Here is your chapter." : "Set up your chapter."
    : !myEvent
      ? hasPractice ? "Pick your event to see where you stand." : "Let's get your first score."
      : practicedEvent
        ? "Here is where you stand."
        : "Take your first test.";

  return (
    <div className="dash" style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1080 }}>
      {/* Greeting */}
      <div>
        <p className="eyebrow" style={{ marginBottom: 8 }}>
          {timeOfDay()}{displayName ? `, ${displayName}` : ""}
        </p>
        <h1 style={{ fontSize: 30, letterSpacing: "-0.02em" }}>{headline}</h1>
      </div>

      {advisor && <AdvisorHero view={advisor} />}

      {/* The one thing to do next */}
      {changing || (!myEvent && !advisor) ? (
        <section className="dash-hero" aria-label="Pick your event">
          {changing && <p className="eyebrow" style={{ marginBottom: 10 }}>Change event</p>}
          <EventPicker
            initial={changing ? myEvent?.slug : undefined}
            onCancel={changing ? () => setChanging(false) : undefined}
          />
        </section>
      ) : myEvent && row ? (
        <EventHero comp={myEvent} row={row} mistakes={mistakes} onChange={() => setChanging(true)} />
      ) : (
        <p className="dash-aside">
          Want to see what your members see? <Link href="/app/coach">Take a practice test</Link>.
        </p>
      )}

      {/* Chapter standing (renders only for users in a chapter) */}
      <ChapterRankChip />

      {/* Upcoming deadlines strip (only shown when deadlines exist) */}
      {upcomingDeadlines.length > 0 && (
        <div
          style={{
            background: "var(--bg2)",
            border: "0.5px solid var(--accent-border)",
            borderRadius: 12,
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span className="eyebrow" style={{ fontSize: 11, color: "var(--accent-text)" }}>Upcoming</span>
          </div>
          <div style={{ display: "flex", gap: 10, flex: 1, flexWrap: "wrap" }}>
            {upcomingDeadlines.map((dl) => {
              const days = Math.round(
                (new Date(dl.dueAt + "T00:00:00").getTime() - new Date().setHours(0, 0, 0, 0)) /
                  (1000 * 60 * 60 * 24)
              );
              const comp = dl.competitionSlug ? getCompetition(dl.competitionSlug) : null;
              return (
                <div
                  key={dl.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 10px",
                    borderRadius: 8,
                    background: "var(--card-bg)",
                    border: "0.5px solid var(--border)",
                  }}
                >
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: days === 0 ? "var(--green)" : "var(--accent)",
                    }}
                  >
                    {days === 0 ? "Today" : `${days}d`}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text2)", fontWeight: 500 }}>
                    {dl.title}
                    {comp && (
                      <span style={{ color: "var(--text3)" }}> ({comp.name})</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
          <Link href="/app/chapter" style={{ fontSize: 12, color: "var(--accent-text)", fontWeight: 500, flexShrink: 0, whiteSpace: "nowrap" }}>
            View all
          </Link>
        </div>
      )}

      {/* Season countdown: one line until opened */}
      {myEvent && <StudyPlan />}

      {/* Stats appear once there is something to count */}
      {hasPractice && (
        <div className="dash-stats">
          <Stat label="Day streak" value={String(streakDays)} sub={streakDays === 0 ? "Practice today to start one" : streakDays === 1 ? "day in a row" : "days in a row"} />
          <Stat label="This week" value={String(logsThisWeek)} sub={logsThisWeek === 1 ? "practice session" : "practice sessions"} href="/app/tracker" />
          <Stat label="All time" value={String(logs.length)} sub={logs.length === 1 ? "practice session" : "practice sessions"} href="/app/tracker" />
          {saved.length > 0 && (
            <Stat label="Saved" value={String(saved.length)} sub={saved.length === 1 ? "study resource" : "study resources"} href="/app/resources" />
          )}
        </div>
      )}

      {/* Score trends (only shown once there are 3+ scored logs) */}
      {logs.filter((l) => isScoredTest(l)).length >= 3 && (
        <ScoreTrends logs={logs} registeredCompetitions={registeredCompetitions} />
      )}

      {/* Recent activity */}
      {hasPractice && (
        <Card>
          <CardHeader
            eyebrow="Recent practice"
            title="Last 5 sessions"
            right={<Link href="/app/tracker" className="btn btn-ghost btn-sm">All practice</Link>}
          />
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
            {logs.slice(0, 5).map((l) => {
              const c = getCompetition(l.competitionSlug);
              const judge = parseJudgeNote(l.notes);
              return (
                <li
                  key={l.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "var(--bg2)",
                    border: "0.5px solid var(--border)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                      {c?.name ?? l.competitionSlug}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text3)", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                      {relativeTime(l.loggedAt)}
                      {judge && (
                        <span className="chip chip-brand" style={{ fontSize: 12, padding: "1px 7px" }}>
                          AI Judge: {judgeModeLabel(judge.mode).toLowerCase()}
                        </span>
                      )}
                    </p>
                  </div>
                  {l.score != null && l.outOf != null && (
                    <span
                      className="font-mono"
                      style={{
                        fontSize: 12,
                        color: "var(--accent-text)",
                        fontWeight: 700,
                      }}
                    >
                      {l.score}/{l.outOf}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, sub, href }: { label: string; value: string; sub?: string; href?: string }) {
  const inner = (
    <>
      <p className="dash-stat-label font-mono">{label}</p>
      <div className="metric-number" style={{ marginTop: 6, color: "var(--text)" }}>{value}</div>
      {sub && <p className="dash-stat-sub">{sub}</p>}
    </>
  );
  if (href) {
    return (
      <Link href={href} className="dash-stat is-link">
        {inner}
      </Link>
    );
  }
  return <div className="dash-stat">{inner}</div>;
}
