"use client";

import { m, type MotionValue } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const THUMB_SIZE = 18;

const springs = {
  fast: { type: "spring" as const, duration: 0.08, bounce: 0 },
  moderate: { type: "spring" as const, duration: 0.16, bounce: 0.15 },
} as const;

export interface SliderVisualThumbProps {
  index: number;
  motionX: MotionValue<number>;
  hoverThumbIndex: number | null;
  isPressed: boolean;
  activeThumbIndex: number | null;
  thumbDataSlot?: string;
  renderThumb?: (
    index: number,
    state: { isActive: boolean; isHovered: boolean; isPressed: boolean },
  ) => ReactNode;
  isDrafting: boolean;
}

export function SliderVisualThumb({
  index,
  motionX,
  hoverThumbIndex,
  isPressed,
  activeThumbIndex,
  thumbDataSlot,
  renderThumb,
  isDrafting,
}: SliderVisualThumbProps) {
  const isHovered = hoverThumbIndex === index;
  const isPressedThumb = isPressed && activeThumbIndex === index;
  const thumbState = {
    isActive: isHovered || isPressedThumb,
    isHovered,
    isPressed: isPressedThumb,
  };

  return (
    <m.span
      key={index === 0 ? "thumb-start" : "thumb-end"}
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
        <m.span
          className={cn(
            "flex items-center justify-center rounded-[4px] border",
            isDrafting
              ? "border-[var(--ws-line)] bg-[var(--ws-panel-bg-active)] shadow-[var(--ws-shadow-rest)]"
              : "border-black/10 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.06)] dark:border-border dark:bg-card dark:shadow-[0_1px_4px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.08)]",
          )}
          initial={false}
          style={{
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
              backgroundColor: isDrafting
                ? "color-mix(in srgb, var(--ws-ink) 84%, var(--ws-surface-bg))"
                : "color-mix(in srgb, var(--foreground) 84%, white)",
            }}
          />
        </m.span>
      )}
    </m.span>
  );
}
