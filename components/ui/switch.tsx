"use client";

import {
  forwardRef,
  useRef,
  useState,
  useEffect,
  useCallback,
  useId,
  type HTMLAttributes,
} from "react";
import { animate, m, useMotionValue, type Transition } from "motion/react";
import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/springs";
import { useSize, type SizeVariant } from "@/lib/size-context";

interface SwitchProps extends HTMLAttributes<HTMLLabelElement> {
  label: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  thumbTransition?: Transition;
  /** Pins the switch to one step of the size ladder (see /docs/sizes).
   *  Omitted, it follows the surrounding SizeProvider. */
  size?: SizeVariant;
}

// Track/thumb geometry per ladder step. The hover pill-extend and press
// squash scale down with the thumb so the compact switch keeps the same feel.
const METRICS = {
  default: {
    trackWidth: 34,
    trackHeight: 20,
    thumbSize: 16,
    pillExtend: 2,
    pressExtend: 4,
    pressShrink: 4,
  },
  compact: {
    trackWidth: 28,
    trackHeight: 16,
    thumbSize: 12,
    pillExtend: 2,
    pressExtend: 3,
    pressShrink: 3,
  },
} as const;

const THUMB_OFFSET = 2;
const DRAG_DEAD_ZONE = 2;

// Thumb geometry per interaction state: hover extends the pill, press
// squashes it wider and shorter, and the checked thumb shifts left by the
// extra width so its trailing edge stays pinned to the track.
function thumbGeometry(
  metrics: (typeof METRICS)[keyof typeof METRICS],
  checked: boolean,
  hovered: boolean,
  pressed: boolean
) {
  const thumbTravel = metrics.trackWidth - metrics.thumbSize - THUMB_OFFSET * 2;
  const thumbWidth = pressed
    ? metrics.thumbSize + metrics.pressExtend
    : hovered
      ? metrics.thumbSize + metrics.pillExtend
      : metrics.thumbSize;
  const thumbHeight = pressed
    ? metrics.thumbSize - metrics.pressShrink
    : metrics.thumbSize;
  const thumbY = pressed
    ? THUMB_OFFSET + metrics.pressShrink / 2
    : THUMB_OFFSET;
  const thumbX = checked
    ? THUMB_OFFSET + thumbTravel - (thumbWidth - metrics.thumbSize)
    : THUMB_OFFSET;
  return { thumbTravel, thumbWidth, thumbHeight, thumbY, thumbX };
}

