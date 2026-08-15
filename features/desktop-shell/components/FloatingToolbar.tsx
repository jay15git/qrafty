"use client"

import {
  Download02Icon,
  SaveIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import "@/features/desktop-shell/components/desktop-chrome.css"
import { DesktopDynamicIslandChrome } from "@/features/desktop-shell/components/DesktopAppearanceIsland"
import { DesktopSettingsToolbarShell } from "@/features/desktop-shell/components/DesktopSettingsToolbarShell"
import {
  DesktopUtilityToolbar,
  DesktopUtilityToolbarButton,
} from "@/features/desktop-shell/components/DesktopUtilityToolbar"
import { DESKTOP_UTILITY_TOOLBAR_SHELL_CLASS } from "@/features/desktop-shell/components/desktop-utility-toolbar.constants"
import { DesktopTooltip } from "@/features/desktop-shell/components/DesktopTooltip"
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
  DesktopRasterExportPresetId,
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
    activeToolConfig,
  } = model

  return (
      <section
        aria-label="Desktop workspace prototype"
        data-desktop-theme={actualDesktopTheme}
        data-slot="desktop-floating-toolbar-root"
        className={cn(
          "relative min-h-dvh overflow-hidden transition-colors duration-200",
          actualDesktopTheme === "light" ? "bg-[#f4f6f9]" : "bg-[#07080a]",
        )}
      >
        <div
          data-slot="desktop-dynamic-island-anchor"
        >
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
              canRedo={controller?.canRedo}
              canUndo={controller?.canUndo}
              isFreeEditingEnabled={controller?.isFreeEditingEnabled ?? true}
              onFreeEditingChange={(enabled) =>
                controller?.onEditingModeChange?.(enabled ? "free" : "template")
              }
              onPatch={controller?.onAppearancePatch}
              onRedo={controller?.onRedo}
              onSelectSizeTemplate={controller?.onSceneTemplateSizeTemplateSelect}
              onThemeChange={model.onDesktopThemeChange}
              onUndo={controller?.onUndo}
              sizePresetId={controller?.sceneTemplateSettings?.sizeSettings?.sizePresetId}
              theme={actualDesktopTheme}
            />
          </div>
        </div>
        <div data-slot="desktop-utility-toolbar-anchor">
          <DesktopUtilityToolbar
            data-slot="desktop-utility-toolbar"
            className="pointer-events-auto"
          >
            <DesktopTooltip content="Save" side="left" sideOffset={10}>
              <DesktopUtilityToolbarButton
                aria-label="Save"
                data-slot="desktop-save-trigger"
                onClick={() => controller?.onSave?.()}
              >
                <HugeiconsIcon
                  icon={SaveIcon}
                  size={16}
                  color="currentColor"
                  strokeWidth={1.8}
                />
              </DesktopUtilityToolbarButton>
            </DesktopTooltip>
            <DesktopTooltip content="Download" side="left" sideOffset={10}>
              <DesktopUtilityToolbarButton
                aria-label="Download"
                data-slot="desktop-download-trigger"
                onClick={() => controller?.onExportDownload?.()}
              >
                <HugeiconsIcon
                  icon={Download02Icon}
                  size={16}
                  color="currentColor"
                  strokeWidth={1.8}
                />
              </DesktopUtilityToolbarButton>
            </DesktopTooltip>
          </DesktopUtilityToolbar>
        </div>
        <DesktopSettingsToolbarShell
          showInspector={Boolean(
            activeToolConfig || controller?.selectedElementLayer || controller?.composeSidebarPanel,
          )}
          inspector={
            <DesktopNewFloatingInspector activeTool={actualActiveTool} model={model} />
          }
        />
      </section>
  )
}

export { DESKTOP_TOOLBAR_TOOLS }
