"use client";

import { useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { pullFromSupabase, clearSyncedData, setSyncUser, ensureProfile } from "@/lib/storage";
import type { User } from "@supabase/supabase-js";

/**
 * Drives Supabase <-> localStorage sync based on auth state.
 * Mounted once globally. Renders nothing.
 */
export function DataSync() {
  useEffect(() => {
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
      const name =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        user.email?.split("@")[0] ||
        null;
      Promise.resolve()
        .then(() => ensureProfile(user.id, user.email ?? null, name))
        .then(() => pullFromSupabase(user.id))
        .finally(() => inFlight.delete(user.id));
    };

    supa.auth.getUser().then(({ data }) => {
      if (data.user) onUser(data.user);
    });

    const { data: { subscription } } = supa.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null;
      if (event === "SIGNED_OUT") {
        lastUserId = null;
        clearSyncedData();
        return;
      }
      if (user && user.id !== lastUserId) {
        onUser(user);
      } else if (user) {
        setSyncUser(user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