function trackColor(checked: boolean, hovered: boolean) {
  return checked
    ? hovered
      ? "#5C89F2"
      : "#6B97FF"
    : hovered
      ? "color-mix(in oklab, var(--accent), rgb(var(--overlay)) 10%)"
      : "var(--accent)";
}
const Switch = forwardRef<HTMLLabelElement, SwitchProps>(
  ({ label, checked, onToggle, disabled = false, thumbTransition, size, className, ...props }, ref) => {
    const labelId = useId();
    const switchId = useId();
    const hasMounted = useRef(false);
    const [hovered, setHovered] = useState(false);
    const [pressed, setPressed] = useState(false);
    const sizeClasses = useSize(size);
    const metrics = METRICS[sizeClasses.variant];
    const thumbTravel = metrics.trackWidth - metrics.thumbSize - THUMB_OFFSET * 2;

    const dragging = useRef(false);
    const didDrag = useRef(false);
    const pointerStart = useRef<{
      clientX: number;
      originX: number;
    } | null>(null);

    const motionX = useMotionValue(
      checked ? THUMB_OFFSET + thumbTravel : THUMB_OFFSET
    );

    useEffect(() => {
      hasMounted.current = true;
    }, []);

    const { thumbWidth, thumbHeight, thumbY, thumbX } = thumbGeometry(
      metrics,
      checked,
      hovered,
      pressed
    );

    useEffect(() => {
      if (dragging.current) return;
      if (!hasMounted.current) {
        motionX.set(thumbX);
      } else {
        animate(motionX, thumbX, thumbTransition ?? spring.moderate);
      }
    }, [thumbX, motionX, thumbTransition]);

    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLLabelElement>) => {
        if (disabled) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        setPressed(true);
        dragging.current = false;
        didDrag.current = false;
        pointerStart.current = {
          clientX: e.clientX,
          originX: motionX.get(),
        };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      },
      [disabled, motionX]
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLLabelElement>) => {
        if (!pointerStart.current) return;
        const delta = e.clientX - pointerStart.current.clientX;

        if (!dragging.current) {
          if (Math.abs(delta) < DRAG_DEAD_ZONE) return;
          dragging.current = true;
        }

        const dragMin = THUMB_OFFSET;
        const pressedThumbWidth = metrics.thumbSize + metrics.pressExtend;
        const dragMax = metrics.trackWidth - THUMB_OFFSET - pressedThumbWidth;
        const rawX = pointerStart.current.originX + delta;
        motionX.set(Math.max(dragMin, Math.min(dragMax, rawX)));
      },
      [motionX, metrics]
    );

    const handlePointerUp = useCallback(
      () => {
        if (!pointerStart.current) return;
        setPressed(false);

        if (dragging.current) {
          didDrag.current = true;
          dragging.current = false;

          const currentX = motionX.get();
          const dragMin = THUMB_OFFSET;
          const pressedThumbWidth = metrics.thumbSize + metrics.pressExtend;
          const dragMax = metrics.trackWidth - THUMB_OFFSET - pressedThumbWidth;
          const midpoint = (dragMin + dragMax) / 2;

          const shouldBeOn = currentX > midpoint;

          if (shouldBeOn !== checked) {
            onToggle();
          } else {
            const snapTarget = checked
              ? THUMB_OFFSET + thumbTravel
              : THUMB_OFFSET;
            animate(motionX, snapTarget, thumbTransition ?? spring.moderate);
          }

          requestAnimationFrame(() => {
            didDrag.current = false;
          });
        }

        pointerStart.current = null;
      },
      [checked, onToggle, motionX, thumbTransition, metrics, thumbTravel]
    );

    const handlePointerCancel = useCallback(
      () => {
        if (!pointerStart.current) return;
        setPressed(false);

        if (dragging.current) {
          dragging.current = false;
          const snapTarget = checked
            ? THUMB_OFFSET + thumbTravel
            : THUMB_OFFSET;
          animate(motionX, snapTarget, thumbTransition ?? spring.moderate);
        }

        pointerStart.current = null;
      },
      [checked, motionX, thumbTransition, thumbTravel]
    );

    return (
      // <label> wrapping the primitive: the whole row is the switch's
      // activation surface, so clicks on the text or padding forward to the
      // button natively — no click handler needed on the wrapper.
      <label
        ref={ref}
        htmlFor={switchId}
        className={cn(
          "relative z-10 flex items-center cursor-pointer select-none touch-none",
          sizeClasses.gap,
          sizeClasses.px,
          sizeClasses.variant === "compact" ? "py-1" : "py-2",
          disabled && "opacity-50 pointer-events-none",
          className
        )}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") setHovered(true);
        }}
        onPointerLeave={() => setHovered(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        {...props}
      >
        {/* Switch */}
        <SwitchPrimitive.Root
          id={switchId}
          checked={checked}
          aria-labelledby={labelId}
          // Base UI passes (checked, eventDetails); narrow to () => void for our onToggle.
          onCheckedChange={() => {
            if (didDrag.current) return;
            onToggle();
          }}
          disabled={disabled}
          tabIndex={0}
          data-slot="switch"
          data-state={checked ? "checked" : "unchecked"}
          className={cn(
            "relative shrink-0 rounded-full outline-none cursor-pointer",
            "transition-colors duration-80",
            "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
          style={{
            width: metrics.trackWidth,
            height: metrics.trackHeight,
            backgroundColor: trackColor(checked, hovered),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <SwitchPrimitive.Thumb
            render={(props) => {
              const {
                style: baseStyle,
                onDrag: _onDrag,
                onDragStart: _onDragStart,
                onDragEnd: _onDragEnd,
                onAnimationStart: _onAnimationStart,
                onAnimationEnd: _onAnimationEnd,
                onAnimationIteration: _onAnimationIteration,
                ...rest
              } = props as React.HTMLAttributes<HTMLSpanElement>;
              return (
                <m.span
                  {...rest}
                  data-slot="switch-thumb"
                  className="absolute top-0 left-0 block rounded-full bg-white shadow-sm"
                  initial={false}
                  layout
                  style={{
                    ...(baseStyle as React.CSSProperties | undefined),
                    x: motionX,
                    width: thumbWidth,
                    height: thumbHeight,
                  }}
                  animate={{
                    y: thumbY,
                  }}
                  transition={hasMounted.current ? (thumbTransition ?? spring.moderate) : { duration: 0 }}
                />
              );
            }}
          />
        </SwitchPrimitive.Root>

        {/* Label */}
        <span
          id={labelId}
          className={cn(
            // text-box trim recenters the letterforms against the track; the
            // track is taller than the label, so layout doesn't change.
            "[text-box:trim-both_cap_alphabetic] transition-[color] duration-80",
            sizeClasses.text,
            checked ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {label}
        </span>
      </label>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
