"use client"

import { DesktopPexelsPhotoInspector } from "@/features/desktop-shell/components/DesktopPexelsPhotoInspector"
import type {
  DesktopInspectorModel,
  DesktopToolbarToolId,
} from "@/features/desktop-shell/components/FloatingToolbar"
import { DesktopNewSettingsPanel } from "@/features/desktop-shell/inspector/DesktopNewSettingsPanel"
import { DesktopnewThemeContext } from "@/features/desktop-shell/inspector/desktopnew-theme-context"
import { cn } from "@/lib/utils"

import "@/features/desktop-shell/inspector/desktopnew.css"

export function DesktopNewFloatingInspector({
  activeTool,
  className,
  model,
}: {
  activeTool: DesktopToolbarToolId | null
  className?: string
  model: DesktopInspectorModel
}) {
  const { actualDesktopTheme, controller } = model
  const showStockPhotosInspector = controller?.composeSidebarPanel === "stock-photos"

  if (showStockPhotosInspector) {
    return (
      <aside
        aria-label="Stock photos"
        className={cn("flex h-full min-h-0 min-w-0 flex-col overflow-hidden", className)}
        data-slot="desktop-floating-inspector"
      >
        <DesktopPexelsPhotoInspector
          onClose={() => controller?.onCloseComposeSidebar?.()}
          onSelectPhoto={(imageUrl) => controller?.onSelectStockPhoto?.(imageUrl)}
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
          <DesktopNewSettingsPanel fillHeight model={model} />
        </DesktopnewThemeContext.Provider>
      </div>
    </aside>
  )
}
