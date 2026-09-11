"use client"

import { useMemo } from "react"
import type { CSSProperties } from "react"
import { Plus } from "lucide-react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { parseFill } from "@/components/ui/fill-picker/lib/gradient"
import type { Fill } from "@/components/ui/fill-picker-base/public-api"
import { isGradientFill } from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"
import { getActiveFillPresetForStoredValue } from "@/features/desktop-shell/inspector/settings-fill-preset-match"
import { SETTINGS_FILL_PRESETS } from "@/features/desktop-shell/inspector/settings-fill-presets"
import {
  SETTINGS_FILL_OPTION_TILE,
  SETTINGS_FILL_OPTION_TILE_INNER,
  SETTINGS_PREVIEW_ROW,
} from "@/features/desktop-shell/inspector/settings-preview-tiles"
import { cn } from "@/lib/utils"

function fillPresetStyle(preset: string): CSSProperties {
  return isGradientFill(preset) ? { background: preset } : { background: preset }
}

export function SettingsFillOptionGrid({
  onOpenPicker,
  onSelect,
  persistKey,
  value,
}: {
  onOpenPicker: () => void
  onSelect: (fill: Fill, css: string) => void
  persistKey?: string
  value: string
}) {
  const activePreset = useMemo(() => getActiveFillPresetForStoredValue(value), [value])

  return (
    <ScrollArea
      aria-label="Fill options"
      chevron={false}
      className="dn-fill-option-grid w-full min-w-0 max-w-full overflow-hidden"
      cueSize="tight"
      data-slot="fill-option-grid"
      orientation="horizontal"
      persistKey={persistKey ?? "fill-options"}
      scrollFade
      showScrollbar={false}
      viewportClassName="min-w-0"
    >
      <div aria-label="Fill options" className={SETTINGS_PREVIEW_ROW} role="group">
        <button
          aria-label="Custom fill"
          className={cn(SETTINGS_FILL_OPTION_TILE)}
          type="button"
          onClick={onOpenPicker}
        >
          <span
            aria-hidden
            className={cn(
              SETTINGS_FILL_OPTION_TILE_INNER,
              "text-[var(--dn-muted)] transition-colors hover:text-[var(--dn-fg)]",
            )}
          >
            <Plus className="size-3.5" />
          </span>
        </button>

        {SETTINGS_FILL_PRESETS.map((preset) => {
          const isSelected = activePreset === preset

          return (
            <button
              key={preset}
              aria-label={isGradientFill(preset) ? "Apply gradient fill" : "Apply solid fill"}
              aria-pressed={isSelected}
              className={cn(SETTINGS_FILL_OPTION_TILE)}
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
    </ScrollArea>
  )
}
