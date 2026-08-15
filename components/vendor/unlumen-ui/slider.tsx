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
  m,
  useTransform,
  AnimatePresence,
  type MotionValue,
} from "motion/react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";
import { SliderVisualThumb, THUMB_SIZE } from "./slider-thumb";
import { SliderTrack } from "./slider-track";
import { useSliderTrackInteraction } from "./use-slider-track-interaction";

const springs = {
  fast: { type: "spring" as const, duration: 0.08, bounce: 0 },
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
      <button
        className="cursor-text select-none border-0 bg-transparent p-0"
        type="button"
        onClick={() => {
          setInputValue(String(values[index]));
          onStartEdit(index);
        }}
      >
        {formatValue(values[index])}
      </button>
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
    <m.div
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
    </m.div>
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
    const isDrafting = appearance === "drafting";

    const interaction = useSliderTrackInteraction({
      value,
      onChange,
      min,
      max,
      step,
      showSteps,
      disabled,
    });

    const {
      isRange,
      values,
      trackRef,
      isHovered,
      setIsHovered,
      isPressed,
      activeThumbIndex,
      editingIndex,
      setEditingIndex,
      hoverPreview,
      hoverThumbIndex,
      motionX0,
      motionX1,
      fillLeft,
      fillWidth,
      handlePointerDown,
      handlePointerMove,
      handlePointerUp,
      handlePointerCancel,
      handleRadixChange,
      stepDots,
      isInteracting,
      emitChange,
      clearHoverState,
      handleTrackMouseMove,
    } = interaction;

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
          onPointerLeave={clearHoverState}
          onMouseMove={handleTrackMouseMove}
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

          <SliderTrack
            trackRef={trackRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            hoverPreview={hoverPreview}
            valuePosition={valuePosition}
            formatValue={formatValue}
            isDrafting={isDrafting}
            isPressed={isPressed}
            isHovered={isHovered}
            trackDataSlot={trackDataSlot}
            trackClassName={trackClassName}
            trackStyle={trackStyle}
            rangeClassName={rangeClassName}
            rangeStyle={rangeStyle}
            fillLeft={fillLeft}
            fillWidth={fillWidth}
            stepDots={stepDots}
            values={values}
            isRange={isRange}
          >
            <SliderVisualThumb
              index={0}
              motionX={motionX0}
              hoverThumbIndex={hoverThumbIndex}
              isPressed={isPressed}
              activeThumbIndex={activeThumbIndex}
              thumbDataSlot={thumbDataSlot}
              renderThumb={renderThumb}
              isDrafting={isDrafting}
            />
            {isRange && (
              <SliderVisualThumb
                index={1}
                motionX={motionX1}
                hoverThumbIndex={hoverThumbIndex}
                isPressed={isPressed}
                activeThumbIndex={activeThumbIndex}
                thumbDataSlot={thumbDataSlot}
                renderThumb={renderThumb}
                isDrafting={isDrafting}
              />
            )}
          </SliderTrack>
        </div>

        {(valuePosition === "bottom" || valuePosition === "right") &&
          valueDisplay}
      </div>
    );
  },
);

Slider.displayName = "Slider";

export { Slider };
