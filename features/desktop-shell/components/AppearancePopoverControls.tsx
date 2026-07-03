"use client"

import { EyeIcon, EyeOffIcon, MinusIcon, PlusIcon } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import {
  DESKTOP_INSPECTOR_INPUT_CLASS,
  DESKTOP_INSPECTOR_SECTION_GAP_CLASS,
  DESKTOP_INSPECTOR_SECTION_HEADING_CLASS,
  DesktopInspectorLabel,
  DesktopInspectorSection,
  DesktopInspectorSegmentedControl,
} from "@/features/desktop-shell/components/InspectorControls"
import {
  DesktopInspectorColorRow,
  DesktopInspectorElasticSliderRow,
  DesktopInspectorNumberField,
  DesktopInspectorValueGrid,
} from "@/features/desktop-shell/components/DesktopInspectorShell"
import type { DesktopAppearanceSnapshot } from "@/features/desktop-shell/model/appearance"
import {
  createDefaultDraftingFilterEffect,
  DRAFTING_FILTER_RANGES,
  DRAFTING_FILTER_VISIBLE_DEFAULTS,
  DRAFTING_LAYER_FILTER_TYPES,
  getDraftingFilterLabel,
  type DraftingFilterEffect,
  type DraftingFilterType,
} from "@/features/workspace/model/filters"
import {
  createDefaultDraftingShadowLayer,
  DRAFTING_BORDER_STYLES,
  type DraftingBorderStyle,
  type DraftingShadowLayerState,
} from "@/features/workspace/model/effects"
import {
  DEFAULT_DRAFTING_IMAGE_LAYER,
  DEFAULT_DRAFTING_SHAPE_LAYER,
  type DraftingCanvasLayer,
} from "@/features/workspace/model/layers"
import { cn } from "@/lib/utils"

const DEFAULT_SHADOW_COLOR = "#111827"

function ShadowLayerRow({
  index,
  shadow,
  onChange,
  onRemove,
}: {
  index: number
  shadow: DraftingShadowLayerState
  onChange: (patch: Partial<DraftingShadowLayerState>) => void
  onRemove: () => void
}) {
  const shadowLabel = `Shadow ${index + 1}`

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "min-w-0 truncate",
            DESKTOP_INSPECTOR_SECTION_HEADING_CLASS,
            "mb-0",
          )}
        >
          {shadowLabel}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <button
            aria-label={shadow.visible ? `Hide ${shadowLabel}` : `Show ${shadowLabel}`}
            className="grid size-7 place-items-center rounded-md text-[var(--desktop-inspector-fg-secondary)] hover:bg-[var(--desktop-inspector-control-hover-bg)]"
            type="button"
            onClick={() => onChange({ visible: !shadow.visible })}
          >
            {shadow.visible ? <EyeIcon className="size-3.5" /> : <EyeOffIcon className="size-3.5" />}
          </button>
          <button
            aria-label={`Remove ${shadowLabel}`}
            className="grid size-7 place-items-center rounded-md text-[var(--desktop-inspector-fg-secondary)] hover:bg-[var(--desktop-inspector-control-hover-bg)]"
            type="button"
            onClick={onRemove}
          >
            <MinusIcon className="size-3.5" />
          </button>
        </div>
      </div>
      <DesktopInspectorColorRow
        label="Color"
        value={shadow.color}
        onChange={(color) => onChange({ color: color || DEFAULT_SHADOW_COLOR })}
      />
      <div className="grid gap-2">
        <DesktopInspectorElasticSliderRow
          label="Blur"
          max={128}
          min={0}
          value={shadow.blur}
          valueLabel={`${Math.round(shadow.blur)}`}
          onChange={(blur) => onChange({ blur })}
        />
        <DesktopInspectorElasticSliderRow
          label="Opacity"
          max={100}
          min={0}
          value={shadow.opacity}
          valueLabel={`${Math.round(shadow.opacity)}%`}
          onChange={(opacity) => onChange({ opacity })}
        />
        <DesktopInspectorValueGrid>
          <DesktopInspectorNumberField
            label="X"
            max={128}
            min={-128}
            value={shadow.offsetX}
            onChange={(offsetX) => onChange({ offsetX })}
          />
          <DesktopInspectorNumberField
            label="Y"
            max={128}
            min={-128}
            value={shadow.offsetY}
            onChange={(offsetY) => onChange({ offsetY })}
          />
        </DesktopInspectorValueGrid>
      </div>
    </div>
  )
}

