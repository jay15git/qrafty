"use client"

import { useState } from "react"
import { ChevronDownIcon, EyeIcon, EyeOffIcon, PlusIcon, Trash2Icon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DesktopColorSwatchPicker } from "@/features/desktop-shell/components/DesktopColorControls"
import {
  DESKTOP_INSPECTOR_CONTROL_CLASS,
  DESKTOP_INSPECTOR_SECTION_HEADING_CLASS,
  DesktopInspectorNativeSelect,
  DesktopInspectorSection,
} from "@/features/desktop-shell/components/InspectorControls"
import {
  DesktopInspectorElasticSliderRow,
  DesktopInspectorNumberField,
  DesktopInspectorValueGrid,
} from "@/features/desktop-shell/components/DesktopInspectorShell"
import { DRAFTING_FILTER_RANGES } from "@/features/workspace/model/filters"
import {
  createLayerEffect,
  getLayerEffectKindLabel,
  LAYER_EFFECT_KINDS,
  LAYER_FILTER_EFFECT_KINDS,
  LAYER_SHADOW_EFFECT_KINDS,
  listLayerEffects,
  patchLayerFilterEffect,
  patchLayerShadowEffect,
  serializeLayerEffects,
  setLayerEffectEnabled,
  setLayerEffectKind,
  type LayerEffectItem,
  type LayerEffectKind,
} from "@/features/workspace/model/layer-effects"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import { cn } from "@/lib/utils"

const ICON_BUTTON_CLASS = cn(
  "grid size-7 shrink-0 place-items-center rounded-md",
  DESKTOP_INSPECTOR_CONTROL_CLASS,
)

