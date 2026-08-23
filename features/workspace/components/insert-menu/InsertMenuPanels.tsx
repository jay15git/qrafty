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
import { useEffect, useRef, useState } from "react"

import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerSearch,
} from "@/components/ui/emoji-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SecondaryButton } from "@/components/ui/secondary-button"
import FileUpload from "@/components/vendor/kokonutui/file-upload"
import { ElementShapeOptionGrid } from "@/features/workspace/components/ElementShapeOptionGrid"
import {
  INSERT_MENU_BACK_BUTTON,
  INSERT_MENU_INPUT_CLASS,
  INSERT_MENU_ITEM_CLASS,
  INSERT_MENU_PANEL_TITLE,
} from "@/features/workspace/components/insert-menu/insert-menu-styles"
import { IllustrationOptionGrid } from "@/features/workspace/components/IllustrationOptionGrid"
import {
  ILLUSTRATION_SETS,
  type IllustrationAsset,
  type IllustrationSet,
  type IllustrationSetId,
} from "@/features/workspace/assets/illustration-sets"
import type { DraftingElementShapeId } from "@/features/workspace/model/layers"
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
      <Button
        className={isDesktopPopover ? INSERT_MENU_BACK_BUTTON : undefined}
        size="sm"
        type="button"
        variant="ghost"
        onClick={onBack}
      >
        Back
      </Button>
    </div>
  )
}

export function InsertMenuRootPanel({
  canAddQrCode,
  isDesktopPopover,
  onAddQrCode,
  onInsertText,
  onOpenIllustrationPanel,
  onOpenImagePanel,
  onOpenShapePanel,
  onOpenEmojiPanel,
}: {
  canAddQrCode: boolean
  isDesktopPopover: boolean
  onAddQrCode?: () => void
  onInsertText: () => void
  onOpenEmojiPanel: () => void
  onOpenIllustrationPanel: () => void
  onOpenImagePanel: () => void
  onOpenShapePanel: () => void
}) {
  return (
    <div className={cn("grid", isDesktopPopover ? "gap-0.5" : "gap-2")}>
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
      <InsertMenuActionButton
        isDesktopPopover={isDesktopPopover}
        onClick={onOpenIllustrationPanel}
        slot="drafting-insert-menu-illustration"
      >
        <PenLineIcon className="size-4 shrink-0" data-icon="inline-start" />
        Illustration
      </InsertMenuActionButton>
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
      <InsertMenuPanelHeader isDesktopPopover={isDesktopPopover} title="Choose shape" onBack={onBack} />
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
  onBrowseStockPhotos,
  onImageUrlChange,
  onInsertImage,
}: {
  imageUrl: string
  isDesktopPopover: boolean
  onBack: () => void
  onBrowseStockPhotos?: () => void
  onImageUrlChange: (value: string) => void
  onInsertImage: (value: string, source: "upload" | "url") => void
}) {
  return (
    <div className="space-y-3">
      <InsertMenuPanelHeader isDesktopPopover={isDesktopPopover} title="Add image" onBack={onBack} />
      {onBrowseStockPhotos ? (
        <InsertMenuActionButton
          isDesktopPopover={isDesktopPopover}
          onClick={onBrowseStockPhotos}
          slot="drafting-insert-menu-browse-photos"
        >
          <ImageIcon className="size-4 shrink-0" data-icon="inline-start" />
          Browse photos
        </InsertMenuActionButton>
      ) : null}
      {onBrowseStockPhotos ? (
        <div className="flex items-center gap-2 px-1">
          <div
            className={cn(
              "h-px flex-1",
              isDesktopPopover ? "bg-[var(--dn-line)]" : "bg-[var(--ws-line)]",
            )}
          />
          <span
            className={cn(
              "text-xs font-medium",
              isDesktopPopover ? "dn-type-meta" : "text-[var(--ws-ink-muted)]",
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
      ) : null}
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
      <FileUpload
        acceptedFileTypes={["image/*"]}
        className="mx-0 max-w-full"
        onUploadError={() => undefined}
        onUploadSuccess={(file) => onInsertImage(URL.createObjectURL(file), "upload")}
        uploadDelay={0}
      />
    </div>
  )
}

export function InsertMenuIllustrationPanel({
  isDesktopPopover,
  onBack,
  onOpenSet,
}: {
  isDesktopPopover: boolean
  onBack: () => void
  onOpenSet: (setId: IllustrationSetId) => void
}) {
  return (
    <div className="space-y-3">
      <InsertMenuPanelHeader
        isDesktopPopover={isDesktopPopover}
        title="Choose illustration set"
        onBack={onBack}
      />
      <div className={cn("grid", isDesktopPopover ? "gap-0.5" : "gap-2")}>
        {ILLUSTRATION_SETS.map((set) => (
          <InsertMenuActionButton
            isDesktopPopover={isDesktopPopover}
            key={set.id}
            onClick={() => onOpenSet(set.id)}
          >
            <PenLineIcon className="size-4 shrink-0" data-icon="inline-start" />
            {set.label}
            <span className="ml-auto text-xs font-medium opacity-60">{set.assets.length}</span>
          </InsertMenuActionButton>
        ))}
      </div>
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
  onSelectEmoji,
}: {
  isDesktopPopover: boolean
  onSelectEmoji: (emoji: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(10)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const updateColumns = () => {
      const width = node.getBoundingClientRect().width
      setColumns(Math.max(7, Math.min(12, Math.floor(width / 36))))
    }

    updateColumns()
    const observer = new ResizeObserver(updateColumns)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="w-full min-w-0">
      <EmojiPicker
        className={cn(
          "h-[22rem] min-w-0 w-full border-0 bg-transparent shadow-none [--frimousse-row-height:2.25rem]",
          isDesktopPopover
            ? "text-[var(--dn-fg)] [--frimousse-emoji-font:'Apple_Color_Emoji','Segoe_UI_Emoji','Noto_Color_Emoji',sans-serif]"
            : "dn-squircle-sm border border-[var(--ws-line)] bg-[var(--ws-panel-bg)]",
        )}
        columns={columns}
        data-slot="drafting-insert-menu-emoji-picker"
        onEmojiSelect={({ emoji }) => onSelectEmoji(emoji)}
      >
        <EmojiPickerSearch
          className={cn(
            "border-0 bg-transparent px-0",
            isDesktopPopover
              ? "border-b border-[var(--dn-line)] [&_input]:bg-transparent [&_input]:placeholder:text-[var(--dn-muted)]"
              : "border-b border-[var(--ws-line)]",
          )}
          placeholder="Search emoji…"
        />
        <EmojiPickerContent
          className={cn(
            isDesktopPopover &&
              "[&_[data-slot=emoji-picker-category-header]]:hidden [&_[data-slot=emoji-picker-emoji]]:hover:bg-[var(--dn-control-hover)] [&_[data-slot=emoji-picker-emoji][data-active]]:bg-[var(--dn-control-hover)]",
          )}
        />
      </EmojiPicker>
    </div>
  )
}
