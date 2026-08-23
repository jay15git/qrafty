"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react"

import { Alpha } from "@/components/ui/fill-picker-base/parts/alpha"
import { ChannelInput } from "@/components/ui/fill-picker-base/parts/channel-input"
import { FormatSwitcher } from "@/components/ui/fill-picker-base/parts/format-switcher"
import { Hue } from "@/components/ui/fill-picker-base/parts/hue"
import { ColorPickerContext } from "@/components/ui/fill-picker/context"
import { useColorPicker } from "@/components/ui/fill-picker/hooks/use-color-picker"
import { CHECKERBOARD_SM } from "@/components/ui/fill-picker/lib/constants"
import { formatColor, parseColor } from "@/components/ui/fill-picker/lib/color"
import type { OklchColor } from "@/components/ui/fill-picker/lib/types"
import { Area as ColorArea } from "@/components/ui/fill-picker/parts/area"
import { EyeDropper } from "@/components/ui/fill-picker/parts/eye-dropper"
import { FieldInput, FieldInputGroup, FieldShell } from "@/components/ui/fill-picker/parts/field"
import { StopPopover } from "@/components/ui/fill-picker/parts/gradient/stop-popover"

export function PaletteColorStopList({
  colors,
  onPaletteColorChange,
}: {
  colors: string[]
  onPaletteColorChange: (index: number, color: string) => void
}) {
  return (
    <div
      className="flex flex-col gap-1 px-1"
      data-slot="palette-color-stop-list"
    >
      {colors.map((color, index) => (
        <PaletteColorStopRow
          key={`palette-color-${index}`}
          color={color}
          index={index}
          onColorChange={onPaletteColorChange}
        />
      ))}
    </div>
  )
}

function PaletteColorStopRow({
  color,
  index,
  onColorChange,
}: {
  color: string
  index: number
  onColorChange: (index: number, color: string) => void
}) {
  const [open, setOpen] = useState(false)
  const parsed = useMemo(
    () => parseColor(color) ?? { l: 0, c: 0, h: 0, alpha: 1 },
    [color],
  )
  const formatted = formatColor(parsed, "hex")
  const [draft, setDraft] = useState(formatted)
  const focusedRef = useRef(false)

  useEffect(() => {
    if (!focusedRef.current) {
      setDraft(formatted)
    }
  }, [formatted])

  const commitDraft = (raw: string) => {
    const next = parseColor(raw.trim())
    if (next) {
      onColorChange(index, formatColor(next, "hex"))
      return
    }

    setDraft(formatted)
  }

  const swatch = (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        setOpen((current) => !current)
      }}
      aria-label={`Edit color ${index + 1}`}
      style={{
        backgroundImage: `linear-gradient(${formatColor(parsed, "oklch")}, ${formatColor(parsed, "oklch")}), ${CHECKERBOARD_SM}`,
        backgroundSize: "auto, 6px 6px",
      }}
      className="size-7 shrink-0 rounded-xs border border-border outline-none transition-shadow hover:ring-2 hover:ring-ring focus-visible:ring-2 focus-visible:ring-ring"
    />
  )

  return (
    <div className="flex items-center gap-2 rounded-md border border-border p-1 text-xs">
      <PaletteColorStopEditor
        color={color}
        onColorChange={(next) => onColorChange(index, next)}
        open={open}
        onOpenChange={setOpen}
      >
        {swatch}
      </PaletteColorStopEditor>
      <FieldShell className="h-7 min-w-0 flex-1">
        <FieldInputGroup>
          <span className="sr-only">Color value</span>
          <FieldInput
            value={draft}
            spellCheck={false}
            onFocus={() => {
              focusedRef.current = true
            }}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={(event) => {
              focusedRef.current = false
              commitDraft(event.target.value)
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                commitDraft((event.target as HTMLInputElement).value)
                ;(event.target as HTMLInputElement).blur()
              } else if (event.key === "Escape") {
                event.preventDefault()
                setDraft(formatted)
                ;(event.target as HTMLInputElement).blur()
              }
            }}
            aria-label={`Color ${index + 1} value`}
            className="text-left"
          />
        </FieldInputGroup>
      </FieldShell>
    </div>
  )
}

function PaletteColorStopEditor({
  color,
  onColorChange,
  open,
  onOpenChange,
  children,
}: {
  color: string
  onColorChange: (color: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactElement
}) {
  const parsed = parseColor(color)
  const l = parsed?.l ?? 0
  const c = parsed?.c ?? 0
  const h = parsed?.h ?? 0
  const alpha = parsed?.alpha ?? 1
  const liveColor = useMemo<OklchColor>(
    () => ({ l, c, h, alpha }),
    [l, c, h, alpha],
  )
  const onValueChange = useCallback(
    (next: OklchColor) => onColorChange(formatColor(next, "hex")),
    [onColorChange],
  )
  const state = useColorPicker({
    value: liveColor,
    onValueChange,
    defaultFormat: "hex",
    formats: ["hex", "rgb", "hsl", "oklch"],
  })

  return (
    <StopPopover
      open={open}
      onOpenChange={onOpenChange}
      anchor={children}
      className="flex w-72 flex-col gap-3"
      onContentClick={(event) => event.stopPropagation()}
    >
      <ColorPickerContext.Provider value={state}>
        <ColorArea mode="oklch-cl" />
        <div className="flex flex-col gap-1.5">
          <Hue />
          <Alpha />
        </div>
        <div className="flex items-center gap-2">
          <FormatSwitcher className="flex-1" />
          <EyeDropper className="h-8 w-full flex-1" />
        </div>
        <ChannelInput showFormat={false} />
      </ColorPickerContext.Provider>
    </StopPopover>
  )
}
