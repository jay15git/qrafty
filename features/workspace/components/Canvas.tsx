"use client"

import { useCallback, useState } from "react"

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
import { DraftingPaneSurface } from "@/features/workspace/components/DraftingPaneSurface"
import { TooltipProvider } from "@/components/ui/tooltip"

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
  onRemoveQrCode?: (layerId: string) => void
  onPaneSelect: (paneId: string) => void
  onPaneQrClick: (paneId: string) => void
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
  qrLayerCount?: number
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
  qrLayerCount = 1,
}: CanvasProps) {
  const [zoomLevels, setZoomLevels] = useState<Record<string, number>>({})
  const [panOffsets, setPanOffsets] = useState<Record<string, { x: number; y: number }>>({})
  const [snapEnabled, setSnapEnabled] = useState(true)

  const activePane = panes.find((pane) => pane.id === activePaneId) ?? panes[0]
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
  const canRemoveQr =
    qrLayerCount > 1 &&
    Boolean(onRemoveQrCode) &&
    Boolean(selectedLayerId) &&
    Boolean(selectedLayerId?.includes(":qr"))

  return (
    <TooltipProvider>
      <div className="relative flex h-full w-full flex-col">
        <div className="relative min-h-0 flex-1">
          {!activePane ? (
            <div className="grid h-full place-items-center text-sm font-medium text-[var(--ws-ink-muted)]">
              No QR codes
            </div>
          ) : (
            <DraftingPaneSurface
              activeCanvasTool={activeCanvasTool}
              fitCanvasToViewport={fitCanvasToViewport}
              interaction={{
                canSwap: false,
                isSelected: true,
                isSnapTarget: false,
              }}
              draggingPaneId={null}
              layerEditingEnabled={layerEditingEnabled}
              onAddTextLayerAt={onAddTextLayerAt}
              onCanvasToolChange={onCanvasToolChange}
              onLayerAction={onLayerAction}
              onLayerChange={onLayerChange}
              onLayerCopy={onLayerCopy}
              onLayerPaste={onLayerPaste}
              onLayerSelect={onLayerSelect}
              onLayerSelectionChange={onLayerSelectionChange}
              onPaneDragEnd={() => undefined}
              onPaneDragLeave={() => undefined}
              onPaneDragOver={() => undefined}
              onPaneDragStart={() => undefined}
              onPaneDrop={() => undefined}
              onPanePan={handlePanePan}
              onPaneQrClick={onPaneQrClick}
              onPaneSelect={onPaneSelect}
              onPaneZoom={handlePaneZoom}
              pane={activePane}
              panePan={panOffsets[activePane.id] ?? { x: 0, y: 0 }}
              paneZoom={zoomLevels[activePane.id] ?? 1}
              previewLocked={previewLocked}
              selectedLayerId={selectedLayerId}
              selectedLayerIds={selectedLayerIds}
              showCanvasGrid={showCanvasGrid}
              snapEnabled={snapEnabled}
              toolbarVariant={toolbarVariant}
            />
          )}
        </div>

        <CanvasComposeToolbar
          activeCanvasTool={activeCanvasTool}
          activeInteractionTool={activeInteractionTool}
          activePaneId={activePaneId}
          activeZoom={activeZoom}
          history={history}
          canRemove={canRemoveQr}
          insertNodeId={insertNodeId}
          isDesktopZoomToolbar={isDesktopZoomToolbar}
          isMaximized={false}
          qr={qr}
          onAddTextLayerAt={onAddTextLayerAt}
          onBrowseStockPhotos={onBrowseStockPhotos}
          onCanvasGridChange={onCanvasGridChange}
          onCanvasToolChange={onCanvasToolChange}
          onInsertLayer={onInsertLayer}
          onOpenCardPatternSettings={onOpenCardPatternSettings}
          onRemoveQrCode={
            onRemoveQrCode && selectedLayerId
              ? () => onRemoveQrCode(selectedLayerId)
              : undefined
          }
          onResetView={handleResetView}
          onToggleMaximize={() => undefined}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          paneCount={1}
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
