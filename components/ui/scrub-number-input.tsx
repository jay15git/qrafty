/**
 * Scrub Number Input — self-contained copy-paste module
 *
 * Horizontal scrub + click-to-edit number field with Calligraph slot-digit animation.
 *
 * ## Peer dependencies
 *
 * ```bash
 * pnpm add calligraph motion
 * # or: npm install calligraph motion
 * ```
 *
 * Tailwind CSS recommended for utility classes below (or replace FIELD_CLASS).
 *
 * ## Setup
 *
 * 1. Copy `scrub-number-input.tsx` and `scrub-number-input.css` into your project.
 * 2. Import the CSS once in your app entry or layout:
 *    `import "./scrub-number-input.css"`
 *
 * ## Usage
 *
 * ```tsx
 * import { useState } from "react"
 * import { ScrubNumberField } from "./scrub-number-input"
 * import "./scrub-number-input.css"
 *
 * function TransformX() {
 *   const [x, setX] = useState(-120)
 *   return (
 *     <ScrubNumberField
 *       aria-label="X"
 *       value={x}
 *       onValueChange={setX}
 *       step={1}
 *       className="h-7 w-[4.75rem]"
 *       inputClassName="h-7 w-full rounded-[6px] px-1.5"
 *     />
 *   )
 * }
 * ```
 *
 * Low-level API (e.g. label scrub on a sibling):
 *
 * ```tsx
 * const scrub = useNumberScrub({ value, onChange: setValue, step: 1 })
 * <span {...scrub.labelScrubHandlers}>X</span>
 * <ScrubNumberInput scrub={scrub} aria-label="X" />
 * ```
 */
"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react"
import { Calligraph } from "calligraph"
import { useReducedMotion } from "motion/react"

import "./scrub-number-input.css"

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

const SCRUB_NUMBER_FIELD_CLASS =
  "text-center tabular-nums bg-neutral-100 font-medium text-neutral-900 outline-none " +
  "placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"

const SCRUB_NUMBER_SPINNER_HIDE_CLASS =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"

function clampNumber(value: number, min?: number, max?: number) {
  let bounded = value

  if (min != null) {
    bounded = Math.max(min, bounded)
  }

  if (max != null) {
    bounded = Math.min(max, bounded)
  }

  return bounded
}

function quantizeNumber(value: number, step: number) {
  if (!Number.isFinite(step) || step <= 0) {
    return value
  }

  const quantized = Math.round(value / step) * step

  if (Number.isInteger(step)) {
    return quantized
  }

  const decimals = step.toString().split(".")[1]?.length ?? 0
  return parseFloat(quantized.toFixed(decimals))
}

export type UseNumberScrubOptions = {
  disabled?: boolean
  max?: number
  min?: number
  onChange: (value: number) => void
  shiftStep?: number
  step?: number
  value: number
}

export type ScrubState = ReturnType<typeof useNumberScrub>

