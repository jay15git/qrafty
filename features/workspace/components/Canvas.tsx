"use client"

import { useCallback, useState } from "react"

import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import {
  type DraftingPane,
  type DraftingPaneCanvasTool,
  type DraftingPaneToolbarVariant,
} from "@/features/workspace/components/DraftingPaneSurface"
import { type DraftingLayerMenuAction } from "@/features/workspace/components/Pane"
import { DraftingPaneSurface } from "@/features/workspace/components/DraftingPaneSurface"
import { TooltipProvider } from "@/components/ui/tooltip"

export type { DraftingPaneCanvasTool, DraftingPaneToolbarVariant } from "@/features/workspace/components/DraftingPaneSurface"

const MIN_PREVIEW_ZOOM = 0.1
const MAX_PREVIEW_ZOOM = 4

type CanvasProps = {
  panes: DraftingPane[]
  activePaneId: string
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
  selectedLayerId?: string | null
  selectedLayerIds?: string[]
  toolbarVariant?: DraftingPaneToolbarVariant
  layerEditingEnabled?: boolean
  previewLocked?: boolean
  fitCanvasToViewport?: boolean
}

function clampPreviewZoom(value: number) {
  return Math.min(MAX_PREVIEW_ZOOM, Math.max(MIN_PREVIEW_ZOOM, value))
}

export function Canvas({
  panes,
  activePaneId,
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
  selectedLayerId,
  selectedLayerIds,
  toolbarVariant = "default",
  layerEditingEnabled = true,
  previewLocked = false,
  fitCanvasToViewport = false,
}: CanvasProps) {
  const [zoomLevels, setZoomLevels] = useState<Record<string, number>>({})
  const [panOffsets, setPanOffsets] = useState<Record<string, { x: number; y: number }>>({})

  const activePane = panes.find((pane) => pane.id === activePaneId) ?? panes[0]

  const handlePaneZoom = useCallback((paneId: string, nextZoom: number) => {
    setZoomLevels((current) => ({
      ...current,
      [paneId]: clampPreviewZoom(nextZoom),
    }))
  }, [])

  const handlePanePan = useCallback((paneId: string, nextPan: { x: number; y: number }) => {
    setPanOffsets((current) => ({
      ...current,
      [paneId]: nextPan,
    }))
  }, [])

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
              snapEnabled
              toolbarVariant={toolbarVariant}
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
