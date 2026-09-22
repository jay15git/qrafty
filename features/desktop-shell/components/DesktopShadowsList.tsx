"use client"

import { Switch } from "@/components/ui/switch"
import {
  DesktopInspectorSection,
} from "@/features/desktop-shell/components/InspectorControls"
import {
  SettingsFillPopover,
  SettingsSlider,
} from "@/features/desktop-shell/inspector/settings-ui"
import { fillPreviewHex } from "@/features/desktop-shell/inspector/fill-picker.utils"
import {
  createLayerEffect,
  listLayerEffects,
  patchLayerShadowEffect,
  serializeLayerEffects,
  type LayerShadowEffectItem,
} from "@/features/workspace/model/layer-effects"
import type { DraftingShadowLayerState } from "@/features/workspace/model/effects"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"

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
      <p className="mb-0 font-medium text-[var(--desktop-inspector-fg-secondary)] text-[length:var(--desktop-inspector-type-label,0.6875rem)]">
        Shadows
      </p>

      <div className="flex items-center gap-2" data-slot="desktop-shadow-row">
        <Switch
          checked={enabled}
          className="dn-switch-row flex-1"
          label="Drop shadow"
          size="compact"
          onToggle={handleToggle}
        />
        {effect && enabled ? (
          <SettingsFillPopover
            hint="Drop shadow color"
            solidOnly
            variant="swatch"
            value={effect.shadow.color}
            onValueChange={(_fill, css) =>
              handlePatchShadow({ color: fillPreviewHex(css) || "#000000" })
            }
          />
        ) : null}
      </div>

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
