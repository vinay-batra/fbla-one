import Link from "next/link";
import { Logo } from "./Logo";
import { APP_VERSION } from "@/lib/version";
import { AffiliationNotice } from "@/components/AffiliationNotice";

type FooterCol = {
  title: string;
  links: { href: string; label: string }[];
};

const COLS: FooterCol[] = [
  {
    title: "Product",
    links: [
      { href: "/competitions", label: "Competitions" },
      { href: "/app", label: "Dashboard" },
      { href: "/auth", label: "Sign in" },
    ],
  },
  {
    title: "Help",
    links: [{ href: "/faq", label: "FAQ" }],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer
      style={{
        position: "relative",
        zIndex: 1,
        borderTop: "0.5px solid var(--border)",
        marginTop: 120,
        padding: "56px 0 40px",
        background: "var(--bg2)",
        overflow: "hidden",
      }}
    >
      <div className="container">
        <div
          className="footer-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) 1fr 1fr 1fr",
            gap: 40,
          }}
        >
          <div>
            <Logo size="md" />
            <p
              style={{
                marginTop: 14,
                color: "var(--text3)",
                fontSize: 14,
                maxWidth: 360,
                lineHeight: 1.65,
              }}
            >
              The all-in-one platform for FBLA chapters: competition guides, study
              resources, a prep tracker, and chapter management. Built for FBLA
              students, by an FBLA student.
            </p>
            <AffiliationNotice style={{ marginTop: 18 }} />
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <p className="footer-heading">{col.title}</p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="footer-link">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 56,
            paddingTop: 24,
            borderTop: "0.5px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            color: "var(--text-muted)",
            fontSize: 12,
            position: "relative",
            zIndex: 2,
          }}
        >
          <span>© {new Date().getFullYear()} ChapterPrep. Built for FBLA students, by an FBLA student.</span>
          <span className="font-mono" style={{ fontSize: 11, letterSpacing: "0.05em" }}>
            v{APP_VERSION} · chapterprep.com
          </span>
        </div>

      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .footer-grid > div:first-child {
            grid-column: 1 / -1;
            margin-bottom: 8px;
          }
        }
      `}</style>
    </footer>
  );
}
