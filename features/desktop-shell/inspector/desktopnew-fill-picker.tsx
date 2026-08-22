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
import { ColorPickerContext } from "@/components/ui/fill-picker/context"
import { useColorPicker } from "@/components/ui/fill-picker/hooks/use-color-picker"
import { CHECKERBOARD_SM } from "@/components/ui/fill-picker/lib/constants"
import { formatColor, parseColor } from "@/components/ui/fill-picker/lib/color"
import type { OklchColor } from "@/components/ui/fill-picker/lib/types"
import { Area as ColorArea } from "@/components/ui/fill-picker/parts/area"
import { EyeDropper } from "@/components/ui/fill-picker/parts/eye-dropper"
import { FieldInput, FieldInputGroup, FieldShell } from "@/components/ui/fill-picker/parts/field"
import { StopPopover } from "@/components/ui/fill-picker/parts/gradient/stop-popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DESKTOP_DOTS_PALETTE_PRESETS } from "@/features/desktop-shell/inspector/desktopnew-pattern-palettes"
import {
  fillFromHex,
  normalizeFillForQrTarget,
} from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"
import { SegmentTabs } from "@/features/desktop-shell/inspector/settings-ui"
import { cn } from "@/lib/utils"

const QR_GRADIENT_TYPES = ["linear", "radial"] as const

export function DesktopNewFillPicker({
  value,
  onValueChange,
  className,
  modulePattern,
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
  const initialMode = solidOnly
    ? "color"
    : initialFill.kind === "gradient"
      ? "gradient"
      : "color"
  const [activeMode, setActiveMode] = useState<"color" | "gradient" | "pattern">(
    initialMode,
  )
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
      defaultMode={initialMode}
      defaultValue={initialFill}
      mode={pickerMode}
      onModeChange={setActiveMode}
      onValueChange={handleValueChange}
    >
      {solidOnly ? null : (
        <SegmentTabs
          className="self-stretch"
          items={
            modulePattern
              ? ["Solid", "Gradient", "Pattern"]
              : ["Solid", "Gradient"]
          }
          value={
            activeMode === "color"
              ? "Solid"
              : activeMode === "gradient"
                ? "Gradient"
                : "Pattern"
          }
          onChange={(item) => {
            if (item === "Solid") setActiveMode("color")
            else if (item === "Gradient") setActiveMode("gradient")
            else setActiveMode("pattern")
          }}
        />
      )}
      {!solidOnly && activeMode === "pattern" && modulePattern ? (
        <ModulePatternPicker {...modulePattern} />
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
        scrollFade
        showScrollbar={false}
        viewportClassName="min-w-0"
      >
        <div className="flex min-w-max gap-1.5 px-1 py-2">
          <button
            aria-label="Use custom pattern palette"
            aria-pressed={selectedPreset === "custom"}
            className={PATTERN_TILE}
            type="button"
            onClick={() => onSelect("custom")}
          >
            <span className="text-[9px] font-medium leading-none">Custom</span>
          </button>
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
      <PatternPaletteColorList
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

function PatternPaletteColorList({
  colors,
  onPaletteColorChange,
}: {
  colors: string[]
  onPaletteColorChange: (index: number, color: string) => void
}) {
  return (
    <div
      className="flex flex-col gap-1 px-1"
      data-slot="pattern-palette-color-list"
    >
      {colors.map((color, index) => (
        <PatternPaletteColorRow
          key={`pattern-color-${index}`}
          color={color}
          index={index}
          onColorChange={onPaletteColorChange}
        />
      ))}
    </div>
  )
}

function PatternPaletteColorRow({
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
      aria-label={`Edit pattern color ${index + 1}`}
      style={{
        backgroundImage: `linear-gradient(${formatColor(parsed, "oklch")}, ${formatColor(parsed, "oklch")}), ${CHECKERBOARD_SM}`,
        backgroundSize: "auto, 6px 6px",
      }}
      className="size-7 shrink-0 rounded-xs border border-border outline-none transition-shadow hover:ring-2 hover:ring-ring focus-visible:ring-2 focus-visible:ring-ring"
    />
  )

  return (
    <div className="flex items-center gap-2 rounded-md border border-border p-1 text-xs">
      <PatternColorEditor
        color={color}
        onColorChange={(next) => onColorChange(index, next)}
        open={open}
        onOpenChange={setOpen}
      >
        {swatch}
      </PatternColorEditor>
      <FieldShell className="h-7 min-w-0 flex-1">
        <FieldInputGroup>
          <span className="sr-only">Pattern color value</span>
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
            aria-label={`Pattern color ${index + 1} value`}
            className="text-left"
          />
        </FieldInputGroup>
      </FieldShell>
    </div>
  )
}

function PatternColorEditor({
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
