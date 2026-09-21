"use client"

import { useLayoutEffect, useRef, type ReactNode } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { useMobileInspectorDensity } from "@/features/desktop-shell/inspector/mobile-inspector-density-context"
import { cn } from "@/lib/utils"

/** Row wrapper inside a horizontal settings rail. */
const MOBILE_SETTINGS_RAIL_ROW = "dn-mobile-rail"

/** Row wrapper for landscape card rails (wallpapers, previews). */
const MOBILE_SETTINGS_CARD_ROW = "dn-mobile-card-rail"

const OPTION_SHELF_COLUMNS: Record<number, string> = {
  3: "grid-cols-3",
  4: "grid-cols-4",
  6: "grid-cols-6",
}

/**
 * Horizontal option rail for mobile settings families.
 *
 * Native horizontal overflow, edge fade, no scrollbar, persisted offset. The
 * active option is recentred when the selection changes — not on first mount,
 * so a restored offset survives navigation.
 */
export function MobileSettingsRail({
  activeKey,
  ariaLabel,
  children,
  persistKey,
}: {
  activeKey?: string
  ariaLabel: string
  children: ReactNode
  persistKey?: string
}) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const mountedRef = useRef(false)

  useLayoutEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }

    const viewport = rootRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )
    if (!viewport) {
      return
    }

    const selected = viewport.querySelector<HTMLElement>(
      '[aria-pressed="true"], [aria-selected="true"], [data-selected="true"]',
    )
    if (!selected) {
      return
    }

    const viewportRect = viewport.getBoundingClientRect()
    const selectedRect = selected.getBoundingClientRect()
    if (viewportRect.width <= 0) {
      return
    }

    const delta =
      selectedRect.left -
      viewportRect.left -
      (viewportRect.width - selectedRect.width) / 2

    if (Math.abs(delta) < 1) {
      return
    }

    viewport.scrollLeft += delta
  }, [activeKey])

  return (
    <ScrollArea
      ref={rootRef}
      className="w-full min-w-0 max-w-full overflow-hidden"
      chevron={false}
      cueSize="tight"
      data-slot="mobile-settings-rail"
      orientation="horizontal"
      persistKey={persistKey}
      scrollFade
      showScrollbar={false}
      viewportClassName="min-w-0"
    >
      <div
        aria-label={ariaLabel}
        className={MOBILE_SETTINGS_RAIL_ROW}
        role="group"
      >
        {children}
      </div>
    </ScrollArea>
  )
}

/**
 * Option collection that renders as a horizontal rail on mobile and as the
 * existing fixed-column grid on desktop. Keeps one call site per shelf instead
 * of branching in every section.
 */
export function SettingsOptionShelf({
  activeKey,
  ariaLabel,
  children,
  columns = 6,
  dataSlot,
  gridClassName,
  label,
  persistKey,
}: {
  activeKey?: string
  ariaLabel: string
  children: ReactNode
  columns?: 3 | 4 | 6
  dataSlot?: string
  gridClassName?: string
  label?: string
  persistKey?: string
}) {
  const mobileDensity = useMobileInspectorDensity()

  if (mobileDensity) {
    return (
      <div className="dn-settings-shelf" data-slot={dataSlot}>
        {label ? (
          <span className="dn-row-label-text dn-settings-shelf__label">{label}</span>
        ) : null}
        <MobileSettingsRail
          activeKey={activeKey}
          ariaLabel={ariaLabel}
          persistKey={persistKey}
        >
          {children}
        </MobileSettingsRail>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <span className="dn-row-label-text flex h-[var(--dn-control-height)] items-center px-[var(--dn-row-px)]">
          {label}
        </span>
      ) : null}
      <div
        aria-label={ariaLabel}
        className={cn("grid gap-0", OPTION_SHELF_COLUMNS[columns], gridClassName)}
        data-slot={dataSlot}
        role="group"
      >
        {children}
      </div>
    </div>
  )
}

/** Horizontal rail for landscape card options, e.g. wallpapers. */
export function MobileCardRail({
  ariaLabel,
  children,
  persistKey,
}: {
  ariaLabel: string
  children: ReactNode
  persistKey?: string
}) {
  return (
    <ScrollArea
      className="w-full min-w-0 max-w-full overflow-hidden"
      chevron={false}
      cueSize="tight"
      data-slot="mobile-settings-rail"
      orientation="horizontal"
      persistKey={persistKey}
      scrollFade
      showScrollbar={false}
      viewportClassName="min-w-0"
    >
      <div
        aria-label={ariaLabel}
        className={MOBILE_SETTINGS_CARD_ROW}
        role="group"
      >
        {children}
      </div>
    </ScrollArea>
  )
}
