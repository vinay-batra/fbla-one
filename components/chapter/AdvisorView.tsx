"use client";

import { useMemo } from "react";
import { Card, CardHeader } from "@/components/Card";
import { Sparkbars } from "@/components/Sparkbars";
import { getCompetition, COMPETITIONS } from "@/lib/competitions";
import { relativeTime, scoreColor } from "@/lib/format";
import {
  MiniStat,
  LB_TH,
  LB_TD,
  SORTED_COMPETITIONS,
  formatDate,
  memberName,
  roleBadgeStyle,
  exportSignupsCSV,
  exportRegionalCSV,
  exportRosterCSV,
} from "./chapterHelpers";
import type { ChapterController } from "./useChapterData";

// Advisor-only chapter sections: invite/share, assignments (create + completion
// board), chapter stats, leaderboard, member roster (+ CSV exports), and the
// recent-activity feed. Extracted from app/app/chapter/page.tsx (issue #47).

export function AdvisorView({ c }: { c: ChapterController }) {
  const { isAdvisor, hasChapter, chapter, board, stats, members, activity } = c;
  const qrSrc = useMemo(
    () => `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&data=${encodeURIComponent(c.joinLink)}`,
    [c.joinLink]
  );
  if (!isAdvisor || !hasChapter) return null;

  return (
    <>
      {/* ── SHARE / INVITE (advisor) ── */}
      {chapter && (
        <Card>
          <CardHeader eyebrow="Grow your chapter" title="Invite your members" tagline="Share one link. Members open it, sign up, and they're in your chapter automatically - no code to type." />
          <div className="invite-share" style={{ display: "flex", gap: 24, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: "1 1 280px", minWidth: 0 }}>
              <p className="font-mono" style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: 7 }}>Invite link</p>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input readOnly value={c.joinLink} onFocus={(e) => e.currentTarget.select()} className="input-field" style={{ flex: 1, fontSize: 13, minWidth: 0 }} aria-label="Chapter invite link" />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button type="button" onClick={c.copyJoinLink} className="btn btn-accent btn-sm btn-pill" style={{ minWidth: 110 }}>
                  {c.copiedLink ? "Copied!" : "Copy link"}
                </button>
                <button type="button" onClick={c.shareJoinLink} className="btn btn-ghost btn-sm btn-pill">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>
                  Share
                </button>
              </div>
              <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 12, lineHeight: 1.5 }}>
                Prefer a code? Share <span className="font-mono" style={{ color: "var(--accent)", fontWeight: 700 }}>{chapter.invite_code}</span> and have members enter it on their Chapter page.
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              {/* White plate is intentional and theme-independent: a QR code needs a
                light quiet zone to scan reliably (dark mode would break scanning). */}
            <div style={{ padding: 10, background: "#fff", borderRadius: 12, border: "0.5px solid var(--border)", display: "inline-block" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrSrc}
                  alt="Chapter invite QR code"
                  width={150}
                  height={150}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 8 }}>Scan to join</p>
            </div>
          </div>
          <style>{`@media (max-width:640px){ .invite-share { flex-direction: column; align-items: stretch; } }`}</style>
        </Card>
      )}

      {/* ── ASSIGNMENTS (advisor) ── */}
      <Card>
        <CardHeader
          eyebrow="Assignments"
          title="Set goals for your chapter"
          tagline="Assign practice targets and watch completion update as members practice."
          right={
            <button type="button" onClick={() => c.setShowAsgForm((v) => !v)} className="btn btn-accent btn-sm btn-pill cta-shimmer">
              {c.showAsgForm ? "Close" : "New assignment"}
            </button>
          }
        />

        {c.showAsgForm && (
          <form onSubmit={c.handleCreateAssignment} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14, marginBottom: 18, padding: 16, background: "var(--bg2)", border: "0.5px solid var(--border)", borderRadius: 12 }}>
            <input className="input-field" placeholder="Title, e.g. Warm up for Accounting" value={c.asgTitle} onChange={(e) => c.setAsgTitle(e.target.value)} maxLength={80} />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <select className="input-field" value={c.asgEvent} onChange={(e) => c.setAsgEvent(e.target.value)} style={{ flex: "1 1 200px", cursor: "pointer" }}>
                <option value="">Any event</option>
                {SORTED_COMPETITIONS.map((cmp) => (
                  <option key={cmp.slug} value={cmp.slug}>{cmp.name}</option>
                ))}
              </select>
              <input className="input-field" type="number" min={1} max={100} value={c.asgTarget} onChange={(e) => c.setAsgTarget(Number(e.target.value))} style={{ width: 110 }} aria-label="Target practice tests" />
              <input className="input-field" type="date" value={c.asgDue} onChange={(e) => c.setAsgDue(e.target.value)} style={{ width: 160 }} aria-label="Due date" />
            </div>
            <p style={{ fontSize: 12, color: "var(--text3)" }}>Target = number of practice tests each member should log{c.asgEvent ? " for this event" : ""}.</p>
            {c.asgError && <p style={{ fontSize: 12, color: "var(--red)" }}>{c.asgError}</p>}
            <button type="submit" disabled={c.asgLoading || !c.asgTitle.trim()} className="btn btn-accent btn-sm btn-pill" style={{ alignSelf: "flex-start" }}>
              {c.asgLoading ? "Creating..." : "Assign to chapter"}
            </button>
          </form>
        )}

        {board.length === 0 ? (
          !c.showAsgForm && <p style={{ fontSize: 13.5, color: "var(--text3)", marginTop: 12 }}>No assignments yet. Create one to give your chapter a concrete weekly target.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
            {board.map((b) => {
              const ev = b.assignment.event_slug ? (COMPETITIONS.find((cmp) => cmp.slug === b.assignment.event_slug)?.name ?? b.assignment.event_slug) : "Any event";
              const pct = b.totalMembers ? Math.round((b.completedCount / b.totalMembers) * 100) : 0;
              return (
                <div key={b.assignment.id} style={{ padding: "14px 16px", border: "0.5px solid var(--border)", borderRadius: 12, background: "var(--bg2)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)" }}>{b.assignment.title}</p>
                      <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>
                        {ev} · {b.assignment.target_count} test{b.assignment.target_count !== 1 ? "s" : ""}{b.assignment.due_at ? ` · due ${formatDate(b.assignment.due_at)}` : ""}
                      </p>
                    </div>
                    <button type="button" onClick={() => c.handleDeleteAssignment(b.assignment.id)} aria-label="Delete assignment" style={{ fontSize: 12, color: "var(--text3)", cursor: "pointer", flexShrink: 0 }}>Remove</button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 999, background: "var(--bg3)", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", borderRadius: 999 }} />
                    </div>
                    <span className="font-mono" style={{ fontSize: 11, color: "var(--text2)", whiteSpace: "nowrap" }}>{b.completedCount}/{b.totalMembers} done</span>
                  </div>
                  {b.perMember.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                      {b.perMember.map((m) => (
                        <span key={m.id} className="font-mono" style={{ fontSize: 10.5, padding: "3px 8px", borderRadius: 6, fontWeight: 600, background: m.complete ? "rgba(var(--green-rgb),0.12)" : "var(--bg3)", color: m.complete ? "var(--green)" : "var(--text3)", border: `0.5px solid ${m.complete ? "rgba(var(--green-rgb),0.3)" : "var(--border)"}` }}>
                          {m.name} {m.done}/{b.assignment.target_count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── CHAPTER STATS ── */}
      {stats && (
        <Card>
          <CardHeader
            eyebrow="Advisor view"
            title="Chapter stats"
            tagline="Practice activity across your whole chapter."
          />
          <div
            className="chapter-stat-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }}
          >
            <MiniStat label="Practice tests" value={String(stats.totalTests)} sub="all-time" />
            <MiniStat label="Active this week" value={`${stats.activeThisWeek}/${stats.members.length}`} sub="members" />
            <MiniStat label="Chapter average" value={stats.chapterAvgPct != null ? `${stats.chapterAvgPct}%` : "-"} sub="across scored tests" />
            <MiniStat
              small
              label="Top event"
              value={stats.topEvents[0] ? (getCompetition(stats.topEvents[0].slug)?.name ?? stats.topEvents[0].slug) : "-"}
              sub={stats.topEvents[0] ? `${stats.topEvents[0].tests} test${stats.topEvents[0].tests !== 1 ? "s" : ""}` : "no data yet"}
            />
          </div>

          {stats.totalTests > 0 && (
            <div style={{ marginTop: 20, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: 10 }}>Practice tests per week</p>
                <Sparkbars
                  values={stats.weekly.map((w) => w.tests)}
                  variant="volume"
                  width={260}
                  height={48}
                  color="var(--brand)"
                  ariaLabel={`Practice tests per week for the last 8 weeks: ${stats.weekly.map((w) => w.tests).join(", ")}`}
                />
              </div>
              <p style={{ fontSize: 11, color: "var(--text3)", maxWidth: 220, lineHeight: 1.5 }}>
                Last 8 weeks. Taller bars mean more practice tests logged by your chapter that week.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* ── LEADERBOARD ── */}
      {stats && (
        <Card>
          <CardHeader
            eyebrow="Advisor view"
            title="Leaderboard"
            tagline="Ranked by practice tests logged, then average score."
          />
          {stats.members.every((m) => m.tests === 0) ? (
            <div className="empty-state" style={{ marginTop: 12 }}>
              <div className="empty-state-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <rect x="7" y="12" width="3" height="6" />
                  <rect x="12" y="8" width="3" height="10" />
                  <rect x="17" y="5" width="3" height="13" />
                </svg>
              </div>
              <p className="empty-state-title">No practice logged yet</p>
              <p className="empty-state-msg">Once members start taking AI practice tests, they will rank here automatically.</p>
            </div>
          ) : (
            <div style={{ marginTop: 16, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["#", "Member", "Tests", "Avg", "Best", "Last active"].map((h) => (
                      <th key={h} className="font-mono" style={LB_TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.members.map((m, i) => {
                    const rank = i + 1;
                    return (
                      <tr key={m.id} style={{ background: i % 2 === 0 ? "transparent" : "var(--bg2)" }}>
                        <td style={LB_TD}>
                          <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: rank === 1 ? "var(--accent)" : rank <= 3 ? "var(--text)" : "var(--text3)" }}>
                            {rank}
                          </span>
                        </td>
                        <td style={LB_TD}>
                          <span style={{ fontWeight: 600, color: "var(--text)" }}>{m.name}</span>
                          {m.role !== "member" && (
                            <span className="font-mono" style={{ marginLeft: 6, fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                              {m.role}
                            </span>
                          )}
                        </td>
                        <td style={LB_TD}>
                          <span className="font-mono" style={{ fontWeight: 700, color: m.tests > 0 ? "var(--text)" : "var(--text-muted)" }}>{m.tests}</span>
                        </td>
                        <td style={LB_TD}>
                          {m.avgPct != null
                            ? <span className="font-mono" style={{ fontWeight: 700, color: scoreColor(m.avgPct) }}>{m.avgPct}%</span>
                            : <span style={{ color: "var(--text-muted)" }}>-</span>}
                        </td>
                        <td style={LB_TD}>
                          {m.bestPct != null
                            ? <span className="font-mono">{m.bestPct}%</span>
                            : <span style={{ color: "var(--text-muted)" }}>-</span>}
                        </td>
                        <td style={LB_TD}>
                          <span style={{ fontSize: 11, color: "var(--text3)" }}>{m.lastActiveAt ? relativeTime(m.lastActiveAt) : "never"}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── ADVISOR DASHBOARD ── */}
      <Card>
        <CardHeader
          eyebrow="Advisor view"
          title="Member roster"
          tagline="Every member in your chapter and the events they are prepping for."
          right={
            members.length > 0 ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => exportRegionalCSV(members, chapter?.name ?? "chapter")}
                  className="btn btn-ghost btn-sm"
                  style={{ gap: 6, display: "flex", alignItems: "center" }}
                  title="Grouped by event, Last/First names - matches regional registration forms"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="M7 10l5 5 5-5" />
                    <path d="M12 15V3" />
                  </svg>
                  Regional CSV
                </button>
                <button
                  type="button"
                  onClick={() => exportSignupsCSV(members, chapter?.name ?? "chapter")}
                  className="btn btn-ghost btn-sm"
                  style={{ gap: 6, display: "flex", alignItems: "center" }}
                  title="One row per member per event, sorted by member"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="M7 10l5 5 5-5" />
                    <path d="M12 15V3" />
                  </svg>
                  Sign-ups CSV
                </button>
                <button
                  type="button"
                  onClick={() => exportRosterCSV(members, chapter?.name ?? "chapter")}
                  className="btn btn-ghost btn-sm"
                  style={{ gap: 6, display: "flex", alignItems: "center" }}
                  title="Full member roster"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="M7 10l5 5 5-5" />
                    <path d="M12 15V3" />
                  </svg>
                  Roster CSV
                </button>
              </div>
            ) : undefined
          }
        />
        {members.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 12 }}>
            <div className="empty-state-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <p className="empty-state-title">No members yet</p>
            <p className="empty-state-msg">
              Share the invite code <strong>{chapter?.invite_code}</strong> with your chapter members so they can join.
            </p>
          </div>
        ) : (
          <div style={{ marginTop: 16, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Member", "Role", "Events", "Registered for"].map((h) => (
                    <th
                      key={h}
                      className="font-mono"
                      style={{
                        textAlign: "left",
                        padding: "8px 12px",
                        fontSize: 9,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                        borderBottom: "0.5px solid var(--border)",
                        fontWeight: 700,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => (
                  <tr
                    key={m.id}
                    style={{ background: i % 2 === 0 ? "transparent" : "var(--bg2)" }}
                  >
                    <td style={{ padding: "12px 12px", verticalAlign: "top" }}>
                      <p style={{ fontWeight: 600, color: "var(--text)" }}>{memberName(m)}</p>
                      {m.email && <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{m.email}</p>}
                    </td>
                    <td style={{ padding: "12px 12px", verticalAlign: "top" }}>
                      <span
                        className="font-mono"
                        style={{
                          fontSize: 9,
                          padding: "3px 8px",
                          borderRadius: 999,
                          fontWeight: 700,
                          ...roleBadgeStyle(m.role),
                        }}
                      >
                        {m.role}
                      </span>
                    </td>
                    <td style={{ padding: "12px 12px", verticalAlign: "top" }}>
                      <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: m.registrations.length > 0 ? "var(--text)" : "var(--text-muted)" }}>
                        {m.registrations.length}
                      </span>
                    </td>
                    <td style={{ padding: "12px 12px", verticalAlign: "top", maxWidth: 340 }}>
                      {m.registrations.length === 0 ? (
                        <span style={{ fontSize: 11, color: "var(--text3)" }}>None yet</span>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {m.registrations.slice(0, 4).map((slug) => {
                            const comp = getCompetition(slug);
                            return (
                              <span key={slug} className="chip" style={{ fontSize: 10, padding: "2px 8px" }}>
                                {comp?.name ?? slug}
                              </span>
                            );
                          })}
                          {m.registrations.length > 4 && (
                            <span className="chip" style={{ fontSize: 10, padding: "2px 8px", color: "var(--text3)" }}>
                              +{m.registrations.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── CHAPTER ACTIVITY FEED ── */}
      {activity.length > 0 && (
        <Card>
          <CardHeader
            eyebrow="Advisor view"
            title="Recent practice activity"
            tagline="Latest practice sessions logged by your chapter members."
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 14 }}>
            {activity.map((item) => {
              const comp = getCompetition(item.competitionSlug);
              const pct = item.score != null && item.outOf != null && item.outOf > 0
                ? Math.round((item.score / item.outOf) * 100)
                : null;
              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                        {item.memberName ?? item.memberEmail?.split("@")[0] ?? "Member"}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--text3)" }}>
                        practiced {comp?.name ?? item.competitionSlug}
                      </span>
                    </div>
                  </div>
                  {pct != null && (
                    <span
                      className="font-mono"
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: pct >= 80 ? "var(--green)" : pct >= 60 ? "var(--accent)" : "var(--red)",
                        flexShrink: 0,
                      }}
                    >
                      {pct}%
                    </span>
                  )}
                  <span className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0 }}>
                    {relativeTime(item.loggedAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </>
  );
}
