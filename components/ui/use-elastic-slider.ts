"use client"

import * as React from "react"
import {
  animate,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react"

import { useControllableState } from "@/hooks/use-controllable-state"
import { useTouchPrimary } from "@/hooks/use-touch-primary"
import { previewSession } from "@/features/workspace/preview/preview-session"

const CLICK_THRESHOLD = 3
const AXIS_LOCK_THRESHOLD_PX = 10
const DEAD_ZONE = 32
const MAX_CURSOR_RANGE = 200
const MAX_STRETCH = 8

const HANDLE_BUFFER = 8
const LABEL_OFFSET = 12 + 4
const VALUE_OFFSET = 12 - 8

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function decimalsForStep(step: number): number {
  const s = step.toString()
  const dot = s.indexOf(".")
  return dot === -1 ? 0 : s.length - dot - 1
}

function roundValue(val: number, step: number): number {
  const raw = Math.round(val / step) * step
  return parseFloat(raw.toFixed(decimalsForStep(step)))
}

function snapToDecile(rawValue: number, min: number, max: number): number {
  const normalized = (rawValue - min) / (max - min)
  const nearest = Math.round(normalized * 10) / 10
  if (Math.abs(normalized - nearest) <= 0.03125) {
    return min + nearest * (max - min)
  }
  return rawValue
}

function isTouchLikePointer(event: { pointerType: string }) {
  return event.pointerType === "touch" || event.pointerType === "pen"
}

function releasePointerCaptureSafe(event: React.PointerEvent) {
  const target = event.currentTarget as HTMLElement
  if (typeof target.hasPointerCapture === "function" && target.hasPointerCapture(event.pointerId)) {
    target.releasePointerCapture(event.pointerId)
  }
}

export function splitSignedDisplayValue(value: string) {
  if (value.startsWith("-")) {
    return { sign: "-", body: value.slice(1) }
  }

  return { sign: "", body: value }
}

type UseElasticSliderOptions = {
  label: string
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  onInteractionTick?: () => void
  min: number
  max: number
  step: number
  formatValue?: (value: number) => string
}

export function useElasticSlider({
  label,
  value: valueProp,
  defaultValue,
  onValueChange,
  onInteractionTick,
  min,
  max,
  step,
  formatValue,
}: UseElasticSliderOptions) {
  const isTouchPrimary = useTouchPrimary()
  const shouldReduceMotion = useReducedMotion()
  const onValueChangeRef = React.useRef(onValueChange)
  const onInteractionTickRef = React.useRef(onInteractionTick)
  const pendingExternalValueRef = React.useRef<number | null>(null)
  const externalRafRef = React.useRef<number | null>(null)
  const lastInteractionTickAtRef = React.useRef(0)

  onValueChangeRef.current = onValueChange
  onInteractionTickRef.current = onInteractionTick

  const maybePlayInteractionTick = React.useCallback(() => {
    const now = Date.now()
    if (now - lastInteractionTickAtRef.current < 80) {
      return
    }

    lastInteractionTickAtRef.current = now
    onInteractionTickRef.current?.()
  }, [])

  const flushExternalValue = React.useCallback(() => {
    externalRafRef.current = null
    const pending = pendingExternalValueRef.current
    if (pending === null) {
      return
    }

    pendingExternalValueRef.current = null
    onValueChangeRef.current?.(pending)
  }, [])

  const isInteractingRef = React.useRef(false)

  const batchedOnValueChange = React.useCallback(
    (next: number) => {
      if (!isInteractingRef.current) {
        onValueChangeRef.current?.(next)
        return
      }

      pendingExternalValueRef.current = next
      if (externalRafRef.current === null) {
        externalRafRef.current = requestAnimationFrame(flushExternalValue)
      }
    },
    [flushExternalValue],
  )

  const [value = min, setValue] = useControllableState({
    prop: valueProp,
    defaultProp: defaultValue ?? min,
    onChange: batchedOnValueChange,
    caller: "ElasticSlider",
  })
  const valueRefForTick = React.useRef(value)

  const setValueWithTick = React.useCallback(
    (next: number) => {
      const rounded = roundValue(next, step)
      if (rounded !== valueRefForTick.current) {
        valueRefForTick.current = rounded
        maybePlayInteractionTick()
      }
      setValue(rounded)
    },
    [maybePlayInteractionTick, setValue, step],
  )

  React.useEffect(() => {
    valueRefForTick.current = value
  }, [value])

  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const trackRef = React.useRef<HTMLDivElement>(null)
  const labelRef = React.useRef<HTMLSpanElement>(null)
  const valueRef = React.useRef<HTMLSpanElement>(null)

  const [isInteracting, setIsInteracting] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)
  const [keyboardFocusRing, setKeyboardFocusRing] = React.useState(false)

  const pointerDownPos = React.useRef<{ x: number; y: number } | null>(null)
  const axisLockRef = React.useRef<"pending" | "scrub" | "scroll" | null>(null)
  const pendingPointerFocusRef = React.useRef(false)
  const isClickRef = React.useRef(true)
  const animRef = React.useRef<ReturnType<typeof animate> | null>(null)
  const wrapperRectRef = React.useRef<DOMRect | null>(null)
  const scaleRef = React.useRef(1)

  const percentage = ((value - min) / (max - min)) * 100
  const isActive = isInteracting || isHovered
  const displayValue = formatValue
    ? formatValue(value)
    : value.toFixed(decimalsForStep(step))
  const { sign: displaySign, body: displayBody } = splitSignedDisplayValue(displayValue)

  const fillPercent = useMotionValue(percentage)
  const fillWidth = useTransform(fillPercent, (pct) => `${pct}%`)
  const handleLeft = useTransform(
    fillPercent,
    (pct) => `max(4px, calc(${pct}% - 8px))`,
  )

  const rubberStretch = useMotionValue(0)
  const rubberWidth = useTransform(
    rubberStretch,
    (s) => `calc(100% + ${Math.abs(s)}px)`,
  )
  const rubberX = useTransform(rubberStretch, (s) => (s < 0 ? s : 0))

  React.useEffect(() => {
    if (!isInteracting && !animRef.current) {
      fillPercent.jump(percentage)
    }
  }, [percentage, isInteracting, fillPercent])

  const positionToValue = React.useCallback(
    (clientX: number) => {
      const rect = wrapperRectRef.current
      if (!rect) return min

      const sceneX = (clientX - rect.left) / scaleRef.current
      const nativeWidth = wrapperRef.current?.offsetWidth ?? rect.width
      const percent = clamp(sceneX / nativeWidth, 0, 1)

      return clamp(min + percent * (max - min), min, max)
    },
    [min, max],
  )

  const percentFromValue = React.useCallback(
    (v: number) => ((v - min) / (max - min)) * 100,
    [min, max],
  )

  const animateFillTo = React.useCallback(
    (targetPercent: number) => {
      animRef.current?.stop()

      if (shouldReduceMotion) {
        fillPercent.jump(targetPercent)
        animRef.current = null
        return
      }

      animRef.current = animate(fillPercent, targetPercent, {
        type: "spring",
        stiffness: 300,
        damping: 25,
        mass: 0.8,
        onComplete: () => {
          animRef.current = null
        },
      })
    },
    [fillPercent, shouldReduceMotion],
  )

  const computeRubberStretch = React.useCallback((clientX: number, sign: number) => {
    const rect = wrapperRectRef.current
    if (!rect) return 0

    const distancePast = sign < 0 ? rect.left - clientX : clientX - rect.right
    const overflow = Math.max(0, distancePast - DEAD_ZONE)

    return (
      sign * MAX_STRETCH * Math.sqrt(Math.min(overflow / MAX_CURSOR_RANGE, 1))
    )
  }, [])

  const handlePointerDown = React.useCallback((e: React.PointerEvent) => {
    const touchLike = isTouchLikePointer(e)
    axisLockRef.current = touchLike ? "pending" : "scrub"
    pointerDownPos.current = { x: e.clientX, y: e.clientY }
    isClickRef.current = true
    pendingPointerFocusRef.current = true
    setKeyboardFocusRing(false)

    if (!touchLike) {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      setIsInteracting(true)
      isInteractingRef.current = true
      previewSession.beginInteraction()
    }

    trackRef.current?.focus({ preventScroll: true })
    requestAnimationFrame(() => {
      pendingPointerFocusRef.current = false
    })

    const wrapper = wrapperRef.current
    if (wrapper) {
      const rect = wrapper.getBoundingClientRect()
      wrapperRectRef.current = rect
      scaleRef.current = rect.width / wrapper.offsetWidth
    }
  }, [])

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      if (!pointerDownPos.current || axisLockRef.current === "scroll") {
        return
      }

      const dx = e.clientX - pointerDownPos.current.x
      const dy = e.clientY - pointerDownPos.current.y

      if (axisLockRef.current === "pending") {
        if (Math.hypot(dx, dy) < AXIS_LOCK_THRESHOLD_PX) {
          return
        }

        if (Math.abs(dx) >= Math.abs(dy)) {
          axisLockRef.current = "scrub"
          e.currentTarget.setPointerCapture(e.pointerId)
          isClickRef.current = false
          setIsInteracting(true)
          isInteractingRef.current = true
          setIsDragging(true)
          previewSession.beginInteraction()
        } else {
          axisLockRef.current = "scroll"
          pointerDownPos.current = null
          return
        }
      }

      if (!isInteractingRef.current) {
        return
      }

      if (isClickRef.current && Math.hypot(dx, dy) > CLICK_THRESHOLD) {
        isClickRef.current = false
        setIsDragging(true)
      }

      if (isClickRef.current) return

      const rect = wrapperRectRef.current
      if (rect && !shouldReduceMotion) {
        if (e.clientX < rect.left) {
          rubberStretch.jump(computeRubberStretch(e.clientX, -1))
        } else if (e.clientX > rect.right) {
          rubberStretch.jump(computeRubberStretch(e.clientX, 1))
        } else {
          rubberStretch.jump(0)
        }
      }

      const newValue = positionToValue(e.clientX)
      animRef.current?.stop()
      animRef.current = null
      fillPercent.jump(percentFromValue(newValue))
      setValueWithTick(newValue)
    },
    [
      positionToValue,
      percentFromValue,
      setValueWithTick,
      step,
      fillPercent,
      rubberStretch,
      computeRubberStretch,
      shouldReduceMotion,
    ],
  )

  const endPointerSession = React.useCallback((e: React.PointerEvent) => {
    releasePointerCaptureSafe(e)
    setIsInteracting(false)
    isInteractingRef.current = false
    setIsDragging(false)
    pointerDownPos.current = null
    axisLockRef.current = null
  }, [])

  const handlePointerUp = React.useCallback(
    (e: React.PointerEvent) => {
      if (axisLockRef.current === "scroll") {
        endPointerSession(e)
        return
      }

      const canCommit = isInteractingRef.current || axisLockRef.current === "pending"
      if (!canCommit) {
        endPointerSession(e)
        return
      }

      if (isClickRef.current) {
        const rawValue = positionToValue(e.clientX)
        const discreteSteps = (max - min) / step
        const snapped =
          discreteSteps <= 10
            ? clamp(min + Math.round((rawValue - min) / step) * step, min, max)
            : snapToDecile(rawValue, min, max)

        animateFillTo(percentFromValue(snapped))
        setValueWithTick(snapped)
      }

      if (!shouldReduceMotion && rubberStretch.get() !== 0) {
        animate(rubberStretch, 0, {
          type: "spring",
          visualDuration: 0.35,
          bounce: 0.15,
        })
      }

      if (isInteractingRef.current) {
        if (externalRafRef.current !== null) {
          cancelAnimationFrame(externalRafRef.current)
          flushExternalValue()
        }
        previewSession.endInteraction()
      }

      endPointerSession(e)
    },
    [
      animateFillTo,
      endPointerSession,
      flushExternalValue,
      max,
      min,
      percentFromValue,
      positionToValue,
      rubberStretch,
      setValueWithTick,
      shouldReduceMotion,
      step,
    ],
  )

  const handlePointerCancel = React.useCallback(
    (e: React.PointerEvent) => {
      if (isInteractingRef.current) {
        if (externalRafRef.current !== null) {
          cancelAnimationFrame(externalRafRef.current)
          flushExternalValue()
        }
        previewSession.endInteraction()
      }
      endPointerSession(e)
    },
    [endPointerSession, flushExternalValue],
  )

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      const arrowStep = e.shiftKey ? step * 10 : step
      let next: number | null = null

      switch (e.key) {
        case "ArrowRight":
        case "ArrowUp":
          next = value + arrowStep
          break
        case "ArrowLeft":
        case "ArrowDown":
          next = value - arrowStep
          break
        case "Home":
          next = min
          break
        case "End":
          next = max
          break
        default:
          return
      }

      e.preventDefault()
      setKeyboardFocusRing(true)

      const snapped = roundValue(clamp(next, min, max), step)
      animateFillTo(percentFromValue(snapped))
      setValueWithTick(snapped)
    },
    [value, min, max, step, animateFillTo, percentFromValue, setValueWithTick],
  )

  const handleTrackFocus = React.useCallback(() => {
    if (!pendingPointerFocusRef.current) {
      setKeyboardFocusRing(true)
    }
  }, [])

  const handleTrackBlur = React.useCallback(() => {
    setKeyboardFocusRing(false)
  }, [])

  const [dodge, setDodge] = React.useState({ left: 38, right: 72 })

  React.useLayoutEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const measure = () => {
      const trackWidth = wrapper.offsetWidth
      if (trackWidth <= 0) return

      const labelEl = labelRef.current
      const valueEl = valueRef.current

      const left = labelEl
        ? ((LABEL_OFFSET + labelEl.offsetWidth + HANDLE_BUFFER) / trackWidth) *
          100
        : 38

      const right = valueEl
        ? ((trackWidth - VALUE_OFFSET - valueEl.offsetWidth - HANDLE_BUFFER) /
            trackWidth) *
          100
        : 72

      setDodge((prev) => {
        return prev.left === left && prev.right === right
          ? prev
          : { left, right }
      })
    }

    measure()

    if (typeof ResizeObserver === "undefined") {
      return
    }

    const observer = new ResizeObserver(measure)
    observer.observe(wrapper)

    if (labelRef.current) observer.observe(labelRef.current)
    if (valueRef.current) observer.observe(valueRef.current)

    return () => observer.disconnect()
  }, [label, displayValue])

  const valueDodge = percentage < dodge.left || percentage > dodge.right
  const handleOpacity = isTouchPrimary
    ? isDragging
      ? 0.85
      : valueDodge
        ? 0.35
        : 0.5
    : !isActive
      ? 0
      : valueDodge
        ? 0.1
        : isDragging
          ? 0.8
          : 0.5

  const discreteSteps = (max - min) / step
  const hashMarkCount = discreteSteps <= 10 ? discreteSteps - 1 : 9

  const hashMarkPct = (i: number) => {
    return discreteSteps <= 10
      ? (((i + 1) * step) / (max - min)) * 100
      : (i + 1) * 10
  }

  return {
    wrapperRef,
    trackRef,
    labelRef,
    valueRef,
    value,
    isActive,
    isDragging,
    keyboardFocusRing,
    displayValue,
    displaySign,
    displayBody,
    shouldReduceMotion,
    rubberWidth,
    rubberX,
    fillWidth,
    handleLeft,
    handleOpacity,
    valueDodge,
    hashMarkCount,
    hashMarkPct,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleTrackFocus,
    handleTrackBlur,
    handleKeyDown,
    setIsHovered,
  }
}
