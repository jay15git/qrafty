"use client"

import { useState } from "react"

import {
  InsertMenuEmojiPanel,
  InsertMenuIllustrationSetPanel,
  InsertMenuImagePanel,
  InsertMenuRootPanel,
  InsertMenuShapePanel,
} from "@/features/workspace/components/insert-menu/InsertMenuPanels"
import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import { InsertMenuDesktopScroll } from "@/features/workspace/components/insert-menu/InsertMenuDesktopScroll"
import { INSERT_MENU_PANEL_CONTENT_CLASS } from "@/features/workspace/components/insert-menu/insert-menu-styles"
import {
  getIllustrationSet,
  type IllustrationAsset,
  type IllustrationSetId,
} from "@/features/workspace/assets/illustration-sets"
import {
  createDraftingImageLayer,
  createDraftingShapeLayer,
  createDraftingTextLayer,
  type DraftingCanvasLayer,
  type DraftingElementShapeId,
} from "@/features/workspace/model/layers"
import { createDraftingEmojiLayer } from "@/features/workspace/model/layer-floating-settings"

type InsertMenuPanelStackProps = {
  nodeId: string
  onInsertLayer: (layer: DraftingCanvasLayer) => void
  canAddQrCode?: boolean
  onAddQrCode?: () => void
  onBrowseWallpapers?: () => void
  isDesktopPopover?: boolean
  onClose?: () => void
  theme?: DesktopThemeMode
}

export function InsertMenuPanelStack({
  nodeId,
  onInsertLayer,
  canAddQrCode = true,
  onAddQrCode,
  onBrowseWallpapers,
  isDesktopPopover = true,
  onClose,
  theme = "dark",
}: InsertMenuPanelStackProps) {
  const [panel, setPanel] = useState<"root" | "shape" | "image" | "emoji" | "illustration-set">(
    "root",
  )
  const [imageUrl, setImageUrl] = useState("")
  const [illustrationSetId, setIllustrationSetId] = useState<IllustrationSetId | null>(null)
  const activeIllustrationSet =
    illustrationSetId ? getIllustrationSet(illustrationSetId) : undefined

  function closeMenu() {
    setPanel("root")
    setImageUrl("")
    setIllustrationSetId(null)
    onClose?.()
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
    onInsertLayer(createDraftingEmojiLayer(nodeId, emoji))
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

  function browseWallpapers() {
    onBrowseWallpapers?.()
    closeMenu()
  }

  function addQrCode() {
    onAddQrCode?.()
    closeMenu()
  }

  if (isDesktopPopover) {
    if (panel === "emoji") {
      return (
        <InsertMenuEmojiPanel
          isDesktopPopover={isDesktopPopover}
          onBack={() => setPanel("root")}
          onSelectEmoji={insertEmoji}
        />
      )
    }

    if (panel === "root") {
      return (
        <InsertMenuRootPanel
          canAddQrCode={canAddQrCode}
          isDesktopPopover={isDesktopPopover}
          onAddQrCode={onAddQrCode ? addQrCode : undefined}
          onInsertText={insertText}
          onOpenEmojiPanel={() => setPanel("emoji")}
          onOpenIllustrationSet={(setId) => {
            setIllustrationSetId(setId)
            setPanel("illustration-set")
          }}
          onOpenImagePanel={() => setPanel("image")}
          onOpenShapePanel={() => setPanel("shape")}
        />
      )
    }

    return (
      <InsertMenuDesktopScroll contentClassName={INSERT_MENU_PANEL_CONTENT_CLASS}>
        {panel === "shape" ? (
          <InsertMenuShapePanel
            isDesktopPopover={isDesktopPopover}
            onBack={() => setPanel("root")}
            onSelectShape={insertShape}
          />
        ) : null}
        {panel === "illustration-set" && activeIllustrationSet ? (
          <InsertMenuIllustrationSetPanel
            isDesktopPopover={isDesktopPopover}
            set={activeIllustrationSet}
            onBack={() => setPanel("root")}
            onSelectAsset={insertIllustration}
          />
        ) : null}
        {panel === "image" ? (
          <InsertMenuImagePanel
            imageUrl={imageUrl}
            isDesktopPopover={isDesktopPopover}
            onBack={() => setPanel("root")}
            onBrowseWallpapers={onBrowseWallpapers ? browseWallpapers : undefined}
            onImageUrlChange={setImageUrl}
            onInsertImage={insertImage}
            theme={theme}
          />
        ) : null}
      </InsertMenuDesktopScroll>
    )
  }

  return (
    <>
      {panel === "root" ? (
        <InsertMenuRootPanel
          canAddQrCode={canAddQrCode}
          isDesktopPopover={isDesktopPopover}
          onAddQrCode={onAddQrCode ? addQrCode : undefined}
          onInsertText={insertText}
          onOpenEmojiPanel={() => setPanel("emoji")}
          onOpenIllustrationSet={(setId) => {
            setIllustrationSetId(setId)
            setPanel("illustration-set")
          }}
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
          onBack={() => setPanel("root")}
          onSelectEmoji={insertEmoji}
        />
      ) : null}
      {panel === "illustration-set" && activeIllustrationSet ? (
        <InsertMenuIllustrationSetPanel
          isDesktopPopover={isDesktopPopover}
          set={activeIllustrationSet}
          onBack={() => setPanel("root")}
          onSelectAsset={insertIllustration}
        />
      ) : null}
      {panel === "image" ? (
        <InsertMenuImagePanel
          imageUrl={imageUrl}
          isDesktopPopover={isDesktopPopover}
          onBack={() => setPanel("root")}
          onBrowseWallpapers={onBrowseWallpapers ? browseWallpapers : undefined}
          onImageUrlChange={setImageUrl}
          onInsertImage={insertImage}
          theme={theme}
        />
      ) : null}
    </>
  )
}
