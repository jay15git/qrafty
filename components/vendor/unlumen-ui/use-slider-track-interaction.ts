"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  useMotionValue,
  useTransform,
  animate,
  type MotionValue,
} from "motion/react";
import { THUMB_SIZE } from "./slider-thumb";

const springs = {
  moderate: { type: "spring" as const, duration: 0.16, bounce: 0.15 },
} as const;

type SliderValue = number | [number, number];

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

export interface UseSliderTrackInteractionOptions {
  value: SliderValue;
  onChange: (value: SliderValue) => void;
  min: number;
  max: number;
  step: number;
  showSteps: boolean;
  disabled: boolean;
}

export function useSliderTrackInteraction({
  value,
  onChange,
  min,
  max,
  step,
  showSteps,
  disabled,
}: UseSliderTrackInteractionOptions) {
  const isRange = Array.isArray(value);
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

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      handlePointerUp();
    },
    [handlePointerUp],
  );

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

  const clearHoverState = useCallback(() => {
    setIsHovered(false);
    setActiveThumbIndex(null);
    setHoverPreview(null);
    setHoverThumbIndex(null);
  }, []);

  const handleTrackMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (dragging.current) return;
      const trackRect = trackRef.current?.getBoundingClientRect();
      if (!trackRect) return;
      const x = e.clientX - trackRect.left;
      computeHoverPreview(
        Math.max(0, Math.min(trackRect.width, x)),
        trackRect.width,
      );
    },
    [computeHoverPreview],
  );

  return {
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
    dragging,
  };
}

export type SliderTrackInteraction = ReturnType<typeof useSliderTrackInteraction>;
