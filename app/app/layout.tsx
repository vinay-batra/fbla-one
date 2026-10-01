import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AppShell } from "@/components/AppShell";
import { getSupabaseServer, isSupabaseConfiguredServer } from "@/lib/supabase-server";

export const metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Allow unauthenticated access when a preview cookie is set (set by /api/preview).
  // This lets advisors explore the full UI without signing up.
  // A signed-in account always wins: a preview cookie left over from before
  // signing up must not keep showing the preview banner.
  const cookieStore = await cookies();
  let user = null;
  if (isSupabaseConfiguredServer) {
    const supabase = await getSupabaseServer();
    user = ((await supabase?.auth.getUser()) ?? { data: { user: null } }).data.user;
  }
  const isPreview = !user && cookieStore.get("fbla_preview")?.value === "1";
  if (!user && !isPreview && isSupabaseConfiguredServer) redirect("/auth");
  return <AppShell isPreviewMode={isPreview}>{children}</AppShell>;
}
