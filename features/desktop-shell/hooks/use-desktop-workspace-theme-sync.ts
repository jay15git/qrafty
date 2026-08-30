"use client"

import { useLayoutEffect, useRef } from "react"

import type { DesktopThemeMode } from "@/features/desktop-shell/model/desktop-toolbar-types"
import {
  DESKTOP_THEME_COOKIE,
  DESKTOP_THEME_STORAGE_KEY,
  parseDesktopTheme,
} from "@/features/desktop-shell/model/desktop-theme"

export { DESKTOP_THEME_COOKIE, DESKTOP_THEME_STORAGE_KEY, parseDesktopTheme }

export function readStoredDesktopTheme(): DesktopThemeMode | null {
  try {
    const stored = window.localStorage.getItem(DESKTOP_THEME_STORAGE_KEY)
    return stored === "light" || stored === "dark" ? stored : null
  } catch {
    return null
  }
}

function persistDesktopTheme(theme: DesktopThemeMode) {
  try {
    window.localStorage.setItem(DESKTOP_THEME_STORAGE_KEY, theme)
  } catch {
    // Ignore private-mode storage failures.
  }

  document.cookie = `${DESKTOP_THEME_COOKIE}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`
}

function applyDocumentTheme(theme: DesktopThemeMode) {
  const root = document.documentElement
  const body = document.body

  root.classList.remove("light", "dark")
  root.classList.add(theme)
  body.dataset.desktopWorkspaceTheme = theme
}

function resetDocumentTheme() {
  const root = document.documentElement

  root.classList.remove("light", "dark")
  root.classList.add("light")
  delete document.body.dataset.desktopWorkspaceTheme
}

export function useDesktopWorkspaceThemeSync(
  theme: DesktopThemeMode,
  setTheme?: (theme: DesktopThemeMode) => void,
) {
  const didRestore = useRef(false)

  useLayoutEffect(() => {
    let next = theme

    if (setTheme && !didRestore.current) {
      didRestore.current = true
      const stored = readStoredDesktopTheme()
      if (stored && stored !== theme) {
        next = stored
        setTheme(stored)
      }
    }

    applyDocumentTheme(next)
    persistDesktopTheme(next)

    return resetDocumentTheme
  }, [setTheme, theme])
}
