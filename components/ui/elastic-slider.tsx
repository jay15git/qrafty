"use client"

import * as React from "react"
import { useReducedMotion } from "motion/react"

import { ElasticSliderTrack } from "@/components/ui/elastic-slider-track"
import { useElasticSlider } from "@/components/ui/use-elastic-slider"
import { cn } from "@/lib/utils"

export type ElasticSliderProps = {
  label: string
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  formatValue?: (value: number) => string
  className?: string
  animateValue?: boolean
  "aria-label"?: string
}

export function ElasticSlider({
  label,
  value: valueProp,
  defaultValue,
  onValueChange,
  min = 0,
  max = 1,
  step = 0.01,
  formatValue,
  className,
  animateValue = true,
  "aria-label": ariaLabel,
}: ElasticSliderProps) {
  const shouldReduceMotion = useReducedMotion()
  const useCalligraphAnimation = animateValue && !shouldReduceMotion

  const slider = useElasticSlider({
    label,
    value: valueProp,
    defaultValue,
    onValueChange,
    min,
    max,
    step,
    formatValue,
  })

  return (
    <div
      ref={slider.wrapperRef}
      data-slot="elastic-slider"
      className={cn(
        "[--elastic-slider-height:--spacing(9)] [--elastic-slider-radius:var(--radius-lg)]",
        "[--elastic-slider-bg:var(--muted)]",
        "[--elastic-slider-fill:color-mix(in_srgb,var(--muted-foreground)_10%,transparent)]",
        "[--elastic-slider-fill-active:color-mix(in_srgb,var(--muted-foreground)_18%,transparent)]",
        "[--elastic-slider-hash:color-mix(in_srgb,var(--muted-foreground)_28%,transparent)]",
        "[--elastic-slider-handle:var(--foreground)]",
        "[--elastic-slider-label:var(--muted-foreground)]",
        "[--elastic-slider-focus:var(--foreground)]",
        "relative h-(--elastic-slider-height)",
        className,
      )}
    >
      <ElasticSliderTrack
        trackRef={slider.trackRef}
        labelRef={slider.labelRef}
        valueRef={slider.valueRef}
        isActive={slider.isActive}
        isDragging={slider.isDragging}
        keyboardFocusRing={slider.keyboardFocusRing}
        ariaLabel={ariaLabel}
        label={label}
        min={min}
        max={max}
        value={slider.value}
        displayValue={slider.displayValue}
        displaySign={slider.displaySign}
        displayBody={slider.displayBody}
        useCalligraphAnimation={useCalligraphAnimation}
        shouldReduceMotion={slider.shouldReduceMotion}
        rubberWidth={slider.rubberWidth}
        rubberX={slider.rubberX}
        fillWidth={slider.fillWidth}
        handleLeft={slider.handleLeft}
        handleOpacity={slider.handleOpacity}
        valueDodge={slider.valueDodge}
        hashMarkCount={slider.hashMarkCount}
        hashMarkPct={slider.hashMarkPct}
        onPointerDown={slider.handlePointerDown}
        onPointerMove={slider.handlePointerMove}
        onPointerUp={slider.handlePointerUp}
        onFocus={slider.handleTrackFocus}
        onBlur={slider.handleTrackBlur}
        onKeyDown={slider.handleKeyDown}
        onMouseEnter={() => slider.setIsHovered(true)}
        onMouseLeave={() => slider.setIsHovered(false)}
      />
    </div>
  )
}
