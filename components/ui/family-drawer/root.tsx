"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import useMeasure, { type RectReadOnly } from "react-use-measure";
import { Drawer } from "vaul";

import { FamilyDrawerContext, type FamilyDrawerContextValue, type ViewsRegistry } from "./context";

interface FamilyDrawerRootProps {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultView?: string;
  onViewChange?: (view: string) => void;
  views?: ViewsRegistry;
  modal?: boolean;
  dismissible?: boolean;
  /**
   * Vaul writes leftover inline `height`/`bottom` on keyboard dismiss.
   * This card animates its own height, so keyboard lift belongs to the host.
   * @default false
   */
  repositionInputs?: boolean;
}

const MIN_OPACITY_DURATION = 0.15;
const MAX_OPACITY_DURATION = 0.27;

export function FamilyDrawerRoot({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  defaultView = "default",
  onViewChange,
  views: customViews,
  modal = true,
  dismissible = true,
  repositionInputs = false,
}: FamilyDrawerRootProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [view, setView] = useState(defaultView);
  const [elementRef, bounds, refreshBounds] = useMeasure();

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  // Previous measured height and the opacity duration derived from it. Both
  // live in state so the duration is computed during render without reading a
  // ref (unsafe under concurrent React). Adjusting state during render — the
  // documented prev-prop pattern — keeps the duration identical to the old
  // ref-based computation: the render that observes a new height derives the
  // delta against the height it replaced, and the follow-up render (now
  // equal) leaves the duration alone.
  const [previousHeight, setPreviousHeight] = useState(0);
  const [opacityDuration, setOpacityDuration] = useState(MIN_OPACITY_DURATION);

  if (bounds.height !== previousHeight) {
    setPreviousHeight(bounds.height);
    setOpacityDuration(
      !previousHeight
        ? MIN_OPACITY_DURATION
        : Math.min(
            Math.max(Math.abs(bounds.height - previousHeight) / 500, MIN_OPACITY_DURATION),
            MAX_OPACITY_DURATION,
          ),
    );
  }

  // useMeasure keeps the last bounds across close/unmount, so on reopen the
  // frame first renders at a stale height and animates to the real one — the
  // "expands then settles" wobble. Until the first post-open measurement the
  // frame renders `auto` (no stale height), and that measurement snaps in
  // instantly instead of animating.
  const [boundsAtOpen, setBoundsAtOpen] = useState<RectReadOnly | null>(null);
  const measuringOpen = boundsAtOpen !== null && bounds === boundsAtOpen;
  const justMeasuredOpen = boundsAtOpen !== null && bounds !== boundsAtOpen;

  if (isOpen && boundsAtOpen === null) {
    setBoundsAtOpen(bounds);
  }
  if (isOpen && justMeasuredOpen) {
    setBoundsAtOpen(null);
  }
  if (!isOpen && boundsAtOpen !== null) {
    setBoundsAtOpen(null);
  }

  // The portal mounts the measured wrapper in the same commit the drawer
  // opens; the observer can miss that first layout when the drawer opens
  // straight onto a detail view, leaving the frame stuck at a stale height.
  useLayoutEffect(() => {
    if (isOpen) {
      refreshBounds();
    }
  }, [isOpen, view, refreshBounds]);

  // An identical re-measurement dedupes inside useMeasure — no bounds update
  // arrives, so nothing else would end the measuring window. Re-arm on a
  // short timer (rAF never fires while the tab is hidden); stale and real
  // heights are equal in that case anyway.
  useEffect(() => {
    if (boundsAtOpen === null || bounds !== boundsAtOpen) {
      return;
    }
    const timer = window.setTimeout(() => setBoundsAtOpen(null), 50);
    return () => window.clearTimeout(timer);
  }, [boundsAtOpen, bounds]);

  const views = customViews && Object.keys(customViews).length > 0 ? customViews : undefined;

  const handleViewChange = useCallback(
    (newView: string) => {
      if (views && !(newView in views)) {
        return;
      }
      setView(newView);
      onViewChange?.(newView);
    },
    [onViewChange, views],
  );

  const contextValue: FamilyDrawerContextValue = useMemo(
    () => ({
      isOpen,
      view,
      setView: handleViewChange,
      opacityDuration,
      elementRef,
      bounds,
      measuringOpen,
      snapHeight: justMeasuredOpen,
      views,
    }),
    [
      isOpen,
      view,
      handleViewChange,
      opacityDuration,
      elementRef,
      bounds,
      measuringOpen,
      justMeasuredOpen,
      views,
    ],
  );

  return (
    <FamilyDrawerContext.Provider value={contextValue}>
      <Drawer.Root
        dismissible={dismissible}
        modal={modal}
        open={isOpen}
        onOpenChange={setIsOpen}
        repositionInputs={repositionInputs}
      >
        {children}
      </Drawer.Root>
    </FamilyDrawerContext.Provider>
  );
}
