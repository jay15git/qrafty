"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useGradientPickerContext } from "../../contexts/gradient";
import { computeOverlayHandles } from "./gradient-overlay-geometry";
import { GradientOverlayHandles } from "./gradient-overlay-handles";
import { useGradientOverlayInteractions } from "./use-gradient-overlay-interactions";

export interface OverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Pixel radius of the conic "from-angle" dial handle measured from the
   * center handle. Locked on this ring; drag rotates `startAngle`.
   */
  conicDialRadius?: number;
}

/**
 * Transparent handle-only overlay that surfaces the *geometry* of the
 * active gradient on top of any element. Designed to be dropped over a
 * consumer's own object (a canvas frame, a div on a design surface,
 * etc.) so the user can edit the gradient in place — same interactions
 * as `<GradientPicker.Area>` but without painting the gradient itself.
 * The host container must establish a positioning context (e.g.
 * `position: relative`) and represent the same coordinate space the
 * gradient will be applied to.
 *
 * Handle behavior by gradient type (identical to the in-Area version):
 *
 * - **Linear** — start / end endpoint handles tinted with the first / last
 *   stop colors. Dragging endpoints rotates the angle (and, on first
 *   drag, promotes to free-position mode). Middle stops are edited on
 *   `<GradientPicker.Bar>`, never on the canvas — the overlay only edits
 *   *geometry*. Consumers mounting an Overlay by itself should pair it
 *   with a `<GradientPicker.Bar>` or `<GradientPicker.StopList>` somewhere
 *   in the same Root, or inner stops won't be editable by pointer at all.
 * - **Radial** — center handle + edge handle. Edge handle drives radius
 *   (px for circles, normalized for ellipses); center moves the
 *   gradient and leaves the keyword `size` alone — keyword extents
 *   (`farthest-corner` etc.) naturally recompute against the new center.
 * - **Conic** — center handle + dial handle for `startAngle`.
 *
 * The root div is `pointer-events-none` so empty regions pass clicks
 * through to whatever sits beneath; the handle buttons themselves
 * intercept events normally. Pair with `<GradientPicker.Area>` for a
 * self-contained preview, or with any custom container for in-place
 * editing on the consumer's canvas.
 */
export const Overlay = React.forwardRef<HTMLDivElement, OverlayProps>(
  function Overlay({ className, conicDialRadius, style, ...rest }, ref) {
    const ctx = useGradientPickerContext();
    const { gradient } = ctx;
    const padRef = React.useRef<HTMLDivElement | null>(null);
    React.useImperativeHandle(ref, () => padRef.current as HTMLDivElement);

    const [dims, setDims] = React.useState<{ w: number; h: number }>({
      w: 0,
      h: 0,
    });
    const setContainerWidth = ctx.setContainerWidth;
    React.useEffect(() => {
      const el = padRef.current;
      if (!el) return;
      const ro = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const { width, height: h } = entry.contentRect;
        setDims({ w: width, h });
        setContainerWidth(width);
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, [setContainerWidth]);

    const handles = React.useMemo(
      () => computeOverlayHandles(gradient, dims, conicDialRadius),
      [dims, gradient, conicDialRadius],
    );

    const {
      liveText,
      stops,
      beginDrag,
      onKeyDownLinearEndpoint,
      onKeyDownCenter,
      onKeyDownConicDial,
      onKeyDownRadii,
    } = useGradientOverlayInteractions(padRef, dims, gradient);

    return (
      <div
        ref={padRef}
        data-slot="gradient-overlay"
        style={style}
        className={cn("pointer-events-none absolute inset-0", className)}
        {...rest}
      >
        <span aria-live="polite" className="sr-only">
          {liveText}
        </span>
        {handles && (
          <GradientOverlayHandles
            handles={handles}
            dims={dims}
            gradient={gradient}
            stops={stops}
            beginDrag={beginDrag}
            onKeyDownLinearEndpoint={onKeyDownLinearEndpoint}
            onKeyDownCenter={onKeyDownCenter}
            onKeyDownConicDial={onKeyDownConicDial}
            onKeyDownRadii={onKeyDownRadii}
          />
        )}
      </div>
    );
  },
);
