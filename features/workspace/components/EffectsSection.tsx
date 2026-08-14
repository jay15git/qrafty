"use client"

import { EyeIcon, EyeOffIcon, MinusIcon, PlusIcon } from "lucide-react"
import { useState } from "react"

import {
  DraftingInspectorSection,
  DraftingInspectorValueGrid,
} from "@/features/workspace/components/InspectorPanel"
import { InspectorNumberInput } from "@/features/workspace/components/inspector/InspectorFields"
import {
  createDefaultDraftingFilterEffect,
  DRAFTING_FILTER_RANGES,
  DRAFTING_LAYER_FILTER_TYPES,
  type DraftingFilterEffect,
  type DraftingFilterType,
} from "@/features/workspace/model/filters"
import {
  createDefaultDraftingShadowLayer,
  DRAFTING_BORDER_SIDE_KEYS,
  DRAFTING_BORDER_STYLES,
  type DraftingBorderSideKey,
  type DraftingBorderStyle,
  type DraftingShadowLayerState,
} from "@/features/workspace/model/effects"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import {
  layerSupportsCornerRadius,
} from "@/features/workspace/model/corner-radius"
import { CornerRadiusControls } from "@/features/workspace/components/CornerRadiusControls"

const DEFAULT_SHADOW_COLOR = "#111827"

export function EffectsSection({
  layer,
  onPatch,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  const [activeBorderSide, setActiveBorderSide] = useState<DraftingBorderSideKey>("top")

  const updateShadows = (shadows: DraftingShadowLayerState[]) => {
    onPatch({
      shadow: {
        ...layer.shadow,
        ...shadows[0],
      },
      shadows,
    })
  }

  const updateLayerFilters = (layerFilters: DraftingFilterEffect[]) => {
    onPatch({ layerFilters })
  }

  return (
    <DraftingInspectorSection dataSlot="drafting-effects-section" title="Effects">
      <DraftingInspectorSection dataSlot="drafting-outline-section" title="Outline">
        <select
          aria-label="Outline style"
          className="ws-type-input h-8 w-full rounded-[6px] border border-[var(--ws-line)] bg-[var(--ws-panel-bg-hover)] px-2"
          value={layer.outline.style}
          onChange={(event) =>
            onPatch({
              outline: {
                ...layer.outline,
                style: event.currentTarget.value as DraftingBorderStyle,
              },
            })
          }
        >
          {DRAFTING_BORDER_STYLES.map((style) => (
            <option key={style} value={style}>
              {style}
            </option>
          ))}
        </select>
        <DraftingInspectorValueGrid>
          <InspectorNumberInput
            label="Width"
            max={64}
            min={0}
            value={layer.outline.width}
            onChange={(width) =>
              onPatch({ outline: { ...layer.outline, width, visible: width > 0 } })
            }
          />
          <InspectorNumberInput
            label="Offset"
            max={64}
            min={-64}
            value={layer.outline.offset}
            onChange={(offset) => onPatch({ outline: { ...layer.outline, offset } })}
          />
          <InspectorNumberInput
            label="Opacity"
            max={100}
            min={0}
            value={layer.outline.opacity}
            onChange={(opacity) => onPatch({ outline: { ...layer.outline, opacity } })}
          />
        </DraftingInspectorValueGrid>
      </DraftingInspectorSection>

      {layer.borderSides ? (
        <DraftingInspectorSection dataSlot="drafting-border-section" title="Border sides">
          <select
            aria-label="Border side"
            className="ws-type-input h-8 w-full rounded-[6px] border border-[var(--ws-line)] bg-[var(--ws-panel-bg-hover)] px-2"
            value={activeBorderSide}
            onChange={(event) => setActiveBorderSide(event.currentTarget.value as DraftingBorderSideKey)}
          >
            {DRAFTING_BORDER_SIDE_KEYS.map((side) => (
              <option key={side} value={side}>
                {side}
              </option>
            ))}
          </select>
          <DraftingInspectorValueGrid>
            <InspectorNumberInput
              label="Width"
              max={64}
              min={0}
              value={layer.borderSides[activeBorderSide].width}
              onChange={(width) =>
                onPatch({
                  borderSides: {
                    ...layer.borderSides!,
                    [activeBorderSide]: { ...layer.borderSides![activeBorderSide], width },
                  },
                })
              }
            />
            <InspectorNumberInput
              label="Opacity"
              max={100}
              min={0}
              value={layer.borderSides[activeBorderSide].opacity}
              onChange={(opacity) =>
                onPatch({
                  borderSides: {
                    ...layer.borderSides!,
                    [activeBorderSide]: { ...layer.borderSides![activeBorderSide], opacity },
                  },
                })
              }
            />
          </DraftingInspectorValueGrid>
        </DraftingInspectorSection>
      ) : null}

      {layerSupportsCornerRadius(layer) ? (
        <CornerRadiusControls
          cornerRadius={layer.cornerRadius}
          cornerRadii={layer.cornerRadii}
          onChange={(patch) => onPatch(patch)}
        />
      ) : null}

      <DraftingInspectorSection dataSlot="drafting-shadow-section" title="Shadow">
        <div className="mb-2 flex justify-end">
          <button
            aria-label="Add shadow"
            className="inline-flex size-7 items-center justify-center rounded-md border border-[var(--ws-line)]"
            type="button"
            onClick={() =>
              updateShadows([
                ...layer.shadows,
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
        {layer.shadows.map((shadow, index) => (
          <div
            key={shadow.id}
            className="mb-3 rounded-[8px] border border-[var(--ws-line)] p-2"
          >
            <div className="mb-2 flex items-center justify-end gap-1">
              <button
                aria-label={shadow.visible ? "Hide shadow" : "Show shadow"}
                className="inline-flex size-7 items-center justify-center rounded-md border border-[var(--ws-line)]"
                type="button"
                onClick={() =>
                  updateShadows(
                    layer.shadows.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, visible: !entry.visible } : entry,
                    ),
                  )
                }
              >
                {shadow.visible ? <EyeIcon className="size-3.5" /> : <EyeOffIcon className="size-3.5" />}
              </button>
              <button
                aria-label="Remove shadow"
                className="inline-flex size-7 items-center justify-center rounded-md border border-[var(--ws-line)]"
                type="button"
                onClick={() =>
                  updateShadows(layer.shadows.filter((_, entryIndex) => entryIndex !== index))
                }
              >
                <MinusIcon className="size-3.5" />
              </button>
            </div>
            <label className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] items-center gap-2">
              <input
                aria-label="Shadow color swatch"
                className="size-8 rounded-[6px] border border-[var(--ws-line)] bg-transparent p-1"
                type="color"
                value={shadow.color}
                onChange={(event) =>
                  updateShadows(
                    layer.shadows.map((entry, entryIndex) =>
                      entryIndex === index
                        ? { ...entry, color: event.currentTarget.value }
                        : entry,
                    ),
                  )
                }
              />
              <input
                aria-label="Shadow color"
                className="ws-type-input h-8 min-w-0 rounded-[6px] border border-[var(--ws-line)] bg-[var(--ws-panel-bg-hover)] px-2 text-[var(--ws-ink)] shadow-none"
                value={shadow.color}
                onChange={(event) =>
                  updateShadows(
                    layer.shadows.map((entry, entryIndex) =>
                      entryIndex === index
                        ? {
                            ...entry,
                            color: event.currentTarget.value || DEFAULT_SHADOW_COLOR,
                          }
                        : entry,
                    ),
                  )
                }
              />
            </label>
            <DraftingInspectorValueGrid>
              <InspectorNumberInput
                label="Blur"
                max={128}
                min={0}
                value={shadow.blur}
                onChange={(blur) =>
                  updateShadows(
                    layer.shadows.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, blur } : entry,
                    ),
                  )
                }
              />
              <InspectorNumberInput
                label="Opacity"
                max={100}
                min={0}
                value={shadow.opacity}
                onChange={(opacity) =>
                  updateShadows(
                    layer.shadows.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, opacity } : entry,
                    ),
                  )
                }
              />
              <InspectorNumberInput
                label="Offset X"
                max={256}
                min={-256}
                value={shadow.offsetX}
                onChange={(offsetX) =>
                  updateShadows(
                    layer.shadows.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, offsetX } : entry,
                    ),
                  )
                }
              />
              <InspectorNumberInput
                label="Offset Y"
                max={256}
                min={-256}
                value={shadow.offsetY}
                onChange={(offsetY) =>
                  updateShadows(
                    layer.shadows.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, offsetY } : entry,
                    ),
                  )
                }
              />
            </DraftingInspectorValueGrid>
          </div>
        ))}
      </DraftingInspectorSection>

      <DraftingInspectorSection dataSlot="drafting-filter-section" title="Filters">
        <FilterSection
          filters={layer.layerFilters}
          label="Layer"
          onChange={updateLayerFilters}
        />
      </DraftingInspectorSection>
    </DraftingInspectorSection>
  )
}

