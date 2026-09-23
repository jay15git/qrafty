"use client"

import { useSearchParams } from "next/navigation"

import { Workspace } from "@/features/shell/components/Workspace"
import type { ThemeMode, ToolbarToolId } from "@/features/shell/components/FloatingToolbar"

type WorkspacePageClientProps = {
  fontClassName: string
  initialTheme: ThemeMode
}

function resolveInitialTool(source: string | null): ToolbarToolId | undefined {
  return source === "prompt" || source === "blank" ? "content" : undefined
}

export function WorkspacePageClient({ fontClassName, initialTheme }: WorkspacePageClientProps) {
  const searchParams = useSearchParams()
  const source = searchParams.get("source")

  return (
    <Workspace
      fontClassName={fontClassName}
      initialTheme={initialTheme}
      initialActiveTool={resolveInitialTool(source)}
    />
  )
}
