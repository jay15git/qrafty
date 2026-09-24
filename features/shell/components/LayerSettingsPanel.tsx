"use client";

import type { ReactNode } from "react";

import {
  AppearanceBorderControls,
  AppearanceRadiusControls,
} from "@/features/shell/components/AppearancePopoverControls";
import { EffectsAccordion } from "@/features/shell/components/EffectsAccordion";
import { ShadowsList } from "@/features/shell/components/ShadowsList";
import {
  LayerStyleSettings,
  TransformSection,
} from "@/features/shell/components/ElementSettingsPanel";
import type { ThemeMode } from "@/features/shell/components/WorkspaceChrome";
import type { AppearancePatch, AppearanceSnapshot } from "@/features/shell/model/appearance";
import { SettingsThemeContext } from "@/features/shell/settings/theme-context";
import type { LayerEffectKind } from "@/features/canvas/model/layer-effects";
import type { CanvasLayer } from "@/features/canvas/model/layers/shared";
import "@/features/shell/settings/settings.css";

function LayerSettingsPanelShell({
  children,
  dataSlot,
  theme,
}: {
  children: ReactNode;
  dataSlot: string;
  theme: ThemeMode;
}) {
  return (
    <SettingsThemeContext.Provider value={theme}>
      <div
        className="ds-root ds-embedded flex min-h-0 flex-col"
        data-slot={dataSlot}
        data-theme={theme}
      >
        {children}
      </div>
    </SettingsThemeContext.Provider>
  );
}

export function LayerStylePanel({
  layer,
  onPatch,
  theme,
}: {
  layer: CanvasLayer;
  onPatch: (patch: Partial<CanvasLayer>) => void;
  theme: ThemeMode;
}) {
  return (
    <LayerSettingsPanelShell dataSlot="layer-style-panel" theme={theme}>
      <LayerStyleSettings layer={layer} onPatch={onPatch} />
    </LayerSettingsPanelShell>
  );
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
  effectKinds?: readonly LayerEffectKind[];
  layer: CanvasLayer;
  layerOpacity?: number;
  onLayerOpacityChange?: (opacity: number) => void;
  onPatch: (patch: Partial<CanvasLayer>) => void;
  theme: ThemeMode;
  variant?: "default" | "flat";
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
  );
}

export function LayerShadowsPanel({
  layer,
  onPatch,
  theme,
}: {
  layer: CanvasLayer;
  onPatch: (patch: Partial<CanvasLayer>) => void;
  theme: ThemeMode;
}) {
  return (
    <LayerSettingsPanelShell dataSlot="layer-shadows-panel" theme={theme}>
      <ShadowsList layer={layer} onPatch={onPatch} />
    </LayerSettingsPanelShell>
  );
}

export function LayerTransformPanel({
  layer,
  onPatch,
  theme,
  variant,
}: {
  layer: CanvasLayer;
  onPatch: (patch: Partial<CanvasLayer>) => void;
  theme: ThemeMode;
  variant?: "default" | "flat";
}) {
  return (
    <LayerSettingsPanelShell dataSlot="layer-transform-panel" theme={theme}>
      <TransformSection layer={layer} onPatch={onPatch} variant={variant} />
    </LayerSettingsPanelShell>
  );
}

export function LayerBorderPanel({
  appearance,
  onPatch,
  theme,
}: {
  appearance: AppearanceSnapshot;
  onPatch: (patch: AppearancePatch) => void;
  theme: ThemeMode;
}) {
  return (
    <LayerSettingsPanelShell dataSlot="layer-border-panel" theme={theme}>
      <div className="grid gap-2">
        <AppearanceBorderControls appearance={appearance} onPatch={onPatch} theme={theme} />
        <AppearanceRadiusControls appearance={appearance} onPatch={onPatch} />
      </div>
    </LayerSettingsPanelShell>
  );
}
