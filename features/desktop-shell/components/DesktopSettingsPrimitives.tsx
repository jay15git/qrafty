"use client"

import type { ReactNode } from "react"
import { ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export function DesktopSettingsRow({
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
    <div
      className={cn(
        "flex min-h-10 items-center justify-between gap-3 border-b border-border/60 px-3 py-2 last:border-b-0",
        className,
      )}
      data-slot="desktop-settings-row"
    >
      <span className="min-w-0 truncate text-[13px] font-medium text-foreground">{label}</span>
      <div className="flex min-w-0 items-center justify-end gap-2">{value ?? children}</div>
    </div>
  )
}

export function DesktopSettingsPopover({
  children,
  label,
  summary,
  className,
  side = "left",
}: {
  children: ReactNode
  label: string
  summary: ReactNode
  className?: string
  side?: "left" | "right" | "top" | "bottom"
}) {
  return (
    <Popover>
      <DesktopSettingsRow
        label={label}
        value={
          <PopoverTrigger asChild>
            <Button
              aria-label={`Edit ${label}`}
              className="h-8 max-w-[11rem] gap-1 rounded-sm px-2 text-xs font-medium"
              size="sm"
              variant="ghost"
            >
              <span className="truncate">{summary}</span>
              <ChevronRightIcon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
        }
      >
        {null}
      </DesktopSettingsRow>
      <PopoverContent
        align="start"
        className={cn("w-[min(22rem,calc(100vw-2rem))] rounded-md p-3", className)}
        side={side}
        sideOffset={8}
      >
        <div className="mb-3 text-xs font-semibold text-foreground">{label}</div>
        {children}
      </PopoverContent>
    </Popover>
  )
}

export function DesktopSettingsStack({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("overflow-hidden rounded-md border border-border bg-background", className)}
      data-slot="desktop-settings-stack"
    >
      {children}
    </div>
  )
}
