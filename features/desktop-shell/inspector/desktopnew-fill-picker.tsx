"use client"

import { useContext, useRef, useState } from "react"

import {
  ColorPicker,
} from "@/components/ui/fill-picker-base/color-picker"
import {
  FillPicker,
} from "@/components/ui/fill-picker-base/fill"
import {
  GradientPicker,
} from "@/components/ui/fill-picker-base/gradient"
import {
  formatFill,
  parseFill,
  type Fill,
} from "@/components/ui/fill-picker-base/public-api"
import { ImageCropper } from "@/components/ui/image-cropper"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DESKTOP_DOTS_PALETTE_PRESETS } from "@/features/desktop-shell/inspector/desktopnew-pattern-palettes"
import {
  fillFromHex,
  normalizeFillForQrTarget,
} from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"
import { DesktopnewThemeContext } from "@/features/desktop-shell/inspector/desktopnew-theme-context"
import { PaletteColorStopList } from "@/features/desktop-shell/inspector/palette-color-stop-list"
import { SegmentTabs } from "@/features/desktop-shell/inspector/settings-ui"
import { cn } from "@/lib/utils"

const QR_GRADIENT_TYPES = ["linear", "radial"] as const

type ModuleFillTabMode = "color" | "gradient" | "pattern" | "image"

export function DesktopNewFillPicker({
  value,
  onValueChange,
  className,
  modulePattern,
  moduleImage,
  solidOnly = false,
  qrGradient = false,
}: {
  value: string
  onValueChange: (fill: Fill, css: string) => void
  className?: string
  solidOnly?: boolean
  /** Limits gradients to linear/radial circle — for module, eye, frame, logo. */
  qrGradient?: boolean
  modulePattern?: {
    selectedPalette: string[]
    selectedPreset: string | "custom"
    onSelect: (preset: { label: string; colors: string[] } | "custom") => void
    onPaletteColorChange: (index: number, color: string) => void
  }
  moduleImage?: {
    imageUrl: string
    onUpload: (file: File) => void
    onClear: () => void
  }
}) {
  // Snapshot on mount. Controlled CSS round-trips through formatGradient,
  // which bakes Area start/end into stop percentages. parseFill cannot
  // recover start/end, so feeding that CSS back collapses both stops onto
  // the same % and freezes the bar thumbs.
  const parsedInitialFill = parseFill(value) ?? fillFromHex(value)
  const initialFillRef = useRef(
    qrGradient ? normalizeFillForQrTarget(parsedInitialFill) : parsedInitialFill,
  )
  const initialFill = initialFillRef.current
  const initialMode: ModuleFillTabMode = solidOnly
    ? "color"
    : moduleImage?.imageUrl
      ? "image"
      : initialFill.kind === "gradient"
        ? "gradient"
        : "color"
  const fillPickerInitialMode = initialMode === "gradient" ? "gradient" : "color"
  const [activeMode, setActiveMode] = useState<ModuleFillTabMode>(initialMode)
  const pickerMode = activeMode === "gradient" ? "gradient" : "color"

  const handleValueChange = (fill: Fill, css: string) => {
    if (!qrGradient) {
      onValueChange(fill, css)
      return
    }

    const normalized = normalizeFillForQrTarget(fill)
    onValueChange(normalized, formatFill(normalized))
  }

  return (
    <FillPicker.Root
      className={cn(
        "dn-fill-picker-panel max-h-[min(72dvh,40rem)] max-w-none overflow-y-auto border-0 bg-transparent shadow-none",
        className,
      )}
      defaultMode={fillPickerInitialMode}
      defaultValue={initialFill}
      mode={pickerMode}
      onModeChange={(mode) => setActiveMode(mode)}
      onValueChange={handleValueChange}
    >
      {solidOnly ? null : (
        <SegmentTabs
          className="self-stretch"
          items={
            modulePattern
              ? moduleImage
                ? ["Solid", "Gradient", "Pattern", "Image"]
                : ["Solid", "Gradient", "Pattern"]
              : ["Solid", "Gradient"]
          }
          value={
            activeMode === "color"
              ? "Solid"
              : activeMode === "gradient"
                ? "Gradient"
                : activeMode === "image"
                  ? "Image"
                  : "Pattern"
          }
          onChange={(item) => {
            if (item === "Solid") setActiveMode("color")
            else if (item === "Gradient") setActiveMode("gradient")
            else if (item === "Image") setActiveMode("image")
            else setActiveMode("pattern")
          }}
        />
      )}
      {!solidOnly && activeMode === "pattern" && modulePattern ? (
        <ModulePatternPicker {...modulePattern} />
      ) : !solidOnly && activeMode === "image" && moduleImage ? (
        <ModuleImagePicker {...moduleImage} />
      ) : (
        <>
          <FillPicker.Pane
            className="dn-settings-tab-panel flex w-full min-w-0 flex-col gap-2.5"
            mode="color"
          >
            <ColorPicker.Area />
            <ColorPicker.Hue />
            <ColorPicker.Alpha />
            <ColorPicker.ChannelInput />
          </FillPicker.Pane>
          {solidOnly ? null : (
            <FillPicker.Pane
              className="dn-settings-tab-panel flex w-full min-w-0 flex-col gap-2.5"
              mode="gradient"
            >
              <div className="grid w-full min-w-0 grid-cols-2 gap-2">
                {qrGradient ? (
                  <GradientPicker.TypeSwitcher
                    allowedTypes={[...QR_GRADIENT_TYPES]}
                    className="w-full"
                  />
                ) : (
                  <GradientPicker.TypeSwitcher className="w-full" />
                )}
                <GradientPicker.InterpSwitcher className="w-full" />
              </div>
              <GradientPicker.Bar editOnClick />
              <GradientPicker.Area />
              {qrGradient ? null : (
                <>
                  <GradientPicker.ShapeSwitcher />
                  <GradientPicker.EllipseRadiiInput />
                </>
              )}
              <GradientPicker.StopList showPosition={false} />
              <GradientPicker.Presets />
            </FillPicker.Pane>
          )}
        </>
      )}
    </FillPicker.Root>
  )
}

