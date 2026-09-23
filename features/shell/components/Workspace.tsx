"use client"

import { DraftingCanvas } from "@/features/canvas/components/DraftingCanvas"
import BlurFadeThemeTransition from "@/components/ui/BlurFadeThemeTransition"
import {
  FloatingToolbar,
  type ThemeMode,
  type ToolbarToolId,
} from "@/features/shell/components/FloatingToolbar"
import { useWorkspaceThemeSync } from "@/features/shell/hooks/use-workspace-theme-sync"
import { InspectorThemeContext } from "@/features/shell/inspector/theme-context"
import "@/features/canvas/workspace-tokens.css"
import { WorkspaceStyles } from "@/features/shell/components/workspace-styles"
import { WorkspaceEntrance } from "@/features/shell/components/WorkspaceEntrance"
import { CuelumeProvider } from "@/features/shell/hooks/use-cuelume"
import { WORKSPACE_MOBILE_QUERY, useMediaQuery } from "@/lib/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { useState, type CSSProperties } from "react"

type WorkspaceProps = {
  fontClassName?: string
  initialTheme?: ThemeMode
  initialActiveTool?: ToolbarToolId
}

const DEPLOYMENT_COMMIT_SHA =
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
  process.env.VERCEL_GIT_COMMIT_SHA ??
  undefined

export function Workspace({
  fontClassName,
  initialTheme = "dark",
  initialActiveTool,
}: WorkspaceProps) {
  const [theme, setTheme] = useState<ThemeMode>(initialTheme)
  const isMobileWorkspace = useMediaQuery(WORKSPACE_MOBILE_QUERY)
  useWorkspaceThemeSync(theme, setTheme)
  const workspaceTone = {
    "--canvas-shell": theme === "light" ? "#f0f1f2" : "#000000",
    "--canvas-page-bg": theme === "light" ? "#f0f1f2" : "#000000",
    "--canvas-bg": theme === "light" ? "#f0f1f2" : "#000000",
    "--canvas-surface-bg": theme === "light" ? "#f0f1f2" : "#000000",
  } as CSSProperties

  return (
    <section
      aria-label="Workspace"
      data-shell-theme={theme}
      data-mobile-workspace={isMobileWorkspace ? "true" : "false"}
      data-slot="workspace"
      data-vercel-git-commit-sha={DEPLOYMENT_COMMIT_SHA}
      style={workspaceTone}
      className={cn(
        fontClassName,
        theme === "dark" && "dark",
        "relative h-dvh min-h-0 overflow-hidden transition-colors duration-200",
        theme === "light" ? "bg-[#f0f1f2] text-neutral-950" : "bg-(--canvas-page-bg) text-white",
      )}
    >
      <InspectorThemeContext.Provider value={theme}>
      <CuelumeProvider>
        <BlurFadeThemeTransition theme={theme} onThemeChange={setTheme}>
          <WorkspaceEntrance theme={theme}>
            <DraftingCanvas
              theme={theme}
              fontClassName={fontClassName}
              initialActiveTool={initialActiveTool}
              onThemeChange={setTheme}
              paneToolbarVariant="zoom"
              renderOverlay={(controller) => (
                <FloatingToolbar
                  controller={controller}
                  theme={theme}
                  onThemeChange={setTheme}
                />
              )}
            />
          </WorkspaceEntrance>
        </BlurFadeThemeTransition>
      </CuelumeProvider>
      </InspectorThemeContext.Provider>
      <WorkspaceStyles />
    </section>
  )
}
