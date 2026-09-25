import type { Metadata, Viewport } from "next";
import { Inter, Space_Mono, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ConditionalAmbientOrbs } from "@/components/ConditionalAmbientOrbs";
import { DataSync } from "@/components/DataSync";
import { GlobalShell } from "@/components/GlobalShell";
import "./globals.css";

/**
 * Self-hosted from our own origin. The previous @import in globals.css was
 * invisible to the HTML preload scanner, so the font CSS could not even start
 * until globals.css had downloaded and parsed, then needed a third origin hop
 * for the woff2 files. Measured as a serialized ~270ms chain before webfont
 * text could paint. next/font also generates a size-adjusted fallback, which
 * removes the layout shift on swap.
 *
 * Inter and Space Grotesk are variable fonts, so the full weight range costs
 * the same as a single weight. Space Mono is static, hence the explicit list.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-space-mono",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#060c16" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://chapterprep.com"),
  title: {
    default: "ChapterPrep - The all-in-one FBLA chapter platform",
    template: "%s · ChapterPrep",
  },
  description:
    "Competition guides, study resources, prep tracker, deadline calendar, and chapter management for FBLA chapters. Built for FBLA students, by an FBLA student.",
  applicationName: "ChapterPrep",
  appleWebApp: { capable: true, title: "ChapterPrep", statusBarStyle: "black-translucent" },
  authors: [{ name: "ChapterPrep" }],
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
    title: "ChapterPrep",
    description: "Everything your FBLA chapter needs, in one place.",
    type: "website",
    url: "https://chapterprep.com",
    siteName: "ChapterPrep",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ChapterPrep" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChapterPrep",
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${spaceMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        <ThemeProvider>
          {/* First tab stop on every page. GlobalShell renders the feedback and
              AI-chat FABs, which used to sit before {children} and stole the
              first two tab stops site-wide. */}
          <a href="#main" className="skip-link">Skip to content</a>
          <DataSync />
          <ConditionalAmbientOrbs />
          {children}
          <GlobalShell />
        </ThemeProvider>
      </body>
    </html>
  );
}
