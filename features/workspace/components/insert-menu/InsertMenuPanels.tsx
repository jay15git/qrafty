"use client"

import {
  CopyPlusIcon,
  FrameIcon,
  ImageIcon,
  PenLineIcon,
  SmileIcon,
  TypeIcon,
} from "lucide-react"
import type { ReactNode } from "react"
import { useState } from "react"

import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerSearch,
} from "@/components/ui/emoji-picker"
import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import { ImageCropper } from "@/components/ui/image-cropper"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SecondaryButton } from "@/components/ui/secondary-button"
import { ElementShapeOptionGrid } from "@/features/workspace/components/ElementShapeOptionGrid"
import { InsertMenuFanPreview } from "@/features/workspace/components/insert-menu/InsertMenuFanPreview"
import type { InsertMenuFanPreviewItems } from "@/features/workspace/components/insert-menu/InsertMenuFanPreview"
import {
  INSERT_MENU_EMOJI_FAN_PREVIEWS,
  INSERT_MENU_ILLUSTRATION_SET_PREVIEWS,
  INSERT_MENU_IMAGE_PREVIEWS,
  INSERT_MENU_QR_PREVIEWS,
  INSERT_MENU_SHAPE_PREVIEWS,
  INSERT_MENU_TEXT_PREVIEWS,
} from "@/features/workspace/components/insert-menu/insert-menu-root-previews"
import {
  INSERT_MENU_BACK_BUTTON,
  INSERT_MENU_EMOJI_SHELL_CLASS,
  INSERT_MENU_INPUT_CLASS,
  INSERT_MENU_ITEM_CLASS,
  INSERT_MENU_PANEL_TITLE,
  INSERT_MENU_ROOT_SCROLL_CLASS,
} from "@/features/workspace/components/insert-menu/insert-menu-styles"
import { IllustrationOptionGrid } from "@/features/workspace/components/IllustrationOptionGrid"
import {
  ILLUSTRATION_SETS,
  type IllustrationAsset,
  type IllustrationSet,
  type IllustrationSetId,
} from "@/features/workspace/assets/illustration-sets"
import type { DraftingElementShapeId } from "@/features/workspace/model/layers"
import { CUELUME_BUTTON, CUELUME_TOGGLE } from "@/features/desktop-shell/audio/desktop-cuelume"
import { cn } from "@/lib/utils"

export function InsertMenuActionButton({
  children,
  disabled,
  isDesktopPopover,
  onClick,
  slot,
}: {
  children: ReactNode
  disabled?: boolean
  isDesktopPopover: boolean
  onClick: () => void
  slot?: string
}) {
  if (isDesktopPopover) {
    return (
      <button
        className={INSERT_MENU_ITEM_CLASS}
        data-slot={slot}
        disabled={disabled}
        type="button"
        onClick={onClick}
        {...CUELUME_BUTTON}
      >
        {children}
      </button>
    )
  }

  return (
    <SecondaryButton
      className="h-10 w-full justify-start"
      data-slot={slot}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {children}
    </SecondaryButton>
  )
}

function InsertMenuPanelHeader({
  isDesktopPopover,
  onBack,
  title,
}: {
  isDesktopPopover: boolean
  onBack: () => void
  title: string
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p
        className={cn(
          isDesktopPopover ? INSERT_MENU_PANEL_TITLE : "ws-type-control-label font-semibold text-[var(--ws-ink)]",
        )}
      >
        {title}
      </p>
      <button
        className={
          isDesktopPopover
            ? INSERT_MENU_BACK_BUTTON
            : "text-sm font-medium text-[var(--ws-ink-muted)] hover:text-[var(--ws-ink)]"
        }
        type="button"
        onClick={onBack}
        {...CUELUME_BUTTON}
      >
        Back
      </button>
    </div>
  )
}

export function InsertMenuRootOptionTile({
  className,
  disabled,
  label,
  onClick,
  previews,
  slot,
}: {
  className?: string
  disabled?: boolean
  label: string
  onClick: () => void
  previews: InsertMenuFanPreviewItems
  slot?: string
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      aria-label={label}
      className={cn("dn-insert-menu-root-tile dn-option-tile dn-squircle-xs", className)}
      data-slot={slot}
      disabled={disabled}
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...CUELUME_TOGGLE}
    >
      <span className="dn-insert-menu-root-tile-preview">
        <InsertMenuFanPreview isHovered={isHovered} previews={previews} />
      </span>
      <span className="dn-insert-menu-root-tile-label">{label}</span>
    </button>
  )
}

