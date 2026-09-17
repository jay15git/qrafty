"use client"

import { useContext, useMemo } from "react"
import type { CSSProperties, ReactNode } from "react"
import { Plus } from "lucide-react"
import { blobUrlToDataUrl } from "@qrafty/qr-internal/scene"

import { ImageCropper } from "@/components/ui/image-cropper"
import { parseFill } from "@/components/ui/fill-picker/lib/gradient"
import type { Fill } from "@/components/ui/fill-picker-base/public-api"
import { DESKTOP_DOTS_PALETTE_PRESETS } from "@/features/desktop-shell/inspector/desktopnew-pattern-palettes"
import { isGradientFill } from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"
import { getActiveFillPresetForStoredValue } from "@/features/desktop-shell/inspector/settings-fill-preset-match"
import { SETTINGS_FILL_PRESETS } from "@/features/desktop-shell/inspector/settings-fill-presets"
import { PaletteColorBarPreview } from "@/features/desktop-shell/inspector/palette-color-bar-preview"
import {
  SETTINGS_FILL_OPTION_TILE_INNER,
  SETTINGS_PATTERN_OPTION_TILE,
  SETTINGS_PATTERN_OPTION_TILE_INNER,
  SETTINGS_PREVIEW_TILE,
  SETTINGS_PREVIEW_TILE_FLUID,
} from "@/features/desktop-shell/inspector/settings-preview-tiles"
import { WallpaperOptionPreview } from "@/features/workspace/components/WallpaperOptionPreview"
import { SCENE_WALLPAPERS } from "@/features/workspace/assets/scene-wallpapers"
import { preloadRasterImage } from "@/features/workspace/rendering/preload-raster-image"
import { DesktopnewThemeContext } from "@/features/desktop-shell/inspector/desktopnew-theme-context"
import { cn } from "@/lib/utils"

export function isSceneWallpaperPath(path: string) {
  return SCENE_WALLPAPERS.some((wallpaper) => wallpaper.path === path)
}

export function SettingsImageUploadTile({
  ariaLabel = "Upload custom image",
  className,
  fluid = false,
  imageUrl,
  onClear,
  onUpload,
}: {
  ariaLabel?: string
  className?: string
  fluid?: boolean
  imageUrl: string
  onClear: () => void
  onUpload: (imageUrl: string) => void
}) {
  const theme = useContext(DesktopnewThemeContext)

  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        fluid ? SETTINGS_PREVIEW_TILE_FLUID : SETTINGS_PREVIEW_TILE,
        "dn-image-upload-tile overflow-hidden",
        fluid && "dn-image-upload-tile--fluid",
        className,
      )}
      data-slot="image-upload-tile"
    >
      <ImageCropper
        className="size-full"
        compact
        dialogTheme={theme}
        maxFileSize={5 * 1024 * 1024}
        showFormatHint={false}
        tile
        value={imageUrl || null}
        onChange={(value) => {
          if (value === null) {
            onClear()
          }
        }}
        onImageCropped={({ url }) => {
          void (async () => {
            const normalizedUrl =
              url.startsWith("blob:") ? (await blobUrlToDataUrl(url)) ?? url : url
            onUpload(normalizedUrl)
          })()
        }}
      />
    </div>
  )
}

function fillPresetStyle(preset: string): CSSProperties {
  return isGradientFill(preset) ? { background: preset } : { background: preset }
}

function FillOptionGridPlusButton({ onOpenPicker }: { onOpenPicker: () => void }) {
  return (
    <button
      aria-label="Custom fill"
      className={cn(SETTINGS_PREVIEW_TILE_FLUID)}
      type="button"
      onClick={onOpenPicker}
    >
      <span aria-hidden className={SETTINGS_FILL_OPTION_TILE_INNER}>
        <span className="grid size-full place-items-center bg-[color-mix(in_srgb,var(--dn-muted)_38%,transparent)] text-[var(--dn-fg)] transition-colors group-hover:bg-[color-mix(in_srgb,var(--dn-muted)_55%,transparent)] dn-squircle-xs">
          <Plus className="size-4" strokeWidth={2.5} />
        </span>
      </span>
    </button>
  )
}

