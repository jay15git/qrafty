"use client"

import * as React from "react"
import { Calligraph } from "calligraph"
import { m, type MotionValue } from "motion/react"

import { cn } from "@/lib/utils"

export type ElasticSliderTrackProps = {
  trackRef: React.RefObject<HTMLDivElement | null>
  labelRef: React.RefObject<HTMLSpanElement | null>
  valueRef: React.RefObject<HTMLSpanElement | null>
  isActive: boolean
  isDragging: boolean
  keyboardFocusRing: boolean
  ariaLabel?: string
  label: string
  min: number
  max: number
  value: number
  displayValue: string
  displaySign: string
  displayBody: string
  useCalligraphAnimation: boolean
  shouldReduceMotion: boolean | null
  rubberWidth: MotionValue<string>
  rubberX: MotionValue<number>
  fillWidth: MotionValue<string>
  handleLeft: MotionValue<string>
  handleOpacity: number
  valueDodge: boolean
  hashMarkCount: number
  hashMarkPct: (index: number) => number
  onPointerDown: (event: React.PointerEvent) => void
  onPointerMove: (event: React.PointerEvent) => void
  onPointerUp: (event: React.PointerEvent) => void
  onFocus: () => void
  onBlur: () => void
  onKeyDown: (event: React.KeyboardEvent) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

export function ElasticSliderTrack({
  trackRef,
  labelRef,
  valueRef,
  isActive,
  isDragging,
  keyboardFocusRing,
  ariaLabel,
  label,
  min,
  max,
  value,
  displayValue,
  displaySign,
  displayBody,
  useCalligraphAnimation,
  shouldReduceMotion,
  rubberWidth,
  rubberX,
  fillWidth,
  handleLeft,
  handleOpacity,
  valueDodge,
  hashMarkCount,
  hashMarkPct,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onFocus,
  onBlur,
  onKeyDown,
  onMouseEnter,
  onMouseLeave,
}: ElasticSliderTrackProps) {
  return (
    <m.div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      data-slot="elastic-slider-track"
      data-active={isActive}
      data-dragging={isDragging}
      data-focus-visible={keyboardFocusRing}
      data-vaul-no-drag=""
      aria-label={ariaLabel ?? label}
      aria-orientation="horizontal"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={displayValue}
      className={cn(
        "group/elastic-slider absolute inset-0 cursor-ew-resize touch-none overflow-hidden rounded-(--elastic-slider-radius) bg-(--elastic-slider-bg) outline-none select-none",
        "data-[focus-visible=true]:ring-2 data-[focus-visible=true]:ring-ring/50 data-[focus-visible=true]:ring-offset-1 data-[focus-visible=true]:ring-offset-background",
      )}
      style={{ width: rubberWidth, x: rubberX }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        data-slot="elastic-slider-hash-marks"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        {Array.from({ length: hashMarkCount }, (_, i) => (
          <div
            key={i}
            className={cn(
              "absolute top-1/2 h-2 w-px -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-200",
              "bg-transparent group-data-[active=true]/elastic-slider:bg-(--elastic-slider-hash)",
            )}
            style={{ left: `${hashMarkPct(i)}%` }}
          />
        ))}
      </div>

      <m.div
        data-slot="elastic-slider-fill"
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 transition-colors",
          "bg-(--elastic-slider-fill) group-data-[active=true]/elastic-slider:bg-(--elastic-slider-fill-active)",
        )}
        style={{ width: fillWidth }}
      />

      <m.div
        data-slot="elastic-slider-handle"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 h-5 w-1 rounded-full bg-(--elastic-slider-handle)"
        style={{ left: handleLeft, y: "-50%" }}
        animate={{
          opacity: handleOpacity,
          scaleX: isDragging ? 1.08 : isActive ? 1 : 0.25,
          scaleY: isDragging ? 1.08 : isActive && valueDodge ? 0.75 : 1,
        }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : {
                scaleX: {
                  type: "spring",
                  visualDuration: 0.25,
                  bounce: 0.15,
                },
                scaleY: { type: "spring", visualDuration: 0.2, bounce: 0.1 },
                opacity: { duration: 0.15 },
              }
        }
      />

      <span
        ref={labelRef}
        data-slot="elastic-slider-label"
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 inline-flex -translate-y-1/2 items-center text-sm/none font-medium text-(--elastic-slider-label) transition-colors"
      >
        {label}
      </span>

      <span
        ref={valueRef}
        data-slot="elastic-slider-value"
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-mono text-sm/none font-medium transition-colors",
          "text-(--elastic-slider-label) group-data-[active=true]/elastic-slider:text-(--elastic-slider-focus)",
          "elastic-slider-calligraph-value",
        )}
      >
        {displaySign ? (
          <span aria-hidden="true" className="inline-block leading-none">
            {displaySign}
          </span>
        ) : null}
        {useCalligraphAnimation ? (
          <Calligraph
            variant="slots"
            animation="snappy"
            autoSize={false}
            className="elastic-slider-calligraph inline-flex leading-none"
          >
            {displayBody}
          </Calligraph>
        ) : (
          displayBody
        )}
      </span>
    </m.div>
  )
}
