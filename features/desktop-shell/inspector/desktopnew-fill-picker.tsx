"use client"

import { useRef, useState } from "react"

import {
  ColorPicker,
  FillPicker,
  GradientPicker,
  parseFill,
  type Fill,
} from "@/components/ui/fill-picker-base/fill"
import { formatColor, parseColor } from "@/components/ui/fill-picker-base/color-picker"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DESKTOP_DOTS_PALETTE_PRESETS } from "@/features/desktop-shell/inspector/desktopnew-pattern-palettes"
import { cn } from "@/lib/utils"

export function fillFromHex(hex: string): Fill {
  const color = parseColor(hex)
  return {
    kind: "color",
    color: color ?? { l: 0, c: 0, h: 0, alpha: 1 },
  }
}

export function fillPreviewHex(fillCss: string): string {
  const parsed = parseFill(fillCss)
  if (!parsed) {
    const color = parseColor(fillCss)
    return color ? formatColor(color, "hex") : "#171717"
  }

  if (parsed.kind === "color") {
    return formatColor(parsed.color, "hex")
  }

  const stops = [...parsed.gradient.stops].sort((a, b) => a.position - b.position)
  const first = stops[0]?.color
  return first ? formatColor(first, "hex") : "#171717"
}

export function isGradientFill(fillCss: string): boolean {
  return parseFill(fillCss)?.kind === "gradient"
}

export function DesktopNewFillPicker({
  value,
  onValueChange,
  className,
  modulePattern,
  solidOnly = false,
}: {
  value: string
  onValueChange: (fill: Fill, css: string) => void
  className?: string
  solidOnly?: boolean
  modulePattern?: {
    selectedPalette: string[]
    selectedPreset: string | "custom"
    onSelect: (preset: { label: string; colors: string[] } | "custom") => void
  }
}) {
  // Snapshot on mount. Controlled CSS round-trips through formatGradient,
  // which bakes Area start/end into stop percentages. parseFill cannot
  // recover start/end, so feeding that CSS back collapses both stops onto
  // the same % and freezes the bar thumbs.
  const initialFillRef = useRef(parseFill(value) ?? fillFromHex(value))
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
      onValueChange={onValueChange}
    >
      {solidOnly ? null : (
      <FillPicker.Tabs className="self-stretch">
        <FillPicker.Tab
          className="flex-1"
          mode="color"
          onClick={() => setActiveMode("color")}
        >
          Solid
        </FillPicker.Tab>
        <FillPicker.Tab
          className="flex-1"
          mode="gradient"
          onClick={() => setActiveMode("gradient")}
        >
          Gradient
        </FillPicker.Tab>
        {modulePattern ? (
          <button
            aria-selected={activeMode === "pattern"}
            className={cn(
              "rounded-sm px-3 py-1 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              activeMode === "pattern"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            role="tab"
            tabIndex={activeMode === "pattern" ? 0 : -1}
            type="button"
            onClick={() => setActiveMode("pattern")}
          >
            Pattern
          </button>
        ) : null}
      </FillPicker.Tabs>
      )}
      {!solidOnly && activeMode === "pattern" && modulePattern ? (
        <ModulePatternPicker {...modulePattern} />
      ) : (
        <>
          <FillPicker.Pane className="flex flex-col gap-2" mode="color">
            <ColorPicker.Area />
            <ColorPicker.Hue />
            <ColorPicker.Alpha />
            <ColorPicker.ChannelInput formats={["hex", "rgb", "hsl", "oklch"]} />
          </FillPicker.Pane>
          {solidOnly ? null : (
            <FillPicker.Pane className="flex flex-col gap-2" mode="gradient">
              <GradientPicker.TypeSwitcher />
              <GradientPicker.Bar editOnClick />
              <GradientPicker.Area />
              <GradientPicker.InterpSwitcher />
              <GradientPicker.ShapeSwitcher />
              <GradientPicker.PositionGroup>
                <GradientPicker.PositionPad />
                <GradientPicker.PositionInput />
              </GradientPicker.PositionGroup>
              <GradientPicker.RadiusInput />
              <GradientPicker.EllipseRadiiInput />
              <GradientPicker.AngleGroup>
                <GradientPicker.AnglePad />
                <GradientPicker.AngleInput />
              </GradientPicker.AngleGroup>
              <GradientPicker.StopList />
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
}: {
  selectedPalette: string[]
  selectedPreset: string | "custom"
  onSelect: (preset: { label: string; colors: string[] } | "custom") => void
}) {
  return (
    <ScrollArea
      className="w-full min-w-0 max-w-full overflow-hidden"
      chevron={false}
      cueSize="tight"
      orientation="horizontal"
      scrollFade
      viewportClassName="min-w-0"
    >
      <div className="grid min-w-max grid-cols-4 gap-1.5 px-1 py-1.5">
        <button
          aria-label="Use custom pattern palette"
          aria-pressed={selectedPreset === "custom"}
          className={cn("dn-preview-tile relative flex size-14 items-center justify-center p-0 text-center dn-squircle-xs", selectedPreset === "custom" && "ring-2 ring-primary ring-offset-1")}
          type="button"
          onClick={() => onSelect("custom")}
        >
          <span className="text-[10px] font-medium">Custom</span>
        </button>
        {DESKTOP_DOTS_PALETTE_PRESETS.map((option) => {
          const isSelected = selectedPreset === option.label || (selectedPreset === "custom" && selectedPalette.join() === option.colors.join())
          return (
            <button
              key={option.label}
              aria-label={`Use ${option.label} pattern palette`}
              aria-pressed={isSelected}
              className={cn(
                "dn-preview-tile group relative size-14 shrink-0 p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dn-squircle-xs",
                isSelected && "ring-2 ring-primary ring-offset-1",
              )}
              title={option.label}
              type="button"
              onClick={() => onSelect(option)}
            >
              <span aria-hidden="true" className="flex -space-x-2">
                {option.colors.map((color, index) => (
                  <span key={`${option.label}-${index}`} className="size-5 rounded-full ring-1 ring-background" style={{ backgroundColor: color }} />
                ))}
              </span>
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}
