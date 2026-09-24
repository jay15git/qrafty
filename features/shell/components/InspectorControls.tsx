"use client";

import {
  useCallback,
  useEffect,
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
} from "react";

import { InspectorPasteButton } from "@/features/shell/components/InspectorPasteButton";
import "./inspector-input-error.css";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import "./inspector-design-system.css";

import {
  INSPECTOR_CAPTION_CLASS,
  INSPECTOR_CONTROL_HEIGHT_CLASS,
  INSPECTOR_INPUT_CLASS,
  INSPECTOR_LABEL_CLASS,
  INSPECTOR_RADIUS_CLASS,
  INSPECTOR_TYPE_VALUE_CLASS,
} from "@/features/shell/components/inspector-tokens";

const INSPECTOR_SECTION_CLASS = "min-w-0 flex flex-col gap-2";
const INSPECTOR_SCRUB_NUMBER_FIELD_CLASS = cn("text-center tabular-nums", INSPECTOR_INPUT_CLASS);
const INSPECTOR_FOCUS_CLASS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]";

type InspectorSectionElement = "section" | "div" | "details";

type InspectorSectionProps = Omit<ComponentProps<"section">, "as"> & {
  as?: InspectorSectionElement;
  dataSlot?: string;
  resize?: boolean;
};

function useTResizeHeight(enabled: boolean) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const element = contentRef.current;

    if (!element) {
      return;
    }

    const update = () => {
      const element = contentRef.current;
      if (!element) {
        return;
      }

      const host = element.parentElement;
      if (!host) {
        setHeight(element.offsetHeight);
        return;
      }

      const { paddingBottom, paddingTop } = getComputedStyle(host);
      const paddingY =
        (Number.parseFloat(paddingTop) || 0) + (Number.parseFloat(paddingBottom) || 0);

      setHeight(element.offsetHeight + paddingY);
    };

    if (typeof ResizeObserver === "undefined") {
      update();
      return;
    }

    const observer = new ResizeObserver(update);
    observer.observe(element);
    update();

    return () => observer.disconnect();
  }, [enabled]);

  return { contentRef, height: enabled ? height : null };
}

export function InspectorSection({
  as = "section",
  children,
  className,
  dataSlot,
  resize = false,
  style,
  ...props
}: InspectorSectionProps) {
  const Component = as as ElementType;
  const { contentRef, height } = useTResizeHeight(resize);
  const resizeStyle: CSSProperties | undefined = resize && height !== null ? { height } : undefined;

  return (
    <Component
      data-slot={dataSlot}
      className={cn(INSPECTOR_SECTION_CLASS, resize && "t-resize overflow-hidden", className)}
      style={{ ...style, ...resizeStyle }}
      {...props}
    >
      {resize ? <div ref={contentRef}>{children}</div> : children}
    </Component>
  );
}

type InspectorLabelProps = ComponentProps<"p">;

export function InspectorLabel({ className, ...props }: InspectorLabelProps) {
  return <p className={cn("mb-1.5", INSPECTOR_LABEL_CLASS, className)} {...props} />;
}

type InspectorTextInputProps = ComponentProps<"input"> & {
  error?: string;
  onPasteValue?: (value: string) => void;
  pasteable?: boolean;
};

