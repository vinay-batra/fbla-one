import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ConditionalAmbientOrbs } from "@/components/ConditionalAmbientOrbs";
import { DataSync } from "@/components/DataSync";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#060c16" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://fbla.one"),
  title: {
    default: "FBLA One - The all-in-one FBLA chapter platform",
    template: "%s · FBLA One",
  },
  description:
    "Competition guides, study resources, prep tracker, deadline calendar, and chapter management for FBLA chapters. Built for FBLA students, by an FBLA student.",
  applicationName: "FBLA One",
  appleWebApp: { capable: true, title: "FBLA One", statusBarStyle: "black-translucent" },
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
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "FBLA One" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FBLA One",
    description: "Everything your FBLA chapter needs, in one place.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
          <DataSync />
          <ConditionalAmbientOrbs />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
