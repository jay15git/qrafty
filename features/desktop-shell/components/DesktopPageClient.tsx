"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"

import { DesktopWorkspace } from "@/features/desktop-shell/components/DesktopWorkspace"
import type { DesktopThemeMode, DesktopToolbarToolId } from "@/features/desktop-shell/components/FloatingToolbar"

const DESKTOP_THEME_KEY = "new-qr:studio-theme"

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
    if (typeof window === "undefined") return "light"

    try {
      return window.localStorage.getItem(DESKTOP_THEME_KEY) === "dark" ? "dark" : "light"
    } catch {
      return "light"
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
