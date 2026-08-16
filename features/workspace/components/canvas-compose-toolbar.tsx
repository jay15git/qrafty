"use client"

import type { ReactElement, ReactNode } from "react"
import {
  CopyPlusIcon,
  CrosshairIcon,
  HandIcon,
  MagnetIcon,
  Maximize2Icon,
  Minimize2Icon,
  MousePointer2Icon,
  Redo2Icon,
  Trash2Icon,
  TypeIcon,
  Undo2Icon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react"

import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import {
  DESKTOP_COMPOSE_TOOLBAR_ICON_BUTTON_CLASS,
  DESKTOP_GLASS_TOOLBAR_ICON_BUTTON_ACTIVE_CLASS,
} from "@/features/desktop-shell/components/desktop-utility-toolbar.constants"
import type {
  CanvasHistoryControls,
  CanvasQrControls,
} from "@/features/workspace/components/canvas-control-props"
import type {
  DraftingPaneCanvasTool,
  DraftingPaneToolbarVariant,
} from "@/features/workspace/components/DraftingPaneSurface"
import { InsertMenu } from "@/features/workspace/components/InsertMenu"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DesktopTooltip } from "@/features/desktop-shell/components/DesktopTooltip"
import { cn } from "@/lib/utils"

export const MIN_PREVIEW_ZOOM = 0.1
export const MAX_PREVIEW_ZOOM = 4

export const COMPOSE_TOOLBAR_NEUTRAL_ICON_BUTTON_CLASS =
  "h-7 w-7 rounded-md border-0 bg-transparent p-0 text-[var(--ws-ink-muted)] shadow-none transition-colors duration-150 hover:bg-transparent hover:text-[var(--ws-ink)] [&_svg]:size-3.5"

export type ComposeToolbarPlacement = "canvas-floating" | "dynamic-island"

