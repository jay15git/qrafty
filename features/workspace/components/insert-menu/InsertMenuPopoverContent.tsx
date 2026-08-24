"use client"

import { useRef } from "react"
import { PopoverClose, PopoverContent } from "@/components/ui/popover"
import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import { InsertMenuPanelStack } from "@/features/workspace/components/insert-menu/InsertMenuPanelStack"
import {
  INSERT_MENU_POPOVER_SHELL,
  INSERT_MENU_POPOVER_WIDTH,
  insertMenuPortalClass,
} from "@/features/workspace/components/insert-menu/insert-menu-styles"
import { createDraftingTextLayer } from "@/features/workspace/model/layers"
import { cn } from "@/lib/utils"

import "@/features/desktop-shell/inspector/desktopnew.css"

type InsertMenuPopoverContentProps = {
  nodeId: string
  onInsertLayer: (layer: ReturnType<typeof createDraftingTextLayer>) => void
  canAddQrCode?: boolean
  onAddQrCode?: () => void
  onBrowseStockPhotos?: () => void
  isDesktopPopover?: boolean
  popoverSide?: "top" | "bottom" | "left" | "right"
  theme?: DesktopThemeMode
}

export function InsertMenuPopoverContent({
  nodeId,
  onInsertLayer,
  canAddQrCode = true,
  onAddQrCode,
  onBrowseStockPhotos,
  isDesktopPopover = true,
  popoverSide = "bottom",
  theme = "dark",
}: InsertMenuPopoverContentProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  function closeMenu() {
    closeRef.current?.click()
  }

  return (
    <PopoverContent
      align={isDesktopPopover ? "center" : "start"}
      className={
        isDesktopPopover
          ? insertMenuPortalClass(
              theme,
              cn(INSERT_MENU_POPOVER_SHELL, INSERT_MENU_POPOVER_WIDTH),
            )
          : "w-[min(24rem,calc(100vw-2rem))] space-y-3 border-[var(--ws-line)] bg-[var(--ws-panel-bg)] p-3"
      }
      data-slot={isDesktopPopover ? "desktop-insert-menu-popover" : "drafting-insert-menu"}
      data-theme={isDesktopPopover ? theme : undefined}
      side={popoverSide}
      sideOffset={isDesktopPopover ? 12 : undefined}
    >
      <InsertMenuPanelStack
        canAddQrCode={canAddQrCode}
        isDesktopPopover={isDesktopPopover}
        nodeId={nodeId}
        onAddQrCode={onAddQrCode}
        onBrowseStockPhotos={onBrowseStockPhotos}
        onClose={closeMenu}
        onInsertLayer={onInsertLayer}
        theme={theme}
      />
      <PopoverClose ref={closeRef} className="sr-only" type="button">
        Close
      </PopoverClose>
    </PopoverContent>
  )
}