export function DesktopEffectsAccordion({
  layer,
  onPatch,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  const effects = listLayerEffects(layer)
  const [openIds, setOpenIds] = useState<string[]>([])

  function applyPatch(patch: Partial<DraftingCanvasLayer>) {
    onPatch(patch)
  }

  function handleAdd(kind: LayerEffectKind) {
    const next = createLayerEffect(kind)
    applyPatch(serializeLayerEffects([...effects, next]))
    setOpenIds((current) => (current.includes(next.id) ? current : [...current, next.id]))
  }

  function handleRemove(effectId: string) {
    applyPatch(serializeLayerEffects(effects.filter((item) => item.id !== effectId)))
    setOpenIds((current) => current.filter((id) => id !== effectId))
  }

  function toggleOpen(effectId: string) {
    setOpenIds((current) =>
      current.includes(effectId)
        ? current.filter((id) => id !== effectId)
        : [...current, effectId],
    )
  }

  return (
    <DesktopInspectorSection dataSlot="desktop-effects-accordion">
      <div className="flex h-8 items-center justify-between gap-2">
        <p className={cn(DESKTOP_INSPECTOR_SECTION_HEADING_CLASS, "mb-0")}>Effects</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Add effect"
              className={ICON_BUTTON_CLASS}
              data-slot="desktop-effects-add"
              type="button"
            >
              <PlusIcon className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="z-[20001] min-w-40"
            data-slot="desktop-effects-add-menu"
          >
            <DropdownMenuGroup>
              {LAYER_SHADOW_EFFECT_KINDS.map((kind) => (
                <DropdownMenuItem key={kind} onClick={() => handleAdd(kind)}>
                  {getLayerEffectKindLabel(kind)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <div className="my-1 h-px bg-[var(--desktop-inspector-control)]" />
            <DropdownMenuGroup>
              {LAYER_FILTER_EFFECT_KINDS.map((kind) => (
                <DropdownMenuItem key={kind} onClick={() => handleAdd(kind)}>
                  {getLayerEffectKindLabel(kind)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {effects.length > 0 ? (
        <div className="flex flex-col gap-1" data-slot="desktop-effects-list">
          {effects.map((effect) => {
            const isOpen = openIds.includes(effect.id)

            return (
              <EffectRow
                key={effect.id}
                effect={effect}
                isOpen={isOpen}
                onKindChange={(kind) => applyPatch(setLayerEffectKind(layer, effect.id, kind))}
                onOpenToggle={() => toggleOpen(effect.id)}
                onPatchFilter={(patch) =>
                  applyPatch(patchLayerFilterEffect(layer, effect.id, patch))
                }
                onPatchShadow={(patch) =>
                  applyPatch(patchLayerShadowEffect(layer, effect.id, patch))
                }
                onRemove={() => handleRemove(effect.id)}
                onVisibleToggle={() =>
                  applyPatch(setLayerEffectEnabled(layer, effect.id, !effect.enabled))
                }
              />
            )
          })}
        </div>
      ) : null}
    </DesktopInspectorSection>
  )
}

function EffectRow({
  effect,
  isOpen,
  onKindChange,
  onOpenToggle,
  onPatchFilter,
  onPatchShadow,
  onRemove,
  onVisibleToggle,
}: {
  effect: LayerEffectItem
  isOpen: boolean
  onKindChange: (kind: LayerEffectKind) => void
  onOpenToggle: () => void
  onPatchFilter: (patch: { amount: number }) => void
  onPatchShadow: (
    patch: Partial<{
      blur: number
      color: string
      offsetX: number
      offsetY: number
      opacity: number
      spread: number
    }>,
  ) => void
  onRemove: () => void
  onVisibleToggle: () => void
}) {
  const label = getLayerEffectKindLabel(effect.kind)
  const range =
    effect.source === "filter" ? DRAFTING_FILTER_RANGES[effect.filter.type] : null

  return (
    <div
      className="rounded-[8px] bg-[var(--desktop-inspector-control)]"
      data-effect-id={effect.id}
      data-effect-kind={effect.kind}
      data-open={isOpen ? "true" : "false"}
      data-slot="desktop-effect-row"
    >
      <div className="flex h-8 items-center gap-0.5 px-0.5">
        <button
          aria-label={effect.enabled ? `Hide ${label}` : `Show ${label}`}
          aria-pressed={effect.enabled}
          className={cn(ICON_BUTTON_CLASS, !effect.enabled && "opacity-40")}
          type="button"
          onClick={onVisibleToggle}
        >
          {effect.enabled ? (
            <EyeIcon className="size-3.5" />
          ) : (
            <EyeOffIcon className="size-3.5" />
          )}
        </button>

        <DesktopInspectorNativeSelect
          aria-label={`${label} type`}
          className="h-7 min-h-7 px-2 pr-6 text-[11px]"
          iconClassName="right-1.5 size-3"
          options={LAYER_EFFECT_KINDS.map((kind) => ({
            label: getLayerEffectKindLabel(kind),
            value: kind,
          }))}
          rootClassName="min-w-0 flex-1"
          showIcon
          value={effect.kind}
          onValueChange={onKindChange}
        />

        {effect.source === "shadow" ? (
          <DesktopColorSwatchPicker
            ariaLabel={`${label} color`}
            value={effect.shadow.color}
            onChange={(color) => onPatchShadow({ color: color || "#000000" })}
          />
        ) : null}

        <button
          aria-expanded={isOpen}
          aria-label={isOpen ? `Collapse ${label}` : `Expand ${label}`}
          className={ICON_BUTTON_CLASS}
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
          className={ICON_BUTTON_CLASS}
          type="button"
          onClick={onRemove}
        >
          <Trash2Icon className="size-3.5" />
        </button>
      </div>

      {isOpen ? (
        <div
          className="grid gap-2 border-t border-[var(--desktop-inspector-bg)] px-2 py-2"
          data-slot="desktop-effect-row-body"
        >
          {effect.source === "shadow" ? (
            <>
              <DesktopInspectorValueGrid>
                <DesktopInspectorNumberField
                  label="X"
                  max={256}
                  min={-256}
                  value={effect.shadow.offsetX}
                  onChange={(offsetX) => onPatchShadow({ offsetX })}
                />
                <DesktopInspectorNumberField
                  label="Y"
                  max={256}
                  min={-256}
                  value={effect.shadow.offsetY}
                  onChange={(offsetY) => onPatchShadow({ offsetY })}
                />
                <DesktopInspectorNumberField
                  label="Blur"
                  max={128}
                  min={0}
                  value={effect.shadow.blur}
                  onChange={(blur) => onPatchShadow({ blur })}
                />
                <DesktopInspectorNumberField
                  label="Spread"
                  max={128}
                  min={-128}
                  value={effect.shadow.spread}
                  onChange={(spread) => onPatchShadow({ spread })}
                />
              </DesktopInspectorValueGrid>
              <DesktopInspectorElasticSliderRow
                label="Opacity"
                max={100}
                min={0}
                value={effect.shadow.opacity}
                valueLabel={`${Math.round(effect.shadow.opacity)}%`}
                onChange={(opacity) => onPatchShadow({ opacity })}
              />
            </>
          ) : range ? (
            <DesktopInspectorElasticSliderRow
              label="Amount"
              max={range.max}
              min={range.min}
              value={effect.filter.amount}
              valueLabel={`${Math.round(effect.filter.amount)}${range.unit ?? ""}`}
              onChange={(amount) => onPatchFilter({ amount })}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
