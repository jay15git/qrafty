"use client"

import { useRef } from "react"

import {
  ColorPicker,
  FillPicker,
  GradientPicker,
  parseFill,
  type Fill,
} from "@/components/ui/fill-picker-base/fill"
import { formatColor, parseColor } from "@/components/ui/fill-picker-base/color-picker"
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

export { cssFillToBackgroundStyle } from "@/features/workspace/model/css-fill-style"

export function DesktopNewFillPicker({
  value,
  onValueChange,
  className,
}: {
  value: string
  onValueChange: (fill: Fill, css: string) => void
  className?: string
}) {
  // Snapshot on mount. Controlled CSS round-trips through formatGradient,
  // which bakes Area start/end into stop percentages. parseFill cannot
  // recover start/end, so feeding that CSS back collapses both stops onto
  // the same % and freezes the bar thumbs.
  const initialFillRef = useRef(parseFill(value) ?? fillFromHex(value))
  const initialFill = initialFillRef.current
  const initialMode = initialFill.kind === "gradient" ? "gradient" : "color"

  return (
    <FillPicker.Root
      className={cn(
        "dn-fill-picker-panel max-h-[min(72dvh,40rem)] max-w-none overflow-y-auto border-0 bg-transparent shadow-none",
        className,
      )}
      defaultMode={initialMode}
      defaultValue={initialFill}
      onValueChange={onValueChange}
    >
      <FillPicker.Tabs className="self-stretch">
        <FillPicker.Tab className="flex-1" mode="color">
          Solid
        </FillPicker.Tab>
        <FillPicker.Tab className="flex-1" mode="gradient">
          Gradient
        </FillPicker.Tab>
      </FillPicker.Tabs>
      <FillPicker.Pane className="flex flex-col gap-2" mode="color">
        <ColorPicker.Area />
        <ColorPicker.Hue />
        <ColorPicker.Alpha />
        <ColorPicker.ChannelInput formats={["hex", "rgb", "hsl", "oklch"]} />
      </FillPicker.Pane>
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
    </FillPicker.Root>
  )
}
