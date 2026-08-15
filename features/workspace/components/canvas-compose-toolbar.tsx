"use client"

import type { ReactElement, ReactNode } from "react"
import {
  CopyPlusIcon,
  CrosshairIcon,
  Grid3X3Icon,
  HandIcon,
  MagnetIcon,
  Maximize2Icon,
  Minimize2Icon,
  MinusIcon,
  MousePointer2Icon,
  PlusIcon,
  Redo2Icon,
  Trash2Icon,
  TypeIcon,
  Undo2Icon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react"

import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import {
  DESKTOP_CANVAS_GLASS_TOOLBAR_VERTICAL_SHELL_CLASS,
  DESKTOP_COMPOSE_TOOLBAR_ICON_BUTTON_CLASS,
  DESKTOP_GLASS_TOOLBAR_ICON_BUTTON_CLASS,
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

export function ComposeToolbarTooltip({
  content,
  desktop,
  children,
}: {
  content: ReactNode
  desktop: boolean
  children: ReactElement
}) {
  if (desktop) {
    return (
      <DesktopTooltip content={content} side="left" sideOffset={10}>
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
  isDesktopZoomToolbar: boolean,
  ...extra: Array<string | false | null | undefined>
) {
  return cn(
    isDesktopZoomToolbar
      ? DESKTOP_COMPOSE_TOOLBAR_ICON_BUTTON_CLASS
      : COMPOSE_TOOLBAR_NEUTRAL_ICON_BUTTON_CLASS,
    ...extra,
  )
}

type CanvasComposeToolbarProps = {
  activeCanvasTool?: DraftingPaneCanvasTool | null
  activeInteractionTool: "select" | "pan" | "text"
  activePaneId: string
  activeZoom: number
  history?: CanvasHistoryControls
  qr?: CanvasQrControls
  canRemove: boolean
  insertNodeId?: string
  isDesktopZoomToolbar: boolean
  isMaximized: boolean
  onAddTextLayerAt?: (paneId: string, point: { x: number; y: number }) => void
  onBrowseStockPhotos?: () => void
  onCanvasGridChange?: (showGrid: boolean) => void
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
  showCanvasGrid?: boolean
  snapEnabled: boolean
  onSnapEnabledChange: (enabled: boolean) => void
  toolbarVariant?: DraftingPaneToolbarVariant
  zoomPercent: string
}

export function CanvasComposeToolbar({
  activeCanvasTool,
  activeInteractionTool,
  activePaneId,
  activeZoom,
  history = { canUndo: false, canRedo: false },
  qr = { canAdd: true },
  canRemove,
  insertNodeId,
  isDesktopZoomToolbar,
  isMaximized,
  onAddTextLayerAt,
  onBrowseStockPhotos,
  onCanvasGridChange,
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
  showCanvasGrid = true,
  snapEnabled,
  onSnapEnabledChange,
  zoomPercent,
}: CanvasComposeToolbarProps) {
  const { canUndo, canRedo, onUndo, onRedo } = history
  const { canAdd: canAddQrCode, onAdd: onAddQrCode } = qr

  return (
    <>
      <div
        data-slot={isDesktopZoomToolbar ? "desktop-compose-toolbar-anchor" : undefined}
        className={cn(
          "pointer-events-none absolute z-[60] flex",
          isDesktopZoomToolbar
            ? "right-5 top-1/2 max-md:right-4 -translate-y-1/2 flex-col items-end"
            : "bottom-4 justify-center inset-x-5 px-2 sm:inset-x-6 lg:inset-x-8",
        )}
      >
        <div
          data-slot="desktop-compose-toolbar"
          data-toolbar-appearance={isDesktopZoomToolbar ? "desktop-glass" : "neutral"}
          className={cn(
            "pointer-events-auto max-w-full flex-wrap justify-center",
            isDesktopZoomToolbar
              ? DESKTOP_CANVAS_GLASS_TOOLBAR_VERTICAL_SHELL_CLASS
              : "inline-flex items-center gap-1 rounded-[10px] bg-[var(--ws-panel-bg-active)] px-2 py-1.5",
          )}
        >
          {!isDesktopZoomToolbar ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Zoom out preview"
                    className={getComposeToolbarIconButtonClass(isDesktopZoomToolbar)}
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
                    className={getComposeToolbarIconButtonClass(isDesktopZoomToolbar)}
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
                    className={getComposeToolbarIconButtonClass(isDesktopZoomToolbar)}
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

          {isDesktopZoomToolbar && !previewLocked ? (
            <>
              <ComposeToolbarTooltip
                content="Select and move elements"
                desktop={isDesktopZoomToolbar}
              >
                <Button
                  aria-label="Select and move elements"
                  aria-pressed={activeInteractionTool === "select"}
                  className={getComposeToolbarIconButtonClass(
                    isDesktopZoomToolbar,
                    activeInteractionTool === "select" &&
                      "bg-[var(--ws-ink)] text-[var(--ws-paper)] hover:bg-[var(--ws-ink)] hover:text-[var(--ws-paper)]",
                  )}
                  onClick={() => onCanvasToolChange?.("select")}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <MousePointer2Icon />
                </Button>
              </ComposeToolbarTooltip>

              <ComposeToolbarTooltip content="Pan canvas" desktop={isDesktopZoomToolbar}>
                <Button
                  aria-label="Pan canvas"
                  aria-pressed={activeInteractionTool === "pan"}
                  className={getComposeToolbarIconButtonClass(
                    isDesktopZoomToolbar,
                    activeInteractionTool === "pan" &&
                      "bg-[var(--ws-ink)] text-[var(--ws-paper)] hover:bg-[var(--ws-ink)] hover:text-[var(--ws-paper)]",
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
            desktop={isDesktopZoomToolbar}
          >
            <Button
              aria-label={snapEnabled ? "Disable snapping" : "Enable snapping"}
              aria-pressed={snapEnabled}
              className={getComposeToolbarIconButtonClass(
                isDesktopZoomToolbar,
                snapEnabled &&
                  "bg-[var(--ws-ink)] text-[var(--ws-paper)] hover:bg-[var(--ws-ink)] hover:text-[var(--ws-paper)]",
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
              {!isDesktopZoomToolbar ? <div className="mx-1 h-4 w-px bg-[var(--ws-line)]" /> : null}
              <ComposeToolbarTooltip
                content={isMaximized ? "Restore layout" : "Maximize pane"}
                desktop={isDesktopZoomToolbar}
              >
                <Button
                  aria-label={isMaximized ? "Restore layout" : "Maximize pane"}
                  className={getComposeToolbarIconButtonClass(isDesktopZoomToolbar)}
                  onClick={onToggleMaximize}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  {isMaximized ? (
                    <Minimize2Icon />
                  ) : (
                    <Maximize2Icon />
                  )}
                </Button>
              </ComposeToolbarTooltip>
            </>
          )}

          {!isDesktopZoomToolbar ? <div className="mx-1 h-4 w-px bg-[var(--ws-line)]" /> : null}

          {isDesktopZoomToolbar ? (
            <>
              <ComposeToolbarTooltip
                content={showCanvasGrid ? "Grid on" : "Grid off"}
                desktop={isDesktopZoomToolbar}
              >
                <Button
                  aria-label={showCanvasGrid ? "Hide canvas grid" : "Show canvas grid"}
                  aria-pressed={showCanvasGrid}
                  className={getComposeToolbarIconButtonClass(
                    isDesktopZoomToolbar,
                    showCanvasGrid &&
                      "bg-[var(--ws-ink)] text-[var(--ws-paper)] hover:bg-[var(--ws-ink)] hover:text-[var(--ws-paper)]",
                  )}
                  onClick={() => onCanvasGridChange?.(!showCanvasGrid)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Grid3X3Icon />
                </Button>
              </ComposeToolbarTooltip>
            </>
          ) : null}

          {onAddQrCode || onInsertLayer ? (
            <>
              {isDesktopZoomToolbar ? (
                <>
                  <ComposeToolbarTooltip
                    content="Click canvas to add text"
                    desktop={isDesktopZoomToolbar}
                  >
                    <Button
                      aria-label="Add text on canvas"
                      aria-pressed={activeCanvasTool === "text"}
                      className={getComposeToolbarIconButtonClass(
                        isDesktopZoomToolbar,
                        "disabled:opacity-40",
                        activeCanvasTool === "text" &&
                          "bg-[var(--ws-ink)] text-[var(--ws-paper)] hover:bg-[var(--ws-ink)] hover:text-[var(--ws-paper)]",
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
                </>
              ) : null}

              {onInsertLayer && insertNodeId ? (
                <InsertMenu
                  canAddQrCode={canAddQrCode}
                  nodeId={insertNodeId}
                  triggerClassName={
                    isDesktopZoomToolbar ? DESKTOP_COMPOSE_TOOLBAR_ICON_BUTTON_CLASS : undefined
                  }
                  variant="bottom-toolbar"
                  onAddQrCode={onAddQrCode}
                  onBrowseStockPhotos={onBrowseStockPhotos}
                  onOpenCardPatternSettings={onOpenCardPatternSettings}
                  onInsertLayer={onInsertLayer}
                />
              ) : onAddQrCode ? (
                <ComposeToolbarTooltip
                  content={canAddQrCode ? "Add QR code" : "Maximum 10 QR codes reached"}
                  desktop={isDesktopZoomToolbar}
                >
                  <Button
                    aria-label="Add QR code"
                    className={getComposeToolbarIconButtonClass(
                      isDesktopZoomToolbar,
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
                <ComposeToolbarTooltip content="Remove QR code" desktop={isDesktopZoomToolbar}>
                  <Button
                    aria-label="Remove QR code"
                    className={getComposeToolbarIconButtonClass(isDesktopZoomToolbar)}
                    onClick={() => onRemoveQrCode?.(activePaneId)}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2Icon />
                  </Button>
                </ComposeToolbarTooltip>
              ) : null}

              {!isDesktopZoomToolbar ? <div className="mx-1 h-4 w-px bg-[var(--ws-line)]" /> : null}
            </>
          ) : null}

          {!isDesktopZoomToolbar ? (
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
        </div>
      </div>

      {isDesktopZoomToolbar ? (
        <div
          data-slot="desktop-resize-toolbar-anchor"
          className="pointer-events-none absolute bottom-4 right-5 z-[60] flex justify-end max-md:right-4"
        >
          <div
            data-slot="desktop-resize-toolbar"
            data-toolbar-appearance="desktop-glass"
            className={cn("pointer-events-auto", DESKTOP_CANVAS_GLASS_TOOLBAR_VERTICAL_SHELL_CLASS)}
          >
            <button
              aria-label="Increase canvas size"
              className={DESKTOP_GLASS_TOOLBAR_ICON_BUTTON_CLASS}
              disabled={activeZoom >= MAX_PREVIEW_ZOOM}
              type="button"
              onClick={onZoomIn}
            >
              <PlusIcon className="size-3.5" strokeWidth={2.3} />
            </button>
            <button
              aria-label="Decrease canvas size"
              className={DESKTOP_GLASS_TOOLBAR_ICON_BUTTON_CLASS}
              disabled={activeZoom <= MIN_PREVIEW_ZOOM}
              type="button"
              onClick={onZoomOut}
            >
              <MinusIcon className="size-3.5" strokeWidth={2.6} />
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
