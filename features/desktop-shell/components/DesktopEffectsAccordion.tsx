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
import { SettingsFillPopover } from "@/features/desktop-shell/inspector/settings-ui"
import { fillPreviewHex } from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"
import {
  DESKTOP_INSPECTOR_CONTROL_CLASS,
  DESKTOP_INSPECTOR_SECTION_HEADING_CLASS,
} from "@/features/desktop-shell/components/desktop-inspector-tokens"
import {
  DesktopInspectorNativeSelect,
  DesktopInspectorSection,
} from "@/features/desktop-shell/components/InspectorControls"
import {
  DesktopInspectorElasticSliderRow,
  DesktopInspectorNumberField,
  DesktopInspectorValueGrid,
} from "@/features/desktop-shell/components/DesktopInspectorShell"
import { SettingsSlider } from "@/features/desktop-shell/inspector/settings-ui"
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

const FLAT_ICON_BUTTON_CLASS =
  "grid size-7 shrink-0 place-items-center rounded-md text-[var(--desktop-inspector-fg-tertiary)] transition-colors hover:text-[var(--desktop-inspector-fg-primary)] disabled:cursor-not-allowed disabled:opacity-30"

export function DesktopEffectsAccordion({
  layer,
  maxEffects,
  onPatch,
  variant = "default",
}: {
  layer: DraftingCanvasLayer
  maxEffects?: number
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  variant?: "default" | "flat"
}) {
  const effects = listLayerEffects(layer)
  const canAddEffect = maxEffects === undefined || effects.length < maxEffects
  const [openIds, setOpenIds] = useState<string[]>([])
  const openIdSet = new Set(openIds)

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
      <div className={cn("flex items-center justify-between gap-2", variant === "flat" ? "h-7" : "h-8")}>
        <p
          className={cn(
            "mb-0",
            variant === "flat"
              ? "font-medium text-[var(--desktop-inspector-fg-secondary)] text-[length:var(--desktop-inspector-type-label,0.6875rem)]"
              : DESKTOP_INSPECTOR_SECTION_HEADING_CLASS,
          )}
        >
          Effects
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Add effect"
              className={variant === "flat" ? FLAT_ICON_BUTTON_CLASS : ICON_BUTTON_CLASS}
              data-slot="desktop-effects-add"
              disabled={!canAddEffect}
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
        <div
          className={cn("flex flex-col", variant === "flat" ? "gap-0" : "gap-1")}
          data-slot="desktop-effects-list"
        >
          {effects.map((effect) => {
            const isOpen = openIdSet.has(effect.id)

            return (
              <EffectRow
                key={effect.id}
                effect={effect}
                isOpen={isOpen}
                variant={variant}
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
  variant = "default",
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
  variant?: "default" | "flat"
}) {
  const label = getLayerEffectKindLabel(effect.kind)
  const range =
    effect.source === "filter" ? DRAFTING_FILTER_RANGES[effect.filter.type] : null
  const iconButtonClass = variant === "flat" ? FLAT_ICON_BUTTON_CLASS : ICON_BUTTON_CLASS

  return (
    <div
      className={cn(
        variant === "flat"
          ? "border-b border-[var(--desktop-inspector-control-border-hover,rgba(255,255,255,0.08))] py-1.5 last:border-b-0"
          : "rounded-[8px] bg-[var(--desktop-inspector-control)]",
      )}
      data-effect-id={effect.id}
      data-effect-kind={effect.kind}
      data-open={isOpen ? "true" : "false"}
      data-slot="desktop-effect-row"
    >
      <div className={cn("flex items-center", variant === "flat" ? "gap-1" : "h-8 gap-0.5 px-0.5")}>
        <button
          aria-label={effect.enabled ? `Hide ${label}` : `Show ${label}`}
          aria-pressed={effect.enabled}
          className={cn(iconButtonClass, !effect.enabled && "opacity-40")}
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
          className={cn(
            variant === "flat"
              ? "h-7 min-h-7 border-0 bg-transparent px-0 pr-5 text-[length:var(--desktop-inspector-type-value,0.8125rem)] shadow-none focus-visible:ring-0"
              : "h-7 min-h-7 px-2 pr-6 text-[11px]",
          )}
          iconClassName={variant === "flat" ? "right-0 size-3" : "right-1.5 size-3"}
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
          <SettingsFillPopover
            hint={`${label} color`}
            solidOnly
            variant="swatch"
            value={effect.shadow.color}
            onValueChange={(_fill, css) =>
              onPatchShadow({ color: fillPreviewHex(css) || "#000000" })
            }
          />
        ) : null}

        <button
          aria-expanded={isOpen}
          aria-label={isOpen ? `Collapse ${label}` : `Expand ${label}`}
          className={iconButtonClass}
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
          className={iconButtonClass}
          type="button"
          onClick={onRemove}
        >
          <Trash2Icon className="size-3.5" />
        </button>
      </div>

      {isOpen ? (
        <div
          className={cn(
            "grid gap-2",
            variant === "flat" ? "pt-2" : "border-t border-[var(--desktop-inspector-bg)] px-2 py-2",
          )}
          data-slot="desktop-effect-row-body"
        >
          {effect.source === "shadow" ? (
            <>
              <DesktopInspectorValueGrid
                className={
                  variant === "flat"
                    ? "gap-x-3 gap-y-2 [&>:nth-child(even)]:justify-self-stretch [&>:nth-child(odd)]:justify-self-stretch"
                    : undefined
                }
              >
                <DesktopInspectorNumberField
                  fill={variant === "flat"}
                  label="X"
                  max={256}
                  min={-256}
                  value={effect.shadow.offsetX}
                  onChange={(offsetX) => onPatchShadow({ offsetX })}
                />
                <DesktopInspectorNumberField
                  fill={variant === "flat"}
                  label="Y"
                  max={256}
                  min={-256}
                  value={effect.shadow.offsetY}
                  onChange={(offsetY) => onPatchShadow({ offsetY })}
                />
                <DesktopInspectorNumberField
                  fill={variant === "flat"}
                  label="Blur"
                  max={128}
                  min={0}
                  value={effect.shadow.blur}
                  onChange={(blur) => onPatchShadow({ blur })}
                />
                <DesktopInspectorNumberField
                  fill={variant === "flat"}
                  label="Spread"
                  max={128}
                  min={-128}
                  value={effect.shadow.spread}
                  onChange={(spread) => onPatchShadow({ spread })}
                />
              </DesktopInspectorValueGrid>
              {variant === "flat" ? (
                <SettingsSlider
                  label="Opacity"
                  max={100}
                  min={0}
                  value={effect.shadow.opacity}
                  onChange={(opacity) => onPatchShadow({ opacity })}
                />
              ) : (
                <DesktopInspectorElasticSliderRow
                  label="Opacity"
                  max={100}
                  min={0}
                  value={effect.shadow.opacity}
                  valueLabel={`${Math.round(effect.shadow.opacity)}%`}
                  onChange={(opacity) => onPatchShadow({ opacity })}
                />
              )}
            </>
          ) : range ? (
            variant === "flat" ? (
              <SettingsSlider
                label="Amount"
                max={range.max}
                min={range.min}
                value={effect.filter.amount}
                onChange={(amount) => onPatchFilter({ amount })}
              />
            ) : (
              <DesktopInspectorElasticSliderRow
                label="Amount"
                max={range.max}
                min={range.min}
                value={effect.filter.amount}
                valueLabel={`${Math.round(effect.filter.amount)}${range.unit ?? ""}`}
                onChange={(amount) => onPatchFilter({ amount })}
              />
            )
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
