"use client"

import { type ReactNode } from "react"

import {
  INSPECTOR_CONTROL_HEIGHT_COMPACT_CLASS,
  INSPECTOR_LABEL_CLASS,
  INSPECTOR_RADIUS_CLASS,
} from "@/features/shell/components/inspector-tokens"
import { SettingsInlineSlider } from "@/features/shell/inspector/settings-ui"
import {
  InspectorScrubNumberInput,
  useInspectorNumberScrub,
} from "@/features/shell/components/InspectorControls"
import { cn } from "@/lib/utils"

export {
  InspectorOptionGridScrollArea,
  InspectorScrollArea,
} from "@/features/shell/inspector/InspectorOptionGrid"

export function InspectorElasticSliderRow({
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
    <div data-slot="elastic-slider-row" className="grid min-w-0 py-1.5">
      <div data-slot="elastic-slider">
        <SettingsInlineSlider
          ariaLabel={ariaLabel}
          formatValue={() => valueLabel}
          label={label}
          max={max}
          min={min}
          step={step}
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  )
}

export function InspectorValueGrid({
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

export function InspectorNumberField({
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
  const scrub = useInspectorNumberScrub({
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
          ? "grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2"
          : "grid grid-cols-[1.25rem_4.75rem] items-center gap-x-2.5",
        className,
      )}
      role="group"
    >
      <span
        className={cn(
          fill ? "text-left" : "text-center",
          INSPECTOR_LABEL_CLASS,
          fill && "truncate-none",
          labelClassName,
          scrub.canScrub && "cursor-ew-resize touch-pan-y select-none",
        )}
        {...scrub.labelScrubHandlers}
      >
        {label}
      </span>
      <InspectorScrubNumberInput
        aria-label={label}
        className={cn(
          fill ? "w-full min-w-0" : "w-[4.75rem]",
          INSPECTOR_CONTROL_HEIGHT_COMPACT_CLASS,
        )}
        disabled={disabled}
        inputClassName={cn(
          INSPECTOR_CONTROL_HEIGHT_COMPACT_CLASS,
          "w-full px-1.5",
          INSPECTOR_RADIUS_CLASS,
        )}
        scrub={scrub}
        step={step}
      />
    </div>
  )
}
