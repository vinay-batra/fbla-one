import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        marginTop: 80,
        padding: "48px 0 32px",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) 1fr 1fr",
            gap: 40,
          }}
        >
          <div>
            <Logo />
            <p
              style={{
                marginTop: 14,
                color: "var(--text3)",
                fontSize: 14,
                maxWidth: 360,
                lineHeight: 1.6,
              }}
            >
              The all-in-one platform for FBLA chapters. Competition guides,
              study resources, prep tracker, and chapter management.
            </p>
            <p
              style={{
                marginTop: 18,
                color: "var(--text-muted)",
                fontSize: 12,
              }}
            >
              Not affiliated with Future Business Leaders of America, Inc.
            </p>
          </div>

          <FooterCol title="Product">
            <FooterLink href="/competitions">Competitions</FooterLink>
            <FooterLink href="/tracker">Tracker</FooterLink>
            <FooterLink href="/chapter">Chapter</FooterLink>
            <FooterLink href="/pricing">Pricing</FooterLink>
          </FooterCol>

          <FooterCol title="Company">
            <FooterLink href="/about">About</FooterLink>
            <FooterLink href="/privacy">Privacy</FooterLink>
            <FooterLink href="/terms">Terms</FooterLink>
          </FooterCol>
        </div>

        <div
          style={{
            marginTop: 36,
            paddingTop: 22,
            borderTop: "1px solid var(--border)",
            color: "var(--text-muted)",
            fontSize: 12,
          }}
        >
          © {new Date().getFullYear()} FBLA One. Built for FBLA students, by an FBLA student.
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow" style={{ marginBottom: 14 }}>{title}</p>
      {children}
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        color: "var(--text2)",
        fontSize: 14,
        padding: "4px 0",
        transition: "color 0.2s ease",
      }}
    >
      {children}
    </Link>
  );
}
