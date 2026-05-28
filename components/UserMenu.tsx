"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { getSupabase } from "@/lib/supabase";

type Profile = {
  display_name: string | null;
  avatar_url: string | null;
};

export function UserMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supa = getSupabase();
    if (!supa) return;

    supa.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setEmail(data.user.email ?? null);
      const { data: p } = await supa
        .from("profiles")
        .select("display_name,avatar_url")
        .eq("id", data.user.id)
        .single();
      if (p) setProfile(p);
    });
  }, []);

  // Close on outside click + Escape key
  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", click);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", click);
      document.removeEventListener("keydown", key);
    };
  }, []);

  const displayName = profile?.display_name || email?.split("@")[0] || "";
  const initials = displayName?.[0]?.toUpperCase() || "?";
  const avatarUrl = profile?.avatar_url ?? null;

  const signOut = async () => {
    const supa = getSupabase();
    if (supa) await supa.auth.signOut();
    try { localStorage.removeItem("fbla_logged_in"); } catch {}
    router.push("/");
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-label="Open profile menu"
        aria-expanded={open}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "5px 10px 5px 5px",
          borderRadius: 999,
          border: "0.5px solid var(--border2)",
          background: open ? "var(--bg3)" : "transparent",
          cursor: "pointer",
          transition: "background 0.15s ease, border-color 0.15s ease",
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = "var(--bg2)"; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "transparent"; }}
      >
        <Avatar url={avatarUrl} initials={initials} size={28} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayName}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2.5" strokeLinecap="round" style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s ease" }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="Profile menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              minWidth: 220,
              background: "var(--card-bg)",
              border: "0.5px solid var(--border2)",
              borderRadius: 12,
              boxShadow: "var(--shadow-lg)",
              zIndex: 200,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{ padding: "14px 16px 12px", borderBottom: "0.5px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar url={avatarUrl} initials={initials} size={36} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {displayName}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text3)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {email}
                  </p>
                </div>
              </div>
            </div>

            {/* Nav items */}
            <div style={{ padding: "6px" }}>
              <MenuItem href="/app" icon="grid" label="Dashboard" onClick={() => setOpen(false)} />
              <MenuItem href="/app/competitions" icon="trophy" label="My competitions" onClick={() => setOpen(false)} />
              <MenuItem href="/app/settings" icon="settings" label="Settings" onClick={() => setOpen(false)} />
            </div>

            {/* Sign out + delete */}
            <div style={{ padding: "6px", borderTop: "0.5px solid var(--border)" }}>
              <button
                type="button"
                onClick={signOut}
                style={menuItemStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg3)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Avatar({ url, initials, size }: { url: string | null; initials: string; size: number }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="Avatar" width={size} height={size} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "rgba(var(--accent-rgb), 0.15)",
      border: "1px solid rgba(var(--accent-rgb), 0.32)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.38), fontWeight: 700, color: "var(--accent)",
      fontFamily: "var(--font-mono)",
    }}>
      {initials}
    </div>
  );
}

function MenuItem({ href, icon, label, onClick }: { href: string; icon: string; label: string; onClick: () => void }) {
  const icons: Record<string, React.ReactNode> = {
    grid: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
    trophy: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 4h10l-1 7-4 5-4-5L7 4z" /><path d="M12 16v5" /><path d="M8 21h8" /></svg>,
    settings: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  };
  return (
    <Link href={href} onClick={onClick} style={{ ...menuItemStyle, display: "flex" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg3)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{ color: "var(--text3)" }}>{icons[icon]}</span>
      {label}
    </Link>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "9px 12px",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  color: "var(--text)",
  background: "transparent",
  width: "100%",
  textAlign: "left",
  cursor: "pointer",
  border: "none",
  textDecoration: "none",
  transition: "background 0.15s ease",
};
