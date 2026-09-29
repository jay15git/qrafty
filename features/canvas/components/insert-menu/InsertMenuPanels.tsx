"use client";

import { ImageIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { EmojiPicker, EmojiPickerContent, EmojiPickerSearch } from "@/components/ui/emoji-picker";
import type { ThemeMode } from "@/features/shell/components/WorkspaceChrome";
import { ImageCropper } from "@/components/ui/image-cropper";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ElementShapeOptionGrid } from "@/features/canvas/components/ElementShapeOptionGrid";
import { InsertMenuFanPreview } from "@/features/canvas/components/insert-menu/InsertMenuFanPreview";
import type { InsertMenuFanPreviewItems } from "@/features/canvas/components/insert-menu/InsertMenuFanPreview";
import {
  INSERT_MENU_EMOJI_FAN_PREVIEWS,
  INSERT_MENU_ILLUSTRATION_SET_PREVIEWS,
  INSERT_MENU_IMAGE_PREVIEWS,
  INSERT_MENU_QR_PREVIEWS,
  INSERT_MENU_SHAPE_PREVIEWS,
  INSERT_MENU_TEXT_PREVIEWS,
} from "@/features/canvas/components/insert-menu/insert-menu-root-previews";
import {
  INSERT_MENU_BACK_BUTTON,
  INSERT_MENU_EMOJI_SHELL_CLASS,
  INSERT_MENU_INPUT_CLASS,
  INSERT_MENU_ITEM_CLASS,
  INSERT_MENU_PANEL_TITLE,
  INSERT_MENU_ROOT_SCROLL_CLASS,
} from "@/features/canvas/components/insert-menu/insert-menu-styles";
import { IllustrationOptionGrid } from "@/features/canvas/components/IllustrationOptionGrid";
import {
  ILLUSTRATION_SETS,
  type IllustrationAsset,
  type IllustrationSet,
  type IllustrationSetId,
} from "@/features/canvas/assets/illustration-sets";
import type { CanvasElementShapeId } from "@/features/canvas/model/layers/shared";
import { CUELUME_BUTTON, CUELUME_TOGGLE } from "@/features/shell/audio/cuelume";
import { cn } from "@/lib/utils";

function InsertMenuPanelHeader({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className={INSERT_MENU_PANEL_TITLE}>{title}</p>
      <button
        className={INSERT_MENU_BACK_BUTTON}
        type="button"
        onClick={onBack}
        {...CUELUME_BUTTON}
      >
        Back
      </button>
    </div>
  );
}

function InsertMenuRootOptionTile({
  className,
  disabled,
  label,
  onClick,
  previews,
  slot,
}: {
  className?: string;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  previews: InsertMenuFanPreviewItems;
  slot?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      aria-label={label}
      className={cn("ds-insert-menu-root-tile ds-option-tile ds-squircle-xs", className)}
      data-slot={slot}
      disabled={disabled}
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...CUELUME_TOGGLE}
    >
      <span className="ds-insert-menu-root-tile-preview">
        <InsertMenuFanPreview isHovered={isHovered} previews={previews} />
      </span>
      <span className="ds-insert-menu-root-tile-label">{label}</span>
    </button>
  );
}

export function InsertMenuRootPanel({
  canAddQrCode,
  onAddQrCode,
  onInsertText,
  onOpenIllustrationSet,
  onOpenImagePanel,
  onOpenShapePanel,
  onOpenEmojiPanel,
}: {
  canAddQrCode: boolean;
  onAddQrCode?: () => void;
  onInsertText: () => void;
  onOpenEmojiPanel: () => void;
  onOpenIllustrationSet: (setId: IllustrationSetId) => void;
  onOpenImagePanel: () => void;
  onOpenShapePanel: () => void;
}) {
  return (
    <ScrollArea
      className={INSERT_MENU_ROOT_SCROLL_CLASS}
      chevron={false}
      cueSize="tight"
      scrollFade
      showScrollbar={false}
      viewportClassName="min-w-0 px-0"
    >
      <div className="ds-insert-menu-root-grid p-3.5">
        <InsertMenuRootOptionTile
          label="Text"
          previews={INSERT_MENU_TEXT_PREVIEWS}
          onClick={onInsertText}
        />
        <InsertMenuRootOptionTile
          label="Shape"
          previews={INSERT_MENU_SHAPE_PREVIEWS}
          onClick={onOpenShapePanel}
        />
        <InsertMenuRootOptionTile
          label="Emoji"
          previews={INSERT_MENU_EMOJI_FAN_PREVIEWS}
          slot="canvas-insert-menu-emoji"
          onClick={onOpenEmojiPanel}
        />
        <InsertMenuRootOptionTile
          label="Image"
          previews={INSERT_MENU_IMAGE_PREVIEWS}
          onClick={onOpenImagePanel}
        />
        {ILLUSTRATION_SETS.map((set) => (
          <InsertMenuRootOptionTile
            key={set.id}
            label={set.label}
            previews={INSERT_MENU_ILLUSTRATION_SET_PREVIEWS[set.id]}
            slot={`canvas-insert-menu-illustration-${set.id}`}
            onClick={() => onOpenIllustrationSet(set.id)}
          />
        ))}
        {onAddQrCode ? (
          <InsertMenuRootOptionTile
            disabled={!canAddQrCode}
            label={canAddQrCode ? "QR code" : "Max 10 QR codes"}
            previews={INSERT_MENU_QR_PREVIEWS}
            slot="canvas-insert-menu-add-qr"
            onClick={onAddQrCode}
          />
        ) : null}
      </div>
    </ScrollArea>
  );
}
export function InsertMenuShapePanel({
  onBack,
  onSelectShape,
}: {
  onBack: () => void;
  onSelectShape: (shapeId: CanvasElementShapeId) => void;
}) {
  return (
    <div className="space-y-3">
      <InsertMenuPanelHeader title="Shape" onBack={onBack} />
      <ElementShapeOptionGrid
        decorativeDataSlot="canvas-insert-decorative-shape-grid"
        variant="insert-desktop"
        onSelect={onSelectShape}
      />
    </div>
  );
}

