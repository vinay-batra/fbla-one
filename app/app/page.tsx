"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StudyPlan } from "@/components/StudyPlan";
import { EventCombobox } from "@/components/dashboard/EventCombobox";
import { ChapterRankChip } from "@/components/ChapterRankChip";
import { judgeModeFor } from "@/components/judge/rubric";
import {
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
  AI_LOG_PREFIX,
  isScoredTest,
  parseJudgeNote,
  judgeModeLabel,
  computeReadinessRow,
  getMyProfile,
  getChapterById,
  getChapterReadiness,
  READINESS_LABEL,
  READINESS_RULE,
  type ReadinessRow,
  type ReadinessStatus,
} from "@/lib/chapter";
import type { Competition } from "@/lib/competitions";
import "./dashboard.css";

// ── Helpers ────────────────────────────────────────────────────

function timeOfDay(): string {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** Where "start" goes for an event: an AI test, a Judge round, or its guide. */
function startFor(comp: Competition): { href: string; label: string } {
  if (isAiTestable(comp)) return { href: `/app/coach?slug=${comp.slug}&start=1`, label: "Begin test" };
  if (judgeModeFor(comp.format)) return { href: `/app/judge?event=${comp.slug}`, label: "Begin judge round" };
  return { href: `/competitions/${comp.slug}`, label: "Open the event guide" };
}

function paperFor(comp: Competition | null): string {
  if (!comp) return "Pick an event first";
  if (isAiTestable(comp)) return "10 questions, every answer checked by a second AI";
  if (judgeModeFor(comp.format)) return "One round, scored on the rating sheet";
  return "No test or judged round to practice here yet";
}

/** What kind of practice a log was, in plain words. */
function logKind(l: PracticeLog): string {
  const judge = parseJudgeNote(l.notes);
  if (judge) return `AI Judge, ${judgeModeLabel(judge.mode).toLowerCase()}`;
  if (l.notes.startsWith("Mistake review")) return "Mistake review";
  if (l.notes.startsWith(`${AI_LOG_PREFIX} (full simulation)`)) return "Full simulation";
  if (l.notes.startsWith(AI_LOG_PREFIX)) return "Practice test";
  return "Logged by hand";
}

function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

const STATUS_CLASS: Record<ReadinessStatus, string> = {
  attention: "is-attention",
  "on-track": "is-on-track",
  ready: "is-ready",
};

// ── Booklet cover: pick an event, begin ─────────────────────────

function BookletCover({ initial, changing, onCancel }: { initial?: string; changing?: boolean; onCancel?: () => void }) {
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
    <section className="db-sheet" aria-labelledby="db-cover-title">
      <div className="db-sheet-head">
        <span className="db-sheet-kicker">{changing ? "Change event" : "Practice booklet"}</span>
        <span className="db-sheet-kicker"><b>{changing ? "" : "No. 1"}</b></span>
      </div>
      <div className="db-sheet-body db-cover">
        <div style={{ minWidth: 0 }}>
          <h2 id="db-cover-title" className="db-cover-title">
            {changing ? <>Switch to a <em>new event.</em></> : <>Fill in your event, <em>then begin.</em></>}
          </h2>
          <div className="db-fields">
            <div className="db-field">
              <label htmlFor="db-event" className="db-field-label">Event</label>
              <EventCombobox id="db-event" value={slug} onChange={setSlug} />
            </div>
            <div className="db-field">
              <span className="db-field-label">Format</span>
              <span className="db-field-value">{comp ? FORMAT_LABEL[comp.format] : "Fills in when you pick"}</span>
            </div>
            <div className="db-field">
              <span className="db-field-label">Paper</span>
              <span className="db-field-value">{paperFor(comp)}</span>
            </div>
          </div>
          <p className="db-cover-note">
            {changing && onCancel ? (
              <button type="button" className="db-linkbtn" onClick={onCancel}>Keep my current event</button>
            ) : (
              <>Not sure which event is yours? <Link href="/#find-your-event">Take the one-minute quiz</Link>.</>
            )}
          </p>
        </div>
        <div className="db-cover-side">
          <button type="button" className="db-begin" onClick={go} disabled={!comp}>
            {start?.label ?? "Begin test"} <Arrow />
          </button>
        </div>
      </div>
    </section>
  );
}

