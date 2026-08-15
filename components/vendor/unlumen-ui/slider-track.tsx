"use client";

import {
  m,
  AnimatePresence,
  type MotionValue,
} from "motion/react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { cn } from "@/lib/utils";
import { THUMB_SIZE } from "./slider-thumb";

const springs = {
  fast: { type: "spring" as const, duration: 0.08, bounce: 0 },
  moderate: { type: "spring" as const, duration: 0.16, bounce: 0.15 },
} as const;

const fontWeights = {
  medium: "'wght' 450",
} as const;

const TRACK_HEIGHT = 10;
const ACTIVE_TRACK_HEIGHT = 12;
const DOT_SIZE = 4;
const NEUTRAL_TRACK_COLOR =
  "color-mix(in srgb, var(--foreground) 12%, var(--background))";
const NEUTRAL_DOT_COLOR =
  "color-mix(in srgb, var(--foreground) 28%, var(--background))";

type ValuePosition = "left" | "right" | "top" | "bottom" | "tooltip";

export interface SliderTrackProps {
  trackRef: RefObject<HTMLDivElement | null>;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void;
  hoverPreview: {
    left: number;
    width: number;
    onFilledSide: boolean;
    snappedValue: number;
    cursorX: number;
  } | null;
  valuePosition: ValuePosition;
  formatValue: (v: number) => string;
  isDrafting: boolean;
  isPressed: boolean;
  isHovered: boolean;
  trackDataSlot?: string;
  trackClassName?: string;
  trackStyle?: CSSProperties;
  rangeClassName?: string;
  rangeStyle?: CSSProperties;
  fillLeft: MotionValue<number>;
  fillWidth: MotionValue<number>;
  stepDots: Array<{ value: number; percent: number }>;
  values: number[];
  isRange: boolean;
  children?: ReactNode;
}

export function SliderTrack({
  trackRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  hoverPreview,
  valuePosition,
  formatValue,
  isDrafting,
  isPressed,
  isHovered,
  trackDataSlot,
  trackClassName,
  trackStyle,
  rangeClassName,
  rangeStyle,
  fillLeft,
  fillWidth,
  stepDots,
  values,
  isRange,
  children,
}: SliderTrackProps) {
  return (
    <div
      ref={trackRef}
      className="relative w-full cursor-ew-resize"
      style={{ height: THUMB_SIZE + 16 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div
        className="absolute cursor-ew-resize"
        style={{ left: -8, right: -8, top: 0, bottom: 0 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      />

      <AnimatePresence>
        {hoverPreview && valuePosition !== "tooltip" && (
          <m.div
            key="hover-tip"
            className="absolute -translate-x-1/2 pointer-events-none z-20"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4, transition: { duration: 0.1 } }}
            transition={springs.fast}
            style={{ top: -20, left: hoverPreview.cursorX }}
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
          </m.div>
        )}
      </AnimatePresence>

      <m.div
        layout
        data-slot={trackDataSlot}
        className={cn(
          "absolute left-0 right-0 rounded-[4px]",
          isDrafting &&
            "border border-[var(--ws-line)] bg-[var(--ws-control-bg)]",
          trackClassName,
        )}
        initial={false}
        transition={springs.fast}
        style={{
          height: isHovered || isPressed ? ACTIVE_TRACK_HEIGHT : TRACK_HEIGHT,
          top:
            isHovered || isPressed
              ? 8 + (THUMB_SIZE - ACTIVE_TRACK_HEIGHT) / 2
              : 8 + (THUMB_SIZE - TRACK_HEIGHT) / 2,
          backgroundColor: isDrafting ? undefined : NEUTRAL_TRACK_COLOR,
          ...trackStyle,
        }}
      >
        <m.div
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

        <m.div
          className="absolute h-full pointer-events-none rounded-[4px]"
          initial={false}
          animate={{
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
            left:
              hoverPreview && !hoverPreview.onFilledSide
                ? hoverPreview.left
                : 0,
            width:
              hoverPreview && !hoverPreview.onFilledSide
                ? hoverPreview.width
                : 0,
            backgroundColor: isDrafting
              ? "color-mix(in srgb, var(--ws-ink) 20%, transparent)"
              : "color-mix(in srgb, var(--foreground) 20%, transparent)",
          }}
        />

        <m.div
          className="absolute h-full pointer-events-none z-[2] rounded-[4px]"
          initial={false}
          animate={{
            opacity: hoverPreview?.onFilledSide && !isPressed ? 1 : 0,
          }}
          transition={{
            ...springs.moderate,
            opacity: { duration: 0.15 },
          }}
          style={{
            left: hoverPreview?.onFilledSide ? hoverPreview.left : 0,
            width: hoverPreview?.onFilledSide ? hoverPreview.width : 0,
            backgroundColor: isDrafting
              ? "color-mix(in srgb, var(--ws-surface-bg) 25%, transparent)"
              : "color-mix(in srgb, var(--background) 25%, transparent)",
          }}
        />
      </m.div>

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
            <m.div
              layout
              className="relative rounded-full flex-shrink-0 z-[6]"
              initial={false}
              transition={springs.moderate}
              style={{
                width: isHovered ? DOT_SIZE * 1.25 : DOT_SIZE,
                height: isHovered ? DOT_SIZE * 1.25 : DOT_SIZE,
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

      {children}
    </div>
  );
}
