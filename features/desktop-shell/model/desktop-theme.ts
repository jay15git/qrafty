import type { DesktopThemeMode } from "@/features/desktop-shell/model/desktop-toolbar-types"

export const DESKTOP_THEME_STORAGE_KEY = "qrafty:studio-theme"
export const DESKTOP_THEME_COOKIE = "qrafty-desktop-theme"

export function parseDesktopTheme(value: string | null | undefined): DesktopThemeMode {
  return value === "light" ? "light" : "dark"
}