// ── Report card: score, status, weakest topics ──────────────────

function ReportCard({ comp, row, mistakes, onChange }: {
  comp: Competition;
  row: ReadinessRow;
  mistakes: number;
  onChange: () => void;
}) {
  const testable = isAiTestable(comp);
  // Weak topics come from synced test logs; fall back to this device's tallies.
  const weak = row.weakTopics.length ? row.weakTopics : getWeakTopics(comp.slug).slice(0, READINESS_RULE.weakCount);

  const big = row.avgTestPct != null
    ? { value: String(row.avgTestPct), unit: "%", label: `Test average, last ${Math.min(row.scoredTests, READINESS_RULE.avgWindow)}` }
    : row.latestJudge
      ? { value: String(row.latestJudge.score), unit: "/100", label: "Latest judge score" }
      : { value: String(row.testsTotal), unit: "", label: row.testsTotal === 1 ? "Practice session logged" : "Practice sessions logged" };

  return (
    <section className="db-sheet" aria-labelledby="db-report-title">
      <div className="db-sheet-head">
        <span className="db-sheet-kicker">Report card · <b id="db-report-title">{comp.name}</b></span>
        <button type="button" className="db-linkbtn" onClick={onChange}>Change event</button>
      </div>
      <div className="db-sheet-body db-report">
        <div className="db-score">
          <div className="db-score-wrap">
            <p className="db-score-num">
              {big.value}<small>{big.unit}</small>
            </p>
            <svg className="db-score-circle" viewBox="0 0 120 80" preserveAspectRatio="none" aria-hidden="true">
              <path pathLength={1} d="M18 22C36 6 86 4 106 20c16 13 10 38-14 48-26 11-66 9-82-6C-2 50 4 30 22 18c10-7 26-10 40-10" />
            </svg>
          </div>
          <p className="db-score-label">{big.label}</p>
          {row.trendDelta != null && row.trendDelta !== 0 && (
            <p className="db-trend">
              <b>{row.trendDelta > 0 ? "Up" : "Down"} {Math.abs(row.trendDelta)} points</b> over your last {READINESS_RULE.trendWindow} tests
            </p>
          )}
          <div className={`db-stamp ${STATUS_CLASS[row.status]}`}>
            <strong>{READINESS_LABEL[row.status]}</strong>
            {row.status !== "ready" && row.reasons[0] && <span>{row.reasons[0]}</span>}
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          <p className="db-notes-head">
            <span>Weakest topics</span>
            {weak.length > 0 && <span>% right</span>}
          </p>
          {weak.length > 0 ? (
            <ul className="db-topics">
              {weak.map((t) => (
                <li key={t.topic} className="db-topic">
                  <span className="db-topic-name">
                    <span>{t.topic}</span>
                    <span>{t.pct}%</span>
                  </span>
                  <span className="db-bar" aria-hidden="true">
                    <i className={t.pct >= READINESS_RULE.testReadyPct ? "is-ok" : ""} style={{ width: `${Math.max(4, t.pct)}%` }} />
                  </span>
                  {testable && (
                    <Link
                      href={`/app/coach?slug=${comp.slug}&topic=${encodeURIComponent(t.topic)}&start=1`}
                      className="db-drill"
                      aria-label={`Drill ${t.topic}`}
                    >
                      Drill
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="db-empty-note">
              {testable
                ? "Take a couple more tests and your weakest topics show up here, each with a drill."
                : "Each judge round is saved here with its score."}
            </p>
          )}

          {mistakes > 0 && testable && (
            <Link href={`/app/coach?slug=${comp.slug}&mode=mistakes&start=1`} className="db-mistakes">
              <span className="db-mistakes-n">{mistakes}</span>
              <span className="db-mistakes-text">
                <strong>{mistakes === 1 ? "Missed question waiting" : "Missed questions waiting"}</strong>
                They come back until you get each one right twice.
              </span>
              <span className="db-mistakes-go">Review</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Next moves ─────────────────────────────────────────────────

function Moves({ comp, mistakes, weakest }: { comp: Competition; mistakes: number; weakest: string | null }) {
  const testable = isAiTestable(comp);
  const judged = judgeModeFor(comp.format) !== null;
  const tiles: { href: string; kicker: string; title: string; sub: string; primary?: boolean }[] = [];

  if (testable) {
    tiles.push({
      href: `/app/coach?slug=${comp.slug}&start=1`,
      kicker: "10 questions",
      title: "Next practice test",
      sub: mistakes > 0 ? "Mixes in your misses" : "Checked by a second AI",
      primary: true,
    });
    tiles.push({
      href: `/app/coach?slug=${comp.slug}&mode=simulation&start=1`,
      kicker: "100 questions · 50:00",
      title: "Full simulation",
      sub: "Turns itself in at zero",
    });
  }
  if (judged) {
    tiles.push({
      href: `/app/judge?event=${comp.slug}`,
      kicker: judgeModeFor(comp.format) === "role-play" ? "Role play" : "Presentation",
      title: "Judge round",
      sub: "Scored on the rating sheet",
      primary: !testable,
    });
  } else if (testable && weakest) {
    tiles.push({
      href: `/app/coach?slug=${comp.slug}&topic=${encodeURIComponent(weakest)}&start=1`,
      kicker: "Drill",
      title: weakest,
      sub: "Every question on your weakest topic",
    });
  }
  if (!testable && !judged) {
    tiles.push({ href: `/competitions/${comp.slug}`, kicker: "Event guide", title: "How it is scored", sub: "Topics and resources", primary: true });
  }

  return (
    <nav className="db-moves" aria-label="Practice next">
      {tiles.map((t) => (
        <Link key={t.href} href={t.href} className={`db-move${t.primary ? " is-primary" : ""}`}>
          <span className="db-move-kicker">{t.kicker}</span>
          <span className="db-move-title">{t.title}</span>
          <span className="db-move-sub">{t.sub} <Arrow /></span>
        </Link>
      ))}
    </nav>
  );
}

// ── Score chart: every scored test for the event ────────────────

function ScoreChart({ comp, logs }: { comp: Competition; logs: PracticeLog[] }) {
  const pts = logs
    .filter((l) => l.competitionSlug === comp.slug && isScoredTest(l))
    .slice(0, 12)
    .reverse()
    .map((l) => Math.round((l.score! / l.outOf!) * 100));
  if (pts.length < 2) return null;

  const W = 960, H = 220, L = 34, R = 24, T = 26, B = 14;
  const x = (i: number) => L + (i * (W - L - R)) / (pts.length - 1);
  const y = (v: number) => T + ((100 - v) * (H - T - B)) / 100;
  const line = pts.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(pts.length - 1).toFixed(1)} ${y(0)} L${x(0).toFixed(1)} ${y(0)} Z`;
  const ready = READINESS_RULE.testReadyPct;
  const last = pts[pts.length - 1];

  return (
    <section className="db-chart-card" aria-labelledby="db-chart-title">
      <div className="db-chart-top">
        <h2 id="db-chart-title" className="db-chart-title">Your scores</h2>
        <span className="db-chart-sub">Last {pts.length} scored tests in {comp.name}</span>
      </div>
      <svg className="db-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Scores, oldest to newest: ${pts.join("%, ")}%`}>
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line className="grid" x1={L} x2={W - R} y1={y(v)} y2={y(v)} />
            <text className="axis" x={L - 8} y={y(v) + 4} textAnchor="end">{v}</text>
          </g>
        ))}
        <line className="ready" x1={L} x2={W - R} y1={y(ready)} y2={y(ready)} />
        <text className="ready-label" x={L + 6} y={y(ready) - 7}>Ready at {ready}%</text>
        <path className="area" d={area} />
        <path className="line" d={line} />
        {pts.map((v, i) => (
          <circle key={i} className={`dot${i === pts.length - 1 ? " is-last" : ""}`} cx={x(i)} cy={y(v)} r={i === pts.length - 1 ? 5 : 3.6} />
        ))}
        <text className="last-label" x={x(pts.length - 1)} y={y(last) - 12} textAnchor="middle">{last}%</text>
      </svg>
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
      <section className="db-sheet" aria-labelledby="db-adv-title">
        <div className="db-sheet-head">
          <span className="db-sheet-kicker">For advisors</span>
        </div>
        <div className="db-sheet-body">
          <h2 id="db-adv-title" className="db-cover-title">Create <em>your chapter.</em></h2>
          <p className="db-cover-note" style={{ maxWidth: "52ch" }}>
            Name it and you get an invite link and a QR code. Members who join show up on your readiness report.
          </p>
          <div className="db-actions">
            <Link href="/app/chapter" className="db-begin">Create your chapter <Arrow /></Link>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="db-sheet" aria-labelledby="db-adv-title">
      <div className="db-sheet-head">
        <span className="db-sheet-kicker">Your chapter · <b>{view.members === 1 ? "1 member" : `${view.members} members`}</b></span>
      </div>
      <div className="db-sheet-body">
        <h2 id="db-adv-title" className="db-cover-title">{view.name ?? "Your chapter"}</h2>
        {view.members === 0 ? (
          <p className="db-cover-note">Share your invite link or QR code from the chapter page. Members join with one tap.</p>
        ) : view.counts ? (
          <ul className="db-adv-counts">
            {(["ready", "on-track", "attention"] as ReadinessStatus[]).map((s) => (
              <li key={s} className={STATUS_CLASS[s]}>
                <span className="db-stat-num">{view.counts![s]}</span>
                <span className="db-stat-label" style={{ display: "block" }}>{READINESS_LABEL[s]}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="db-actions">
          <Link href="/app/chapter" className="db-begin">
            {view.members === 0 ? "Invite members" : "Open the readiness report"} <Arrow />
          </Link>
          <Link href="/app/mock" className="db-ghost">Run a Mock Regionals</Link>
        </div>
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
  const { logs, saved, logsThisWeek, streakDays, upcomingDeadlines, myEvent } = useMemo(() => {
    void tick; // recompute when localStorage changes
    const logs = getPracticeLogs();
    const saved = getSavedResources();
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const logsThisWeek = logs.filter((l) => new Date(l.loggedAt).getTime() >= weekAgo).length;

    // Practice streak: consecutive days (ending today or yesterday) with >=1 log,
    // on the same America/New_York day boundary as the daily AI caps.
    const streakDays = (() => {
      const days = new Set(logs.map((l) => dayKeyET(new Date(l.loggedAt))));
      if (days.size === 0) return 0;
      const oneDay = 86400000;
      const cur = new Date();
      cur.setHours(0, 0, 0, 0);
      if (!days.has(dayKeyET(cur))) cur.setTime(cur.getTime() - oneDay);
      let n = 0;
      while (days.has(dayKeyET(cur))) {
        n++;
        cur.setTime(cur.getTime() - oneDay);
      }
      return n;
    })();

    // Single-event model: you compete in ONE event.
    const myEvent = getRegistered().map((s) => getCompetition(s)).find(Boolean) ?? null;
    return { logs, saved, logsThisWeek, streakDays, upcomingDeadlines: getUpcomingDeadlines(3), myEvent };
  }, [tick]);

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
  const weakest = myEvent && row
    ? (row.weakTopics[0]?.topic ?? getWeakTopics(myEvent.slug)[0]?.topic ?? null)
    : null;

  const headline = advisor
    ? advisor.chapterId ? <>Here is <em>your chapter.</em></> : <>Set up <em>your chapter.</em></>
    : !myEvent
      ? hasPractice ? <>Pick your event to see <em>where you stand.</em></> : <>Let&apos;s get your <em>first score.</em></>
      : practicedEvent
        ? <>Here is where <em>you stand.</em></>
        : <>Take your <em>first test.</em></>;

  return (
    <div className="db">
      <div className="db-greet">
        <p className="eyebrow">{timeOfDay()}{displayName ? `, ${displayName}` : ""}</p>
        <h1 className="db-title">{headline}</h1>
      </div>

      {advisor && <AdvisorHero view={advisor} />}

      {/* The one thing to do next */}
      {changing ? (
        <BookletCover initial={myEvent?.slug} changing onCancel={() => setChanging(false)} />
      ) : myEvent && row && practicedEvent ? (
        <>
          <ReportCard comp={myEvent} row={row} mistakes={mistakes} onChange={() => setChanging(true)} />
          <Moves comp={myEvent} mistakes={mistakes} weakest={weakest} />
        </>
      ) : myEvent && !advisor ? (
        <BookletCover key={myEvent.slug} initial={myEvent.slug} />
      ) : !advisor ? (
        <BookletCover />
      ) : (
        <p className="db-aside">
          Want to see what your members see? <Link href="/app/coach">Take a practice test</Link>.
        </p>
      )}

      {/* Chapter standing (renders only for users in a chapter) */}
      <ChapterRankChip />

      {/* Upcoming chapter deadlines (only when there are any) */}
      {upcomingDeadlines.length > 0 && (
        <div className="db-ledger">
          <div className="db-ledger-head">
            <h2>Coming up</h2>
            <Link href="/app/chapter">All deadlines</Link>
          </div>
          <ul>
            {upcomingDeadlines.map((dl) => {
              const days = Math.round(
                (new Date(dl.dueAt + "T00:00:00").getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000
              );
              const comp = dl.competitionSlug ? getCompetition(dl.competitionSlug) : null;
              return (
                <li key={dl.id}>
                  <span className="db-ledger-name">
                    {dl.title}
                    {comp && <span className="db-ledger-kind">{comp.name}</span>}
                  </span>
                  <span className="db-ledger-when" />
                  <span className="db-ledger-score">{days === 0 ? "Today" : `${days}d`}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Season countdown: one line until opened */}
      {myEvent && <StudyPlan />}

      {myEvent && <ScoreChart comp={myEvent} logs={logs} />}

      {/* Stats appear once there is something to count */}
      {hasPractice && (
        <div className="db-stats">
          <div className="db-stat">
            <div className="db-stat-num">{streakDays}</div>
            <div className="db-stat-label">{streakDays === 1 ? "Day in a row" : "Days in a row"}</div>
          </div>
          <Link href="/app/tracker" className="db-stat">
            <div className="db-stat-num">{logsThisWeek}</div>
            <div className="db-stat-label">This week</div>
          </Link>
          <Link href="/app/tracker" className="db-stat">
            <div className="db-stat-num">{logs.length}</div>
            <div className="db-stat-label">All time</div>
          </Link>
          {saved.length > 0 && (
            <Link href="/app/resources" className="db-stat">
              <div className="db-stat-num">{saved.length}</div>
              <div className="db-stat-label">Saved resources</div>
            </Link>
          )}
        </div>
      )}

      {/* Recent practice */}
      {hasPractice && (
        <div className="db-ledger">
          <div className="db-ledger-head">
            <h2>Recent practice</h2>
            <Link href="/app/tracker">All practice</Link>
          </div>
          <ul>
            {logs.slice(0, 5).map((l) => {
              const c = getCompetition(l.competitionSlug);
              return (
                <li key={l.id}>
                  <span className="db-ledger-name">
                    {c?.name ?? l.competitionSlug}
                    <span className="db-ledger-kind">{logKind(l)}</span>
                  </span>
                  <span className="db-ledger-when">{relativeTime(l.loggedAt)}</span>
                  <span className="db-ledger-score">
                    {l.score != null && l.outOf != null ? `${l.score}/${l.outOf}` : "Done"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
