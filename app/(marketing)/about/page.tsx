import type { Metadata } from "next";
import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { HeroBadge } from "@/components/HeroBadge";
import { SectionHeader } from "@/components/SectionHeader";
import { Card } from "@/components/Card";

export const metadata: Metadata = {
  title: "About",
  description:
    "FBLA One is built by a Competition Chair for his own chapter -- and now every chapter nationally. Here's the story.",
};

export default function About() {
  return (
    <>
      <section style={{ padding: "100px 0 60px" }}>
        <div className="container" style={{ maxWidth: 820, marginInline: "auto" }}>
          <ScrollReveal>
            <HeroBadge>Built for chapters. By a chapter.</HeroBadge>
          </ScrollReveal>
          <ScrollReveal delay={0.05}>
            <h1 style={{ marginTop: 22, textAlign: "center" }}>
              Built by a Competition Chair,{" "}
              <span style={{ color: "var(--accent)" }}>for his chapter.</span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <p
              style={{
                marginTop: 22,
                fontSize: 17,
                color: "var(--text2)",
                lineHeight: 1.7,
                textAlign: "center",
                maxWidth: 660,
                marginInline: "auto",
              }}
            >
              Now available to every FBLA chapter nationally. Free for every
              student, every advisor, forever.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section style={{ padding: "40px 0 80px" }}>
        <div className="container" style={{ maxWidth: 760, marginInline: "auto" }}>
          <ScrollReveal>
            <Card>
              <h2 style={{ fontSize: 22, marginBottom: 14, letterSpacing: "-0.015em" }}>
                The problem every chapter has
              </h2>
              <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7 }}>
                I'm Vinay Batra, a sophomore at Council Rock High School South.
                I'm the Competition Chair of our FBLA chapter.
              </p>
              <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7, marginTop: 14 }}>
                Every year, our chapter runs the same broken process: members
                sign up for competitions in a Google Form, the list gets copied
                into a spreadsheet, study resources get dumped into a Drive
                folder nobody can find, and come regionals week, half the team
                doesn't know what their test covers or what topics to study.
              </p>
              <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7, marginTop: 14 }}>
                I asked advisors at other chapters. Same problem. 230,000 FBLA
                members nationally, and most chapters run on a spreadsheet and
                a shared folder.
              </p>
            </Card>
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <div style={{ marginTop: 24 }}>
              <Card>
                <h2 style={{ fontSize: 22, marginBottom: 14, letterSpacing: "-0.015em" }}>
                  What FBLA One actually is
                </h2>
                <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7 }}>
                  FBLA One gives advisors and members a real platform instead of
                  a patchwork of Drive folders and spreadsheets.
                </p>
                <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7, marginTop: 14 }}>
                  For members: a full prep page for every competition (test
                  format, topics, curated resources), AI-powered practice tests
                  that generate 100 questions calibrated to the real FBLA exam,
                  a personal score tracker, and a deadline calendar.
                </p>
                <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7, marginTop: 14 }}>
                  For advisors: a member roster showing who signed up for what,
                  recent practice activity, and CSV exports for regional sign-up
                  forms. Built on top of the member tools so everything stays in
                  one place.
                </p>
                <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7, marginTop: 14 }}>
                  The pilot is at Council Rock South, presenting at our officer
                  meeting on August 25, 2026. After that, it's open to any
                  chapter in the country.
                </p>
              </Card>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section style={{ padding: "80px 0" }}>
        <div className="container">
          <SectionHeader
            eyebrow="What we believe"
            title="Three principles."
            tagline="The product opinions baked into every screen."
          />

          <div
            className="principles-grid"
            style={{
              marginTop: 48,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
              maxWidth: 1080,
              marginInline: "auto",
            }}
          >
            {[
              {
                title: "Free for every chapter, forever.",
                body: "No student or advisor should have to pay to compete better in FBLA. FBLA One is and will remain free. No paid plans, no per-seat fees, no student data sold.",
              },
              {
                title: "AI that actually knows FBLA.",
                body: "The practice test generator is built on top of each competition's exact topic outline. Claude writes questions calibrated to the real FBLA test - not generic business trivia. Wrong-answer explanations are included for every question.",
              },
              {
                title: "Advisor buy-in built in.",
                body: "The member-facing tools are useful day one. The advisor layer (roster, activity feed, exports) is what makes a chapter actually adopt it. Both are first-class features.",
              },
            ].map((p, i) => (
              <ScrollReveal key={p.title} delay={i * 0.06}>
                <Card style={{ height: "100%" }}>
                  <div
                    className="font-mono"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.22em",
                      color: "var(--accent)",
                      fontWeight: 700,
                    }}
                  >
                    {`0${i + 1}`}
                  </div>
                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      letterSpacing: "-0.01em",
                      marginTop: 14,
                      marginBottom: 10,
                    }}
                  >
                    {p.title}
                  </h3>
                  <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.65 }}>
                    {p.body}
                  </p>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .principles-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>

      <section style={{ padding: "60px 0 80px" }}>
        <div
          className="container"
          style={{ maxWidth: 720, marginInline: "auto", textAlign: "center" }}
        >
          <ScrollReveal>
            <p style={{ fontSize: 16, color: "var(--text2)", lineHeight: 1.65 }}>
              Advisor at a chapter you want to bring onto FBLA One? Member who
              wants to loop in your advisor?
            </p>
            <div
              style={{
                marginTop: 22,
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link href="mailto:hello@fbla.one" className="btn btn-accent btn-pill">
                Get in touch
              </Link>
              <Link
                href="/api/preview?redirect=/app"
                className="btn btn-ghost btn-pill"
              >
                Preview the platform
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
