"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

/**
 * One auth-aware primary CTA. Signed in -> "Go to dashboard"; signed out ->
 * the given label (defaults to "Get started"). Seeds from the same
 * `fbla_logged_in` cache PublicNav writes, so it paints the right button
 * immediately for returning users instead of flashing.
 */
export function HeroCta({
  signedOutLabel = "Get started",
  signedOutHref = "/auth?mode=signup",
}: {
  signedOutLabel?: string;
  signedOutHref?: string;
}) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supa = getSupabase();
    if (!supa) {
      setLoggedIn(false);
      return;
    }
    try {
      const c = localStorage.getItem("fbla_logged_in");
      if (c === "1") setLoggedIn(true);
      else if (c === "0") setLoggedIn(false);
    } catch {}
    supa.auth.getUser().then(({ data }) => {
      const li = !!data.user;
      setLoggedIn(li);
      try {
        localStorage.setItem("fbla_logged_in", li ? "1" : "0");
      } catch {}
    });
  }, []);

  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 36, flexWrap: "wrap" }}>
      {loggedIn ? (
        <Link href="/app" className="btn btn-accent btn-lg cta-shimmer">
          Go to dashboard
        </Link>
      ) : (
        <Link href={signedOutHref} className="btn btn-accent btn-lg cta-shimmer">
          {signedOutLabel}
        </Link>
      )}
    </div>
  );
}
