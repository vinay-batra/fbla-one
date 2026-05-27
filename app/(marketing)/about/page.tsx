import type { Metadata } from "next";
import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { HeroBadge } from "@/components/HeroBadge";
import { SectionHeader } from "@/components/SectionHeader";
import { Card } from "@/components/Card";

export const metadata: Metadata = {
  title: "About",
  description: "FBLA One is built by an FBLA student for FBLA students. Here's the story.",
};

export default function About() {
  return (
    <>
      <section style={{ padding: "100px 0 60px" }}>
        <div className="container" style={{ maxWidth: 820, marginInline: "auto" }}>
          <ScrollReveal>
            <HeroBadge>The story</HeroBadge>
          </ScrollReveal>
          <ScrollReveal delay={0.05}>
            <h1 style={{ marginTop: 22, textAlign: "center" }}>
              Built for FBLA students,{" "}
              <span style={{ color: "var(--accent)" }}>by an FBLA student.</span>
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
              }}
            >
              FBLA One started as a Google Drive folder. It got out of hand. Now
              it's a real platform.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section style={{ padding: "40px 0 80px" }}>
        <div className="container" style={{ maxWidth: 760, marginInline: "auto" }}>
          <ScrollReveal>
            <Card>
              <h2 style={{ fontSize: 22, marginBottom: 14, letterSpacing: "-0.015em" }}>
                The origin
              </h2>
              <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7 }}>
                I'm Vinay Batra, a sophomore at Council Rock High School South and
                the Competition Chair of our FBLA chapter. Every year our chapter has
                the same problem: members sign up for events but no one really knows
                what each event is about, what the test covers, or where to find good
                study resources. The information lives in scattered PDFs, last
                year's Drive folder, and the memories of seniors who are about to
                graduate.
              </p>
              <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7, marginTop: 14 }}>
                The original plan for FBLA officer meeting on August 25, 2026 was
                modest: build a shared Drive folder with a doc per competition. But a
                Drive folder doesn't track who's preparing, doesn't remind anyone of
                deadlines, and doesn't scale to other chapters. So I'm building this
                instead.
              </p>
            </Card>
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <div style={{ marginTop: 24 }}>
              <Card>
                <h2 style={{ fontSize: 22, marginBottom: 14, letterSpacing: "-0.015em" }}>
                  The plan
                </h2>
                <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7 }}>
                  Pilot at Council Rock South this year. Use it ourselves. Find what
                  breaks. Get advisor buy-in. Then open it up to other chapters
                  nationally. There are 230,000+ FBLA members across the country —
                  every chapter has the same problem we did.
                </p>
                <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7, marginTop: 14 }}>
                  FBLA One is free for every student and every chapter, forever.
                  No paywall, no per-seat creep, no dark patterns, no selling
                  student data. Just a tool that makes competing in FBLA easier.
                </p>
              </Card>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section style={{ padding: "80px 0" }}>
        <div className="container">
          <SectionHeader
            eyebrow="What I believe"
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
                title: "Free for everyone, forever.",
                body: "No student or chapter should have to pay to compete in FBLA. The platform stays free. Always.",
              },
              {
                title: "No fluff. No filler content.",
                body: "Every page should be one a real student would open before regionals. If it's not useful, it doesn't ship.",
              },
              {
                title: "Built in public, fast.",
                body: "Solo build, deploying continuously, getting feedback from real users at CRHS South. No corporate roadmap, no quarterly planning - just ship and learn.",
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
                  <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", marginTop: 14, marginBottom: 10 }}>
                    {p.title}
                  </h3>
                  <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.65 }}>{p.body}</p>
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
        <div className="container" style={{ maxWidth: 720, marginInline: "auto", textAlign: "center" }}>
          <ScrollReveal>
            <p style={{ fontSize: 16, color: "var(--text2)", lineHeight: 1.65 }}>
              Questions, ideas, or want to bring FBLA One to your chapter?
            </p>
            <div style={{ marginTop: 22, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="mailto:hello@fbla.one" className="btn btn-accent btn-pill">
                Get in touch
              </Link>
              <Link href="/auth" className="btn btn-ghost btn-pill">
                Try FBLA One
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
