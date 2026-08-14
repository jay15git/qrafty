"use client"

import { type ReactNode } from "react"

import { ElasticSlider } from "@/components/ui/elastic-slider"
import {
  DESKTOP_INSPECTOR_LABEL_CLASS,
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

const DESKTOP_ELASTIC_SLIDER_CLASS =
  "desktop-elastic-slider [--elastic-slider-height:--spacing(8)] [--elastic-slider-radius:9999px] [--elastic-slider-bg:rgba(255,255,255,0.095)] [--elastic-slider-fill:rgba(255,255,255,0.13)] [--elastic-slider-fill-active:rgba(255,255,255,0.2)] [--elastic-slider-hash:rgba(255,255,255,0.24)] [--elastic-slider-handle:rgba(255,255,255,0.7)] [--elastic-slider-label:rgba(255,255,255,0.58)] [--elastic-slider-focus:rgba(255,255,255,0.82)]"

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
          className={DESKTOP_ELASTIC_SLIDER_CLASS}
          formatValue={() => valueLabel}
          label={label}
          max={max}
          min={min}
          scrubSound
          step={step}
          value={value}
          onValueChange={onChange}
        />
      </div>
    </div>
  )
}

export function DesktopInspectorValueGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid w-full grid-cols-2 gap-x-5 gap-y-3 [&>:nth-child(even)]:justify-self-end [&>:nth-child(odd)]:justify-self-start">
      {children}
    </div>
  )
}

export function DesktopInspectorNumberField({
  disabled,
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  disabled?: boolean
  label: string
  max?: number
  min?: number
  onChange: (value: number) => void
  step?: number
  value: number
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
      className="grid grid-cols-[1.25rem_4.75rem] items-center gap-x-2.5"
      role="group"
    >
      <span
        className={cn(
          "text-center",
          DESKTOP_INSPECTOR_LABEL_CLASS,
          scrub.canScrub && "cursor-ew-resize select-none",
        )}
        {...scrub.labelScrubHandlers}
      >
        {label}
      </span>
      <DesktopInspectorScrubNumberInput
        aria-label={label}
        className="h-7 w-[4.75rem]"
        disabled={disabled}
        inputClassName="h-7 w-full rounded-[6px] px-1.5"
        scrub={scrub}
        step={step}
      />
    </div>
  )
}
