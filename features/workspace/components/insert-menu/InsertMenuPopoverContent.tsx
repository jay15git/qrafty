"use client"

import { useRef, useState } from "react"
import { PopoverClose, PopoverContent } from "@/components/ui/popover"
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

type InsertMenuPopoverContentProps = {
  nodeId: string
  onInsertLayer: (layer: ReturnType<typeof createDraftingTextLayer>) => void
  canAddQrCode?: boolean
  onAddQrCode?: () => void
  onBrowseStockPhotos?: () => void
  onOpenCardPatternSettings?: () => void
  isDesktopPopover?: boolean
  popoverSide?: "top" | "bottom" | "left" | "right"
}

export function InsertMenuPopoverContent({
  nodeId,
  onInsertLayer,
  canAddQrCode = true,
  onAddQrCode,
  onBrowseStockPhotos,
  onOpenCardPatternSettings,
  isDesktopPopover = true,
  popoverSide = "bottom",
}: InsertMenuPopoverContentProps) {
  const [panel, setPanel] = useState<"root" | "shape" | "image" | "shader">("root")
  const [imageUrl, setImageUrl] = useState("")
  const closeRef = useRef<HTMLButtonElement>(null)

  function closeMenu() {
    setPanel("root")
    setImageUrl("")
    closeRef.current?.click()
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

  return (
    <PopoverContent
      align={isDesktopPopover ? "center" : "start"}
      className={
        isDesktopPopover
          ? cn(DESKTOP_INSERT_POPOVER_SHELL, "z-[20000]")
          : "w-[min(24rem,calc(100vw-2rem))] space-y-3 border-[var(--ws-line)] bg-[var(--ws-panel-bg)] p-3"
      }
      data-slot={isDesktopPopover ? "desktop-insert-menu-popover" : "drafting-insert-menu"}
      side={popoverSide}
      sideOffset={isDesktopPopover ? 12 : undefined}
      onCloseAutoFocus={() => {
        setPanel("root")
        setImageUrl("")
      }}
    >
      {panel === "root" ? (
        <InsertMenuRootPanel
          canAddQrCode={canAddQrCode}
          isDesktopPopover
          onAddQrCode={onAddQrCode ? addQrCode : undefined}
          onInsertText={() => {
            insertText()
          }}
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
          isDesktopPopover
          onBack={() => setPanel("root")}
          onSelectShape={insertShape}
        />
      ) : null}
      {panel === "shader" ? (
        <InsertMenuShaderPanel
          isDesktopPopover
          onBack={() => setPanel("root")}
          onSelectShader={insertShader}
        />
      ) : null}
      {panel === "image" ? (
        <InsertMenuImagePanel
          imageUrl={imageUrl}
          isDesktopPopover
          onBack={() => setPanel("root")}
          onBrowseStockPhotos={onBrowseStockPhotos ? browseStockPhotos : undefined}
          onImageUrlChange={setImageUrl}
          onInsertImage={insertImage}
        />
      ) : null}
      <PopoverClose ref={closeRef} className="sr-only" type="button">
        Close
      </PopoverClose>
    </PopoverContent>
  )
}