export function useNumberScrub({
  disabled = false,
  max,
  min,
  onChange,
  shiftStep = 10,
  step = 1,
  value,
}: UseNumberScrubOptions) {
  const [draft, setDraft] = useState(String(value))
  const [editing, setEditing] = useState(false)
  const interactingRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const scrubRef = useRef<{
    captureTarget: HTMLElement | null
    pointerId: number
    scrubbing: boolean
    source: "input" | "label"
    startValue: number
    startX: number
  } | null>(null)

  useEffect(() => {
    if (!interactingRef.current) {
      setDraft(String(value))
    }
  }, [value])

  useEffect(() => {
    const node = surfaceRef.current

    if (!node || disabled) {
      return
    }

    const blockWheelWhileIdle = (event: WheelEvent) => {
      if (!editing) {
        event.preventDefault()
      }
    }

    node.addEventListener("wheel", blockWheelWhileIdle, { passive: false })

    return () => {
      node.removeEventListener("wheel", blockWheelWhileIdle)
    }
  }, [disabled, editing])

  const commit = useCallback(
    (nextValue: number) => {
      const quantized = quantizeNumber(nextValue, step)
      const bounded = clampNumber(quantized, min, max)
      onChange(bounded)
      setDraft(String(bounded))
    },
    [max, min, onChange, step],
  )

  const nudge = useCallback(
    (direction: 1 | -1, shift: boolean) => {
      const current = Number(draft)

      if (!Number.isFinite(current)) {
        return
      }

      const delta = shift ? shiftStep : step
      commit(current + direction * delta)
    },
    [commit, draft, shiftStep, step],
  )

  const enterEditMode = useCallback(() => {
    if (disabled) {
      return
    }

    setEditing(true)
    interactingRef.current = true

    requestAnimationFrame(() => {
      const input = inputRef.current

      if (!input) {
        return
      }

      input.focus({ preventScroll: true })
      input.select()
    })
  }, [disabled])

  const canScrub = !disabled && !editing

  const endScrubSession = useCallback(
    (event: PointerEvent<HTMLElement>, allowEditOnClick: boolean) => {
      const state = scrubRef.current

      if (!state) {
        return
      }

      const wasScrubbing = state.scrubbing
      scrubRef.current = null

      if (state.captureTarget) {
        try {
          state.captureTarget.releasePointerCapture(event.pointerId)
        } catch {
          // Pointer capture may already be released.
        }
      }

      if (wasScrubbing) {
        interactingRef.current = false
        setDraft(String(value))
        event.preventDefault()
        return
      }

      if (allowEditOnClick && state.source === "input") {
        enterEditMode()
      }
    },
    [enterEditMode, value],
  )

  const applyScrubDelta = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const state = scrubRef.current

      if (!state) {
        return
      }

      const deltaX = event.clientX - state.startX

      if (!state.scrubbing && Math.abs(deltaX) > 3) {
        state.scrubbing = true
        interactingRef.current = true
      }

      if (state.scrubbing) {
        const delta = event.shiftKey ? shiftStep : step
        commit(state.startValue + deltaX * delta)
      }
    },
    [commit, shiftStep, step],
  )

  const beginLabelScrub = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!canScrub) {
        return
      }

      if (event.pointerType === "mouse" && event.button !== 0) {
        return
      }

      const current = Number(draft)

      if (!Number.isFinite(current)) {
        return
      }

      scrubRef.current = {
        captureTarget: event.currentTarget,
        pointerId: event.pointerId,
        scrubbing: false,
        source: "label",
        startValue: current,
        startX: event.clientX,
      }
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [canScrub, draft],
  )

  const beginInputScrub = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!canScrub) {
        return
      }

      if (event.pointerType === "mouse" && event.button !== 0) {
        return
      }

      const current = Number(draft)

      if (!Number.isFinite(current)) {
        return
      }

      scrubRef.current = {
        captureTarget: null,
        pointerId: event.pointerId,
        scrubbing: false,
        source: "input",
        startValue: current,
        startX: event.clientX,
      }
      event.preventDefault()
    },
    [canScrub, draft],
  )

  const onInputPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const state = scrubRef.current

      if (!state) {
        return
      }

      if (!state.scrubbing && Math.abs(event.clientX - state.startX) > 3) {
        state.scrubbing = true
        interactingRef.current = true
        state.captureTarget = event.currentTarget
        event.currentTarget.blur()
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
      }

      applyScrubDelta(event)
    },
    [applyScrubDelta],
  )

  const labelScrubHandlers = {
    onPointerCancel: (event: PointerEvent<HTMLElement>) => {
      endScrubSession(event, false)
    },
    onPointerDown: beginLabelScrub,
    onPointerMove: applyScrubDelta,
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      endScrubSession(event, false)
    },
  }

  const scrubSurfaceHandlers = {
    onPointerCancel: (event: PointerEvent<HTMLElement>) => {
      endScrubSession(event, false)
    },
    onPointerDown: beginInputScrub,
    onPointerMove: onInputPointerMove,
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      endScrubSession(event, true)
    },
  }

  const onDisplayFocus = useCallback(() => {
    enterEditMode()
  }, [enterEditMode])

  const inputProps = {
    "data-slot": "scrub-number-scrubbable",
    inputMode: "numeric" as const,
    onBlur: () => {
      interactingRef.current = false
      setEditing(false)

      const parsed = Number(draft)

      if (Number.isFinite(parsed)) {
        commit(parsed)
        return
      }

      setDraft(String(value))
    },
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      setDraft(event.currentTarget.value)
    },
    onFocus: () => {
      interactingRef.current = true
      setEditing(true)
    },
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.currentTarget.blur()
        return
      }

      if (event.key === "Escape") {
        setDraft(String(value))
        event.currentTarget.blur()
        return
      }

      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault()
        nudge(event.key === "ArrowUp" ? 1 : -1, event.shiftKey)
      }
    },
    ref: inputRef,
    type: "text" as const,
    value: draft,
  }

  return {
    canScrub,
    displayValue: draft,
    editing,
    inputProps,
    inputRef,
    labelScrubHandlers,
    onDisplayFocus,
    scrubSurfaceHandlers,
    surfaceRef,
  }
}

function splitSignedDisplayValue(value: string) {
  if (value.startsWith("-")) {
    return { body: value.slice(1), sign: "-" }
  }

  return { body: value, sign: "" }
}

function mirrorInputTypography(source: HTMLElement): CSSProperties {
  const computed = getComputedStyle(source)

  return {
    fontFamily: computed.fontFamily,
    fontFeatureSettings: computed.fontFeatureSettings,
    fontSize: computed.fontSize,
    fontStyle: computed.fontStyle,
    fontVariantNumeric: computed.fontVariantNumeric as CSSProperties["fontVariantNumeric"],
    fontWeight: computed.fontWeight,
    letterSpacing: computed.letterSpacing,
    lineHeight: computed.lineHeight,
  }
}

