import type { Metadata } from "next";

/** Sign-in pages: a real title, and kept out of search results. */
export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
