"use client";

import { useAnimation } from "motion/react";
import type { HTMLAttributes, Ref } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

interface AnimatedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface AnimatedIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

/** Shared hover/controlled animation wiring for the animate-ui style icons:
 *  imperative start/stop via ref, hover plays `play`, leave returns to normal. */
function useAnimatedIconControls({
  ref,
  onMouseEnter,
  onMouseLeave,
  play,
}: {
  ref: Ref<AnimatedIconHandle>;
  onMouseEnter?: AnimatedIconProps["onMouseEnter"];
  onMouseLeave?: AnimatedIconProps["onMouseLeave"];
  play: (controls: ReturnType<typeof useAnimation>) => void | Promise<void>;
}) {
  const controls = useAnimation();
  const isControlledRef = useRef(false);

  useImperativeHandle(ref, () => {
    isControlledRef.current = true;

    return {
      startAnimation: () => {
        void play(controls);
      },
      stopAnimation: () => controls.start("normal"),
    };
  });

  const handleMouseEnter = useCallback(
    async (e: React.MouseEvent<HTMLDivElement>) => {
      if (isControlledRef.current) {
        onMouseEnter?.(e);
      } else {
        await play(controls);
      }
    },
    [controls, onMouseEnter, play]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isControlledRef.current) {
        onMouseLeave?.(e);
      } else {
        controls.start("normal");
      }
    },
    [controls, onMouseLeave]
  );

  return { controls, handleMouseEnter, handleMouseLeave };
}

export interface AnimatedIconSvgProps {
  size: number
  controls: ReturnType<typeof useAnimation>
}

/** Builds a hover-animated icon component: div wrapper + shared svg boilerplate.
 * `renderSvg` returns the icon's svg element (use `m.*` primitives inside). */
export function createAnimatedIcon({
  displayName,
  play,
  renderSvg,
}: {
  displayName: string
  play: (controls: ReturnType<typeof useAnimation>) => void | Promise<void>
  renderSvg: (props: AnimatedIconSvgProps) => React.ReactNode
}) {
  const Icon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
    ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
      const { controls, handleMouseEnter, handleMouseLeave } =
        useAnimatedIconControls({ ref, onMouseEnter, onMouseLeave, play })

      return (
        <div
          className={cn(className)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          {...props}
        >
          {renderSvg({ size, controls })}
        </div>
      )
    }
  )

  Icon.displayName = displayName
  return Icon
}
