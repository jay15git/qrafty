"use client"

import { WorkspaceSurface } from "@/features/workspace/components/WorkspaceSurface"
import {
  FloatingToolbar,
  type DesktopThemeMode,
  type DesktopToolbarToolId,
} from "@/features/desktop-shell/components/FloatingToolbar"
import { useDesktopWorkspaceThemeSync } from "@/features/desktop-shell/hooks/use-desktop-workspace-theme-sync"
import "@/features/workspace/workspace-tokens.css"
import { DesktopWorkspaceStyles } from "@/features/desktop-shell/components/desktop-workspace-styles"
import { DESKTOP_WORKSPACE_MOBILE_QUERY, useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { useState, type CSSProperties } from "react"

type DesktopWorkspaceProps = {
  fontClassName?: string
  initialTheme?: DesktopThemeMode
  initialActiveTool?: DesktopToolbarToolId
}

const DEPLOYMENT_COMMIT_SHA =
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
  process.env.VERCEL_GIT_COMMIT_SHA ??
  undefined

export function DesktopWorkspace({
  fontClassName,
  initialTheme = "dark",
  initialActiveTool,
}: DesktopWorkspaceProps) {
  const [desktopTheme, setDesktopTheme] = useState<DesktopThemeMode>(initialTheme)
  const isMobileWorkspace = useMediaQuery(DESKTOP_WORKSPACE_MOBILE_QUERY)
  useDesktopWorkspaceThemeSync(desktopTheme)
  const workspaceTone = {
    "--workspace-shell": desktopTheme === "light" ? "#ffffff" : "#07080a",
    "--workspace-page": desktopTheme === "light" ? "#ffffff" : "#07080a",
    "--ws-canvas-bg": desktopTheme === "light" ? "#f0f1f2" : "#1f1f1f",
    "--ws-workspace-bg": desktopTheme === "light" ? "#f0f1f2" : "#1f1f1f",
    "--ws-surface-bg": desktopTheme === "light" ? "#f0f1f2" : "#1f1f1f",
  } as CSSProperties

  return (
    <section
      aria-label="Desktop workspace"
      data-desktop-theme={desktopTheme}
      data-mobile-workspace={isMobileWorkspace ? "true" : "false"}
      data-slot="desktop-workspace"
      data-vercel-git-commit-sha={DEPLOYMENT_COMMIT_SHA}
      style={workspaceTone}
      className={cn(
        fontClassName,
        desktopTheme === "dark" && "dark",
        "relative h-dvh min-h-dvh overflow-hidden transition-colors duration-200",
        desktopTheme === "light" ? "bg-white text-neutral-950" : "bg-workspace-page text-white",
      )}
    >
      <WorkspaceSurface
        desktopTheme={desktopTheme}
        fontClassName={fontClassName}
        initialActiveTool={initialActiveTool}
        onDesktopThemeChange={setDesktopTheme}
        paneToolbarVariant="desktop-zoom"
        renderOverlay={(controller) => (
          <FloatingToolbar
            controller={controller}
            theme={desktopTheme}
            onThemeChange={setDesktopTheme}
          />
        )}
      />
      <DesktopWorkspaceStyles />
    </section>
  )
}
