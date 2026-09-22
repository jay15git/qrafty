"use client"

import { Minus, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"

const PALETTE_COLOR_ROW =
  "flex items-center gap-[length:var(--dn-space-inline)] rounded-[length:var(--dn-radius-sm)] bg-[var(--dn-control)] px-[length:var(--dn-space-inline)]"

const PALETTE_COLOR_FIELD =
  "h-[length:var(--dn-control-height-compact)] min-w-0 flex-1 border border-[var(--dn-line)] bg-[var(--dn-control)] shadow-none focus-within:border-[color-mix(in_srgb,var(--dn-fg)_18%,transparent)] focus-within:ring-0"

const PALETTE_COLOR_SWATCH =
  "size-8 shrink-0 dn-squircle-xs outline-none transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--dn-fg)_18%,transparent)]"

export function PaletteColorStopList({
  colors,
  maxCount,
  minCount,
  onAdd,
  onPaletteColorChange,
  onRemove,
}: {
  colors: string[]
  maxCount?: number
  minCount?: number
  onAdd?: () => void
  onPaletteColorChange: (index: number, color: string) => void
  onRemove?: (index: number) => void
}) {
  const canRemove = onRemove != null && colors.length > (minCount ?? 1)
  const canAdd = onAdd != null && colors.length < (maxCount ?? Number.POSITIVE_INFINITY)

  return (
    <div
      className="flex flex-col gap-1"
      data-slot="palette-color-stop-list"
    >
      {colors.map((color, index) => (
        <PaletteColorStopRow
          key={`palette-color-${color}-${colors.slice(0, index).filter((entry) => entry === color).length}`}
          canRemove={canRemove}
          color={color}
          index={index}
          onColorChange={onPaletteColorChange}
          onRemove={onRemove}
        />
      ))}
      {onAdd ? (
        <Button
          type="button"
          variant="outline"
          disabled={!canAdd}
          onClick={onAdd}
          aria-label="Add color"
          className="h-[length:var(--dn-control-height-compact)] cursor-pointer border-[var(--dn-line)] bg-[var(--dn-control)] font-mono text-xs tracking-wide shadow-none hover:bg-[var(--dn-control-hover)]"
        >
          <Plus aria-hidden className="size-3.5" />
          Add color
        </Button>
      ) : null}
    </div>
  )
}

function PaletteColorStopRow({
  canRemove,
  color,
  index,
  onColorChange,
  onRemove,
}: {
  canRemove: boolean
  color: string
  index: number
  onColorChange: (index: number, color: string) => void
  onRemove?: (index: number) => void
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
      className={PALETTE_COLOR_SWATCH}
    />
  )

  return (
    <div className={cn("dn-type-meta", PALETTE_COLOR_ROW)}>
      <PaletteColorEditorPopover
        color={color}
        onColorChange={(next) => onColorChange(index, next)}
        open={open}
        onOpenChange={setOpen}
      >
        {swatch}
      </PaletteColorEditorPopover>
      <FieldShell className={PALETTE_COLOR_FIELD}>
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
      {onRemove ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onRemove(index)
          }}
          disabled={!canRemove}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--dn-muted)] transition-colors hover:text-[var(--dn-fg)] disabled:opacity-30"
          aria-label={`Remove color ${index + 1}`}
        >
          <Minus className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}

function PaletteColorEditorPopover({
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
