"use client"

import { useState, type ReactNode } from "react"
import { Slot as SlotPrimitive } from "radix-ui"
import { m } from "motion/react"
import { Drawer } from "vaul"

import { usePersistedScrollNode } from "@/lib/persisted-element-scroll"
import { cn } from "@/lib/utils"
import { useFamilyDrawer } from "./context"

const DEFAULT_VIEW_ACCESSIBILITY_TITLES: Record<string, string> = {
  default: "Settings",
  content: "Content",
  qr: "Style",
  color: "Color",
  motion: "Motion",
  shape: "Shape",
  background: "Background",
  elements: "Elements",
  element: "Layer style",
  "wallpapers": "Wallpapers",
  "setting-detail": "Setting",
}

type FamilyDrawerContentProps = {
  children: ReactNode
  className?: string
  asChild?: boolean
  variant?: "card" | "sheet"
  /** Screen-reader label for the drawer dialog. Falls back to the active view name. */
  accessibilityTitle?: string
  /** Pixel cap for the animated frame; overflowing content uses this frame's native scroller. */
  maxHeight?: number
} & Record<string, unknown>

export function FamilyDrawerContent({
  children,
  className,
  asChild = false,
  variant = "card",
  accessibilityTitle,
  maxHeight,
  ...rest
}: FamilyDrawerContentProps) {
  const { bounds, view } = useFamilyDrawer()
  const setScrollFrameRef = usePersistedScrollNode(`family-drawer-frame:${view}`)
  const [lastPositiveHeight, setLastPositiveHeight] = useState(0)
  const isCapped = maxHeight !== undefined
  const dialogTitle =
    accessibilityTitle ??
    DEFAULT_VIEW_ACCESSIBILITY_TITLES[view] ??
    DEFAULT_VIEW_ACCESSIBILITY_TITLES.default

  // Remember the last non-zero measured height so a transient 0 (the frame
  // collapsing mid-transition) doesn't snap the card to nothing. State, not a
  // ref, so the fallback below is a render input; adjusted during render to
  // avoid an extra commit.
  if (bounds.height > 0 && bounds.height !== lastPositiveHeight) {
    setLastPositiveHeight(bounds.height)
  }

  const measuredHeight =
    bounds.height > 0 ? bounds.height : lastPositiveHeight
  const displayedHeight = isCapped
    ? Math.min(measuredHeight, maxHeight)
    : measuredHeight

  const variantClass =
    variant === "sheet"
      ? "fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-h-[min(70dvh,32rem)] overflow-hidden rounded-t-[28px] bg-background outline-none pb-[env(safe-area-inset-bottom,0px)]"
      : "fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] z-30 overflow-hidden rounded-[36px] bg-background outline-none"

  const content = (
    <m.div
      layout
      style={{ height: displayedHeight }}
      transition={{
        duration: 0.27,
        ease: [0.25, 1, 0.5, 1],
      }}
      className={
        isCapped
          ? "min-w-0 overflow-hidden"
          : undefined
      }
    >
      <Drawer.Title className="sr-only">{dialogTitle}</Drawer.Title>
      {isCapped ? (
        <div
          ref={setScrollFrameRef}
          className="h-full min-w-0 overflow-x-clip overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          data-vaul-no-drag=""
        >
          {children}
        </div>
      ) : (
        children
      )}
    </m.div>
  )

  if (asChild && !isCapped) {
    return (
      <Drawer.Content asChild className={cn(variantClass, className)} {...rest}>
        <SlotPrimitive.Slot>{content}</SlotPrimitive.Slot>
      </Drawer.Content>
    )
  }

  return (
    <Drawer.Content className={cn(variantClass, className)} {...rest}>
      {content}
    </Drawer.Content>
  )
}
