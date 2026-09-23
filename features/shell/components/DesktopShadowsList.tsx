"use client"

import { Switch } from "@/components/ui/switch"
import {
  DesktopInspectorLabel,
  DesktopInspectorSection,
} from "@/features/shell/components/InspectorControls"
import {
  SettingsFillPopover,
  SettingsSlider,
} from "@/features/shell/inspector/settings-ui"
import { fillPreviewHex } from "@/features/shell/inspector/fill-picker.utils"
import {
  createLayerEffect,
  listLayerEffects,
  patchLayerShadowEffect,
  serializeLayerEffects,
  type LayerShadowEffectItem,
} from "@/features/canvas/model/layer-effects"
import type { DraftingShadowLayerState } from "@/features/canvas/model/effects"
import type { DraftingCanvasLayer } from "@/features/canvas/model/layers"

export function DesktopShadowsList({
  layer,
  onPatch,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  const effects = listLayerEffects(layer)
  const shadowEffects = effects.filter(
    (effect): effect is LayerShadowEffectItem => effect.source === "shadow",
  )
  const effect = shadowEffects.find((item) => item.enabled) ?? shadowEffects[0]
  const enabled = effect?.enabled ?? false

  function handleToggle() {
    if (effect) {
      const next: LayerShadowEffectItem = {
        ...effect,
        enabled: !enabled,
        shadow: { ...effect.shadow, visible: !enabled },
      }

      onPatch(
        serializeLayerEffects([
          ...effects.filter((item) => item.source !== "shadow"),
          next,
        ]),
      )
      return
    }

    onPatch(serializeLayerEffects([...effects, createLayerEffect("drop-shadow")]))
  }

  function handlePatchShadow(patch: Partial<DraftingShadowLayerState>) {
    if (!effect) {
      return
    }

    onPatch(patchLayerShadowEffect(layer, effect.id, patch))
  }

  return (
    <DesktopInspectorSection dataSlot="desktop-shadows-list">
      <DesktopInspectorLabel>Shadows</DesktopInspectorLabel>
      <Switch
        checked={enabled}
        className="dn-switch-row"
        label="Drop shadow"
        size="compact"
        onToggle={handleToggle}
      />

      {effect && enabled ? (
        <div className="flex min-h-[var(--settings-control-height)] items-center">
          <span className="dn-row-label-text pl-[var(--settings-row-px)]">Color</span>
          <SettingsFillPopover
            align="start"
            hint="Drop shadow color"
            side="right"
            solidOnly
            title="Drop shadow color"
            triggerClassName="ml-auto"
            value={effect.shadow.color}
            variant="swatch"
            onValueChange={(_fill, css) =>
              handlePatchShadow({ color: fillPreviewHex(css) || "#000000" })
            }
          />
        </div>
      ) : null}

      {effect && enabled ? (
        <div className="grid gap-2" data-slot="desktop-shadow-controls">
          <SettingsSlider
            label="X"
            max={256}
            min={-256}
            value={effect.shadow.offsetX}
            onChange={(offsetX) => handlePatchShadow({ offsetX })}
          />
          <SettingsSlider
            label="Y"
            max={256}
            min={-256}
            value={effect.shadow.offsetY}
            onChange={(offsetY) => handlePatchShadow({ offsetY })}
          />
          <SettingsSlider
            label="Blur"
            max={128}
            min={0}
            value={effect.shadow.blur}
            onChange={(blur) => handlePatchShadow({ blur })}
          />
          <SettingsSlider
            label="Opacity"
            max={100}
            min={0}
            value={effect.shadow.opacity}
            onChange={(opacity) => handlePatchShadow({ opacity })}
          />
        </div>
      ) : null}
    </DesktopInspectorSection>
  )
}
