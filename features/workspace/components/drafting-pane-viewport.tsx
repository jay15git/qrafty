"use client"

import type {
  DragEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
  TouchEvent,
} from "react"

import type { DraftingLayerInteractionProps } from "@/features/workspace/components/canvas-control-props"
import { Pane } from "@/features/workspace/components/Pane"
import type {
  DraftingPane,
  DraftingPaneCanvasTool,
} from "@/features/workspace/components/DraftingPaneSurface"
import { cn } from "@/lib/utils"

type DraftingPaneViewportProps = {
  areaName?: string
  activeCanvasTool?: DraftingPaneCanvasTool | null
  canSwap: boolean
  draggingPaneId: string | null
  effectivePan: { x: number; y: number }
  effectiveZoom: number
  fitCanvasToViewport?: boolean
  hideLayerSelectionChrome: boolean
  isFreeEditWorkspace: boolean
  isPanning: boolean
  isSelected: boolean
  isSnapTarget: boolean
  layerEditingEnabled?: boolean
  onAddTextLayerAt?: (paneId: string, point: { x: number; y: number }) => void
  onPaneDragEnd: () => void
  onPaneDragLeave: (paneId: string, event: DragEvent<HTMLDivElement>) => void
  onPaneDragOver: (paneId: string, event: DragEvent<HTMLDivElement>) => void
  onPaneDragStart: (paneId: string, event: DragEvent<HTMLDivElement>) => void
  onPaneDrop: (paneId: string, event: DragEvent<HTMLDivElement>) => void
  onLayerAction?: DraftingLayerInteractionProps["onLayerAction"]
  onLayerChange?: DraftingLayerInteractionProps["onLayerChange"]
  onLayerCopy?: DraftingLayerInteractionProps["onLayerCopy"]
  onLayerPaste?: DraftingLayerInteractionProps["onLayerPaste"]
  onLayerSelect?: DraftingLayerInteractionProps["onLayerSelect"]
  onLayerSelectionChange?: DraftingLayerInteractionProps["onLayerSelectionChange"]
  onQrClick: () => void
  onSelect: () => void
  onSurfaceClick: (event: ReactMouseEvent<HTMLDivElement>) => void
  onSurfaceKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void
  onSurfacePointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void
  onSurfacePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onSurfacePointerDownCapture: (event: ReactPointerEvent<HTMLDivElement>) => void
  onSurfacePointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void
  onSurfacePointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void
  onSurfaceTouchEnd: (event: TouchEvent<HTMLDivElement>) => void
  onSurfaceTouchMove: (event: TouchEvent<HTMLDivElement>) => void
  onSurfaceTouchStart: (event: TouchEvent<HTMLDivElement>) => void
  onBeginPanePan: (event: ReactPointerEvent<HTMLDivElement>) => void
  pane: DraftingPane
  panOverlayRef: RefObject<HTMLDivElement | null>
  previewLocked?: boolean
  selectedLayerId?: string | null
  selectedLayerIds?: string[]
  snapEnabled: boolean
  surfaceAppearance: "template" | "workspace" | "neutral"
  surfaceRef: RefObject<HTMLDivElement | null>
  viewFitScale?: number
}

type DraftingPaneContentProps = Pick<
  DraftingPaneViewportProps,
  | "effectivePan"
  | "effectiveZoom"
  | "fitCanvasToViewport"
  | "hideLayerSelectionChrome"
  | "isFreeEditWorkspace"
  | "isSelected"
  | "layerEditingEnabled"
  | "onLayerAction"
  | "onLayerChange"
  | "onLayerCopy"
  | "onLayerPaste"
  | "onLayerSelect"
  | "onLayerSelectionChange"
  | "onQrClick"
  | "onSelect"
  | "pane"
  | "previewLocked"
  | "selectedLayerId"
  | "selectedLayerIds"
  | "snapEnabled"
  | "viewFitScale"
>

