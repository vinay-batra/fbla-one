import type { Metadata } from "next";
import { HeroBadge } from "@/components/HeroBadge";

export const metadata: Metadata = {
  title: "Terms",
  description: "FBLA One terms of service.",
};

export default function Terms() {
  return (
    <section style={{ padding: "100px 0 80px" }}>
      <div className="container" style={{ maxWidth: 760, marginInline: "auto" }}>
        <HeroBadge>Last updated May 27, 2026</HeroBadge>
        <h1 style={{ marginTop: 18, marginBottom: 24, fontSize: 40 }}>Terms of Service</h1>

        <Section title="What FBLA One is">
          <p>FBLA One is an independent educational platform for FBLA (Future Business Leaders of America) chapters. It is not affiliated with, endorsed by, or sponsored by FBLA-PBL Inc.</p>
        </Section>

        <Section title="Your account">
          <p>You're responsible for keeping your login credentials secure. One account per person. Share access through chapter membership, not by sharing logins.</p>
        </Section>

        <Section title="Acceptable use">
          <p>Don't use FBLA One to harass other members, scrape content systematically, attempt to bypass security, or upload malicious material. We can suspend accounts that do these things.</p>
        </Section>

        <Section title="Content & competition materials">
          <p>Study resources link to third-party sources. We make a good-faith effort to link to legitimate, free educational content, but we don't own or warrant external resources. Official FBLA rubrics and event guides are the property of FBLA-PBL Inc. and are linked, not hosted.</p>
        </Section>

        <Section title="Pricing & paid tiers">
          <p>The Student tier is free indefinitely. The Chapter tier ($29/month per chapter) and District tier (custom) launch after the FBLA officer meeting on August 25, 2026. Waitlist members lock in the launch price. Paid tiers can be cancelled anytime; no contract.</p>
        </Section>

        <Section title="Disclaimer">
          <p>FBLA One is provided "as is." We make no guarantee that using the platform will result in placing at any competition. Study still required.</p>
        </Section>

        <Section title="Liability">
          <p>To the maximum extent permitted by law, FBLA One is not liable for indirect, incidental, or consequential damages arising from use of the platform.</p>
        </Section>

        <Section title="Governing law">
          <p>These terms are governed by the laws of the Commonwealth of Pennsylvania.</p>
        </Section>

        <p style={{ marginTop: 36, fontSize: 13, color: "var(--text-muted)" }}>
          Questions? Email hello@fbla.one.
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
