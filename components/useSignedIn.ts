"use client";

import { useEffect, useState } from "react";

/**
 * Auth-aware UI state for marketing pages, WITHOUT statically importing the
 * Supabase client.
 *
 * Returns null while unknown, then true/false. It seeds synchronously from the
 * `fbla_logged_in` cache (so returning users see the right button on first
 * paint) and then confirms with a dynamically imported client.
 *
 * Why this exists: HeroCta and EmailCta each did `import { getSupabase }` at
 * module scope. Any page rendering them pulled the whole auth SDK (~65KB
 * brotli) into its bundle, which silently undid the lazy-loading already done
 * in DataSync and PublicNav. Use this hook instead of importing the client in
 * marketing components.
 */
export function useSignedIn(): boolean | null {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const c = localStorage.getItem("fbla_logged_in");
      if (c === "1") setSignedIn(true);
      else if (c === "0") setSignedIn(false);
    } catch {}

    let cancelled = false;
    (async () => {
      const { getSupabase } = await import("@/lib/supabase");
      if (cancelled) return;
      const supa = getSupabase();
      if (!supa) { setSignedIn(false); return; }
      const { data } = await supa.auth.getUser();
      if (cancelled) return;
      const li = !!data.user;
      setSignedIn(li);
      try { localStorage.setItem("fbla_logged_in", li ? "1" : "0"); } catch {}
    })();

    return () => { cancelled = true; };
  }, []);

  return signedIn;
}
