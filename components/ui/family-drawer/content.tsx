"use client";

import { useState, type ReactNode } from "react";
import { Slot as SlotPrimitive } from "radix-ui";
import { m } from "motion/react";
import { Drawer } from "vaul";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useFamilyDrawer } from "./context";

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
  wallpapers: "Wallpapers",
  "setting-detail": "Setting",
};

type FamilyDrawerContentProps = {
  children: ReactNode;
  className?: string;
  asChild?: boolean;
  variant?: "card" | "sheet";
  /** Screen-reader label for the drawer dialog. Falls back to the active view name. */
  accessibilityTitle?: string;
  /** Pixel cap for the animated frame; overflowing content uses this frame's native scroller. */
  maxHeight?: number;
} & Record<string, unknown>;

export function FamilyDrawerContent({
  children,
  className,
  asChild = false,
  variant = "card",
  accessibilityTitle,
  maxHeight,
  ...rest
}: FamilyDrawerContentProps) {
  const { bounds, isOpen, measuringOpen, snapHeight, view } = useFamilyDrawer();
  const [lastPositiveHeight, setLastPositiveHeight] = useState(0);
  const isCapped = maxHeight !== undefined;
  const dialogTitle =
    accessibilityTitle ??
    DEFAULT_VIEW_ACCESSIBILITY_TITLES[view] ??
    DEFAULT_VIEW_ACCESSIBILITY_TITLES.default;

  // Remember the last non-zero measured height so a transient 0 (the frame
  // collapsing mid-transition) doesn't snap the card to nothing. Only tracked
  // while open — once the drawer starts its exit slide the height freezes, so
  // callers unmounting content on close can't shrink the card mid-slide.
  if (isOpen && bounds.height > 0 && bounds.height !== lastPositiveHeight) {
    setLastPositiveHeight(bounds.height);
  }

  const measuredHeight = isOpen
    ? bounds.height > 0
      ? bounds.height
      : lastPositiveHeight
    : lastPositiveHeight;
  const displayedHeight = isCapped ? Math.min(measuredHeight, maxHeight) : measuredHeight;

  const variantClass =
    variant === "sheet"
      ? "fixed inset-x-0 bottom-0 z-[var(--z-chrome)] mx-auto w-full max-h-[min(70dvh,32rem)] overflow-hidden rounded-t-[28px] bg-background outline-none pb-[env(safe-area-inset-bottom,0px)]"
      : "fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] z-[var(--z-chrome)] overflow-hidden rounded-[36px] bg-background outline-none";

  const content = (
    <m.div
      // While measuringOpen the stored bounds belong to the previous open —
      // render `auto` instead of animating toward a stale height. snapHeight
      // lands the first real measurement instantly (duration 0). max-height
      // still applies during `auto` so tall content can't blow past the cap
      // while the measurement is pending.
      animate={{ height: measuringOpen || displayedHeight <= 0 ? "auto" : displayedHeight }}
      initial={false}
      style={{ maxHeight: isCapped ? maxHeight : undefined }}
      transition={{
        duration: snapHeight ? 0 : 0.27,
        ease: [0.25, 1, 0.5, 1],
      }}
      className="min-w-0 overflow-hidden"
    >
      <Drawer.Title className="sr-only">{dialogTitle}</Drawer.Title>
      {isCapped ? (
        <ScrollArea
          chevron={false}
          // Own the cap too: while the frame is height:auto (measuringOpen),
          // h-full alone lets the area render at natural height and the frame
          // clips it with overflow-hidden — bottom rows unreachable.
          className="h-full min-w-0 overscroll-contain"
          cueSize="tight"
          persistKey={`family-drawer-frame:${view}`}
          style={{ maxHeight }}
          viewportClassName="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-h-[inherit]"
          data-vaul-no-drag=""
        >
          {children}
        </ScrollArea>
      ) : (
        children
      )}
    </m.div>
  );

  if (asChild && !isCapped) {
    return (
      <Drawer.Content asChild className={cn(variantClass, className)} {...rest}>
        <SlotPrimitive.Slot>{content}</SlotPrimitive.Slot>
      </Drawer.Content>
    );
  }

  return (
    <Drawer.Content className={cn(variantClass, className)} {...rest}>
      {content}
    </Drawer.Content>
  );
}
