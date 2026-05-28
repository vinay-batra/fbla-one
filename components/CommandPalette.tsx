"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { COMPETITIONS } from "@/lib/competitions";

type NavItem = {
  label: string;
  href: string;
  group: string;
  icon: React.ReactNode;
};

const GridIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const TrophyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 4h10l-1 7-4 5-4-5L7 4z" />
    <path d="M12 16v5" />
    <path d="M8 21h8" />
  </svg>
);

const ChartIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12l4-7 4 5 4-9 6 14" />
    <path d="M3 21h18" />
  </svg>
);

const GearIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const CalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/app", group: "Navigate", icon: <GridIcon /> },
  { label: "My competitions", href: "/app/competitions", group: "Navigate", icon: <TrophyIcon /> },
  { label: "Practice tracker", href: "/app/tracker", group: "Navigate", icon: <ChartIcon /> },
  { label: "Chapter & deadlines", href: "/app/chapter", group: "Navigate", icon: <CalIcon /> },
  { label: "Settings", href: "/app/settings", group: "Navigate", icon: <GearIcon /> },
  { label: "Browse all competitions", href: "/competitions", group: "Navigate", icon: <SearchIcon /> },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSelected(0);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((p) => !p);
      }
    };
    const handleOpen = () => setOpen(true);
    window.addEventListener("keydown", handleKey);
    window.addEventListener("fbla:palette-open", handleOpen);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("fbla:palette-open", handleOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const compResults = query.trim()
    ? COMPETITIONS.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  const navResults = query.trim()
    ? NAV_ITEMS.filter((n) => n.label.toLowerCase().includes(query.toLowerCase()))
    : NAV_ITEMS;

  type FlatItem = { label: string; href: string; icon: React.ReactNode; badge?: string };
  const flatItems: FlatItem[] = [
    ...navResults.map((n) => ({ label: n.label, href: n.href, icon: n.icon })),
    ...compResults.map((c) => ({
      label: c.name,
      href: `/competitions/${c.slug}`,
      icon: <SearchIcon />,
      badge: c.category,
    })),
  ];

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const navigate = (href: string) => {
    close();
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((p) => Math.min(p + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((p) => Math.max(p - 1, 0));
    } else if (e.key === "Enter" && flatItems[selected]) {
      navigate(flatItems[selected].href);
    } else if (e.key === "Escape") {
      close();
    }
  };

  if (!open) return null;

  const showCompGroup = compResults.length > 0;
  const showNavGroup = navResults.length > 0;
  const navCount = navResults.length;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.52)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      onClick={close}
    >
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(560px, calc(100vw - 32px))",
          background: "var(--card-bg)",
          border: "0.5px solid var(--border2)",
          borderRadius: 16,
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
          animation: "fadeUp 0.15s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "0.5px solid var(--border)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search competitions or navigate..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 15,
              color: "var(--text)",
              fontFamily: "var(--font-body)",
            }}
          />
          <span className="font-mono" style={{ fontSize: 10, color: "var(--text-muted)", background: "var(--bg3)", padding: "3px 7px", borderRadius: 5 }}>
            ESC
          </span>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {flatItems.length === 0 && (
            <p style={{ padding: "24px 18px", fontSize: 13, color: "var(--text3)", textAlign: "center" }}>
              No results for &quot;{query}&quot;
            </p>
          )}

          {showNavGroup && (
            <>
              <p className="eyebrow" style={{ padding: "10px 18px 4px", fontSize: 9 }}>
                {query ? "Pages" : "Quick navigation"}
              </p>
              {navResults.map((item, i) => {
                const idx = i;
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => navigate(item.href)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "11px 18px",
                      background: idx === selected ? "var(--bg3)" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      color: "var(--text)",
                      transition: "background 0.1s",
                    }}
                  >
                    <span style={{ color: "var(--text3)", flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>
                  </button>
                );
              })}
            </>
          )}

          {showCompGroup && (
            <>
              <p className="eyebrow" style={{ padding: "10px 18px 4px", fontSize: 9 }}>
                Competitions
              </p>
              {compResults.map((comp, i) => {
                const idx = navCount + i;
                return (
                  <button
                    key={comp.slug}
                    type="button"
                    onClick={() => navigate(`/competitions/${comp.slug}`)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "11px 18px",
                      background: idx === selected ? "var(--bg3)" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      color: "var(--text)",
                      transition: "background 0.1s",
                    }}
                  >
                    <span style={{ color: "var(--text3)", flexShrink: 0 }}><SearchIcon /></span>
                    <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{comp.name}</span>
                    <span className="chip chip-brand" style={{ fontSize: 10 }}>{comp.category}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
