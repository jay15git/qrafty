"use client"

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type CSSProperties,
  type ElementType,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react"
import { ChevronDownIcon, SearchIcon } from "lucide-react"
import { Calligraph } from "calligraph"
import { AnimatePresence, m, useReducedMotion, type Transition } from "motion/react"

import { DesktopInspectorPasteButton } from "@/features/desktop-shell/components/DesktopInspectorPasteButton"
import "./desktop-inspector-input-error.css"

import { TabsSubtle, TabsSubtleItem } from "@/components/ui/tabs-subtle"
import { useDesktopSettingsPanelMotionFrozen } from "@/features/desktop-shell/components/desktop-settings-panel-motion-frozen-context"
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
} from "@/components/ui/file-upload"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dropdown } from "@/components/ui/dropdown"
import { MenuItem } from "@/components/ui/menu-item"
import { cn } from "@/lib/utils"
import { SurfaceProvider } from "@/lib/surface-context"

import "./desktop-inspector-design-system.css"
import "./desktop-inspector-morph-filter.css"
import "./desktop-inspector-motion.css"

import {
  DESKTOP_INSPECTOR_CAPTION_CLASS,
  DESKTOP_INSPECTOR_CONTROL_CLASS,
  DESKTOP_INSPECTOR_CONTROL_HEIGHT_CLASS,
  DESKTOP_INSPECTOR_CONTROL_HEIGHT_COMPACT_CLASS,
  DESKTOP_INSPECTOR_FG_MUTED,
  DESKTOP_INSPECTOR_INPUT_CLASS,
  DESKTOP_INSPECTOR_LABEL_CLASS,
  DESKTOP_INSPECTOR_RADIUS_CLASS,
  DESKTOP_INSPECTOR_RESET_CLASS,
  DESKTOP_INSPECTOR_ROW_CLASS,
  DESKTOP_INSPECTOR_ROW_GAP_CLASS,
  DESKTOP_INSPECTOR_SECTION_GAP_CLASS,
  DESKTOP_INSPECTOR_SELECTED_CLASS,
  DESKTOP_INSPECTOR_TYPE_CAPTION_CLASS,
  DESKTOP_INSPECTOR_TYPE_LABEL_CLASS,
  DESKTOP_INSPECTOR_TYPE_VALUE_CLASS,
  DESKTOP_INSPECTOR_VALUE_CLASS,
} from "@/features/desktop-shell/components/desktop-inspector-tokens"

const DESKTOP_INSPECTOR_IMAGE_UPLOAD_MAX_SIZE = 5 * 1024 * 1024

const DESKTOP_INSPECTOR_SECTION_CLASS = "min-w-0 flex flex-col gap-2"
const DESKTOP_INSPECTOR_SCRUB_NUMBER_FIELD_CLASS = cn(
  "text-center tabular-nums",
  DESKTOP_INSPECTOR_INPUT_CLASS,
)
const DESKTOP_INSPECTOR_FOCUS_CLASS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--desktop-inspector-focus)]"
const DESKTOP_INSPECTOR_DROPDOWN_MENU_CLASS =
  "desktop-inspector-dropdown-menu z-50 min-w-0 rounded-[14px] border-0 bg-[var(--desktop-inspector-elevated)] p-1 text-[var(--desktop-inspector-fg-secondary)] shadow-[var(--desktop-inspector-popover-shadow)] ring-0 backdrop-blur-xl"
const DESKTOP_INSPECTOR_DROPDOWN_TRIGGER_CLASS = cn(
  "desktop-inspector-input-bg cursor-pointer bg-[var(--desktop-inspector-field-bg)] font-medium text-[var(--desktop-inspector-fg-tertiary)] outline-none transition hover:bg-[var(--desktop-inspector-control-hover-bg)] hover:text-[var(--desktop-inspector-fg-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--desktop-inspector-focus)] data-[state=open]:bg-[var(--desktop-inspector-control-hover-bg)] data-[state=open]:text-[var(--desktop-inspector-fg-primary)]",
  DESKTOP_INSPECTOR_TYPE_VALUE_CLASS,
)


