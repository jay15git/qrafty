"use client"

import {
  DesktopInspectorSection,
} from "@/features/desktop-shell/components/InspectorControls"
import {
  DesktopInspectorElasticSliderRow,
} from "@/features/desktop-shell/components/DesktopInspectorShell"
import { SettingsSlider } from "@/features/desktop-shell/inspector/settings-ui"
import { DRAFTING_FILTER_RANGES } from "@/features/workspace/model/filters"
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
import type { DraftingFilterType } from "@/features/workspace/model/filters"
import { cn } from "@/lib/utils"

function isShadowEffectKind(kind: LayerEffectKind): kind is LayerShadowEffectKind {
  return kind === "drop-shadow" || kind === "inner-shadow"
}

function getFilterType(kind: LayerEffectKind): DraftingFilterType {
  return kind === "layer-blur" ? "blur" : kind
}

function renderSliderRow({
  label,
  max,
  min,
  onChange,
  value,
  valueLabel,
  variant,
}: {
  label: string
  max: number
  min: number
  onChange: (value: number) => void
  value: number
  valueLabel: string
  variant: "default" | "flat"
}) {
  if (variant === "flat") {
    return (
      <SettingsSlider
        label={label}
        max={max}
        min={min}
        value={value}
        onChange={onChange}
      />
    )
  }

  return (
    <DesktopInspectorElasticSliderRow
      label={label}
      max={max}
      min={min}
      value={value}
      valueLabel={valueLabel}
      onChange={onChange}
    />
  )
}

export function DesktopEffectsAccordion({
  layer,
  layerOpacity,
  onLayerOpacityChange,
  onPatch,
  variant = "default",
}: {
  layer: DraftingCanvasLayer
  layerOpacity?: number
  maxEffects?: number
  onLayerOpacityChange?: (opacity: number) => void
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  variant?: "default" | "flat"
}) {
  const opacityPercent =
    layerOpacity === undefined ? undefined : Math.round(layerOpacity * 100)

  return (
    <DesktopInspectorSection dataSlot="desktop-effects-accordion">
      <div
        className={cn("flex flex-col", variant === "flat" ? "gap-2" : "gap-2.5")}
        data-slot="desktop-effects-list"
      >
        {opacityPercent !== undefined && onLayerOpacityChange ? (
          <div data-effect-kind="opacity" data-slot="desktop-effect-row">
            {renderSliderRow({
              label: "Opacity",
              max: 100,
              min: 0,
              onChange: (next) => onLayerOpacityChange(next / 100),
              value: opacityPercent,
              valueLabel: `${opacityPercent}%`,
              variant,
            })}
          </div>
        ) : null}

        {LAYER_EFFECT_KINDS.map((kind) => {
          const label = getLayerEffectKindLabel(kind)

          if (isShadowEffectKind(kind)) {
            const value = getLayerShadowOpacity(layer, kind)

            return (
              <div key={kind} data-effect-kind={kind} data-slot="desktop-effect-row">
                {renderSliderRow({
                  label,
                  max: 100,
                  min: 0,
                  onChange: (opacity) => onPatch(setLayerShadowOpacity(layer, kind, opacity)),
                  value,
                  valueLabel: `${Math.round(value)}%`,
                  variant,
                })}
              </div>
            )
          }

          const range = DRAFTING_FILTER_RANGES[getFilterType(kind)]
          const value = getLayerFilterAmount(layer, kind)

          return (
            <div key={kind} data-effect-kind={kind} data-slot="desktop-effect-row">
              {renderSliderRow({
                label,
                max: range.max,
                min: range.min,
                onChange: (amount) => onPatch(setLayerFilterAmount(layer, kind, amount)),
                value,
                valueLabel: `${Math.round(value)}${range.unit ?? ""}`,
                variant,
              })}
            </div>
          )
        })}
      </div>
    </DesktopInspectorSection>
  )
}
