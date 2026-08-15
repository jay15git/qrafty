"use client"

import * as React from "react"
import { m } from "motion/react"

import { cn } from "@/lib/utils"

import {
  getAccordionScrollAdjustment,
  getNextOpenItemId,
  getNextOpenItemIds,
} from "@/components/vendor/unlumen-ui/motion-accordion.utils"

export interface MotionAccordionItem {
  id: string
  title: React.ReactNode
  content: React.ReactNode
  onToggle?: (isOpen: boolean) => void
}

export interface MotionAccordionProps {
  items: MotionAccordionItem[]
  openItemId?: string | null
  openItemIds?: string[]
  onOpenItemChange?: (itemId: string | null) => void
  onOpenItemIdsChange?: (itemIds: string[]) => void
  allowCollapse?: boolean
  gap?: number
  className?: string
  variant?: "card" | "settings"
}

function findScrollableParent(element: HTMLElement | null) {
  let current = element?.parentElement ?? null

  while (current) {
    const style = window.getComputedStyle(current)
    const isScrollable = /(auto|scroll)/.test(style.overflowY)

    if (isScrollable && current.scrollHeight > current.clientHeight) {
      return current
    }

    current = current.parentElement
  }

  return null
}

function AccordionItem({
  item,
  isOpen,
  onSelect,
  itemId,
  panelId,
  variant,
}: {
  item: MotionAccordionItem
  isOpen: boolean
  onSelect: () => void
  itemId: string
  panelId: string
  variant: "card" | "settings"
}) {
  const itemRef = React.useRef<HTMLDivElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [contentH, setContentH] = React.useState(0)
  const isSettingsVariant = variant === "settings"

  React.useEffect(() => {
    const element = contentRef.current

    if (!element) {
      return
    }

    const updateHeight = () => setContentH(element.scrollHeight)

    if (typeof ResizeObserver === "undefined") {
      updateHeight()
      return
    }

    const observer = new ResizeObserver(updateHeight)
    observer.observe(element)
    updateHeight()

    return () => observer.disconnect()
  }, [item.id])

  React.useEffect(() => {
    if (!isOpen) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      const itemElement = itemRef.current
      const panelElement = panelRef.current

      if (!itemElement || !panelElement) {
        return
      }

      const scrollParent = findScrollableParent(itemElement)

      if (!scrollParent) {
        return
      }

      const itemRect = itemElement.getBoundingClientRect()
      const panelRect = panelElement.getBoundingClientRect()
      const parentRect = scrollParent.getBoundingClientRect()
      const adjustment = getAccordionScrollAdjustment({
        containerBottom: parentRect.bottom,
        containerTop: parentRect.top,
        itemBottom: itemRect.bottom,
        itemTop: itemRect.top,
        targetContentHeight: contentH,
        visiblePanelHeight: panelRect.height,
      })

      if (adjustment !== 0) {
        scrollParent.scrollTo({
          top: scrollParent.scrollTop + adjustment,
          behavior: "smooth",
        })
      }
    })

    return () => window.cancelAnimationFrame(frame)
  }, [contentH, isOpen])

  return (
    <m.div
      ref={itemRef}
      layout
      data-slot="motion-accordion-item"
      data-item-id={item.id}
      data-state={isOpen ? "open" : "closed"}
      className={cn(
        "overflow-hidden",
        isSettingsVariant
          ? "w-full border-b border-white/6 bg-transparent text-foreground shadow-none first:border-t"
          : "rounded-[30px] bg-foreground text-background shadow-[0_20px_45px_-30px_rgba(0,0,0,0.65)]",
        !isSettingsVariant &&
          isOpen &&
          "border-foreground/25 shadow-[0_28px_60px_-34px_rgba(0,0,0,0.72)]",
      )}
      transition={{ type: "spring", stiffness: 280, damping: 28, mass: 0.9 }}
      animate={{ scale: isSettingsVariant ? 1 : isOpen ? 1 : 0.985 }}
      initial={false}
      style={{ originX: 0.5, originY: 0 }}
    >
      <button
        id={itemId}
        type="button"
        aria-controls={panelId}
        aria-expanded={isOpen}
        data-slot="motion-accordion-trigger"
        onClick={onSelect}
        className={cn(
          "flex w-full cursor-pointer select-none items-center justify-between gap-4 text-left",
          isSettingsVariant ? "px-0 py-3.5" : "px-7 py-5",
        )}
      >
        <span
          className={cn(
            "leading-snug",
            isSettingsVariant
              ? "text-[0.78rem] font-medium tracking-[0.16em] uppercase text-foreground/70"
              : "text-[clamp(1.2rem,1.6vw,1.3rem)] font-semibold",
          )}
        >
          {item.title}
        </span>

        {isSettingsVariant ? (
          <span
            aria-hidden="true"
            data-slot="motion-accordion-toggle"
            data-state={isOpen ? "open" : "closed"}
            className={cn(
              "relative inline-flex h-6 w-10 flex-shrink-0 items-center rounded-full border transition-colors duration-200",
              isOpen
                ? "border-white/10 bg-white/[0.12]"
                : "border-white/8 bg-white/[0.03]",
            )}
          >
            <span
              className={cn(
                "h-4.5 w-4.5 rounded-full bg-[color:var(--color-card)] transition-transform duration-200",
                isOpen ? "translate-x-[18px]" : "translate-x-[3px]",
              )}
            />
          </span>
        ) : (
          <m.div
            aria-hidden="true"
            data-slot="motion-accordion-icon"
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 480, damping: 28 }}
            className="flex-shrink-0 text-background/60"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 13 13"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6.5 0v13M0 6.5h13"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </m.div>
        )}
      </button>

      <m.div
        ref={panelRef}
        id={panelId}
        role="region"
        aria-labelledby={itemId}
        aria-hidden={!isOpen}
        data-slot="motion-accordion-panel"
        data-state={isOpen ? "open" : "closed"}
        animate={{
          height: isOpen ? contentH : 0,
          opacity: isOpen ? 1 : 0,
        }}
        initial={false}
        transition={{
          height: { type: "spring", stiffness: 340, damping: 34, mass: 0.9 },
          opacity: { duration: 0.2, ease: "easeOut" },
        }}
        style={{ overflow: "hidden" }}
      >
        <m.div
          ref={contentRef}
          animate={{ y: isOpen ? 0 : -8 }}
          initial={false}
          transition={{
            type: "spring",
            stiffness: 360,
            damping: 30,
            mass: 0.8,
          }}
          className={cn(isSettingsVariant ? "pb-5" : "px-7 pb-7")}
        >
          <div
            className={cn(
              isSettingsVariant
                ? "pt-1"
                : "text-[0.98rem] leading-8 text-background/65",
            )}
          >
            {item.content}
          </div>
        </m.div>
      </m.div>
    </m.div>
  )
}

