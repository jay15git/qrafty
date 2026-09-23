"use client";

import { m, AnimatePresence } from "motion/react";
import { spring } from "@/lib/springs";
import type { ItemRect, UseFluidHoverReturn } from "@/components/ui/use-fluid-hover";
import type { ShapeClasses } from "@/lib/shape-context";
import { FluidHoverHighlight } from "@/components/ui/fluid-hover-highlight";

// ---------------------------------------------------------------------------
// SelectOverlays
//
// The three absolutely positioned overlays inside the popup: the selected-row
// background, the fluid hover pill, and the keyboard focus ring. They
// exit-animate inside AnimatePresence boundaries that stay mounted across
// opens; each child is keyed by the open epoch so a still-exiting overlay is
// never re-adopted under its old key on reopen (`initial` would never run
// again and it would spring from the stale row). The popup's own fade covers
// their disappearance.
// ---------------------------------------------------------------------------

export function SelectOverlays({
  open,
  openEpoch,
  checkedRect,
  focusRect,
  shape,
  hover,
}: {
  open: boolean;
  openEpoch: number;
  checkedRect: ItemRect | null;
  focusRect: ItemRect | null;
  shape: ShapeClasses;
  hover: UseFluidHoverReturn;
}) {
  return (
    <>
      {/* Selected background */}
      <AnimatePresence>
        {open && checkedRect && (
          <m.div
            key={openEpoch}
            className={`absolute ${shape.bg} bg-active pointer-events-none`}
            // Position lives in `animate` so an in-session value
            // change springs the marker to the picked row (the
            // selection acknowledgment). Safe against the reopen
            // slide: the epoch key means no marker survives a
            // close, and a fresh mount with initial={false}
            // renders snapped at these values.
            initial={false}
            layout
            style={{
              top: checkedRect.top,
              left: checkedRect.left,
              width: checkedRect.width,
              height: checkedRect.height,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{ opacity: 0, transition: spring.moderate.exit }}
            transition={{
              ...spring.moderate,
              opacity: { duration: 0.08 },
            }}
          />
        )}
      </AnimatePresence>

      {/* Hover background */}
      <FluidHoverHighlight hover={hover} hidden={!open} className={shape.bg} />

      {/* Focus ring */}
      <AnimatePresence>
        {open && focusRect && (
          <m.div
            key={openEpoch}
            className={`absolute ${shape.focusRing} pointer-events-none z-20 border border-[color:var(--focus-ring,#6B97FF)]`}
            initial={false}
            layout
            style={{
              left: focusRect.left - 2,
              top: focusRect.top - 2,
              width: focusRect.width + 4,
              height: focusRect.height + 4,
            }}
            exit={{ opacity: 0, transition: spring.fast.exit }}
            transition={{
              ...spring.fast,
              opacity: { duration: 0.08 },
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
