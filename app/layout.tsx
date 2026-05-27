import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ConditionalAmbientOrbs } from "@/components/ConditionalAmbientOrbs";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://fbla.one"),
  title: {
    default: "FBLA One — The all-in-one FBLA chapter platform",
    template: "%s · FBLA One",
  },
  description:
    "Competition guides, study resources, prep tracker, deadline calendar, and chapter management for FBLA chapters. Built for FBLA students, by an FBLA student.",
  applicationName: "FBLA One",
  authors: [{ name: "FBLA One" }],
  keywords: [
    "FBLA",
    "Future Business Leaders of America",
    "FBLA competitions",
    "FBLA study guide",
    "FBLA tracker",
    "FBLA chapter",
    "competition prep",
  ],
  openGraph: {
    title: "FBLA One",
    description: "Everything your FBLA chapter needs, in one place.",
    type: "website",
    url: "https://fbla.one",
    siteName: "FBLA One",
  },
  twitter: {
    card: "summary_large_image",
    title: "FBLA One",
    description: "Everything your FBLA chapter needs, in one place.",
  },
  robots: { index: true, follow: true },
};

const THEME_INIT = `
(function(){try{var t=localStorage.getItem('fbla_theme');if(t!=='dark'&&t!=='light')t='dark';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        <ThemeProvider>
          <ConditionalAmbientOrbs />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
