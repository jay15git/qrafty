"use client";

import { useState } from "react";

import {
  InsertMenuEmojiPanel,
  InsertMenuIllustrationSetPanel,
  InsertMenuImagePanel,
  InsertMenuRootPanel,
  InsertMenuShapePanel,
} from "@/features/canvas/components/insert-menu/InsertMenuPanels";
import type { ThemeMode } from "@/features/shell/components/WorkspaceChrome";
import { InsertMenuScroll } from "@/features/canvas/components/insert-menu/InsertMenuScroll";
import { INSERT_MENU_PANEL_CONTENT_CLASS } from "@/features/canvas/components/insert-menu/insert-menu-styles";
import {
  getIllustrationSet,
  type IllustrationAsset,
  type IllustrationSet,
  type IllustrationSetId,
} from "@/features/canvas/assets/illustration-sets";
import type { CanvasLayer, CanvasElementShapeId } from "@/features/canvas/model/layers/shared";
import {
  createCanvasImageLayer,
  createCanvasShapeLayer,
  createCanvasTextLayer,
} from "@/features/canvas/model/layers/factories";
import { createCanvasEmojiLayer } from "@/features/canvas/model/layer-floating-settings";

type InsertMenuPanelStackProps = {
  nodeId: string;
  onInsertLayer: (layer: CanvasLayer) => void;
  canAddQrCode?: boolean;
  onAddQrCode?: () => void;
  onBrowseWallpapers?: () => void;
  isPopover?: boolean;
  onClose?: () => void;
  theme?: ThemeMode;
};

type InsertMenuPanelId = "root" | "shape" | "image" | "emoji" | "illustration-set";

type InsertMenuPanelsProps = {
  activeIllustrationSet: IllustrationSet | undefined;
  canAddQrCode: boolean;
  imageUrl: string;
  isPopover: boolean;
  onAddQrCode?: () => void;
  onBack: () => void;
  onBrowseWallpapers?: () => void;
  onInsertEmoji: (emoji: string) => void;
  onInsertImage: (value: string, source: "upload" | "url") => void;
  onInsertIllustration: (asset: IllustrationAsset) => void;
  onInsertShape: (shapeId: CanvasElementShapeId) => void;
  onInsertText: () => void;
  onOpenEmojiPanel: () => void;
  onOpenIllustrationSet: (setId: IllustrationSetId) => void;
  onOpenImagePanel: () => void;
  onOpenShapePanel: () => void;
  onImageUrlChange: (value: string) => void;
  panel: InsertMenuPanelId;
  theme: ThemeMode;
};

function InsertMenuPopoverPanels({
  activeIllustrationSet,
  canAddQrCode,
  imageUrl,
  isPopover,
  onAddQrCode,
  onBack,
  onBrowseWallpapers,
  onInsertEmoji,
  onInsertImage,
  onInsertIllustration,
  onInsertShape,
  onInsertText,
  onOpenEmojiPanel,
  onOpenIllustrationSet,
  onOpenImagePanel,
  onOpenShapePanel,
  onImageUrlChange,
  panel,
  theme,
}: InsertMenuPanelsProps) {
  if (panel === "emoji") {
    return (
      <InsertMenuEmojiPanel isPopover={isPopover} onBack={onBack} onSelectEmoji={onInsertEmoji} />
    );
  }

  if (panel === "root") {
    return (
      <InsertMenuRootPanel
        canAddQrCode={canAddQrCode}
        isPopover={isPopover}
        onAddQrCode={onAddQrCode}
        onInsertText={onInsertText}
        onOpenEmojiPanel={onOpenEmojiPanel}
        onOpenIllustrationSet={onOpenIllustrationSet}
        onOpenImagePanel={onOpenImagePanel}
        onOpenShapePanel={onOpenShapePanel}
      />
    );
  }

  return (
    <InsertMenuScroll contentClassName={INSERT_MENU_PANEL_CONTENT_CLASS}>
      {panel === "shape" ? (
        <InsertMenuShapePanel isPopover={isPopover} onBack={onBack} onSelectShape={onInsertShape} />
      ) : null}
      {panel === "illustration-set" && activeIllustrationSet ? (
        <InsertMenuIllustrationSetPanel
          isPopover={isPopover}
          set={activeIllustrationSet}
          onBack={onBack}
          onSelectAsset={onInsertIllustration}
        />
      ) : null}
      {panel === "image" ? (
        <InsertMenuImagePanel
          imageUrl={imageUrl}
          isPopover={isPopover}
          onBack={onBack}
          onBrowseWallpapers={onBrowseWallpapers}
          onImageUrlChange={onImageUrlChange}
          onInsertImage={onInsertImage}
          theme={theme}
        />
      ) : null}
    </InsertMenuScroll>
  );
}

