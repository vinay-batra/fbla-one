import type { Metadata } from "next";

/**
 * Mock Regionals join links carry a room code, so they stay out of search
 * results (robots.txt also disallows /mock/). The page is a client component,
 * so the metadata lives here.
 */
export const metadata: Metadata = {
  title: "Join Mock Regionals",
  robots: { index: false, follow: false },
};

export default function MockCodeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
