"use client"

import { Plus } from "lucide-react"
import { useContext, useEffect, useRef, useState } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

import { CHECKERBOARD_SM } from "@/components/ui/fill-picker/lib/constants"
import { formatColor, parseColor } from "@/components/ui/fill-picker/lib/color"
import type { Fill } from "@/components/ui/fill-picker-base/public-api"
import type { DotsColorMode } from "@/features/qr-code/model/state"
import { isGradientFill } from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"
import {
  SettingsFillOptionGrid,
  SettingsImageOptionGrid,
  SettingsPatternOptionGrid,
} from "@/features/desktop-shell/inspector/settings-fill-option-grid"
import {
  SETTINGS_FILL_LINEAR_PRESETS,
  SETTINGS_FILL_RADIAL_PRESETS,
  SETTINGS_FILL_SOLID_PRESETS,
} from "@/features/desktop-shell/inspector/settings-fill-presets"
import {
  SETTINGS_FILL_OPTION_TILE,
  SETTINGS_FILL_OPTION_TILE_INNER,
} from "@/features/desktop-shell/inspector/settings-preview-tiles"
import { DesktopNewFillPicker } from "@/features/desktop-shell/inspector/desktopnew-fill-picker"
import { DesktopnewThemeContext } from "@/features/desktop-shell/inspector/desktopnew-theme-context"
import { useMobileInspectorDensity } from "@/features/desktop-shell/inspector/mobile-inspector-density-context"
import { cn } from "@/lib/utils"
import {
  SegmentTabs,
  SettingsFillPopover,
  SettingsTilePopover,
  type SettingsFillPopoverHandle,
} from "@/features/desktop-shell/inspector/settings-ui"

export type QrColorFillModeTab =
  | "Solid"
  | "Linear"
  | "Radial"
  | "Pattern"
  | "Image"

const PATTERN_COLOR_SWATCH =
  "dn-preview-tile dn-squircle-xs size-9 shrink-0 p-1 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

function PatternColorPickerContent({
  selectedPalette,
  onPaletteColorChange,
}: {
  selectedPalette: string[]
  onPaletteColorChange: (index: number, color: string) => void
}) {
  const [index, setIndex] = useState(0)
  const active = Math.min(index, selectedPalette.length - 1)

  return (
    <div className="flex w-full flex-col gap-3">
      <div
        aria-label="Pattern colors"
        className="flex w-full items-center justify-between"
        role="group"
      >
        {selectedPalette.map((color, i) => {
          const parsed = parseColor(color) ?? { l: 0, c: 0, h: 0, alpha: 1 }
          const preview = formatColor(parsed, "oklch")
          return (
            <button
              key={`pattern-color-${i}`}
              type="button"
              aria-label={`Edit color ${i + 1}`}
              aria-pressed={i === active}
              className={PATTERN_COLOR_SWATCH}
              onClick={() => setIndex(i)}
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
          )
        })}
      </div>
      <DesktopNewFillPicker
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
  const pickerRef = useRef<SettingsFillPopoverHandle>(null)
  const mobileDensity = useMobileInspectorDensity()
  const theme = useContext(DesktopnewThemeContext)
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

  function openPicker() {
    pickerRef.current?.openPicker()
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
        <div className="dn-content-type-select w-full min-w-0">
          <Select
            value={modeTab}
            onValueChange={(next) => setModeTab(next as QrColorFillModeTab)}
          >
            <SelectTrigger
              className="dn-content-type-select-trigger w-full min-w-0 dn-squircle-sm"
              placeholder="Fill"
              variant="borderless"
            />
            <SelectContent
              className={cn(
                "dn-portal-surface desktopnew-popover-content overflow-hidden p-0 dn-squircle-md",
                theme === "dark" && "dark",
              )}
              data-theme={theme}
            >
              {modeTabs.map((item, index) => (
                <SelectItem key={item} index={index} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {modeTab === "Solid" ? (
        <SettingsFillOptionGrid
          persistKey={`${persistKey}:solid`}
          presets={SETTINGS_FILL_SOLID_PRESETS}
          value={value}
          onOpenPicker={openPicker}
          onSelect={onValueChange}
        />
      ) : modeTab === "Linear" ? (
        <SettingsFillOptionGrid
          persistKey={`${persistKey}:linear`}
          presets={SETTINGS_FILL_LINEAR_PRESETS}
          value={value}
          onOpenPicker={openPicker}
          onSelect={onValueChange}
        />
      ) : modeTab === "Radial" ? (
        <SettingsFillOptionGrid
          persistKey={`${persistKey}:radial`}
          presets={SETTINGS_FILL_RADIAL_PRESETS}
          value={value}
          onOpenPicker={openPicker}
          onSelect={onValueChange}
        />
      ) : modeTab === "Pattern" && modulePattern ? (
        <SettingsPatternOptionGrid
          leadingAction={
            <SettingsTilePopover
              title="Pattern colors"
              content={
                <PatternColorPickerContent
                  selectedPalette={modulePattern.selectedPalette}
                  onPaletteColorChange={modulePattern.onPaletteColorChange}
                />
              }
            >
              <button aria-label="Edit pattern colors" className={SETTINGS_FILL_OPTION_TILE} type="button">
                <span aria-hidden className={SETTINGS_FILL_OPTION_TILE_INNER}>
                  <span className="grid size-full place-items-center bg-[color-mix(in_srgb,var(--dn-muted)_38%,transparent)] text-[var(--dn-fg)] transition-colors group-hover:bg-[color-mix(in_srgb,var(--dn-muted)_55%,transparent)] dn-squircle-xs">
                    <Plus className="size-4" strokeWidth={2.5} />
                  </span>
                </span>
              </button>
            </SettingsTilePopover>
          }
          persistKey={`${persistKey}:pattern`}
          selectedPalette={modulePattern.selectedPalette}
          selectedPreset={modulePattern.selectedPreset}
          onSelect={(preset) => modulePattern.onSelect(preset)}
        />
      ) : modeTab === "Image" && moduleImage ? (
        <SettingsImageOptionGrid
          persistKey={`${persistKey}:image`}
          selectedPath={moduleImage.imageUrl}
          onClear={moduleImage.onClear}
          onSelect={(imagePath) => moduleImage.onUpload(imagePath, "url")}
          onUpload={(imageUrl) => moduleImage.onUpload(imageUrl, "upload")}
        />
      ) : null}

      {modeTab === "Solid" || modeTab === "Linear" || modeTab === "Radial" ? (
        <SettingsFillPopover
          ref={pickerRef}
          fillPreviewImageUrl={fillPreviewImageUrl}
          hint="Fill"
          lockedFillMode={modeTab === "Solid" ? "solid" : "gradient"}
          qrGradient={qrGradient}
          variant="picker-only"
          value={value}
          onValueChange={onValueChange}
        />
      ) : null}
    </div>
  )
}
