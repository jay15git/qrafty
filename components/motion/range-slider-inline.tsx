"use client";
// beui.dev/components/motion/range-slider

import {
  animate,
  m,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  type PointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { SPRING_GLIDE } from "@/lib/ease";
import { type SliderOptions, snapSliderValue, useSlider } from "@/lib/hooks/use-slider";
import { capturePointer, releasePointer, TOUCH_GESTURE_CLASS } from "@/lib/touch";
import { cn } from "@/lib/utils";

const STOP_COUNT = 10;
/** Floor between commits while dragging. The pointer still moves the thumb and
 * fill every frame; this only paces the value the parent has to re-render. */
const DRAG_COMMIT_MIN_INTERVAL_MS = 90;
const HANDLE_START = 8;
const HANDLE_END_INSET = 12;
const TEXT_INSET = 12;
// Matches RangeSlider's bouncy grab and release feedback.
const SPRING_BOUNCY = { type: "spring", stiffness: 500, damping: 14, mass: 0.7 } as const;

type Stop = { value: number; x: number };

function mapBetweenStops(
  stops: Stop[],
  point: number,
  from: keyof Stop,
  to: keyof Stop,
) {
  const upperIndex = stops.findIndex((stop) => stop[from] >= point);
  const upper = stops[upperIndex < 0 ? stops.length - 1 : upperIndex];
  const lower = stops[Math.max(0, upperIndex - 1)];
  if (lower[from] === upper[from]) return upper[to];
  return lower[to] +
    ((point - lower[from]) / (upper[from] - lower[from])) * (upper[to] - lower[to]);
}

/** The value the pointer sits on, rounded to the step grid. */
function landedValue(
  stops: Stop[],
  x: number,
  min: number,
  max: number,
  step: number,
) {
  return snapSliderValue(mapBetweenStops(stops, x, "x", "value"), min, max, step);
}

export interface InlineSliderProps extends SliderOptions {
  /** Rounds snap-stop values. While dragging, the readout keeps this step's decimal precision. */
  step?: number;
  /** Compact label inside the left edge of the track. */
  label: string;
  /** Formats the inline value without changing its precision. */
  format?: (value: number) => string;
  /** Show markers for the ten evenly spaced snap stops, except where they overlap inline text. */
  showTicks?: boolean;
  className?: string;
}

/** The sliding fill inside the track's inset clipping window. */
function InlineSliderFill({ fillX }: { fillX: MotionValue<number> }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-[2px] inset-y-0 overflow-hidden rounded-lg"
    >
      <m.div
        className="absolute inset-0 rounded-lg bg-foreground/15"
        style={{ x: fillX }}
      />
    </div>
  );
}

/** The label, readout, and stop markers painted above the fill. */
function InlineSliderOverlay({
  label,
  labelRef,
  readoutRef,
  readout,
  ticks,
}: {
  label: string;
  labelRef: RefObject<HTMLSpanElement | null>;
  readoutRef: RefObject<HTMLSpanElement | null>;
  readout: string;
  ticks: number[];
}) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 text-foreground">
      <span
        ref={labelRef}
        className="absolute left-3 top-1/2 max-w-[40%] -translate-y-1/2 truncate text-sm font-medium leading-5"
      >
        {label}
      </span>
      <span
        ref={readoutRef}
        className="absolute right-3 top-1/2 max-w-[40%] -translate-y-1/2 truncate text-[13px] font-semibold leading-[18px] tracking-tight tabular-nums"
      >
        {readout}
      </span>
      {ticks.map((left) => (
        <span
          key={left}
          className="absolute top-1/2 size-1 -translate-y-1/2 rounded-full bg-foreground/25"
          style={{ left }}
        />
      ))}
    </div>
  );
}

