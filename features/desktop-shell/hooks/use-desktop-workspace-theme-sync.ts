"use client"

import { useEffect } from "react"

import type { DesktopThemeMode } from "@/features/desktop-shell/model/desktop-toolbar-types"

export const DESKTOP_THEME_STORAGE_KEY = "new-qr:studio-theme"

export function useDesktopWorkspaceThemeSync(theme: DesktopThemeMode) {
  useEffect(() => {
    const root = document.documentElement
    const body = document.body

    root.classList.remove("light", "dark")
    root.classList.add(theme)
    body.dataset.desktopWorkspaceTheme = theme

    try {
      window.localStorage.setItem(DESKTOP_THEME_STORAGE_KEY, theme)
    } catch {
      // Ignore private-mode storage failures.
    }

    return () => {
      root.classList.remove("light", "dark")
      root.classList.add("light")
      delete body.dataset.desktopWorkspaceTheme
    }
  }, [theme])
}