function InsertMenuInlinePanels({
  activeIllustrationSet,
  canAddQrCode,
  imageUrl,
  isPopover,
  onAddQrCode,
  onBack,
  onBrowseWallpapers,
  onInsertEmoji,
  onInsertImage,
  onInsertIllustration,
  onInsertShape,
  onInsertText,
  onOpenEmojiPanel,
  onOpenIllustrationSet,
  onOpenImagePanel,
  onOpenShapePanel,
  onImageUrlChange,
  panel,
  theme,
}: InsertMenuPanelsProps) {
  return (
    <>
      {panel === "root" ? (
        <InsertMenuRootPanel
          canAddQrCode={canAddQrCode}
          isPopover={isPopover}
          onAddQrCode={onAddQrCode}
          onInsertText={onInsertText}
          onOpenEmojiPanel={onOpenEmojiPanel}
          onOpenIllustrationSet={onOpenIllustrationSet}
          onOpenImagePanel={onOpenImagePanel}
          onOpenShapePanel={onOpenShapePanel}
        />
      ) : null}
      {panel === "shape" ? (
        <InsertMenuShapePanel isPopover={isPopover} onBack={onBack} onSelectShape={onInsertShape} />
      ) : null}
      {panel === "emoji" ? (
        <InsertMenuEmojiPanel isPopover={isPopover} onBack={onBack} onSelectEmoji={onInsertEmoji} />
      ) : null}
      {panel === "illustration-set" && activeIllustrationSet ? (
        <InsertMenuIllustrationSetPanel
          isPopover={isPopover}
          set={activeIllustrationSet}
          onBack={onBack}
          onSelectAsset={onInsertIllustration}
        />
      ) : null}
      {panel === "image" ? (
        <InsertMenuImagePanel
          imageUrl={imageUrl}
          isPopover={isPopover}
          onBack={onBack}
          onBrowseWallpapers={onBrowseWallpapers}
          onImageUrlChange={onImageUrlChange}
          onInsertImage={onInsertImage}
          theme={theme}
        />
      ) : null}
    </>
  );
}

export function InsertMenuPanelStack({
  nodeId,
  onInsertLayer,
  canAddQrCode = true,
  onAddQrCode,
  onBrowseWallpapers,
  isPopover = true,
  onClose,
  theme = "dark",
}: InsertMenuPanelStackProps) {
  const [panel, setPanel] = useState<InsertMenuPanelId>("root");
  const [imageUrl, setImageUrl] = useState("");
  const [illustrationSetId, setIllustrationSetId] = useState<IllustrationSetId | null>(null);
  const activeIllustrationSet = illustrationSetId
    ? getIllustrationSet(illustrationSetId)
    : undefined;

  function closeMenu() {
    setPanel("root");
    setImageUrl("");
    setIllustrationSetId(null);
    onClose?.();
  }

  function insertText() {
    onInsertLayer(createCanvasTextLayer(nodeId));
    closeMenu();
  }

  function insertShape(shapeId: CanvasElementShapeId) {
    onInsertLayer(createCanvasShapeLayer(nodeId, shapeId));
    closeMenu();
  }

  function insertEmoji(emoji: string) {
    onInsertLayer(createCanvasEmojiLayer(nodeId, emoji));
    closeMenu();
  }

  function insertImage(value: string, source: "upload" | "url") {
    onInsertLayer(
      createCanvasImageLayer(nodeId, {
        imageSource: source,
        imageValue: value,
      }),
    );
    closeMenu();
  }

  function insertIllustration(asset: IllustrationAsset) {
    onInsertLayer(
      createCanvasImageLayer(nodeId, {
        imageFit: "contain",
        imageSource: "url",
        imageValue: asset.path,
      }),
    );
    closeMenu();
  }

  function browseWallpapers() {
    onBrowseWallpapers?.();
    closeMenu();
  }

  function addQrCode() {
    onAddQrCode?.();
    closeMenu();
  }

  const panelsProps: InsertMenuPanelsProps = {
    activeIllustrationSet,
    canAddQrCode,
    imageUrl,
    isPopover,
    onAddQrCode: onAddQrCode ? addQrCode : undefined,
    onBack: () => setPanel("root"),
    onBrowseWallpapers: onBrowseWallpapers ? browseWallpapers : undefined,
    onInsertEmoji: insertEmoji,
    onInsertImage: insertImage,
    onInsertIllustration: insertIllustration,
    onInsertShape: insertShape,
    onInsertText: insertText,
    onOpenEmojiPanel: () => setPanel("emoji"),
    onOpenIllustrationSet: (setId) => {
      setIllustrationSetId(setId);
      setPanel("illustration-set");
    },
    onOpenImagePanel: () => setPanel("image"),
    onOpenShapePanel: () => setPanel("shape"),
    onImageUrlChange: setImageUrl,
    panel,
    theme,
  };

  if (isPopover) {
    return <InsertMenuPopoverPanels {...panelsProps} />;
  }

  return <InsertMenuInlinePanels {...panelsProps} />;
}
