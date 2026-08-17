"use client"

import type { ReactNode } from "react"

import {
  AppearanceOutlineControls,
  AppearanceOpacityControls,
  AppearanceRadiusControls,
} from "@/features/desktop-shell/components/AppearancePopoverControls"
import { DesktopEffectsAccordion } from "@/features/desktop-shell/components/DesktopEffectsAccordion"
import {
  DesktopLayerStyleInspector,
  DesktopTransformSection,
} from "@/features/desktop-shell/components/DesktopElementInspector"
import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import type { DesktopAppearanceSnapshot } from "@/features/desktop-shell/model/appearance"
import { DesktopnewThemeContext } from "@/features/desktop-shell/inspector/desktopnew-theme-context"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"

import "@/features/desktop-shell/inspector/desktopnew.css"

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
  layer,
  onPatch,
  theme,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  theme: DesktopThemeMode
}) {
  return (
    <LayerSettingsPanelShell dataSlot="desktop-layer-effects-panel" theme={theme}>
      <DesktopEffectsAccordion layer={layer} onPatch={onPatch} />
    </LayerSettingsPanelShell>
  )
}

export function DesktopLayerTransformPanel({
  layer,
  onPatch,
  theme,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  theme: DesktopThemeMode
}) {
  return (
    <LayerSettingsPanelShell dataSlot="desktop-layer-transform-panel" theme={theme}>
      <DesktopTransformSection layer={layer} onPatch={onPatch} />
    </LayerSettingsPanelShell>
  )
}

export function DesktopLayerAppearancePanel({
  appearance,
  onPatch,
  theme,
}: {
  appearance: DesktopAppearanceSnapshot
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  theme: DesktopThemeMode
}) {
  return (
    <LayerSettingsPanelShell dataSlot="desktop-layer-appearance-panel" theme={theme}>
      <div className="grid gap-2">
        <AppearanceOpacityControls appearance={appearance} onPatch={onPatch} />
        <AppearanceOutlineControls appearance={appearance} onPatch={onPatch} theme={theme} />
        <AppearanceRadiusControls appearance={appearance} onPatch={onPatch} />
      </div>
    </LayerSettingsPanelShell>
  )
}
