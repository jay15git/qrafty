"use client"

import { DesktopWallpaperInspector } from "@/features/desktop-shell/components/DesktopWallpaperInspector"
import type {
  DesktopInspectorModel,
  DesktopToolbarToolId,
} from "@/features/desktop-shell/components/FloatingToolbar"
import { DesktopSettingsPanel } from "@/features/desktop-shell/inspector/DesktopSettingsPanel"
import { DesktopnewThemeContext } from "@/features/desktop-shell/inspector/theme-context"
import { cn } from "@/lib/utils"

import "@/features/desktop-shell/inspector/inspector.css"

export function DesktopFloatingInspector({
  activeTool,
  className,
  model,
}: {
  activeTool: DesktopToolbarToolId | null
  className?: string
  model: DesktopInspectorModel
}) {
  const { actualDesktopTheme, controller } = model
  const showWallpapersInspector = controller?.composeSidebarPanel === "wallpapers"

  if (showWallpapersInspector) {
    return (
      <aside
        aria-label="Wallpapers"
        className={cn("flex h-full min-h-0 min-w-0 flex-col overflow-hidden", className)}
        data-slot="desktop-floating-inspector"
      >
        <DesktopWallpaperInspector
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
      data-slot="desktopnew-settings-inspector"
    >
      <div
        className="desktopnew-root desktopnew-embedded h-full min-h-0 w-full"
        data-theme={actualDesktopTheme}
      >
        <DesktopnewThemeContext.Provider value={actualDesktopTheme}>
          <DesktopSettingsPanel fillHeight model={model} />
        </DesktopnewThemeContext.Provider>
      </div>
    </aside>
  )
}