export function AppearanceShadowControls({
  appearance,
  className,
  onPatch,
}: {
  appearance: DesktopAppearanceSnapshot
  className?: string
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  const shadows = appearance.shadows

  const updateShadows = (nextShadows: DraftingShadowLayerState[]) => {
    onPatch({
      shadow: {
        ...appearance.shadow,
        ...nextShadows[0],
      },
      shadows: nextShadows,
    })
  }

  return (
    <DesktopInspectorSection
      className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS, className)}
      dataSlot="desktop-appearance-shadow-controls"
    >
      <div className="flex items-center justify-between gap-2">
        <DesktopInspectorLabel>Shadow</DesktopInspectorLabel>
        <button
          aria-label="Add shadow"
          className="grid size-7 place-items-center rounded-md text-[var(--desktop-inspector-fg-secondary)] hover:bg-[var(--desktop-inspector-control-hover-bg)]"
          type="button"
          onClick={() =>
            updateShadows([
              ...shadows,
              createDefaultDraftingShadowLayer({
                blur: 24,
                opacity: 40,
                offsetY: 12,
                visible: true,
              }),
            ])
          }
        >
          <PlusIcon className="size-3.5" />
        </button>
      </div>
      <div className="grid gap-2">
        {shadows.map((shadow, index) => (
          <ShadowLayerRow
            key={shadow.id}
            index={index}
            shadow={shadow}
            onChange={(patch) =>
              updateShadows(
                shadows.map((entry, entryIndex) =>
                  entryIndex === index ? { ...entry, ...patch } : entry,
                ),
              )
            }
            onRemove={() => updateShadows(shadows.filter((_, entryIndex) => entryIndex !== index))}
          />
        ))}
      </div>
    </DesktopInspectorSection>
  )
}

