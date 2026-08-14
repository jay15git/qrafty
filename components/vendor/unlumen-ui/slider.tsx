"use client";

import {
  forwardRef,
  useRef,
  useState,
  useEffect,
  useCallback,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
  type MotionValue,
} from "motion/react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

const springs = {
  fast: { type: "spring" as const, duration: 0.08, bounce: 0 },
  moderate: { type: "spring" as const, duration: 0.16, bounce: 0.15 },
} as const;

const fontWeights = {
  normal: "'wght' 400",
  medium: "'wght' 450",
} as const;

type SliderValue = number | [number, number];
type ValuePosition = "left" | "right" | "top" | "bottom" | "tooltip";
type SliderAppearance = "default" | "drafting";

interface SliderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  value: SliderValue;
  onChange: (value: SliderValue) => void;
  min?: number;
  max?: number;
  step?: number;
  showSteps?: boolean;
  showValue?: boolean;
  valuePosition?: ValuePosition;
  appearance?: SliderAppearance;
  formatValue?: (v: number) => string;
  label?: string;
  disabled?: boolean;
  trackClassName?: string;
  trackStyle?: CSSProperties;
  trackDataSlot?: string;
  rangeClassName?: string;
  rangeStyle?: CSSProperties;
  thumbDataSlot?: string;
  renderThumb?: (
    index: number,
    state: { isActive: boolean; isHovered: boolean; isPressed: boolean },
  ) => ReactNode;
}

const THUMB_SIZE = 18;
const TRACK_HEIGHT = 10;
const ACTIVE_TRACK_HEIGHT = 12;
const DOT_SIZE = 4;
const NEUTRAL_TRACK_COLOR =
  "color-mix(in srgb, var(--foreground) 12%, var(--background))";
const NEUTRAL_DOT_COLOR =
  "color-mix(in srgb, var(--foreground) 28%, var(--background))";

function valueToPixel(
  v: number,
  min: number,
  max: number,
  trackWidth: number,
): number {
  if (max === min) return 0;
  return ((v - min) / (max - min)) * (trackWidth - THUMB_SIZE);
}

function pixelToValue(
  px: number,
  min: number,
  max: number,
  step: number,
  trackWidth: number,
): number {
  const usable = trackWidth - THUMB_SIZE;
  if (usable <= 0) return min;
  const raw = (px / usable) * (max - min) + min;
  const snapped = Math.round((raw - min) / step) * step + min;
  return Math.max(min, Math.min(max, snapped));
}

function toRadixValue(value: SliderValue): number[] {
  return Array.isArray(value) ? value : [value];
}

interface ValueDisplayProps {
  values: number[];
  editingIndex: number | null;
  onStartEdit: (index: number) => void;
  onCommitEdit: (index: number, v: number) => void;
  onCancelEdit: () => void;
  min: number;
  max: number;
  step: number;
  formatValue: (v: number) => string;
  label?: string;
  isRange: boolean;
  isInteracting: boolean;
  appearance: SliderAppearance;
}

