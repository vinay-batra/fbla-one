import type { Metadata } from "next";
import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SectionHeader } from "@/components/SectionHeader";
import { HeroBadge } from "@/components/HeroBadge";
import { Card } from "@/components/Card";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free for FBLA students during the pilot. Chapter and District tiers coming soon.",
};

type Tier = {
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  cta: { label: string; href: string; variant: "accent" | "ghost" | "brand" };
  badge?: string;
  status?: string;
  highlight?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Student",
    price: "Free",
    cadence: "forever for students",
    tagline: "Everything an individual FBLA member needs to prep.",
    features: [
      "All competition guides + study resources",
      "Personal prep tracker (practice tests + scores)",
      "Save & organize resources per competition",
      "Deadline reminders for events you sign up for",
      "Light + dark mode, mobile-friendly",
    ],
    cta: { label: "Get started free", href: "/auth", variant: "accent" },
    status: "Live",
  },
  {
    name: "Chapter",
    price: "$29",
    cadence: "/ month, per chapter",
    tagline: "Run your whole chapter from one place. Built for advisors and officers.",
    features: [
      "Everything in Student, for every member",
      "Advisor dashboard — see who's signed up for what",
      "Member roster + role permissions (officer / member)",
      "Chapter-wide deadline calendar + email reminders",
      "Custom chapter announcements + study group rooms",
      "Export rosters + progress for regional sign-ups",
    ],
    cta: { label: "Join the waitlist", href: "/auth", variant: "brand" },
    badge: "Coming soon",
    status: "Waitlist members lock in $29/mo forever",
    highlight: true,
  },
  {
    name: "District",
    price: "Custom",
    cadence: "for state & district admins",
    tagline: "Multi-chapter analytics and reporting for district leadership.",
    features: [
      "Everything in Chapter, across all participating chapters",
      "District-wide leaderboards + cross-chapter analytics",
      "Single sign-on (Google Workspace + Microsoft)",
      "Custom branding + chapter onboarding",
      "Priority support + dedicated success contact",
      "Bulk export for state competitions",
    ],
    cta: { label: "Contact us", href: "mailto:hello@fbla.one", variant: "ghost" },
    badge: "Coming soon",
  },
];

export default function Pricing() {
  return (
    <>
      {/* HERO */}
      <section style={{ padding: "100px 0 60px", textAlign: "center" }}>
        <div className="container">
          <ScrollReveal>
            <HeroBadge>Pricing</HeroBadge>
          </ScrollReveal>
          <ScrollReveal delay={0.05}>
            <h1 style={{ marginTop: 22 }}>
              Free for students.{" "}
              <span style={{ color: "var(--accent)" }}>Honest pricing for chapters.</span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <p
              style={{
                fontSize: 17,
                color: "var(--text2)",
                maxWidth: 620,
                marginInline: "auto",
                marginTop: 18,
              }}
            >
              Student is free forever. Chapter is a flat fee per chapter, not per member. District
              is for state-level admins. No per-seat creep.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* TIERS */}
      <section style={{ padding: "40px 0 80px" }}>
        <div className="container">
          <div
            className="tier-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
              alignItems: "stretch",
              maxWidth: 1100,
              marginInline: "auto",
            }}
          >
            {TIERS.map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 0.06}>
                <div
                  style={{
                    position: "relative",
                    height: "100%",
                    background: "var(--card-bg)",
                    border: t.highlight ? "1px solid var(--accent-border)" : "0.5px solid var(--border)",
                    borderRadius: 16,
                    padding: "32px 26px",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: t.highlight ? "0 12px 40px rgba(var(--accent-rgb), 0.15)" : "var(--shadow-sm)",
                    transition: "transform 0.22s ease, box-shadow 0.22s ease",
                  }}
                >
                  {t.highlight && (
                    <div
                      style={{
                        position: "absolute",
                        top: -12,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "var(--accent)",
                        color: "#0b1a33",
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        padding: "5px 12px",
                        borderRadius: 999,
                        boxShadow: "0 6px 16px rgba(var(--accent-rgb), 0.4)",
                      }}
                    >
                      MOST POPULAR
                    </div>
                  )}
                  {t.badge && (
                    <span className="chip chip-brand" style={{ alignSelf: "flex-start", marginBottom: 14 }}>
                      {t.badge}
                    </span>
                  )}

                  <h3
                    className="font-display"
                    style={{
                      fontSize: 26,
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {t.name}
                  </h3>
                  <p style={{ marginTop: 6, fontSize: 13.5, color: "var(--text3)", lineHeight: 1.55 }}>
                    {t.tagline}
                  </p>

                  <div style={{ marginTop: 22, marginBottom: 4 }}>
                    <span
                      className="font-display"
                      style={{
                        fontSize: 44,
                        fontWeight: 700,
                        letterSpacing: "-0.03em",
                        color: t.highlight ? "var(--accent)" : "var(--text)",
                      }}
                    >
                      {t.price}
                    </span>
                    <span style={{ marginLeft: 6, fontSize: 13, color: "var(--text3)" }}>{t.cadence}</span>
                  </div>

                  {t.status && (
                    <p
                      className="font-mono"
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.14em",
                        color: t.highlight ? "var(--accent)" : "var(--text3)",
                        marginTop: 10,
                        textTransform: "uppercase",
                        fontWeight: 700,
                      }}
                    >
                      {t.status}
                    </p>
                  )}

                  <div
                    style={{
                      margin: "28px 0",
                      height: 1,
                      background: "var(--border)",
                    }}
                  />

                  <ul
                    style={{
                      listStyle: "none",
                      display: "flex",
                      flexDirection: "column",
                      gap: 11,
                      flex: 1,
                    }}
                  >
                    {t.features.map((f) => (
                      <li
                        key={f}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          fontSize: 13.5,
                          color: "var(--text2)",
                          lineHeight: 1.55,
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--accent)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ flexShrink: 0, marginTop: 2 }}
                        >
                          <path d="M5 12l5 5L20 7" />
                        </svg>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={t.cta.href}
                    className={`btn btn-${t.cta.variant} btn-pill ${t.cta.variant === "accent" ? "cta-shimmer" : ""}`}
                    style={{ marginTop: 28, width: "100%" }}
                  >
                    {t.cta.label}
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .tier-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>

      {/* FAQ TEASER */}
      <section style={{ padding: "60px 0 40px" }}>
        <div className="container">
          <SectionHeader eyebrow="Common questions" title="Quick answers." />

          <div
            style={{
              marginTop: 40,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
              maxWidth: 980,
              marginInline: "auto",
            }}
          >
            {[
              {
                q: "Is Student really free forever?",
                a: "Yes. The individual prep features stay free for FBLA members. Chapter and District tiers fund the platform.",
              },
              {
                q: "What does 'per chapter' mean?",
                a: "One flat fee covers every member of your chapter. Whether you have 15 members or 150, it's still $29/month.",
              },
              {
                q: "When do paid tiers launch?",
                a: "Targeting late 2026 after the pilot at CRHS South. Waitlist members lock in early pricing.",
              },
              {
                q: "Is this FBLA-affiliated?",
                a: "Not officially. Independent platform built by an FBLA student for FBLA students.",
              },
            ].map((f) => (
              <Card key={f.q} variant="hover">
                <h3 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 8 }}>
                  {f.q}
                </h3>
                <p style={{ fontSize: 13.5, color: "var(--text3)", lineHeight: 1.6 }}>{f.a}</p>
              </Card>
            ))}
          </div>

          <div style={{ marginTop: 32, textAlign: "center" }}>
            <Link href="/faq" className="btn btn-ghost btn-pill">
              See all FAQs
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
