"use client"

import { useContext, useEffect, useRef, useState } from "react"

import { usePersistedScrollNode } from "@/lib/persisted-element-scroll"

import {
  ColorPicker,
} from "@/components/ui/fill-picker/base/color-picker"
import {
  FillPickerPortalSurfaceProvider,
} from "@/components/ui/fill-picker/base/contexts/portal-surface"
import {
  FillPicker,
} from "@/components/ui/fill-picker/base/fill"
import {
  GradientPicker,
} from "@/components/ui/fill-picker/base/gradient"
import {
  formatFill,
  parseFill,
  type Fill,
} from "@/components/ui/fill-picker/public-api"
import { ImageCropper } from "@/components/ui/image-cropper"
import { DESKTOP_DOTS_PALETTE_PRESETS } from "@/features/desktop-shell/inspector/pattern-palettes"
import {
  fillFromHex,
  normalizeFillForQrTarget,
  type ModuleImageControl,
  type ModulePatternControl,
} from "@/features/desktop-shell/inspector/fill-picker.utils"
import { DesktopnewThemeContext } from "@/features/desktop-shell/inspector/theme-context"
import { PaletteColorBarPreview } from "@/features/desktop-shell/inspector/palette-color-bar-preview"
import { PaletteColorStopList } from "@/features/desktop-shell/inspector/palette-color-stop-list"
import {
  SETTINGS_PATTERN_OPTION_TILE,
  SETTINGS_PATTERN_OPTION_TILE_INNER,
} from "@/features/desktop-shell/inspector/settings-preview-tiles"
import {
  DesktopGradientInterpRow,
  DesktopGradientTypeRow,
} from "@/features/desktop-shell/inspector/gradient-controls"
import { SegmentTabs } from "@/features/desktop-shell/inspector/settings-segment-tabs"
import { SettingsOptionShelf } from "@/features/desktop-shell/inspector/mobile-settings-rail"
import { cn } from "@/lib/utils"
import { blobUrlToDataUrl } from "@qrafty/qr-internal/scene"
import type { DotsColorMode } from "@/features/qr-code/model/state"

const QR_GRADIENT_TYPES = ["linear", "radial"] as const

type ModuleFillTabMode = "color" | "gradient" | "pattern" | "image"

export type LockedFillPickerMode = "solid" | "gradient" | "pattern" | "image"

function lockedFillModeToTab(mode: LockedFillPickerMode): ModuleFillTabMode {
  switch (mode) {
    case "image":
      return "image"
    case "pattern":
      return "pattern"
    case "gradient":
      return "gradient"
    default:
      return "color"
  }
}

function moduleFillTabFromDotsColorMode(mode: DotsColorMode): ModuleFillTabMode {
  switch (mode) {
    case "image":
      return "image"
    case "palette":
      return "pattern"
    case "gradient":
      return "gradient"
    default:
      return "color"
  }
}

const FILL_TAB_LABELS: Record<ModuleFillTabMode, string> = {
  color: "Solid",
  gradient: "Gradient",
  image: "Image",
  pattern: "Pattern",
}

const FILL_TAB_MODES: Record<string, ModuleFillTabMode> = {
  Gradient: "gradient",
  Image: "image",
  Pattern: "pattern",
  Solid: "color",
}

function resolveInitialFillPickerMode({
  initialFill,
  lockedFillMode,
  moduleFillMode,
  resolvedSolidOnly,
}: {
  initialFill: Fill
  lockedFillMode?: LockedFillPickerMode
  moduleFillMode?: DotsColorMode
  resolvedSolidOnly: boolean
}): ModuleFillTabMode {
  if (lockedFillMode) {
    return lockedFillModeToTab(lockedFillMode)
  }
  if (resolvedSolidOnly) {
    return "color"
  }
  if (moduleFillMode) {
    return moduleFillTabFromDotsColorMode(moduleFillMode)
  }
  return initialFill.kind === "gradient" ? "gradient" : "color"
}