type DesktopInspectorSectionElement = "section" | "div" | "details"

type DesktopInspectorSectionProps = Omit<ComponentProps<"section">, "as"> & {
  as?: DesktopInspectorSectionElement
  dataSlot?: string
  resize?: boolean
}

function useTResizeHeight(enabled: boolean) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | null>(null)

  useEffect(() => {
    if (!enabled) {
      setHeight(null)
      return
    }

    const element = contentRef.current

    if (!element) {
      return
    }

    const update = () => {
      const element = contentRef.current
      if (!element) {
        return
      }

      const host = element.parentElement
      if (!host) {
        setHeight(element.offsetHeight)
        return
      }

      const { paddingBottom, paddingTop } = getComputedStyle(host)
      const paddingY =
        (Number.parseFloat(paddingTop) || 0) + (Number.parseFloat(paddingBottom) || 0)

      setHeight(element.offsetHeight + paddingY)
    }

    if (typeof ResizeObserver === "undefined") {
      update()
      return
    }

    const observer = new ResizeObserver(update)
    observer.observe(element)
    update()

    return () => observer.disconnect()
  }, [enabled])

  return { contentRef, height }
}

export function DesktopInspectorSection({
  as = "section",
  children,
  className,
  dataSlot,
  resize = false,
  style,
  ...props
}: DesktopInspectorSectionProps) {
  const Component = as as ElementType
  const { contentRef, height } = useTResizeHeight(resize)
  const resizeStyle: CSSProperties | undefined =
    resize && height !== null ? { height } : undefined

  return (
    <Component
      data-slot={dataSlot}
      className={cn(
        DESKTOP_INSPECTOR_SECTION_CLASS,
        resize && "t-resize overflow-hidden",
        className,
      )}
      style={{ ...style, ...resizeStyle }}
      {...props}
    >
      {resize ? <div ref={contentRef}>{children}</div> : children}
    </Component>
  )
}

type DesktopInspectorLabelProps = ComponentProps<"p">

export function DesktopInspectorLabel({
  className,
  ...props
}: DesktopInspectorLabelProps) {
  return (
    <p
      className={cn("mb-1.5", DESKTOP_INSPECTOR_LABEL_CLASS, className)}
      {...props}
    />
  )
}

type DesktopInspectorTextInputProps = ComponentProps<"input"> & {
  error?: string
  onPasteValue?: (value: string) => void
  pasteable?: boolean
}

function usePasteValidationShake(error?: string) {
  const [pasteEpoch, setPasteEpoch] = useState(0)
  const [pasteErrorActive, setPasteErrorActive] = useState(false)
  const [shaking, setShaking] = useState(false)

  const notifyPaste = useCallback(() => {
    setPasteEpoch((epoch) => epoch + 1)
  }, [])

  useEffect(() => {
    if (pasteEpoch === 0) {
      return
    }

    if (!error) {
      setPasteErrorActive(false)
      setShaking(false)
      return
    }

    setPasteErrorActive(true)
    setShaking(false)
    const frame = requestAnimationFrame(() => {
      void document.body.offsetHeight
      setShaking(true)
    })

    return () => cancelAnimationFrame(frame)
  }, [error, pasteEpoch])

  return {
    notifyPaste,
    pasteErrorActive,
    shaking,
  }
}

