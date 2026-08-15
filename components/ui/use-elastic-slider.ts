"use client"

import * as React from "react"
import {
  animate,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react"

import { useControllableState } from "@/hooks/use-controllable-state"
import { playDesktopSound } from "@/lib/desktop-interaction-sound"

const CLICK_THRESHOLD = 3
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
  min: number
  max: number
  step: number
  formatValue?: (value: number) => string
  scrubSound?: boolean
  animateValue?: boolean
}

export function useElasticSlider({
  label,
  value: valueProp,
  defaultValue,
  onValueChange,
  min,
  max,
  step,
  formatValue,
  scrubSound = false,
}: UseElasticSliderOptions) {
  const [value = min, setValue] = useControllableState({
    prop: valueProp,
    defaultProp: defaultValue ?? min,
    onChange: onValueChange,
    caller: "ElasticSlider",
  })

  const shouldReduceMotion = useReducedMotion()

  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const trackRef = React.useRef<HTMLDivElement>(null)
  const labelRef = React.useRef<HTMLSpanElement>(null)
  const valueRef = React.useRef<HTMLSpanElement>(null)

  const [isInteracting, setIsInteracting] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)
  const [keyboardFocusRing, setKeyboardFocusRing] = React.useState(false)

  const pointerDownPos = React.useRef<{ x: number; y: number } | null>(null)
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

  const previousScrubValueRef = React.useRef(value)

  React.useEffect(() => {
    if (!scrubSound) {
      previousScrubValueRef.current = value
      return
    }

    if (value === previousScrubValueRef.current) return

    playDesktopSound("slider")
    previousScrubValueRef.current = value
  }, [value, scrubSound])

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
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

    pointerDownPos.current = { x: e.clientX, y: e.clientY }
    isClickRef.current = true
    setIsInteracting(true)
    pendingPointerFocusRef.current = true
    setKeyboardFocusRing(false)

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
      if (!isInteracting || !pointerDownPos.current) return

      const dx = e.clientX - pointerDownPos.current.x
      const dy = e.clientY - pointerDownPos.current.y

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
      setValue(roundValue(newValue, step))
    },
    [
      isInteracting,
      positionToValue,
      percentFromValue,
      setValue,
      step,
      fillPercent,
      rubberStretch,
      computeRubberStretch,
      shouldReduceMotion,
    ],
  )

  const handlePointerUp = React.useCallback(
    (e: React.PointerEvent) => {
      if (!isInteracting) return

      if (isClickRef.current) {
        const rawValue = positionToValue(e.clientX)
        const discreteSteps = (max - min) / step
        const snapped =
          discreteSteps <= 10
            ? clamp(min + Math.round((rawValue - min) / step) * step, min, max)
            : snapToDecile(rawValue, min, max)

        animateFillTo(percentFromValue(snapped))
        setValue(roundValue(snapped, step))
      }

      if (!shouldReduceMotion && rubberStretch.get() !== 0) {
        animate(rubberStretch, 0, {
          type: "spring",
          visualDuration: 0.35,
          bounce: 0.15,
        })
      }

      setIsInteracting(false)
      setIsDragging(false)
      pointerDownPos.current = null
    },
    [
      isInteracting,
      positionToValue,
      percentFromValue,
      setValue,
      min,
      max,
      step,
      animateFillTo,
      rubberStretch,
      shouldReduceMotion,
    ],
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
      setValue(snapped)
    },
    [value, min, max, step, animateFillTo, percentFromValue, setValue],
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
  const handleOpacity = !isActive
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
    handleTrackFocus,
    handleTrackBlur,
    handleKeyDown,
    setIsHovered,
  }
}
