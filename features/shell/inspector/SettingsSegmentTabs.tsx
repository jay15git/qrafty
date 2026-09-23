"use client"

import { createPortal } from "react-dom"
import {
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { useMobileInspectorDensity } from "@/features/shell/inspector/MobileInspectorDensityContext"
import { useMobileSettingsTabDock } from "@/features/shell/inspector/MobileSettingsTabDock"
import { CUELUME_TOGGLE } from "@/features/shell/audio/cuelume"
import { cn } from "@/lib/utils"

type SegmentTabItem = {
  ariaLabel?: string
  icon?: ReactNode
  id: string
  label: string
}

type SegmentTabInput = string | SegmentTabItem

function normalizeSegmentTabItems(items: SegmentTabInput[]): SegmentTabItem[] {
  return items.map((item) =>
    typeof item === "string" ? { id: item, label: item } : item,
  )
}

function resolveActiveSegmentTab(items: SegmentTabItem[], value: string) {
  return items.find((item) => item.id === value || item.label === value)
}

export function SegmentTabs({
  items,
  value,
  onChange,
  className,
  variant = "primary",
  scrollable = false,
  persistKey,
}: {
  items: SegmentTabInput[]
  value: string
  onChange: (value: string) => void
  className?: string
  variant?: "primary" | "muted"
  scrollable?: boolean
  persistKey?: string
}) {
  const tablistRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)
  const tabRefs = useRef(new Map<string, HTMLButtonElement>())
  const activeKeyRef = useRef("")
  const hasPositionedPill = useRef(false)
  const mobileDensity = useMobileInspectorDensity()
  const dockTarget = useMobileSettingsTabDock({ enabled: mobileDensity })
  const normalizedItems = normalizeSegmentTabItems(items)
  const activeItem = resolveActiveSegmentTab(normalizedItems, value) ?? normalizedItems[0]
  const activeKey = activeItem?.id ?? value

  useEffect(() => {
    activeKeyRef.current = activeKey
  })

  const movePill = (key: string, animate: boolean) => {
    const pill = pillRef.current
    const tab = tabRefs.current.get(key)
    if (!pill || !tab) return

    if (!animate) {
      const previousTransition = pill.style.transition
      pill.style.transition = "none"
      pill.style.transform = `translateX(${tab.offsetLeft}px)`
      pill.style.width = `${tab.offsetWidth}px`
      void pill.offsetWidth
      pill.style.transition = previousTransition
      return
    }

    pill.style.transform = `translateX(${tab.offsetLeft}px)`
    pill.style.width = `${tab.offsetWidth}px`
  }

  useLayoutEffect(() => {
    movePill(activeKey, hasPositionedPill.current)
    hasPositionedPill.current = true
  }, [activeKey])

  useEffect(() => {
    if (!scrollable) return

    const tab = tabRefs.current.get(activeKey)
    if (!tab) return

    const timeout = window.setTimeout(() => {
      tab.scrollIntoView?.({ block: "nearest", inline: "nearest" })
    }, 220)

    return () => window.clearTimeout(timeout)
  }, [activeKey, scrollable])

  useLayoutEffect(() => {
    const tablist = tablistRef.current
    if (!tablist) return

    const observer = new ResizeObserver(() => {
      movePill(activeKeyRef.current, false)
    })
    observer.observe(tablist)
    return () => observer.disconnect()
  }, [])

  const tablist = (
    <div
      ref={tablistRef}
      className={cn(
        "t-tabs dn-tab-bar flex bg-transparent p-0 dn-squircle-xs",
        scrollable
          ? "dn-content-type-tab-bar min-w-max max-w-none"
          : "w-full max-w-full overflow-hidden",
        variant === "muted" && "t-tabs--muted",
        className,
      )}
      role="tablist"
    >
      <span
        ref={pillRef}
        aria-hidden
        className={cn("t-tabs-pill dn-squircle-xs", variant === "muted" && "t-tabs-pill--muted")}
      />
      {normalizedItems.map((item) => {
        const active = item.id === activeKey
        const hasIcon = Boolean(item.icon)

        return (
          <button
            key={item.id}
            ref={(element) => {
              if (element) tabRefs.current.set(item.id, element)
              else tabRefs.current.delete(item.id)
            }}
            aria-label={item.ariaLabel ?? item.label}
            className={cn(
              "t-tab dn-segment-tab dn-pressable-press-only dn-type-chip flex dn-squircle-xs",
              scrollable || hasIcon
                ? "dn-content-type-segment-tab shrink-0 flex-row items-center justify-center gap-1.5 px-2.5"
                : "min-w-0 flex-1 items-center justify-center px-2",
              variant === "muted" && "dn-segment-tab--muted",
              active ? "text-[var(--fg)]" : "bg-transparent text-[var(--muted)]",
            )}
            role="tab"
            type="button"
            aria-selected={active}
            {...CUELUME_TOGGLE}
            onClick={() => onChange(item.id)}
          >
            {item.icon ? (
              <>
                {item.icon}
                <span className="dn-content-type-segment-label">{item.label}</span>
              </>
            ) : (
              item.label
            )}
          </button>
        )
      })}
    </div>
  )

  function wrapInScroller() {
    return (
      <ScrollArea
        className="h-auto w-full min-w-0 max-w-full overflow-hidden"
        chevron={false}
        cueSize="tight"
        orientation="horizontal"
        persistKey={persistKey ?? "segment-tabs"}
        scrollFade
        showScrollbar={false}
        viewportClassName="min-w-0 overscroll-x-contain"
      >
        {tablist}
      </ScrollArea>
    )
  }

  if (dockTarget) {
    return createPortal(scrollable ? wrapInScroller() : tablist, dockTarget)
  }

  if (scrollable) {
    return wrapInScroller()
  }

  return tablist
}