function DraftingPaneContent({
  effectivePan,
  effectiveZoom,
  fitCanvasToViewport = false,
  hideLayerSelectionChrome,
  isFreeEditWorkspace,
  isSelected,
  layerEditingEnabled = true,
  onLayerAction,
  onLayerChange,
  onLayerCopy,
  onLayerPaste,
  onLayerSelect,
  onLayerSelectionChange,
  onQrClick,
  onSelect,
  pane,
  previewLocked = false,
  selectedLayerId,
  selectedLayerIds,
  snapEnabled,
  viewFitScale = 1,
}: DraftingPaneContentProps) {
  return (
    <div
      data-slot={
        previewLocked || fitCanvasToViewport
          ? "template-edit-zone"
          : isFreeEditWorkspace
            ? "free-edit-artboard"
            : undefined
      }
      style={{
        transform: isFreeEditWorkspace
          ? undefined
          : `translate3d(${effectivePan.x}px, ${effectivePan.y}px, 0) scale(${effectiveZoom})`,
        transformOrigin: "center center",
        transition: "transform 150ms ease-out",
      }}
      className="flex h-full w-full items-center justify-center"
    >
      <Pane
        activeQrLayerId={pane.activeQrLayerId}
        cardState={pane.cardState}
        contentPan={isFreeEditWorkspace ? effectivePan : undefined}
        contentOnlyZoom={isFreeEditWorkspace}
        contentValidation={pane.contentValidation}
        interactionScale={effectiveZoom}
        viewFitScale={viewFitScale}
        layers={pane.layers}
        qrStateByLayerId={pane.qrStateByLayerId}
        sceneComposition={pane.sceneComposition}
        snapEnabled={snapEnabled}
        state={pane.state}
        isSelected={isSelected}
        onLayerChange={
          layerEditingEnabled
            ? (layerId, patch) => onLayerChange?.(pane.id, layerId, patch)
            : undefined
        }
        onLayerAction={
          layerEditingEnabled
            ? (layerIds, action) => onLayerAction?.(pane.id, layerIds, action)
            : undefined
        }
        onLayerCopy={layerEditingEnabled ? (layerIds) => onLayerCopy?.(pane.id, layerIds) : undefined}
        onLayerPaste={
          layerEditingEnabled ? (point) => onLayerPaste?.(pane.id, point) : undefined
        }
        onLayerSelect={(layerId, options) => onLayerSelect?.(pane.id, layerId, options)}
        onLayerSelectionChange={(layerIds, options) =>
          onLayerSelectionChange?.(pane.id, layerIds, options)
        }
        onQrClick={onQrClick}
        onSelect={onSelect}
        selectedLayerId={isSelected && !hideLayerSelectionChrome ? selectedLayerId : null}
        selectedLayerIds={isSelected && !hideLayerSelectionChrome ? selectedLayerIds : undefined}
      />
    </div>
  )
}

type DraftingPanOverlayProps = Pick<
  DraftingPaneViewportProps,
  | "activeCanvasTool"
  | "isPanning"
  | "onBeginPanePan"
  | "onSurfacePointerCancel"
  | "onSurfacePointerMove"
  | "onSurfacePointerUp"
  | "panOverlayRef"
  | "previewLocked"
>

function DraftingPanOverlay({
  activeCanvasTool,
  isPanning,
  onBeginPanePan,
  onSurfacePointerCancel,
  onSurfacePointerMove,
  onSurfacePointerUp,
  panOverlayRef,
  previewLocked = false,
}: DraftingPanOverlayProps) {
  if (activeCanvasTool !== "pan" || previewLocked) {
    return null
  }

  return (
    <div
      ref={panOverlayRef}
      aria-hidden="true"
      className="absolute inset-0 z-[1] cursor-grab touch-none data-[panning=true]:cursor-move"
      data-panning={isPanning ? "true" : "false"}
      data-slot="drafting-pan-overlay"
      onPointerCancel={onSurfacePointerCancel}
      onPointerDown={onBeginPanePan}
      onPointerMove={onSurfacePointerMove}
      onPointerUp={onSurfacePointerUp}
    />
  )
}

type DraftingTextPlacementOverlayProps = Pick<
  DraftingPaneViewportProps,
  "activeCanvasTool" | "layerEditingEnabled" | "onAddTextLayerAt"
>

function DraftingTextPlacementOverlay({
  activeCanvasTool,
  layerEditingEnabled = true,
  onAddTextLayerAt,
}: DraftingTextPlacementOverlayProps) {
  if (activeCanvasTool !== "text" || !layerEditingEnabled || !onAddTextLayerAt) {
    return null
  }

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-[40] cursor-text touch-none"
      data-slot="drafting-text-placement-overlay"
    />
  )
}