function usePasteValidationShake(error?: string) {
  const [pasteEpoch, setPasteEpoch] = useState(0);
  const [armedShakeKey, setArmedShakeKey] = useState<string | null>(null);

  const notifyPaste = useCallback(() => {
    setPasteEpoch((epoch) => epoch + 1);
  }, []);

  const pasteErrorActive = pasteEpoch > 0 && Boolean(error);
  const shakeKey = `${pasteEpoch}:${error ?? ""}`;
  const shaking = pasteErrorActive && armedShakeKey === shakeKey;

  useEffect(() => {
    if (!pasteErrorActive) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      void document.body.offsetHeight;
      setArmedShakeKey(shakeKey);
    });

    return () => cancelAnimationFrame(frame);
  }, [pasteErrorActive, shakeKey]);

  return {
    notifyPaste,
    pasteErrorActive,
    shaking,
  };
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
            INSPECTOR_CAPTION_CLASS,
            pasteErrorActive && "t-error-msg--emphasis",
          )}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function InspectorTextInput({
  className,
  error,
  onPasteValue,
  pasteable = false,
  type = "text",
  ...props
}: InspectorTextInputProps) {
  const hasError = Boolean(error);
  const { notifyPaste, pasteErrorActive, shaking } = usePasteValidationShake(error);

  const input = (
    <input
      className={cn(
        "t-input w-full min-w-0 max-w-full px-3",
        INSPECTOR_CONTROL_HEIGHT_CLASS,
        INSPECTOR_RADIUS_CLASS,
        pasteErrorActive && "is-error",
        shaking && "is-shaking",
        pasteable && "pr-9",
        INSPECTOR_INPUT_CLASS,
        className,
      )}
      type={type}
      {...props}
      aria-invalid={hasError ? true : props["aria-invalid"]}
    />
  );

  if (!pasteable) {
    return wrapInspectorFieldFeedback(input, error, false);
  }

  return wrapInspectorFieldFeedback(
    <div className="relative min-w-0" data-slot="inspector-pasteable-field">
      {input}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        <InspectorPasteButton
          className="pointer-events-auto"
          onPaste={(value) => {
            onPasteValue?.(value);
            requestAnimationFrame(() => {
              notifyPaste();
            });
          }}
        />
      </div>
    </div>,
    error,
    pasteErrorActive,
  );
}

const INSPECTOR_NUMBER_SPINNER_HIDE_CLASS =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

function clampInspectorNumber(value: number, min?: number, max?: number) {
  let bounded = value;

  if (min != null) {
    bounded = Math.max(min, bounded);
  }

  if (max != null) {
    bounded = Math.min(max, bounded);
  }

  return bounded;
}

function quantizeInspectorNumber(value: number, step: number) {
  if (!Number.isFinite(step) || step <= 0) {
    return value;
  }

  const quantized = Math.round(value / step) * step;

  if (Number.isInteger(step)) {
    return quantized;
  }

  const decimals = step.toString().split(".")[1]?.length ?? 0;
  return parseFloat(quantized.toFixed(decimals));
}

type UseInspectorNumberScrubOptions = {
  disabled?: boolean;
  max?: number;
  min?: number;
  onChange: (value: number) => void;
  shiftStep?: number;
  step?: number;
  value: number;
};

