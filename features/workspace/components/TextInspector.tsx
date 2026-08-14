"use client"

import { useEffect, useMemo, useState } from "react"

import {
  DEFAULT_DRAFTING_TEXT_LAYER,
  type DraftingCanvasLayer,
} from "@/features/workspace/model/layers"
import {
  DRAFTING_FONT_REGISTRY,
  getDraftingFontCssFamily,
  loadDraftingFont,
  resolveDraftingFont,
  type DraftingFontSource,
} from "@/features/workspace/model/fonts"
import {
  InspectorNumberInput,
  InspectorToggleButton,
} from "@/features/workspace/components/inspector/InspectorFields"
import {
  DraftingInspectorSection,
} from "@/features/workspace/components/InspectorPanel"
import {
  type DraftingSliderVariant,
} from "@/features/workspace/components/StylePanel"
import { ElasticSlider } from "@/components/ui/elastic-slider"
import { Slider as UnlumenSlider } from "@/components/vendor/unlumen-ui/slider"
import { cn } from "@/lib/utils"

export function TextInspector({
  layer,
  onPatch,
  sliderVariant,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  sliderVariant: DraftingSliderVariant
}) {
  const selectedFont = resolveDraftingFont({
    fontFamily: layer.fontFamily,
    fontId: layer.fontId,
  })
  const supportedFontWeights = selectedFont.weights
  const fontWeight = getDraftingTextInspectorFontWeight(layer.fontWeight, supportedFontWeights)
  const [fontQuery, setFontQuery] = useState("")
  const filteredFonts = useMemo(() => {
    const query = fontQuery.trim().toLowerCase()

    return DRAFTING_FONT_REGISTRY.filter((font) => {
      if (!query) {
        return true
      }

      return (
        font.label.toLowerCase().includes(query) ||
        font.family.toLowerCase().includes(query) ||
        font.source.toLowerCase().includes(query)
      )
    })
  }, [fontQuery])
  const groupedFonts = useMemo(
    () =>
      (["local", "fontshare", "system"] as const).map((source) => ({
        fonts: filteredFonts.filter((font) => font.source === source),
        source,
      })),
    [filteredFonts],
  )

  useEffect(() => {
    void loadDraftingFont(selectedFont.id)
  }, [selectedFont.id])

  function patchTextLayer(patch: Partial<DraftingCanvasLayer>) {
    onPatch({ ...patch, textRuns: undefined })
  }

  return (
    <DraftingInspectorSection dataSlot="drafting-text-inspector" title="Text">
      <label className="block min-w-0">
        <span className="ws-type-control-label mb-1.5 block font-semibold text-[var(--ws-ink)]">
          Content
        </span>
        <textarea
          aria-label="Text layer content"
          className="ws-type-input min-h-24 w-full resize-y rounded-[6px] border border-[var(--ws-line)] bg-[var(--ws-panel-bg-hover)] px-3 py-2 text-[var(--ws-ink)] shadow-none"
          value={layer.text ?? ""}
          onChange={(event) => patchTextLayer({ text: event.currentTarget.value })}
        />
      </label>

      <div className="block min-w-0" data-slot="drafting-font-picker">
        <span className="ws-type-meta mb-1 block font-semibold text-[var(--ws-ink-muted)]">
          Font
        </span>
        <input
          aria-label="Search text fonts"
          className="ws-type-input h-9 w-full rounded-[6px] border border-[var(--ws-line)] bg-[var(--ws-panel-bg-hover)] px-2 text-[var(--ws-ink)] shadow-none"
          placeholder={selectedFont.label}
          type="search"
          value={fontQuery}
          onChange={(event) => setFontQuery(event.currentTarget.value)}
        />
        <div className="mt-2 max-h-52 min-w-0 space-y-3 overflow-y-auto rounded-[6px] border border-[var(--ws-line)] bg-[var(--ws-panel-bg-hover)] p-2">
          {groupedFonts.map(({ fonts, source }) =>
            fonts.length > 0 ? (
              <div key={source} className="min-w-0 space-y-1">
                <p className="ws-type-meta px-1 font-semibold text-[var(--ws-ink-muted)]">
                  {getDraftingFontSourceLabel(source)}
                </p>
                {fonts.map((font) => {
                  const isSelected = font.id === selectedFont.id

                  return (
                    <button
                      key={font.id}
                      aria-label={`Choose ${font.label}`}
                      aria-pressed={isSelected}
                      className={cn(
                        "flex h-9 w-full items-center justify-between gap-2 rounded-[5px] px-2 text-left text-xs font-semibold text-[var(--ws-ink-muted)] hover:bg-[var(--ws-control-bg-active)] hover:text-[var(--ws-ink)]",
                        isSelected &&
                          "bg-[var(--ws-control-bg-active)] text-[var(--ws-ink)]",
                      )}
                      style={{ fontFamily: getDraftingFontCssFamily({ fontId: font.id }) }}
                      type="button"
                      onClick={() => {
                        void loadDraftingFont(font.id)
                        patchTextLayer({ fontFamily: font.family, fontId: font.id })
                      }}
                      onMouseEnter={() => {
                        void loadDraftingFont(font.id)
                      }}
                    >
                      <span className="truncate">{font.label}</span>
                    </button>
                  )
                })}
              </div>
            ) : null,
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <InspectorNumberInput
          label="Size"
          max={300}
          min={6}
          value={layer.fontSize ?? DEFAULT_DRAFTING_TEXT_LAYER.fontSize}
          onChange={(fontSize) => patchTextLayer({ fontSize })}
        />
        <InspectorNumberInput
          label="Spacing"
          max={200}
          min={-50}
          value={layer.letterSpacing ?? DEFAULT_DRAFTING_TEXT_LAYER.letterSpacing}
          onChange={(letterSpacing) => patchTextLayer({ letterSpacing })}
        />
        <InspectorNumberInput
          label="Line"
          max={4}
          min={0.6}
          step={0.05}
          value={layer.lineHeight ?? DEFAULT_DRAFTING_TEXT_LAYER.lineHeight}
          onChange={(lineHeight) => patchTextLayer({ lineHeight })}
        />
        <label className="min-w-0">
          <span className="ws-type-meta mb-1 block font-semibold text-[var(--ws-ink-muted)]">
            Fill
          </span>
          <input
            aria-label="Text fill color"
            className="h-9 w-full rounded-[6px] border border-[var(--ws-line)] bg-transparent p-1"
            type="color"
            value={layer.fill ?? DEFAULT_DRAFTING_TEXT_LAYER.fill}
            onChange={(event) => patchTextLayer({ fill: event.currentTarget.value })}
          />
        </label>
      </div>

      <TextWeightSlider
        sliderVariant={sliderVariant}
        supportedWeights={supportedFontWeights}
        value={fontWeight}
        onChange={(nextFontWeight) =>
          patchTextLayer({
            fontWeight: getNearestDraftingFontWeight(nextFontWeight, supportedFontWeights),
          })
        }
      />

      <div className="grid grid-cols-3 gap-2">
        {(["left", "center", "right"] as const).map((textAlign) => (
          <InspectorToggleButton
            active={(layer.textAlign ?? DEFAULT_DRAFTING_TEXT_LAYER.textAlign) === textAlign}
            key={textAlign}
            label={textAlign}
            onClick={() => patchTextLayer({ textAlign })}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <InspectorToggleButton
          active={fontWeight >= 700}
          label="Bold"
          onClick={() =>
            patchTextLayer({
              fontWeight:
                fontWeight >= 700
                  ? getNearestDraftingFontWeight(400, supportedFontWeights)
                  : getNearestDraftingFontWeight(700, supportedFontWeights),
            })
          }
        />
        <InspectorToggleButton
          active={(layer.fontStyle ?? DEFAULT_DRAFTING_TEXT_LAYER.fontStyle) === "italic"}
          label="Italic"
          onClick={() =>
            patchTextLayer({
              fontStyle:
                (layer.fontStyle ?? DEFAULT_DRAFTING_TEXT_LAYER.fontStyle) === "italic"
                  ? "normal"
                  : "italic",
            })
          }
        />
        <InspectorToggleButton
          active={Boolean(layer.underline)}
          label="Underline"
          onClick={() => patchTextLayer({ underline: !layer.underline })}
        />
      </div>
    </DraftingInspectorSection>
  )
}

function getDraftingFontSourceLabel(source: DraftingFontSource) {
  if (source === "local") {
    return "Brand / App fonts"
  }

  if (source === "fontshare") {
    return "Fontshare"
  }

  return "System"
}

function TextWeightSlider({
  onChange,
  sliderVariant,
  supportedWeights,
  value,
}: {
  onChange: (value: number) => void
  sliderVariant: DraftingSliderVariant
  supportedWeights: readonly number[]
  value: number
}) {
  const min = Math.min(...supportedWeights)
  const max = Math.max(...supportedWeights)
  const step = getDraftingFontWeightSliderStep(supportedWeights)
  const isDesktopElastic = sliderVariant === "desktop-elastic"

  return (
    <div
      className={cn(
        "min-w-0",
        isDesktopElastic
          ? "px-0 py-1"
          : "rounded-[8px] border border-[var(--ws-line)] bg-[var(--ws-panel-bg-hover)] px-3 py-2",
      )}
    >
      {isDesktopElastic ? (
        <ElasticSlider
          aria-label="Text font weight"
          className="desktop-elastic-slider w-full"
          formatValue={(fontWeight) => String(Math.round(fontWeight))}
          label="Weight"
          max={max}
          min={min}
          scrubSound
          step={step}
          value={value}
          onValueChange={(nextValue) => {
            onChange(getNearestDraftingFontWeight(nextValue, supportedWeights))
          }}
        />
      ) : (
        <UnlumenSlider
          aria-label="Text font weight"
          appearance="drafting"
          className="w-full"
          formatValue={(fontWeight) => String(Math.round(fontWeight))}
          label="Weight"
          max={max}
          min={min}
          showValue
          step={step}
          value={value}
          onChange={(nextValue) => {
            onChange(
              getNearestDraftingFontWeight(
                Array.isArray(nextValue) ? (nextValue[0] ?? value) : nextValue,
                supportedWeights,
              ),
            )
          }}
        />
      )}
    </div>
  )
}

function getDraftingTextInspectorFontWeight(
  fontWeight: DraftingCanvasLayer["fontWeight"],
  supportedWeights: readonly number[],
) {
  if (fontWeight === "bold") {
    return getNearestDraftingFontWeight(700, supportedWeights)
  }

  if (typeof fontWeight === "number" && Number.isFinite(fontWeight)) {
    return getNearestDraftingFontWeight(fontWeight, supportedWeights)
  }

  return getNearestDraftingFontWeight(400, supportedWeights)
}

function getNearestDraftingFontWeight(value: number, supportedWeights: readonly number[]) {
  return supportedWeights.reduce((nearestWeight, candidateWeight) => {
    const nearestDistance = Math.abs(nearestWeight - value)
    const candidateDistance = Math.abs(candidateWeight - value)

    if (candidateDistance === nearestDistance) {
      return candidateWeight > nearestWeight ? candidateWeight : nearestWeight
    }

    return candidateDistance < nearestDistance ? candidateWeight : nearestWeight
  }, supportedWeights[0] ?? 400)
}

function getDraftingFontWeightSliderStep(supportedWeights: readonly number[]) {
  const sortedWeights = [...new Set(supportedWeights)].sort((a, b) => a - b)

  if (sortedWeights.length < 2) {
    return 1
  }

  return Math.min(
    ...sortedWeights.slice(1).map((fontWeight, index) => fontWeight - sortedWeights[index]),
  )
}
