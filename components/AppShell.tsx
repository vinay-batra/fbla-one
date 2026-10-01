"use client";

import { useState, useEffect, useRef, Suspense, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { AffiliationNotice } from "@/components/AffiliationNotice";
import { DeadlineAlert } from "./DeadlineAlert";
import { AppTour } from "./AppTour";
import { getSupabase } from "@/lib/supabase";
import "@/app/app/app.css";

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
    href: "/app/judge",
    label: "AI Judge",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20h10M6 16l8-8M9 5l6 6M12 2l6 6M16 14l5 5" />
      </svg>
    ),
  },
  {
    href: "/app/mock",
    label: "Mock Regionals",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="12" rx="1.5" />
        <path d="M8 20h8M12 16v4M7 12l3-3 2 2 5-5" />
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

export function AppShell({ children, isPreviewMode = false }: { children: ReactNode; isPreviewMode?: boolean }) {
  const pathname = usePathname() || "/app";
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

  // Mobile sidebar drawer: focus the first item on open, Escape closes + restores focus.
  const burgerRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!drawerOpen) return;
    sidebarRef.current?.querySelector<HTMLElement>('a[href], button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setDrawerOpen(false); burgerRef.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const signOut = async () => {
    const supa = getSupabase();
    if (supa) await supa.auth.signOut();
    // Full reload so every page drops the signed-in state at once.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/";
  };

  const practice = NAV.filter((n) => ["/app", "/app/coach", "/app/judge", "/app/tracker", "/app/resources"].includes(n.href));
  const chapter = NAV.filter((n) => ["/app/chapter", "/app/mock"].includes(n.href));
  const settings = NAV.find((n) => n.href === "/app/settings")!;
  const initial = (email ?? "?").trim().charAt(0).toUpperCase();

  const navLink = (item: NavItem) => {
    const active = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        data-tour={item.href === "/app" ? "dashboard" : item.href.split("/").pop()}
        className={`as-link${active ? " is-active" : ""}`}
      >
        <span className="as-link-icon">{item.icon}</span>
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="as">
      {/* Sidebar */}
      <aside ref={sidebarRef} id="app-sidebar" className={`app-sidebar as-side ${drawerOpen ? "open" : ""}`}>
        <div className="as-logo">
          <Logo size="md" />
        </div>

        <nav aria-label="Dashboard" className="as-nav">
          <p className="as-group">Practice</p>
          {practice.map(navLink)}
          <p className="as-group">Chapter</p>
          {chapter.map(navLink)}
          <div className="as-gap" />
          {navLink(settings)}
        </nav>

        {email ? (
          <div className="as-user">
            <span className="as-avatar" aria-hidden="true">{initial}</span>
            <div className="as-user-text">
              <span className="as-user-label">Signed in</span>
              <span className="as-user-email">{email}</span>
            </div>
            <button type="button" onClick={signOut} className="as-signout" aria-label="Sign out" title="Sign out">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="as-guest">
            <p className="as-guest-title">You are previewing</p>
            <p className="as-guest-sub">Make a free account to save your scores and join your chapter.</p>
            <Link href="/auth?mode=signup" className="as-guest-cta">Create free account</Link>
            <Link href="/auth" className="as-guest-login">I have an account</Link>
          </div>
        )}
      </aside>

      {/* Mobile drawer backdrop: tap outside to close (mobile only via CSS) */}
      {drawerOpen && <div className="app-backdrop" onClick={() => setDrawerOpen(false)} aria-hidden="true" />}

      {/* Main */}
      <div className="as-body">
        <header className="as-top">
          <button
            ref={burgerRef}
            type="button"
            onClick={() => setDrawerOpen((p) => !p)}
            aria-label="Toggle sidebar"
            aria-expanded={drawerOpen}
            aria-controls="app-sidebar"
            className="app-burger as-burger"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <div className="as-top-logo"><Logo size="sm" /></div>
          <div style={{ flex: 1 }} />
          <div className="as-top-actions">
            <ThemeToggle />
            <Link href="/competitions" className="as-top-link">All events</Link>
          </div>
        </header>

        <main id="main" tabIndex={-1} className="app-main-content as-main">
          {isPreviewMode && !email && (
            <div className="as-preview">
              <span>
                <strong>Preview.</strong> Nothing here is saved to an account yet.
              </span>
              <div className="as-preview-actions">
                <Link href="/auth?mode=signup" className="btn btn-accent btn-sm btn-pill">
                  Create free account
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    // Actually clear the cookie (a plain link left preview active
                    // for the full 1h maxAge), then leave the app.
                    document.cookie = "fbla_preview=; path=/; max-age=0";
                    window.location.href = "/";
                  }}
                  className="btn btn-ghost btn-sm"
                >
                  Exit preview
                </button>
              </div>
            </div>
          )}
          <DeadlineAlert />
          {children}
          <footer className="as-foot">
            <AffiliationNotice variant="compact" />
          </footer>
        </main>
      </div>

      <Suspense fallback={null}>
        <AppTour />
      </Suspense>
    </div>
  );
}
