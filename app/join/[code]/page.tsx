"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

/**
 * Chapter invite link target: /join/<CODE>. Stashes the code, then sends the
 * visitor to the Chapter page (signed in) or to signup (new user). The Chapter
 * page auto-joins from the stashed code; the signup flow also routes back to
 * the Chapter page so the join completes for brand-new accounts.
 */
export default function JoinByCode() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const code = String((params?.code as string) || "").toUpperCase().trim();
    if (code) {
      try {
        localStorage.setItem("fbla_pending_join", code);
      } catch {}
    }
    const supa = getSupabase();
    if (!supa) {
      router.replace("/auth?mode=signup");
      return;
    }
    supa.auth.getUser().then(({ data }) => {
      router.replace(data.user ? "/app/chapter" : "/auth?mode=signup");
    });
  }, [params, router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "var(--bg)", color: "var(--text3)" }}>
      <div style={{ width: 28, height: 28, border: "2.5px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ fontSize: 14 }}>Joining your chapter...</p>
    </div>
  );
}
