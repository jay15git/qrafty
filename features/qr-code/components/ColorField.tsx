"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import { ColorPicker } from "@/components/ui/color-picker"
import {
  ColorPicker as FillColorPicker,
  parseColor,
  type OklchColor,
} from "@/components/ui/fill-picker/fill-picker"
import { Field, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"

export function EmbeddedColorPickerField({
  chrome = "default",
  className,
  label,
  onValueChange,
  pickerChrome,
  pickerClassName,
  size,
  value,
}: {
  chrome?: "default" | "minimal"
  className?: string
  label: string
  onValueChange: (value: string) => void
  pickerChrome?: "default" | "embedded" | "drafting"
  pickerClassName?: string
  size?: number
  value: string
}) {
  const isMinimal = chrome === "minimal"
  const isDraftingPicker = pickerChrome === "drafting"

  return (
    <Field className={className}>
      {!isMinimal ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          <FieldLabel>{label}</FieldLabel>
          <span className="font-mono text-xs text-muted-foreground">{value}</span>
        </div>
      ) : (
        <FieldLabel className="sr-only">{label}</FieldLabel>
      )}
      {isDraftingPicker ? (
        <DraftingFillPicker
          className={pickerClassName}
          onColorChange={onValueChange}
          size={size ?? 320}
          value={value}
        />
      ) : (
        <ColorPicker
          className={pickerClassName}
          defaultFormat="hex"
          onValueChange={onValueChange}
          value={value}
        />
      )}
    </Field>
  )
}

function DraftingFillPicker({
  className,
  onColorChange,
  size,
  value,
}: {
  className?: string
  onColorChange: (value: string) => void
  size: number
  value: string
}) {
  const color = useMemo(() => parseDraftingColor(value), [value])
  const [savedSwatches, setSavedSwatches] = useState<string[]>(readDraftingSavedSwatches)
  const latestHexRef = useRef(value)
  const swatchPresets = mergeDraftingSwatches(savedSwatches)

  useEffect(() => {
    latestHexRef.current = value
  }, [value])

  function savePreset(hex: string) {
    setSavedSwatches((currentSwatches) => {
      if (currentSwatches.includes(hex)) {
        return currentSwatches
      }

      const nextSwatches = [...currentSwatches, hex]
      writeDraftingSavedSwatches(nextSwatches)

      return nextSwatches
    })
  }

  return (
    <FillColorPicker.Root
      backgroundColor="#C19B1D"
      className={cn(
        "w-full max-w-none gap-3 rounded-none border-0 bg-transparent p-0 text-[var(--ws-ink)] shadow-none",
        className,
      )}
      defaultFormat="hex"
      onValueChange={(_nextColor, _formatted, formats) => {
        const nextHex = formats.hex

        if (nextHex.toLowerCase() !== latestHexRef.current.toLowerCase()) {
          latestHexRef.current = nextHex
          onColorChange(nextHex)
        }
      }}
      style={{ maxWidth: size, width: "100%" }}
      value={color}
    >
      <FillColorPicker.Area
        className={cn(
          "h-auto aspect-[4/2] rounded-none border border-[var(--ws-line)] bg-transparent shadow-none",
          "focus-visible:ring-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ws-line-strong)]",
        )}
        mode="hsv-sv"
      />
      <div className="flex flex-col gap-1.5">
        <FillColorPicker.Hue className={DRAFTING_FILL_PICKER_SLIDER_CLASS_NAME} />
        <FillColorPicker.Alpha className={DRAFTING_FILL_PICKER_SLIDER_CLASS_NAME} />
      </div>
      <div className="flex items-center gap-2">
        <FillColorPicker.FormatSwitcher
          className="flex-1"
          selectClassName={DRAFTING_FILL_PICKER_INPUT_CLASS_NAME}
        />
        <FillColorPicker.EyeDropper
          className={cn(
            "h-8 w-full flex-1 rounded-none border-[var(--ws-line)] bg-[var(--ws-control-bg)] text-[var(--ws-ink)] shadow-none",
            "hover:border-[var(--ws-line-hover)] hover:bg-[var(--ws-control-bg-hover)] hover:text-[var(--ws-ink)]",
            "focus-visible:border-[var(--ws-line-strong)] focus-visible:ring-0",
          )}
        />
      </div>
      <FillColorPicker.CssInput
        className={cn(
          DRAFTING_FILL_PICKER_INPUT_CLASS_NAME,
          "font-mono text-xs",
        )}
      />
      <FillColorPicker.Swatches
        className={cn(
          "grid-cols-8 rounded-none text-[var(--ws-ink-muted)]",
          "[&_button]:border-[var(--ws-line)] [&_button]:focus-visible:ring-0 [&_button]:focus-visible:outline [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-[var(--ws-line-strong)]",
          "[&_button[aria-selected=true]]:ring-2 [&_button[aria-selected=true]]:ring-[var(--ws-line-strong)]",
        )}
        onAdd={(_color, hex) => savePreset(hex)}
        presets={swatchPresets}
      />
    </FillColorPicker.Root>
  )
}

const DRAFTING_FILL_PICKER_SWATCH_STORAGE_KEY = "new-qr-drafting-fill-picker-swatches"

const DRAFTING_FILL_PICKER_DEFAULT_SWATCHES = [
  "#111111",
  "#4B4F56",
  "#FFFFFF",
  "#C19B1D",
  "#151515",
  "oklch(0.7 0.18 30)",
  "oklch(0.7 0.18 150)",
  "color(display-p3 0.85 0.45 0.15)",
]

const DRAFTING_FILL_PICKER_SLIDER_CLASS_NAME = cn(
  "h-3 rounded-none shadow-none",
  "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ws-line-strong)]",
  "[&>div:last-child]:rounded-[4px] [&>div:last-child]:border-[var(--ws-line)] [&>div:last-child]:shadow-[var(--ws-shadow-rest)]",
)

const DRAFTING_FILL_PICKER_INPUT_CLASS_NAME = cn(
  "rounded-none border-[var(--ws-line)] bg-[var(--ws-control-bg)] text-[var(--ws-ink)] shadow-none",
  "hover:border-[var(--ws-line-hover)] hover:bg-[var(--ws-control-bg-hover)]",
  "focus-visible:border-[var(--ws-line-strong)] focus-visible:ring-0",
  "placeholder:text-[var(--ws-ink-muted)]",
)

function parseDraftingColor(value: string): OklchColor {
  return parseColor(value) ?? { l: 0, c: 0, h: 0, alpha: 1 }
}

function readDraftingSavedSwatches() {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const rawSwatches = window.localStorage.getItem(DRAFTING_FILL_PICKER_SWATCH_STORAGE_KEY)
    const parsedSwatches = rawSwatches ? JSON.parse(rawSwatches) : []

    return Array.isArray(parsedSwatches)
      ? parsedSwatches.filter((swatch): swatch is string => typeof swatch === "string")
      : []
  } catch {
    return []
  }
}

function writeDraftingSavedSwatches(swatches: string[]) {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(
      DRAFTING_FILL_PICKER_SWATCH_STORAGE_KEY,
      JSON.stringify(swatches),
    )
  } catch {
    // Ignore storage failures; the current session still keeps the new swatch.
  }
}

function mergeDraftingSwatches(savedSwatches: string[]) {
  return Array.from(new Set([...DRAFTING_FILL_PICKER_DEFAULT_SWATCHES, ...savedSwatches]))
}
