"use client";

import { useLayoutEffect, useRef } from "react";

import type { ThemeMode } from "@/features/shell/model/toolbar-types";
import { THEME_COOKIE, THEME_STORAGE_KEY, parseTheme } from "@/features/shell/model/theme";

export { THEME_COOKIE, THEME_STORAGE_KEY };

function readStoredTheme(): ThemeMode | null {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

function persistTheme(theme: ThemeMode) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore private-mode storage failures.
  }

  document.cookie = `${THEME_COOKIE}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

function applyDocumentTheme(theme: ThemeMode) {
  const root = document.documentElement;
  const body = document.body;

  root.classList.remove("light", "dark");
  root.classList.add(theme);
  body.dataset.workspaceTheme = theme;
}

function resetDocumentTheme() {
  const root = document.documentElement;

  root.classList.remove("light", "dark");
  root.classList.add("light");
  delete document.body.dataset.workspaceTheme;
}

export function useWorkspaceThemeSync(theme: ThemeMode, setTheme?: (theme: ThemeMode) => void) {
  const didRestore = useRef(false);

  useLayoutEffect(() => {
    let next = theme;

    if (setTheme && !didRestore.current) {
      didRestore.current = true;
      const stored = readStoredTheme();
      if (stored && stored !== theme) {
        next = stored;
        setTheme(stored);
      }
    }

    applyDocumentTheme(next);
    persistTheme(next);

    return resetDocumentTheme;
  }, [setTheme, theme]);
}
