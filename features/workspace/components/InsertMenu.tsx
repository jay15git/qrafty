"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SecondaryButton } from "@/components/ui/secondary-button"
import { DesktopTooltip } from "@/features/desktop-shell/components/DesktopTooltip"
import { InsertMenuAddIcon } from "@/features/workspace/components/insert-menu/InsertMenuAddIcon"
import { InsertMenuPopoverContent } from "@/features/workspace/components/insert-menu/InsertMenuPopoverContent"
import { createDraftingTextLayer } from "@/features/workspace/model/layers"
import {
  Popover,
  PopoverTrigger,
} from "@/components/ui/popover"

type InsertMenuProps = {
  nodeId: string
  onInsertLayer: (layer: ReturnType<typeof createDraftingTextLayer>) => void
  canAddQrCode?: boolean
  onAddQrCode?: () => void
  onBrowseStockPhotos?: () => void
  onOpenCardPatternSettings?: () => void
  triggerClassName?: string
  suppressTooltip?: boolean
  variant?: "rail" | "toolbar" | "bottom-toolbar" | "dynamic-island"
}

export function InsertMenu({
  nodeId,
  onInsertLayer,
  canAddQrCode = true,
  onAddQrCode,
  onBrowseStockPhotos,
  onOpenCardPatternSettings,
  triggerClassName,
  suppressTooltip = false,
  variant = "rail",
}: InsertMenuProps) {
  const [open, setOpen] = useState(false)

  const isDesktopPopover = variant === "bottom-toolbar" || variant === "dynamic-island"

  const trigger =
    variant === "bottom-toolbar" || variant === "dynamic-island" ? (
      <Button
        aria-label="Add content"
        className={
          triggerClassName ??
          "h-8 w-8 rounded-md border-0 bg-transparent p-0 text-[var(--ws-ink-muted)] shadow-none transition-colors duration-150 hover:bg-transparent hover:text-[var(--ws-ink)]"
        }
        data-slot="drafting-insert-menu-trigger"
        size="icon-md"
        type="button"
        variant="ghost"
      >
        <InsertMenuAddIcon />
      </Button>
    ) : variant === "toolbar" ? (
      <Button
        className={triggerClassName}
        data-slot="drafting-insert-menu-trigger"
        type="button"
        variant="ghost"
      >
        + Insert
      </Button>
    ) : (
      <SecondaryButton
        className={triggerClassName ?? "h-9 w-full"}
        data-slot="drafting-insert-menu-trigger"
        type="button"
      >
        + Insert
      </SecondaryButton>
    )

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      {variant === "bottom-toolbar" || variant === "dynamic-island" ? (
        suppressTooltip ? (
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        ) : (
          <DesktopTooltip
            content="Add content"
            side={variant === "dynamic-island" ? "bottom" : "left"}
            sideOffset={10}
          >
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          </DesktopTooltip>
        )
      ) : (
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      )}
      {isDesktopPopover ? (
        <InsertMenuPopoverContent
          canAddQrCode={canAddQrCode}
          isDesktopPopover
          nodeId={nodeId}
          onAddQrCode={onAddQrCode}
          onBrowseStockPhotos={onBrowseStockPhotos}
          onInsertLayer={onInsertLayer}
          onOpenCardPatternSettings={onOpenCardPatternSettings}
          popoverSide={variant === "bottom-toolbar" ? "top" : "bottom"}
        />
      ) : (
        <InsertMenuPopoverContent
          canAddQrCode={canAddQrCode}
          isDesktopPopover={false}
          nodeId={nodeId}
          onAddQrCode={onAddQrCode}
          onBrowseStockPhotos={onBrowseStockPhotos}
          onInsertLayer={onInsertLayer}
          onOpenCardPatternSettings={onOpenCardPatternSettings}
        />
      )}
    </Popover>
  )
}
