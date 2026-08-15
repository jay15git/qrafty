"use client"

import type { DragEvent } from "react"

import type { DraftingCardState } from "@/features/workspace/model/card-state"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import { type DraftingLayerMenuAction } from "@/features/workspace/components/Pane"
import { DraftingPaneViewport } from "@/features/workspace/components/drafting-pane-viewport"
import { useDraftingPaneSurfaceInteractions } from "@/features/workspace/components/use-drafting-pane-surface-interactions"
import type { DraftingPaneInteractionState } from "@/features/workspace/components/canvas-control-props"
import type { QrStudioState } from "@/features/qr-code/model/state"
import type { DraftingQrStateByLayerId } from "@/features/workspace/model/document"

export type DraftingPaneToolbarVariant = "default" | "desktop-zoom"
export type DraftingPaneCanvasTool = "select" | "pan" | "text"

export type DraftingPane = {
  cardState: DraftingCardState
  id: string
  layers?: DraftingCanvasLayer[]
  name: string
  qrStateByLayerId: DraftingQrStateByLayerId
  sceneComposition?: import("@/features/workspace/model/scene-templates").SceneCompositionState
  state: QrStudioState
}

type DraftingPaneSurfaceProps = {
  areaName?: string
  interaction: DraftingPaneInteractionState
  draggingPaneId: string | null
  onPaneQrClick: (paneId: string) => void
  onPaneSelect: (paneId: string) => void
  onPaneDragEnd: () => void
  onPaneDragStart: (paneId: string, event: DragEvent<HTMLDivElement>) => void
  onPaneDrop: (paneId: string, event: DragEvent<HTMLDivElement>) => void
  onPaneDragOver: (paneId: string, event: DragEvent<HTMLDivElement>) => void
  onPaneDragLeave: (paneId: string, event: DragEvent<HTMLDivElement>) => void
  onPanePan: (paneId: string, nextPan: { x: number; y: number }) => void
  onPaneZoom: (paneId: string, nextZoom: number) => void
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
  layerEditingEnabled?: boolean
  showCanvasGrid?: boolean
  pane: DraftingPane
  panePan: { x: number; y: number }
  paneZoom: number
  previewLocked?: boolean
  fitCanvasToViewport?: boolean
  selectedLayerId?: string | null
  selectedLayerIds?: string[]
  snapEnabled: boolean
  toolbarVariant?: DraftingPaneToolbarVariant
}

export function DraftingPaneSurface({
  areaName,
  interaction,
  draggingPaneId,
  onPaneQrClick,
  onPaneSelect,
  onPaneDragEnd,
  onPaneDragStart,
  onPaneDrop,
  onPaneDragOver,
  onPaneDragLeave,
  onPaneZoom,
  onPanePan,
  onLayerChange,
  onLayerAction,
  onLayerCopy,
  onLayerPaste,
  onLayerSelect,
  onLayerSelectionChange,
  activeCanvasTool,
  onAddTextLayerAt,
  onCanvasToolChange,
  layerEditingEnabled = true,
  showCanvasGrid = true,
  pane,
  panePan,
  paneZoom,
  previewLocked = false,
  fitCanvasToViewport = false,
  selectedLayerId,
  selectedLayerIds,
  snapEnabled,
  toolbarVariant = "default",
}: DraftingPaneSurfaceProps) {
  const { canSwap, isSelected, isSnapTarget } = interaction

  const interactions = useDraftingPaneSurfaceInteractions({
    activeCanvasTool,
    fitCanvasToViewport,
    layerEditingEnabled,
    onAddTextLayerAt,
    onCanvasToolChange,
    onLayerSelect,
    onPanePan,
    onPaneQrClick,
    onPaneSelect,
    onPaneZoom,
    pane,
    panePan,
    paneZoom,
    previewLocked,
    toolbarVariant,
  })

  return (
    <DraftingPaneViewport
      areaName={areaName}
      activeCanvasTool={activeCanvasTool}
      canSwap={canSwap}
      draggingPaneId={draggingPaneId}
      effectivePan={interactions.effectivePan}
      effectiveZoom={interactions.effectiveZoom}
      fitCanvasToViewport={fitCanvasToViewport}
      hideLayerSelectionChrome={interactions.hideLayerSelectionChrome}
      isFreeEditWorkspace={interactions.isFreeEditWorkspace}
      isPanning={interactions.isPanning}
      isSelected={isSelected}
      isSnapTarget={isSnapTarget}
      layerEditingEnabled={layerEditingEnabled}
      onAddTextLayerAt={onAddTextLayerAt}
      onBeginPanePan={interactions.beginPanePan}
      onPaneDragEnd={onPaneDragEnd}
      onPaneDragLeave={onPaneDragLeave}
      onPaneDragOver={onPaneDragOver}
      onPaneDragStart={onPaneDragStart}
      onPaneDrop={onPaneDrop}
      onLayerAction={onLayerAction}
      onLayerChange={onLayerChange}
      onLayerCopy={onLayerCopy}
      onLayerPaste={onLayerPaste}
      onLayerSelect={onLayerSelect}
      onLayerSelectionChange={onLayerSelectionChange}
      onQrClick={interactions.handleQrClick}
      onSelect={interactions.handleSelect}
      onSurfaceClick={interactions.handleSurfaceClick}
      onSurfaceKeyDown={interactions.handleSurfaceKeyDown}
      onSurfacePointerCancel={interactions.handlePanePointerEnd}
      onSurfacePointerDown={interactions.handlePanePointerDown}
      onSurfacePointerDownCapture={interactions.handlePanePointerDownCapture}
      onSurfacePointerMove={interactions.handlePanePointerMove}
      onSurfacePointerUp={interactions.handlePanePointerEnd}
      onSurfaceTouchEnd={interactions.handleTouchEnd}
      onSurfaceTouchMove={interactions.handleTouchMove}
      onSurfaceTouchStart={interactions.handleTouchStart}
      onSurfaceWheel={previewLocked ? undefined : interactions.handleWheel}
      pane={pane}
      panOverlayRef={interactions.panOverlayRef}
      previewLocked={previewLocked}
      selectedLayerId={selectedLayerId}
      selectedLayerIds={selectedLayerIds}
      showCanvasGrid={showCanvasGrid}
      snapEnabled={snapEnabled}
      surfaceAppearance={interactions.surfaceAppearance}
      surfaceRef={interactions.surfaceRef}
    />
  )
}
