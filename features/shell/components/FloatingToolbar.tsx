"use client"

import { useEffect, useRef } from "react"

import "@/features/shell/components/desktop-chrome.css"
import {
  DesktopDynamicIslandChrome,
  useDesktopToolbarItems,
} from "@/features/shell/components/DesktopAppearanceIsland"
import { DesktopSettingsToolbarShell } from "@/features/shell/components/DesktopSettingsToolbarShell"
import { DesktopExportDownloadPopover } from "@/features/shell/components/DesktopExportDownloadPopover"
import {
  DesktopUtilityToolbar,
} from "@/features/shell/components/DesktopUtilityToolbar"
import { MobileSettingsRail } from "@/features/shell/components/MobileSettingsRail"
import { MobileWorkspaceTopBar } from "@/features/shell/components/MobileWorkspaceTopBar"
import { DESKTOP_UTILITY_TOOLBAR_SHELL_CLASS } from "@/features/shell/components/desktop-utility-toolbar.constants"
import { DesktopFloatingInspector } from "@/features/shell/inspector/DesktopFloatingInspector"
import { useDesktopToolbarInspectorModel } from "@/features/shell/hooks/useDesktopToolbarInspectorModel"
import { DESKTOP_TOOLBAR_TOOLS } from "@/features/shell/model/desktop-toolbar-tools"
import type {
  DesktopThemeMode,
  DesktopToolbarController,
} from "@/features/shell/model/desktop-toolbar-types"
export type {
  ComposeSidebarPanel,
  DesktopBackgroundInspectorTab,
  DesktopCornersSettings,
  DesktopExportTarget,
  DesktopLayerRow,
  DesktopLogoSettings,
  DesktopLogoSourceMode,
  DesktopPatternSettings,
  DesktopShapeSettings,
  DesktopTextSettings,
  DesktopThemeMode,
  DesktopToolbarController,
  DesktopToolbarToolId,
} from "@/features/shell/model/desktop-toolbar-types"

export type { DesktopInspectorModel } from "@/features/shell/hooks/useDesktopToolbarInspectorModel"

import { DESKTOP_WORKSPACE_MOBILE_QUERY, useMediaQuery } from "@/lib/hooks/use-media-query"
import { cn } from "@/lib/utils"

export function FloatingToolbar({
  controller,
  theme,
  onThemeChange,
}: {
  controller?: DesktopToolbarController
  theme?: DesktopThemeMode
  onThemeChange?: (theme: DesktopThemeMode) => void
} = {}) {
  const model = useDesktopToolbarInspectorModel({ controller, theme, onThemeChange })
  const {
    actualActiveTool,
    actualDesktopTheme,
  } = model
  const isMobileWorkspace = useMediaQuery(DESKTOP_WORKSPACE_MOBILE_QUERY)
  const islandItems = useDesktopToolbarItems({
    appearance: controller?.appearanceSnapshot,
    appearanceLayer: controller?.selectedAppearanceLayer,
    canAddQrCode: controller?.canAddQrCode,
    canDeleteLayer: controller?.canDeleteLayer,
    insertNodeId: controller?.insertNodeId,
    layersSettings: model.actualLayersSettings,
    onAddQrCode: controller?.onAddQrCode,
    onBrowseWallpapers: controller?.onOpenComposeSidebar
      ? () => controller.onOpenComposeSidebar?.("wallpapers")
      : undefined,
    onElementLayerPatch: controller?.onElementLayerPatch,
    onAppearancePatch: controller?.onAppearancePatch,
    onInsertLayer: controller?.onInsertLayer,
    onLayerDelete: controller?.onLayerDelete,
    onLayersReorder: model.onLayersReorder,
    onLayersSettingsChange: model.onLayersSettingsChange,
    onSelectSizeTemplate: controller?.onSceneTemplateSizeTemplateSelect,
    onTransformLayerPatch: controller?.onTransformLayerPatch,
    selectedElementLayer: controller?.selectedElementLayer,
    selectedTransformLayer: controller?.selectedTransformLayer,
    sizePresetId: controller?.sceneTemplateSettings?.sizeSettings?.sizePresetId,
    theme: actualDesktopTheme,
  })
  const toolbarRootRef = useRef<HTMLElement | null>(null)

  // Measure island + utility toolbar widths into CSS vars so the island's
  // clamped left position can keep clear of both side panels.
  useEffect(() => {
    const root = toolbarRootRef.current
    if (!root) {
      return
    }

    const island = root.querySelector<HTMLElement>('[data-slot="desktop-dynamic-island"]')
    const utility = root.querySelector<HTMLElement>('[data-slot="desktop-utility-toolbar"]')
    if (!island || !utility) {
      return
    }

    const syncWidths = () => {
      const shells = island.querySelectorAll<HTMLElement>('[data-slot="tooltip-navbar-shell"]')
      // The island wraps a small history pill + the labeled pill. Center the
      // labeled pill on the canvas: offset = half the leading pill + gap.
      const leadingWidth = shells.length > 1 ? shells[0].offsetWidth : 0
      const gap = shells.length > 1 ? shells[1].offsetLeft - (shells[0].offsetLeft + leadingWidth) : 0
      root.style.setProperty("--desktop-island-width", `${island.offsetWidth}px`)
      root.style.setProperty("--desktop-island-leading-width", `${leadingWidth + gap}px`)
      root.style.setProperty("--desktop-utility-toolbar-width", `${utility.offsetWidth}px`)
    }

    syncWidths()
    const observer = new ResizeObserver(syncWidths)
    observer.observe(island)
    observer.observe(utility)
    return () => observer.disconnect()
  }, [isMobileWorkspace])

  return (
      <section
        ref={toolbarRootRef}
        aria-label="Desktop workspace prototype"
        data-desktop-theme={actualDesktopTheme}
        data-mobile-workspace={isMobileWorkspace ? "true" : "false"}
        data-slot="desktop-floating-toolbar-root"
        className="pointer-events-none absolute inset-0 z-[60] min-h-0 overflow-hidden"
        >
        {isMobileWorkspace ? (
          <>
            <MobileWorkspaceTopBar
              controller={controller}
              model={model}
              theme={actualDesktopTheme}
            />
            <MobileSettingsRail model={model} />
          </>
        ) : (
          <>
            <div data-slot="desktop-dynamic-island-anchor">
              <div
                className={cn(
                  DESKTOP_UTILITY_TOOLBAR_SHELL_CLASS,
                  "pointer-events-auto",
                )}
                data-slot="desktop-dynamic-island"
                data-toolbar-appearance="desktop-glass"
              >
                <DesktopDynamicIslandChrome items={islandItems} />
              </div>
            </div>
            <div data-slot="desktop-utility-toolbar-anchor">
              <DesktopUtilityToolbar
                data-slot="desktop-utility-toolbar"
                className="pointer-events-auto gap-0 p-0"
              >
                <DesktopExportDownloadPopover model={model} theme={actualDesktopTheme} />
              </DesktopUtilityToolbar>
            </div>
            <DesktopSettingsToolbarShell
              showInspector
              inspector={
                <DesktopFloatingInspector activeTool={actualActiveTool} model={model} />
              }
            />
          </>
        )}
      </section>
  )
}

