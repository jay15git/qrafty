"use client"

import type { ReactNode } from "react"

import {
  AppearanceBorderControls,
  AppearanceRadiusControls,
} from "@/features/desktop-shell/components/AppearancePopoverControls"
import { DesktopEffectsAccordion } from "@/features/desktop-shell/components/DesktopEffectsAccordion"
import { DesktopShadowsList } from "@/features/desktop-shell/components/DesktopShadowsList"
import {
  DesktopLayerStyleInspector,
  DesktopTransformSection,
} from "@/features/desktop-shell/components/DesktopElementInspector"
import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import type {
  DesktopAppearancePatch,
  DesktopAppearanceSnapshot,
} from "@/features/desktop-shell/model/appearance"
import { DesktopnewThemeContext } from "@/features/desktop-shell/inspector/theme-context"
import type { LayerEffectKind } from "@/features/workspace/model/layer-effects"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"

import "@/features/desktop-shell/inspector/inspector.css"

function LayerSettingsPanelShell({
  children,
  dataSlot,
  theme,
}: {
  children: ReactNode
  dataSlot: string
  theme: DesktopThemeMode
}) {
  return (
    <DesktopnewThemeContext.Provider value={theme}>
      <div
        className="desktopnew-root desktopnew-embedded flex min-h-0 flex-col"
        data-slot={dataSlot}
        data-theme={theme}
      >
        {children}
      </div>
    </DesktopnewThemeContext.Provider>
  )
}

export function DesktopLayerStylePanel({
  layer,
  onPatch,
  theme,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  theme: DesktopThemeMode
}) {
  return (
    <LayerSettingsPanelShell dataSlot="desktop-layer-style-panel" theme={theme}>
      <DesktopLayerStyleInspector layer={layer} onPatch={onPatch} />
    </LayerSettingsPanelShell>
  )
}

export function DesktopLayerEffectsPanel({
  effectKinds,
  layer,
  layerOpacity,
  onLayerOpacityChange,
  onPatch,
  theme,
  variant,
}: {
  effectKinds?: readonly LayerEffectKind[]
  layer: DraftingCanvasLayer
  layerOpacity?: number
  onLayerOpacityChange?: (opacity: number) => void
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  theme: DesktopThemeMode
  variant?: "default" | "flat"
}) {
  return (
    <LayerSettingsPanelShell dataSlot="desktop-layer-effects-panel" theme={theme}>
      <DesktopEffectsAccordion
        effectKinds={effectKinds}
        layer={layer}
        layerOpacity={layerOpacity}
        onLayerOpacityChange={onLayerOpacityChange}
        onPatch={onPatch}
        variant={variant}
      />
    </LayerSettingsPanelShell>
  )
}

export function DesktopLayerShadowsPanel({
  layer,
  onPatch,
  theme,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  theme: DesktopThemeMode
}) {
  return (
    <LayerSettingsPanelShell dataSlot="desktop-layer-shadows-panel" theme={theme}>
      <DesktopShadowsList layer={layer} onPatch={onPatch} />
    </LayerSettingsPanelShell>
  )
}

export function DesktopLayerTransformPanel({
  layer,
  onPatch,
  theme,
  variant,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  theme: DesktopThemeMode
  variant?: "default" | "flat"
}) {
  return (
    <LayerSettingsPanelShell dataSlot="desktop-layer-transform-panel" theme={theme}>
      <DesktopTransformSection layer={layer} onPatch={onPatch} variant={variant} />
    </LayerSettingsPanelShell>
  )
}

export function DesktopLayerBorderPanel({
  appearance,
  onPatch,
  theme,
}: {
  appearance: DesktopAppearanceSnapshot
  onPatch: (patch: DesktopAppearancePatch) => void
  theme: DesktopThemeMode
}) {
  return (
    <LayerSettingsPanelShell dataSlot="desktop-layer-border-panel" theme={theme}>
      <div className="grid gap-2">
        <AppearanceBorderControls appearance={appearance} onPatch={onPatch} theme={theme} />
        <AppearanceRadiusControls appearance={appearance} onPatch={onPatch} />
      </div>
    </LayerSettingsPanelShell>
  )
}
