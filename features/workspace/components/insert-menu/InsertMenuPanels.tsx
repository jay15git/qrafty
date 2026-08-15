"use client"

import { CopyPlusIcon, FrameIcon, Grid2X2Icon, ImageIcon, SparklesIcon, TypeIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SecondaryButton } from "@/components/ui/secondary-button"
import FileUpload from "@/components/vendor/kokonutui/file-upload"
import { ElementShapeOptionGrid } from "@/features/workspace/components/ElementShapeOptionGrid"
import { PaperShaderOptionGrid } from "@/features/workspace/components/PaperShaderOptionGrid"
import type { DraftingElementShapeId } from "@/features/workspace/model/layers"
import type { PaperShaderId } from "@/features/workspace/rendering/paper-shaders"
import { cn } from "@/lib/utils"

export const DESKTOP_INSERT_MENU_ITEM =
  "flex h-10 w-full items-center gap-2 rounded-[10px] px-2 text-left text-sm font-semibold text-current transition hover:bg-white/[0.11] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45 disabled:cursor-not-allowed disabled:opacity-40"

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
        className={DESKTOP_INSERT_MENU_ITEM}
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

export function InsertMenuRootPanel({
  canAddQrCode,
  isDesktopPopover,
  onAddQrCode,
  onInsertText,
  onOpenCardPatternSettings,
  onOpenImagePanel,
  onOpenShapePanel,
  onOpenShaderPanel,
}: {
  canAddQrCode: boolean
  isDesktopPopover: boolean
  onAddQrCode?: () => void
  onInsertText: () => void
  onOpenCardPatternSettings?: () => void
  onOpenImagePanel: () => void
  onOpenShapePanel: () => void
  onOpenShaderPanel: () => void
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
      {onOpenCardPatternSettings ? (
        <InsertMenuActionButton
          isDesktopPopover={isDesktopPopover}
          onClick={onOpenCardPatternSettings}
          slot="drafting-insert-menu-pattern"
        >
          <Grid2X2Icon className="size-4 shrink-0" data-icon="inline-start" />
          Pattern
        </InsertMenuActionButton>
      ) : null}
      <InsertMenuActionButton isDesktopPopover={isDesktopPopover} onClick={onOpenImagePanel}>
        <ImageIcon className="size-4 shrink-0" data-icon="inline-start" />
        Image
      </InsertMenuActionButton>
      <InsertMenuActionButton isDesktopPopover={isDesktopPopover} onClick={onOpenShaderPanel}>
        <SparklesIcon className="size-4 shrink-0" data-icon="inline-start" />
        Shader
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
      <div className="flex items-center justify-between gap-2">
        <p
          className={cn(
            "font-semibold",
            isDesktopPopover
              ? "text-sm text-white/72"
              : "ws-type-control-label text-[var(--ws-ink)]",
          )}
        >
          Choose shape
        </p>
        <Button
          className={isDesktopPopover ? "text-white/70 hover:bg-white/[0.11] hover:text-white" : undefined}
          size="sm"
          type="button"
          variant="ghost"
          onClick={onBack}
        >
          Back
        </Button>
      </div>
      <ElementShapeOptionGrid
        decorativeDataSlot="drafting-insert-decorative-shape-grid"
        variant={isDesktopPopover ? "insert-desktop" : "insert-drafting"}
        onSelect={onSelectShape}
      />
    </div>
  )
}

export function InsertMenuShaderPanel({
  isDesktopPopover,
  onBack,
  onSelectShader,
}: {
  isDesktopPopover: boolean
  onBack: () => void
  onSelectShader: (shaderId: PaperShaderId) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p
          className={cn(
            "font-semibold",
            isDesktopPopover
              ? "text-sm text-white/72"
              : "ws-type-control-label text-[var(--ws-ink)]",
          )}
        >
          Choose shader
        </p>
        <Button
          className={isDesktopPopover ? "text-white/70 hover:bg-white/[0.11] hover:text-white" : undefined}
          size="sm"
          type="button"
          variant="ghost"
          onClick={onBack}
        >
          Back
        </Button>
      </div>
      <PaperShaderOptionGrid
        dataSlot="drafting-paper-shader-insert-grid"
        variant={isDesktopPopover ? "insert-desktop" : "insert-drafting"}
        onSelect={onSelectShader}
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
      <div className="flex items-center justify-between gap-2">
        <p
          className={cn(
            "font-semibold",
            isDesktopPopover
              ? "text-sm text-white/72"
              : "ws-type-control-label text-[var(--ws-ink)]",
          )}
        >
          Add image
        </p>
        <Button
          className={isDesktopPopover ? "text-white/70 hover:bg-white/[0.11] hover:text-white" : undefined}
          size="sm"
          type="button"
          variant="ghost"
          onClick={onBack}
        >
          Back
        </Button>
      </div>
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
              isDesktopPopover ? "bg-white/12" : "bg-[var(--ws-line)]",
            )}
          />
          <span
            className={cn(
              "text-xs font-medium",
              isDesktopPopover ? "text-white/45" : "text-[var(--ws-ink-muted)]",
            )}
          >
            or
          </span>
          <div
            className={cn(
              "h-px flex-1",
              isDesktopPopover ? "bg-white/12" : "bg-[var(--ws-line)]",
            )}
          />
        </div>
      ) : null}
      <Input
        aria-label="Image URL"
        className={cn(
          "h-10 min-w-0 px-3 shadow-none",
          isDesktopPopover
            ? "border-white/[0.12] bg-white/[0.08] text-white placeholder:text-white/40"
            : "ws-type-input border-[var(--ws-line)] bg-[var(--ws-panel-bg-hover)] text-[var(--ws-ink)]",
        )}
        placeholder="https://example.com/photo.png"
        value={imageUrl}
        onChange={(event) => onImageUrlChange(event.currentTarget.value)}
      />
      {isDesktopPopover ? (
        <button
          className={DESKTOP_INSERT_MENU_ITEM}
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
