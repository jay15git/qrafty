"use client";

import {
  forwardRef,
  useCallback,
  useLayoutEffect,
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
import {
  popupMaxHeightClass,
  popupMotionClass,
  popupScrollAreaClass,
  popupViewportClass,
  isDisabledRow,
} from "@/lib/popup";
import { useKeyboardNavGate } from "@/lib/hooks/use-keyboard-nav-gate";
import { SurfaceProvider } from "@/lib/surface-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSelectContext, SelectContentContext, popupShape } from "./context";
import { SelectOverlays, type ItemRect } from "./overlays";

// The popup sits at the top of the surface ladder (level 3) and re-provides
// it so nested scroll fades resolve `--surface-3`.
const SelectPopupSurface = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <SurfaceProvider value={3}>
      <div ref={ref} className={cn("bg-surface-3 shadow-surface-3", className)} {...props}>
        {children}
      </div>
    </SurfaceProvider>
  ),
);
SelectPopupSurface.displayName = "SelectPopupSurface";

interface SelectContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Applied to the portalled positioner (e.g. `z-[20002]` above accordion popovers). */
  positionerClassName?: string;
  /** Overrides the inner item container layout (e.g. `grid grid-cols-4` for tile grids). */
  listClassName?: string;
  /** Hit-test axis for the hover pill — pass "xy" when the list is a grid. */
  listAxis?: "x" | "y" | "xy";
}

export const SelectContent = forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, positionerClassName, listClassName, listAxis = "y", ...props }, ref) => {
    const { open, value, actionsRef } = useSelectContext();
    const shape = popupShape;
    const containerRef = useRef<HTMLDivElement>(null);

    // Item elements keyed by their `data-select-index`, so pointer handlers
    // can hit-test them and the overlays can read live layout rects.
    const itemsRef = useRef(new Map<number, HTMLElement>());
    const rafIdRef = useRef<number | null>(null);
    const sessionRef = useRef(0);
    const [hoverSession, setHoverSession] = useState(0);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    // Mirrored for handlers that read it outside a render (the gap click).
    const activeIndexRef = useRef<number | null>(null);
    useEffect(() => {
      activeIndexRef.current = activeIndex;
    }, [activeIndex]);

    const registerItem = useCallback((index: number, element: HTMLElement | null) => {
      if (element) {
        itemsRef.current.set(index, element);
      } else {
        itemsRef.current.delete(index);
        // The highlighted row is gone: nothing should stay lit or receive a
        // routed click until the pointer picks again.
        if (index === activeIndexRef.current) setActiveIndex(null);
      }
    }, []);

    /** The pointer-lit row: the row the pointer is inside wins; between rows
     *  the nearest keeps the highlight so the pill doesn't blink. */
    const pickNearest = useCallback(
      (point: { x: number; y: number }): number | null => {
        let containing: number | null = null;
        let closest: number | null = null;
        let closestDistance = Infinity;
        itemsRef.current.forEach((el, index) => {
          if (isDisabledRow(el)) return;
          const r = el.getBoundingClientRect();
          const contains =
            point.x >= r.left && point.x <= r.right && point.y >= r.top && point.y <= r.bottom;
          if (contains) containing = index;
          const mousePos = listAxis === "x" ? point.x : point.y;
          const itemStart = listAxis === "x" ? r.left : r.top;
          const itemSize = listAxis === "x" ? r.width : r.height;
          const distance =
            listAxis === "xy"
              ? Math.hypot(point.x - (r.left + r.width / 2), point.y - (r.top + r.height / 2))
              : Math.abs(mousePos - (itemStart + itemSize / 2));
          if (distance < closestDistance) {
            closestDistance = distance;
            closest = index;
          }
        });
        return containing ?? closest;
      },
      [listAxis],
    );

    const onMouseMove = useCallback(
      (e: React.MouseEvent) => {
        const point = { x: e.clientX, y: e.clientY };
        if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;
          setActiveIndex(pickNearest(point));
        });
      },
      [pickNearest],
    );

    const onMouseLeave = useCallback(() => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      setActiveIndex(null);
    }, []);

    // Routes a click that lands between items (a gap, the padding, past the
    // last row) to the highlighted item, so the highlight and the click
    // agree: what is lit is what a click hits.
    const onClick = useCallback((e: React.MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      for (const element of itemsRef.current.values()) {
        if (element.contains(target)) return;
      }
      if (!target.isConnected) return;
      const control = (target as Element).closest?.(
        "input, textarea, select, button, a, summary, [contenteditable], [role='textbox'], [role='searchbox'], [role='button']",
      );
      if (control) return;
      const index = activeIndexRef.current;
      if (index === null) return;
      itemsRef.current.get(index)?.click();
    }, []);

    useEffect(
      () => () => {
        if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      },
      [],
    );

    /** A row's layout-space rect inside the scroll container — offset* values
     *  walk offset ancestors, so transforms on the popup don't skew it and the
     *  pill scrolls with the rows. */
    const itemRect = useCallback((index: number): ItemRect | null => {
      const element = itemsRef.current.get(index);
      const container = containerRef.current;
      if (!element || !container) return null;
      let top = element.offsetTop;
      let left = element.offsetLeft;
      let ancestor = element.offsetParent as HTMLElement | null;
      while (ancestor && ancestor !== container && container.contains(ancestor)) {
        top += ancestor.offsetTop + ancestor.clientTop;
        left += ancestor.offsetLeft + ancestor.clientLeft;
        ancestor = ancestor.offsetParent as HTMLElement | null;
      }
      return { top, left, width: element.offsetWidth, height: element.offsetHeight };
    }, []);

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
              container.querySelectorAll("[data-select-index]"),
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

    // Clearing it in a microtask still lands before the close paints, keeping a
    // stale pill off the next open.
    useEffect(() => {
      if (open) return;
      queueMicrotask(() => setActiveIndex(null));
    }, [open]);

    // DOM measurement can't run during render — recompute after commit whenever
    // a rect-driving index changes. A one-frame settle is invisible because the
    // pill animates with a CSS transition.
    const [rects, setRects] = useState<{
      checked: ItemRect | null;
      focus: ItemRect | null;
      hover: ItemRect | null;
    }>({ checked: null, focus: null, hover: null });
    useLayoutEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- DOM geometry exists only post-commit; measuring then storing is the one-shot layout-read pattern this rule carves out.
      setRects({
        checked: checkedIndex != null ? itemRect(checkedIndex) : null,
        focus: focusedIndex !== null ? itemRect(focusedIndex) : null,
        hover: open && activeIndex !== null ? itemRect(activeIndex) : null,
      });
    }, [checkedIndex, focusedIndex, activeIndex, open, openEpoch, itemRect]);

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
                render={<SelectPopupSurface ref={ref} />}
                // Capture phase: the primitive moves focus during its own keydown
                // handling, so the nav flag must be set before then.
                onKeyDownCapture={trackKeyboardNav}
                onMouseEnter={() => {
                  sessionRef.current += 1;
                  setHoverSession(sessionRef.current);
                  setFocusedIndex(null);
                }}
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
                onClick={onClick}
                onFocus={(e) => {
                  const indexAttr = (e.target as HTMLElement)
                    .closest("[data-select-index]")
                    ?.getAttribute("data-select-index");
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
                      checkedRect={rects.checked}
                      focusRect={rects.focus}
                      hoverRect={rects.hover}
                      hoverSession={hoverSession}
                      shape={shape}
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
