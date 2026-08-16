"use client"

import type {
  DragEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
  TouchEvent,
  WheelEvent,
} from "react"

import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import { Pane, type DraftingLayerMenuAction } from "@/features/workspace/components/Pane"
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
  onLayerAction?: (
    paneId: string,
    layerIds: string[],
    action: DraftingLayerMenuAction,
  ) => void
  onLayerChange?: (
    paneId: string,
    layerId: string,
    patch: Partial<DraftingCanvasLayer>,
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
  onSurfaceWheel?: (event: WheelEvent<HTMLDivElement>) => void
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
  onSurfaceWheel,
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
        "relative flex h-full w-full touch-none flex-col items-center justify-center overflow-hidden transition-opacity duration-150 ease-out after:pointer-events-none after:absolute after:inset-0 after:border-2 after:border-dashed after:border-transparent after:content-[''] after:transition-colors after:duration-150 after:ease-out",
        isFreeEditWorkspace
          ? "bg-[var(--ws-workspace-bg,#f0f1f2)]"
          : "bg-[var(--ws-canvas-bg,#f0f1f2)]",
        canSwap && "cursor-grab active:cursor-grabbing",
        draggingPaneId === pane.id && "opacity-55",
        isSnapTarget && "after:border-[var(--ws-ink)]",
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
      onWheel={onSurfaceWheel}
    >
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
            ? `translate3d(${effectivePan.x}px, ${effectivePan.y}px, 0)`
            : `translate3d(${effectivePan.x}px, ${effectivePan.y}px, 0) scale(${effectiveZoom})`,
          transformOrigin: "center center",
          transition: "transform 150ms ease-out",
        }}
        className="flex h-full w-full items-center justify-center"
      >
        <Pane
          cardState={pane.cardState}
          contentOnlyZoom={isFreeEditWorkspace}
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
      {activeCanvasTool === "pan" && !previewLocked ? (
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
      ) : null}
      {activeCanvasTool === "text" && layerEditingEnabled && onAddTextLayerAt ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[40] cursor-text touch-none"
          data-slot="drafting-text-placement-overlay"
        />
      ) : null}
    </div>
  )
}
