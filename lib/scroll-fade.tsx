"use client";

import {
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
} from "react";
import { useSurface } from "@/lib/surface-context";
import {
  getHorizontalContentWidth,
  isHorizontalLayoutStable,
} from "@/lib/scroll-horizontal-metrics";

import "./scroll-fade.css";

// ---------------------------------------------------------------------------
// Scroll-edge primitives
//
// useScrollEdges tracks which edges of a scroll container have more content
// beyond them; ScrollEdgeCue renders the affordance for one edge — a
// surface-colour gradient fading the content out toward the edge, with a
// small chevron hinting at the scroll direction. Together they give any
// scrolling surface the same "there's more" cue the Select menu uses.
// ---------------------------------------------------------------------------

export interface ScrollEdges {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
}

const NO_EDGES: ScrollEdges = {
  top: false,
  bottom: false,
  left: false,
  right: false,
};

export interface UseScrollEdgesOptions {
  /** Attach/detach tracking. While false all edges read false. Defaults
   *  to `true`. Pass the live scroller node as `element` — the effect
   *  rebinds when that node identity changes (portals, touch remounts). */
  enabled?: boolean;
  /** Which axes to measure. Defaults to `"vertical"`. */
  axis?: "vertical" | "horizontal" | "both";
}

const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function measureScrollEdges(
  element: HTMLElement,
  axis: "vertical" | "horizontal" | "both",
): ScrollEdges {
  const next = { ...NO_EDGES };
  if (axis !== "horizontal") {
    const { scrollTop, scrollHeight, clientHeight } = element;
    const overflowing = scrollHeight - clientHeight > 1;
    next.top = overflowing && scrollTop > 1;
    next.bottom = overflowing && scrollTop + clientHeight < scrollHeight - 1;
  }
  if (axis !== "vertical") {
    const { scrollLeft, clientWidth } = element;
    const contentWidth = getHorizontalContentWidth(element);
    const layoutUnstable = !isHorizontalLayoutStable(element);

    const overflowing = contentWidth - clientWidth > 1;

    if (!layoutUnstable) {
      next.left = overflowing && scrollLeft > 1;
      next.right = overflowing && scrollLeft + clientWidth < contentWidth - 1;
    } else if (scrollLeft <= 1 && overflowing) {
      // Radix/table-wrap inflation during accordion open: token width is
      // trustworthy at scroll origin, so show the trailing fade immediately.
      next.right = true;
    }
  }
  return next;
}

function edgesEqual(a: ScrollEdges, b: ScrollEdges) {
  return (
    a.top === b.top &&
    a.bottom === b.bottom &&
    a.left === b.left &&
    a.right === b.right
  );
}

export function useScrollEdges(
  element: HTMLElement | null,
  { enabled = true, axis = "vertical" }: UseScrollEdgesOptions = {}
): ScrollEdges {
  const [edges, setEdges] = useState<ScrollEdges>(NO_EDGES);

  useIsoLayoutEffect(() => {
    if (!enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset edges when tracking is disabled
      setEdges(NO_EDGES);
      return;
    }
    // Keep the last reading while the scroller remounts (touch ↔ pointer
    // swap). Rebinding on the new node is what this hook is for; resetting
    // here would flash the fade off for a frame.
    if (!element) return;

    const update = () => {
      const next = measureScrollEdges(element, axis);
      setEdges((prev) => (edgesEqual(prev, next) ? prev : next));
    };

    update();
    // Recompute across a few frames so popups that mount mid-animation
    // (select menus, portalled lists) get correct edges before first paint.
    let raf2 = 0;
    let raf3 = 0;
    const raf1 = requestAnimationFrame(() => {
      update();
      raf2 = requestAnimationFrame(() => {
        update();
        raf3 = requestAnimationFrame(update);
      });
    });
    element.addEventListener("scroll", update, { passive: true });

    const ro =
      typeof ResizeObserver === "function" ? new ResizeObserver(update) : null;
    ro?.observe(element);

    // Async content (items loading in, streamed text) changes scrollHeight
    // without resizing the container itself. Coalesce to one update per
    // frame: update() reads layout, and doing that synchronously after
    // every mutation forces a reflow per insertion in streaming content.
    let moRaf = 0;
    const scheduleUpdate = () => {
      if (moRaf) return;
      moRaf = requestAnimationFrame(() => {
        moRaf = 0;
        update();
      });
    };
    const mo =
      typeof MutationObserver === "function"
        ? new MutationObserver(scheduleUpdate)
        : null;
    mo?.observe(element, { childList: true, subtree: true, characterData: true });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      cancelAnimationFrame(raf3);
      if (moRaf) cancelAnimationFrame(moRaf);
      element.removeEventListener("scroll", update);
      ro?.disconnect();
      mo?.disconnect();
    };
  }, [element, enabled, axis]);

  return edges;
}

// ---------------------------------------------------------------------------
// ScrollEdgeCue
// ---------------------------------------------------------------------------

const CHEVRON_PATHS: Record<string, string> = {
  top: "M6 15l6-6 6 6",
  bottom: "M6 9l6 6 6-6",
  left: "M15 6l-6 6 6 6",
  right: "M9 6l6 6-6 6",
};

