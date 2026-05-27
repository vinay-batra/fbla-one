import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfiguredServer = Boolean(url && anonKey);

/**
 * Server-side Supabase client. Returns null when env vars aren't set.
 * Use in server components, route handlers, and the proxy middleware.
 */
export async function getSupabaseServer(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfiguredServer) return null;
  const cookieStore = await cookies();
  return createServerClient(url!, anonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        try {
          toSet.forEach(({ name, value, options }) => {
            cookieStore.set({
              name,
              value,
              ...options,
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              path: "/",
            });
          });
        } catch {
          // setAll can be called from a server component where cookie mutation
          // isn't allowed; safe to ignore - the proxy middleware writes cookies
          // for the next request.
        }
      },
    },
  });
}
