"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type Theme = "dark" | "light";
type Ctx = { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void };

const ThemeContext = createContext<Ctx | null>(null);

/** Only an explicit choice (the toggle or Settings) is stored. Everyone else gets light. */
const KEY = "chapterprep_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const firstRun = useRef(true);

  // Adopt what the inline script in app/layout.tsx already applied before paint.
  useEffect(() => {
    if (document.documentElement.getAttribute("data-theme") === "dark") setThemeState("dark");
  }, []);

  // Skip the first run: the inline script already set the attribute, and the
  // initial "light" state must not overwrite a stored dark choice.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const choose = (t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* localStorage may be unavailable in private mode */
    }
  };

  const value: Ctx = {
    theme,
    setTheme: choose,
    toggle: () => choose(theme === "dark" ? "light" : "dark"),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
