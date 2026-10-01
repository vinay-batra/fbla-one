import type { Metadata } from "next";
import { HeroBadge } from "@/components/HeroBadge";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How ChapterPrep collects, uses and deletes your data: what we store, what your chapter advisor can see, what we never sell, and how to delete it.",
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  return (
    <section style={{ padding: "100px 0 80px" }}>
      <div className="container" style={{ maxWidth: 760, marginInline: "auto" }}>
        <HeroBadge>Last updated October 2, 2026</HeroBadge>
        <h1 style={{ marginTop: 18, marginBottom: 28 }}>Privacy <em>policy</em></h1>

        <Section title="What we collect">
          <p>When you sign up we collect your email address and display name, and, if you join one, your chapter. As you use ChapterPrep we store what you create: your event, practice test results (scores and the topics you got right or wrong), AI Judge rounds and their scores, questions you missed (so they can come back in later tests), saved resources, and anything you send through the feedback button. We use your IP address to enforce daily limits on the AI features and prevent abuse.</p>
        </Section>

        <Section title="Who can see it">
          <p>If you join a chapter, its advisor can see your event and your practice results, including scores, judge rounds and your weakest topics, on their readiness report. Other members only see practice counts on the chapter leaderboard, never your scores.</p>
        </Section>

        <Section title="How AI features work">
          <p>Practice tests, the answer check, the AI Judge and the chat assistant are powered by Anthropic (Claude). When you use them, the request is sent to Anthropic to produce a response, including anything you type or say for a judge round. Anthropic processes it on our behalf and, under our API terms, does not use it to train its models.</p>
          <p style={{ marginTop: 12 }}>If you use the Speak button in the AI Judge, your browser&apos;s built-in speech recognition turns your voice into text. In some browsers, including Chrome, that audio is processed by the browser maker (for example Google). Typing your answer avoids this.</p>
        </Section>

        <Section title="What we don't do">
          <p>We do not sell your data. We do not share it with advertisers. We do not use it to train AI models. We do not transfer it to anyone other than the service providers below, who process it on our behalf.</p>
        </Section>

        <Section title="Where it lives">
          <p>Account data and your prep history are stored in Supabase (Postgres on AWS US-East), encrypted at rest. Sign-in is handled by Supabase Auth, and by Google if you choose Continue with Google. Hosting is on Vercel, which also provides our page-view analytics: it counts visits without cookies and without identifying you. AI requests are processed by Anthropic. Daily usage counters, some of which are keyed by IP address, are deleted after 7 days.</p>
        </Section>

        <Section title="Your rights">
          <p>You can delete your account anytime from Settings, which removes your profile, registrations, practice logs, missed-question bank and saved resources. To request a copy of your data or anything else about your privacy, use the feedback button in the corner of any page. We honor GDPR and CCPA requests within 30 days.</p>
        </Section>

        <Section title="Children">
          <p>ChapterPrep is for high school students and their advisors. You must be 13 or older to create an account, and we do not knowingly collect personal information from anyone under 13. If you believe a child under 13 has created an account, tell us through the feedback button on any page and we will delete it. For school-managed deployments, the school or district is responsible for obtaining any consent required for its students.</p>
        </Section>

        <Section title="Changes">
          <p>If we materially change this policy we will post a notice on this page and in the app at least 30 days before the change takes effect. The &quot;Last updated&quot; date at the top of this page always reflects the current version.</p>
        </Section>

        <p style={{ marginTop: 36, fontSize: 13, color: "var(--text-muted)" }}>
          Questions? Use the feedback button (the flag) in the corner of any page. We respond within 3 business days.
        </p>
      </div>
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 20, marginBottom: 10, letterSpacing: "-0.01em" }}>{title}</h2>
      <div style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}
