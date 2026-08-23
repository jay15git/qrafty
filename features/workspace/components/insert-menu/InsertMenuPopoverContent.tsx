"use client"

import { useRef, useState } from "react"
import { PopoverClose, PopoverContent } from "@/components/ui/popover"
import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import {
  InsertMenuEmojiPanel,
  InsertMenuIllustrationPanel,
  InsertMenuIllustrationSetPanel,
  InsertMenuImagePanel,
  InsertMenuRootPanel,
  InsertMenuShapePanel,
} from "@/features/workspace/components/insert-menu/InsertMenuPanels"
import {
  INSERT_MENU_EMOJI_POPOVER_WIDTH,
  INSERT_MENU_POPOVER_SHELL,
  INSERT_MENU_POPOVER_WIDTH,
  insertMenuPortalClass,
} from "@/features/workspace/components/insert-menu/insert-menu-styles"
import {
  createDraftingImageLayer,
  createDraftingShapeLayer,
  createDraftingTextLayer,
  type DraftingElementShapeId,
} from "@/features/workspace/model/layers"
import {
  getIllustrationSet,
  type IllustrationAsset,
  type IllustrationSetId,
} from "@/features/workspace/assets/illustration-sets"
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
  const [panel, setPanel] = useState<
    "root" | "shape" | "image" | "emoji" | "illustration" | "illustration-set"
  >("root")
  const [imageUrl, setImageUrl] = useState("")
  const [illustrationSetId, setIllustrationSetId] = useState<IllustrationSetId | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const activeIllustrationSet =
    illustrationSetId ? getIllustrationSet(illustrationSetId) : undefined

  function closeMenu() {
    setPanel("root")
    setImageUrl("")
    setIllustrationSetId(null)
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

  function insertImage(value: string, source: "upload" | "url") {
    onInsertLayer(
      createDraftingImageLayer(nodeId, {
        imageSource: source,
        imageValue: value,
      }),
    )
    closeMenu()
  }

  function insertIllustration(asset: IllustrationAsset) {
    onInsertLayer(
      createDraftingImageLayer(nodeId, {
        imageFit: "contain",
        imageSource: "url",
        imageValue: asset.path,
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
        setIllustrationSetId(null)
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
          onOpenIllustrationPanel={() => setPanel("illustration")}
          onOpenImagePanel={() => setPanel("image")}
          onOpenShapePanel={() => setPanel("shape")}
        />
      ) : null}
      {panel === "shape" ? (
        <InsertMenuShapePanel
          isDesktopPopover={isDesktopPopover}
          onBack={() => setPanel("root")}
          onSelectShape={insertShape}
        />
      ) : null}
      {panel === "emoji" ? (
        <InsertMenuEmojiPanel
          isDesktopPopover={isDesktopPopover}
          onSelectEmoji={insertEmoji}
        />
      ) : null}
      {panel === "illustration" ? (
        <InsertMenuIllustrationPanel
          isDesktopPopover={isDesktopPopover}
          onBack={() => setPanel("root")}
          onOpenSet={(setId) => {
            setIllustrationSetId(setId)
            setPanel("illustration-set")
          }}
        />
      ) : null}
      {panel === "illustration-set" && activeIllustrationSet ? (
        <InsertMenuIllustrationSetPanel
          isDesktopPopover={isDesktopPopover}
          set={activeIllustrationSet}
          onBack={() => setPanel("illustration")}
          onSelectAsset={insertIllustration}
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
