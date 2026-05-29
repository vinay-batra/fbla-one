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
  const cookieStore = await cookies();
  const isPreview = cookieStore.get("fbla_preview")?.value === "1";

  if (!isPreview && isSupabaseConfiguredServer) {
    const supabase = await getSupabaseServer();
    const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
    if (!data.user) redirect("/auth");
  }
  return <AppShell isPreviewMode={isPreview}>{children}</AppShell>;
}
