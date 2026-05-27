import Link from "next/link";
import { Logo } from "./Logo";

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
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/faq", label: "FAQ" },
    ],
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
        padding: "56px 0 0",
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
              The all-in-one platform for FBLA chapters. Competition guides, study
              resources, prep tracker, and chapter management - built for FBLA
              students, by an FBLA student.
            </p>
            <p
              style={{
                marginTop: 18,
                color: "var(--text-muted)",
                fontSize: 11,
                lineHeight: 1.6,
              }}
            >
              Not affiliated with Future Business Leaders of America, Inc. FBLA
              competition names referenced for educational use only.
            </p>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <p className="eyebrow" style={{ marginBottom: 14 }}>{col.title}</p>
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
          <span>© {new Date().getFullYear()} FBLA One. Built for FBLA students, by an FBLA student.</span>
          <span className="font-mono" style={{ fontSize: 11, letterSpacing: "0.05em" }}>
            v0.2 · fbla.one
          </span>
        </div>

        {/* Watermark mark — sits behind the bottom row, opacity-faded, decorative only */}
        <div
          aria-hidden="true"
          style={{
            position: "relative",
            height: 120,
            marginTop: -24,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            pointerEvents: "none",
            opacity: 0.08,
            overflow: "hidden",
          }}
        >
          { /* eslint-disable-next-line @next/next/no-img-element */ }
          <img
            src="/logo-mark.png"
            alt=""
            style={{
              width: "min(520px, 70vw)",
              height: "auto",
              transform: "translateY(40%)",
            }}
          />
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
