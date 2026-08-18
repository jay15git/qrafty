"use client"

import { useRef, useState } from "react"
import { PopoverClose, PopoverContent } from "@/components/ui/popover"
import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import {
  InsertMenuEmojiPanel,
  InsertMenuImagePanel,
  InsertMenuRootPanel,
  InsertMenuShapePanel,
  InsertMenuShaderPanel,
} from "@/features/workspace/components/insert-menu/InsertMenuPanels"
import {
  INSERT_MENU_EMOJI_POPOVER_WIDTH,
  INSERT_MENU_POPOVER_SHELL,
  INSERT_MENU_POPOVER_WIDTH,
  insertMenuPortalClass,
} from "@/features/workspace/components/insert-menu/insert-menu-styles"
import {
  createDraftingImageLayer,
  createDraftingShaderLayer,
  createDraftingShapeLayer,
  createDraftingTextLayer,
  type DraftingElementShapeId,
} from "@/features/workspace/model/layers"
import type { PaperShaderId } from "@/features/workspace/rendering/paper-shaders"
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
  const [panel, setPanel] = useState<"root" | "shape" | "image" | "shader" | "emoji">("root")
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

  function insertEmoji(emoji: string) {
    onInsertLayer(
      createDraftingTextLayer(nodeId, {
        fontSize: 64,
        lineHeight: 1,
        text: emoji,
      }),
    )
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

  return (
    <PopoverContent
      align={isDesktopPopover ? "center" : "start"}
      className={
        isDesktopPopover
          ? insertMenuPortalClass(
              theme,
              cn(
                INSERT_MENU_POPOVER_SHELL,
                panel === "emoji" ? INSERT_MENU_EMOJI_POPOVER_WIDTH : INSERT_MENU_POPOVER_WIDTH,
              ),
            )
          : "w-[min(24rem,calc(100vw-2rem))] space-y-3 border-[var(--ws-line)] bg-[var(--ws-panel-bg)] p-3"
      }
      data-slot={isDesktopPopover ? "desktop-insert-menu-popover" : "drafting-insert-menu"}
      data-theme={isDesktopPopover ? theme : undefined}
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
          isDesktopPopover={isDesktopPopover}
          onAddQrCode={onAddQrCode ? addQrCode : undefined}
          onInsertText={() => {
            insertText()
          }}
          onOpenEmojiPanel={() => setPanel("emoji")}
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
      {panel === "emoji" ? (
        <InsertMenuEmojiPanel
          isDesktopPopover={isDesktopPopover}
          onBack={() => setPanel("root")}
          onSelectEmoji={insertEmoji}
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
      <PopoverClose ref={closeRef} className="sr-only" type="button">
        Close
      </PopoverClose>
    </PopoverContent>
  )
}
