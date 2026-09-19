"use client"

import { Plus, X } from "lucide-react"

import { CHECKERBOARD_SM } from "@/components/ui/fill-picker/lib/constants"
import { formatColor, parseColor } from "@/components/ui/fill-picker/lib/color"
import { fillPreviewHex } from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"
import {
  SETTINGS_FILL_OPTION_TILE,
  SETTINGS_FILL_OPTION_TILE_INNER,
} from "@/features/desktop-shell/inspector/settings-preview-tiles"
import { SettingsAccordionColorPicker } from "@/features/desktop-shell/inspector/settings-ui"
import { SettingsOptionShelf } from "@/features/desktop-shell/inspector/mobile-settings-rail"
import { cn } from "@/lib/utils"
import {
  formatPaperShaderParamLabel,
  type PaperShaderControlDefinition,
} from "@/features/workspace/rendering/paper-shader-definitions"
import { DEFAULT_PAPER_SHADER_MIN_COLOR_COUNT } from "@/features/workspace/rendering/paper-shader-colors"
const COLOR_GRID_CHIP = cn("dn-paper-shader-color-chip", SETTINGS_FILL_OPTION_TILE)

function PaperShaderColorGridSwatch({
  color,
  onColorChange,
  onRemove,
  title,
}: {
  color: string
  onColorChange: (color: string) => void
  onRemove?: () => void
  title: string
}) {
  const parsed = parseColor(color) ?? { l: 0, c: 0, h: 0, alpha: 1 }

  return (
    <div className="dn-paper-shader-color-chip-wrap group/chip">
      <SettingsAccordionColorPicker
        title={title}
        value={color}
        onValueChange={(_fill, css) => onColorChange(fillPreviewHex(css))}
      >
        <button aria-label={title} className={COLOR_GRID_CHIP} type="button">
          <span aria-hidden className={SETTINGS_FILL_OPTION_TILE_INNER}>
            <span
              className="block size-full dn-squircle-xs"
              style={{
                backgroundImage: `linear-gradient(${formatColor(parsed, "oklch")}, ${formatColor(parsed, "oklch")}), ${CHECKERBOARD_SM}`,
                backgroundSize: "auto, 6px 6px",
              }}
            />
          </span>
        </button>
      </SettingsAccordionColorPicker>
      {onRemove ? (
        <button
          aria-label={`Remove ${title}`}
          className="absolute right-0 top-0 grid size-5 cursor-pointer place-items-center rounded-full bg-black/65 text-white opacity-0 transition-opacity hover:bg-black/80 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dn-focus,var(--ring))] group-hover/chip:opacity-100 group-focus-within/chip:opacity-100"
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onRemove()
          }}
        >
          <X className="size-3" strokeWidth={2.5} />
        </button>
      ) : null}
    </div>
  )
}

export function PaperShaderColorGrid({
  colors,
  maxColorCount,
  namedColorControls,
  onAddColor,
  onColorsChange,
  onNamedColorChange,
  onRemoveColor,
  paperShaderParams,
  showPalette,
}: {
  colors?: string[]
  maxColorCount?: number
  namedColorControls: PaperShaderControlDefinition[]
  onAddColor?: () => void
  onColorsChange: (colors: string[]) => void
  onNamedColorChange: (key: string, color: string) => void
  onRemoveColor?: (index: number) => void
  paperShaderParams: Record<string, unknown>
  showPalette: boolean
}) {
  const paletteColors = colors ?? []
  const canAdd =
    showPalette &&
    onAddColor != null &&
    paletteColors.length < (maxColorCount ?? Number.POSITIVE_INFINITY)
  const canRemove =
    showPalette &&
    onRemoveColor != null &&
    paletteColors.length > DEFAULT_PAPER_SHADER_MIN_COLOR_COUNT

  if (!showPalette && namedColorControls.length === 0) {
    return null
  }

  return (
    <SettingsOptionShelf
      ariaLabel="Shader colors"
      dataSlot="paper-shader-color-grid"
      gridClassName="dn-paper-shader-color-grid"
      persistKey="paper-shader-colors"
    >
      {canAdd ? (
        <button
          aria-label="Add color"
          className={COLOR_GRID_CHIP}
          type="button"
          onClick={onAddColor}
        >
          <span aria-hidden className={SETTINGS_FILL_OPTION_TILE_INNER}>
            <span className="grid size-full place-items-center bg-[color-mix(in_srgb,var(--dn-muted)_38%,transparent)] text-[var(--dn-fg)] transition-colors group-hover:bg-[color-mix(in_srgb,var(--dn-muted)_55%,transparent)] dn-squircle-xs">
              <Plus className="size-4" strokeWidth={2.5} />
            </span>
          </span>
        </button>
      ) : null}

      {showPalette
        ? paletteColors.map((color, index) => (
            <PaperShaderColorGridSwatch
              key={`palette-color-${index}`}
              color={color}
              title={`Color ${index + 1}`}
              onColorChange={(next) => {
                const nextColors = [...paletteColors]
                nextColors[index] = next
                onColorsChange(nextColors)
              }}
              onRemove={canRemove ? () => onRemoveColor?.(index) : undefined}
            />
          ))
        : null}

      {namedColorControls.map((control) => {
        const raw = paperShaderParams[control.key]
        const color =
          typeof raw === "string" && /^#[0-9a-f]{6}$/i.test(raw) ? raw : "#000000"

        return (
          <PaperShaderColorGridSwatch
            key={control.key}
            color={color}
            title={formatPaperShaderParamLabel(control.key)}
            onColorChange={(next) => onNamedColorChange(control.key, next)}
          />
        )
      })}
    </SettingsOptionShelf>
  )
}