export function InsertMenuRootPanel({
  canAddQrCode,
  isDesktopPopover,
  onAddQrCode,
  onInsertText,
  onOpenIllustrationSet,
  onOpenImagePanel,
  onOpenShapePanel,
  onOpenEmojiPanel,
}: {
  canAddQrCode: boolean
  isDesktopPopover: boolean
  onAddQrCode?: () => void
  onInsertText: () => void
  onOpenEmojiPanel: () => void
  onOpenIllustrationSet: (setId: IllustrationSetId) => void
  onOpenImagePanel: () => void
  onOpenShapePanel: () => void
}) {
  if (isDesktopPopover) {
    return (
      <ScrollArea
        className={INSERT_MENU_ROOT_SCROLL_CLASS}
        chevron={false}
        cueSize="tight"
        orientation="horizontal"
        scrollFade
        showScrollbar={false}
        viewportClassName="min-w-0 px-0"
      >
        <div className="dn-insert-menu-root-grid p-3.5">
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
            slot="drafting-insert-menu-emoji"
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
              slot={`drafting-insert-menu-illustration-${set.id}`}
              onClick={() => onOpenIllustrationSet(set.id)}
            />
          ))}
          {onAddQrCode ? (
            <InsertMenuRootOptionTile
              disabled={!canAddQrCode}
              label={canAddQrCode ? "QR code" : "Max 10 QR codes"}
              previews={INSERT_MENU_QR_PREVIEWS}
              slot="drafting-insert-menu-add-qr"
              onClick={onAddQrCode}
            />
          ) : null}
        </div>
      </ScrollArea>
    )
  }

  return (
    <div className="grid gap-2">
      <InsertMenuActionButton isDesktopPopover={isDesktopPopover} onClick={onInsertText}>
        <TypeIcon className="size-4 shrink-0" data-icon="inline-start" />
        Text
      </InsertMenuActionButton>
      <InsertMenuActionButton isDesktopPopover={isDesktopPopover} onClick={onOpenShapePanel}>
        <FrameIcon className="size-4 shrink-0" data-icon="inline-start" />
        Shape
      </InsertMenuActionButton>
      <InsertMenuActionButton
        isDesktopPopover={isDesktopPopover}
        onClick={onOpenEmojiPanel}
        slot="drafting-insert-menu-emoji"
      >
        <SmileIcon className="size-4 shrink-0" data-icon="inline-start" />
        Emoji
      </InsertMenuActionButton>
      <InsertMenuActionButton isDesktopPopover={isDesktopPopover} onClick={onOpenImagePanel}>
        <ImageIcon className="size-4 shrink-0" data-icon="inline-start" />
        Image
      </InsertMenuActionButton>
      {ILLUSTRATION_SETS.map((set) => (
        <InsertMenuActionButton
          isDesktopPopover={isDesktopPopover}
          key={set.id}
          slot={`drafting-insert-menu-illustration-${set.id}`}
          onClick={() => onOpenIllustrationSet(set.id)}
        >
          <PenLineIcon className="size-4 shrink-0" data-icon="inline-start" />
          {set.label}
        </InsertMenuActionButton>
      ))}
      {onAddQrCode ? (
        <InsertMenuActionButton
          disabled={!canAddQrCode}
          isDesktopPopover={isDesktopPopover}
          onClick={onAddQrCode}
          slot="drafting-insert-menu-add-qr"
        >
          <CopyPlusIcon className="size-4 shrink-0" data-icon="inline-start" />
          {canAddQrCode ? "QR code" : "Maximum 10 QR codes reached"}
        </InsertMenuActionButton>
      ) : null}
    </div>
  )
}

export function InsertMenuShapePanel({
  isDesktopPopover,
  onBack,
  onSelectShape,
}: {
  isDesktopPopover: boolean
  onBack: () => void
  onSelectShape: (shapeId: DraftingElementShapeId) => void
}) {
  return (
    <div className="space-y-3">
      <InsertMenuPanelHeader isDesktopPopover={isDesktopPopover} title="Shape" onBack={onBack} />
      <ElementShapeOptionGrid
        decorativeDataSlot="drafting-insert-decorative-shape-grid"
        variant={isDesktopPopover ? "insert-desktop" : "insert-drafting"}
        onSelect={onSelectShape}
      />
    </div>
  )
}