export function useInspectorNumberScrub({
  disabled = false,
  max,
  min,
  onChange,
  shiftStep = 10,
  step = 1,
  value,
}: UseInspectorNumberScrubOptions) {
  const [draft, setDraft] = useState(String(value));
  const [editing, setEditing] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const scrubRef = useRef<{
    axisLock: "pending" | "scrub" | "scroll";
    captureTarget: HTMLElement | null;
    pointerId: number;
    scrubbing: boolean;
    source: "input" | "label";
    startValue: number;
    startX: number;
    startY: number;
  } | null>(null);

  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    if (!interacting) {
      setDraft(String(value));
    }
  }

  useEffect(() => {
    const node = surfaceRef.current;

    if (!node || disabled) {
      return;
    }

    const blockWheelWhileIdle = (event: WheelEvent) => {
      if (!editing) {
        event.preventDefault();
      }
    };

    node.addEventListener("wheel", blockWheelWhileIdle, { passive: false });

    return () => {
      node.removeEventListener("wheel", blockWheelWhileIdle);
    };
  }, [disabled, editing]);

  const commit = useCallback(
    (nextValue: number) => {
      const quantized = quantizeInspectorNumber(nextValue, step);
      const bounded = clampInspectorNumber(quantized, min, max);
      onChange(bounded);
      setDraft(String(bounded));
    },
    [max, min, onChange, step],
  );

  const nudge = useCallback(
    (direction: 1 | -1, shift: boolean) => {
      const current = Number(draft);

      if (!Number.isFinite(current)) {
        return;
      }

      const delta = shift ? shiftStep : step;
      commit(current + direction * delta);
    },
    [commit, draft, shiftStep, step],
  );

  const enterEditMode = useCallback(() => {
    if (disabled) {
      return;
    }

    setEditing(true);
    setInteracting(true);

    requestAnimationFrame(() => {
      const input = inputRef.current;

      if (!input) {
        return;
      }

      input.focus({ preventScroll: true });
      input.select();
    });
  }, [disabled]);

  const canScrub = !disabled && !editing;

  const endScrubSession = useCallback(
    (event: PointerEvent<HTMLElement>, allowEditOnClick: boolean) => {
      const state = scrubRef.current;

      if (!state) {
        return;
      }

      const wasScrubbing = state.scrubbing;
      scrubRef.current = null;

      if (state.captureTarget) {
        try {
          state.captureTarget.releasePointerCapture(event.pointerId);
        } catch {
          // Pointer capture may already be released.
        }
      }

      if (wasScrubbing) {
        setInteracting(false);
        setDraft(String(value));
        event.preventDefault();
        return;
      }

      if (allowEditOnClick && state.source === "input") {
        enterEditMode();
      }
    },
    [enterEditMode, value],
  );

  const applyScrubDelta = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const state = scrubRef.current;

      if (!state || state.pointerId !== event.pointerId) {
        return;
      }

      if (state.axisLock === "scroll") {
        return;
      }

      const deltaX = event.clientX - state.startX;
      const deltaY = event.clientY - state.startY;

      if (state.axisLock === "pending") {
        if (Math.hypot(deltaX, deltaY) <= 10) {
          return;
        }

        if (Math.abs(deltaX) >= Math.abs(deltaY)) {
          state.axisLock = "scrub";
          state.captureTarget = event.currentTarget;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
        } else {
          state.axisLock = "scroll";
          scrubRef.current = null;
          return;
        }
      }

      if (!state.scrubbing && Math.abs(deltaX) > 3) {
        state.scrubbing = true;
        setInteracting(true);
        if (!state.captureTarget) {
          state.captureTarget = event.currentTarget;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
        }
      }

      if (state.scrubbing) {
        const delta = event.shiftKey ? shiftStep : step;
        commit(state.startValue + deltaX * delta);
      }
    },
    [commit, shiftStep, step],
  );

  const beginLabelScrub = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!canScrub) {
        return;
      }

      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      const current = Number(draft);

      if (!Number.isFinite(current)) {
        return;
      }

      const touchLike = event.pointerType === "touch" || event.pointerType === "pen";
      scrubRef.current = {
        axisLock: touchLike ? "pending" : "scrub",
        captureTarget: touchLike ? null : event.currentTarget,
        pointerId: event.pointerId,
        scrubbing: false,
        source: "label",
        startValue: current,
        startX: event.clientX,
        startY: event.clientY,
      };
      if (!touchLike) {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    },
    [canScrub, draft],
  );

  const beginInputScrub = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!canScrub) {
        return;
      }

      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      const current = Number(draft);

      if (!Number.isFinite(current)) {
        return;
      }

      const touchLike = event.pointerType === "touch" || event.pointerType === "pen";
      scrubRef.current = {
        axisLock: touchLike ? "pending" : "scrub",
        captureTarget: null,
        pointerId: event.pointerId,
        scrubbing: false,
        source: "input",
        startValue: current,
        startX: event.clientX,
        startY: event.clientY,
      };
      if (!touchLike) {
        event.preventDefault();
      }
    },
    [canScrub, draft],
  );

  const onInputPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      applyScrubDelta(event);
      const state = scrubRef.current;
      if (state?.scrubbing && state.source === "input") {
        event.currentTarget.blur();
      }
    },
    [applyScrubDelta],
  );

  const labelScrubHandlers = {
    onPointerCancel: (event: PointerEvent<HTMLElement>) => {
      endScrubSession(event, false);
    },
    onPointerDown: beginLabelScrub,
    onPointerMove: applyScrubDelta,
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      endScrubSession(event, false);
    },
  };

  const scrubSurfaceHandlers = {
    onPointerCancel: (event: PointerEvent<HTMLElement>) => {
      endScrubSession(event, false);
    },
    onPointerDown: beginInputScrub,
    onPointerMove: onInputPointerMove,
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      endScrubSession(event, true);
    },
  };

  const onDisplayFocus = useCallback(() => {
    enterEditMode();
  }, [enterEditMode]);

  const inputProps = {
    "data-slot": "inspector-scrubbable-number",
    inputMode: "numeric" as const,
    onBlur: () => {
      setInteracting(false);
      setEditing(false);

      const parsed = Number(draft);

      if (Number.isFinite(parsed)) {
        commit(parsed);
        return;
      }

      setDraft(String(value));
    },
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      setDraft(event.currentTarget.value);
    },
    onFocus: () => {
      setInteracting(true);
      setEditing(true);
    },
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.currentTarget.blur();
        return;
      }

      if (event.key === "Escape") {
        setDraft(String(value));
        event.currentTarget.blur();
        return;
      }

      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        nudge(event.key === "ArrowUp" ? 1 : -1, event.shiftKey);
      }
    },
    ref: inputRef,
    type: "text" as const,
    value: draft,
  };

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
  };
}

