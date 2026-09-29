import type { ThemeMode } from "@/features/shell/model/settings-model";

export const THEME_COOKIE = "qrafty-desktop-theme";

export function parseTheme(value: string | null | undefined): ThemeMode {
  return value === "light" ? "light" : "dark";
}

/**
 * Inline head script: applies the persisted theme to `<html>` before paint so
 * `dark:` variants and `html.dark` token blocks match the cookie on first
 * render. String-inlined by the root layout so no client boundary is needed.
 */
export const THEME_INIT_SCRIPT = `(function(){var m=document.cookie.match(/(?:^|;\\s*)${THEME_COOKIE}=(light|dark)/);document.documentElement.classList.toggle("dark",!m||m[1]==="dark");})();`;
