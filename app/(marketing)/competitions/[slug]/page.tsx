import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Card } from "@/components/Card";
import { RegisterButton } from "@/components/RegisterButton";
import { COMPETITIONS, FORMAT_LABEL, getCompetition } from "@/lib/competitions";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return COMPETITIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = getCompetition(slug);
  if (!c) return { title: "Competition not found" };
  return {
    title: c.name,
    description: c.description,
    alternates: { canonical: `/competitions/${c.slug}` },
    openGraph: {
      title: `${c.name} · FBLA One`,
      description: c.description,
    },
  };
}

export default async function CompetitionDetail({ params }: Props) {
  const { slug } = await params;
  const c = getCompetition(slug);
  if (!c) return notFound();

  // Find related competitions (same category, excluding self)
  const related = COMPETITIONS
    .filter((x) => x.category === c.category && x.slug !== c.slug && x.contentStatus !== "coming-soon")
    .slice(0, 3);

  const isSoon = c.contentStatus === "coming-soon";
  const isObjectiveTest =
    c.format === "objective-test" ||
    c.format === "objective-and-presentation" ||
    c.format === "team-test";

  return (
    <>
      {/* HERO */}
      <section
        style={{
          position: "relative",
          padding: "60px 0 40px",
          background:
            "radial-gradient(55% 65% at 18% 30%, rgba(var(--brand-rgb), 0.22) 0%, rgba(var(--brand-rgb), 0.07) 35%, transparent 65%)",
        }}
      >
        <div className="container" style={{ position: "relative" }}>
          <Link
            href="/competitions"
            className="font-mono"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              letterSpacing: "0.14em",
              color: "var(--text3)",
              textTransform: "uppercase",
              fontWeight: 700,
              marginBottom: 24,
              transition: "color 0.15s ease",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            All competitions
          </Link>

          <div style={{ maxWidth: 820 }}>
            <ScrollReveal>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                <span className="chip chip-brand">{c.category}</span>
                <span className="chip">{FORMAT_LABEL[c.format]}</span>
                {c.isTeam && <span className="chip">Team Event</span>}
                {c.popular && <span className="chip chip-accent">Popular</span>}
                {isSoon && <span className="chip">Coming Soon</span>}
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.05}>
              <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", letterSpacing: "-0.025em" }}>{c.name}</h1>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <p
                style={{
                  marginTop: 20,
                  fontSize: 18,
                  color: "var(--text2)",
                  lineHeight: 1.6,
                  maxWidth: 720,
                }}
              >
                {c.description}
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.16}>
              <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
                {!isSoon && <RegisterButton slug={c.slug} name={c.name} />}
                {c.contentStatus === "complete" &&
                  (c.format === "objective-test" ||
                    c.format === "objective-and-presentation" ||
                    c.format === "team-test") && (
                  <Link
                    href={`/app/coach?slug=${c.slug}`}
                    className="btn btn-brand btn-pill"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3L13.5 8.5H19L14.5 11.5L16 17L12 14L8 17L9.5 11.5L5 8.5H10.5L12 3Z" />
                    </svg>
                    AI Practice Test
                  </Link>
                )}
                {c.rubricUrl && (
                  <a
                    href={c.rubricUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-pill"
                  >
                    Official rubric
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <path d="M15 3h6v6" />
                      <path d="M10 14L21 3" />
                    </svg>
                  </a>
                )}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section style={{ padding: "40px 0 80px" }}>
        <div className="container">
          <div
            className="detail-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 320px",
              gap: 32,
              alignItems: "start",
            }}
          >
            <article style={{ minWidth: 0 }}>
              {isSoon ? (
                <ComingSoonNotice />
              ) : (
                <>
                  {c.longDescription && (
                    <Card>
                      <h2 style={{ fontSize: 20, marginBottom: 14, letterSpacing: "-0.01em" }}>
                        About this event
                      </h2>
                      <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.75 }}>
                        {c.longDescription}
                      </p>
                    </Card>
                  )}

                  {isObjectiveTest && !isSoon && (
                    <Card style={{ marginTop: 20, marginBottom: 0 }}>
                      <div style={{ marginBottom: 18 }}>
                        <p className="eyebrow" style={{ marginBottom: 6 }}>Test day</p>
                        <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em" }}>What to expect</h2>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {[
                          {
                            icon: (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 6v6l4 2" />
                              </svg>
                            ),
                            title: c.format === "team-test"
                              ? "Two-part event: written test + live demonstration"
                              : "60 minutes, 100 questions",
                            body: c.format === "team-test"
                              ? "The written test (30 questions) covers parliamentary procedure knowledge. The live demonstration requires your team to conduct a mock meeting using proper Robert's Rules of Order procedure."
                              : "You have 60 minutes to answer 100 multiple-choice questions. Each question has four options (A, B, C, D) with exactly one correct answer. There is no penalty for wrong answers -- always fill in your best guess.",
                          },
                          {
                            icon: (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 11l3 3L22 4" />
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                              </svg>
                            ),
                            title: "Computer-graded, instant results",
                            body: "Tests are machine-scored. Questions are drawn from the official FBLA topic outline for this event, distributed proportionally across all topic areas. Expect a mix of recall (definitions, formulas), application (scenario-based), and analysis questions.",
                          },
                          {
                            icon: (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                              </svg>
                            ),
                            title: "Top scorers advance",
                            body: "The highest-scoring competitors at each regional advance to the state competition. State winners compete at the National Leadership Conference (NLC). Study the official FBLA topic outline -- it lists the exact subject areas and their approximate weight on the test.",
                          },
                        ].map(({ icon, title, body }) => (
                          <div key={title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                            <div style={{ flexShrink: 0, marginTop: 2 }}>{icon}</div>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{title}</p>
                              <p style={{ fontSize: 13.5, color: "var(--text2)", lineHeight: 1.65 }}>{body}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {c.topics && c.topics.length > 0 && (
                    <Card style={{ marginTop: 20 }}>
                      <h2 style={{ fontSize: 20, marginBottom: 14, letterSpacing: "-0.01em" }}>
                        What's on the test
                      </h2>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {c.topics.map((t) => (
                          <span
                            key={t}
                            style={{
                              fontFamily: "var(--font-body)",
                              fontSize: 13,
                              fontWeight: 500,
                              color: "var(--text)",
                              padding: "7px 14px",
                              borderRadius: 999,
                              background: "var(--bg3)",
                              border: "0.5px solid var(--border)",
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </Card>
                  )}

                  {c.studyResources && c.studyResources.length > 0 && (
                    <Card style={{ marginTop: 20 }}>
                      <h2 style={{ fontSize: 20, marginBottom: 16, letterSpacing: "-0.01em" }}>
                        Study resources
                      </h2>
                      <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 18 }}>
                        Curated by FBLA One. Free unless noted. External links open in a new tab.
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {c.studyResources.map((r) => (
                          <a
                            key={r.url}
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="resource-link"
                          >
                            <span
                              className="font-mono"
                              style={{
                                flexShrink: 0,
                                fontSize: 9,
                                letterSpacing: "0.14em",
                                color: "var(--accent)",
                                fontWeight: 700,
                                padding: "5px 9px",
                                borderRadius: 6,
                                background: "var(--accent-dim)",
                                border: "0.5px solid var(--accent-border)",
                                textTransform: "uppercase",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {r.kind}
                            </span>
                            <span style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                                {r.title}
                              </span>
                              {r.note && (
                                <span style={{ display: "block", fontSize: 12, color: "var(--text3)", marginTop: 3 }}>
                                  {r.note}
                                </span>
                              )}
                            </span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <path d="M15 3h6v6" />
                              <path d="M10 14L21 3" />
                            </svg>
                          </a>
                        ))}
                      </div>
                    </Card>
                  )}
                </>
              )}
            </article>

            {/* Sidebar */}
            <aside style={{ position: "sticky", top: 96 }}>
              {isObjectiveTest && !isSoon && c.contentStatus === "complete" && (
                <Link
                  href={`/app/coach?slug=${c.slug}`}
                  className="btn btn-accent btn-pill cta-shimmer"
                  style={{ width: "100%", justifyContent: "center", display: "flex", gap: 8, marginBottom: 16 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3L13.5 8.5H19L14.5 11.5L16 17L12 14L8 17L9.5 11.5L5 8.5H10.5L12 3Z" />
                  </svg>
                  Generate AI practice test
                </Link>
              )}

              {isObjectiveTest && !isSoon && (
                <div style={{ background: "var(--card-bg)", border: "0.5px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                  <p className="eyebrow" style={{ marginBottom: 14 }}>Test format</p>

                  {[
                    {
                      label: "Time limit",
                      value: c.format === "team-test" ? "30 min (test) + 10 min demo" : "60 minutes",
                    },
                    {
                      label: "Questions",
                      value: c.format === "team-test" ? "30 questions + live demo" : "100 multiple choice",
                    },
                    {
                      label: "Options",
                      value: "A, B, C, D -- one correct",
                    },
                    {
                      label: "Guessing",
                      value: "No penalty -- always answer",
                    },
                    {
                      label: c.isTeam ? "Team size" : "Individual",
                      value: c.isTeam ? "Varies by event" : "Solo event",
                    },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: "0.5px solid var(--border-dim)" }}>
                      <span style={{ fontSize: 12, color: "var(--text3)" }}>{label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", textAlign: "right" }}>{value}</span>
                    </div>
                  ))}

                  <div style={{ marginTop: 14 }}>
                    <p style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8 }}>Competition levels</p>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {["Regional", "State", "NLC"].map((level, i) => (
                        <span key={level} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)" }}>{level}</span>
                          {i < 2 && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round">
                              <path d="M5 12h14M13 5l7 7-7 7" />
                            </svg>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <Card>
                <p className="eyebrow" style={{ marginBottom: 14 }}>At a glance</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Fact label="Format" value={FORMAT_LABEL[c.format]} />
                  {c.duration && <Fact label="Duration" value={c.duration} />}
                  <Fact label="Solo or team" value={c.isTeam ? "Team event" : "Individual"} />
                  <Fact label="Category" value={c.category} />
                </div>
              </Card>

              {related.length > 0 && (
                <Card style={{ marginTop: 16 }}>
                  <p className="eyebrow" style={{ marginBottom: 14 }}>Related events</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {related.map((r) => (
                      <Link key={r.slug} href={`/competitions/${r.slug}`} className="related-link">
                        {r.name}
                      </Link>
                    ))}
                  </div>
                </Card>
              )}
            </aside>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .detail-grid { grid-template-columns: 1fr !important; }
            .detail-grid aside { position: static !important; }
          }
        `}</style>
      </section>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        className="font-mono"
        style={{
          fontSize: 9,
          letterSpacing: "0.18em",
          color: "var(--text3)",
          textTransform: "uppercase",
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{value}</p>
    </div>
  );
}

function ComingSoonNotice() {
  return (
    <Card>
      <div className="empty-state" style={{ padding: 0 }}>
        <div className="empty-state-icon" style={{ fontSize: 26 }}>!</div>
        <p className="empty-state-title">Full prep page coming soon</p>
        <p className="empty-state-msg">
          This event uses a year-specific prompt or topic that hasn't dropped yet. We'll publish
          the full prep page (rubric breakdown, scoring strategy, past topic patterns) as soon as
          the materials are out. The event link to the official FBLA rubric is in the header.
        </p>
      </div>
    </Card>
  );
}
