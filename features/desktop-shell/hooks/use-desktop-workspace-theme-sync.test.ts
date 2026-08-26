/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  DESKTOP_THEME_STORAGE_KEY,
  useDesktopWorkspaceThemeSync,
} from "@/features/desktop-shell/hooks/use-desktop-workspace-theme-sync"
import { act, createElement } from "react"
import { createRoot } from "react-dom/client"

function ThemeSyncHarness({ theme }: { theme: "light" | "dark" }) {
  useDesktopWorkspaceThemeSync(theme)
  return null
}

describe("useDesktopWorkspaceThemeSync", () => {
  beforeEach(() => {
    const storage = new Map<string, string>()

    vi.stubGlobal("localStorage", {
      clear: () => storage.clear(),
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add("light")
    delete document.body.dataset.desktopWorkspaceTheme
  })

  it("syncs the document root class with the workspace theme", async () => {
    const container = document.createElement("div")
    const root = createRoot(container)

    document.documentElement.classList.remove("dark")
    document.documentElement.classList.add("light")

    await act(async () => {
      root.render(createElement(ThemeSyncHarness, { theme: "dark" }))
    })

    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(document.documentElement.classList.contains("light")).toBe(false)
    expect(document.body.dataset.desktopWorkspaceTheme).toBe("dark")
    expect(window.localStorage.getItem(DESKTOP_THEME_STORAGE_KEY)).toBe("dark")

    await act(async () => {
      root.unmount()
    })

    expect(document.documentElement.classList.contains("light")).toBe(true)
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    expect(document.body.dataset.desktopWorkspaceTheme).toBeUndefined()
  })
})
