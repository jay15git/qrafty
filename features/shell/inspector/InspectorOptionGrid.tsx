"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { AnimatePresence, m, useReducedMotion, type Transition } from "motion/react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useSettingsPanelMotionFrozen } from "@/features/shell/components/settings-panel-motion-frozen-context";
import { SurfaceProvider } from "@/lib/surface-context";
import {
  inspectorOptionGridClass,
  type InspectorOptionGridColumns,
  type InspectorOptionGridSpacing,
} from "@/features/shell/inspector/InspectorOptionGrid.classes";
import { cn } from "@/lib/utils";
import {
  resolveScrollPersistKey,
  usePersistedElementScroll,
  useScrollPersistScope,
} from "@/lib/persisted-element-scroll";

function inspectorOptionRowClass(className?: string) {
  return cn(
    "flex w-max flex-nowrap [&>*]:w-[5.25rem] [&>*]:min-w-[5.25rem] [&>*]:shrink-0",
    className,
  );
}

const INSPECTOR_OPTION_SELECTION_APPEAR: Transition = {
  opacity: { duration: 0.38, ease: [0.4, 0, 0.2, 1] },
  filter: { duration: 0.42, ease: [0.4, 0, 0.2, 1] },
};

const INSPECTOR_OPTION_SELECTION_EXIT: Transition = {
  opacity: { duration: 0.24, ease: [0.4, 0, 1, 1] },
  filter: { duration: 0.24, ease: [0.4, 0, 1, 1] },
};

const INSPECTOR_FROZEN_MOTION_TRANSITION: Transition = { duration: 0 };

type InspectorOptionSelectionRect = {
  height: number;
  left: number;
  top: number;
  width: number;
};

type InspectorOptionSelection = {
  key: string;
  rect: InspectorOptionSelectionRect;
};

function measureInspectorOptionSelection(
  container: HTMLElement,
): InspectorOptionSelectionRect | null {
  const selected = container.querySelector<HTMLElement>(
    '[data-animated-option-selection="true"][aria-pressed="true"]',
  );

  if (!selected) {
    return null;
  }

  return {
    left: selected.offsetLeft,
    top: selected.offsetTop,
    width: selected.offsetWidth,
    height: selected.offsetHeight,
  };
}

function resolveInspectorOptionSelectionKey(
  selectedKey: string | number | boolean | null | undefined,
) {
  if (selectedKey === null || selectedKey === undefined) {
    return "none";
  }

  return String(selectedKey);
}

export function InspectorAnimatedOptionGrid({
  className,
  columns,
  children,
  layout = "grid",
  selectedKey,
  ...props
}: {
  className?: string;
  columns?: InspectorOptionGridColumns;
  children: ReactNode;
  layout?: "grid" | "row";
  selectedKey?: string | number | boolean | null;
} & ComponentProps<"div">) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<InspectorOptionSelection | null>(null);
  const motionFrozen = useSettingsPanelMotionFrozen();
  const reduceMotion = useReducedMotion();
  const skipAppear = motionFrozen || Boolean(reduceMotion);

  const measureSelected = useCallback(() => {
    if (motionFrozen) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const rect = measureInspectorOptionSelection(container);
    const key = resolveInspectorOptionSelectionKey(selectedKey);

    setSelection((prev) => {
      const next = rect ? { key, rect } : null;
      if (
        prev?.key === next?.key &&
        prev?.rect.left === next?.rect.left &&
        prev?.rect.top === next?.rect.top &&
        prev?.rect.width === next?.rect.width &&
        prev?.rect.height === next?.rect.height
      ) {
        return prev;
      }
      return next;
    });
  }, [motionFrozen, selectedKey]);

  useLayoutEffect(() => {
    measureSelected();
  }, [measureSelected, selectedKey, children]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const viewport = container.closest<HTMLElement>('[data-slot="scroll-area-viewport"]');
    const resizeTarget = viewport ?? container;

    const handleChange = () => {
      if (motionFrozen) {
        return;
      }

      measureSelected();
    };

    let observer: ResizeObserver | undefined;

    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(handleChange);
      observer.observe(container);
      container
        .querySelectorAll('[data-animated-option-selection="true"]')
        .forEach((node) => observer?.observe(node));
    }

    resizeTarget.addEventListener("scroll", handleChange, { passive: true });
    window.addEventListener("resize", handleChange);

    return () => {
      observer?.disconnect();
      resizeTarget.removeEventListener("scroll", handleChange);
      window.removeEventListener("resize", handleChange);
    };
  }, [measureSelected, motionFrozen, selectedKey]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative",
        layout === "row"
          ? inspectorOptionRowClass(className)
          : inspectorOptionGridClass(columns ?? 3, className),
      )}
      {...props}
    >
      <AnimatePresence initial={false}>
        {selection ? (
          <m.div
            key={selection.key}
            data-slot="inspector-option-selection-indicator"
            className="pointer-events-none absolute z-0 rounded-[7px] border-2 border-[var(--option-selected-border)] bg-[var(--option-selected-bg)] shadow-[var(--option-selected-shadow)] backdrop-blur-[16px]"
            style={{
              left: selection.rect.left,
              top: selection.rect.top,
              width: selection.rect.width,
              height: selection.rect.height,
            }}
            initial={
              skipAppear
                ? false
                : {
                    opacity: 0,
                    filter: "blur(12px)",
                  }
            }
            animate={{
              opacity: 1,
              filter: "blur(0px)",
            }}
            exit={
              skipAppear
                ? undefined
                : {
                    opacity: 0,
                    filter: "blur(8px)",
                    transition: INSPECTOR_OPTION_SELECTION_EXIT,
                  }
            }
            transition={
              skipAppear ? INSPECTOR_FROZEN_MOTION_TRANSITION : INSPECTOR_OPTION_SELECTION_APPEAR
            }
          />
        ) : null}
      </AnimatePresence>
      {children}
    </div>
  );
}

