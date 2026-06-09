import type { Metadata } from "next";
import { HeroBadge } from "@/components/HeroBadge";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How FBLA One handles your data.",
};

export default function Privacy() {
  return (
    <section style={{ padding: "100px 0 80px" }}>
      <div className="container" style={{ maxWidth: 760, marginInline: "auto" }}>
        <HeroBadge>Last updated June 8, 2026</HeroBadge>
        <h1 style={{ marginTop: 18, marginBottom: 24, fontSize: 40 }}>Privacy Policy</h1>

        <Section title="What we collect">
          <p>When you sign up we collect your email address, display name, and (optionally) your school or chapter affiliation. As you use the platform we collect data you create: practice test logs, saved resources, competition registrations, progress, and any feedback you send through the in-app feedback form. If you enter your email in our landing-page sign-up form, we store it on a notification list. We also automatically log your IP address to rate-limit our AI features and prevent abuse.</p>
        </Section>

        <Section title="How AI features work">
          <p>The AI practice tests and the in-app assistant are powered by Anthropic (Claude). When you generate a test or chat with the assistant, the prompt and your message are sent to Anthropic to produce a response. Anthropic processes this on our behalf as a sub-processor and, under our API terms, does not use it to train its models.</p>
        </Section>

        <Section title="What we don't do">
          <p>We do not sell your data. We do not share it with advertisers. We do not use it to train AI models. We do not transfer it to third parties other than the service providers below who process it on our behalf.</p>
        </Section>

        <Section title="Where it lives">
          <p>Account data and your prep history are stored in Supabase (Postgres on AWS US-East), encrypted at rest. Authentication emails are sent through Supabase Auth. Hosting is on Vercel. AI requests are processed by Anthropic. Logs that include personal data (such as IP addresses) are retained for 30 days.</p>
        </Section>

        <Section title="Your rights">
          <p>You can delete your account anytime from Settings, which removes your profile, registrations, practice logs, and saved resources. To also be removed from our email notification list, or to request a copy of your data, email privacy@fbla.one. We honor GDPR and CCPA requests within 30 days.</p>
        </Section>

        <Section title="Children">
          <p>FBLA is primarily a high-school activity, so most users are 13-18. FBLA One is not directed to children under 13, and we do not knowingly collect personal information from anyone under 13. If you believe a child under 13 has created an account, email privacy@fbla.one and we will delete it. For school-managed deployments, the school or district is responsible for obtaining any consent required for its students.</p>
        </Section>

        <Section title="Changes">
          <p>If we materially change this policy we'll post a notice on this page and in the app at least 30 days before the change takes effect. The "Last updated" date at the top of this page always reflects the current version.</p>
        </Section>

        <p style={{ marginTop: 36, fontSize: 13, color: "var(--text-muted)" }}>
          Questions? Email privacy@fbla.one. We respond within 3 business days.
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