function wrapInspectorFieldFeedback(
  content: ReactNode,
  error: string | undefined,
  pasteErrorActive: boolean,
) {
  // Always keep the wrap mounted so error text can appear/disappear as a
  // sibling without remounting the input (which would steal focus).
  return (
    <div className={cn("t-input-wrap min-w-0", Boolean(error) && pasteErrorActive && "is-error")}>
      {content}
      {error ? (
        <p
          className={cn(
            "t-error-msg t-error-msg--visible",
            DESKTOP_INSPECTOR_CAPTION_CLASS,
            pasteErrorActive && "t-error-msg--emphasis",
          )}
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function DesktopInspectorTextInput({
  className,
  error,
  onPasteValue,
  pasteable = false,
  type = "text",
  ...props
}: DesktopInspectorTextInputProps) {
  const hasError = Boolean(error)
  const { notifyPaste, pasteErrorActive, shaking } = usePasteValidationShake(error)

  const input = (
    <input
      className={cn(
        "t-input w-full min-w-0 max-w-full px-3",
        DESKTOP_INSPECTOR_CONTROL_HEIGHT_CLASS,
        DESKTOP_INSPECTOR_RADIUS_CLASS,
        pasteErrorActive && "is-error",
        shaking && "is-shaking",
        pasteable && "pr-9",
        DESKTOP_INSPECTOR_INPUT_CLASS,
        className,
      )}
      type={type}
      {...props}
      aria-invalid={hasError ? true : props["aria-invalid"]}
    />
  )

  if (!pasteable) {
    return wrapInspectorFieldFeedback(input, error, false)
  }

  return wrapInspectorFieldFeedback(
    <div className="relative min-w-0" data-slot="desktop-inspector-pasteable-field">
      {input}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        <DesktopInspectorPasteButton
          className="pointer-events-auto"
          onPaste={(value) => {
            onPasteValue?.(value)
            requestAnimationFrame(() => {
              notifyPaste()
            })
          }}
        />
      </div>
    </div>,
    error,
    pasteErrorActive,
  )
}

const DESKTOP_INSPECTOR_NUMBER_SPINNER_HIDE_CLASS =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"

function clampDesktopInspectorNumber(value: number, min?: number, max?: number) {
  let bounded = value

  if (min != null) {
    bounded = Math.max(min, bounded)
  }

  if (max != null) {
    bounded = Math.min(max, bounded)
  }

  return bounded
}

function quantizeDesktopInspectorNumber(value: number, step: number) {
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

type UseDesktopInspectorNumberScrubOptions = {
  disabled?: boolean
  max?: number
  min?: number
  onChange: (value: number) => void
  shiftStep?: number
  step?: number
  value: number
}

export function useDesktopInspectorNumberScrub({
  disabled = false,
  max,
  min,
  onChange,
  shiftStep = 10,
  step = 1,
  value,
}: UseDesktopInspectorNumberScrubOptions) {
  const [draft, setDraft] = useState(String(value))
  const [editing, setEditing] = useState(false)
  const interactingRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const scrubRef = useRef<{
    axisLock: "pending" | "scrub" | "scroll"
    captureTarget: HTMLElement | null
    pointerId: number
    scrubbing: boolean
    source: "input" | "label"
    startValue: number
    startX: number
    startY: number
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
      const quantized = quantizeDesktopInspectorNumber(nextValue, step)
      const bounded = clampDesktopInspectorNumber(quantized, min, max)
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

      if (!state || state.pointerId !== event.pointerId) {
        return
      }

      if (state.axisLock === "scroll") {
        return
      }

      const deltaX = event.clientX - state.startX
      const deltaY = event.clientY - state.startY

      if (state.axisLock === "pending") {
        if (Math.hypot(deltaX, deltaY) <= 10) {
          return
        }

        if (Math.abs(deltaX) >= Math.abs(deltaY)) {
          state.axisLock = "scrub"
          state.captureTarget = event.currentTarget
          event.preventDefault()
          event.currentTarget.setPointerCapture(event.pointerId)
        } else {
          state.axisLock = "scroll"
          scrubRef.current = null
          return
        }
      }

      if (!state.scrubbing && Math.abs(deltaX) > 3) {
        state.scrubbing = true
        interactingRef.current = true
        if (!state.captureTarget) {
          state.captureTarget = event.currentTarget
          event.preventDefault()
          event.currentTarget.setPointerCapture(event.pointerId)
        }
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

      const touchLike = event.pointerType === "touch" || event.pointerType === "pen"
      scrubRef.current = {
        axisLock: touchLike ? "pending" : "scrub",
        captureTarget: touchLike ? null : event.currentTarget,
        pointerId: event.pointerId,
        scrubbing: false,
        source: "label",
        startValue: current,
        startX: event.clientX,
        startY: event.clientY,
      }
      if (!touchLike) {
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
      }
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

      const touchLike = event.pointerType === "touch" || event.pointerType === "pen"
      scrubRef.current = {
        axisLock: touchLike ? "pending" : "scrub",
        captureTarget: null,
        pointerId: event.pointerId,
        scrubbing: false,
        source: "input",
        startValue: current,
        startX: event.clientX,
        startY: event.clientY,
      }
      if (!touchLike) {
        event.preventDefault()
      }
    },
    [canScrub, draft],
  )

  const onInputPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      applyScrubDelta(event)
      const state = scrubRef.current
      if (state?.scrubbing && state.source === "input") {
        event.currentTarget.blur()
      }
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
    "data-slot": "desktop-inspector-scrubbable-number",
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

function DesktopInspectorCalligraphNumber({
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
        className="desktop-inspector-calligraph inline-flex items-center justify-center leading-none"
        style={style}
        variant="slots"
      >
        {body}
      </Calligraph>
    </span>
  )
}

export function DesktopInspectorScrubNumberInput({
  className,
  disabled,
  inputClassName,
  scrub,
  ...props
}: {
  className?: string
  disabled?: boolean
  inputClassName?: string
  scrub: ReturnType<typeof useDesktopInspectorNumberScrub>
} & Omit<ComponentProps<"input">, "onChange" | "type" | "value">) {
  const fieldClass = cn(inputClassName, DESKTOP_INSPECTOR_SCRUB_NUMBER_FIELD_CLASS)
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
    // eslint-disable-next-line react-doctor/exhaustive-deps -- scrub.inputRef is a stable ref object
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
            "relative z-[1] flex items-center justify-center touch-pan-y",
            scrub.canScrub && "cursor-ew-resize select-none",
            disabled && "cursor-not-allowed opacity-50",
          )}
          data-slot="desktop-inspector-scrubbable-number"
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
            data-slot="desktop-inspector-calligraph-value"
            style={mirroredTypography}
          >
            <DesktopInspectorCalligraphNumber
              style={mirroredTypography}
              value={scrub.displayValue}
            />
          </div>
        </div>
      )}
    </div>
  )
}

type DesktopInspectorScrubbableNumberInputProps = Omit<
  ComponentProps<"input">,
  "onChange" | "type" | "value"
> & {
  onValueChange: (value: number) => void
  shiftStep?: number
  value: number
}

export function DesktopInspectorScrubbableNumberInput({
  className,
  disabled,
  max,
  min,
  onValueChange,
  shiftStep,
  step,
  value,
  ...props
}: DesktopInspectorScrubbableNumberInputProps) {
  const scrub = useDesktopInspectorNumberScrub({
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
      <DesktopInspectorScrubNumberInput
        {...props}
        className={cn(DESKTOP_INSPECTOR_CONTROL_HEIGHT_CLASS, "w-full", className)}
        disabled={disabled}
        inputClassName={cn(
          DESKTOP_INSPECTOR_CONTROL_HEIGHT_CLASS,
          "w-full px-3",
          DESKTOP_INSPECTOR_RADIUS_CLASS,
          DESKTOP_INSPECTOR_NUMBER_SPINNER_HIDE_CLASS,
        )}
        scrub={scrub}
        step={step}
      />
    </div>
  )
}

type DesktopInspectorTextareaProps = ComponentProps<"textarea"> & {
  error?: string
  onPasteValue?: (value: string) => void
  pasteable?: boolean
}

export function DesktopInspectorTextarea({
  className,
  error,
  onPasteValue,
  pasteable = false,
  ...props
}: DesktopInspectorTextareaProps) {
  const hasError = Boolean(error)
  const { notifyPaste, pasteErrorActive, shaking } = usePasteValidationShake(error)

  const textarea = (
    <textarea
      className={cn(
        "t-input min-h-24 w-full min-w-0 max-w-full resize-none px-3 py-2.5",
        DESKTOP_INSPECTOR_RADIUS_CLASS,
        pasteErrorActive && "is-error",
        shaking && "is-shaking",
        pasteable && "pr-9",
        DESKTOP_INSPECTOR_INPUT_CLASS,
        className,
      )}
      {...props}
      aria-invalid={hasError ? true : props["aria-invalid"]}
    />
  )

  if (!pasteable) {
    return wrapInspectorFieldFeedback(textarea, error, false)
  }

  return wrapInspectorFieldFeedback(
    <div className="relative min-w-0" data-slot="desktop-inspector-pasteable-field">
      {textarea}
      <div className="pointer-events-none absolute right-0 top-2.5 flex pr-2">
        <DesktopInspectorPasteButton
          className="pointer-events-auto"
          onPaste={(value) => {
            onPasteValue?.(value)
            requestAnimationFrame(() => {
              notifyPaste()
            })
          }}
        />
      </div>
    </div>,
    error,
    pasteErrorActive,
  )
}

type DesktopInspectorNativeSelectProps<TValue extends string> =
  Omit<ComponentProps<"select">, "onChange" | "value"> & {
    iconClassName?: string
    options: Array<{ label: string; value: TValue }>
    onValueChange: (value: TValue) => void
    rootClassName?: string
    showIcon?: boolean
    value: TValue
  }

export function DesktopInspectorNativeSelect<TValue extends string>({
  className,
  iconClassName,
  onValueChange,
  options,
  rootClassName,
  showIcon = true,
  value,
  ...props
}: DesktopInspectorNativeSelectProps<TValue>) {
  return (
    <div className={cn("relative min-w-0", rootClassName)}>
      <select
        className={cn(
          DESKTOP_INSPECTOR_CONTROL_HEIGHT_COMPACT_CLASS,
          "w-full cursor-pointer appearance-none px-2.5 pr-7 font-medium transition",
          DESKTOP_INSPECTOR_RADIUS_CLASS,
          DESKTOP_INSPECTOR_INPUT_CLASS,
          className,
        )}
        value={value}
        onChange={(event) => onValueChange(event.currentTarget.value as TValue)}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {showIcon ? (
        <ChevronDownIcon
          className={cn(
            "pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2",
            DESKTOP_INSPECTOR_FG_MUTED,
            iconClassName,
          )}
        />
      ) : null}
    </div>
  )
}

type DesktopInspectorSegmentedControlProps<TValue extends string> = {
  ariaLabelPrefix?: string
  className?: string
  columns?: 2 | 3 | 4
  dataSlot?: string
  itemClassName?: string
  items: Array<{ icon?: ReactNode; label: string; value: TValue }>
  itemAriaLabel?: (item: { icon?: ReactNode; label: string; value: TValue }) => string
  onValueChange: (value: TValue) => void
  selectedClassName?: string
  value: TValue
}

const DESKTOP_INSPECTOR_TAB_ITEM_CLASS = cn(
  DESKTOP_INSPECTOR_CONTROL_HEIGHT_COMPACT_CLASS,
  "min-w-0 flex-1 justify-center px-2 py-0 [&_span]:font-medium [&_span]:text-[var(--desktop-inspector-fg-tertiary)]",
  "[&_span]:text-[length:var(--desktop-inspector-type-label)]",
  "[&[aria-selected=true]_span]:text-[length:var(--desktop-inspector-type-value)] [&[aria-selected=true]_span]:text-[var(--desktop-inspector-fg-primary)]",
)

export function DesktopInspectorSegmentedControl<TValue extends string>({
  ariaLabelPrefix,
  className,
  columns = 2,
  dataSlot,
  itemClassName,
  itemAriaLabel,
  items,
  onValueChange,
  selectedClassName: _selectedClassName = DESKTOP_INSPECTOR_SELECTED_CLASS,
  value,
}: DesktopInspectorSegmentedControlProps<TValue>) {
  const generatedId = useId()
  const idPrefix = (dataSlot ?? generatedId).replace(/:/g, "")
  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.value === value),
  )
  const compactItemClass =
    columns === 4 ? "px-1 [&_span]:text-[length:var(--desktop-inspector-type-caption)]" : columns === 3 ? "px-1.5 [&_span]:text-[length:var(--desktop-inspector-type-caption)]" : undefined
  const pauseSelectionMotion = useDesktopSettingsPanelMotionFrozen()

  return (
    <TabsSubtle
      className={cn("w-full gap-0 py-0 my-0", className)}
      data-slot={dataSlot ?? "desktop-inspector-segmented-control"}
      idPrefix={idPrefix}
      pauseSelectionMotion={pauseSelectionMotion}
      selectedIndex={selectedIndex}
      onSelect={(index) => {
        const next = items[index]
        if (next) onValueChange(next.value)
      }}
    >
      {items.map((item, index) => (
        <TabsSubtleItem
          key={item.value}
          aria-label={
            itemAriaLabel?.(item) ??
            (ariaLabelPrefix ? `${ariaLabelPrefix} ${item.label}` : undefined)
          }
          className={cn(DESKTOP_INSPECTOR_TAB_ITEM_CLASS, compactItemClass, itemClassName)}
          index={index}
          label={item.label}
        />
      ))}
    </TabsSubtle>
  )
}

