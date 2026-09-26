import React, { createContext, useContext, useLayoutEffect, useMemo, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'sanad-theme';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // Storage can be unavailable in a private/restricted browser context.
  }

  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useLayoutEffect(() => {
    const root = document.documentElement;

    // ── No-transition trick ────────────────────────────────────────
    // Suppress ALL CSS transitions for exactly one paint frame so the
    // theme flip is instant with zero lag from hundreds of animated
    // elements (background-image gradients, borders, shadows, etc.).
    // The CSS rule [data-theme-switching] * { transition: none !important }
    // kills every animated property for this single frame only.
    root.setAttribute('data-theme-switching', '');
    const rafId = requestAnimationFrame(() => {
      root.removeAttribute('data-theme-switching');
    });

    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#080909' : '#0D2137');

    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // The selected theme remains active for the current visit.
    }

    return () => cancelAnimationFrame(rafId);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark: theme === 'dark',
      setTheme,
      toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