function ValueDisplay({
  values,
  editingIndex,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  min,
  max,
  step,
  formatValue,
  label,
  isRange,
  isInteracting,
  appearance,
}: ValueDisplayProps) {
  const isDrafting = appearance === "drafting";
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIndex !== null) {
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [editingIndex]);

  const commitEdit = useCallback(
    (index: number) => {
      const parsed = parseFloat(inputValue);
      if (!isNaN(parsed)) {
        const clamped = Math.max(min, Math.min(max, parsed));
        const snapped = Math.round((clamped - min) / step) * step + min;
        onCommitEdit(index, snapped);
      } else {
        onCancelEdit();
      }
    },
    [inputValue, min, max, step, onCommitEdit, onCancelEdit],
  );

  const renderValue = (index: number) => {
    if (editingIndex === index) {
      return (
        <span className="inline-grid text-[13px]">
          <span
            className="col-start-1 row-start-1 invisible"
            style={{ fontVariationSettings: fontWeights.medium }}
            aria-hidden="true"
          >
            {label ? `${label}: ` : ""}
            {formatValue(max)}
          </span>
          <span className="col-start-1 row-start-1 flex items-center gap-1">
            {label && (
              <span
                className={
                  isDrafting
                    ? "text-[var(--ws-ink-muted)]"
                    : "text-muted-foreground"
                }
              >
                {label}:
              </span>
            )}
            <input
              ref={inputRef}
              type="number"
              value={inputValue}
              min={min}
              max={max}
              step={step}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={() => commitEdit(index)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit(index);
                if (e.key === "Escape") onCancelEdit();
              }}
              aria-label={`Edit slider value${isRange ? (index === 0 ? " (start)" : " (end)") : ""}`}
              className={cn(
                "w-[5ch] rounded-none border-b bg-transparent text-center outline-none",
                isDrafting
                  ? "border-[var(--ws-line)] text-[var(--ws-ink)]"
                  : "border-border text-foreground",
              )}
              style={{ fontVariationSettings: fontWeights.medium }}
            />
          </span>
        </span>
      );
    }

    return (
      <span
        className="cursor-text select-none"
        onClick={() => {
          setInputValue(String(values[index]));
          onStartEdit(index);
        }}
      >
        {formatValue(values[index])}
      </span>
    );
  };

  return (
    <span
      className={cn(
        "text-[13px] transition-[font-variation-settings] duration-100 tabular-nums",
        isDrafting
          ? "text-[var(--ws-ink-muted)]"
          : "text-muted-foreground",
      )}
      style={{
        fontVariationSettings: isInteracting
          ? fontWeights.medium
          : fontWeights.normal,
      }}
    >
      {label && editingIndex === null && (
        <span
          className={
            isDrafting
              ? "text-[var(--ws-ink-muted)]"
              : "text-muted-foreground"
          }
        >
          {label}:{" "}
        </span>
      )}
      {isRange ? (
        <>
          {renderValue(0)}
          <span
            className={cn(
              "mx-1",
              isDrafting
                ? "text-[var(--ws-ink-subtle)]"
                : "text-muted-foreground/50",
            )}
          >
            —
          </span>
          {renderValue(1)}
        </>
      ) : (
        renderValue(0)
      )}
    </span>
  );
}

function TooltipValue({
  value,
  formatValue,
  motionX,
  appearance,
}: {
  value: number;
  formatValue: (v: number) => string;
  motionX: MotionValue<number>;
  appearance: SliderAppearance;
}) {
  const isDrafting = appearance === "drafting";
  const tooltipX = useTransform(motionX, (x) => x + THUMB_SIZE / 2);
  return (
    <motion.div
      className="absolute -translate-x-1/2 pointer-events-none z-20"
      style={{ x: tooltipX, top: -16 }}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4, transition: { duration: 0.1 } }}
      transition={springs.fast}
    >
      <span
        className={cn(
          "whitespace-nowrap rounded-md px-2 py-1 text-[12px] tabular-nums",
          isDrafting
            ? "border border-[var(--ws-line)] bg-[var(--ws-panel-bg-active)] text-[var(--ws-ink)] shadow-[var(--ws-shadow-rest)]"
            : "bg-neutral-100 text-foreground dark:bg-neutral-800",
        )}
        style={{ fontVariationSettings: fontWeights.medium }}
      >
        {formatValue(value)}
      </span>
    </motion.div>
  );
}

