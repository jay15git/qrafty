"use client";

import { m, AnimatePresence } from "motion/react";
import { spring } from "@/lib/springs";
import type { ShapeClasses } from "@/lib/shape-classes";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// SelectOverlays
//
// The three absolutely positioned overlays inside the popup: the selected-row
// background, the hover pill, and the keyboard focus ring. They exit-animate
// inside AnimatePresence boundaries that stay mounted across opens; each child
// is keyed by the open epoch so a still-exiting overlay is never re-adopted
// under its old key on reopen (`initial` would never run again and it would
// spring from the stale row). The popup's own fade covers their disappearance.
//
// The hover pill's slide between rows is a plain CSS transition — transform
// and size move on their own duration while mount/unmount opacity fades stay
// with AnimatePresence. A fresh session re-keys the element so the pill fades
// in on the pointed row instead of sliding over from the last one.
// ---------------------------------------------------------------------------

/** A row's position inside the scroll container's layout space. */
export interface ItemRect {
  top: number;
  height: number;
  left: number;
  width: number;
}

export function SelectOverlays({
  open,
  openEpoch,
  checkedRect,
  focusRect,
  hoverRect,
  hoverSession,
  shape,
}: {
  open: boolean;
  openEpoch: number;
  checkedRect: ItemRect | null;
  focusRect: ItemRect | null;
  hoverRect: ItemRect | null;
  /** Increments when the pointer enters the popup — re-keys the pill so it
   *  fades in on the pointed row rather than sliding from the stale one. */
  hoverSession: number;
  shape: ShapeClasses;
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

      {/* Hover background — CSS transition on transform/size replaces the old
          spring travel; opacity stays on AnimatePresence. Reduced motion drops
          the travel and keeps the fade. */}
      <AnimatePresence>
        {open && hoverRect && (
          <m.div
            key={hoverSession}
            data-slot="select-hover-highlight"
            className={cn(
              "pointer-events-none absolute left-0 top-0 bg-hover",
              "transition-[transform,width,height] duration-100 ease-out motion-reduce:transition-none",
              shape.bg,
            )}
            style={{
              transform: `translate(${hoverRect.left}px, ${hoverRect.top}px)`,
              width: hoverRect.width,
              height: hoverRect.height,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.06 } }}
            transition={{ opacity: { duration: 0.08 } }}
          />
        )}
      </AnimatePresence>

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
