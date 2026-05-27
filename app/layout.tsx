import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FBLA One — The all-in-one FBLA chapter platform",
  description:
    "Competition guides, study resources, prep tracker, and chapter management for FBLA chapters. Built for FBLA students, by an FBLA student.",
  metadataBase: new URL("https://fbla.one"),
  openGraph: {
    title: "FBLA One",
    description: "The all-in-one FBLA chapter platform.",
    type: "website",
  },
};

const THEME_INIT = `
(function(){try{var t=localStorage.getItem('fbla_theme');if(t!=='dark'&&t!=='light')t='dark';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
