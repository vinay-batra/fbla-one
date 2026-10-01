"use client";

import { useEffect } from "react";
import type { User } from "@supabase/supabase-js";

/**
 * Drives Supabase <-> localStorage sync based on auth state.
 * Mounted once globally. Renders nothing.
 *
 * The Supabase client and lib/storage are imported DYNAMICALLY inside the
 * effect on purpose. This component sits in the root layout, so a static import
 * pulled the whole auth SDK (~65KB brotli) and, through lib/storage, the entire
 * competition registry (~24KB brotli) into the shared chunk of all 85 routes.
 * Every signed-out visitor to /privacy or a competition page was downloading
 * and parsing the auth SDK to run a getUser() that returns null. Since nothing
 * here renders, deferring to the effect costs nothing.
 */
export function DataSync() {
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    (async () => {
      const [{ getSupabase }, { pullFromSupabase, clearSyncedData, setSyncUser, ensureProfile, getDataOwner, setDataOwner }] =
        await Promise.all([import("@/lib/supabase"), import("@/lib/storage")]);
      if (cancelled) return;

      const supa = getSupabase();
      if (!supa) return;

      let lastUserId: string | null = null;
      // getUser() and the INITIAL_SESSION/SIGNED_IN event can both fire on mount
      // for the same user and race (both observe lastUserId === null). Guard with
      // an in-flight set + set lastUserId synchronously so ensureProfile +
      // pullFromSupabase run exactly once, and chain them so the profile exists
      // before the pull pushes local-only rows up.
      const inFlight = new Set<string>();
      const onUser = (user: User) => {
        if (inFlight.has(user.id)) return;
        inFlight.add(user.id);
        lastUserId = user.id;
        // Data left by a different account (its session died without a
        // sign-out reaching this tab) must not be uploaded into this one.
        // Preview data (no owner) is kept and migrates up, as intended.
        const owner = getDataOwner();
        if (owner && owner !== user.id) {
          clearSyncedData();
          import("@/lib/mistakes").then((m) => m.clearLocalMistakes()).catch(() => {});
        }
        setDataOwner(user.id);
        const name =
          (user.user_metadata?.full_name as string) ||
          (user.user_metadata?.name as string) ||
          user.email?.split("@")[0] ||
          null;
        Promise.resolve()
          .then(() => ensureProfile(user.id, user.email ?? null, name))
          .then(() => pullFromSupabase(user.id))
          // The mistake bank syncs separately (it only loads when needed).
          .then(() => import("@/lib/mistakes").then((m) => m.pullMistakes(user.id)))
          .finally(() => inFlight.delete(user.id));
      };

      supa.auth.getUser().then(async ({ data, error }) => {
        if (cancelled) return;
        if (data.user) { onUser(data.user); return; }
        // A stored session the server rejects (expired, revoked, deleted
        // account) would otherwise sit there and fail every request on every
        // page. Clear it locally; the data owner check decides what to wipe.
        if (error) {
          const { data: { session } } = await supa.auth.getSession();
          if (session) await supa.auth.signOut({ scope: "local" }).catch(() => {});
        }
      });

      const { data: { subscription } } = supa.auth.onAuthStateChange((event, session) => {
        const user = session?.user ?? null;
        if (event === "SIGNED_OUT") {
          lastUserId = null;
          // Supabase also fires SIGNED_OUT when there was no session at all
          // (e.g. /auth clearing a dead cookie). Only wipe data that belongs to
          // an account; preview data stays so it can migrate on sign-up.
          if (getDataOwner()) {
            clearSyncedData();
            import("@/lib/mistakes").then((m) => m.clearLocalMistakes()).catch(() => {});
          }
          return;
        }
        if (user && user.id !== lastUserId) {
          onUser(user);
        } else if (user) {
          setSyncUser(user.id);
          import("@/lib/mistakes").then((m) => m.setMistakeSyncUser(user.id)).catch(() => {});
        }
      });

      // The effect can be torn down while the dynamic import is still in flight.
      if (cancelled) {
        subscription.unsubscribe();
        return;
      }
      unsubscribe = () => subscription.unsubscribe();
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return null;
}
