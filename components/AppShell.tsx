"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { getSupabase } from "@/lib/supabase";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

const NAV: NavItem[] = [
  {
    href: "/app",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/app/competitions",
    label: "My competitions",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 4h10l-1 7-4 5-4-5L7 4z" />
        <path d="M12 16v5" />
        <path d="M8 21h8" />
      </svg>
    ),
  },
  {
    href: "/app/tracker",
    label: "Practice tracker",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12l4-7 4 5 4-9 6 14" />
        <path d="M3 21h18" />
      </svg>
    ),
  },
  {
    href: "/app/chapter",
    label: "Chapter",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/app/coach",
    label: "AI Practice",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3L13.5 8.5H19L14.5 11.5L16 17L12 14L8 17L9.5 11.5L5 8.5H10.5L12 3Z" />
      </svg>
    ),
  },
  {
    href: "/app/resources",
    label: "Saved resources",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: "/app/settings",
    label: "Settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/app";
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supa = getSupabase();
    if (!supa) return;
    // Immediate check
    supa.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    // Stay reactive to sign-in / sign-out
    const { data: { subscription } } = supa.auth.onAuthStateChange((_, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => setDrawerOpen(false), [pathname]);

  const signOut = async () => {
    const supa = getSupabase();
    if (supa) await supa.auth.signOut();
    router.push("/");
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg)",
      }}
    >
      {/* Sidebar */}
      <aside
        className={`app-sidebar ${drawerOpen ? "open" : ""}`}
        style={{
          width: 248,
          flexShrink: 0,
          borderRight: "0.5px solid var(--border)",
          background: "var(--bg2)",
          padding: "20px 14px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <div style={{ padding: "6px 10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Logo size="md" />
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 9,
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: active ? "var(--accent)" : "var(--text2)",
                  background: active ? "var(--accent-dim)" : "transparent",
                  borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
                  paddingLeft: active ? 10 : 12,
                  transition: "all 0.15s ease",
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
                <span style={{ flexShrink: 0, color: "inherit" }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: "auto", paddingTop: 18, borderTop: "0.5px solid var(--border)" }}>
          <div style={{ padding: "10px 12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
            {email ? (
              <>
                <p
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  SIGNED IN
                </p>
                <p style={{ fontSize: 12.5, color: "var(--text2)", wordBreak: "break-all" }}>
                  {email}
                </p>
              </>
            ) : (
              <p
                className="font-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                PREVIEW MODE
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={signOut}
            className="btn btn-ghost btn-sm"
            style={{ width: "100%", justifyContent: "flex-start" }}
          >
            {email ? "Sign out" : "Sign in"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            background: "var(--nav-bg)",
            backdropFilter: "blur(14px) saturate(140%)",
            WebkitBackdropFilter: "blur(14px) saturate(140%)",
            borderBottom: "0.5px solid var(--border)",
            padding: "14px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <button
            type="button"
            onClick={() => setDrawerOpen((p) => !p)}
            aria-label="Toggle sidebar"
            className="mi-btn app-burger"
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
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <div style={{ flex: 1 }} />

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("fbla:palette-open"));
                }
              }}
              className="btn btn-ghost btn-sm"
              style={{ gap: 8, display: "flex", alignItems: "center" }}
              aria-label="Open command palette (Cmd+K)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <span className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                K
              </span>
            </button>
            <ThemeToggle />
            <Link href="/competitions" className="btn btn-ghost btn-sm">
              Browse competitions
            </Link>
          </div>
        </header>

        <main
          style={{
            flex: 1,
            padding: "28px 28px 60px",
            background: "var(--bg)",
            minWidth: 0,
          }}
        >
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .app-sidebar {
            position: fixed;
            top: 0; left: 0; bottom: 0;
            z-index: 100;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            box-shadow: var(--shadow-lg);
          }
          .app-sidebar.open { transform: translateX(0); }
          .app-burger { display: inline-flex !important; }
        }
      `}</style>
    </div>
  );
}
