"use client"

import { SettingsSlider } from "@/features/desktop-shell/inspector/settings-ui"
import {
  DRAFTING_FILTER_RANGES,
  type DraftingFilterType,
} from "@/features/workspace/model/filters"
import {
  getLayerEffectKindLabel,
  getLayerFilterAmount,
  getLayerShadowOpacity,
  LAYER_EFFECT_KINDS,
  setLayerFilterAmount,
  setLayerShadowOpacity,
  type LayerEffectKind,
  type LayerShadowEffectKind,
} from "@/features/workspace/model/layer-effects"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"

function isShadowEffectKind(kind: LayerEffectKind): kind is LayerShadowEffectKind {
  return kind === "drop-shadow" || kind === "inner-shadow"
}

function getFilterType(kind: LayerEffectKind): DraftingFilterType {
  return kind === "layer-blur" ? "blur" : kind
}

export function SettingsEffectsSection({
  layerFilters,
  onPatch,
  shadows,
}: {
  layerFilters: DraftingCanvasLayer["layerFilters"]
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  shadows: DraftingCanvasLayer["shadows"]
}) {
  const layer = { layerFilters: layerFilters ?? [], shadows: shadows ?? [] }

  return (
    <div className="dn-section-stack" data-slot="desktopnew-effects-section">
      {LAYER_EFFECT_KINDS.map((kind) => {
        const label = getLayerEffectKindLabel(kind)

        if (isShadowEffectKind(kind)) {
          return (
            <div key={kind} data-effect-kind={kind} data-slot="desktopnew-effect-row">
              <SettingsSlider
                label={label}
                max={100}
                min={0}
                value={getLayerShadowOpacity(layer, kind)}
                onChange={(opacity) => onPatch(setLayerShadowOpacity(layer, kind, opacity))}
              />
            </div>
          )
        }

        const range = DRAFTING_FILTER_RANGES[getFilterType(kind)]

        return (
          <div key={kind} data-effect-kind={kind} data-slot="desktopnew-effect-row">
            <SettingsSlider
              label={label}
              max={range.max}
              min={range.min}
              value={getLayerFilterAmount(layer, kind)}
              onChange={(amount) => onPatch(setLayerFilterAmount(layer, kind, amount))}
            />
          </div>
        )
      })}
    </div>
  )
}
