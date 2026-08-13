"use client"

import * as React from "react"
import { useMemo } from "react"

import { ColorPickerContext } from "@/components/ui/fill-picker/context"
import { GradientPickerContext } from "@/components/ui/fill-picker/contexts/gradient"
import {
  FillPickerIdContext,
  fillPaneId,
  fillTabId,
  useFillPickerContext,
} from "@/components/ui/fill-picker/contexts/fill"
import { useColorPicker } from "@/components/ui/fill-picker/hooks/use-color-picker"
import { useGradientPicker } from "@/components/ui/fill-picker/hooks/use-gradient-picker"
import { DEFAULT_LINEAR } from "@/components/ui/fill-picker/lib/gradient"
import type { OklchColor } from "@/components/ui/fill-picker/lib/types"
import {
  ColorPicker,
  FillPicker,
  GradientPicker,
  parseFill,
  type Fill,
} from "@/components/ui/fill-picker-base/fill"
import { formatColor, parseColor } from "@/components/ui/fill-picker-base/color-picker"
import { GradientStopEditorContext } from "@/components/ui/fill-picker-base/gradient"
import { stopEditorSlot } from "@/components/ui/fill-picker-base/parts/gradient/stop-editor"
import { cn } from "@/lib/utils"

const DESKTOPNEW_FILL_COLOR_FORMAT = "hex" as const
const DESKTOPNEW_GRADIENT_STOP_FORMAT = "hex" as const

function DesktopNewFillColorPane({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const fill = useFillPickerContext()
  const idBase = React.useContext(FillPickerIdContext)
  if (fill.mode !== "color") return null

  const colorValue: OklchColor =
    fill.fill.kind === "color" ? fill.fill.color : { l: 0, c: 0, h: 0, alpha: 1 }

  const setFillRef = React.useRef(fill.setFill)
  setFillRef.current = fill.setFill
  const onValueChange = React.useCallback((color: OklchColor) => {
    setFillRef.current({ kind: "color", color })
  }, [])

  const state = useColorPicker({
    value: colorValue,
    onValueChange,
    defaultFormat: DESKTOPNEW_FILL_COLOR_FORMAT,
  })

  return (
    <ColorPickerContext.Provider value={state}>
      <div
        aria-labelledby={fillTabId(idBase, "color")}
        className={cn("flex flex-col gap-2", className)}
        data-mode="color"
        data-slot="fill-picker-pane"
        id={fillPaneId(idBase, "color")}
        role="tabpanel"
      >
        {children}
      </div>
    </ColorPickerContext.Provider>
  )
}

function DesktopNewFillGradientPane({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const fill = useFillPickerContext()
  const idBase = React.useContext(FillPickerIdContext)
  if (fill.mode !== "gradient") return null

  const gradientValue = fill.fill.kind === "gradient" ? fill.fill.gradient : DEFAULT_LINEAR

  const setFillRef = React.useRef(fill.setFill)
  setFillRef.current = fill.setFill
  const onValueChange = React.useCallback((gradient: typeof gradientValue) => {
    setFillRef.current({ kind: "gradient", gradient })
  }, [])

  const state = useGradientPicker({
    value: gradientValue,
    onValueChange,
    defaultStopColorFormat: DESKTOPNEW_GRADIENT_STOP_FORMAT,
  })

  return (
    <GradientStopEditorContext.Provider value={stopEditorSlot}>
      <GradientPickerContext.Provider value={state}>
        <div
          aria-labelledby={fillTabId(idBase, "gradient")}
          className={cn("flex flex-col gap-2", className)}
          data-mode="gradient"
          data-slot="fill-picker-pane"
          id={fillPaneId(idBase, "gradient")}
          role="tabpanel"
        >
          {children}
        </div>
      </GradientPickerContext.Provider>
    </GradientStopEditorContext.Provider>
  )
}

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
}: {
  value: string
  onValueChange: (css: string) => void
  className?: string
}) {
  const fill = useMemo(() => parseFill(value) ?? fillFromHex(value), [value])

  return (
    <FillPicker.Root
      className={cn("dn-fill-picker-panel max-w-none border-0 bg-transparent shadow-none", className)}
      value={fill}
      onValueChange={(_next, css) => onValueChange(css)}
    >
      <FillPicker.Tabs className="self-stretch">
        <FillPicker.Tab mode="color" className="flex-1">
          Solid
        </FillPicker.Tab>
        <FillPicker.Tab mode="gradient" className="flex-1">
          Gradient
        </FillPicker.Tab>
      </FillPicker.Tabs>
      <DesktopNewFillColorPane>
        <ColorPicker.Area />
        <ColorPicker.Hue />
        <ColorPicker.Alpha />
        <ColorPicker.ChannelInput />
      </DesktopNewFillColorPane>
      <DesktopNewFillGradientPane>
        <div className="flex items-center justify-between gap-2">
          <GradientPicker.TypeSwitcher />
        </div>
        <GradientPicker.Bar />
        <GradientPicker.Area />
        <GradientPicker.ShapeSwitcher />
        <GradientPicker.PositionPad />
        <GradientPicker.PositionInput />
        <GradientPicker.RadiusInput />
        <GradientPicker.AnglePad />
        <GradientPicker.AngleInput />
        <GradientPicker.StopList />
        <GradientPicker.Presets />
      </DesktopNewFillGradientPane>
    </FillPicker.Root>
  )
}
