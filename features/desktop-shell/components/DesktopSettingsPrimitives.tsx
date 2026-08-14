"use client"

import type { ReactNode } from "react"
import { ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

function DesktopSettingsRow({
  children,
  className,
  label,
  value,
}: {
  children: ReactNode
  className?: string
  label: string
  value?: ReactNode
}) {
  return (
    <div className={cn(className)} data-slot="desktop-settings-row">
      <span data-slot="desktop-settings-row-label">{label}</span>
      <div data-slot="desktop-settings-row-value">{value ?? children}</div>
    </div>
  )
}

export function DesktopSettingsPopover({
  children,
  hidePopoverTitle = false,
  hideRowSummary = false,
  label,
  popoverTitle,
  summary,
  className,
  side = "left",
}: {
  children: ReactNode
  /** Hides the popover header when the accordion section already names the setting. */
  hidePopoverTitle?: boolean
  /** Hides the trailing summary when the accordion header already shows the value. */
  hideRowSummary?: boolean
  label: string
  popoverTitle?: string
  summary: ReactNode
  className?: string
  side?: "left" | "right" | "top" | "bottom"
}) {
  const resolvedPopoverTitle = popoverTitle ?? label

  return (
    <Popover>
      <DesktopSettingsRow
        label={label}
        value={
          <PopoverTrigger asChild>
            <Button
              aria-label={`Edit ${label}`}
              className="h-auto max-w-[9rem] gap-1 rounded-sm border-0 bg-transparent p-0 text-xs font-normal text-[var(--desktop-inspector-fg-muted)] shadow-none hover:bg-transparent hover:text-[var(--desktop-inspector-fg-primary)]"
              size="sm"
              variant="ghost"
            >
              {hideRowSummary ? null : <span className="truncate">{summary}</span>}
              <ChevronRightIcon aria-hidden="true" className="size-3 shrink-0 text-[var(--desktop-inspector-fg-muted)]" />
            </Button>
          </PopoverTrigger>
        }
      >
        {null}
      </DesktopSettingsRow>
      <PopoverContent
        align="start"
        className={cn(
          "w-[min(16.25rem,calc(100vw-2rem))] rounded-[14px] border-0 bg-[var(--desktop-inspector-elevated)] p-3.5 shadow-[var(--desktop-inspector-popover-shadow)]",
          className,
        )}
        data-slot="desktop-settings-popover-content"
        side={side}
        sideOffset={8}
      >
        {hidePopoverTitle ? null : (
          <div className="mb-3 text-[13px] font-medium text-[var(--desktop-inspector-fg-primary)]">
            {resolvedPopoverTitle}
          </div>
        )}
        {children}
      </PopoverContent>
    </Popover>
  )
}

export function DesktopSettingsStack({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn(className)} data-slot="desktop-settings-stack">
      {children}
    </div>
  )
}
