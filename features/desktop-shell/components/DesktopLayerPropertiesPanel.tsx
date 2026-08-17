"use client"

import { useState } from "react"

import {
  AppearanceOpacityControls,
  AppearanceOutlineControls,
  AppearanceRadiusControls,
} from "@/features/desktop-shell/components/AppearancePopoverControls"
import { DesktopEffectsAccordion } from "@/features/desktop-shell/components/DesktopEffectsAccordion"
import {
  DesktopLayerStyleInspector,
  DesktopTransformSection,
} from "@/features/desktop-shell/components/DesktopElementInspector"
import {
  DESKTOP_INSPECTOR_CAPTION_CLASS,
  DESKTOP_INSPECTOR_SECTION_GAP_CLASS,
} from "@/features/desktop-shell/components/desktop-inspector-tokens"
import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import type { DesktopAppearanceSnapshot } from "@/features/desktop-shell/model/appearance"
import {
  getDesktopLayerToolbarCapabilities,
  getLayerPropertyTabLabel,
  type LayerPropertyTab,
} from "@/features/desktop-shell/model/layer-toolbar-capabilities"
import { DesktopnewThemeContext } from "@/features/desktop-shell/inspector/desktopnew-theme-context"
import { SegmentTabs } from "@/features/desktop-shell/inspector/settings-ui"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import { cn } from "@/lib/utils"

import "@/features/desktop-shell/inspector/desktopnew.css"

export function DesktopLayerPropertiesPanel({
  appearance,
  appearanceLayer,
  elementLayer,
  maxEffects,
  onAppearancePatch,
  onElementLayerPatch,
  onTransformLayerPatch,
  propertyTabs,
  showStyleInDesign,
  theme,
  transformLayer,
}: {
  appearance?: DesktopAppearanceSnapshot | null
  appearanceLayer?: DraftingCanvasLayer | null
  elementLayer?: DraftingCanvasLayer | null
  maxEffects?: number
  onAppearancePatch?: (patch: Partial<DraftingCanvasLayer>) => void
  onElementLayerPatch?: (patch: Partial<DraftingCanvasLayer>) => void
  onTransformLayerPatch?: (patch: Partial<DraftingCanvasLayer>) => void
  propertyTabs?: LayerPropertyTab[]
  showStyleInDesign?: boolean
  theme: DesktopThemeMode
  transformLayer?: DraftingCanvasLayer | null
}) {
  const layer = transformLayer ?? elementLayer ?? appearanceLayer ?? null
  const capabilities = getDesktopLayerToolbarCapabilities(layer, appearance)
  const tabs = propertyTabs ?? capabilities.propertyTabs
  const [activeTab, setActiveTab] = useState<LayerPropertyTab>(tabs[0] ?? "transform")

  const resolvedTab = tabs.includes(activeTab) ? activeTab : tabs[0] ?? "transform"
  const designLayer = elementLayer ?? appearanceLayer
  const designPatch = elementLayer ? onElementLayerPatch : onAppearancePatch
  const effectsLayer = elementLayer ?? appearanceLayer
  const effectsPatch = elementLayer ? onElementLayerPatch : onAppearancePatch

  if (!layer) {
    return (
      <p
        className={cn(DESKTOP_INSPECTOR_CAPTION_CLASS, "px-3 py-5 text-center")}
        data-slot="desktop-layer-properties-empty"
      >
        Select a layer to edit properties.
      </p>
    )
  }

  return (
    <div
      className="desktopnew-root desktopnew-embedded flex min-w-0 flex-col"
      data-slot="desktop-layer-properties-panel"
      data-theme={theme}
    >
      {tabs.length > 1 ? (
        <div className="px-3 pt-2.5">
          <SegmentTabs
            items={tabs.map((tab) => getLayerPropertyTabLabel(tab, layer))}
            value={getLayerPropertyTabLabel(resolvedTab, layer)}
            onChange={(label) => {
              const nextTab = tabs.find((tab) => getLayerPropertyTabLabel(tab, layer) === label)
              if (nextTab) {
                setActiveTab(nextTab)
              }
            }}
          />
        </div>
      ) : null}

      <div className="px-3 py-3" data-slot="desktop-layer-properties-body">
        {resolvedTab === "transform" && transformLayer && onTransformLayerPatch ? (
          <DesktopTransformSection
            layer={transformLayer}
            onPatch={onTransformLayerPatch}
            variant="flat"
          />
        ) : null}

        {resolvedTab === "design" ? (
          <div className="grid gap-3" data-slot="desktop-layer-design-panel">
            {showStyleInDesign && designLayer && designPatch ? (
              <DesktopLayerStyleInspector layer={designLayer} onPatch={designPatch} />
            ) : null}

            {appearance && onAppearancePatch ? (
              <div className={cn("grid gap-2", DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
                <AppearanceOpacityControls
                  appearance={appearance}
                  onPatch={onAppearancePatch}
                  useSettingsSlider
                />
                <DesktopnewThemeContext.Provider value={theme}>
                  <AppearanceOutlineControls
                    appearance={appearance}
                    onPatch={onAppearancePatch}
                    theme={theme}
                  />
                </DesktopnewThemeContext.Provider>
                <AppearanceRadiusControls appearance={appearance} onPatch={onAppearancePatch} />
              </div>
            ) : null}

            {effectsLayer && effectsPatch && (maxEffects ?? capabilities.maxEffects) > 0 ? (
              <DesktopEffectsAccordion
                layer={effectsLayer}
                maxEffects={maxEffects ?? capabilities.maxEffects}
                onPatch={effectsPatch}
                variant="flat"
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
