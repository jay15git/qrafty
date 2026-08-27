"use client"

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react"
import { AnimatePresence, m, useReducedMotion, type Transition } from "motion/react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { useDesktopSettingsPanelMotionFrozen } from "@/features/desktop-shell/components/desktop-settings-panel-motion-frozen-context"
import { SurfaceProvider } from "@/lib/surface-context"
import {
  desktopInspectorOptionGridClass,
  type DesktopInspectorOptionGridColumns,
  type DesktopInspectorOptionGridSpacing,
} from "@/features/desktop-shell/inspector/inspector-option-grid.classes"
import { cn } from "@/lib/utils"
import {
  resolveScrollPersistKey,
  usePersistedElementScroll,
  useScrollPersistScope,
} from "@/lib/persisted-element-scroll"

function desktopInspectorOptionRowClass(className?: string) {
  return cn(
    "flex w-max flex-nowrap [&>*]:w-[5.25rem] [&>*]:min-w-[5.25rem] [&>*]:shrink-0",
    className,
  )
}

const DESKTOP_INSPECTOR_OPTION_SELECTION_APPEAR: Transition = {
  opacity: { duration: 0.38, ease: [0.4, 0, 0.2, 1] },
  filter: { duration: 0.42, ease: [0.4, 0, 0.2, 1] },
}

const DESKTOP_INSPECTOR_OPTION_SELECTION_EXIT: Transition = {
  opacity: { duration: 0.24, ease: [0.4, 0, 1, 1] },
  filter: { duration: 0.24, ease: [0.4, 0, 1, 1] },
}

const DESKTOP_INSPECTOR_FROZEN_MOTION_TRANSITION: Transition = { duration: 0 }

type DesktopInspectorOptionSelectionRect = {
  height: number
  left: number
  top: number
  width: number
}

type DesktopInspectorOptionSelection = {
  key: string
  rect: DesktopInspectorOptionSelectionRect
}

function measureDesktopInspectorOptionSelection(
  container: HTMLElement,
): DesktopInspectorOptionSelectionRect | null {
  const selected = container.querySelector<HTMLElement>(
    '[data-desktop-animated-option-selection="true"][aria-pressed="true"]',
  )

  if (!selected) {
    return null
  }

  return {
    left: selected.offsetLeft,
    top: selected.offsetTop,
    width: selected.offsetWidth,
    height: selected.offsetHeight,
  }
}

function resolveDesktopInspectorOptionSelectionKey(
  selectedKey: string | number | boolean | null | undefined,
) {
  if (selectedKey === null || selectedKey === undefined) {
    return "none"
  }

  return String(selectedKey)
}

export function DesktopInspectorAnimatedOptionGrid({
  className,
  columns,
  children,
  layout = "grid",
  selectedKey,
  ...props
}: {
  className?: string
  columns?: DesktopInspectorOptionGridColumns
  children: ReactNode
  layout?: "grid" | "row"
  selectedKey?: string | number | boolean | null
} & ComponentProps<"div">) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [selection, setSelection] = useState<DesktopInspectorOptionSelection | null>(null)
  const motionFrozen = useDesktopSettingsPanelMotionFrozen()
  const reduceMotion = useReducedMotion()
  const skipAppear = motionFrozen || Boolean(reduceMotion)

  const measureSelected = useCallback(() => {
    if (motionFrozen) {
      return
    }

    const container = containerRef.current
    if (!container) {
      return
    }

    const rect = measureDesktopInspectorOptionSelection(container)
    const key = resolveDesktopInspectorOptionSelectionKey(selectedKey)

    setSelection(rect ? { key, rect } : null)
  }, [motionFrozen, selectedKey])

  useLayoutEffect(() => {
    measureSelected()
  }, [measureSelected, selectedKey, children])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const viewport = container.closest<HTMLElement>('[data-slot="scroll-area-viewport"]')
    const resizeTarget = viewport ?? container

    const handleChange = () => {
      if (motionFrozen) {
        return
      }

      measureSelected()
    }

    let observer: ResizeObserver | undefined

    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(handleChange)
      observer.observe(container)
      container
        .querySelectorAll('[data-desktop-animated-option-selection="true"]')
        .forEach((node) => observer?.observe(node))
    }

    resizeTarget.addEventListener("scroll", handleChange, { passive: true })
    window.addEventListener("resize", handleChange)

    return () => {
      observer?.disconnect()
      resizeTarget.removeEventListener("scroll", handleChange)
      window.removeEventListener("resize", handleChange)
    }
  }, [measureSelected, motionFrozen, selectedKey])

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative",
        layout === "row"
          ? desktopInspectorOptionRowClass(className)
          : desktopInspectorOptionGridClass(columns ?? 3, className),
      )}
      {...props}
    >
      <AnimatePresence initial={false}>
        {selection ? (
          <m.div
            key={selection.key}
            data-slot="desktop-inspector-option-selection-indicator"
            className="pointer-events-none absolute z-0 rounded-[7px] border-2 border-[var(--desktop-inspector-option-selected-border)] bg-[var(--desktop-inspector-option-selected-bg)] shadow-[var(--desktop-inspector-option-selected-shadow)] backdrop-blur-[16px]"
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
                    transition: DESKTOP_INSPECTOR_OPTION_SELECTION_EXIT,
                  }
            }
            transition={
              skipAppear
                ? DESKTOP_INSPECTOR_FROZEN_MOTION_TRANSITION
                : DESKTOP_INSPECTOR_OPTION_SELECTION_APPEAR
            }
          />
        ) : null}
      </AnimatePresence>
      {children}
    </div>
  )
}

