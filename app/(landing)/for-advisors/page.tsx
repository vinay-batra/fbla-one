import type { Metadata } from "next";
import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { PenUnderline } from "@/components/PenUnderline";
import { AdvisorVisual } from "@/components/landing/ForAdvisors";
import { AdvisorCta } from "@/components/landing/AdvisorCta";
import { JumpLink } from "@/components/landing/JumpLink";

const TITLE = "For FBLA advisors";
const DESCRIPTION =
  "Create a chapter, bring members in with one link, assign practice, run a live mock regionals, and see who is ready. Free for every chapter.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/for-advisors" },
  openGraph: {
    title: `${TITLE} · ChapterPrep`,
    description: DESCRIPTION,
    url: "/for-advisors",
    siteName: "ChapterPrep",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ChapterPrep" }],
  },
};

/**
 * How an advisor sets up and runs a chapter, in the order they would do it.
 * Every step describes a screen that exists today (components/chapter/ and
 * components/mock/); keep it that way when features change.
 */
const STEPS: { title: string; body: string }[] = [
  {
    title: "Create your chapter.",
    body: "Sign up as an advisor and give your chapter a name. You get an invite link and a QR code right away.",
  },
  {
    title: "Bring your members in.",
    body: "Share the link or put the QR code on the board. Members sign up and land in your chapter automatically, with no code to type.",
  },
  {
    title: "Assign practice.",
    body: "Set a goal like five Accounting tests by Friday, and see at a glance who has done it.",
  },
  {
    title: "Run a mock regionals.",
    body: "Put one test on the projector and everyone joins from their phone, like Kahoot, on the same clock. When you call time, you see the podium and the question that stumped the most people.",
  },
  {
    title: "See who is ready.",
    body: "The readiness report marks each member Ready, On track or Needs attention, with the topics they miss most.",
  },
  {
    title: "Handle the paperwork.",
    body: "Share one deadline calendar with the whole chapter, and export your roster grouped by event with last and first names, the way regional registration asks for it.",
  },
];

const QUESTIONS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Does it cost anything?",
    a: "No. ChapterPrep is free for every chapter and every student, and it will stay free.",
  },
  {
    q: "Do my students need accounts?",
    a: "Yes, a free one. That is how their practice saves across devices and shows up on your readiness report.",
  },
  {
    q: "Is this run by FBLA?",
    a: "No. ChapterPrep is an independent project built by an FBLA member. It is not affiliated with or endorsed by FBLA.",
  },
  {
    q: "What happens to student data?",
    a: (
      <>
        Their advisor sees their practice results; other members only see practice counts on the
        chapter leaderboard. Data is never sold or shared with advertisers. The{" "}
        <Link href="/privacy">privacy policy</Link> has the details.
      </>
    ),
  },
];

export default function ForAdvisorsPage() {
  return (
    <>
      <section className="ed-hero">
        <div className="container ed-hero-grid">
          <div className="ed-hero-copy">
            <div className="rise">
              <p className="ed-kicker">For advisors</p>
            </div>
            <div className="rise rise-1">
              <h1 className="ed-display">
                Run your whole chapter&apos;s prep <PenUnderline delay={0.65}>from one place.</PenUnderline>
              </h1>
            </div>
            <div className="rise rise-2">
              <p className="ed-lede">
                Create a chapter in a minute, bring members in with one link, and see who is ready for
                regionals before you get there. Free for every chapter.
              </p>
            </div>
            <div className="rise rise-3">
              <div className="ed-actions">
                <AdvisorCta className="ed-btn">Create your chapter</AdvisorCta>
                <JumpLink to="how-it-works">
                  <span className="ed-textlink ed-textlink-plain">
                    <span className="ed-textlink-label">How it works</span> <span aria-hidden="true">↓</span>
                  </span>
                </JumpLink>
              </div>
            </div>
          </div>
          <div className="rise rise-4">
            <AdvisorVisual active />
          </div>
        </div>
      </section>

      <section className="ed-section ed-steps-section" id="how-it-works">
        <div className="container">
          <ScrollReveal>
            <div className="ed-section-head ed-section-head-wide">
              <p className="ed-kicker">How it works</p>
              <h2 className="ed-h2">Six steps, start to regionals.</h2>
            </div>
          </ScrollReveal>
          <ol className="ed-steps">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <ScrollReveal delay={Math.min(i, 3) * 0.04}>
                  <div className="ed-step">
                    <span className="ed-step-n" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="ed-step-title">{s.title}</h3>
                      <p className="ed-step-body">{s.body}</p>
                    </div>
                  </div>
                </ScrollReveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="ed-section ed-advisor-faq">
        <div className="container">
          <ScrollReveal>
            <div className="ed-section-head ed-section-head-wide">
              <p className="ed-kicker">Questions</p>
              <h2 className="ed-h2">What advisors ask us.</h2>
            </div>
          </ScrollReveal>
          <dl className="ed-qa">
            {QUESTIONS.map((x) => (
              <div key={x.q}>
                <dt>{x.q}</dt>
                <dd>{x.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="ed-close">
        <div className="container">
          <ScrollReveal>
            <div className="ed-close-inner">
              <h2 className="ed-display ed-display-close">Set it up before regionals.</h2>
              <p className="ed-lede ed-lede-center">It takes about a minute, and your members can join tonight.</p>
              <div className="ed-close-actions">
                <AdvisorCta className="ed-btn">Create your chapter</AdvisorCta>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
