"use client"

import type { ComponentProps } from "react"

import { ColorPicker } from "@/components/ui/color-picker"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DESKTOP_INSPECTOR_LABEL_CLASS,
  DESKTOP_INSPECTOR_PRESS_CLASS,
  DESKTOP_INSPECTOR_ROW_CLASS,
  DesktopInspectorTextInput,
} from "@/features/desktop-shell/components/InspectorControls"
import { cn } from "@/lib/utils"

import "./desktop-inspector-motion.css"

export const DESKTOP_COLOR_SWATCH_BUTTON_CLASS = cn(
  DESKTOP_INSPECTOR_PRESS_CLASS,
  "desktop-inspector-color-swatch relative flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35",
)

export const DESKTOP_COLOR_SWATCH_FILL_CLASS =
  "relative size-6 shrink-0 overflow-hidden rounded-full border-2 border-[var(--desktop-inspector-swatch-ring)] box-border"

const DESKTOP_COLOR_SWATCH_CHECKERBOARD =
  "conic-gradient(var(--checker-a, #808080) 0 25%, var(--checker-b, #c0c0c0) 0 50%, var(--checker-a, #808080) 0 75%, var(--checker-b, #c0c0c0) 0)"

export function DesktopColorSwatchButton({
  "aria-label": ariaLabel,
  className,
  color,
  ...props
}: {
  "aria-label": string
  className?: string
  color: string
} & Omit<ComponentProps<"button">, "children" | "className" | "type">) {
  return (
    <button
      aria-label={ariaLabel}
      className={cn(DESKTOP_COLOR_SWATCH_BUTTON_CLASS, className)}
      data-slot="desktop-color-picker"
      type="button"
      {...props}
    >
      <span
        aria-hidden="true"
        className={DESKTOP_COLOR_SWATCH_FILL_CLASS}
        data-slot="desktop-color-swatch-fill"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage: DESKTOP_COLOR_SWATCH_CHECKERBOARD,
            backgroundSize: "8px 8px",
          }}
        />
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{ backgroundColor: color }}
        />
      </span>
    </button>
  )
}

export function DesktopColorInputRow({
  ariaLabel,
  label,
  onChange,
  value,
}: {
  ariaLabel?: string
  label: string
  onChange: (value: string) => void
  value: string
}) {
  const inputLabel = ariaLabel ?? label

  return (
    <div className={DESKTOP_INSPECTOR_ROW_CLASS}>
      <span className={DESKTOP_INSPECTOR_LABEL_CLASS}>{label}</span>
      <span className="flex items-center gap-2">
        <DesktopColorSwatchPicker
          ariaLabel={`${inputLabel} swatch`}
          value={value}
          onChange={onChange}
        />
        <DesktopInspectorTextInput
          aria-label={inputLabel}
          className="h-7 w-20 rounded-[5px] px-2"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      </span>
    </div>
  )
}

export function DesktopColorSwatchPicker({
  ariaLabel,
  onChange,
  value,
}: {
  ariaLabel: string
  onChange: (value: string) => void
  value: string
}) {
  return (
    <DesktopColorPickerPopover
      aria-label={ariaLabel}
      value={value}
      onChange={onChange}
    />
  )
}

export function DesktopColorPickerPopover({
  ariaLabel,
  "aria-label": ariaLabelProp,
  onChange,
  triggerClassName,
  value,
}: {
  ariaLabel?: string
  "aria-label"?: string
  onChange: (value: string) => void
  triggerClassName?: string
  value: string
}) {
  const triggerLabel = ariaLabel ?? ariaLabelProp ?? "Color swatch"

  return (
    <Popover>
      <PopoverTrigger asChild>
        <DesktopColorSwatchButton
          aria-label={triggerLabel}
          className={triggerClassName}
          color={value}
        />
      </PopoverTrigger>
      <PopoverContent
        align="center"
        data-slot="desktop-color-picker-popover"
        className="desktop-inspector-popover-content w-auto border-0 bg-transparent p-0 shadow-none"
        side="right"
        sideOffset={8}
      >
        <ColorPicker
          className={cn(
            "max-w-none !bg-[var(--desktop-color-picker-popover-bg)] !text-[var(--desktop-color-picker-popover-fg)] border-[var(--desktop-color-picker-popover-border)] shadow-[var(--desktop-glass-shadow)] backdrop-blur-xl",
          )}
          defaultFormat="hex"
          onValueChange={(nextValue) => onChange(nextValue)}
          value={value}
        />
      </PopoverContent>
    </Popover>
  )
}