type DesktopInspectorSearchInputProps =
  Omit<ComponentProps<"input">, "onChange"> & {
    iconClassName?: string
    inputClassName?: string
    onValueChange: (value: string) => void
  }

export function DesktopInspectorSearchInput({
  className,
  iconClassName,
  inputClassName,
  onValueChange,
  type = "text",
  ...props
}: DesktopInspectorSearchInputProps) {
  return (
    <div className={cn("relative w-24 shrink-0", DESKTOP_INSPECTOR_CONTROL_HEIGHT_COMPACT_CLASS, className)}>
      <SearchIcon
        className={cn(
          "pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2",
          DESKTOP_INSPECTOR_FG_MUTED,
          iconClassName,
        )}
      />
      <Input
        className={cn(
          "h-full w-full border-transparent pl-7 pr-2",
          DESKTOP_INSPECTOR_RADIUS_CLASS,
          DESKTOP_INSPECTOR_INPUT_CLASS,
          inputClassName,
          "focus-visible:ring-0 focus-visible:shadow-none",
        )}
        type={type}
        onChange={(event) => onValueChange(event.currentTarget.value)}
        {...props}
      />
    </div>
  )
}

export function DesktopInspectorMorphFilterMenu<T extends string>({
  ariaLabel,
  className,
  "data-slot": dataSlot = "desktop-inspector-morph-filter-menu",
  icon,
  isActive = false,
  menuDataSlot = "desktop-inspector-filter-menu",
  morphClassName,
  morphStyle,
  options,
  triggerDataSlot = "desktop-inspector-filter-trigger",
  value,
  onValueChange,
}: {
  ariaLabel: string
  className?: string
  "data-slot"?: string
  icon: ReactNode
  isActive?: boolean
  menuDataSlot?: string
  morphClassName?: string
  morphStyle?: CSSProperties
  options: ReadonlyArray<{ label: string; value: T }>
  triggerDataSlot?: string
  value: T
  onValueChange: (value: T) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const checkedIndex = options.findIndex((option) => option.value === value)

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  return (
    <div className={cn("relative size-8 shrink-0 overflow-visible", className)} ref={rootRef}>
      <div
        className={cn(
          "desktop-inspector-morph-filter border-0 bg-[var(--desktop-inspector-field-bg)] text-[var(--desktop-inspector-fg-secondary)] shadow-[var(--desktop-inspector-popover-shadow)]",
          morphClassName,
          isActive &&
            !open &&
            "bg-[var(--desktop-inspector-control-hover-bg)] text-[var(--desktop-inspector-fg-primary)]",
        )}
        data-open={open ? "true" : "false"}
        data-slot={dataSlot}
        style={morphStyle}
      >
        <div className="t-morph-menu p-1" data-slot={menuDataSlot}>
          <SurfaceProvider value={2}>
            <ScrollArea
              chevron
              cueSize="tight"
              data-slot={`${dataSlot}-scroll-area`}
              scrollFade
              className="min-h-0 flex-1 overflow-hidden"
              viewportClassName="pr-0.5"
            >
              <Dropdown
                aria-label={ariaLabel}
                checkedIndex={checkedIndex >= 0 ? checkedIndex : undefined}
                flat
                shapeVariant="pill"
                className="w-full gap-0 p-0"
              >
                {options.map((option, index) => (
                  <MenuItem
                    key={option.value}
                    checked={option.value === value}
                    className={cn(
                      DESKTOP_INSPECTOR_CONTROL_HEIGHT_COMPACT_CLASS,
                      "w-full min-w-0 px-3 py-0",
                      DESKTOP_INSPECTOR_TYPE_VALUE_CLASS,
                    )}
                    index={index}
                    label={option.label}
                    onSelect={() => {
                      onValueChange(option.value)
                      setOpen(false)
                    }}
                  />
                ))}
              </Dropdown>
            </ScrollArea>
          </SurfaceProvider>
        </div>
        <button
          aria-expanded={open}
          aria-label={ariaLabel}
          className={cn(
            "t-morph-plus outline-none focus-visible:ring-2 focus-visible:ring-[var(--desktop-inspector-focus)]",
            isActive && "text-[var(--desktop-inspector-fg-primary)]",
          )}
          data-slot={triggerDataSlot}
          type="button"
          onClick={() => setOpen((current) => !current)}
        >
          {icon}
        </button>
      </div>
    </div>
  )
}

export function DesktopInspectorImageFileUpload({
  className,
  "data-slot": dataSlot = "desktop-inspector-image-file-upload",
  label = "Image file upload",
  onFileAccept,
}: {
  className?: string
  "data-slot"?: string
  label?: string
  onFileAccept: (file: File) => void
}) {
  return (
    <FileUpload
      accept="image/*"
      className={cn("gap-2", className)}
      data-slot={dataSlot}
      label={label}
      maxFiles={1}
      maxSize={DESKTOP_INSPECTOR_IMAGE_UPLOAD_MAX_SIZE}
      onFileAccept={onFileAccept}
    >
      <FileUploadDropzone
        className={cn(
          "rounded-[8px] border border-dashed border-white/[0.12] bg-[var(--desktop-inspector-field-bg)] p-4 text-center shadow-none outline-none transition-colors",
          "hover:bg-[var(--desktop-inspector-control-hover-bg)]",
          "data-[dragging]:border-[var(--desktop-inspector-focus)] data-[dragging]:bg-[var(--desktop-inspector-control-hover-bg)]",
          "data-[invalid]:border-red-400/70",
        )}
      >
        <p className={DESKTOP_INSPECTOR_VALUE_CLASS}>
          Drag & drop image here
        </p>
        <p className={cn("mt-1", DESKTOP_INSPECTOR_CAPTION_CLASS)}>
          Or click to browse (max 5MB)
        </p>
        <FileUploadTrigger
          className={cn(
            DESKTOP_INSPECTOR_CONTROL_HEIGHT_COMPACT_CLASS,
            "mt-3 inline-flex cursor-pointer items-center justify-center px-3",
            DESKTOP_INSPECTOR_RADIUS_CLASS,
            DESKTOP_INSPECTOR_TYPE_LABEL_CLASS,
            DESKTOP_INSPECTOR_CONTROL_CLASS,
          )}
          type="button"
        >
          Browse files
        </FileUploadTrigger>
      </FileUploadDropzone>
    </FileUpload>
  )
}
