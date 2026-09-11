"use client"

import { Plus } from "lucide-react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { CHECKERBOARD_SM } from "@/components/ui/fill-picker/lib/constants"
import { formatColor, parseColor } from "@/components/ui/fill-picker/lib/color"
import { fillPreviewHex } from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"
import { SettingsAccordionColorPicker } from "@/features/desktop-shell/inspector/settings-ui"
import {
  formatPaperShaderParamLabel,
  type PaperShaderControlDefinition,
} from "@/features/workspace/rendering/paper-shaders"
const COLOR_GRID_CHIP =
  "dn-paper-shader-color-chip dn-preview-tile group relative shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dn-squircle-xs"

function PaperShaderColorGridSwatch({
  color,
  onColorChange,
  title,
}: {
  color: string
  onColorChange: (color: string) => void
  title: string
}) {
  const parsed = parseColor(color) ?? { l: 0, c: 0, h: 0, alpha: 1 }

  return (
    <SettingsAccordionColorPicker
      title={title}
      value={color}
      onValueChange={(_fill, css) => onColorChange(fillPreviewHex(css))}
    >
      <button aria-label={title} className={COLOR_GRID_CHIP} type="button">
        <span
          aria-hidden
          className="dn-paper-shader-color-chip__fill relative z-10 block size-full overflow-hidden dn-squircle-xs"
          style={{
            backgroundImage: `linear-gradient(${formatColor(parsed, "oklch")}, ${formatColor(parsed, "oklch")}), ${CHECKERBOARD_SM}`,
            backgroundSize: "auto, 6px 6px",
          }}
        />
      </button>
    </SettingsAccordionColorPicker>
  )
}

export function PaperShaderColorGrid({
  colors,
  maxColorCount,
  namedColorControls,
  onAddColor,
  onColorsChange,
  onNamedColorChange,
  paperShaderParams,
  persistKey,
  showPalette,
}: {
  colors?: string[]
  maxColorCount?: number
  namedColorControls: PaperShaderControlDefinition[]
  onAddColor?: () => void
  onColorsChange: (colors: string[]) => void
  onNamedColorChange: (key: string, color: string) => void
  paperShaderParams: Record<string, unknown>
  persistKey: string
  showPalette: boolean
}) {
  const paletteColors = colors ?? []
  const canAdd =
    showPalette &&
    onAddColor != null &&
    paletteColors.length < (maxColorCount ?? Number.POSITIVE_INFINITY)

  if (!showPalette && namedColorControls.length === 0) {
    return null
  }

  return (
    <ScrollArea
      aria-label="Shader colors"
      chevron={false}
      className="dn-paper-shader-color-grid w-full min-w-0 max-w-full overflow-hidden"
      cueSize="tight"
      data-slot="paper-shader-color-grid"
      orientation="horizontal"
      persistKey={persistKey}
      scrollFade
      showScrollbar={false}
      viewportClassName="min-w-0"
    >
      <div className="dn-preview-row items-center py-0" role="group">
        {canAdd ? (
          <button
            aria-label="Add color"
            className={COLOR_GRID_CHIP}
            type="button"
            onClick={onAddColor}
          >
            <span
              aria-hidden
              className="dn-paper-shader-color-chip__fill relative z-10 grid size-full place-items-center text-[var(--dn-muted)] transition-colors hover:text-[var(--dn-fg)]"
            >
              <Plus className="size-3.5" />
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
      </div>
    </ScrollArea>
  )
}
