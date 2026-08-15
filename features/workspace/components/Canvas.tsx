"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from "react"
import {
  CheckIcon,
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
  DESKTOP_CANVAS_GLASS_TOOLBAR_SHELL_CLASS,
  DESKTOP_CANVAS_GLASS_TOOLBAR_VERTICAL_SHELL_CLASS,
  DESKTOP_COMPOSE_TOOLBAR_ICON_BUTTON_CLASS,
  DESKTOP_GLASS_TOOLBAR_ICON_BUTTON_CLASS,
} from "@/features/desktop-shell/components/desktop-utility-toolbar.constants"
import {
  DraftingPaneSurface,
  type DraftingPane,
  type DraftingPaneCanvasTool,
  type DraftingPaneToolbarVariant,
} from "@/features/workspace/components/DraftingPaneSurface"
import { type DraftingLayerMenuAction } from "@/features/workspace/components/Pane"
import { InsertMenu } from "@/features/workspace/components/InsertMenu"
import { getQrLayout } from "@/features/workspace/model/layout-engine"
import { Button } from "@/components/ui/button"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DesktopTooltip } from "@/features/desktop-shell/components/DesktopTooltip"
import { cn } from "@/lib/utils"

type DraftingPanelLayouts = Record<string, Record<string, number>>
type DraftingPanePanOffsets = Record<string, { x: number; y: number }>

export type { DraftingPaneCanvasTool, DraftingPaneToolbarVariant } from "@/features/workspace/components/DraftingPaneSurface"

const MIN_PREVIEW_ZOOM = 0.1
const MAX_PREVIEW_ZOOM = 4
const PREVIEW_ZOOM_STEP = 0.1

const COMPOSE_TOOLBAR_NEUTRAL_ICON_BUTTON_CLASS =
  "h-7 w-7 rounded-md border-0 bg-transparent p-0 text-[var(--ws-ink-muted)] shadow-none transition-colors duration-150 hover:bg-transparent hover:text-[var(--ws-ink)] [&_svg]:size-3.5"

