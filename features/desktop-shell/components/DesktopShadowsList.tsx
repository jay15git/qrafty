"use client"

import { useState } from "react"
import {
  ChevronDownIcon,
  EyeIcon,
  EyeOffIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"

import {
  DesktopInspectorSection,
} from "@/features/desktop-shell/components/InspectorControls"
import {
  DesktopInspectorNumberField,
  DesktopInspectorValueGrid,
} from "@/features/desktop-shell/components/DesktopInspectorShell"
import {
  SettingsFillPopover,
  SettingsSlider,
} from "@/features/desktop-shell/inspector/settings-ui"
import { fillPreviewHex } from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"
import {
  createLayerEffect,
  getLayerEffectKindLabel,
  listLayerEffects,
  patchLayerShadowEffect,
  removeLayerEffect,
  serializeLayerEffects,
  setLayerEffectEnabled,
  type LayerShadowEffectItem,
} from "@/features/workspace/model/layer-effects"
import type { DraftingShadowLayerState } from "@/features/workspace/model/effects"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import { cn } from "@/lib/utils"

const FLAT_ICON_BUTTON_CLASS =
  "grid size-7 shrink-0 place-items-center rounded-md text-[var(--desktop-inspector-fg-tertiary)] transition-colors hover:text-[var(--desktop-inspector-fg-primary)] disabled:cursor-not-allowed disabled:opacity-30"

export function DesktopShadowsList({
  layer,
  maxEffects,
  onPatch,
}: {
  layer: DraftingCanvasLayer
  maxEffects?: number
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  const shadows = listLayerEffects(layer).filter(
    (effect): effect is LayerShadowEffectItem => effect.source === "shadow",
  )
  const canAddShadow = maxEffects === undefined || shadows.length < maxEffects
  const [openIds, setOpenIds] = useState<string[]>([])
  const openIdSet = new Set(openIds)

  function handleAdd() {
    const next = createLayerEffect("drop-shadow")
    onPatch(serializeLayerEffects([...listLayerEffects(layer), next]))
    setOpenIds((current) => [...current, next.id])
  }

  function handleRemove(effectId: string) {
    onPatch(removeLayerEffect(layer, effectId))
    setOpenIds((current) => current.filter((id) => id !== effectId))
  }

  return (
    <DesktopInspectorSection dataSlot="desktop-shadows-list">
      <div className="flex h-7 items-center justify-between gap-2">
        <p className="mb-0 font-medium text-[var(--desktop-inspector-fg-secondary)] text-[length:var(--desktop-inspector-type-label,0.6875rem)]">
          Shadows
        </p>
        <button
          aria-label="Add drop shadow"
          className={FLAT_ICON_BUTTON_CLASS}
          data-slot="desktop-shadows-add"
          disabled={!canAddShadow}
          type="button"
          onClick={handleAdd}
        >
          <PlusIcon className="size-3.5" />
        </button>
      </div>

      {shadows.length > 0 ? (
        <div className="flex flex-col gap-0" data-slot="desktop-shadows-rows">
          {shadows.map((effect) => (
            <ShadowRow
              key={effect.id}
              effect={effect}
              isOpen={openIdSet.has(effect.id)}
              onOpenToggle={() =>
                setOpenIds((current) =>
                  current.includes(effect.id)
                    ? current.filter((id) => id !== effect.id)
                    : [...current, effect.id],
                )
              }
              onPatchShadow={(patch) =>
                onPatch(patchLayerShadowEffect(layer, effect.id, patch))
              }
              onRemove={() => handleRemove(effect.id)}
              onVisibleToggle={() =>
                onPatch(setLayerEffectEnabled(layer, effect.id, !effect.enabled))
              }
            />
          ))}
        </div>
      ) : (
        <p className="py-2 text-center text-[var(--desktop-inspector-fg-muted)] text-[length:var(--desktop-inspector-type-caption,0.625rem)]">
          No shadows yet.
        </p>
      )}
    </DesktopInspectorSection>
  )
}

function ShadowRow({
  effect,
  isOpen,
  onOpenToggle,
  onPatchShadow,
  onRemove,
  onVisibleToggle,
}: {
  effect: LayerShadowEffectItem
  isOpen: boolean
  onOpenToggle: () => void
  onPatchShadow: (patch: Partial<DraftingShadowLayerState>) => void
  onRemove: () => void
  onVisibleToggle: () => void
}) {
  const label = getLayerEffectKindLabel(effect.kind)

  return (
    <div
      className="border-b border-[var(--desktop-inspector-control-border-hover,rgba(255,255,255,0.08))] py-1.5 last:border-b-0"
      data-effect-id={effect.id}
      data-effect-kind={effect.kind}
      data-open={isOpen ? "true" : "false"}
      data-slot="desktop-effect-row"
    >
      <div className="flex items-center gap-1">
        <button
          aria-label={effect.enabled ? `Hide ${label}` : `Show ${label}`}
          aria-pressed={effect.enabled}
          className={cn(FLAT_ICON_BUTTON_CLASS, !effect.enabled && "opacity-40")}
          type="button"
          onClick={onVisibleToggle}
        >
          {effect.enabled ? (
            <EyeIcon className="size-3.5" />
          ) : (
            <EyeOffIcon className="size-3.5" />
          )}
        </button>

        <span className="min-w-0 flex-1 truncate text-[var(--desktop-inspector-fg-secondary)] text-[length:var(--desktop-inspector-type-value,0.8125rem)]">
          {label}
        </span>

        <SettingsFillPopover
          hint={`${label} color`}
          solidOnly
          variant="swatch"
          value={effect.shadow.color}
          onValueChange={(_fill, css) =>
            onPatchShadow({ color: fillPreviewHex(css) || "#000000" })
          }
        />

        <button
          aria-expanded={isOpen}
          aria-label={isOpen ? `Collapse ${label}` : `Expand ${label}`}
          className={FLAT_ICON_BUTTON_CLASS}
          type="button"
          onClick={onOpenToggle}
        >
          <ChevronDownIcon
            className={cn(
              "size-3.5 transition-transform duration-150 motion-reduce:transition-none",
              isOpen && "rotate-180",
            )}
          />
        </button>

        <button
          aria-label={`Remove ${label}`}
          className={FLAT_ICON_BUTTON_CLASS}
          type="button"
          onClick={onRemove}
        >
          <Trash2Icon className="size-3.5" />
        </button>
      </div>

      {isOpen ? (
        <div className="grid gap-2 pt-2" data-slot="desktop-effect-row-body">
          <DesktopInspectorValueGrid className="gap-x-3 gap-y-2 [&>:nth-child(even)]:justify-self-stretch [&>:nth-child(odd)]:justify-self-stretch">
            <DesktopInspectorNumberField
              fill
              label="X"
              max={256}
              min={-256}
              value={effect.shadow.offsetX}
              onChange={(offsetX) => onPatchShadow({ offsetX })}
            />
            <DesktopInspectorNumberField
              fill
              label="Y"
              max={256}
              min={-256}
              value={effect.shadow.offsetY}
              onChange={(offsetY) => onPatchShadow({ offsetY })}
            />
            <DesktopInspectorNumberField
              fill
              label="Blur"
              max={128}
              min={0}
              value={effect.shadow.blur}
              onChange={(blur) => onPatchShadow({ blur })}
            />
          </DesktopInspectorValueGrid>
          <SettingsSlider
            label="Opacity"
            max={100}
            min={0}
            value={effect.shadow.opacity}
            onChange={(opacity) => onPatchShadow({ opacity })}
          />
        </div>
      ) : null}
    </div>
  )
}
