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
        <HeroBadge>Last updated May 27, 2026</HeroBadge>
        <h1 style={{ marginTop: 18, marginBottom: 24, fontSize: 40 }}>Privacy Policy</h1>

        <Section title="What we collect">
          <p>When you sign up for FBLA One, we collect your email address, display name, and (optionally) your school or chapter affiliation. When you use the platform, we collect data you create: practice test logs, saved resources, competition registrations, and progress.</p>
        </Section>

        <Section title="What we don't do">
          <p>We do not sell your data. We do not share it with advertisers. We do not use it to train AI models. We do not transfer it outside the platform without your explicit consent.</p>
        </Section>

        <Section title="Where it lives">
          <p>Account data and your prep history are stored in Supabase (Postgres on AWS US-East), encrypted at rest. Email is sent via Resend. Hosting is on Vercel. Logs that include personal data are retained for 30 days.</p>
        </Section>

        <Section title="Your rights">
          <p>You can export or delete your data anytime from Settings. We honor GDPR and CCPA requests within 30 days. Email privacy@fbla.one with any request.</p>
        </Section>

        <Section title="Children">
          <p>FBLA is a high-school activity, so most users are 13-18. We comply with COPPA: users under 13 require verifiable parental consent before creating an account. School-managed deployments handle consent at the district level.</p>
        </Section>

        <Section title="Changes">
          <p>If we materially change this policy we'll email all account holders at least 30 days before the change takes effect. The "Last updated" date at the top of this page always reflects the current version.</p>
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
