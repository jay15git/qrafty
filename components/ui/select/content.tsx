"use client";

import {
  forwardRef,
  useRef,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { m } from "motion/react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cn } from "@/lib/utils";
import { spring, exitFallbackMs } from "@/lib/springs";
import { useFluidHover } from "@/components/ui/use-fluid-hover";
import {
  popupMaxHeightClass,
  popupMotionClass,
  popupScrollAreaClass,
  popupViewportClass,
  isDisabledRow,
} from "@/lib/popup";
import { useKeyboardNavGate } from "@/lib/hooks/use-keyboard-nav-gate";
import { Elevated } from "@/lib/elevated";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSelectContext, SelectContentContext, popupShape } from "./context";
import { SelectOverlays } from "./overlays";

interface SelectContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Applied to the portalled positioner (e.g. `z-[20002]` above accordion popovers). */
  positionerClassName?: string;
  /** Overrides the inner item container layout (e.g. `grid grid-cols-4` for tile grids). */
  listClassName?: string;
  /** Hit-test axis for the fluid hover overlay — pass "xy" when the list is a grid. */
  listAxis?: "x" | "y" | "xy";
}

export const SelectContent = forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, positionerClassName, listClassName, listAxis = "y", ...props }, ref) => {
    const { open, value, actionsRef } = useSelectContext();
    const shape = popupShape;
    const containerRef = useRef<HTMLDivElement>(null);

    const hover = useFluidHover(containerRef, {
      axis: listAxis,
      isItemDisabled: isDisabledRow,
    });
    const {
      activeIndex,
      setActiveIndex,
      itemRects,
      isMeasured,
      handlers,
      registerItem,
      remeasure,
    } = hover;

    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    // Keyboard focus ring gate: seeded from the trigger's :focus-visible at
    // open, earned by navigation keys inside the popup.
    const { keyboardNavRef, trackKeyboardNav } = useKeyboardNavGate(open);
    const [checkedIndex, setCheckedIndex] = useState<number | undefined>(undefined);

    // Release Base UI's deferred unmount once the exit tween has played.
    // onAnimationComplete on the m.div is the primary signal; this
    // timeout is a fallback for throttled/background tabs where rAF-driven
    // animation callbacks can stall. The popup exits with spring.fast, so the
    // fallback tracks that tier's exit duration plus a safety buffer.
    useEffect(() => {
      if (open) return;
      const id = setTimeout(() => actionsRef.current?.unmount(), exitFallbackMs(spring.fast));
      return () => clearTimeout(id);
    }, [open, actionsRef]);

    // Fresh rects once per open. Measuring is the hook's job — it owns the
    // one coalesced pass that item registration and container resizes both
    // feed into, and a second pass from elsewhere is what used to land a
    // corrected rect on an already-mounted overlay. The popup keeps its items
    // registered while it sits hidden between opens, so registration alone
    // would never trigger a fresh pass on reopen.
    useEffect(() => {
      if (!open) return;
      remeasure();
    }, [open, remeasure]);

    // Detect the checked row. Deliberately does NOT remeasure on a value
    // change while open: the rows haven't moved, so the published rects stay
    // trustworthy and only checkedIndex switches — which lets the selected
    // marker spring from the old row to the picked one (the selection
    // acknowledgment) instead of unmounting and snapping.
    useEffect(() => {
      if (!open) return;
      // Double rAF: first waits for React commit, second for layout
      let inner: number;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => {
          const container = containerRef.current;
          if (container) {
            const items = Array.from(
              container.querySelectorAll("[data-fluid-hover-index]"),
            ) as HTMLElement[];
            const idx = items.findIndex((el) => el.getAttribute("data-value") === value);
            setCheckedIndex(idx !== -1 ? idx : undefined);
          }
        });
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }, [open, value]);

    // Reset every overlay index as the close begins. checkedIndex otherwise
    // lags one open behind value (picking an item closes the popup before the
    // effect above re-syncs it), and a leftover activeIndex is worse: Base UI
    // keeps the popup mounted through the exit tween, so on reopen the hover
    // pill would still be sitting on the previously active row and spring from
    // there to the row that auto-focus lands on. Adjusted during render (the
    // React-docs prev-prop pattern) so the reset lands in the same commit as
    // the close instead of a post-commit effect pass.
    const [prevOpen, setPrevOpen] = useState(open);
    const [openEpoch, setOpenEpoch] = useState(0);
    if (prevOpen !== open) {
      setPrevOpen(open);
      if (!open) {
        setCheckedIndex(undefined);
        setFocusedIndex(null);
      } else {
        // Fresh key per open session: AnimatePresence stays mounted across
        // closes now, and re-adopting a still-exiting overlay under its old
        // key would skip `initial` and spring it from the stale row.
        setOpenEpoch((epoch) => epoch + 1);
      }
    }

    // activeIndex lives inside useFluidHover, so it can't join the render
    // adjustment above; clearing it in a microtask still lands before the
    // close paints, keeping a stale pill off the next open.
    useEffect(() => {
      if (open) return;
      queueMicrotask(() => setActiveIndex(null));
    }, [open, setActiveIndex]);

    // Overlays read rects only once the hook reports the item set fully
    // measured. Positioning one from an incomplete pass mounts it at the wrong
    // row, and the correcting pass then springs it across the list.
    const checkedRect = isMeasured && checkedIndex != null ? itemRects[checkedIndex] : null;
    const focusRect = isMeasured && focusedIndex !== null ? itemRects[focusedIndex] : null;

    const contentCtx = useMemo(
      () => ({ registerItem, activeIndex, checkedIndex }),
      [registerItem, activeIndex, checkedIndex],
    );

    return (
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner
          side="bottom"
          align="start"
          sideOffset={6}
          alignItemWithTrigger={false}
          className={cn("z-[var(--z-modal)] outline-none", positionerClassName)}
        >
          <m.div
            className={popupMotionClass}
            initial={{ opacity: 0, y: "var(--popup-enter-y)", scaleY: 0.96 }}
            animate={
              open
                ? { opacity: 1, y: 0, scaleY: 1 }
                : { opacity: 0, y: "var(--popup-enter-y)", scaleY: 0.96 }
            }
            transition={open ? spring.fast : spring.fast.exit}
            // Base UI defers unmount while actionsRef is set; release it once
            // the exit spring has finished so the close animation fully plays.
            onAnimationComplete={() => {
              if (!open) actionsRef.current?.unmount();
            }}
          >
            <SelectContentContext.Provider value={contentCtx}>
              <SelectPrimitive.Popup
                render={<Elevated offset={2} shadowLevel={3} ref={ref} />}
                // Capture phase: the primitive moves focus during its own keydown
                // handling, so the nav flag must be set before then.
                onKeyDownCapture={trackKeyboardNav}
                onMouseEnter={() => {
                  handlers.onMouseEnter();
                  setFocusedIndex(null);
                }}
                onMouseMove={handlers.onMouseMove}
                onMouseLeave={handlers.onMouseLeave}
                onClick={handlers.onClick}
                onFocus={(e) => {
                  const indexAttr = (e.target as HTMLElement)
                    .closest("[data-fluid-hover-index]")
                    ?.getAttribute("data-fluid-hover-index");
                  if (indexAttr != null) {
                    const idx = Number(indexAttr);
                    setActiveIndex(idx);
                    setFocusedIndex(
                      keyboardNavRef.current && (e.target as HTMLElement).matches(":focus-visible")
                        ? idx
                        : null,
                    );
                  }
                }}
                onBlur={(e) => {
                  // The popup itself takes focus when the pointer leaves a row; only a
                  // departure from the whole popup ends the hover session.
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  setFocusedIndex(null);
                  setActiveIndex(null);
                }}
                className={cn(
                  // min-w tracks the trigger via the Positioner's --anchor-width
                  // var, matching the pre-migration minWidth: triggerRect.width.
                  `ds-select-popup flex flex-col min-w-[var(--anchor-width)] ${popupMaxHeightClass} overflow-hidden ${shape.container} select-none outline-none`,
                  className,
                )}
                {...props}
              >
                {/* The list scrolls inside a ScrollArea; this wrapper is the rows'
                    offsetParent, so the overlays scroll with them. */}
                <ScrollArea
                  chevron={false}
                  className={popupScrollAreaClass}
                  cueSize="tight"
                  instantFade
                  scrollFade
                  viewportClassName={cn(popupViewportClass, "scroll-fade")}
                >
                  <div
                    ref={containerRef}
                    className={cn("relative flex flex-col gap-0.5 p-1", listClassName)}
                  >
                    <SelectOverlays
                      open={open}
                      openEpoch={openEpoch}
                      checkedRect={checkedRect}
                      focusRect={focusRect}
                      shape={shape}
                      hover={hover}
                    />

                    {children}
                  </div>
                </ScrollArea>
              </SelectPrimitive.Popup>
            </SelectContentContext.Provider>
          </m.div>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    );
  },
);

SelectContent.displayName = "SelectContent";