export function ComposeToolbarTooltip({
  content,
  desktop,
  placement = "canvas-floating",
  children,
}: {
  content: ReactNode
  desktop: boolean
  placement?: ComposeToolbarPlacement
  children: ReactElement
}) {
  if (desktop) {
    return (
      <DesktopTooltip
        content={content}
        side={placement === "dynamic-island" ? "bottom" : "left"}
        sideOffset={10}
      >
        {children}
      </DesktopTooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  )
}

export function getComposeToolbarIconButtonClass(
  isDesktopGlassToolbar: boolean,
  ...extra: Array<string | false | null | undefined>
) {
  return cn(
    isDesktopGlassToolbar
      ? DESKTOP_COMPOSE_TOOLBAR_ICON_BUTTON_CLASS
      : COMPOSE_TOOLBAR_NEUTRAL_ICON_BUTTON_CLASS,
    ...extra,
  )
}

type ComposeToolbarControlsProps = {
  activeCanvasTool?: DraftingPaneCanvasTool | null
  activeInteractionTool: "select" | "pan" | "text"
  activePaneId: string
  history?: CanvasHistoryControls
  qr?: CanvasQrControls
  canRemove: boolean
  insertNodeId?: string
  isDesktopGlassToolbar: boolean
  isMaximized: boolean
  placement?: ComposeToolbarPlacement
  onAddTextLayerAt?: (paneId: string, point: { x: number; y: number }) => void
  onBrowseStockPhotos?: () => void
  onCanvasToolChange?: (tool: DraftingPaneCanvasTool | null) => void
  onInsertLayer?: (layer: DraftingCanvasLayer) => void
  onOpenCardPatternSettings?: () => void
  onRemoveQrCode?: (paneId: string) => void
  onResetView: () => void
  onToggleMaximize: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  paneCount: number
  previewLocked?: boolean
  showDesktopInteractionTools?: boolean
  snapEnabled: boolean
  onSnapEnabledChange: (enabled: boolean) => void
  toolbarVariant?: DraftingPaneToolbarVariant
  zoomPercent: string
}

export function ComposeToolbarControls({
  activeCanvasTool,
  activeInteractionTool,
  activePaneId,
  history = { canUndo: false, canRedo: false },
  qr = { canAdd: true },
  canRemove,
  insertNodeId,
  isDesktopGlassToolbar,
  isMaximized,
  placement = "canvas-floating",
  onAddTextLayerAt,
  onBrowseStockPhotos,
  onCanvasToolChange,
  onInsertLayer,
  onOpenCardPatternSettings,
  onRemoveQrCode,
  onResetView,
  onToggleMaximize,
  onZoomIn,
  onZoomOut,
  paneCount,
  previewLocked = false,
  showDesktopInteractionTools = true,
  snapEnabled,
  onSnapEnabledChange,
  toolbarVariant = "default",
  zoomPercent,
}: ComposeToolbarControlsProps) {
  const { canUndo, canRedo, onUndo, onRedo } = history
  const { canAdd: canAddQrCode, onAdd: onAddQrCode } = qr
  const insertMenuVariant =
    placement === "dynamic-island" ? "dynamic-island" : "bottom-toolbar"

  return (
    <>
      {!isDesktopGlassToolbar ? (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Zoom out preview"
                className={getComposeToolbarIconButtonClass(isDesktopGlassToolbar)}
                onClick={onZoomOut}
                size="icon"
                type="button"
                variant="ghost"
              >
                <ZoomOutIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom out</TooltipContent>
          </Tooltip>

          <div className="min-w-12 px-1 text-center font-semibold ws-type-data text-[var(--ws-ink)]">
            {zoomPercent}
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Zoom in preview"
                className={getComposeToolbarIconButtonClass(isDesktopGlassToolbar)}
                onClick={onZoomIn}
                size="icon"
                type="button"
                variant="ghost"
              >
                <ZoomInIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom in</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Reset view"
                className={getComposeToolbarIconButtonClass(isDesktopGlassToolbar)}
                onClick={onResetView}
                size="icon"
                type="button"
                variant="ghost"
              >
                <CrosshairIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset view</TooltipContent>
          </Tooltip>

          <div className="mx-1 h-4 w-px bg-[var(--ws-line)]" />
        </>
      ) : null}

      {isDesktopGlassToolbar && showDesktopInteractionTools && !previewLocked ? (
        <>
          <ComposeToolbarTooltip
            content="Select and move elements"
            desktop={isDesktopGlassToolbar}
            placement={placement}
          >
            <Button
              aria-label="Select and move elements"
              aria-pressed={activeInteractionTool === "select"}
              className={getComposeToolbarIconButtonClass(
                isDesktopGlassToolbar,
                activeInteractionTool === "select" && DESKTOP_GLASS_TOOLBAR_ICON_BUTTON_ACTIVE_CLASS,
              )}
              onClick={() => onCanvasToolChange?.("select")}
              size="icon"
              type="button"
              variant="ghost"
            >
              <MousePointer2Icon />
            </Button>
          </ComposeToolbarTooltip>

          <ComposeToolbarTooltip content="Pan canvas" desktop={isDesktopGlassToolbar} placement={placement}>
            <Button
              aria-label="Pan canvas"
              aria-pressed={activeInteractionTool === "pan"}
              className={getComposeToolbarIconButtonClass(
                isDesktopGlassToolbar,
                activeInteractionTool === "pan" && DESKTOP_GLASS_TOOLBAR_ICON_BUTTON_ACTIVE_CLASS,
              )}
              onClick={() => onCanvasToolChange?.("pan")}
              size="icon"
              type="button"
              variant="ghost"
            >
              <HandIcon />
            </Button>
          </ComposeToolbarTooltip>
        </>
      ) : null}

      <ComposeToolbarTooltip
        content={snapEnabled ? "Snapping on" : "Snapping off"}
        desktop={isDesktopGlassToolbar}
        placement={placement}
      >
        <Button
          aria-label={snapEnabled ? "Disable snapping" : "Enable snapping"}
          aria-pressed={snapEnabled}
          className={getComposeToolbarIconButtonClass(
            isDesktopGlassToolbar,
            snapEnabled && DESKTOP_GLASS_TOOLBAR_ICON_BUTTON_ACTIVE_CLASS,
          )}
          onClick={() => onSnapEnabledChange(!snapEnabled)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <MagnetIcon />
        </Button>
      </ComposeToolbarTooltip>

      {paneCount > 1 && (
        <>
          {!isDesktopGlassToolbar ? <div className="mx-1 h-4 w-px bg-[var(--ws-line)]" /> : null}
          <ComposeToolbarTooltip
            content={isMaximized ? "Restore layout" : "Maximize pane"}
            desktop={isDesktopGlassToolbar}
            placement={placement}
          >
            <Button
              aria-label={isMaximized ? "Restore layout" : "Maximize pane"}
              className={getComposeToolbarIconButtonClass(isDesktopGlassToolbar)}
              onClick={onToggleMaximize}
              size="icon"
              type="button"
              variant="ghost"
            >
              {isMaximized ? <Minimize2Icon /> : <Maximize2Icon />}
            </Button>
          </ComposeToolbarTooltip>
        </>
      )}

      {onAddQrCode || onInsertLayer ? (
        <>
          {isDesktopGlassToolbar ? (
            <ComposeToolbarTooltip
              content="Click canvas to add text"
              desktop={isDesktopGlassToolbar}
              placement={placement}
            >
              <Button
                aria-label="Add text on canvas"
                aria-pressed={activeCanvasTool === "text"}
                className={getComposeToolbarIconButtonClass(
                  isDesktopGlassToolbar,
                  "disabled:opacity-40",
                  activeCanvasTool === "text" && DESKTOP_GLASS_TOOLBAR_ICON_BUTTON_ACTIVE_CLASS,
                )}
                disabled={!onAddTextLayerAt}
                onClick={() =>
                  onCanvasToolChange?.(activeCanvasTool === "text" ? "select" : "text")
                }
                size="icon"
                type="button"
                variant="ghost"
              >
                <TypeIcon />
              </Button>
            </ComposeToolbarTooltip>
          ) : null}

          {onInsertLayer && insertNodeId ? (
            <InsertMenu
              canAddQrCode={canAddQrCode}
              nodeId={insertNodeId}
              triggerClassName={
                isDesktopGlassToolbar ? DESKTOP_COMPOSE_TOOLBAR_ICON_BUTTON_CLASS : undefined
              }
              variant={insertMenuVariant}
              onAddQrCode={onAddQrCode}
              onBrowseStockPhotos={onBrowseStockPhotos}
              onOpenCardPatternSettings={onOpenCardPatternSettings}
              onInsertLayer={onInsertLayer}
            />
          ) : onAddQrCode ? (
            <ComposeToolbarTooltip
              content={canAddQrCode ? "Add QR code" : "Maximum 10 QR codes reached"}
              desktop={isDesktopGlassToolbar}
              placement={placement}
            >
              <Button
                aria-label="Add QR code"
                className={getComposeToolbarIconButtonClass(
                  isDesktopGlassToolbar,
                  "disabled:opacity-40",
                )}
                onClick={onAddQrCode}
                disabled={!canAddQrCode}
                size="icon"
                type="button"
                variant="ghost"
              >
                <CopyPlusIcon />
              </Button>
            </ComposeToolbarTooltip>
          ) : null}

          {canRemove ? (
            <ComposeToolbarTooltip content="Remove QR code" desktop={isDesktopGlassToolbar} placement={placement}>
              <Button
                aria-label="Remove QR code"
                className={getComposeToolbarIconButtonClass(isDesktopGlassToolbar)}
                onClick={() => onRemoveQrCode?.(activePaneId)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash2Icon />
              </Button>
            </ComposeToolbarTooltip>
          ) : null}

          {!isDesktopGlassToolbar ? <div className="mx-1 h-4 w-px bg-[var(--ws-line)]" /> : null}
        </>
      ) : null}

      {!isDesktopGlassToolbar ? (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Undo"
                className="h-8 w-8 rounded-md border-0 bg-transparent p-0 text-[var(--ws-ink-muted)] shadow-none transition-colors duration-150 hover:bg-transparent hover:text-[var(--ws-ink)] disabled:opacity-40"
                disabled={!canUndo || !onUndo}
                onClick={onUndo}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Undo2Icon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Redo"
                className="h-8 w-8 rounded-md border-0 bg-transparent p-0 text-[var(--ws-ink-muted)] shadow-none transition-colors duration-150 hover:bg-transparent hover:text-[var(--ws-ink)] disabled:opacity-40"
                disabled={!canRedo || !onRedo}
                onClick={onRedo}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Redo2Icon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo</TooltipContent>
          </Tooltip>
        </>
      ) : null}
    </>
  )
}

type CanvasComposeToolbarProps = Omit<
  ComposeToolbarControlsProps,
  "isDesktopGlassToolbar" | "placement" | "showDesktopInteractionTools"
> & {
  isDesktopZoomToolbar: boolean
  toolbarVariant?: DraftingPaneToolbarVariant
}

export function CanvasComposeToolbar({
  isDesktopZoomToolbar,
  toolbarVariant = "default",
  ...controlsProps
}: CanvasComposeToolbarProps) {
  if (isDesktopZoomToolbar) {
    return null
  }

  return (
    <div
      data-slot="desktop-compose-toolbar-anchor"
      className={cn(
        "pointer-events-none absolute z-[60] flex",
        "bottom-4 justify-center inset-x-5 px-2 sm:inset-x-6 lg:inset-x-8",
      )}
    >
      <div
        data-slot="desktop-compose-toolbar"
        data-toolbar-appearance="neutral"
        className="pointer-events-auto inline-flex max-w-full flex-wrap items-center justify-center gap-1 rounded-[10px] bg-[var(--ws-panel-bg-active)] px-2 py-1.5"
      >
        <ComposeToolbarControls
          {...controlsProps}
          isDesktopGlassToolbar={false}
          placement="canvas-floating"
          showDesktopInteractionTools={false}
          toolbarVariant={toolbarVariant}
        />
      </div>
    </div>
  )
}

export function DynamicIslandComposeToolbar({
  ...controlsProps
}: Omit<ComposeToolbarControlsProps, "isDesktopGlassToolbar" | "placement" | "showDesktopInteractionTools">) {
  return (
    <div
      className="flex min-w-0 items-center gap-0.5"
      data-slot="desktop-compose-toolbar"
      data-toolbar-appearance="desktop-glass"
    >
      <ComposeToolbarControls
        {...controlsProps}
        isDesktopGlassToolbar
        placement="dynamic-island"
        showDesktopInteractionTools
        toolbarVariant="desktop-zoom"
      />
    </div>
  )
}
