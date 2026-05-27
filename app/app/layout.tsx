import { AppShell } from "@/components/AppShell";

export const metadata = {
  title: "Dashboard",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