function FillPickerColorPane() {
  return (
    <FillPicker.Pane
      className="dn-settings-tab-panel dn-fill-picker-pane flex w-full min-w-0 flex-col gap-2"
      mode="color"
    >
      <ColorPicker.Area className="dn-fill-picker-area" />
      <ColorPicker.Hue className="dn-fill-picker-slider" />
      <ColorPicker.Alpha className="dn-fill-picker-slider" />
      <ColorPicker.ChannelInput className="dn-fill-picker-channel-input" />
    </FillPicker.Pane>
  )
}

function FillPickerGradientPane({ qrGradient }: { qrGradient: boolean }) {
  return (
    <FillPicker.Pane
      className="dn-settings-tab-panel dn-fill-picker-pane flex w-full min-w-0 flex-col gap-2"
      mode="gradient"
    >
      <div className="flex w-full min-w-0 gap-2">
        <DesktopGradientTypeRow
          allowedTypes={qrGradient ? [...QR_GRADIENT_TYPES] : undefined}
        />
        <DesktopGradientInterpRow />
      </div>
      <GradientPicker.AngleGroup className="dn-fill-picker-angle-group">
        <GradientPicker.AnglePad
          className="dn-fill-picker-angle-pad"
          size={32}
        />
        <GradientPicker.AngleInput className="dn-fill-picker-field" />
      </GradientPicker.AngleGroup>
      <GradientPicker.Bar className="dn-fill-picker-gradient-bar" />
      <GradientPicker.StopColor>
        <ColorPicker.Area className="dn-fill-picker-area" />
        <ColorPicker.Hue className="dn-fill-picker-slider" />
        <ColorPicker.Alpha className="dn-fill-picker-slider" />
        <ColorPicker.ChannelInput className="dn-fill-picker-channel-input" />
      </GradientPicker.StopColor>
    </FillPicker.Pane>
  )
}

function FillPickerModeTabs({
  activeMode,
  hasImage,
  hasPattern,
  onModeChange,
}: {
  activeMode: ModuleFillTabMode
  hasImage: boolean
  hasPattern: boolean
  onModeChange: (mode: ModuleFillTabMode) => void
}) {
  return (
    <SegmentTabs
      className="dn-fill-picker-mode-tabs self-stretch"
      items={[
        "Solid",
        "Gradient",
        ...(hasPattern ? ["Pattern"] : []),
        ...(hasPattern && hasImage ? ["Image"] : []),
      ]}
      value={FILL_TAB_LABELS[activeMode]}
      onChange={(item) => onModeChange(FILL_TAB_MODES[item] ?? "color")}
    />
  )
}

function FillPickerModeContent({
  activeMode,
  moduleImage,
  modulePattern,
  qrGradient,
  showGradientPane,
  showSolidPane,
}: {
  activeMode: ModuleFillTabMode
  moduleImage?: ModuleImageControl
  modulePattern?: ModulePatternControl
  qrGradient: boolean
  showGradientPane: boolean
  showSolidPane: boolean
}) {
  if (activeMode === "pattern" && modulePattern) {
    return <ModulePatternPicker {...modulePattern} />
  }

  if (activeMode === "image" && moduleImage) {
    return <ModuleImagePicker {...moduleImage} />
  }

  return (
    <>
      {showSolidPane ? <FillPickerColorPane /> : null}
      {showGradientPane ? <FillPickerGradientPane qrGradient={qrGradient} /> : null}
    </>
  )
}

