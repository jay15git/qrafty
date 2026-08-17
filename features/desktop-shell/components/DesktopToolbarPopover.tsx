"use client"

import { useState, type ReactNode } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DesktopTooltip } from "@/features/desktop-shell/components/DesktopTooltip"
import { cn } from "@/lib/utils"

export function DesktopToolbarPopoverContent({
  children,
  dataSlot = "desktop-toolbar-popover",
  fitContent = false,
  flush = false,
}: {
  children: ReactNode
  dataSlot?: string
  fitContent?: boolean
  flush?: boolean
}) {
  const heightClass = fitContent
    ? "max-h-[min(28rem,calc(100dvh-8rem))]"
    : "h-[min(28rem,calc(100dvh-8rem))] max-h-[min(28rem,calc(100dvh-8rem))]"

  return (
    <PopoverContent
      align="center"
      data-slot={dataSlot}
      side="bottom"
      sideOffset={12}
      className={cn(
        "z-[20000] flex w-[min(18rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-[16px] border border-[var(--desktop-appearance-popover-border)] bg-[var(--desktop-appearance-popover-bg)] p-0 text-[var(--desktop-inspector-fg-secondary)] shadow-[var(--desktop-appearance-popover-shadow)]",
        heightClass,
      )}
    >
      <ScrollArea
        chevron
        cueSize="comfortable"
        className={cn(fitContent ? "min-h-0" : "h-full min-h-0 flex-1")}
        data-slot="desktop-inspector-scroll-area"
        scrollFade
        viewportClassName={flush ? "p-0" : "px-3 py-3"}
      >
        <div data-slot="desktop-inspector-scroll">{children}</div>
      </ScrollArea>
    </PopoverContent>
  )
}

export function DesktopToolbarPopover({
  children,
  dataSlot = "desktop-toolbar-popover",
  label,
  trigger,
  triggerClassName,
  triggerDataSlot,
  triggerOpenClassName,
  suppressTooltip = false,
}: {
  children: ReactNode
  dataSlot?: string
  label: string
  trigger: ReactNode
  suppressTooltip?: boolean
  triggerClassName?: string
  triggerDataSlot?: string
  triggerOpenClassName?: string
}) {
  const [open, setOpen] = useState(false)

  const triggerButton = (
    <PopoverTrigger asChild>
      <button
        aria-label={label}
        className={cn(
          "relative grid size-9 cursor-pointer place-items-center overflow-visible rounded-full border-0 bg-transparent p-0 text-current shadow-none transition-colors duration-150 hover:bg-white/10 hover:text-[var(--desktop-glass-button-hover-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--desktop-glass-button-focus-ring)] disabled:cursor-not-allowed [&_svg]:size-3.5",
          open && triggerOpenClassName,
          triggerClassName,
        )}
        data-slot={triggerDataSlot}
        type="button"
      >
        {trigger}
      </button>
    </PopoverTrigger>
  )

  return (
    <Popover modal={false} open={open} onOpenChange={setOpen}>
      {suppressTooltip ? (
        triggerButton
      ) : (
        <DesktopTooltip content={label} side="bottom" sideOffset={10}>
          {triggerButton}
        </DesktopTooltip>
      )}
      <DesktopToolbarPopoverContent dataSlot={dataSlot}>{children}</DesktopToolbarPopoverContent>
    </Popover>
  )
}
