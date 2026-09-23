"use client"

import type { ReactNode } from "react"

import {
  AppearanceBorderControls,
  AppearanceRadiusControls,
} from "@/features/shell/components/AppearancePopoverControls"
import { EffectsAccordion } from "@/features/shell/components/EffectsAccordion"
import { ShadowsList } from "@/features/shell/components/ShadowsList"
import {
  LayerStyleInspector,
  TransformSection,
} from "@/features/shell/components/ElementInspector"
import type { ThemeMode } from "@/features/shell/components/FloatingToolbar"
import type {
  AppearancePatch,
  AppearanceSnapshot,
} from "@/features/shell/model/appearance"
import { InspectorThemeContext } from "@/features/shell/inspector/theme-context"
import type { LayerEffectKind } from "@/features/canvas/model/layer-effects"
import type { DraftingCanvasLayer } from "@/features/canvas/model/layers/shared"
import "@/features/shell/inspector/inspector.css"

function LayerSettingsPanelShell({
  children,
  dataSlot,
  theme,
}: {
  children: ReactNode
  dataSlot: string
  theme: ThemeMode
}) {
  return (
    <InspectorThemeContext.Provider value={theme}>
      <div
        className="inspector-root inspector-embedded flex min-h-0 flex-col"
        data-slot={dataSlot}
        data-theme={theme}
      >
        {children}
      </div>
    </InspectorThemeContext.Provider>
  )
}

export function LayerStylePanel({
  layer,
  onPatch,
  theme,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  theme: ThemeMode
}) {
  return (
    <LayerSettingsPanelShell dataSlot="layer-style-panel" theme={theme}>
      <LayerStyleInspector layer={layer} onPatch={onPatch} />
    </LayerSettingsPanelShell>
  )
}

export function LayerEffectsPanel({
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
  theme: ThemeMode
  variant?: "default" | "flat"
}) {
  return (
    <LayerSettingsPanelShell dataSlot="layer-effects-panel" theme={theme}>
      <EffectsAccordion
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

export function LayerShadowsPanel({
  layer,
  onPatch,
  theme,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  theme: ThemeMode
}) {
  return (
    <LayerSettingsPanelShell dataSlot="layer-shadows-panel" theme={theme}>
      <ShadowsList layer={layer} onPatch={onPatch} />
    </LayerSettingsPanelShell>
  )
}

export function LayerTransformPanel({
  layer,
  onPatch,
  theme,
  variant,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  theme: ThemeMode
  variant?: "default" | "flat"
}) {
  return (
    <LayerSettingsPanelShell dataSlot="layer-transform-panel" theme={theme}>
      <TransformSection layer={layer} onPatch={onPatch} variant={variant} />
    </LayerSettingsPanelShell>
  )
}

export function LayerBorderPanel({
  appearance,
  onPatch,
  theme,
}: {
  appearance: AppearanceSnapshot
  onPatch: (patch: AppearancePatch) => void
  theme: ThemeMode
}) {
  return (
    <LayerSettingsPanelShell dataSlot="layer-border-panel" theme={theme}>
      <div className="grid gap-2">
        <AppearanceBorderControls appearance={appearance} onPatch={onPatch} theme={theme} />
        <AppearanceRadiusControls appearance={appearance} onPatch={onPatch} />
      </div>
    </LayerSettingsPanelShell>
  )
}