export function MotionAccordion({
  items,
  openItemId = null,
  openItemIds,
  onOpenItemChange,
  onOpenItemIdsChange,
  allowCollapse = true,
  gap = 12,
  className,
  variant = "card",
}: MotionAccordionProps) {
  const rawId = React.useId()
  const baseId = `accordion-${rawId.replace(/:/g, "")}`
  const isMultiOpen = openItemIds !== undefined
  const openItemIdSet = React.useMemo(
    () => (isMultiOpen && openItemIds ? new Set(openItemIds) : null),
    [isMultiOpen, openItemIds],
  )

  return (
    <div data-slot="motion-accordion" className={cn("w-full", className)}>
      <div className="flex flex-col" style={{ gap }}>
        {items.map((item, index) => {
          const isOpen = isMultiOpen
            ? (openItemIdSet?.has(item.id) ?? false)
            : openItemId === item.id

          return (
            <AccordionItem
              key={item.id}
              item={item}
              isOpen={isOpen}
              variant={variant}
              onSelect={() => {
                if (isMultiOpen) {
                  const nextOpenItemIds = getNextOpenItemIds(
                    openItemIds,
                    item.id,
                    allowCollapse,
                  )

                  onOpenItemIdsChange?.(nextOpenItemIds)
                  item.onToggle?.(nextOpenItemIds.includes(item.id))
                  return
                }

                const nextOpenItemId = getNextOpenItemId(
                  openItemId,
                  item.id,
                  allowCollapse,
                )

                onOpenItemChange?.(nextOpenItemId)
                item.onToggle?.(nextOpenItemId === item.id)
              }}
              itemId={`${baseId}-trigger-${index}`}
              panelId={`${baseId}-panel-${index}`}
            />
          )
        })}
      </div>
    </div>
  )
}