function FilterSection({
  filters,
  label,
  onChange,
}: {
  filters: DraftingFilterEffect[]
  label: string
  onChange: (filters: DraftingFilterEffect[]) => void
}) {
  const available = DRAFTING_LAYER_FILTER_TYPES.filter(
    (type) => !filters.some((filter) => filter.type === type),
  )

  return (
    <div className="mb-3">
      <p className="mb-2 text-xs font-semibold text-[var(--ws-ink-muted)]">{label}</p>
      {filters.map((effect) => {
        const range = DRAFTING_FILTER_RANGES[effect.type]

        return (
          <div
            key={effect.id}
            className="mb-2 rounded-[8px] border border-[var(--ws-line)] p-2"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold capitalize">{effect.type.replace("-", " ")}</span>
              <div className="flex gap-1">
                <button
                  aria-label={effect.enabled ? "Disable filter" : "Enable filter"}
                  className="inline-flex size-7 items-center justify-center rounded-md border border-[var(--ws-line)]"
                  type="button"
                  onClick={() =>
                    onChange(
                      filters.map((entry) =>
                        entry.id === effect.id ? { ...entry, enabled: !entry.enabled } : entry,
                      ),
                    )
                  }
                >
                  {effect.enabled ? <EyeIcon className="size-3.5" /> : <EyeOffIcon className="size-3.5" />}
                </button>
                <button
                  aria-label="Remove filter"
                  className="inline-flex size-7 items-center justify-center rounded-md border border-[var(--ws-line)]"
                  type="button"
                  onClick={() => onChange(filters.filter((entry) => entry.id !== effect.id))}
                >
                  <MinusIcon className="size-3.5" />
                </button>
              </div>
            </div>
            <InspectorNumberInput
              label="Amount"
              max={range.max}
              min={range.min}
              value={effect.amount}
              onChange={(amount) =>
                onChange(
                  filters.map((entry) => (entry.id === effect.id ? { ...entry, amount } : entry)),
                )
              }
            />
          </div>
        )
      })}
      {available.length > 0 ? (
        <select
          aria-label={`Add ${label} filter`}
          className="ws-type-input h-8 w-full rounded-[6px] border border-[var(--ws-line)] bg-[var(--ws-panel-bg-hover)] px-2"
          value=""
          onChange={(event) => {
            const type = event.currentTarget.value as DraftingFilterType
            if (!type) return
            onChange([...filters, createDefaultDraftingFilterEffect(type)])
          }}
        >
          <option value="">Add filter</option>
          {available.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  )
}
