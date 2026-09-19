"use client"

import { useEffect, useRef, useState } from "react"

import { CHECKERBOARD_SM } from "@/components/ui/fill-picker/lib/constants"
import { formatColor, parseColor } from "@/components/ui/fill-picker/lib/color"
import type { Fill } from "@/components/ui/fill-picker-base/public-api"
import type { DotsColorMode } from "@/features/qr-code/model/state"
import { isGradientFill } from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"
import {
  SettingsImageOptionGrid,
  SettingsImageUploadTile,
  SettingsPatternOptionGrid,
} from "@/features/desktop-shell/inspector/settings-fill-option-grid"
import {
  SETTINGS_FILL_LINEAR_PRESETS,
  SETTINGS_FILL_RADIAL_PRESETS,
  SETTINGS_FILL_SOLID_PRESETS,
} from "@/features/desktop-shell/inspector/settings-fill-presets"
import { useMobileInspectorDensity } from "@/features/desktop-shell/inspector/mobile-inspector-density-context"
import {
  SegmentTabs,
  SettingsAccordionColorPicker,
  SettingsFillPresetSection,
  SettingsLabeledSelect,
} from "@/features/desktop-shell/inspector/settings-ui"

export type QrColorFillModeTab =
  | "Solid"
  | "Linear"
  | "Radial"
  | "Pattern"
  | "Image"

const PATTERN_ROW_SWATCH =
  "size-7 shrink-0 cursor-pointer overflow-hidden dn-squircle-xs outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dn-focus,var(--ring))]"

function PatternRowSwatch({
  color,
  index,
  onPaletteColorChange,
}: {
  color: string
  index: number
  onPaletteColorChange: (index: number, color: string) => void
}) {
  const parsed = parseColor(color) ?? { l: 0, c: 0, h: 0, alpha: 1 }
  const preview = formatColor(parsed, "oklch")

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
        <span
          aria-hidden
          className="block size-full dn-squircle-xs"
          style={{
            backgroundImage: `linear-gradient(${preview}, ${preview}), ${CHECKERBOARD_SM}`,
            backgroundSize: "auto, 6px 6px",
          }}
        />
      </button>
    </SettingsAccordionColorPicker>
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
  modulePattern?: {
    selectedPalette: string[]
    selectedPreset: string | "custom"
    onSelect: (preset: { label: string; colors: string[] } | "custom") => void
    onPaletteColorChange: (index: number, color: string) => void
  }
  moduleImage?: {
    imageUrl: string
    onUpload: (imageUrl: string, sourceMode?: "upload" | "url") => void
    onClear: () => void
  }
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
  const previousModuleFillModeRef = useRef(moduleFillMode)

  useEffect(() => {
    if (!moduleCapable) {
      setModeTab(fillValueToTab(value))
      return
    }

    if (!moduleFillMode || moduleFillMode === previousModuleFillModeRef.current) {
      return
    }

    previousModuleFillModeRef.current = moduleFillMode
    setModeTab(moduleFillModeToTab(moduleFillMode, value))
  }, [moduleCapable, moduleFillMode, value])

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

      {modeTab === "Solid" ? (
        <SettingsFillPresetSection
          fillPreviewImageUrl={fillPreviewImageUrl}
          lockedFillMode="solid"
          presets={SETTINGS_FILL_SOLID_PRESETS}
          qrGradient={qrGradient}
          value={value}
          onSelect={onValueChange}
        />
      ) : modeTab === "Linear" ? (
        <SettingsFillPresetSection
          fillPreviewImageUrl={fillPreviewImageUrl}
          lockedFillMode="gradient"
          presets={SETTINGS_FILL_LINEAR_PRESETS}
          qrGradient={qrGradient}
          value={value}
          onSelect={onValueChange}
        />
      ) : modeTab === "Radial" ? (
        <SettingsFillPresetSection
          fillPreviewImageUrl={fillPreviewImageUrl}
          lockedFillMode="gradient"
          presets={SETTINGS_FILL_RADIAL_PRESETS}
          qrGradient={qrGradient}
          value={value}
          onSelect={onValueChange}
        />
      ) : modeTab === "Pattern" && modulePattern ? (
        <>
          <div className="flex min-h-[var(--dn-control-height)] items-center">
            <span className="dn-row-label-text pl-[var(--dn-row-px)]">Pattern</span>
            <div
              aria-label="Pattern colors"
              className="ml-auto flex items-center gap-1.5"
              role="group"
            >
              {modulePattern.selectedPalette.map((color, index) => (
                <PatternRowSwatch
                  key={`pattern-color-${index}`}
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
      ) : modeTab === "Image" && moduleImage ? (
        <>
          <div className="flex min-h-[var(--dn-control-height)] items-center">
            <span className="dn-row-label-text pl-[var(--dn-row-px)]">Upload</span>
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
      ) : null}
    </div>
  )
}