export type DesktopInspectorOptionGridRowKind =
  | "square"
  | "labeled"
  | "h-12"
  | "h-10"
  | "h-9"
  | "h-8"
  | "content"

export type DesktopInspectorOptionGridVariant = "preset" | "compact" | "content"

function desktopOptionGridScrollHeightClass({
  columns = 3,
  orientation = "vertical",
  rowKind,
  variant,
}: {
  columns?: DesktopInspectorOptionGridColumns
  orientation?: "vertical" | "horizontal"
  rowKind?: DesktopInspectorOptionGridRowKind
  variant: DesktopInspectorOptionGridVariant
}): string {
  if (orientation === "horizontal") {
    const resolvedRowKind: DesktopInspectorOptionGridRowKind =
      rowKind ?? (variant === "preset" ? "square" : columns === 4 ? "h-12" : "h-10")

    switch (resolvedRowKind) {
      case "square":
      case "labeled":
        return "h-[5.75rem]"
      case "h-12":
        return "h-14"
      case "h-10":
        return "h-12"
      case "h-9":
        return "h-11"
      case "h-8":
        return "h-10"
      case "content":
        return "h-[5.75rem]"
    }
  }

  const resolvedRowKind: DesktopInspectorOptionGridRowKind =
    rowKind ??
    (variant === "content"
      ? "content"
      : variant === "preset"
        ? "square"
        : columns === 4
          ? "h-12"
          : "h-10")

  switch (resolvedRowKind) {
    case "square":
      if (columns === 2) return "h-[24.75rem]"
      if (columns === 4) return "h-[12.75rem]"
      return "h-[16.5rem]"
    case "labeled":
      return columns === 2 ? "h-[20.25rem]" : "h-[16.5rem]"
    case "h-12":
      return "h-[10.5rem]"
    case "h-10":
      return "h-[7.125rem]"
    case "h-9":
      return "h-[6.75rem]"
    case "h-8":
      return "h-[6.375rem]"
    case "content":
      return "h-[11.625rem]"
  }
}

export function DesktopInspectorScrollArea({ children }: { children: ReactNode }) {
  return (
    <ScrollArea
      chevron
      cueSize="comfortable"
      data-slot="desktop-inspector-scroll-area"
      persistKey="inspector-body"
      scrollFade
      className="desktop-inspector-scroll-area min-h-0 min-w-0 w-full max-w-full flex-1"
      viewportClassName="min-w-0"
    >
      <div className="min-w-0 w-full max-w-full" data-slot="desktop-inspector-scroll">
        {children}
      </div>
    </ScrollArea>
  )
}

export function DesktopInspectorOptionGridScrollArea({
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
  ariaLabel: string
  children: ReactNode
  className?: string
  columns?: DesktopInspectorOptionGridColumns
  dataSlot: string
  orientation?: "vertical" | "horizontal"
  role?: "group" | "listbox"
  rowKind?: DesktopInspectorOptionGridRowKind
  shelfDataSlot?: string
  shelfId?: string
  variant: DesktopInspectorOptionGridVariant
}) {
  const isHorizontal = orientation === "horizontal"
  const heightClass = desktopOptionGridScrollHeightClass({
    columns,
    orientation,
    rowKind,
    variant,
  })
  const [horizontalNode, setHorizontalNode] = useState<HTMLDivElement | null>(null)
  const persistScope = useScrollPersistScope()
  const persistReactId = useId()
  usePersistedElementScroll(
    isHorizontal ? horizontalNode : null,
    resolveScrollPersistKey({
      dataSlot,
      scope: persistScope,
      reactId: persistReactId,
    }),
  )
  const shelfProps = {
    "aria-label": ariaLabel,
    "data-slot": shelfDataSlot ?? dataSlot.replace(/-scroll-area$/, ""),
    id: shelfId,
    role,
  } as const

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
    )
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
  )
}
