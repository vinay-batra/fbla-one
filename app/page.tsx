import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";

export default function Landing() {
  return (
    <>
      <PublicNav />
      <main>
        {/* Hero */}
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            padding: "110px 0 130px",
          }}
        >
          <div
            className="bg-orb"
            style={{
              width: 540,
              height: 540,
              background: "var(--brand)",
              top: -180,
              left: -180,
              opacity: 0.35,
            }}
          />
          <div
            className="bg-orb"
            style={{
              width: 420,
              height: 420,
              background: "var(--accent)",
              bottom: -120,
              right: -120,
              opacity: 0.22,
            }}
          />

          <div
            className="container"
            style={{
              position: "relative",
              textAlign: "center",
              maxWidth: 900,
            }}
          >
            <Reveal>
              <p className="eyebrow" style={{ marginBottom: 20 }}>
                For FBLA Chapters
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <h1>
                Everything your FBLA chapter needs,{" "}
                <span style={{ color: "var(--accent)" }}>in one place.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p
                style={{
                  fontSize: 19,
                  marginTop: 24,
                  maxWidth: 640,
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                Competition guides, study resources, prep tracker, deadline
                calendar, advisor dashboard. Built so your chapter can stop
                juggling spreadsheets and start winning.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  justifyContent: "center",
                  marginTop: 40,
                  flexWrap: "wrap",
                }}
              >
                <Link href="/auth" className="btn btn-accent btn-lg">
                  Get started
                </Link>
                <Link href="/competitions" className="btn btn-ghost btn-lg">
                  Browse competitions
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Feature grid */}
        <section style={{ padding: "60px 0" }}>
          <div className="container">
            <Reveal>
              <div style={{ textAlign: "center", marginBottom: 56 }}>
                <p className="eyebrow" style={{ marginBottom: 12 }}>
                  What&apos;s inside
                </p>
                <h2>Three things, done right.</h2>
              </div>
            </Reveal>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 20,
              }}
            >
              <Feature
                eyebrow="01"
                title="Competition Guides"
                body="A page for every FBLA event. What it is, what's on the test, study resources, rubric — all in one place. No more digging through old Drive folders."
                delay={0.05}
              />
              <Feature
                eyebrow="02"
                title="Prep Tracker"
                body="Log practice tests, track scores, save study resources. See your progress over time. Know exactly where you stand before competition."
                delay={0.1}
              />
              <Feature
                eyebrow="03"
                title="Chapter Management"
                body="Sign up for competitions, track deadlines, get reminders. Advisors see who's signed up for what at a glance."
                delay={0.15}
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "80px 0 120px" }}>
          <div className="container">
            <Reveal>
              <div
                className="card"
                style={{
                  textAlign: "center",
                  padding: "56px 32px",
                  background: "var(--card-bg)",
                  border: "1px solid var(--accent-border)",
                }}
              >
                <p className="eyebrow" style={{ marginBottom: 14 }}>
                  Ready?
                </p>
                <h2>Get your chapter on FBLA One.</h2>
                <p
                  style={{
                    marginTop: 14,
                    maxWidth: 560,
                    marginLeft: "auto",
                    marginRight: "auto",
                  }}
                >
                  Free for chapters during the pilot. No setup, no spreadsheets.
                </p>
                <div style={{ marginTop: 28 }}>
                  <Link href="/auth" className="btn btn-accent btn-lg">
                    Sign up free
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Feature({
  eyebrow,
  title,
  body,
  delay,
}: {
  eyebrow: string;
  title: string;
  body: string;
  delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <div className="card card-hover" style={{ height: "100%" }}>
        <p className="eyebrow" style={{ marginBottom: 12 }}>
          {eyebrow}
        </p>
        <h3 style={{ marginBottom: 10 }}>{title}</h3>
        <p style={{ fontSize: 14 }}>{body}</p>
      </div>
    </Reveal>
  );
}
