"use client"

import { DesktopElementInspector } from "@/features/desktop-shell/components/DesktopElementInspector"
import { DesktopPexelsPhotoInspector } from "@/features/desktop-shell/components/DesktopPexelsPhotoInspector"
import type {
  DesktopInspectorModel,
  DesktopToolbarToolId,
} from "@/features/desktop-shell/components/FloatingToolbar"
import { DesktopNewSettingsPanel } from "@/features/desktopnew/DesktopNewSettingsPanel"
import { DesktopnewThemeContext } from "@/features/desktopnew/settings-ui"
import { cn } from "@/lib/utils"

import "@/features/desktopnew/desktopnew.css"

export function DesktopNewFloatingInspector({
  activeTool,
  className,
  model,
}: {
  activeTool: DesktopToolbarToolId | null
  className?: string
  model: DesktopInspectorModel
}) {
  const { activeToolConfig, actualDesktopTheme, controller } = model
  const showStockPhotosInspector = controller?.composeSidebarPanel === "stock-photos"
  const showElementInspector =
    Boolean(controller?.selectedElementLayer) &&
    activeTool !== "layers" &&
    !activeToolConfig &&
    !showStockPhotosInspector

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

  if (showElementInspector && controller?.selectedElementLayer) {
    return (
      <aside
        aria-label={`${controller.selectedElementLayer.kind} element settings`}
        className={cn("flex h-full min-h-0 min-w-0 flex-col overflow-hidden", className)}
        data-slot="desktop-floating-inspector"
      >
        <DesktopElementInspector
          layer={controller.selectedElementLayer}
          onPatch={(patch) => controller.onElementLayerPatch?.(patch)}
        />
      </aside>
    )
  }

  return (
    <aside
      aria-label="Settings"
      className={cn("flex h-full min-h-0 min-w-0 flex-col overflow-hidden", className)}
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