export function SettingsFillOptionGrid({
  onOpenPicker,
  onSelect,
  presets = SETTINGS_FILL_PRESETS,
  value,
}: {
  onOpenPicker: () => void
  onSelect: (fill: Fill, css: string) => void
  persistKey?: string
  presets?: readonly string[]
  value: string
}) {
  const activePreset = useMemo(
    () => getActiveFillPresetForStoredValue(value, presets),
    [presets, value],
  )

  return (
    <div
      aria-label="Fill options"
      className="dn-fill-option-grid grid grid-cols-6 gap-0"
      data-slot="fill-option-grid"
      role="group"
    >
      <FillOptionGridPlusButton onOpenPicker={onOpenPicker} />

      {presets.map((preset) => {
        const isSelected = activePreset === preset

        return (
          <button
            key={preset}
            aria-label={isGradientFill(preset) ? "Apply gradient fill" : "Apply solid fill"}
            aria-pressed={isSelected}
            className={cn(SETTINGS_PREVIEW_TILE_FLUID)}
            type="button"
            onClick={() => {
              const fill = parseFill(preset)
              if (fill) {
                onSelect(fill, preset)
              }
            }}
          >
            <span aria-hidden className={SETTINGS_FILL_OPTION_TILE_INNER}>
              <span
                className="size-full dn-squircle-xs"
                style={fillPresetStyle(preset)}
              />
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function SettingsPatternOptionGrid({
  leadingAction,
  onSelect,
  selectedPalette,
  selectedPreset,
}: {
  leadingAction?: ReactNode
  onSelect: (preset: { label: string; colors: string[] }) => void
  persistKey?: string
  selectedPalette: string[]
  selectedPreset: string | "custom"
}) {
  return (
    <div
      aria-label="Pattern options"
      className="dn-pattern-option-grid grid grid-cols-6 gap-0"
      data-slot="pattern-option-grid"
      role="group"
    >
      {leadingAction}

      {DESKTOP_DOTS_PALETTE_PRESETS.map((option) => {
        const isSelected =
          selectedPreset === option.label ||
          (selectedPreset === "custom" && selectedPalette.join() === option.colors.join())

        return (
          <button
            key={option.label}
            aria-label={`Use ${option.label} pattern`}
            aria-pressed={isSelected}
            className={cn(SETTINGS_PATTERN_OPTION_TILE)}
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
    </div>
  )
}

export function SettingsImageOptionGrid({
  onClear,
  onSelect,
  onUpload,
  selectedPath,
}: {
  onClear: () => void
  onSelect: (imagePath: string) => void
  onUpload: (imageUrl: string) => void
  persistKey?: string
  selectedPath: string
}) {
  const customImageUrl =
    selectedPath && !isSceneWallpaperPath(selectedPath) ? selectedPath : ""

  return (
    <div
      aria-label="Image options"
      className="dn-fill-option-grid grid grid-cols-6 gap-0"
      data-slot="image-option-grid"
      role="group"
    >
      <SettingsImageUploadTile
        fluid
        imageUrl={customImageUrl}
        onClear={onClear}
        onUpload={onUpload}
      />

      {SCENE_WALLPAPERS.map((wallpaper) => {
        const isSelected = selectedPath === wallpaper.path

        return (
          <button
            key={wallpaper.id}
            aria-label={`Use ${wallpaper.label} image`}
            aria-pressed={isSelected}
            className={cn(SETTINGS_PREVIEW_TILE_FLUID)}
            title={wallpaper.label}
            type="button"
            onClick={() => onSelect(wallpaper.path)}
            onPointerEnter={() => {
              void preloadRasterImage(wallpaper.path)
            }}
          >
            <WallpaperOptionPreview
              alt={wallpaper.label}
              className="relative z-10 block size-full overflow-hidden dn-squircle-xs"
              previewPath={wallpaper.previewPath}
            />
          </button>
        )
      })}
    </div>
  )
}