/** The two-dot thumb that parts around the overlay text as it passes. */
function InlineSliderThumb({
  handleX,
  stemOpacity,
  capTop,
  capBottom,
  dragging,
  reduce,
}: {
  handleX: MotionValue<number>;
  stemOpacity: MotionValue<number>;
  capTop: MotionValue<number>;
  capBottom: MotionValue<number>;
  dragging: boolean;
  reduce: boolean | null;
}) {
  return (
    <m.div
      aria-hidden="true"
      animate={reduce ? undefined : { scaleY: dragging ? 1.35 : 1 }}
      transition={SPRING_BOUNCY}
      className="pointer-events-none absolute left-0 top-1/2 h-[1.125rem] w-1 -translate-y-1/2 text-foreground"
      style={{ x: handleX }}
    >
      <m.span className="absolute top-0 size-1 rounded-full bg-current" style={{ y: reduce ? 0 : capTop }} />
      <m.span className="absolute inset-y-0 w-1 rounded-full bg-current" style={{ opacity: stemOpacity }} />
      <m.span className="absolute bottom-0 size-1 rounded-full bg-current" style={{ y: reduce ? 0 : capBottom }} />
    </m.div>
  );
}

/** An always-visible inline slider with an inset fill and a thumb that parts
 * around its labels, keeping their text readable as the handle passes them. */
