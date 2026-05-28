import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSupabaseServer, isSupabaseConfiguredServer } from "@/lib/supabase-server";

export const metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Gate the dashboard when Supabase is configured. In preview mode (no env
  // vars) we let it through so the UI is still explorable.
  if (isSupabaseConfiguredServer) {
    const supabase = await getSupabaseServer();
    const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
    if (!data.user) redirect("/auth");
  }
  return <AppShell>{children}</AppShell>;
}
