"use client"

import { useMemo } from "react"

import { Field, FieldLabel } from "@/components/ui/field"
import { Slider } from "@/components/ui/slider"
import {
  buildGradientSliderTrackStyle,
  formatCssColor,
  normalizeGradientOffsetRange,
} from "@/features/qr-code/styles/gradient-controls"
import { cn } from "@/lib/utils"

function GradientValueChip({
  appearance = "default",
  label,
  value,
}: {
  appearance?: "default" | "drafting"
  label: string
  value: string
}) {
  const isDrafting = appearance === "drafting"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[11px]",
        isDrafting
          ? "border-[var(--ws-line)] bg-[var(--ws-control-bg)] text-[var(--ws-ink-muted)]"
          : "border-border/60 bg-muted/30 text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "font-medium",
          isDrafting ? "text-[var(--ws-ink)]" : "text-foreground",
        )}
      >
        {label}
      </span>
      <span>{value}</span>
    </span>
  )
}

export function GradientOffsetRangeField({
  appearance = "default",
  className,
  endColor,
  endLabel = "End",
  endValue,
  hideHeader = false,
  id,
  label,
  max,
  min,
  onValueChange,
  startColor,
  startLabel = "Start",
  startValue,
  step,
  valueFormatter,
}: {
  appearance?: "default" | "drafting"
  className?: string
  endColor: string
  endLabel?: string
  endValue: number
  hideHeader?: boolean
  id: string
  label: string
  max: number
  min: number
  onValueChange: (value: [number, number]) => void
  startColor: string
  startLabel?: string
  startValue: number
  step: number
  valueFormatter: (value: number) => string
}) {
  const displayValues = normalizeGradientOffsetRange([startValue, endValue])
  const trackStyle = useMemo(
    () => buildGradientSliderTrackStyle(startColor, endColor),
    [endColor, startColor],
  )
  const thumbColors = useMemo(
    () => [formatCssColor(startColor), formatCssColor(endColor)],
    [endColor, startColor],
  )

  return (
    <Field data-slot="gradient-offset-range-slider" className={cn("gap-0", className)}>
      {!hideHeader ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <FieldLabel>{label}</FieldLabel>
          <div className="flex flex-wrap items-center gap-2">
            <GradientValueChip
              appearance={appearance}
              label={startLabel}
              value={valueFormatter(displayValues[0])}
            />
            <GradientValueChip
              appearance={appearance}
              label={endLabel}
              value={valueFormatter(displayValues[1])}
            />
          </div>
        </div>
      ) : (
        <FieldLabel className="sr-only">{label}</FieldLabel>
      )}
      <div className="flex flex-col [&>*]:mb-0">
        <Slider
          aria-label={label}
          className="mb-0 w-full"
          data-slot="gradient-offset-slider"
          formatValue={valueFormatter}
          hideFill
          id={id}
          label={label}
          max={max}
          min={min}
          onChange={(nextValue) => {
            if (!Array.isArray(nextValue)) {
              return
            }

            onValueChange(
              normalizeGradientOffsetRange([
                nextValue[0] ?? min,
                nextValue[1] ?? max,
              ]),
            )
          }}
          showThumbCheckerboard
          showValue={false}
          step={step}
          thumbBorderColor="rgba(255,255,255,0.9)"
          thumbColors={thumbColors}
          thumbDataSlot="gradient-offset-thumb"
          trackDataSlot="gradient-offset-track"
          trackStyle={trackStyle}
          value={displayValues}
        />
      </div>
    </Field>
  )
}
