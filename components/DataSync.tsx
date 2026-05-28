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

    const onUser = (user: User) => {
      const name =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        user.email?.split("@")[0] ||
        null;
      ensureProfile(user.id, user.email ?? null, name);
      pullFromSupabase(user.id);
    };

    supa.auth.getUser().then(({ data }) => {
      if (data.user) {
        lastUserId = data.user.id;
        onUser(data.user);
      }
    });

    const { data: { subscription } } = supa.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null;
      if (event === "SIGNED_OUT") {
        lastUserId = null;
        clearSyncedData();
        return;
      }
      if (user && user.id !== lastUserId) {
        lastUserId = user.id;
        onUser(user);
      } else if (user) {
        setSyncUser(user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
