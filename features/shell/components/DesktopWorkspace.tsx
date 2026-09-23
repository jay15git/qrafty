"use client"

import { WorkspaceSurface } from "@/features/canvas/components/WorkspaceSurface"
import BlurFadeThemeTransition from "@/components/ui/BlurFadeThemeTransition"
import {
  FloatingToolbar,
  type DesktopThemeMode,
  type DesktopToolbarToolId,
} from "@/features/shell/components/FloatingToolbar"
import { useDesktopWorkspaceThemeSync } from "@/features/shell/hooks/use-desktop-workspace-theme-sync"
import { DesktopnewThemeContext } from "@/features/shell/inspector/theme-context"
import "@/features/canvas/workspace-tokens.css"
import { DesktopWorkspaceStyles } from "@/features/shell/components/desktop-workspace-styles"
import { DesktopWorkspaceEntrance } from "@/features/shell/components/DesktopWorkspaceEntrance"
import { DesktopCuelumeProvider } from "@/features/shell/hooks/use-desktop-cuelume"
import { DESKTOP_WORKSPACE_MOBILE_QUERY, useMediaQuery } from "@/lib/hooks/use-media-query"
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
  useDesktopWorkspaceThemeSync(desktopTheme, setDesktopTheme)
  const workspaceTone = {
    "--canvas-shell": desktopTheme === "light" ? "#f0f1f2" : "#000000",
    "--canvas-page-bg": desktopTheme === "light" ? "#f0f1f2" : "#000000",
    "--canvas-bg": desktopTheme === "light" ? "#f0f1f2" : "#000000",
    "--canvas-surface-bg": desktopTheme === "light" ? "#f0f1f2" : "#000000",
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
        "relative h-dvh min-h-0 overflow-hidden transition-colors duration-200",
        desktopTheme === "light" ? "bg-[#f0f1f2] text-neutral-950" : "bg-(--canvas-page-bg) text-white",
      )}
    >
      <DesktopnewThemeContext.Provider value={desktopTheme}>
      <DesktopCuelumeProvider>
        <BlurFadeThemeTransition theme={desktopTheme} onThemeChange={setDesktopTheme}>
          <DesktopWorkspaceEntrance theme={desktopTheme}>
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
          </DesktopWorkspaceEntrance>
        </BlurFadeThemeTransition>
      </DesktopCuelumeProvider>
      </DesktopnewThemeContext.Provider>
      <DesktopWorkspaceStyles />
    </section>
  )
}
