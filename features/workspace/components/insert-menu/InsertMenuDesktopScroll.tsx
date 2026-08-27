"use client"

import type { ReactNode } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { INSERT_MENU_SCROLL_CLASS } from "@/features/workspace/components/insert-menu/insert-menu-styles"
import { cn } from "@/lib/utils"

export function InsertMenuDesktopScroll({
  children,
  className,
  contentClassName,
}: {
  children: ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <ScrollArea
      className={cn(INSERT_MENU_SCROLL_CLASS, className)}
      chevron={false}
      scrollFade
      showScrollbar={false}
      viewportClassName="px-0"
    >
      <div className={cn("dn-insert-menu-scroll-content", contentClassName)}>{children}</div>
    </ScrollArea>
  )
}