export function InsertMenuImagePanel({
  imageUrl,
  isDesktopPopover,
  onBack,
  onBrowseWallpapers,
  onImageUrlChange,
  onInsertImage,
  theme = "dark",
}: {
  imageUrl: string
  isDesktopPopover: boolean
  onBack: () => void
  onBrowseWallpapers?: () => void
  onImageUrlChange: (value: string) => void
  onInsertImage: (value: string, source: "upload" | "url") => void
  theme?: DesktopThemeMode
}) {
  return (
    <div className="space-y-3">
      <InsertMenuPanelHeader isDesktopPopover={isDesktopPopover} title="Image" onBack={onBack} />
      {onBrowseWallpapers ? (
        <InsertMenuActionButton
          isDesktopPopover={isDesktopPopover}
          onClick={onBrowseWallpapers}
          slot="drafting-insert-menu-browse-wallpapers"
        >
          <ImageIcon className="size-4 shrink-0" data-icon="inline-start" />
          Browse wallpapers
        </InsertMenuActionButton>
      ) : null}
      <ImageCropper
        className="w-full"
        compact
        dialogContentClassName={theme === "dark" ? "dark" : undefined}
        maxFileSize={5 * 1024 * 1024}
        placeholder="Drop image or click to upload"
        showFormatHint
        onChange={(value) => {
          if (value instanceof File) {
            onInsertImage(URL.createObjectURL(value), "upload")
          }
        }}
      />
      <div className="flex items-center gap-2 px-1">
        <div
          className={cn(
            "h-px flex-1",
            isDesktopPopover ? "bg-[var(--dn-line)]" : "bg-[var(--ws-line)]",
          )}
        />
        <span
          className={cn(
            "font-medium",
            isDesktopPopover ? "dn-type-meta" : "text-xs text-[var(--ws-ink-muted)]",
          )}
        >
          or
        </span>
        <div
          className={cn(
            "h-px flex-1",
            isDesktopPopover ? "bg-[var(--dn-line)]" : "bg-[var(--ws-line)]",
          )}
        />
      </div>
      <Input
        aria-label="Image URL"
        className={cn(
          isDesktopPopover
            ? INSERT_MENU_INPUT_CLASS
            : "ws-type-input h-10 min-w-0 border-[var(--ws-line)] bg-[var(--ws-panel-bg-hover)] px-3 text-[var(--ws-ink)] shadow-none",
        )}
        placeholder="https://example.com/photo.png"
        value={imageUrl}
        onChange={(event) => onImageUrlChange(event.currentTarget.value)}
      />
      {isDesktopPopover ? (
        <button
          className={INSERT_MENU_ITEM_CLASS}
          disabled={!imageUrl.trim()}
          type="button"
          onClick={() => onInsertImage(imageUrl.trim(), "url")}
        >
          Use URL
        </button>
      ) : (
        <SecondaryButton
          className="h-9 w-full"
          disabled={!imageUrl.trim()}
          type="button"
          onClick={() => onInsertImage(imageUrl.trim(), "url")}
        >
          Use URL
        </SecondaryButton>
      )}
    </div>
  )
}

export function InsertMenuIllustrationSetPanel({
  isDesktopPopover,
  onBack,
  onSelectAsset,
  set,
}: {
  isDesktopPopover: boolean
  onBack: () => void
  onSelectAsset: (asset: IllustrationAsset) => void
  set: IllustrationSet
}) {
  return (
    <div className="space-y-3">
      <InsertMenuPanelHeader isDesktopPopover={isDesktopPopover} title={set.label} onBack={onBack} />
      <IllustrationOptionGrid
        assets={set.assets}
        dataSlot="drafting-illustration-option-grid"
        variant={isDesktopPopover ? "insert-desktop" : "insert-drafting"}
        onSelect={onSelectAsset}
      />
    </div>
  )
}

export function InsertMenuEmojiPanel({
  isDesktopPopover,
  onBack,
  onSelectEmoji,
}: {
  isDesktopPopover: boolean
  onBack?: () => void
  onSelectEmoji: (emoji: string) => void
}) {
  const picker = (
    <EmojiPicker
      className={cn(
        "min-h-0 min-w-0 w-full flex-1 border-0 bg-transparent shadow-none [--frimousse-row-height:2.25rem]",
        isDesktopPopover
          ? "text-[var(--dn-fg)] [--frimousse-category-header-height:1px] [--frimousse-emoji-font:'Apple_Color_Emoji','Segoe_UI_Emoji','Noto_Color_Emoji',sans-serif]"
          : "h-[22rem] dn-squircle-sm border border-[var(--ws-line)] bg-[var(--ws-panel-bg)]",
      )}
      columns={8}
      data-slot="drafting-insert-menu-emoji-picker"
      onEmojiSelect={({ emoji }) => onSelectEmoji(emoji)}
    >
      <EmojiPickerSearch
        className={cn(
          "shrink-0 border-0 bg-transparent",
          isDesktopPopover
            ? "border-b border-[var(--dn-line)] px-3.5 [&_input]:bg-transparent [&_input]:placeholder:text-[var(--dn-muted)]"
            : "border-b border-[var(--ws-line)] px-0",
        )}
        placeholder="Search emoji…"
      />
      <EmojiPickerContent
        className={cn(
          isDesktopPopover &&
            "[&_[data-slot=emoji-picker-emoji]]:hover:bg-[var(--dn-control)] [&_[data-slot=emoji-picker-emoji][data-active]]:bg-[var(--dn-control)]",
        )}
        hideCategoryHeaders={isDesktopPopover}
      />
    </EmojiPicker>
  )

  if (!isDesktopPopover) {
    return (
      <div className="w-full min-w-0 space-y-3">
        {onBack ? (
          <InsertMenuPanelHeader isDesktopPopover={isDesktopPopover} title="Emoji" onBack={onBack} />
        ) : null}
        {picker}
      </div>
    )
  }

  return (
    <div className={INSERT_MENU_EMOJI_SHELL_CLASS}>
      {onBack ? (
        <div className="shrink-0 px-3.5 pt-3.5">
          <InsertMenuPanelHeader isDesktopPopover={isDesktopPopover} title="Emoji" onBack={onBack} />
        </div>
      ) : null}
      {picker}
    </div>
  )
}
