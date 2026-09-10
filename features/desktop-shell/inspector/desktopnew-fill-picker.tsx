"use client"

import { useContext, useRef, useState } from "react"

import { usePersistedScrollNode } from "@/lib/persisted-element-scroll"

import {
  ColorPicker,
} from "@/components/ui/fill-picker-base/color-picker"
import {
  FillPickerPortalSurfaceProvider,
} from "@/components/ui/fill-picker-base/contexts/portal-surface"
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
import { PaletteColorBarPreview } from "@/features/desktop-shell/inspector/palette-color-bar-preview"
import { PaletteColorStopList } from "@/features/desktop-shell/inspector/palette-color-stop-list"
import { SettingsPaperShaderControls } from "@/features/desktop-shell/inspector/desktopnew-paper-shader-settings"
import { SegmentTabs } from "@/features/desktop-shell/inspector/settings-ui"
import { PaperShaderOptionPreview } from "@/features/workspace/components/PaperShaderOptionPreview"
import type { DraftingCardPaperShaderState } from "@/features/workspace/model/card-state"
import {
  getAllPaperShaderDefinitions,
  type PaperShaderId,
} from "@/features/workspace/rendering/paper-shaders"
import { cn } from "@/lib/utils"
import { blobUrlToDataUrl } from "@qrafty/qr-internal/scene"
import type { DotsColorMode } from "@/features/qr-code/model/state"

const QR_GRADIENT_TYPES = ["linear", "radial"] as const
const PREVIEW_TILE =
  "dn-preview-tile dn-preview-tile-size group relative shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dn-squircle-xs"
const PREVIEW_ROW = "dn-preview-row"

type ModuleFillTabMode = "color" | "gradient" | "pattern" | "image" | "shader"

function moduleFillTabFromDotsColorMode(mode: DotsColorMode): ModuleFillTabMode {
  switch (mode) {
    case "image":
      return "image"
    case "shader":
      return "shader"
    case "palette":
      return "pattern"
    case "gradient":
      return "gradient"
    default:
      return "color"
  }
}

export function DesktopNewFillPicker({
  value,
  onValueChange,
  className,
  modulePattern,
  moduleImage,
  moduleShader,
  moduleFillMode,
  solidOnly = false,
  qrGradient = false,
}: {
  value: string
  onValueChange: (fill: Fill, css: string) => void
  className?: string
  solidOnly?: boolean
  /** Limits gradients to linear/radial circle — for module, eye, frame, logo. */
  qrGradient?: boolean
  moduleFillMode?: DotsColorMode
  modulePattern?: {
    selectedPalette: string[]
    selectedPreset: string | "custom"
    onSelect: (preset: { label: string; colors: string[] } | "custom") => void
    onPaletteColorChange: (index: number, color: string) => void
  }
  moduleImage?: {
    imageUrl: string
    onUpload: (imageUrl: string) => void
    onClear: () => void
  }
  moduleShader?: {
    paperShader: DraftingCardPaperShaderState
    onTabActivate: () => void
    onSelectShader: (shaderId: PaperShaderId) => void
    onPaperShaderChange: (paperShader: DraftingCardPaperShaderState) => void
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
    : moduleFillMode
      ? moduleFillTabFromDotsColorMode(moduleFillMode)
      : initialFill.kind === "gradient"
        ? "gradient"
        : "color"
  const fillPickerInitialMode = initialMode === "gradient" ? "gradient" : "color"
  const [activeMode, setActiveMode] = useState<ModuleFillTabMode>(initialMode)
  const pickerMode = activeMode === "gradient" ? "gradient" : "color"
  const setScrollNode = usePersistedScrollNode("fill-picker")
  const theme = useContext(DesktopnewThemeContext)

  const handleValueChange = (fill: Fill, css: string) => {
    if (
      moduleImage?.imageUrl &&
      (activeMode === "image" || activeMode === "pattern" || activeMode === "shader")
    ) {
      return
    }

    if (activeMode === "shader") {
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
        portaledSurfaceDataTheme: theme,
        portaledSurfaceClassName: cn(
          "desktopnew-fill-picker-portal dn-portal-surface desktopnew-popover-content",
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
      className="max-w-none border-0 bg-transparent shadow-none"
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
                ? moduleShader
                  ? ["Solid", "Gradient", "Pattern", "Image", "Shader"]
                  : ["Solid", "Gradient", "Pattern", "Image"]
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
                  : activeMode === "shader"
                    ? "Shader"
                    : "Pattern"
          }
          onChange={(item) => {
            if (item === "Solid") setActiveMode("color")
            else if (item === "Gradient") setActiveMode("gradient")
            else if (item === "Image") setActiveMode("image")
            else if (item === "Shader") {
              setActiveMode("shader")
              moduleShader?.onTabActivate()
            }
            else setActiveMode("pattern")
          }}
        />
      )}
      {!solidOnly && activeMode === "pattern" && modulePattern ? (
        <ModulePatternPicker {...modulePattern} />
      ) : !solidOnly && activeMode === "image" && moduleImage ? (
        <ModuleImagePicker {...moduleImage} />
      ) : !solidOnly && activeMode === "shader" && moduleShader ? (
        <ModuleShaderPicker {...moduleShader} />
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

function ModuleShaderPicker({
  paperShader,
  onSelectShader,
  onPaperShaderChange,
}: {
  paperShader: DraftingCardPaperShaderState
  onSelectShader: (shaderId: PaperShaderId) => void
  onPaperShaderChange: (paperShader: DraftingCardPaperShaderState) => void
}) {
  const shaders = getAllPaperShaderDefinitions()

  return (
    <div className="flex w-full min-w-0 flex-col gap-2.5">
      <ScrollArea
        className="w-full min-w-0 max-w-full overflow-hidden"
        chevron={false}
        cueSize="tight"
        orientation="horizontal"
        persistKey="module-shader-gallery"
        scrollFade
        showScrollbar={false}
        viewportClassName="min-w-0"
      >
        <div className={PREVIEW_ROW}>
          {shaders.map((option) => {
            const isSelected = paperShader.shaderId === option.id

            return (
              <button
                key={option.id}
                aria-label={`Use ${option.label} shader`}
                aria-pressed={isSelected}
                className={cn(PREVIEW_TILE)}
                title={option.label}
                type="button"
                onClick={() => onSelectShader(option.id)}
              >
                <PaperShaderOptionPreview
                  className="relative z-10 block size-full overflow-hidden dn-squircle-xs"
                  isSelected={isSelected}
                  shaderId={option.id}
                />
              </button>
            )
          })}
        </div>
      </ScrollArea>
      <SettingsPaperShaderControls
        paperShader={paperShader}
        onPaperShaderChange={onPaperShaderChange}
      />
    </div>
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
    "dn-option-tile relative flex size-[length:var(--dn-preview-tile)] shrink-0 items-center justify-center p-[length:var(--dn-space-inline)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dn-squircle-xs"

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
                <PaletteColorBarPreview colors={option.colors} size="md" />
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
