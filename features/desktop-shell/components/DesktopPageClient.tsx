"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"

import { DesktopWorkspace } from "@/features/desktop-shell/components/DesktopWorkspace"
import type { DesktopThemeMode, DesktopToolbarToolId } from "@/features/desktop-shell/components/FloatingToolbar"
import { DESKTOP_THEME_STORAGE_KEY } from "@/features/desktop-shell/hooks/use-desktop-workspace-theme-sync"

type DesktopPageClientProps = {
  fontClassName: string
}

function resolveInitialTool(source: string | null): DesktopToolbarToolId | undefined {
  return source === "prompt" || source === "blank" ? "content" : undefined
}

export function DesktopPageClient({ fontClassName }: DesktopPageClientProps) {
  const searchParams = useSearchParams()
  const source = searchParams.get("source")
  const [initialTheme] = React.useState<DesktopThemeMode>(() => {
    if (typeof window === "undefined") return "dark"

    try {
      return window.localStorage.getItem(DESKTOP_THEME_STORAGE_KEY) === "light" ? "light" : "dark"
    } catch {
      return "dark"
    }
  })

  return (
    <DesktopWorkspace
      fontClassName={fontClassName}
      initialTheme={initialTheme}
      initialActiveTool={resolveInitialTool(source)}
    />
  )
}
