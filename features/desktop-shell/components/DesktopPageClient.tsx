"use client"

import { useSearchParams } from "next/navigation"

import { DesktopWorkspace } from "@/features/desktop-shell/components/DesktopWorkspace"
import type { DesktopThemeMode, DesktopToolbarToolId } from "@/features/desktop-shell/components/FloatingToolbar"

type DesktopPageClientProps = {
  fontClassName: string
  initialTheme: DesktopThemeMode
}

function resolveInitialTool(source: string | null): DesktopToolbarToolId | undefined {
  return source === "prompt" || source === "blank" ? "content" : undefined
}

export function DesktopPageClient({ fontClassName, initialTheme }: DesktopPageClientProps) {
  const searchParams = useSearchParams()
  const source = searchParams.get("source")

  return (
    <DesktopWorkspace
      fontClassName={fontClassName}
      initialTheme={initialTheme}
      initialActiveTool={resolveInitialTool(source)}
    />
  )
}