function splitSignedDisplayValue(value: string) {
  if (value.startsWith("-")) {
    return { body: value.slice(1), sign: "-" };
  }

  return { body: value, sign: "" };
}

function mirrorInputTypography(source: HTMLElement): CSSProperties {
  const computed = getComputedStyle(source);

  return {
    fontFamily: computed.fontFamily,
    fontFeatureSettings: computed.fontFeatureSettings,
    fontSize: computed.fontSize,
    fontStyle: computed.fontStyle,
    fontVariantNumeric: computed.fontVariantNumeric as CSSProperties["fontVariantNumeric"],
    fontWeight: computed.fontWeight,
    letterSpacing: computed.letterSpacing,
    lineHeight: computed.lineHeight,
  };
}

function mirrorDisplayTypography(source: HTMLElement): CSSProperties {
  const computed = getComputedStyle(source);
  const { lineHeight: _lineHeight, ...typography } = mirrorInputTypography(source);

  return {
    ...typography,
    color: computed.color,
    lineHeight: 1,
  };
}

function InspectorDisplayNumber({ style, value }: { style?: CSSProperties; value: string }) {
  const { body, sign } = splitSignedDisplayValue(value);

  return (
    <span className="inline-flex items-center justify-center leading-none" style={style}>
      {sign ? (
        <span aria-hidden="true" className="inline-block" style={style}>
          {sign}
        </span>
      ) : null}
      <span style={style}>{body}</span>
    </span>
  );
}

export function InspectorScrubNumberInput({
  className,
  disabled,
  inputClassName,
  scrub,
  ...props
}: {
  className?: string;
  disabled?: boolean;
  inputClassName?: string;
  scrub: ReturnType<typeof useInspectorNumberScrub>;
} & Omit<ComponentProps<"input">, "onChange" | "type" | "value">) {
  const fieldClass = cn(inputClassName, INSPECTOR_SCRUB_NUMBER_FIELD_CLASS);
  const ariaLabel = props["aria-label"];
  const mirrorRef = useRef<HTMLInputElement>(null);
  const [mirroredTypography, setMirroredTypography] = useState<CSSProperties>({});
  const {
    canScrub,
    displayValue,
    editing,
    inputProps,
    inputRef,
    onDisplayFocus,
    scrubSurfaceHandlers,
    surfaceRef,
  } = scrub;

  const syncMirroredTypography = useCallback(() => {
    const source = editing ? inputRef.current : mirrorRef.current;

    if (!source) {
      return;
    }

    setMirroredTypography(mirrorDisplayTypography(source));
  }, [editing, inputRef]);

  useLayoutEffect(() => {
    syncMirroredTypography();

    const source = editing ? inputRef.current : mirrorRef.current;

    if (!source || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(syncMirroredTypography);
    observer.observe(source);

    return () => {
      observer.disconnect();
    };
  }, [displayValue, editing, inputRef, syncMirroredTypography]);

  return (
    <div ref={surfaceRef} className={cn("relative shrink-0", className)}>
      <input
        ref={mirrorRef}
        aria-hidden
        className={fieldClass}
        readOnly
        tabIndex={-1}
        value={displayValue}
        style={{
          inset: 0,
          opacity: 0,
          pointerEvents: "none",
          position: "absolute",
          zIndex: 0,
        }}
      />
      {editing ? (
        <input
          {...props}
          {...inputProps}
          className={cn(fieldClass, "relative z-[1]")}
          disabled={disabled}
        />
      ) : (
        <div
          {...scrubSurfaceHandlers}
          aria-label={typeof ariaLabel === "string" ? ariaLabel : undefined}
          className={cn(
            fieldClass,
            "relative z-[1] flex items-center justify-center touch-pan-y",
            canScrub && "cursor-ew-resize select-none",
            disabled && "cursor-not-allowed opacity-50",
          )}
          data-slot="inspector-scrubbable-number"
          role="button"
          tabIndex={disabled ? -1 : 0}
          onFocus={onDisplayFocus}
          onKeyDown={(event) => {
            if (disabled) {
              return;
            }

            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onDisplayFocus();
            }
          }}
        >
          <div
            className="pointer-events-none flex w-full items-center justify-center"
            data-slot="inspector-number-value"
            style={mirroredTypography}
          >
            <InspectorDisplayNumber style={mirroredTypography} value={displayValue} />
          </div>
        </div>
      )}
    </div>
  );
}

