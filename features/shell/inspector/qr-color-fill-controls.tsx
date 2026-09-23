"use client"

import { Plus } from "lucide-react"
import { useState } from "react"

import { CHECKERBOARD_SM } from "@/components/ui/fill-picker/lib/constants"
import { formatColor, parseColor } from "@/components/ui/fill-picker/lib/color"
import type { Fill } from "@/components/ui/fill-picker/public-api"
import type { DotsColorMode } from "@/features/qr/model/state"
import { DesktopFillPicker } from "@/features/shell/inspector/fill-picker"
import {
  isGradientFill,
  type ModuleImageControl,
  type ModulePatternControl,
} from "@/features/shell/inspector/fill-picker.utils"
import {
  SettingsImageOptionGrid,
  SettingsImageUploadTile,
  SettingsPatternOptionGrid,
} from "@/features/shell/inspector/settings-fill-option-grid"
import {
  SETTINGS_FILL_LINEAR_PRESETS,
  SETTINGS_FILL_RADIAL_PRESETS,
  SETTINGS_FILL_SOLID_PRESETS,
} from "@/features/shell/inspector/settings-fill-presets"
import { useMobileInspectorDensity } from "@/features/shell/inspector/mobile-inspector-density-context"
import { SETTINGS_FILL_OPTION_TILE_INNER, SETTINGS_PREVIEW_TILE_FLUID } from "@/features/shell/inspector/settings-preview-tiles"
import {
  SegmentTabs,
  SettingsAccordionColorPicker,
  SettingsFillPresetSection,
  SettingsLabeledSelect,
  SettingsTilePopover,
} from "@/features/shell/inspector/settings-ui"
import { cn } from "@/lib/utils"

type QrColorFillModeTab =
  | "Solid"
  | "Linear"
  | "Radial"
  | "Pattern"
  | "Image"

const PATTERN_ROW_SWATCH =
  "size-7 shrink-0 cursor-pointer overflow-hidden dn-squircle-xs outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus,var(--ring))]"

const PATTERN_COLOR_SWATCH =
  "size-8 shrink-0 cursor-pointer overflow-hidden dn-squircle-xs outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus,var(--ring))]"

function PatternColorSwatchPreview({ color }: { color: string }) {
  const parsed = parseColor(color) ?? { l: 0, c: 0, h: 0, alpha: 1 }
  const preview = formatColor(parsed, "oklch")

  return (
    <span
      aria-hidden
      className="block size-full dn-squircle-xs"
      style={{
        backgroundImage: `linear-gradient(${preview}, ${preview}), ${CHECKERBOARD_SM}`,
        backgroundSize: "auto, 6px 6px",
      }}
    />
  )
}

/** Desktop accordion row: each palette swatch opens its own picker. */
function PatternRowSwatch({
  color,
  index,
  onPaletteColorChange,
}: {
  color: string
  index: number
  onPaletteColorChange: (index: number, color: string) => void
}) {
  return (
    <SettingsAccordionColorPicker
      title={`Color ${index + 1}`}
      value={color}
      onValueChange={(fill) => {
        if (fill.kind === "color") {
          onPaletteColorChange(index, formatColor(fill.color, "hex"))
        }
      }}
    >
      <button
        aria-label={`Edit color ${index + 1}`}
        className={PATTERN_ROW_SWATCH}
        type="button"
      >
        <PatternColorSwatchPreview color={color} />
      </button>
    </SettingsAccordionColorPicker>
  )
}

/** Palette editing for the Pattern fill: swatch strip on top, solid picker
 *  below, retargeted by the selected swatch. */
export function PatternColorPickerContent({
  onPaletteColorChange,
  selectedPalette,
}: {
  onPaletteColorChange: (index: number, color: string) => void
  selectedPalette: string[]
}) {
  const [index, setIndex] = useState(0)
  const active = Math.min(index, selectedPalette.length - 1)

  return (
    <div className="flex w-full flex-col gap-3">
      <div
        aria-label="Pattern colors"
        className="flex w-full items-center justify-between gap-2"
        role="group"
      >
        {selectedPalette.map((color, colorIndex) => (
          <button
            key={`pattern-color-${colorIndex}`}
            aria-label={`Edit color ${colorIndex + 1}`}
            aria-pressed={colorIndex === active}
            className={cn(PATTERN_COLOR_SWATCH, "dn-preview-tile")}
            type="button"
            onClick={() => setIndex(colorIndex)}
          >
            <PatternColorSwatchPreview color={color} />
          </button>
        ))}
      </div>
      <DesktopFillPicker
        key={active}
        solidOnly
        value={selectedPalette[active] ?? "#000000"}
        onValueChange={(fill) => {
          if (fill.kind === "color") {
            onPaletteColorChange(active, formatColor(fill.color, "hex"))
          }
        }}
      />
    </div>
  )
}