const Slider = forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      value,
      onChange,
      min = 0,
      max = 100,
      step = 1,
      showSteps = false,
      showValue = true,
      valuePosition = "bottom",
      appearance = "default",
      formatValue = String,
      label,
      disabled = false,
      trackClassName,
      trackStyle,
      trackDataSlot,
      rangeClassName,
      rangeStyle,
      thumbDataSlot,
      renderThumb,
      className,
      ...props
    },
    ref,
  ) => {
    const isRange = Array.isArray(value);
    const isDrafting = appearance === "drafting";
    const values = toRadixValue(value);

    const trackRef = useRef<HTMLDivElement>(null);
    const trackWidthRef = useRef(0);
    const hasMounted = useRef(false);
    const dragging = useRef(false);
    const activeDragThumb = useRef<number>(0);

    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [activeThumbIndex, setActiveThumbIndex] = useState<number | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [hoverPreview, setHoverPreview] = useState<{
      left: number;
      width: number;
      onFilledSide: boolean;
      snappedValue: number;
      cursorX: number;
    } | null>(null);
    const [hoverThumbIndex, setHoverThumbIndex] = useState<number | null>(null);

    const motionX0 = useMotionValue(0);
    const motionX1 = useMotionValue(0);

    const fillLeft = useTransform(motionX0, (x) =>
      isRange ? x + THUMB_SIZE / 2 : 0,
    );
    const fillWidthSingle = useTransform(motionX0, (x) => x + THUMB_SIZE / 2);
    const fillWidthRange = useTransform(
      [motionX0, motionX1] as MotionValue<number>[],
      ([x0, x1]) => (x1 as number) - (x0 as number),
    );
    const fillWidth = isRange ? fillWidthRange : fillWidthSingle;

    const computeHoverPreview = useCallback(
      (cursorX: number, trackWidth: number) => {
        const rawVal = (cursorX / trackWidth) * (max - min) + min;
        const snappedVal = Math.max(
          min,
          Math.min(max, Math.round((rawVal - min) / step) * step + min),
        );
        const snappedX = ((snappedVal - min) / (max - min)) * trackWidth;

        const c0 = motionX0.get() + THUMB_SIZE / 2;
        const c1 = motionX1.get() + THUMB_SIZE / 2;
        const nearestIdx = isRange
          ? Math.abs(snappedX - c0) <= Math.abs(snappedX - c1)
            ? 0
            : 1
          : 0;
        const nearest = nearestIdx === 0 ? c0 : c1;
        const onFilledSide = isRange
          ? snappedX > c0 && snappedX < c1
          : snappedX < c0;

        setHoverPreview({
          left: Math.min(nearest, snappedX),
          width: Math.abs(snappedX - nearest),
          onFilledSide,
          snappedValue: snappedVal,
          cursorX: snappedX,
        });
        setHoverThumbIndex(nearestIdx);
      },
      [min, max, step, isRange, motionX0, motionX1],
    );

    useEffect(() => {
      hasMounted.current = true;
    }, []);

    useEffect(() => {
      const el = trackRef.current;
      if (!el) return;
      const ro = new ResizeObserver(([entry]) => {
        trackWidthRef.current = entry.contentRect.width;
        if (dragging.current) return;
        const px0 = valueToPixel(values[0], min, max, entry.contentRect.width);
        if (hasMounted.current) {
          animate(motionX0, px0, springs.moderate);
        } else {
          motionX0.set(px0);
        }
        if (isRange && values[1] !== undefined) {
          const px1 = valueToPixel(
            values[1],
            min,
            max,
            entry.contentRect.width,
          );
          if (hasMounted.current) {
            animate(motionX1, px1, springs.moderate);
          } else {
            motionX1.set(px1);
          }
        }
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, [min, max, isRange, values, motionX0, motionX1]);

    useEffect(() => {
      if (dragging.current) return;
      const tw = trackWidthRef.current;
      if (tw <= 0) return;
      const px0 = valueToPixel(values[0], min, max, tw);
      if (hasMounted.current) {
        animate(motionX0, px0, springs.moderate);
      } else {
        motionX0.set(px0);
      }
      if (isRange && values[1] !== undefined) {
        const px1 = valueToPixel(values[1], min, max, tw);
        if (hasMounted.current) {
          animate(motionX1, px1, springs.moderate);
        } else {
          motionX1.set(px1);
        }
      }
    }, [values, min, max, isRange, motionX0, motionX1]);

    const clampForRange = useCallback(
      (px: number, thumbIndex: number): number => {
        if (!isRange) return px;
        return thumbIndex === 0
          ? Math.min(px, motionX1.get() - THUMB_SIZE * 0.5)
          : Math.max(px, motionX0.get() + THUMB_SIZE * 0.5);
      },
      [isRange, motionX0, motionX1],
    );

    const emitChange = useCallback(
      (thumbIndex: number, newValue: number) => {
        if (isRange) {
          const newValues: [number, number] = [...(values as [number, number])];
          newValues[thumbIndex] = newValue;
          onChange(newValues);
        } else {
          onChange(newValue);
        }
      },
      [isRange, values, onChange],
    );

    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (disabled) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();

        const trackRect = trackRef.current?.getBoundingClientRect();
        if (!trackRect) return;

        const localX = e.clientX - trackRect.left - THUMB_SIZE / 2;
        const clamped = Math.max(
          0,
          Math.min(trackRect.width - THUMB_SIZE, localX),
        );

        if (isRange) {
          const dist0 = Math.abs(clamped - motionX0.get());
          const dist1 = Math.abs(clamped - motionX1.get());
          activeDragThumb.current = dist0 <= dist1 ? 0 : 1;
        } else {
          activeDragThumb.current = 0;
        }

        dragging.current = true;
        setIsPressed(true);
        setActiveThumbIndex(activeDragThumb.current);

        const motionX = activeDragThumb.current === 0 ? motionX0 : motionX1;
        const snappedValue = pixelToValue(
          clamped,
          min,
          max,
          step,
          trackRect.width,
        );
        const snappedPx = valueToPixel(snappedValue, min, max, trackRect.width);
        const finalPx = clampForRange(snappedPx, activeDragThumb.current);

        animate(motionX, finalPx, springs.moderate);
        emitChange(
          activeDragThumb.current,
          pixelToValue(finalPx, min, max, step, trackRect.width),
        );

        setHoverPreview((prev) => ({
          left: prev?.left ?? 0,
          width: prev?.width ?? 0,
          onFilledSide: prev?.onFilledSide ?? false,
          snappedValue,
          cursorX: finalPx + THUMB_SIZE / 2,
        }));

        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      },
      [
        disabled,
        isRange,
        min,
        max,
        step,
        motionX0,
        motionX1,
        clampForRange,
        emitChange,
      ],
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragging.current) return;
        e.stopPropagation();
        const trackRect = trackRef.current?.getBoundingClientRect();
        if (!trackRect) return;

        const localX = e.clientX - trackRect.left - THUMB_SIZE / 2;
        const clamped = Math.max(
          0,
          Math.min(trackRect.width - THUMB_SIZE, localX),
        );
        const motionX = activeDragThumb.current === 0 ? motionX0 : motionX1;
        const snappedValue = pixelToValue(
          clamped,
          min,
          max,
          step,
          trackRect.width,
        );
        const snappedPx = valueToPixel(snappedValue, min, max, trackRect.width);
        const finalPx = clampForRange(snappedPx, activeDragThumb.current);

        motionX.set(finalPx);
        emitChange(
          activeDragThumb.current,
          pixelToValue(finalPx, min, max, step, trackRect.width),
        );

        setHoverPreview((prev) => ({
          left: prev?.left ?? 0,
          width: prev?.width ?? 0,
          onFilledSide: prev?.onFilledSide ?? false,
          snappedValue,
          cursorX: finalPx + THUMB_SIZE / 2,
        }));
      },
      [min, max, step, motionX0, motionX1, clampForRange, emitChange],
    );

    const handlePointerUp = useCallback(() => {
      if (!dragging.current) return;
      dragging.current = false;
      setIsPressed(false);
      setActiveThumbIndex(null);
      const tw = trackWidthRef.current;
      const motionX = activeDragThumb.current === 0 ? motionX0 : motionX1;
      const snapped = pixelToValue(motionX.get(), min, max, step, tw);
      animate(motionX, valueToPixel(snapped, min, max, tw), springs.moderate);
    }, [min, max, step, motionX0, motionX1]);

    const handleRadixChange = useCallback(
      (newValues: number[]) => {
        if (dragging.current) return;
        onChange(isRange ? (newValues as [number, number]) : newValues[0]);
      },
      [isRange, onChange],
    );

    const stepDots = showSteps
      ? Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => {
          const v = min + i * step;
          return { value: v, percent: (v - min) / (max - min) };
        })
      : [];

    const isInteracting = isHovered || isPressed;

    const valueDisplay = showValue && valuePosition !== "tooltip" && (
      <ValueDisplay
        values={values}
        editingIndex={editingIndex}
        onStartEdit={(i) => setEditingIndex(i)}
        onCommitEdit={(i, v) => {
          emitChange(i, v);
          setEditingIndex(null);
        }}
        onCancelEdit={() => setEditingIndex(null)}
        min={min}
        max={max}
        step={step}
        formatValue={formatValue}
        label={label}
        isRange={isRange}
        isInteracting={isInteracting}
        appearance={appearance}
      />
    );

    const renderVisualThumb = (index: number) => {
      const motionX = index === 0 ? motionX0 : motionX1;
      const isHovered = hoverThumbIndex === index;
      const isPressedThumb =
        isPressed && activeThumbIndex === index;
      const thumbState = {
        isActive: isHovered || isPressedThumb,
        isHovered,
        isPressed: isPressedThumb,
      };
      return (
        <motion.span
          key={`visual-thumb-${index}`}
          data-slot={thumbDataSlot}
          className="flex items-center justify-center pointer-events-none absolute top-1/2"
          style={{
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            marginTop: -THUMB_SIZE / 2,
            x: motionX,
            left: 0,
            zIndex: 10,
          }}
          initial={false}
          transition={springs.moderate}
        >
          {renderThumb ? (
            renderThumb(index, thumbState)
          ) : (
            <motion.span
              className={cn(
                "flex items-center justify-center rounded-[4px] border",
                isDrafting
                  ? "border-[var(--ws-line)] bg-[var(--ws-panel-bg-active)] shadow-[var(--ws-shadow-rest)]"
                  : "border-black/10 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.06)] dark:border-border dark:bg-card dark:shadow-[0_1px_4px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.08)]",
              )}
              initial={false}
              animate={{
                width: THUMB_SIZE,
                height: THUMB_SIZE,
              }}
              transition={springs.fast}
            >
              <span
                className={cn(
                  "rounded-[2px] border",
                  isDrafting
                    ? "border-[var(--ws-line-hover)]"
                    : "border-black/10 dark:border-border",
                )}
                style={{
                  width: thumbState.isActive ? 10 : 8,
                  height: thumbState.isActive ? 10 : 8,
                  backgroundColor:
                    isDrafting
                      ? "color-mix(in srgb, var(--ws-ink) 84%, var(--ws-surface-bg))"
                      : "color-mix(in srgb, var(--foreground) 84%, white)",
                }}
              />
            </motion.span>
          )}
        </motion.span>
      );
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full select-none touch-none overflow-visible",
          valuePosition === "left" || valuePosition === "right"
            ? "flex-row items-center gap-3"
            : "flex-col gap-2",
          disabled && "opacity-50 pointer-events-none",
          className,
        )}
        {...props}
      >
        {(valuePosition === "top" || valuePosition === "left") && valueDisplay}

        <div
          className="relative flex-1 overflow-visible"
          style={{
            height: THUMB_SIZE + (valuePosition === "tooltip" ? 16 : 0),
            paddingTop: valuePosition === "tooltip" ? 16 : 0,
          }}
          onPointerEnter={() => setIsHovered(true)}
          onPointerLeave={() => {
            setIsHovered(false);
            setActiveThumbIndex(null);
            setHoverPreview(null);
            setHoverThumbIndex(null);
          }}
          onMouseMove={(e) => {
            if (dragging.current) return;
            const trackRect = trackRef.current?.getBoundingClientRect();
            if (!trackRect) return;
            const x = e.clientX - trackRect.left;
            computeHoverPreview(
              Math.max(0, Math.min(trackRect.width, x)),
              trackRect.width,
            );
          }}
        >
          {showValue && valuePosition === "tooltip" && (
            <AnimatePresence>
              {isInteracting && (
                <TooltipValue
                  key="tip-0"
                  value={values[0]}
                  formatValue={formatValue}
                  motionX={motionX0}
                  appearance={appearance}
                />
              )}
              {isInteracting && isRange && values[1] !== undefined && (
                <TooltipValue
                  key="tip-1"
                  value={values[1]}
                  formatValue={formatValue}
                  motionX={motionX1}
                  appearance={appearance}
                />
              )}
            </AnimatePresence>
          )}

          {/* invisible radix — keyboard/ARIA only */}
          <SliderPrimitive.Root
            value={values}
            onValueChange={handleRadixChange}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            aria-label={label}
            className="absolute inset-0 opacity-0 pointer-events-none"
            style={{ height: THUMB_SIZE }}
          >
            <SliderPrimitive.Track className="w-full h-full">
              <SliderPrimitive.Range />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb
              className="block outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
            />
            {isRange && (
              <SliderPrimitive.Thumb
                className="block outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
              />
            )}
          </SliderPrimitive.Root>

          <div
            ref={trackRef}
            className="relative w-full cursor-ew-resize"
            style={{ height: THUMB_SIZE + 16 }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <div
              className="absolute cursor-ew-resize"
              style={{ left: -8, right: -8, top: 0, bottom: 0 }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />

            <AnimatePresence>
              {hoverPreview && valuePosition !== "tooltip" && (
                <motion.div
                  key="hover-tip"
                  className="absolute -translate-x-1/2 pointer-events-none z-20"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0, left: hoverPreview.cursorX }}
                  exit={{ opacity: 0, y: 4, transition: { duration: 0.1 } }}
                  transition={springs.fast}
                  style={{ top: -20 }}
                >
                  <span
                    className={cn(
                      "whitespace-nowrap rounded-md px-2 py-1 text-[12px] tabular-nums",
                      isDrafting
                        ? "border border-[var(--ws-line)] bg-[var(--ws-panel-bg-active)] text-[var(--ws-ink)] shadow-[var(--ws-shadow-rest)]"
                        : "bg-neutral-100 text-foreground dark:bg-neutral-800",
                    )}
                    style={{ fontVariationSettings: fontWeights.medium }}
                  >
                    {formatValue(hoverPreview.snappedValue)}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              data-slot={trackDataSlot}
              className={cn(
                "absolute left-0 right-0 rounded-[4px]",
                isDrafting &&
                  "border border-[var(--ws-line)] bg-[var(--ws-control-bg)]",
                trackClassName,
              )}
              initial={false}
              animate={{
                height: isHovered || isPressed ? ACTIVE_TRACK_HEIGHT : TRACK_HEIGHT,
                top:
                  isHovered || isPressed
                    ? 8 + (THUMB_SIZE - ACTIVE_TRACK_HEIGHT) / 2
                    : 8 + (THUMB_SIZE - TRACK_HEIGHT) / 2,
              }}
              transition={springs.fast}
              style={{
                backgroundColor: isDrafting ? undefined : NEUTRAL_TRACK_COLOR,
                ...trackStyle,
              }}
            >
              <motion.div
                className={cn(
                  "absolute h-full rounded-[4px]",
                  isDrafting && "bg-[var(--ws-ink)]",
                  rangeClassName,
                )}
                style={{
                  left: fillLeft,
                  width: fillWidth,
                  backgroundColor: isDrafting ? undefined : "var(--foreground)",
                  ...rangeStyle,
                }}
              />

              <motion.div
                className="absolute h-full pointer-events-none rounded-[4px]"
                initial={false}
                animate={{
                  left:
                    hoverPreview && !hoverPreview.onFilledSide
                      ? hoverPreview.left
                      : 0,
                  width:
                    hoverPreview && !hoverPreview.onFilledSide
                      ? hoverPreview.width
                      : 0,
                  opacity:
                    hoverPreview && !hoverPreview.onFilledSide && !isPressed
                      ? 1
                      : 0,
                }}
                transition={{
                  ...springs.moderate,
                  opacity: { duration: 0.15 },
                }}
                style={{
                  backgroundColor:
                    isDrafting
                      ? "color-mix(in srgb, var(--ws-ink) 20%, transparent)"
                      : "color-mix(in srgb, var(--foreground) 20%, transparent)",
                }}
              />

              <motion.div
                className="absolute h-full pointer-events-none z-[2] rounded-[4px]"
                initial={false}
                animate={{
                  left: hoverPreview?.onFilledSide ? hoverPreview.left : 0,
                  width: hoverPreview?.onFilledSide ? hoverPreview.width : 0,
                  opacity: hoverPreview?.onFilledSide && !isPressed ? 1 : 0,
                }}
                transition={{
                  ...springs.moderate,
                  opacity: { duration: 0.15 },
                }}
                style={{
                  backgroundColor:
                    isDrafting
                      ? "color-mix(in srgb, var(--ws-surface-bg) 25%, transparent)"
                      : "color-mix(in srgb, var(--background) 25%, transparent)",
                }}
              />
            </motion.div>

            {stepDots.map(({ value: v, percent }) => {
              const onFilled = isRange
                ? v >= values[0] && v <= values[1]
                : v <= values[0];
              return (
                <div
                  key={v}
                  className="absolute pointer-events-none flex items-center justify-center"
                  style={{
                    left: `calc(${THUMB_SIZE / 2}px + ${percent} * (100% - ${THUMB_SIZE}px))`,
                    top: "50%",
                    width: 0,
                    height: 0,
                  }}
                >
                  <motion.div
                    className="relative rounded-full flex-shrink-0 z-[6]"
                    initial={false}
                    animate={{
                      width: isHovered ? DOT_SIZE * 1.25 : DOT_SIZE,
                      height: isHovered ? DOT_SIZE * 1.25 : DOT_SIZE,
                    }}
                    transition={springs.moderate}
                    style={{
                      backgroundColor: onFilled
                        ? isDrafting
                          ? "color-mix(in srgb, var(--ws-surface-bg) 20%, var(--ws-ink))"
                          : "color-mix(in srgb, var(--background) 20%, var(--foreground))"
                        : isDrafting
                          ? "color-mix(in srgb, var(--ws-ink-muted) 28%, var(--ws-control-bg))"
                          : NEUTRAL_DOT_COLOR,
                    }}
                  />
                </div>
              );
            })}

            {renderVisualThumb(0)}
            {isRange && renderVisualThumb(1)}
          </div>
        </div>

        {(valuePosition === "bottom" || valuePosition === "right") &&
          valueDisplay}
      </div>
    );
  },
);

Slider.displayName = "Slider";

export { Slider };