// Band size presets along the scroll axis. The chevron stays 16px in both.
export const SCROLL_EDGE_CUE_SIZES = { tight: 32, comfortable: 60 } as const;

const CUE_SIZES = SCROLL_EDGE_CUE_SIZES;

export type ScrollEdgeCueSize = keyof typeof CUE_SIZES;

export interface ScrollEdgeCueProps {
  edge: "top" | "bottom" | "left" | "right";
  visible: boolean;
  /** `"sticky"` renders a zero-size sticky element placed inside the scroller
   *  itself (before/after the scrolling content); `"absolute"` renders a plain
   *  positioned band for an `absolute inset-0 pointer-events-none` overlay
   *  sitting over the viewport. Defaults to `"sticky"`. */
  mode?: "sticky" | "absolute";
  /** Surface ladder level the gradient fades toward. Defaults to the level
   *  provided by the nearest SurfaceProvider/Elevated — override only when
   *  the scroller sits on a background outside the ladder. */
  surfaceLevel?: number;
  /** Band size along the scroll axis: `"tight"` (32px) or `"comfortable"`
   *  (60px). The chevron is 16px in either. Defaults to `"comfortable"`. */
  size?: ScrollEdgeCueSize;
  /** Sticky-mode bleed in px so the band covers the scroller's padding
   *  (e.g. 4 for `p-1`, 16 for `p-4`). Defaults to 4. */
  inset?: number;
  /** Show the directional chevron in the band. The gradient fade always
   *  renders; set to `false` for a fade-only cue. Defaults to `true`. */
  chevron?: boolean;
  /** Skip opacity enter/exit tweens — for portalled popups that should
   *  show edge fades on the first frame. */
  instantReveal?: boolean;
}

/** Standalone directional chevron for placement outside a scroll viewport. */
export function ScrollEdgeOutsideChevron({
  edge,
  visible,
}: {
  edge: "top" | "bottom" | "left" | "right";
  visible: boolean;
}) {
  return (
    <svg
      aria-hidden
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={
        {
          color: "var(--scroll-edge-chevron-color, var(--muted-foreground))",
          opacity: visible ? 1 : 0,
          transition: `opacity ${visible ? 160 : 120}ms ease`,
        } as CSSProperties
      }
    >
      <path d={CHEVRON_PATHS[edge]} />
    </svg>
  );
}

export function ScrollEdgeCue({
  edge,
  visible,
  mode = "sticky",
  surfaceLevel,
  size = "comfortable",
  inset = 4,
  chevron = true,
  instantReveal = false,
}: ScrollEdgeCueProps) {
  const contextLevel = useSurface();
  // Clamp to the ladder (1–8), mirroring SurfaceProvider — an out-of-range
  // override would interpolate an invalid var and silently kill the gradient.
  const level = Math.max(1, Math.min(8, surfaceLevel ?? contextLevel));
  const surface = `var(--surface-${level})`;
  const fadeColor = `var(--scroll-edge-fade-color, ${surface})`;
  const vertical = edge === "top" || edge === "bottom";
  const sizePx = CUE_SIZES[size];
  const bandSize = `var(--scroll-edge-cue-band-size, ${sizePx}px)`;
  // Gradient direction where 100% == the hard outer edge.
  const dir = `to ${edge}`;

  const band = (
    <div
      style={
        {
          position: "absolute",
          opacity: visible ? 1 : 0,
          // Exit slightly faster than enter, per the animation guidelines.
          // instantReveal skips the mount tween that made popover fades pop in late.
          transition: instantReveal
            ? "none"
            : `opacity ${visible ? 160 : 120}ms ease`,
          ...(mode === "sticky"
            ? vertical
              ? { left: -inset, right: -inset, [edge]: -inset, height: bandSize }
              : { top: -inset, bottom: -inset, [edge]: -inset, width: bandSize }
            : vertical
              ? { left: 0, right: 0, [edge]: 0, height: bandSize }
              : { top: 0, bottom: 0, [edge]: 0, width: bandSize }),
        } as CSSProperties
      }
    >
      <div
        className="scroll-edge-cue-gradient"
        style={
          {
            "--scroll-edge-cue-direction": dir,
          } as CSSProperties
        }
      />
      {chevron && (
        <svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={
            {
              position: "absolute",
              color: "var(--scroll-edge-chevron-color, var(--muted-foreground))",
              ...(vertical
                ? { left: "50%", transform: "translateX(-50%)" }
                : { top: "50%", transform: "translateY(-50%)" }),
              [edge]: 8,
            } as CSSProperties
          }
        >
          <path d={CHEVRON_PATHS[edge]} />
        </svg>
      )}
    </div>
  );

  if (mode === "absolute") {
    return <div aria-hidden>{band}</div>;
  }

  // Sticky: a zero-size sticky anchor so the cue adds no layout extent.
  return (
    <div
      aria-hidden
      style={
        {
          position: "sticky",
          [edge]: 0,
          ...(vertical ? { height: 0 } : { width: 0 }),
          zIndex: 30,
          pointerEvents: "none",
        } as CSSProperties
      }
    >
      {band}
    </div>
  );
}
