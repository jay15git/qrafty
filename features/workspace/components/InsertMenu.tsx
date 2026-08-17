"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DesktopTooltip } from "@/features/desktop-shell/components/DesktopTooltip"
import { InsertMenuAddIcon } from "@/features/workspace/components/insert-menu/InsertMenuAddIcon"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { SecondaryButton } from "@/components/ui/secondary-button"
import {
  InsertMenuImagePanel,
  InsertMenuRootPanel,
  InsertMenuShapePanel,
  InsertMenuShaderPanel,
} from "@/features/workspace/components/insert-menu/InsertMenuPanels"
import {
  createDraftingImageLayer,
  createDraftingShaderLayer,
  createDraftingShapeLayer,
  createDraftingTextLayer,
  type DraftingElementShapeId,
} from "@/features/workspace/model/layers"
import type { PaperShaderId } from "@/features/workspace/rendering/paper-shaders"
import { cn } from "@/lib/utils"

const DESKTOP_INSERT_POPOVER_SHELL =
  "w-[min(18rem,calc(100vw-2rem))] rounded-[20px] border border-white/[0.12] bg-black/70 p-2 text-white/84 shadow-[var(--desktop-glass-shadow)] backdrop-blur-2xl"

type InsertMenuProps = {
  nodeId: string
  onInsertLayer: (layer: ReturnType<typeof createDraftingTextLayer>) => void
  canAddQrCode?: boolean
  onAddQrCode?: () => void
  onBrowseStockPhotos?: () => void
  onOpenCardPatternSettings?: () => void
  triggerClassName?: string
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
  variant = "rail",
}: InsertMenuProps) {
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState<"root" | "shape" | "image" | "shader">("root")
  const [imageUrl, setImageUrl] = useState("")

  function closeMenu() {
    setOpen(false)
    setPanel("root")
    setImageUrl("")
  }

  function insertText() {
    onInsertLayer(createDraftingTextLayer(nodeId))
    closeMenu()
  }

  function insertShape(shapeId: DraftingElementShapeId) {
    onInsertLayer(createDraftingShapeLayer(nodeId, shapeId))
    closeMenu()
  }

  function insertShader(shaderId: PaperShaderId) {
    onInsertLayer(createDraftingShaderLayer(nodeId, shaderId))
    closeMenu()
  }

  function insertImage(value: string, source: "upload" | "url") {
    onInsertLayer(
      createDraftingImageLayer(nodeId, {
        imageSource: source,
        imageValue: value,
      }),
    )
    closeMenu()
  }

  function browseStockPhotos() {
    onBrowseStockPhotos?.()
    closeMenu()
  }

  function addQrCode() {
    onAddQrCode?.()
    closeMenu()
  }

  function openCardPatternSettings() {
    onOpenCardPatternSettings?.()
    closeMenu()
  }

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
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setPanel("root")
          setImageUrl("")
        }
      }}
    >
      {variant === "bottom-toolbar" || variant === "dynamic-island" ? (
        <DesktopTooltip
          content="Add content"
          side={variant === "dynamic-island" ? "bottom" : "left"}
          sideOffset={10}
        >
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        </DesktopTooltip>
      ) : (
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      )}
      <PopoverContent
        align={variant === "bottom-toolbar" || variant === "dynamic-island" ? "center" : variant === "toolbar" ? "start" : "center"}
        className={cn(
          isDesktopPopover
            ? cn(DESKTOP_INSERT_POPOVER_SHELL, "z-[20000]")
            : "w-[min(24rem,calc(100vw-2rem))] space-y-3 border-[var(--ws-line)] bg-[var(--ws-panel-bg)] p-3",
        )}
        data-slot={isDesktopPopover ? "desktop-insert-menu-popover" : "drafting-insert-menu"}
        side={variant === "dynamic-island" ? "bottom" : variant === "bottom-toolbar" ? "top" : undefined}
        sideOffset={variant === "bottom-toolbar" || variant === "dynamic-island" ? 12 : undefined}
      >
        {panel === "root" ? (
          <InsertMenuRootPanel
            canAddQrCode={canAddQrCode}
            isDesktopPopover={isDesktopPopover}
            onAddQrCode={onAddQrCode ? addQrCode : undefined}
            onInsertText={insertText}
            onOpenCardPatternSettings={
              onOpenCardPatternSettings ? openCardPatternSettings : undefined
            }
            onOpenImagePanel={() => setPanel("image")}
            onOpenShapePanel={() => setPanel("shape")}
            onOpenShaderPanel={() => setPanel("shader")}
          />
        ) : null}
        {panel === "shape" ? (
          <InsertMenuShapePanel
            isDesktopPopover={isDesktopPopover}
            onBack={() => setPanel("root")}
            onSelectShape={insertShape}
          />
        ) : null}
        {panel === "shader" ? (
          <InsertMenuShaderPanel
            isDesktopPopover={isDesktopPopover}
            onBack={() => setPanel("root")}
            onSelectShader={insertShader}
          />
        ) : null}
        {panel === "image" ? (
          <InsertMenuImagePanel
            imageUrl={imageUrl}
            isDesktopPopover={isDesktopPopover}
            onBack={() => setPanel("root")}
            onBrowseStockPhotos={onBrowseStockPhotos ? browseStockPhotos : undefined}
            onImageUrlChange={setImageUrl}
            onInsertImage={insertImage}
          />
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
