import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// ─── Public Theme Context ─────────────────────────────────────────────────────
// Self-contained dark/light toggle for the public marketing page.
// Uses a CSS class on the .public-page root — no dependency on ThemeContext.

const PublicThemeContext = createContext(null);

const LS_THEME_KEY = "aero_public_theme";

export function PublicThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem(LS_THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
    // Respect OS preference on first visit
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  });

  const isDark = mode === "dark";

  const toggle = useCallback(() => {
    setModeState(prev => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem(LS_THEME_KEY, next);
      return next;
    });
  }, []);

  const setMode = useCallback((m) => {
    if (m !== "dark" && m !== "light") return;
    localStorage.setItem(LS_THEME_KEY, m);
    setModeState(m);
  }, []);

  // Apply mode class to .public-page root element
  useEffect(() => {
    const el = document.querySelector(".public-page");
    if (!el) return;
    if (mode === "light") {
      el.classList.add("public-page--light");
      el.classList.remove("public-page--dark");
    } else {
      el.classList.add("public-page--dark");
      el.classList.remove("public-page--light");
    }
  }, [mode]);

  const value = useMemo(() => ({ mode, isDark, toggle, setMode }), [mode, isDark, toggle, setMode]);

  return (
    <PublicThemeContext.Provider value={value}>
      {children}
    </PublicThemeContext.Provider>
  );
}

export function usePublicTheme() {
  const ctx = useContext(PublicThemeContext);
  if (!ctx) throw new Error("usePublicTheme must be used within PublicThemeProvider");
  return ctx;
}