/** Mobile drawer: one plus tile ahead of the presets opens palette editing. */
function PatternColorsPlusTile({
  onPaletteColorChange,
  selectedPalette,
}: {
  onPaletteColorChange: (index: number, color: string) => void
  selectedPalette: string[]
}) {
  return (
    <SettingsTilePopover
      title="Pattern colors"
      content={
        <PatternColorPickerContent
          selectedPalette={selectedPalette}
          onPaletteColorChange={onPaletteColorChange}
        />
      }
    >
      <button
        aria-label="Edit pattern colors"
        className={cn(SETTINGS_PREVIEW_TILE_FLUID)}
        type="button"
      >
        <span aria-hidden className={SETTINGS_FILL_OPTION_TILE_INNER}>
          <span className="grid size-full place-items-center bg-[color-mix(in_srgb,var(--muted)_38%,transparent)] text-[var(--fg)] transition-colors group-hover:bg-[color-mix(in_srgb,var(--muted)_55%,transparent)] dn-squircle-xs">
            <Plus className="size-4" strokeWidth={2.5} />
          </span>
        </span>
      </button>
    </SettingsTilePopover>
  )
}

function moduleFillModeToTab(mode: DotsColorMode, value: string): QrColorFillModeTab {
  switch (mode) {
    case "image":
      return "Image"
    case "palette":
      return "Pattern"
    case "gradient":
      return value.startsWith("radial-gradient") ? "Radial" : "Linear"
    default:
      return "Solid"
  }
}

function fillValueToTab(value: string): "Solid" | "Linear" | "Radial" {
  if (value.startsWith("radial-gradient")) return "Radial"
  if (isGradientFill(value)) return "Linear"
  return "Solid"
}

function QrColorFillPatternSection({
  mobileDensity,
  modulePattern,
  persistKey,
}: {
  mobileDensity: boolean
  modulePattern: ModulePatternControl
  persistKey: string
}) {
  if (mobileDensity) {
    return (
      <SettingsPatternOptionGrid
        leadingAction={
          <PatternColorsPlusTile
            selectedPalette={modulePattern.selectedPalette}
            onPaletteColorChange={modulePattern.onPaletteColorChange}
          />
        }
        label="Presets"
        persistKey={`${persistKey}:pattern`}
        selectedPalette={modulePattern.selectedPalette}
        selectedPreset={modulePattern.selectedPreset}
        onSelect={(preset) => modulePattern.onSelect(preset)}
      />
    )
  }

  return (
    <>
      <div className="flex min-h-[var(--settings-control-height)] items-center">
        <span className="dn-row-label-text pl-[var(--settings-row-px)]">Pattern</span>
        <div
          aria-label="Pattern colors"
          className="ml-auto flex items-center gap-1.5"
          role="group"
        >
          {modulePattern.selectedPalette.map((color, index) => (
            <PatternRowSwatch
              key={`pattern-color-${color}-${modulePattern.selectedPalette.slice(0, index).filter((entry) => entry === color).length}`}
              color={color}
              index={index}
              onPaletteColorChange={modulePattern.onPaletteColorChange}
            />
          ))}
        </div>
      </div>
      <SettingsPatternOptionGrid
        label="Presets"
        persistKey={`${persistKey}:pattern`}
        selectedPalette={modulePattern.selectedPalette}
        selectedPreset={modulePattern.selectedPreset}
        onSelect={(preset) => modulePattern.onSelect(preset)}
      />
    </>
  )
}

function QrColorFillImageSection({
  moduleImage,
  persistKey,
}: {
  moduleImage: ModuleImageControl
  persistKey: string
}) {
  return (
    <>
      <div className="flex min-h-[var(--settings-control-height)] items-center">
        <span className="dn-row-label-text pl-[var(--settings-row-px)]">Upload</span>
        <SettingsImageUploadTile
          ariaLabel="Upload custom image"
          className="dn-row-upload-tile ml-auto"
          imageUrl={moduleImage.imageUrl}
          onClear={moduleImage.onClear}
          onUpload={(imageUrl) => moduleImage.onUpload(imageUrl, "upload")}
        />
      </div>
      <SettingsImageOptionGrid
        hideUploadTile
        label="Presets"
        persistKey={`${persistKey}:image`}
        selectedPath={moduleImage.imageUrl}
        onClear={moduleImage.onClear}
        onSelect={(imagePath) => moduleImage.onUpload(imagePath, "url")}
        onUpload={(imageUrl) => moduleImage.onUpload(imageUrl, "upload")}
      />
    </>
  )
}

