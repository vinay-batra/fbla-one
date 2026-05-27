"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

type NavLinkSpec = { href: string; label: string };

const NAV_LINKS: NavLinkSpec[] = [
  { href: "/competitions", label: "Competitions" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
];

export function PublicNav() {
  const pathname = usePathname() || "/";
  const [hidden, setHidden] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const lastY = useRef(0);
  const accum = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 80) {
        setHidden(false);
        accum.current = 0;
        lastY.current = y;
        return;
      }
      const delta = y - lastY.current;
      lastY.current = y;
      // sign-flip reset prevents jitter
      if ((delta > 0 && accum.current < 0) || (delta < 0 && accum.current > 0)) {
        accum.current = 0;
      }
      accum.current += delta;
      if (accum.current > 12) {
        setHidden(true);
        accum.current = 0;
      } else if (accum.current < -12) {
        setHidden(false);
        accum.current = 0;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => setDrawerOpen(false), [pathname]);

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: "var(--nav-bg)",
          backdropFilter: "blur(16px) saturate(140%)",
          WebkitBackdropFilter: "blur(16px) saturate(140%)",
          borderBottom: "0.5px solid var(--border)",
          transform: hidden ? "translateY(-100%)" : "translateY(0)",
          transition: "transform 0.3s ease",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 64,
            gap: 24,
          }}
        >
          <Logo size="md" />

          {/* Desktop links */}
          <div className="nav-links-desktop" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {NAV_LINKS.map((l) => (
              <NavLink key={l.href} {...l} active={pathname === l.href || pathname.startsWith(l.href + "/")} />
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ThemeToggle />
            <Link
              href="/auth"
              className="btn btn-accent btn-pill btn-sm cta-shimmer"
              style={{ paddingLeft: 18, paddingRight: 18 }}
            >
              Get started
            </Link>
            <button
              type="button"
              onClick={() => setDrawerOpen((p) => !p)}
              aria-label="Toggle menu"
              className="nav-burger mi-btn"
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                display: "none",
                alignItems: "center",
                justifyContent: "center",
                border: "0.5px solid var(--border2)",
                color: "var(--text)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {drawerOpen ? (
                  <>
                    <path d="M6 6l12 12" />
                    <path d="M18 6L6 18" />
                  </>
                ) : (
                  <>
                    <path d="M4 7h16" />
                    <path d="M4 12h16" />
                    <path d="M4 17h16" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div
            className="nav-drawer"
            style={{
              display: "block",
              background: "var(--bg)",
              borderTop: "0.5px solid var(--border)",
              padding: "16px 20px 24px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 8,
                    color: pathname === l.href ? "var(--accent)" : "var(--text)",
                    background: pathname === l.href ? "var(--accent-dim)" : "transparent",
                    fontWeight: 500,
                    fontSize: 15,
                  }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Nav height spacer so content below isn't covered by the fixed nav */}
      <div style={{ height: 64 }} aria-hidden="true" />

      <style>{`
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .nav-burger { display: inline-flex !important; }
        }
        @media (min-width: 769px) {
          .nav-drawer { display: none !important; }
        }
      `}</style>
    </>
  );
}

function NavLink({ href, label, active }: NavLinkSpec & { active?: boolean }) {
  return (
    <Link
      href={href}
      style={{
        padding: "9px 14px",
        borderRadius: 9,
        fontSize: 13.5,
        fontWeight: 500,
        color: active ? "var(--text)" : "var(--text2)",
        background: active ? "var(--bg3)" : "transparent",
        transition: "background 0.15s ease, color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (active) return;
        e.currentTarget.style.background = "var(--bg3)";
        e.currentTarget.style.color = "var(--text)";
      }}
      onMouseLeave={(e) => {
        if (active) return;
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--text2)";
      }}
    >
      {label}
    </Link>
  );
}