function FilterEffectRow({
  effect,
  onChange,
  onRemove,
}: {
  effect: DraftingFilterEffect
  onChange: (patch: Partial<DraftingFilterEffect>) => void
  onRemove: () => void
}) {
  const range = DRAFTING_FILTER_RANGES[effect.type]
  const filterLabel = getDraftingFilterLabel(effect.type)

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <Select
          value={effect.type}
          onValueChange={(nextType) => {
            const type = nextType as DraftingFilterType
            onChange({
              type,
              amount: DRAFTING_FILTER_VISIBLE_DEFAULTS[type],
            })
          }}
        >
          <SelectTrigger
            aria-label="Filter effect"
            className={cn(
              "h-8 min-h-8 min-w-0 flex-1 px-2.5 text-[length:var(--desktop-inspector-type-value)]",
              DESKTOP_INSPECTOR_INPUT_CLASS,
            )}
            data-slot="desktop-appearance-filter-select-trigger"
            placeholder="Select filter"
            variant="bordered"
          />
          <SelectContent
            menuDataSlot="desktop-appearance-filter-select-menu"
            positionerClassName="z-[20001]"
          >
            <SelectGroup>
              {DRAFTING_LAYER_FILTER_TYPES.map((type, index) => (
                <SelectItem
                  key={type}
                  className="desktop-appearance-filter-select-item"
                  index={index}
                  value={type}
                >
                  {getDraftingFilterLabel(type)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className="flex shrink-0 items-center gap-1">
          <button
            aria-label={effect.enabled ? `Disable ${filterLabel}` : `Enable ${filterLabel}`}
            className="grid size-7 place-items-center rounded-md text-[var(--desktop-inspector-fg-secondary)] hover:bg-[var(--desktop-inspector-control-hover-bg)]"
            type="button"
            onClick={() => onChange({ enabled: !effect.enabled })}
          >
            {effect.enabled ? <EyeIcon className="size-3.5" /> : <EyeOffIcon className="size-3.5" />}
          </button>
          <button
            aria-label={`Remove ${filterLabel}`}
            className="grid size-7 place-items-center rounded-md text-[var(--desktop-inspector-fg-secondary)] hover:bg-[var(--desktop-inspector-control-hover-bg)]"
            type="button"
            onClick={onRemove}
          >
            <MinusIcon className="size-3.5" />
          </button>
        </div>
      </div>
      <DesktopInspectorElasticSliderRow
        label="Amount"
        max={range.max}
        min={range.min}
        value={effect.amount}
        valueLabel={`${Math.round(effect.amount)}${range.unit ?? ""}`}
        onChange={(amount) => onChange({ amount })}
      />
    </div>
  )
}

export function AppearanceFilterControls({
  appearance,
  className,
  onPatch,
}: {
  appearance: DesktopAppearanceSnapshot
  className?: string
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  const updateLayerFilters = (layerFilters: DraftingFilterEffect[]) => {
    onPatch({ layerFilters })
  }

  const defaultAddFilterType =
    appearance.layerFilters.at(-1)?.type ?? DRAFTING_LAYER_FILTER_TYPES[0]!

  return (
    <DesktopInspectorSection
      className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS, className)}
      dataSlot="desktop-appearance-filter-controls"
    >
      <div className="flex items-center justify-between gap-2">
        <DesktopInspectorLabel>Filters</DesktopInspectorLabel>
        <button
          aria-label="Add filter"
          className="grid size-7 place-items-center rounded-md text-[var(--desktop-inspector-fg-secondary)] hover:bg-[var(--desktop-inspector-control-hover-bg)]"
          type="button"
          onClick={() =>
            updateLayerFilters([
              ...appearance.layerFilters,
              createDefaultDraftingFilterEffect(defaultAddFilterType, {
                amount: DRAFTING_FILTER_VISIBLE_DEFAULTS[defaultAddFilterType],
              }),
            ])
          }
        >
          <PlusIcon className="size-3.5" />
        </button>
      </div>
      <div className="grid gap-2">
        {appearance.layerFilters.map((effect) => (
          <FilterEffectRow
            key={effect.id}
            effect={effect}
            onChange={(patch) =>
              updateLayerFilters(
                appearance.layerFilters.map((entry) =>
                  entry.id === effect.id ? { ...entry, ...patch } : entry,
                ),
              )
            }
            onRemove={() =>
              updateLayerFilters(appearance.layerFilters.filter((entry) => entry.id !== effect.id))
            }
          />
        ))}
      </div>
    </DesktopInspectorSection>
  )
}

export function AppearanceOutlineControls({
  appearance,
  className,
  onPatch,
}: {
  appearance: DesktopAppearanceSnapshot
  className?: string
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  if (!appearance.supportsOutline) {
    return null
  }

  const outline = appearance.outline

  return (
    <DesktopInspectorSection
      className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS, className)}
      dataSlot="desktop-appearance-outline-controls"
    >
      <DesktopInspectorLabel>Outline</DesktopInspectorLabel>
      <DesktopInspectorSegmentedControl
        ariaLabelPrefix="Outline style"
        items={DRAFTING_BORDER_STYLES.map((style) => ({ label: style, value: style }))}
        onValueChange={(style: DraftingBorderStyle) =>
          onPatch({ outline: { ...outline, style } })
        }
        value={outline.style}
      />
      <DesktopInspectorColorRow
        label="Outline color"
        value={outline.color}
        onChange={(color) => onPatch({ outline: { ...outline, color: color || "#111827" } })}
      />
      <div className="mt-2 grid gap-2">
        <DesktopInspectorElasticSliderRow
          label="Outline width"
          max={64}
          min={0}
          value={outline.width}
          valueLabel={`${Math.round(outline.width)}`}
          onChange={(width) => onPatch({ outline: { ...outline, width, visible: width > 0 } })}
        />
        <DesktopInspectorElasticSliderRow
          label="Outline offset"
          max={64}
          min={-64}
          value={outline.offset}
          valueLabel={`${Math.round(outline.offset)}`}
          onChange={(offset) => onPatch({ outline: { ...outline, offset } })}
        />
        <DesktopInspectorElasticSliderRow
          label="Outline opacity"
          max={100}
          min={0}
          value={outline.opacity}
          valueLabel={`${Math.round(outline.opacity)}%`}
          onChange={(opacity) => onPatch({ outline: { ...outline, opacity } })}
        />
      </div>
    </DesktopInspectorSection>
  )
}

export function AppearanceBlurControls({
  appearance,
  className,
  onPatch,
}: {
  appearance: DesktopAppearanceSnapshot
  className?: string
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  return (
    <AppearanceFilterControls appearance={appearance} className={className} onPatch={onPatch} />
  )
}

export function AppearanceOpacityControls({
  appearance,
  className,
  onPatch,
}: {
  appearance: DesktopAppearanceSnapshot
  className?: string
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  return (
    <DesktopInspectorSection
      className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS, className)}
      dataSlot="desktop-appearance-opacity-controls"
    >
      <DesktopInspectorLabel>Opacity</DesktopInspectorLabel>
      <DesktopInspectorElasticSliderRow
        label="Opacity"
        max={100}
        min={0}
        value={Math.round(appearance.opacity * 100)}
        valueLabel={`${Math.round(appearance.opacity * 100)}%`}
        onChange={(opacity) => onPatch({ opacity: opacity / 100 })}
      />
    </DesktopInspectorSection>
  )
}

export function AppearanceRadiusControls({
  appearance,
  className,
  onPatch,
}: {
  appearance: DesktopAppearanceSnapshot
  className?: string
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  if (!appearance.supportsCornerRadius) {
    return null
  }

  const defaultRadius =
    appearance.cornerRadius ??
    DEFAULT_DRAFTING_IMAGE_LAYER.cornerRadius ??
    DEFAULT_DRAFTING_SHAPE_LAYER.cornerRadius

  return (
    <DesktopInspectorSection
      className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS, className)}
      dataSlot="desktop-appearance-radius-controls"
    >
      <DesktopInspectorLabel>Corner radius</DesktopInspectorLabel>
      <DesktopInspectorElasticSliderRow
        label="Corner radius"
        max={512}
        min={0}
        value={defaultRadius}
        valueLabel={`${Math.round(defaultRadius)}`}
        onChange={(cornerRadius) => onPatch({ cornerRadius })}
      />
    </DesktopInspectorSection>
  )
}