function ComposeToolbarTooltip({
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
function getComposeToolbarIconButtonClass(
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

type CanvasProps = {
  panes: DraftingPane[]
  activePaneId: string
  canAddQrCode?: boolean
  canRedo?: boolean
  canUndo?: boolean
  onAddQrCode?: () => void
  onInsertLayer?: (layer: DraftingCanvasLayer) => void
  insertNodeId?: string
  onBrowseStockPhotos?: () => void
  onOpenCardPatternSettings?: () => void
  onRedo?: () => void
  onRemoveQrCode?: (paneId: string) => void
  onUndo?: () => void
  onPaneSelect: (paneId: string) => void
  onPaneQrClick: (paneId: string) => void
  onSwapPanes?: (sourcePaneId: string, targetPaneId: string) => void
  onLayerChange?: (
    paneId: string,
    layerId: string,
    patch: Partial<DraftingCanvasLayer>,
  ) => void
  onLayerAction?: (
    paneId: string,
    layerIds: string[],
    action: DraftingLayerMenuAction,
  ) => void
  onLayerCopy?: (paneId: string, layerIds: string[]) => void
  onLayerPaste?: (paneId: string, point: { x: number; y: number }) => void
  onLayerSelect?: (
    paneId: string,
    layerId: string | null,
    options?: { additive?: boolean },
  ) => void
  onLayerSelectionChange?: (
    paneId: string,
    layerIds: string[],
    options?: { additive?: boolean },
  ) => void
  activeCanvasTool?: DraftingPaneCanvasTool | null
  onAddTextLayerAt?: (paneId: string, point: { x: number; y: number }) => void
  onCanvasToolChange?: (tool: DraftingPaneCanvasTool | null) => void
  onCanvasGridChange?: (showGrid: boolean) => void
  showCanvasGrid?: boolean
  selectedLayerId?: string | null
  selectedLayerIds?: string[]
  toolbarVariant?: DraftingPaneToolbarVariant
  layerEditingEnabled?: boolean
  previewLocked?: boolean
  fitCanvasToViewport?: boolean
}

function groupPanes<T>(panes: T[], groups: number[]) {
  let start = 0

  return groups.map((groupSize) => {
    const group = panes.slice(start, start + groupSize)
    start += groupSize
    return group
  })
}

function getPortraitSnapshot() {
  if (typeof window === "undefined" || !window.matchMedia) return false
  return window.matchMedia("(orientation: portrait)").matches
}

function subscribePortrait(callback: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {}
  const mql = window.matchMedia("(orientation: portrait)")
  mql.addEventListener("change", callback)
  return () => mql.removeEventListener("change", callback)
}

function DraftingResizeHandle() {
  return (
    <ResizableHandle
      data-slot="drafting-resize-handle"
      className={cn(
        "z-10 bg-[var(--ws-line)] transition-colors duration-150 hover:bg-[var(--ws-line-hover)] active:bg-[var(--ws-line-strong)]",
        "focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0",
        "after:w-5 after:bg-transparent aria-[orientation=horizontal]:after:h-5 aria-[orientation=horizontal]:after:bg-transparent",
        "before:absolute before:left-1/2 before:top-1/2 before:z-10 before:h-7 before:w-px before:-translate-x-1/2 before:-translate-y-1/2 before:bg-[var(--ws-ink-muted)] before:opacity-45 before:content-['']",
        "aria-[orientation=horizontal]:before:h-px aria-[orientation=horizontal]:before:w-7",
      )}
    />
  )
}

function clampPreviewZoom(value: number) {
  return Math.min(MAX_PREVIEW_ZOOM, Math.max(MIN_PREVIEW_ZOOM, value))
}

export function Canvas({
  panes,
  activePaneId,
  canAddQrCode = true,
  canRedo = false,
  canUndo = false,
  onAddQrCode,
  onInsertLayer,
  insertNodeId,
  onBrowseStockPhotos,
  onOpenCardPatternSettings,
  onRedo,
  onRemoveQrCode,
  onUndo,
  onPaneSelect,
  onPaneQrClick,
  onSwapPanes,
  onLayerChange,
  onLayerAction,
  onLayerCopy,
  onLayerPaste,
  onLayerSelect,
  onLayerSelectionChange,
  activeCanvasTool,
  onAddTextLayerAt,
  onCanvasToolChange,
  onCanvasGridChange,
  showCanvasGrid = true,
  selectedLayerId,
  selectedLayerIds,
  toolbarVariant = "default",
  layerEditingEnabled = true,
  previewLocked = false,
  fitCanvasToViewport = false,
}: CanvasProps) {
  const [zoomLevels, setZoomLevels] = useState<Record<string, number>>({})
  const [panOffsets, setPanOffsets] = useState<DraftingPanePanOffsets>({})
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [maximizedPaneId, setMaximizedPaneId] = useState<string | null>(null)
  const [draggingPaneId, setDraggingPaneId] = useState<string | null>(null)
  const [snapTargetPaneId, setSnapTargetPaneId] = useState<string | null>(null)
  const [panelLayouts, setPanelLayouts] = useState<DraftingPanelLayouts>({})
  const draggingPaneIdRef = useRef<string | null>(null)
  const isPortrait = useSyncExternalStore(
    subscribePortrait,
    getPortraitSnapshot,
    () => false,
  )

  const activeZoom = zoomLevels[activePaneId] ?? 1

  const handleZoomOut = useCallback(() => {
    setZoomLevels((current) => ({
      ...current,
      [activePaneId]: clampPreviewZoom((current[activePaneId] ?? 1) - PREVIEW_ZOOM_STEP),
    }))
  }, [activePaneId])

  const handleZoomIn = useCallback(() => {
    setZoomLevels((current) => ({
      ...current,
      [activePaneId]: clampPreviewZoom((current[activePaneId] ?? 1) + PREVIEW_ZOOM_STEP),
    }))
  }, [activePaneId])

  const handlePaneZoom = useCallback((paneId: string, nextZoom: number) => {
    setZoomLevels((current) => ({
      ...current,
      [paneId]: clampPreviewZoom(nextZoom),
    }))
  }, [])

  const handleResetView = useCallback(() => {
    setZoomLevels((current) => ({
      ...current,
      [activePaneId]: 1,
    }))
    setPanOffsets((current) => ({
      ...current,
      [activePaneId]: { x: 0, y: 0 },
    }))
  }, [activePaneId])

  const handlePanePan = useCallback((paneId: string, nextPan: { x: number; y: number }) => {
    setPanOffsets((current) => ({
      ...current,
      [paneId]: nextPan,
    }))
  }, [])

  const zoomLevel = Math.round(activeZoom * 100)
  const zoomPercent = `${zoomLevel}%`
  const isDesktopZoomToolbar = toolbarVariant === "desktop-zoom"
  const activeInteractionTool = activeCanvasTool === "pan"
    ? "pan"
    : activeCanvasTool === "text"
      ? "text"
      : "select"

  const isMaximized = maximizedPaneId !== null

  const handleToggleMaximize = useCallback(() => {
    setMaximizedPaneId((current) => (current === null ? activePaneId : null))
  }, [activePaneId])

  const canRemove = panes.length > 1 && onRemoveQrCode

  const visiblePanes = isMaximized
    ? panes.filter((p) => p.id === activePaneId)
    : panes

  const canSwapPanes = panes.length > 1 && Boolean(onSwapPanes)
  const layout = panes.length > 0
    ? getQrLayout(isMaximized ? 1 : panes.length, isPortrait)
    : null
  const topLevelOrientation = layout?.direction === "rows" ? "vertical" : "horizontal"
  const nestedOrientation = layout?.direction === "rows" ? "horizontal" : "vertical"
  const layoutKey = layout
    ? `${layout.direction}-${layout.groups.join("-")}`
    : "empty"
  const rootPanelGroupId = `drafting-pane-layout-${layoutKey}-root`

  const handlePanelLayoutChange = useCallback(
    (groupId: string) => (nextLayout: Record<string, number>) => {
      setPanelLayouts((current) => {
        const previousLayout = current[groupId]

        if (
          previousLayout &&
          Object.keys(previousLayout).length === Object.keys(nextLayout).length &&
          Object.entries(nextLayout).every(
            ([panelId, size]) => previousLayout[panelId] === size,
          )
        ) {
          return current
        }

        return {
          ...current,
          [groupId]: nextLayout,
        }
      })
    },
    [],
  )

  const handlePaneDragStart = useCallback(
    (paneId: string, event: React.DragEvent<HTMLDivElement>) => {
      if (!canSwapPanes) {
        event.preventDefault()
        return
      }

      event.dataTransfer.effectAllowed = "move"
      event.dataTransfer.setData("text/plain", paneId)
      draggingPaneIdRef.current = paneId
      setDraggingPaneId(paneId)
      setSnapTargetPaneId(null)
    },
    [canSwapPanes],
  )

  const handlePaneDragOver = useCallback(
    (paneId: string, event: React.DragEvent<HTMLDivElement>) => {
      const sourcePaneId =
        draggingPaneIdRef.current || draggingPaneId || event.dataTransfer.getData("text/plain")

      if (!sourcePaneId || sourcePaneId === paneId) {
        return
      }

      event.preventDefault()
      event.dataTransfer.dropEffect = "move"
      setSnapTargetPaneId(paneId)
    },
    [draggingPaneId],
  )

  const handlePaneDragLeave = useCallback(
    (paneId: string, event: React.DragEvent<HTMLDivElement>) => {
      if (
        snapTargetPaneId === paneId &&
        event.relatedTarget instanceof Node &&
        event.currentTarget.contains(event.relatedTarget)
      ) {
        return
      }

      setSnapTargetPaneId((current) => (current === paneId ? null : current))
    },
    [snapTargetPaneId],
  )

  const handlePaneDrop = useCallback(
    (targetPaneId: string, event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()

      const sourcePaneId =
        draggingPaneIdRef.current || draggingPaneId || event.dataTransfer.getData("text/plain")

      draggingPaneIdRef.current = null
      setDraggingPaneId(null)
      setSnapTargetPaneId(null)

      if (!sourcePaneId || sourcePaneId === targetPaneId) {
        return
      }

      onSwapPanes?.(sourcePaneId, targetPaneId)
    },
    [draggingPaneId, onSwapPanes],
  )

  const handlePaneDragEnd = useCallback(() => {
    draggingPaneIdRef.current = null
    setDraggingPaneId(null)
    setSnapTargetPaneId(null)
  }, [])

  return (
    <TooltipProvider>
      <div className="relative flex h-full w-full flex-col">
        <div
          className="relative min-h-0 flex-1"
          onDrop={handlePaneDragEnd}
          onDragOver={(event) => {
            if (draggingPaneId) {
              event.preventDefault()
            }
          }}
        >
          {panes.length === 0 ? (
            <div className="grid h-full place-items-center text-sm font-medium text-[var(--ws-ink-muted)]">
              No QR codes
            </div>
          ) : (
            layout ? (
              <ResizablePanelGroup
                className="h-full w-full"
                data-layout-direction={layout.direction}
                data-resize-orientation={topLevelOrientation}
                data-slot="drafting-pane-layout"
                defaultLayout={panelLayouts[rootPanelGroupId]}
                id={rootPanelGroupId}
                onLayoutChange={handlePanelLayoutChange(rootPanelGroupId)}
                orientation={topLevelOrientation}
              >
                {groupPanes(visiblePanes, layout.groups).flatMap((group, groupIndex) => {
                  const groupPanelId = `group-${groupIndex}`
                  const nestedPanelGroupId = `drafting-pane-layout-${layoutKey}-group-${groupIndex}`
                  const groupPanel = (
                    <ResizablePanel
                      data-layout-group={groupIndex}
                      data-layout-group-size={group.length}
                      defaultSize={100 / layout.groups.length}
                      id={groupPanelId}
                      key={groupPanelId}
                      minSize={12}
                    >
                      <ResizablePanelGroup
                        className="h-full w-full"
                        data-resize-orientation={nestedOrientation}
                        defaultLayout={panelLayouts[nestedPanelGroupId]}
                        id={nestedPanelGroupId}
                        onLayoutChange={handlePanelLayoutChange(nestedPanelGroupId)}
                        orientation={nestedOrientation}
                      >
                        {group.flatMap((pane, paneIndex) => {
                          const isSelected = pane.id === activePaneId
                          const panePan = panOffsets[pane.id] ?? { x: 0, y: 0 }
                          const paneZoom = zoomLevels[pane.id] ?? 1
                          const panePanelId = `pane-${groupIndex}-${paneIndex}`

                          const panePanel = (
                            <ResizablePanel
                              className="min-h-0 min-w-0"
                              defaultSize={100 / group.length}
                              id={panePanelId}
                              key={panePanelId}
                              minSize={10}
                            >
                              <DraftingPaneSurface
                                canSwap={canSwapPanes}
                                draggingPaneId={draggingPaneId}
                                isSelected={isSelected}
                                isSnapTarget={snapTargetPaneId === pane.id}
                                onPaneDragEnd={handlePaneDragEnd}
                                onPaneDragLeave={handlePaneDragLeave}
                                onPaneDragOver={handlePaneDragOver}
                                onPaneDragStart={handlePaneDragStart}
                                onPaneDrop={handlePaneDrop}
                                onPanePan={handlePanePan}
                                onPaneZoom={handlePaneZoom}
                                onLayerChange={onLayerChange}
                                onLayerAction={onLayerAction}
                                onLayerCopy={onLayerCopy}
                                onLayerPaste={onLayerPaste}
                                onLayerSelect={onLayerSelect}
                                onLayerSelectionChange={onLayerSelectionChange}
                                activeCanvasTool={isSelected ? activeCanvasTool : null}
                                layerEditingEnabled={layerEditingEnabled}
                                onAddTextLayerAt={onAddTextLayerAt}
                                onCanvasToolChange={onCanvasToolChange}
                                onPaneQrClick={onPaneQrClick}
                                onPaneSelect={onPaneSelect}
                                pane={pane}
                                panePan={panePan}
                                paneZoom={paneZoom}
                                previewLocked={previewLocked}
                                fitCanvasToViewport={fitCanvasToViewport}
                                selectedLayerId={selectedLayerId}
                                selectedLayerIds={selectedLayerIds}
                                showCanvasGrid={showCanvasGrid}
                                snapEnabled={snapEnabled}
                                toolbarVariant={toolbarVariant}
                              />
                            </ResizablePanel>
                          )

                          return paneIndex < group.length - 1
                            ? [
                                panePanel,
                                <DraftingResizeHandle
                                  key={`pane-${groupIndex}-${paneIndex}-handle`}
                                />,
                              ]
                            : [panePanel]
                        })}
                      </ResizablePanelGroup>
                    </ResizablePanel>
                  )

                  return groupIndex < layout.groups.length - 1
                    ? [
                        groupPanel,
                        <DraftingResizeHandle key={`group-${groupIndex}-handle`} />,
                      ]
                    : [groupPanel]
                })}
              </ResizablePanelGroup>
            ) : null
          )}
        </div>

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
                      onClick={handleZoomOut}
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
                      onClick={handleZoomIn}
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
                      onClick={handleResetView}
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
                onClick={() => setSnapEnabled((current) => !current)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <MagnetIcon />
              </Button>
            </ComposeToolbarTooltip>

            {panes.length > 1 && (
              <>
                {!isDesktopZoomToolbar ? <div className="mx-1 h-4 w-px bg-[var(--ws-line)]" /> : null}
                <ComposeToolbarTooltip
                  content={isMaximized ? "Restore layout" : "Maximize pane"}
                  desktop={isDesktopZoomToolbar}
                >
                  <Button
                    aria-label={isMaximized ? "Restore layout" : "Maximize pane"}
                    className={getComposeToolbarIconButtonClass(isDesktopZoomToolbar)}
                    onClick={handleToggleMaximize}
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
                onClick={handleZoomIn}
              >
                <PlusIcon className="size-3.5" strokeWidth={2.3} />
              </button>
              <button
                aria-label="Decrease canvas size"
                className={DESKTOP_GLASS_TOOLBAR_ICON_BUTTON_CLASS}
                disabled={activeZoom <= MIN_PREVIEW_ZOOM}
                type="button"
                onClick={handleZoomOut}
              >
                <MinusIcon className="size-3.5" strokeWidth={2.6} />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </TooltipProvider>
  )
}
