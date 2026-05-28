"use client";

import { useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { pullFromSupabase, clearSyncedData, setSyncUser } from "@/lib/storage";

/**
 * Drives Supabase <-> localStorage sync based on auth state.
 * Mounted once globally. Renders nothing.
 */
export function DataSync() {
  useEffect(() => {
    const supa = getSupabase();
    if (!supa) return;

    let lastUserId: string | null = null;

    supa.auth.getUser().then(({ data }) => {
      if (data.user) {
        lastUserId = data.user.id;
        pullFromSupabase(data.user.id);
      }
    });

    const { data: { subscription } } = supa.auth.onAuthStateChange((event, session) => {
      const uid = session?.user?.id ?? null;
      if (event === "SIGNED_OUT") {
        lastUserId = null;
        clearSyncedData();
        return;
      }
      if (uid && uid !== lastUserId) {
        lastUserId = uid;
        pullFromSupabase(uid);
      } else if (uid) {
        setSyncUser(uid);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
