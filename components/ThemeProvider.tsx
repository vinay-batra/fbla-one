"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light";
type Ctx = { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void };

const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("fbla_theme") : null;
    if (stored === "dark" || stored === "light") {
      setThemeState(stored);
    } else {
      const current = document.documentElement.getAttribute("data-theme");
      if (current === "dark" || current === "light") setThemeState(current);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("fbla_theme", theme);
    } catch {
      /* localStorage may be unavailable in private mode */
    }
  }, [theme]);

  const value: Ctx = {
    theme,
    setTheme: setThemeState,
    toggle: () => setThemeState((p) => (p === "dark" ? "light" : "dark")),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