function ModuleImagePicker({
  imageUrl,
  onUpload,
  onClear,
}: {
  imageUrl: string
  onUpload: (file: File) => void
  onClear: () => void
}) {
  const theme = useContext(DesktopnewThemeContext)

  return (
    <ImageCropper
      className="w-full"
      compact
      dialogContentClassName={theme === "dark" ? "dark" : undefined}
      maxFileSize={5 * 1024 * 1024}
      placeholder="Drop image or click to upload"
      showFormatHint
      value={imageUrl || null}
      onChange={(value) => {
        if (value instanceof File) {
          onUpload(value)
          return
        }

        if (value === null) {
          onClear()
        }
      }}
    />
  )
}

function ModulePatternPicker({
  selectedPalette,
  selectedPreset,
  onSelect,
  onPaletteColorChange,
}: {
  selectedPalette: string[]
  selectedPreset: string | "custom"
  onSelect: (preset: { label: string; colors: string[] } | "custom") => void
  onPaletteColorChange: (index: number, color: string) => void
}) {
  const PATTERN_TILE =
    "dn-option-tile relative flex size-12 shrink-0 items-center justify-center p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dn-squircle-xs"

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <ScrollArea
        className="w-full min-w-0 max-w-full overflow-hidden"
        chevron={false}
        cueSize="tight"
        orientation="horizontal"
        persistKey="module-pattern-palettes"
        scrollFade
        showScrollbar={false}
        viewportClassName="min-w-0"
      >
        <div className="flex min-w-max gap-1.5 px-1 py-2">
          {DESKTOP_DOTS_PALETTE_PRESETS.map((option) => {
            const isSelected =
              selectedPreset === option.label ||
              (selectedPreset === "custom" &&
                selectedPalette.join() === option.colors.join())

            return (
              <button
                key={option.label}
                aria-label={`Use ${option.label} pattern palette`}
                aria-pressed={isSelected}
                className={PATTERN_TILE}
                title={option.label}
                type="button"
                onClick={() => onSelect(option)}
              >
                <PatternPalettePreview colors={option.colors} />
              </button>
            )
          })}
        </div>
      </ScrollArea>
      <PaletteColorStopList
        colors={selectedPalette}
        onPaletteColorChange={onPaletteColorChange}
      />
    </div>
  )
}

function PatternPalettePreview({ colors }: { colors: string[] }) {
  return (
    <span
      aria-hidden
      className="grid size-8 grid-cols-2 gap-px overflow-hidden dn-squircle-xs"
    >
      {colors.map((color, index) => (
        <span
          key={`${color}-${index}`}
          className="size-full min-h-0 min-w-0"
          style={{ backgroundColor: color }}
        />
      ))}
    </span>
  )
}
