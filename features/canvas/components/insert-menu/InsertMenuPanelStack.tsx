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
  onClose?: () => void;
  theme?: ThemeMode;
};

type InsertMenuPanelId = "root" | "shape" | "image" | "emoji" | "illustration-set";

export function InsertMenuPanelStack({
  nodeId,
  onInsertLayer,
  canAddQrCode = true,
  onAddQrCode,
  onBrowseWallpapers,
  onClose,
  theme = "dark",
}: InsertMenuPanelStackProps) {
  const [panel, setPanel] = useState<InsertMenuPanelId>("root");
  const [imageUrl, setImageUrl] = useState("");
  const [illustrationSetId, setIllustrationSetId] = useState<IllustrationSetId | null>(null);
  const activeIllustrationSet: IllustrationSet | undefined = illustrationSetId
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

  if (panel === "emoji") {
    return <InsertMenuEmojiPanel onBack={() => setPanel("root")} onSelectEmoji={insertEmoji} />;
  }

  if (panel === "root") {
    return (
      <InsertMenuRootPanel
        canAddQrCode={canAddQrCode}
        onAddQrCode={onAddQrCode ? addQrCode : undefined}
        onInsertText={insertText}
        onOpenEmojiPanel={() => setPanel("emoji")}
        onOpenIllustrationSet={(setId) => {
          setIllustrationSetId(setId);
          setPanel("illustration-set");
        }}
        onOpenImagePanel={() => setPanel("image")}
        onOpenShapePanel={() => setPanel("shape")}
      />
    );
  }

  return (
    <InsertMenuScroll contentClassName={INSERT_MENU_PANEL_CONTENT_CLASS}>
      {panel === "shape" ? (
        <InsertMenuShapePanel onBack={() => setPanel("root")} onSelectShape={insertShape} />
      ) : null}
      {panel === "illustration-set" && activeIllustrationSet ? (
        <InsertMenuIllustrationSetPanel
          set={activeIllustrationSet}
          onBack={() => setPanel("root")}
          onSelectAsset={insertIllustration}
        />
      ) : null}
      {panel === "image" ? (
        <InsertMenuImagePanel
          imageUrl={imageUrl}
          onBack={() => setPanel("root")}
          onBrowseWallpapers={onBrowseWallpapers ? browseWallpapers : undefined}
          onImageUrlChange={setImageUrl}
          onInsertImage={insertImage}
          theme={theme}
        />
      ) : null}
    </InsertMenuScroll>
  );
}
