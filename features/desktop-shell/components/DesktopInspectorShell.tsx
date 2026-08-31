"use client"

import { type ReactNode } from "react"

import { ElasticSlider } from "@/components/ui/elastic-slider"
import {
  DESKTOP_INSPECTOR_CONTROL_HEIGHT_COMPACT_CLASS,
  DESKTOP_INSPECTOR_LABEL_CLASS,
  DESKTOP_INSPECTOR_RADIUS_CLASS,
} from "@/features/desktop-shell/components/desktop-inspector-tokens"
import { playDesktopPressSound } from "@/features/desktop-shell/audio/desktop-cuelume"
import { SETTINGS_ELASTIC_SLIDER_CLASS } from "@/features/desktop-shell/inspector/settings-ui"
import {
  DesktopInspectorScrubNumberInput,
  useDesktopInspectorNumberScrub,
} from "@/features/desktop-shell/components/InspectorControls"
import { cn } from "@/lib/utils"

export {
  DesktopInspectorOptionGridScrollArea,
  DesktopInspectorScrollArea,
  type DesktopInspectorOptionGridRowKind,
  type DesktopInspectorOptionGridVariant,
} from "@/features/desktop-shell/inspector/inspector-option-grid"

export function DesktopInspectorElasticSliderRow({
  ariaLabel,
  label,
  max,
  min,
  onChange,
  step = 1,
  value,
  valueLabel,
}: {
  ariaLabel?: string
  label: string
  max: number
  min: number
  onChange: (value: number) => void
  step?: number
  value: number
  valueLabel: string
}) {
  return (
    <div data-slot="desktop-elastic-slider-row" className="grid min-w-0 py-1.5">
      <div data-slot="desktop-elastic-slider">
        <ElasticSlider
          aria-label={ariaLabel ?? label}
          className={SETTINGS_ELASTIC_SLIDER_CLASS}
          formatValue={() => valueLabel}
          label={label}
          max={max}
          min={min}
          onInteractionTick={playDesktopPressSound}
          step={step}
          value={value}
          onValueChange={onChange}
        />
      </div>
    </div>
  )
}

export function DesktopInspectorValueGrid({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-2 gap-x-5 gap-y-3 [&>:nth-child(even)]:justify-self-end [&>:nth-child(odd)]:justify-self-start",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function DesktopInspectorNumberField({
  disabled,
  fill = false,
  label,
  max,
  min,
  onChange,
  step,
  value,
  className,
  labelClassName,
}: {
  disabled?: boolean
  fill?: boolean
  label: string
  max?: number
  min?: number
  onChange: (value: number) => void
  step?: number
  value: number
  className?: string
  labelClassName?: string
}) {
  const scrub = useDesktopInspectorNumberScrub({
    disabled,
    max,
    min,
    onChange,
    step,
    value,
  })

  return (
    <div
      className={cn(
        fill
          ? "grid w-full min-w-0 grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-x-2"
          : "grid grid-cols-[1.25rem_4.75rem] items-center gap-x-2.5",
        className,
      )}
      role="group"
    >
      <span
        className={cn(
          fill ? "text-left" : "text-center",
          DESKTOP_INSPECTOR_LABEL_CLASS,
          fill && "truncate-none",
          labelClassName,
          scrub.canScrub && "cursor-ew-resize touch-pan-y select-none",
        )}
        {...scrub.labelScrubHandlers}
      >
        {label}
      </span>
      <DesktopInspectorScrubNumberInput
        aria-label={label}
        className={cn(
          fill ? "w-full min-w-0" : "w-[4.75rem]",
          DESKTOP_INSPECTOR_CONTROL_HEIGHT_COMPACT_CLASS,
        )}
        disabled={disabled}
        inputClassName={cn(
          DESKTOP_INSPECTOR_CONTROL_HEIGHT_COMPACT_CLASS,
          "w-full px-1.5",
          DESKTOP_INSPECTOR_RADIUS_CLASS,
        )}
        scrub={scrub}
        step={step}
      />
    </div>
  )
}