export function InsertMenuImagePanel({
  imageUrl,
  onBack,
  onBrowseWallpapers,
  onImageUrlChange,
  onInsertImage,
  theme = "dark",
}: {
  imageUrl: string;
  onBack: () => void;
  onBrowseWallpapers?: () => void;
  onImageUrlChange: (value: string) => void;
  onInsertImage: (value: string, source: "upload" | "url") => void;
  theme?: ThemeMode;
}) {
  return (
    <div className="space-y-3">
      <InsertMenuPanelHeader title="Image" onBack={onBack} />
      {onBrowseWallpapers ? (
        <button
          className={INSERT_MENU_ITEM_CLASS}
          data-slot="canvas-insert-menu-browse-wallpapers"
          type="button"
          onClick={onBrowseWallpapers}
          {...CUELUME_BUTTON}
        >
          <ImageIcon className="size-4 shrink-0" data-icon="inline-start" />
          Browse wallpapers
        </button>
      ) : null}
      <ImageCropper
        className="w-full"
        compact
        dialogTheme={theme}
        maxFileSize={5 * 1024 * 1024}
        placeholder="Drop image or click to upload"
        showFormatHint
        onChange={(value) => {
          if (value instanceof File) {
            onInsertImage(URL.createObjectURL(value), "upload");
          }
        }}
      />
      <div className="flex items-center gap-2 px-1">
        <div className="h-px flex-1 bg-[var(--line)]" />
        <span className="font-medium ds-type-meta">or</span>
        <div className="h-px flex-1 bg-[var(--line)]" />
      </div>
      <Input
        aria-label="Image URL"
        className={INSERT_MENU_INPUT_CLASS}
        placeholder="https://example.com/photo.png"
        value={imageUrl}
        onChange={(event) => onImageUrlChange(event.currentTarget.value)}
      />
      <button
        className={INSERT_MENU_ITEM_CLASS}
        disabled={!imageUrl.trim()}
        type="button"
        onClick={() => onInsertImage(imageUrl.trim(), "url")}
      >
        Use URL
      </button>
    </div>
  );
}

export function InsertMenuIllustrationSetPanel({
  onBack,
  onSelectAsset,
  set,
}: {
  onBack: () => void;
  onSelectAsset: (asset: IllustrationAsset) => void;
  set: IllustrationSet;
}) {
  return (
    <div className="space-y-3">
      <InsertMenuPanelHeader title={set.label} onBack={onBack} />
      <IllustrationOptionGrid
        assets={set.assets}
        dataSlot="canvas-illustration-option-grid"
        variant="insert-desktop"
        onSelect={onSelectAsset}
      />
    </div>
  );
}

export function InsertMenuEmojiPanel({
  onBack,
  onSelectEmoji,
}: {
  onBack?: () => void;
  onSelectEmoji: (emoji: string) => void;
}) {
  const picker = (
    <EmojiPicker
      className="min-h-0 min-w-0 w-full flex-1 border-0 bg-transparent shadow-none [--frimousse-row-height:2.25rem] text-[var(--fg)] [--frimousse-category-header-height:1px] [--frimousse-emoji-font:'Apple_Color_Emoji','Segoe_UI_Emoji','Noto_Color_Emoji',sans-serif]"
      columns={8}
      data-slot="canvas-insert-menu-emoji-picker"
      onEmojiSelect={({ emoji }) => onSelectEmoji(emoji)}
    >
      <EmojiPickerSearch
        className="shrink-0 border-0 border-b border-[var(--line)] bg-transparent px-3.5 [&_input]:bg-transparent [&_input]:placeholder:text-[var(--muted)]"
        placeholder="Search emoji…"
      />
      <EmojiPickerContent
        className="[&_[data-slot=emoji-picker-emoji]]:hover:bg-[var(--control)] [&_[data-slot=emoji-picker-emoji][data-active]]:bg-[var(--control)]"
        hideCategoryHeaders
      />
    </EmojiPicker>
  );

  return (
    <div className={INSERT_MENU_EMOJI_SHELL_CLASS}>
      {onBack ? (
        <div className="shrink-0 px-3.5 pt-3.5">
          <InsertMenuPanelHeader title="Emoji" onBack={onBack} />
        </div>
      ) : null}
      {picker}
    </div>
  );
}
