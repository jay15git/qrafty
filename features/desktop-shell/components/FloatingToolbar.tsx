"use client"

import "@/features/desktop-shell/components/desktop-chrome.css"
import { DesktopDynamicIslandChrome } from "@/features/desktop-shell/components/DesktopAppearanceIsland"
import { DesktopSettingsToolbarShell } from "@/features/desktop-shell/components/DesktopSettingsToolbarShell"
import { DesktopExportDownloadPopover } from "@/features/desktop-shell/components/DesktopExportDownloadPopover"
import {
  DesktopUtilityToolbar,
} from "@/features/desktop-shell/components/DesktopUtilityToolbar"
import { MobileFamilyDrawer } from "@/features/desktop-shell/components/MobileFamilyDrawer"
import { MobileWorkspaceTopBar } from "@/features/desktop-shell/components/MobileWorkspaceTopBar"
import { DESKTOP_UTILITY_TOOLBAR_SHELL_CLASS } from "@/features/desktop-shell/components/desktop-utility-toolbar.constants"
import { DesktopNewFloatingInspector } from "@/features/desktop-shell/inspector/DesktopNewFloatingInspector"
import { useDesktopToolbarInspectorModel } from "@/features/desktop-shell/hooks/useDesktopToolbarInspectorModel"
import { DESKTOP_TOOLBAR_TOOLS } from "@/features/desktop-shell/model/desktop-toolbar-tools"
import type {
  DesktopThemeMode,
  DesktopToolbarController,
} from "@/features/desktop-shell/model/desktop-toolbar-types"
export type {
  ComposeSidebarPanel,
  DesktopAccessibilitySettings,
  DesktopBackgroundInspectorTab,
  DesktopBackgroundSettings,
  DesktopCornersSettings,
  DesktopEffectsSettings,
  DesktopEncodingSettings,
  DesktopExportMediaKind,
  DesktopExportSettings,
  DesktopExportTarget,
  DesktopImageSettings,
  DesktopLayerRow,
  DesktopLayersSettings,
  DesktopLogoSettings,
  DesktopLogoSettingsPatch,
  DesktopLogoSourceMode,
  DesktopMotionSettings,
  DesktopPatternSettings,
  DesktopPatternSettingsPatch,
  DesktopExportScale,
  DesktopSceneTemplateSettings,
  DesktopShapeSettings,
  DesktopTextSettings,
  DesktopThemeMode,
  DesktopToolbarController,
  DesktopToolbarToolId,
  DesktopLayoutSettings,
} from "@/features/desktop-shell/model/desktop-toolbar-types"
export type { DesktopInspectorModel } from "@/features/desktop-shell/hooks/useDesktopToolbarInspectorModel"
export { useDesktopToolbarInspectorModel } from "@/features/desktop-shell/hooks/useDesktopToolbarInspectorModel"

import { DESKTOP_WORKSPACE_MOBILE_QUERY, useMediaQuery } from "@/hooks/use-media-query"
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

  return (
      <section
        aria-label="Desktop workspace prototype"
        data-desktop-theme={actualDesktopTheme}
        data-mobile-workspace={isMobileWorkspace ? "true" : "false"}
        data-slot="desktop-floating-toolbar-root"
        className={cn(
          "relative min-h-dvh overflow-hidden transition-colors duration-200",
          actualDesktopTheme === "light" ? "bg-[#f4f6f9]" : "bg-[#07080a]",
        )}
        >
        {isMobileWorkspace ? (
          <>
            <MobileWorkspaceTopBar
              controller={controller}
              model={model}
              theme={actualDesktopTheme}
            />
            <MobileFamilyDrawer model={model} />
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
                <DesktopDynamicIslandChrome
                  appearance={controller?.appearanceSnapshot}
                  appearanceLayer={controller?.selectedAppearanceLayer}
                  activeCanvasTool={controller?.canvasTool}
                  activePaneId={controller?.insertNodeId}
                  canRedo={controller?.canRedo}
                  canUndo={controller?.canUndo}
                  onCanvasToolChange={controller?.onCanvasToolChange}
                  onElementLayerPatch={controller?.onElementLayerPatch}
                  onAppearancePatch={controller?.onAppearancePatch}
                  onRedo={controller?.onRedo}
                  onSelectSizeTemplate={controller?.onSceneTemplateSizeTemplateSelect}
                  onSnapEnabledChange={controller?.onSnapEnabledChange}
                  onThemeChange={model.onDesktopThemeChange}
                  onTransformLayerPatch={controller?.onTransformLayerPatch}
                  onUndo={controller?.onUndo}
                  selectedElementLayer={controller?.selectedElementLayer}
                  selectedTransformLayer={controller?.selectedTransformLayer}
                  snapEnabled={controller?.snapEnabled}
                  sizePresetId={controller?.sceneTemplateSettings?.sizeSettings?.sizePresetId}
                  theme={actualDesktopTheme}
                />
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
                <DesktopNewFloatingInspector activeTool={actualActiveTool} model={model} />
              }
            />
          </>
        )}
      </section>
  )
}

export { DESKTOP_TOOLBAR_TOOLS }