export function InlineSlider({
  label,
  format = String,
  showTicks = true,
  className,
  ...options
}: InlineSliderProps) {
  const reduce = useReducedMotion();
  const step = options.step && options.step > 0 ? options.step : 1;
  const precision = step.toFixed(6).replace(/0+$/, "").split(".")[1]?.length ?? 0;
  const { current, min, max, commit, trackProps, sliderProps } = useSlider({
    ...options,
    step: 10 ** -precision,
    "aria-label": options["aria-label"] ?? label,
    formatValueText: options.formatValueText ?? format,
  });
  const labelRef = useRef<HTMLSpanElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const [geometry, setGeometry] = useState({
    width: 292,
    labelWidth: 22,
    readoutWidth: 24,
  });
  const [dragging, setDragging] = useState(false);
  const dragTimer = useRef<number | null>(null);
  const pendingDragValue = useRef<number | null>(null);
  const lastCommittedValue = useRef<number | null>(null);
  const lastCommitAt = useRef(0);
  const gesture = useRef<{
    id: number;
    left: number;
    offset: number;
    x: number;
  } | null>(null);

  useLayoutEffect(() => {
    const track = trackProps.ref.current;
    const labelElement = labelRef.current;
    const readout = readoutRef.current;
    if (!track || !labelElement || !readout) return;
    const measure = () => {
      const width = track.getBoundingClientRect().width;
      if (!width) return;
      const next = {
        width,
        labelWidth: labelElement.getBoundingClientRect().width,
        readoutWidth: readout.getBoundingClientRect().width,
      };
      setGeometry((previous) =>
        previous.width === next.width && previous.labelWidth === next.labelWidth &&
        previous.readoutWidth === next.readoutWidth ? previous : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    observer.observe(labelElement);
    observer.observe(readout);
    return () => observer.disconnect();
  }, [trackProps.ref]);

  // Each stop owns both a value and a physical position. As in RangeSlider,
  // the stops span the entire track at even intervals; text only affects
  // whether a marker is painted, never whether its stop remains interactive.
  const endX = Math.max(HANDLE_START, geometry.width - HANDLE_END_INSET);
  const stops = useMemo(() => {
    const values = [...new Set(Array.from({ length: STOP_COUNT }, (_, index) =>
      snapSliderValue(min + (index / (STOP_COUNT - 1)) * (max - min), min, max, step),
    ))];
    return values.map((value, index) => ({
      value,
      x: values.length === 1
        ? HANDLE_START
        : HANDLE_START + (index / (values.length - 1)) * (endX - HANDLE_START),
    }));
  }, [min, max, step, endX]);
  const restingX = mapBetweenStops(stops, current, "value", "x");
  // One motion value owns the thumb for the entire gesture. Pointer movement
  // writes pixels directly; only release/click/keyboard changes use a spring.
  // Never derive dragging pixels from a rounded value or swap to a lagging spring.
  const handleX = useMotionValue(restingX);
  const restingTarget = useRef(restingX);
  const settleTo = useCallback((x: number) => {
    restingTarget.current = x;
    handleX.jump(handleX.get());
    if (reduce) handleX.jump(x);
    else animate(handleX, x, { type: "spring", ...SPRING_GLIDE });
  }, [handleX, reduce]);
  useLayoutEffect(() => {
    if (gesture.current || restingTarget.current === restingX) return;
    settleTo(restingX);
  }, [restingX, settleTo]);
  useEffect(() => () => {
    handleX.stop();
    if (dragTimer.current !== null) window.clearTimeout(dragTimer.current);
  }, [handleX]);
  // A value arriving from outside the drag invalidates the commit memo, so a
  // later drag back onto that same value is not mistaken for a duplicate.
  useEffect(() => {
    lastCommittedValue.current = null;
  }, [current]);
  const fillRight = useTransform(handleX, (x) =>
    x >= endX ? geometry.width - 2 : x + 8,
  );
  // Slide a fixed-size fill inside the inset clipping window. The labels and
  // dots stay above it, and only transforms animate.
  const fillX = useTransform(fillRight, (right) => right - geometry.width + 2);
  // Part progressively over six pixels at each text edge instead of
  // toggling the stem on/off in a single pointer frame. The thumb uses the
  // same two-dot treatment across both the label and numeric readout.
  const split = useTransform(handleX, (x) => {
    const overlap = (start: number, end: number) => Math.max(0, Math.min(
      1,
      (x + 4 - start) / 6,
      (end - x) / 6,
    ));
    return Math.max(
      overlap(TEXT_INSET, TEXT_INSET + geometry.labelWidth),
      overlap(
        geometry.width - TEXT_INSET - geometry.readoutWidth,
        geometry.width - TEXT_INSET,
      ),
    );
  });
  const stemOpacity = useTransform(split, (amount) => 1 - amount);
  const capTop = useTransform(split, (amount) => -amount);
  const capBottom = useTransform(split, (amount) => amount);
  const labelBounds = { start: TEXT_INSET, end: TEXT_INSET + geometry.labelWidth };
  const readoutBounds = {
    start: geometry.width - TEXT_INSET - geometry.readoutWidth,
    end: geometry.width - TEXT_INSET,
  };
  const overlapsText = (x: number, bounds: { start: number; end: number }) =>
    x + 2 >= bounds.start && x - 2 <= bounds.end;
  const ticks = showTicks
    ? stops
      .map((stop) => stop.x)
      .filter((x) => !overlapsText(x, labelBounds) && !overlapsText(x, readoutBounds))
    : [];

  const flushDragCommit = () => {
    dragTimer.current = null;
    const pending = pendingDragValue.current;
    pendingDragValue.current = null;
    if (pending === null) return;
    lastCommitAt.current = performance.now();
    commit(pending);
  };

  // Committing a value the parent already holds re-renders the whole settings
  // tree (QR re-encode) for no visual change, which is what makes a drag feel
  // choppy. Only forward values that differ from the last commit, and rate
  // limit them: the thumb and fill are motion values driven straight from the
  // pointer, so gating the commit only paces the expensive downstream work.
  const queueDragCommit = (value: number) => {
    const snapped = snapSliderValue(value, min, max, step);
    // `current` is what the parent already holds; the ref covers the frames
    // between a commit and the re-render that reflects it.
    if (snapped === current || snapped === lastCommittedValue.current) return;
    lastCommittedValue.current = snapped;
    pendingDragValue.current = snapped;
    if (dragTimer.current !== null) return;
    const since = performance.now() - lastCommitAt.current;
    dragTimer.current = window.setTimeout(
      flushDragCommit,
      Math.max(0, DRAG_COMMIT_MIN_INTERVAL_MS - since),
    );
  };

  const cancelDragCommit = () => {
    if (dragTimer.current !== null) window.clearTimeout(dragTimer.current);
    dragTimer.current = null;
    pendingDragValue.current = null;
  };

  const endGesture = (event: PointerEvent<HTMLDivElement>) => {
    const active = gesture.current;
    if (!active || active.id !== event.pointerId) return;
    // Clear before releasing capture: its lost-capture event must not commit twice.
    gesture.current = null;
    cancelDragCommit();
    setDragging(false);
    if (!options.disabled && geometry.width > 0) {
      const x = event.type === "pointerup"
        ? event.clientX - active.left - active.offset
        : active.x;
      // Land on the value the pointer is actually over, rounded to the step.
      // Snapping to the nearest of the ten painted stops threw the value back
      // up to half a stop away from where the user let go.
      const landed = landedValue(
        stops,
        Math.min(endX, Math.max(HANDLE_START, x)),
        min,
        max,
        step,
      );
      lastCommittedValue.current = landed;
      commit(landed);
      settleTo(mapBetweenStops(stops, landed, "value", "x"));
    } else {
      settleTo(restingX);
    }
    releasePointer(event.currentTarget, event.pointerId);
  };

  return (
    <div
      {...trackProps}
      onPointerDown={(event) => {
        if (options.disabled || event.button !== 0 || gesture.current) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (!rect.width) return;
        event.preventDefault();
        const pointerX = event.clientX - rect.left;
        const thumbX = handleX.get();
        // Grabbing the thumb preserves the exact grab point. A track click
        // waits for release, so it glides to a dot without an intermediate jump.
        const offset = Math.abs(pointerX - thumbX - 2) <= 12 ? pointerX - thumbX : 2;
        gesture.current = { id: event.pointerId, left: rect.left, offset, x: thumbX };
        setDragging(true);
        handleX.stop();
        cancelDragCommit();
        capturePointer(event.currentTarget, event.pointerId);
        event.currentTarget.querySelector<HTMLButtonElement>("[role=slider]")?.focus({ preventScroll: true });
      }}
      onPointerMove={(event) => {
        const active = gesture.current;
        if (!active || active.id !== event.pointerId || options.disabled) return;
        const x = Math.min(
          endX,
          Math.max(HANDLE_START, event.clientX - active.left - active.offset),
        );
        active.x = x;
        handleX.set(x);
        // Use the same piecewise map as the resting stops, so value and
        // position agree throughout the drag.
        queueDragCommit(mapBetweenStops(stops, x, "x", "value"));
      }}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      onLostPointerCapture={endGesture}
      className={cn(
        "relative h-10 w-full touch-none select-none overflow-hidden rounded-lg bg-muted",
        TOUCH_GESTURE_CLASS,
        options.disabled
          ? "pointer-events-none opacity-50"
          : "cursor-grab active:cursor-grabbing",
        className,
      )}
    >
      <InlineSliderFill fillX={fillX} />
      <InlineSliderOverlay
        label={label}
        labelRef={labelRef}
        readoutRef={readoutRef}
        readout={format(current)}
        ticks={ticks}
      />
      <InlineSliderThumb
        handleX={handleX}
        stemOpacity={stemOpacity}
        capTop={capTop}
        capBottom={capBottom}
        dragging={dragging}
        reduce={reduce}
      />
      <button
        type="button"
        {...sliderProps}
        onKeyDown={(event) => {
          if (options.disabled) return;
          const next = {
            ArrowRight: stops.find((stop) => stop.value > current)?.value ?? max,
            ArrowUp: stops.find((stop) => stop.value > current)?.value ?? max,
            ArrowLeft: stops.findLast((stop) => stop.value < current)?.value ?? min,
            ArrowDown: stops.findLast((stop) => stop.value < current)?.value ?? min,
            Home: min,
            End: max,
            PageUp: max,
            PageDown: min,
          }[event.key];
          if (next !== undefined) {
            event.preventDefault();
            commit(next);
          }
        }}
        className="absolute inset-0 cursor-inherit touch-none rounded-lg border-0 outline-none"
      />
    </div>
  );
}