export function DraftingPaneViewport({
  areaName,
  activeCanvasTool,
  canSwap,
  draggingPaneId,
  effectivePan,
  effectiveZoom,
  fitCanvasToViewport = false,
  hideLayerSelectionChrome,
  isFreeEditWorkspace,
  isPanning,
  isSelected,
  isSnapTarget,
  layerEditingEnabled = true,
  onAddTextLayerAt,
  onBeginPanePan,
  onPaneDragEnd,
  onPaneDragLeave,
  onPaneDragOver,
  onPaneDragStart,
  onPaneDrop,
  onLayerAction,
  onLayerChange,
  onLayerCopy,
  onLayerPaste,
  onLayerSelect,
  onLayerSelectionChange,
  onQrClick,
  onSelect,
  onSurfaceClick,
  onSurfaceKeyDown,
  onSurfacePointerCancel,
  onSurfacePointerDown,
  onSurfacePointerDownCapture,
  onSurfacePointerMove,
  onSurfacePointerUp,
  onSurfaceTouchEnd,
  onSurfaceTouchMove,
  onSurfaceTouchStart,
  pane,
  panOverlayRef,
  previewLocked = false,
  selectedLayerId,
  selectedLayerIds,
  snapEnabled,
  surfaceAppearance,
  surfaceRef,
  viewFitScale = 1,
}: DraftingPaneViewportProps) {
  return (
    <div
      ref={surfaceRef}
      key={pane.id}
      data-slot="desktop-compose-surface"
      data-surface-appearance={surfaceAppearance}
      data-preview-locked={previewLocked ? "true" : "false"}
      data-dragging={draggingPaneId === pane.id ? "true" : "false"}
      data-panning={isPanning ? "true" : "false"}
      data-snap-target={isSnapTarget ? "true" : "false"}
      draggable={canSwap}
      className={cn(
        "relative flex h-full w-full flex-col items-center justify-center overflow-hidden touch-none overscroll-none outline-none transition-opacity duration-150 ease-out",
        isFreeEditWorkspace
          ? "bg-[var(--ws-workspace-bg,#f0f1f2)]"
          : "bg-[var(--ws-canvas-bg,#f0f1f2)]",
        canSwap && "cursor-grab active:cursor-grabbing",
        draggingPaneId === pane.id && "opacity-55",
        isSnapTarget &&
          "after:pointer-events-none after:absolute after:inset-0 after:border-2 after:border-[var(--ws-ink)] after:content-['']",
      )}
      style={{
        gridArea: areaName,
        backgroundImage:
          !isFreeEditWorkspace && !previewLocked
            ? "radial-gradient(circle, rgb(var(--ws-canvas-dot-rgb) / var(--ws-canvas-dot-opacity)) 2.4px, transparent 3px)"
            : "none",
        backgroundPosition: "0 0",
        backgroundSize: "30px 30px",
      }}
      role="group"
      aria-label="Canvas surface"
      onKeyDown={onSurfaceKeyDown}
      onClick={onSurfaceClick}
      onDragEnd={onPaneDragEnd}
      onDragLeave={(event) => onPaneDragLeave(pane.id, event)}
      onDragOver={(event) => onPaneDragOver(pane.id, event)}
      onDragStart={(event) => onPaneDragStart(pane.id, event)}
      onDrop={(event) => onPaneDrop(pane.id, event)}
      onPointerCancel={onSurfacePointerCancel}
      onPointerDownCapture={onSurfacePointerDownCapture}
      onPointerDown={onSurfacePointerDown}
      onPointerMove={onSurfacePointerMove}
      onPointerUp={onSurfacePointerUp}
      onTouchEnd={onSurfaceTouchEnd}
      onTouchMove={onSurfaceTouchMove}
      onTouchStart={onSurfaceTouchStart}
    >
      <DraftingPaneContent
        effectivePan={effectivePan}
        effectiveZoom={effectiveZoom}
        fitCanvasToViewport={fitCanvasToViewport}
        hideLayerSelectionChrome={hideLayerSelectionChrome}
        isFreeEditWorkspace={isFreeEditWorkspace}
        isSelected={isSelected}
        layerEditingEnabled={layerEditingEnabled}
        onLayerAction={onLayerAction}
        onLayerChange={onLayerChange}
        onLayerCopy={onLayerCopy}
        onLayerPaste={onLayerPaste}
        onLayerSelect={onLayerSelect}
        onLayerSelectionChange={onLayerSelectionChange}
        onQrClick={onQrClick}
        onSelect={onSelect}
        pane={pane}
        previewLocked={previewLocked}
        selectedLayerId={selectedLayerId}
        selectedLayerIds={selectedLayerIds}
        snapEnabled={snapEnabled}
        viewFitScale={viewFitScale}
      />
      <DraftingPanOverlay
        activeCanvasTool={activeCanvasTool}
        isPanning={isPanning}
        onBeginPanePan={onBeginPanePan}
        onSurfacePointerCancel={onSurfacePointerCancel}
        onSurfacePointerMove={onSurfacePointerMove}
        onSurfacePointerUp={onSurfacePointerUp}
        panOverlayRef={panOverlayRef}
        previewLocked={previewLocked}
      />
      <DraftingTextPlacementOverlay
        activeCanvasTool={activeCanvasTool}
        layerEditingEnabled={layerEditingEnabled}
        onAddTextLayerAt={onAddTextLayerAt}
      />
    </div>
  )
}
