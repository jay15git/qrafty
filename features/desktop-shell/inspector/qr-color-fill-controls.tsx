"use client"

import { useEffect, useRef, useState } from "react"

import type { Fill } from "@/components/ui/fill-picker-base/public-api"
import type { DotsColorMode } from "@/features/qr-code/model/state"
import { isGradientFill } from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"
import {
  SettingsFillOptionGrid,
  SettingsImageOptionGrid,
  SettingsPatternOptionGrid,
} from "@/features/desktop-shell/inspector/settings-fill-option-grid"
import {
  SETTINGS_FILL_GRADIENT_PRESETS,
  SETTINGS_FILL_SOLID_PRESETS,
} from "@/features/desktop-shell/inspector/settings-fill-presets"
import {
  SegmentTabs,
  SettingsFillPopover,
  type SettingsFillPopoverHandle,
} from "@/features/desktop-shell/inspector/settings-ui"

export type QrColorFillModeTab = "Solid" | "Gradient" | "Pattern" | "Image"

function moduleFillModeToTab(mode: DotsColorMode): QrColorFillModeTab {
  switch (mode) {
    case "image":
      return "Image"
    case "palette":
      return "Pattern"
    case "gradient":
      return "Gradient"
    default:
      return "Solid"
  }
}

function fillValueToTab(value: string): "Solid" | "Gradient" {
  return isGradientFill(value) ? "Gradient" : "Solid"
}

function modeTabToLockedFillMode(
  tab: QrColorFillModeTab,
): "solid" | "gradient" | "pattern" | "image" {
  switch (tab) {
    case "Image":
      return "image"
    case "Pattern":
      return "pattern"
    case "Gradient":
      return "gradient"
    default:
      return "solid"
  }
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
  const modeTabs = moduleCapable
    ? (["Solid", "Gradient", "Pattern", "Image"] as const)
    : (["Solid", "Gradient"] as const)
  const [modeTab, setModeTab] = useState<QrColorFillModeTab>(() =>
    moduleCapable
      ? moduleFillModeToTab(moduleFillMode ?? "solid")
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
    setModeTab(moduleFillModeToTab(moduleFillMode))
  }, [moduleCapable, moduleFillMode, value])

  function openPicker() {
    pickerRef.current?.openPicker()
  }

  return (
    <div className="dn-section-stack w-full min-w-0 max-w-full">
      <SegmentTabs
        items={[...modeTabs]}
        value={modeTab}
        onChange={(nextTab) => setModeTab(nextTab as QrColorFillModeTab)}
      />

      {modeTab === "Solid" ? (
        <SettingsFillOptionGrid
          persistKey={`${persistKey}:solid`}
          presets={SETTINGS_FILL_SOLID_PRESETS}
          value={value}
          onOpenPicker={openPicker}
          onSelect={onValueChange}
        />
      ) : modeTab === "Gradient" ? (
        <SettingsFillOptionGrid
          persistKey={`${persistKey}:gradient`}
          presets={SETTINGS_FILL_GRADIENT_PRESETS}
          value={value}
          onOpenPicker={openPicker}
          onSelect={onValueChange}
        />
      ) : modeTab === "Pattern" && modulePattern ? (
        <SettingsPatternOptionGrid
          persistKey={`${persistKey}:pattern`}
          selectedPalette={modulePattern.selectedPalette}
          selectedPreset={modulePattern.selectedPreset}
          onOpenPicker={openPicker}
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

      {modeTab === "Image" ? null : (
        <SettingsFillPopover
          ref={pickerRef}
          fillPreviewImageUrl={fillPreviewImageUrl}
          hint="Fill"
          lockedFillMode={modeTabToLockedFillMode(modeTab)}
          modulePattern={modeTab === "Pattern" ? modulePattern : undefined}
          qrGradient={qrGradient}
          variant="picker-only"
          value={value}
          onValueChange={onValueChange}
        />
      )}
    </div>
  )
}