export function DesktopFillPicker({
  value,
  onValueChange,
  className,
  modulePattern,
  moduleImage,
  moduleFillMode,
  lockedFillMode,
  solidOnly = false,
  qrGradient = false,
}: {
  value: string
  onValueChange: (fill: Fill, css: string) => void
  className?: string
  solidOnly?: boolean
  lockedFillMode?: LockedFillPickerMode
  /** Limits gradients to linear/radial circle — for module, eye, frame, logo. */
  qrGradient?: boolean
  moduleFillMode?: DotsColorMode
  modulePattern?: ModulePatternControl
  moduleImage?: ModuleImageControl
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
  const resolvedSolidOnly = solidOnly || lockedFillMode === "solid"
  const initialMode = resolveInitialFillPickerMode({
    initialFill,
    lockedFillMode,
    moduleFillMode,
    resolvedSolidOnly,
  })
  const fillPickerInitialMode = initialMode === "gradient" ? "gradient" : "color"
  const [activeMode, setActiveMode] = useState<ModuleFillTabMode>(initialMode)
  const pickerMode = activeMode === "gradient" ? "gradient" : "color"
  const setScrollNode = usePersistedScrollNode("fill-picker")
  const theme = useContext(DesktopnewThemeContext)
  const showModeTabs = !resolvedSolidOnly && !lockedFillMode
  const showSolidPane = resolvedSolidOnly || lockedFillMode !== "gradient"
  const showGradientPane = !resolvedSolidOnly

  useEffect(() => {
    if (!lockedFillMode) {
      return
    }

    setActiveMode(lockedFillModeToTab(lockedFillMode))
  }, [lockedFillMode])

  const handleValueChange = (fill: Fill, css: string) => {
    if (
      !lockedFillMode &&
      moduleImage?.imageUrl &&
      (activeMode === "image" || activeMode === "pattern")
    ) {
      return
    }

    if (!qrGradient) {
      onValueChange(fill, css)
      return
    }

    const normalized = normalizeFillForQrTarget(fill)
    onValueChange(normalized, formatFill(normalized))
  }

  return (
    <FillPickerPortalSurfaceProvider
      value={{
        desktopAccordion: true,
        portaledSurfaceDataTheme: theme,
        portaledSurfaceClassName: cn(
          "fill-picker-portal dn-portal-surface desktopnew-popover-content",
          "outline-none dn-squircle-sm",
          theme === "dark" && "dark",
        ),
      }}
    >
    <div
      ref={setScrollNode}
      className={cn(
        "dn-fill-picker-panel max-h-[min(72dvh,40rem)] max-w-none overflow-y-auto",
        className,
      )}
    >
    <FillPicker.Root
      className="dn-fill-picker-root max-w-none border-0 bg-transparent shadow-none"
      defaultMode={fillPickerInitialMode}
      defaultValue={initialFill}
      mode={pickerMode}
      onModeChange={(mode) => setActiveMode(mode)}
      onValueChange={handleValueChange}
    >
      {showModeTabs ? (
        <FillPickerModeTabs
          activeMode={activeMode}
          hasImage={Boolean(moduleImage)}
          hasPattern={Boolean(modulePattern)}
          onModeChange={setActiveMode}
        />
      ) : null}
      <FillPickerModeContent
        activeMode={activeMode}
        moduleImage={moduleImage}
        modulePattern={modulePattern}
        qrGradient={qrGradient}
        showGradientPane={showGradientPane}
        showSolidPane={showSolidPane}
      />
    </FillPicker.Root>
    </div>
    </FillPickerPortalSurfaceProvider>
  )
}

function ModuleImagePicker({
  imageUrl,
  onUpload,
  onClear,
}: {
  imageUrl: string
  onUpload: (imageUrl: string) => void
  onClear: () => void
}) {
  const theme = useContext(DesktopnewThemeContext)

  return (
    <ImageCropper
      className="w-full"
      compact
      dialogTheme={theme}
      maxFileSize={5 * 1024 * 1024}
      placeholder="Drop image or click to upload"
      showFormatHint
      value={imageUrl || null}
      onImageCropped={({ url }) => {
        void (async () => {
          const normalizedUrl =
            url.startsWith("blob:") ? (await blobUrlToDataUrl(url)) ?? url : url
          onUpload(normalizedUrl)
        })()
      }}
      onChange={(value) => {
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
  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <SettingsOptionShelf
        activeKey={selectedPreset}
        ariaLabel="Pattern options"
        dataSlot="fill-picker-pattern-grid"
        gridClassName="dn-pattern-option-grid"
        persistKey="fill-picker-patterns"
      >
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
              className={SETTINGS_PATTERN_OPTION_TILE}
              title={option.label}
              type="button"
              onClick={() => onSelect(option)}
            >
              <span aria-hidden className={SETTINGS_PATTERN_OPTION_TILE_INNER}>
                <PaletteColorBarPreview className="size-full" colors={option.colors} size="md" />
              </span>
            </button>
          )
        })}
      </SettingsOptionShelf>
      <PaletteColorStopList
        colors={selectedPalette}
        onPaletteColorChange={onPaletteColorChange}
      />
    </div>
  )
}
