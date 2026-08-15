"use client"

import {
  useCallback,
  useState,
  useSyncExternalStore,
} from "react"

import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import {
  type DraftingPane,
  type DraftingPaneCanvasTool,
  type DraftingPaneToolbarVariant,
} from "@/features/workspace/components/DraftingPaneSurface"
import { type DraftingLayerMenuAction } from "@/features/workspace/components/Pane"
import {
  CanvasComposeToolbar,
  MAX_PREVIEW_ZOOM,
  MIN_PREVIEW_ZOOM,
} from "@/features/workspace/components/canvas-compose-toolbar"
import type {
  CanvasHistoryControls,
  CanvasQrControls,
} from "@/features/workspace/components/canvas-control-props"
import {
  CanvasPaneLayout,
  useCanvasPaneDrag,
} from "@/features/workspace/components/canvas-pane-layout"
import { getQrLayout } from "@/features/workspace/model/layout-engine"
import { TooltipProvider } from "@/components/ui/tooltip"

type DraftingPanelLayouts = Record<string, Record<string, number>>
type DraftingPanePanOffsets = Record<string, { x: number; y: number }>

export type { DraftingPaneCanvasTool, DraftingPaneToolbarVariant } from "@/features/workspace/components/DraftingPaneSurface"

const PREVIEW_ZOOM_STEP = 0.1

type CanvasProps = {
  panes: DraftingPane[]
  activePaneId: string
  history?: CanvasHistoryControls
  qr?: CanvasQrControls
  onInsertLayer?: (layer: DraftingCanvasLayer) => void
  insertNodeId?: string
  onBrowseStockPhotos?: () => void
  onOpenCardPatternSettings?: () => void
  onRemoveQrCode?: (paneId: string) => void
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

function clampPreviewZoom(value: number) {
  return Math.min(MAX_PREVIEW_ZOOM, Math.max(MIN_PREVIEW_ZOOM, value))
}

export function Canvas({
  panes,
  activePaneId,
  history = { canUndo: false, canRedo: false },
  qr = { canAdd: true },
  onInsertLayer,
  insertNodeId,
  onBrowseStockPhotos,
  onOpenCardPatternSettings,
  onRemoveQrCode,
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
  const [panelLayouts, setPanelLayouts] = useState<DraftingPanelLayouts>({})
  const isPortrait = useSyncExternalStore(
    subscribePortrait,
    getPortraitSnapshot,
    () => false,
  )

  const activeZoom = zoomLevels[activePaneId] ?? 1
  const canSwapPanes = panes.length > 1 && Boolean(onSwapPanes)
  const {
    draggingPaneId,
    snapTargetPaneId,
    handlePaneDragEnd,
    handlePaneDragLeave,
    handlePaneDragOver,
    handlePaneDragStart,
    handlePaneDrop,
  } = useCanvasPaneDrag({ canSwapPanes, onSwapPanes })

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
  const canRemove = panes.length > 1 && onRemoveQrCode
  const visiblePanes = isMaximized
    ? panes.filter((p) => p.id === activePaneId)
    : panes
  const layout = panes.length > 0
    ? getQrLayout(isMaximized ? 1 : panes.length, isPortrait)
    : null
  const topLevelOrientation = layout?.direction === "rows" ? "vertical" : "horizontal"
  const nestedOrientation = layout?.direction === "rows" ? "horizontal" : "vertical"
  const layoutKey = layout
    ? `${layout.direction}-${layout.groups.join("-")}`
    : "empty"
  const rootPanelGroupId = `drafting-pane-layout-${layoutKey}-root`

  const handleToggleMaximize = useCallback(() => {
    setMaximizedPaneId((current) => (current === null ? activePaneId : null))
  }, [activePaneId])

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
              <CanvasPaneLayout
                activeCanvasTool={activeCanvasTool}
                activePaneId={activePaneId}
                canSwapPanes={canSwapPanes}
                draggingPaneId={draggingPaneId}
                fitCanvasToViewport={fitCanvasToViewport}
                layerEditingEnabled={layerEditingEnabled}
                layout={layout}
                layoutKey={layoutKey}
                nestedOrientation={nestedOrientation}
                onAddTextLayerAt={onAddTextLayerAt}
                onCanvasToolChange={onCanvasToolChange}
                onLayerAction={onLayerAction}
                onLayerChange={onLayerChange}
                onLayerCopy={onLayerCopy}
                onLayerPaste={onLayerPaste}
                onLayerSelect={onLayerSelect}
                onLayerSelectionChange={onLayerSelectionChange}
                onPaneDragEnd={handlePaneDragEnd}
                onPaneDragLeave={handlePaneDragLeave}
                onPaneDragOver={handlePaneDragOver}
                onPaneDragStart={handlePaneDragStart}
                onPaneDrop={handlePaneDrop}
                onPanePan={handlePanePan}
                onPaneQrClick={onPaneQrClick}
                onPaneSelect={onPaneSelect}
                onPaneZoom={handlePaneZoom}
                onPanelLayoutChange={handlePanelLayoutChange}
                panOffsets={panOffsets}
                panelLayouts={panelLayouts}
                previewLocked={previewLocked}
                rootPanelGroupId={rootPanelGroupId}
                selectedLayerId={selectedLayerId}
                selectedLayerIds={selectedLayerIds}
                showCanvasGrid={showCanvasGrid}
                snapEnabled={snapEnabled}
                snapTargetPaneId={snapTargetPaneId}
                toolbarVariant={toolbarVariant}
                topLevelOrientation={topLevelOrientation}
                visiblePanes={visiblePanes}
                zoomLevels={zoomLevels}
              />
            ) : null
          )}
        </div>

        <CanvasComposeToolbar
          activeCanvasTool={activeCanvasTool}
          activeInteractionTool={activeInteractionTool}
          activePaneId={activePaneId}
          activeZoom={activeZoom}
          history={history}
          canRemove={Boolean(canRemove)}
          insertNodeId={insertNodeId}
          isDesktopZoomToolbar={isDesktopZoomToolbar}
          isMaximized={isMaximized}
          qr={qr}
          onAddTextLayerAt={onAddTextLayerAt}
          onBrowseStockPhotos={onBrowseStockPhotos}
          onCanvasGridChange={onCanvasGridChange}
          onCanvasToolChange={onCanvasToolChange}
          onInsertLayer={onInsertLayer}
          onOpenCardPatternSettings={onOpenCardPatternSettings}
          onRemoveQrCode={onRemoveQrCode}
          onResetView={handleResetView}
          onToggleMaximize={handleToggleMaximize}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          paneCount={panes.length}
          previewLocked={previewLocked}
          showCanvasGrid={showCanvasGrid}
          snapEnabled={snapEnabled}
          onSnapEnabledChange={setSnapEnabled}
          zoomPercent={zoomPercent}
        />
      </div>
    </TooltipProvider>
  )
}