export type InspectorOptionGridRowKind =
  "square" | "labeled" | "h-12" | "h-10" | "h-9" | "h-8" | "content";

export type InspectorOptionGridVariant = "preset" | "compact" | "content";

const GRID_ROW_HEIGHT_HORIZONTAL: Record<InspectorOptionGridRowKind, string> = {
  square: "h-[5.75rem]",
  labeled: "h-[5.75rem]",
  "h-12": "h-14",
  "h-10": "h-12",
  "h-9": "h-11",
  "h-8": "h-10",
  content: "h-[5.75rem]",
};

const GRID_ROW_HEIGHT_VERTICAL: Record<InspectorOptionGridRowKind, string> = {
  "h-12": "h-[10.5rem]",
  "h-10": "h-[7.125rem]",
  "h-9": "h-[6.75rem]",
  "h-8": "h-[6.375rem]",
  content: "h-[11.625rem]",
  square: "",
  labeled: "",
};

function defaultRowKind(
  variant: InspectorOptionGridVariant,
  columns: InspectorOptionGridColumns,
  orientation: "vertical" | "horizontal",
): InspectorOptionGridRowKind {
  if (variant === "preset") return "square";
  if (variant === "content" && orientation === "vertical") return "content";
  return columns === 4 ? "h-12" : "h-10";
}

function optionGridScrollHeightClass({
  columns = 3,
  orientation = "vertical",
  rowKind,
  variant,
}: {
  columns?: InspectorOptionGridColumns;
  orientation?: "vertical" | "horizontal";
  rowKind?: InspectorOptionGridRowKind;
  variant: InspectorOptionGridVariant;
}): string {
  const resolvedRowKind = rowKind ?? defaultRowKind(variant, columns, orientation);

  if (orientation === "horizontal") {
    return GRID_ROW_HEIGHT_HORIZONTAL[resolvedRowKind];
  }

  if (resolvedRowKind === "square") {
    if (columns === 2) return "h-[24.75rem]";
    if (columns === 4) return "h-[12.75rem]";
    return "h-[16.5rem]";
  }

  if (resolvedRowKind === "labeled") {
    return columns === 2 ? "h-[20.25rem]" : "h-[16.5rem]";
  }

  return GRID_ROW_HEIGHT_VERTICAL[resolvedRowKind];
}

export function InspectorScrollArea({ children }: { children: ReactNode }) {
  return (
    <ScrollArea
      chevron
      cueSize="comfortable"
      data-slot="inspector-scroll-area"
      persistKey="inspector-body"
      scrollFade
      className="inspector-scroll-area min-h-0 min-w-0 w-full max-w-full flex-1"
      viewportClassName="min-w-0"
    >
      <div className="min-w-0 w-full max-w-full" data-slot="inspector-scroll">
        {children}
      </div>
    </ScrollArea>
  );
}

export function InspectorOptionGridScrollArea({
  ariaLabel,
  children,
  className,
  columns = 3,
  dataSlot,
  orientation = "vertical",
  role = "group",
  rowKind,
  shelfDataSlot,
  shelfId,
  variant,
}: {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  columns?: InspectorOptionGridColumns;
  dataSlot: string;
  orientation?: "vertical" | "horizontal";
  role?: "group" | "listbox";
  rowKind?: InspectorOptionGridRowKind;
  shelfDataSlot?: string;
  shelfId?: string;
  variant: InspectorOptionGridVariant;
}) {
  const isHorizontal = orientation === "horizontal";
  const heightClass = optionGridScrollHeightClass({
    columns,
    orientation,
    rowKind,
    variant,
  });
  const [horizontalNode, setHorizontalNode] = useState<HTMLDivElement | null>(null);
  const persistScope = useScrollPersistScope();
  const persistReactId = useId();
  usePersistedElementScroll(
    isHorizontal ? horizontalNode : null,
    resolveScrollPersistKey({
      dataSlot,
      scope: persistScope,
      reactId: persistReactId,
    }),
  );
  const shelfProps = {
    "aria-label": ariaLabel,
    "data-slot": shelfDataSlot ?? dataSlot.replace(/-scroll-area$/, ""),
    id: shelfId,
    role,
  } as const;

  if (isHorizontal) {
    return (
      <SurfaceProvider value={2}>
        <div className="min-w-0 w-full max-w-full" style={{ width: "100%" }}>
          <div
            ref={setHorizontalNode}
            className={cn(
              "min-w-0 w-full max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain [-webkit-overflow-scrolling:touch]",
              heightClass,
              className,
            )}
            data-slot={dataSlot}
            style={{ width: "100%", maxWidth: "100%" }}
          >
            <div {...shelfProps}>{children}</div>
          </div>
        </div>
      </SurfaceProvider>
    );
  }

  return (
    <SurfaceProvider value={2}>
      <ScrollArea
        chevron
        chevronOutside
        cueSize="tight"
        data-slot={dataSlot}
        orientation="vertical"
        scrollFade
        className={cn("min-w-0 w-full shrink-0 overflow-hidden", heightClass, className)}
        viewportClassName="pr-1"
      >
        <div {...shelfProps}>{children}</div>
      </ScrollArea>
    </SurfaceProvider>
  );
}