function mirrorCalligraphTypography(source: HTMLElement): CSSProperties {
  const computed = getComputedStyle(source)
  const { lineHeight: _lineHeight, ...typography } = mirrorInputTypography(source)

  return {
    ...typography,
    color: computed.color,
    lineHeight: 1,
  }
}

function CalligraphNumber({
  style,
  value,
}: {
  style?: CSSProperties
  value: string
}) {
  const shouldReduceMotion = useReducedMotion()
  const { body, sign } = splitSignedDisplayValue(value)

  if (shouldReduceMotion) {
    return <span style={style}>{value}</span>
  }

  return (
    <span className="inline-flex items-center justify-center" style={style}>
      {sign ? (
        <span aria-hidden="true" className="inline-block" style={style}>
          {sign}
        </span>
      ) : null}
      <Calligraph
        animation="snappy"
        autoSize={false}
        className="scrub-number-calligraph inline-flex items-center justify-center leading-none"
        style={style}
        variant="slots"
      >
        {body}
      </Calligraph>
    </span>
  )
}

export function ScrubNumberInput({
  className,
  disabled,
  inputClassName,
  scrub,
  ...props
}: {
  className?: string
  disabled?: boolean
  inputClassName?: string
  scrub: ScrubState
} & Omit<ComponentProps<"input">, "onChange" | "type" | "value">) {
  const fieldClass = cn(inputClassName, SCRUB_NUMBER_FIELD_CLASS)
  const ariaLabel = props["aria-label"]
  const mirrorRef = useRef<HTMLInputElement>(null)
  const [mirroredTypography, setMirroredTypography] = useState<CSSProperties>({})

  const syncMirroredTypography = useCallback(() => {
    const source = scrub.editing ? scrub.inputRef.current : mirrorRef.current

    if (!source) {
      return
    }

    setMirroredTypography(mirrorCalligraphTypography(source))
  }, [scrub.editing, scrub.inputRef])

  useLayoutEffect(() => {
    syncMirroredTypography()

    const source = scrub.editing ? scrub.inputRef.current : mirrorRef.current

    if (!source || typeof ResizeObserver === "undefined") {
      return
    }

    const observer = new ResizeObserver(syncMirroredTypography)
    observer.observe(source)

    return () => {
      observer.disconnect()
    }
  }, [scrub.displayValue, scrub.editing, syncMirroredTypography])

  return (
    <div ref={scrub.surfaceRef} className={cn("relative shrink-0", className)}>
      <input
        ref={mirrorRef}
        aria-hidden
        className={fieldClass}
        readOnly
        tabIndex={-1}
        value={scrub.displayValue}
        style={{
          inset: 0,
          opacity: 0,
          pointerEvents: "none",
          position: "absolute",
          zIndex: 0,
        }}
      />
      {scrub.editing ? (
        <input
          {...props}
          {...scrub.inputProps}
          className={cn(fieldClass, "relative z-[1]")}
          disabled={disabled}
        />
      ) : (
        <div
          {...scrub.scrubSurfaceHandlers}
          aria-label={typeof ariaLabel === "string" ? ariaLabel : undefined}
          className={cn(
            fieldClass,
            "relative z-[1] flex items-center justify-center",
            scrub.canScrub && "cursor-ew-resize select-none",
            disabled && "cursor-not-allowed opacity-50",
          )}
          data-slot="scrub-number-scrubbable"
          role="button"
          tabIndex={disabled ? -1 : 0}
          onFocus={scrub.onDisplayFocus}
          onKeyDown={(event) => {
            if (disabled) {
              return
            }

            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              scrub.onDisplayFocus()
            }
          }}
        >
          <div
            className="pointer-events-none flex w-full items-center justify-center"
            data-slot="scrub-number-calligraph-value"
            style={mirroredTypography}
          >
            <CalligraphNumber style={mirroredTypography} value={scrub.displayValue} />
          </div>
        </div>
      )}
    </div>
  )
}

export type ScrubNumberFieldProps = Omit<
  ComponentProps<"input">,
  "onChange" | "type" | "value"
> & {
  onValueChange: (value: number) => void
  shiftStep?: number
  value: number
  min?: number
  max?: number
  step?: number
  className?: string
  inputClassName?: string
}

export function ScrubNumberField({
  className,
  disabled,
  max,
  min,
  onValueChange,
  shiftStep,
  step,
  value,
  inputClassName,
  ...props
}: ScrubNumberFieldProps) {
  const scrub = useNumberScrub({
    disabled,
    max: typeof max === "number" ? max : undefined,
    min: typeof min === "number" ? min : undefined,
    onChange: onValueChange,
    shiftStep,
    step: typeof step === "number" ? step : undefined,
    value,
  })

  return (
    <div className="min-w-0">
      <ScrubNumberInput
        {...props}
        className={cn("h-9 w-full", className)}
        disabled={disabled}
        inputClassName={cn(
          "h-9 w-full rounded-[7px] px-3",
          SCRUB_NUMBER_SPINNER_HIDE_CLASS,
          inputClassName,
        )}
        scrub={scrub}
      />
    </div>
  )
}