type InspectorScrubbableNumberInputProps = Omit<
  ComponentProps<"input">,
  "onChange" | "type" | "value"
> & {
  onValueChange: (value: number) => void;
  shiftStep?: number;
  value: number;
};

export function InspectorScrubbableNumberInput({
  className,
  disabled,
  max,
  min,
  onValueChange,
  shiftStep,
  step,
  value,
  ...props
}: InspectorScrubbableNumberInputProps) {
  const scrub = useInspectorNumberScrub({
    disabled,
    max: typeof max === "number" ? max : undefined,
    min: typeof min === "number" ? min : undefined,
    onChange: onValueChange,
    shiftStep,
    step: typeof step === "number" ? step : undefined,
    value,
  });

  return (
    <div className="min-w-0">
      <InspectorScrubNumberInput
        {...props}
        className={cn(INSPECTOR_CONTROL_HEIGHT_CLASS, "w-full", className)}
        disabled={disabled}
        inputClassName={cn(
          INSPECTOR_CONTROL_HEIGHT_CLASS,
          "w-full px-3",
          INSPECTOR_RADIUS_CLASS,
          INSPECTOR_NUMBER_SPINNER_HIDE_CLASS,
        )}
        scrub={scrub}
        step={step}
      />
    </div>
  );
}

type InspectorTextareaProps = ComponentProps<"textarea"> & {
  error?: string;
  onPasteValue?: (value: string) => void;
  pasteable?: boolean;
};

export function InspectorTextarea({
  className,
  error,
  onPasteValue,
  pasteable = false,
  ...props
}: InspectorTextareaProps) {
  const hasError = Boolean(error);
  const { notifyPaste, pasteErrorActive, shaking } = usePasteValidationShake(error);

  const textarea = (
    <textarea
      className={cn(
        "t-input min-h-24 w-full min-w-0 max-w-full resize-none px-3 py-2.5",
        INSPECTOR_RADIUS_CLASS,
        pasteErrorActive && "is-error",
        shaking && "is-shaking",
        pasteable && "pr-9",
        INSPECTOR_INPUT_CLASS,
        className,
      )}
      {...props}
      aria-invalid={hasError ? true : props["aria-invalid"]}
    />
  );

  if (!pasteable) {
    return wrapInspectorFieldFeedback(textarea, error, false);
  }

  return wrapInspectorFieldFeedback(
    <div className="relative min-w-0" data-slot="inspector-pasteable-field">
      {textarea}
      <div className="pointer-events-none absolute right-0 top-2.5 flex pr-2">
        <InspectorPasteButton
          className="pointer-events-auto"
          onPaste={(value) => {
            onPasteValue?.(value);
            requestAnimationFrame(() => {
              notifyPaste();
            });
          }}
        />
      </div>
    </div>,
    error,
    pasteErrorActive,
  );
}