function QrColorFillModeContent({
  fillPreviewImageUrl,
  mobileDensity,
  modeTab,
  moduleImage,
  modulePattern,
  persistKey,
  qrGradient,
  value,
  onValueChange,
}: {
  fillPreviewImageUrl?: string
  mobileDensity: boolean
  modeTab: QrColorFillModeTab
  moduleImage?: ModuleImageControl
  modulePattern?: ModulePatternControl
  persistKey: string
  qrGradient: boolean
  value: string
  onValueChange: (fill: Fill, css: string) => void
}) {
  if (modeTab === "Pattern" && modulePattern) {
    return (
      <QrColorFillPatternSection
        mobileDensity={mobileDensity}
        modulePattern={modulePattern}
        persistKey={persistKey}
      />
    )
  }

  if (modeTab === "Image" && moduleImage) {
    return (
      <QrColorFillImageSection
        moduleImage={moduleImage}
        persistKey={persistKey}
      />
    )
  }

  if (modeTab !== "Solid" && modeTab !== "Linear" && modeTab !== "Radial") {
    return null
  }

  const presets =
    modeTab === "Linear"
      ? SETTINGS_FILL_LINEAR_PRESETS
      : modeTab === "Radial"
        ? SETTINGS_FILL_RADIAL_PRESETS
        : SETTINGS_FILL_SOLID_PRESETS

  return (
    <SettingsFillPresetSection
      fillPreviewImageUrl={fillPreviewImageUrl}
      lockedFillMode={modeTab === "Solid" ? "solid" : "gradient"}
      presets={presets}
      qrGradient={qrGradient}
      value={value}
      onSelect={onValueChange}
    />
  )
}

export function QrColorFillControls({
  value,
  onValueChange,
  persistKey,
  moduleCapable = false,
  moduleFillMode,
  fillPreviewImageUrl,
  modulePattern,
  moduleImage,
  qrGradient = true,
}: {
  value: string
  onValueChange: (fill: Fill, css: string) => void
  persistKey: string
  moduleCapable?: boolean
  moduleFillMode?: DotsColorMode
  fillPreviewImageUrl?: string
  qrGradient?: boolean
  modulePattern?: ModulePatternControl
  moduleImage?: ModuleImageControl
}) {
  const mobileDensity = useMobileInspectorDensity()
  const modeTabs = moduleCapable
    ? (["Solid", "Linear", "Radial", "Pattern", "Image"] as const)
    : (["Solid", "Linear", "Radial"] as const)
  const [modeTab, setModeTab] = useState<QrColorFillModeTab>(() =>
    moduleCapable
      ? moduleFillModeToTab(moduleFillMode ?? "solid", value)
      : fillValueToTab(value),
  )
  const [prevSync, setPrevSync] = useState({ moduleCapable, moduleFillMode, value })

  if (
    prevSync.moduleCapable !== moduleCapable ||
    prevSync.moduleFillMode !== moduleFillMode ||
    prevSync.value !== value
  ) {
    setPrevSync({ moduleCapable, moduleFillMode, value })
    if (!moduleCapable) {
      setModeTab(fillValueToTab(value))
    } else if (moduleFillMode && moduleFillMode !== prevSync.moduleFillMode) {
      setModeTab(moduleFillModeToTab(moduleFillMode, value))
    }
  }

  return (
    <div className="dn-section-stack w-full min-w-0 max-w-full">
      {mobileDensity ? (
        <SegmentTabs
          items={[...modeTabs]}
          value={modeTab}
          onChange={(nextTab) => setModeTab(nextTab as QrColorFillModeTab)}
        />
      ) : (
        <SettingsLabeledSelect
          items={modeTabs}
          label="Fill"
          placeholder="Fill"
          value={modeTab}
          onChange={(next) => setModeTab(next as QrColorFillModeTab)}
        />
      )}

      <QrColorFillModeContent
        fillPreviewImageUrl={fillPreviewImageUrl}
        mobileDensity={mobileDensity}
        modeTab={modeTab}
        moduleImage={moduleImage}
        modulePattern={modulePattern}
        persistKey={persistKey}
        qrGradient={qrGradient}
        value={value}
        onValueChange={onValueChange}
      />
    </div>
  )
}
