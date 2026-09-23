"use client"

import { WallpaperInspector } from "@/features/shell/components/WallpaperInspector"
import type {
  InspectorModel,
  ToolbarToolId,
} from "@/features/shell/components/FloatingToolbar"
import { SettingsPanel } from "@/features/shell/inspector/SettingsPanel"
import { InspectorThemeContext } from "@/features/shell/inspector/theme-context"
import { cn } from "@/lib/utils"

import "@/features/shell/inspector/inspector.css"

export function FloatingInspector({
  activeTool,
  className,
  model,
}: {
  activeTool: ToolbarToolId | null
  className?: string
  model: InspectorModel
}) {
  const { actualTheme, controller } = model
  const showWallpapersInspector = controller?.composeSidebarPanel === "wallpapers"

  if (showWallpapersInspector) {
    return (
      <aside
        aria-label="Wallpapers"
        className={cn("flex h-full min-h-0 min-w-0 flex-col overflow-hidden", className)}
        data-slot="floating-inspector"
      >
        <WallpaperInspector
          onClose={() => controller?.onCloseComposeSidebar?.()}
          onSelectWallpaper={(imagePath) => controller?.onSelectWallpaper?.(imagePath)}
        />
      </aside>
    )
  }

  return (
    <aside
      aria-label="Settings"
      className={cn("flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden", className)}
      data-slot="settings-inspector"
    >
      <div
        className="inspector-root inspector-embedded h-full min-h-0 w-full"
        data-theme={actualTheme}
      >
        <InspectorThemeContext.Provider value={actualTheme}>
          <SettingsPanel fillHeight model={model} />
        </InspectorThemeContext.Provider>
      </div>
    </aside>
  )
}
