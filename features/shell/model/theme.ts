import type { ThemeMode } from "@/features/shell/model/toolbar-types";

export const THEME_STORAGE_KEY = "qrafty:studio-theme";
export const THEME_COOKIE = "qrafty-desktop-theme";

export function parseTheme(value: string | null | undefined): ThemeMode {
  return value === "light" ? "light" : "dark";
}
