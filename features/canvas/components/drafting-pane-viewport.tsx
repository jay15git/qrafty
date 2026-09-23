"use client"

import type {
  DragEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
  TouchEvent,
} from "react"

import type { DraftingLayerInteractionProps } from "@/features/canvas/components/canvas-control-props"
import { Pane } from "@/features/canvas/components/Pane"
import type {
  DraftingPane,
  DraftingPaneCanvasTool,
} from "@/features/canvas/components/DraftingPaneCanvas"
import type { ThemeMode } from "@/features/shell/components/FloatingToolbar"
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
  onCanvasClick: (event: ReactMouseEvent<HTMLDivElement>) => void
  onCanvasKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void
  onCanvasPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void
  onCanvasPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onCanvasPointerDownCapture: (event: ReactPointerEvent<HTMLDivElement>) => void
  onCanvasPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void
  onCanvasPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void
  onCanvasTouchEnd: (event: TouchEvent<HTMLDivElement>) => void
  onCanvasTouchMove: (event: TouchEvent<HTMLDivElement>) => void
  onCanvasTouchStart: (event: TouchEvent<HTMLDivElement>) => void
  onBeginPanePan: (event: ReactPointerEvent<HTMLDivElement>) => void
  pane: DraftingPane
  panOverlayRef: RefObject<HTMLDivElement | null>
  previewLocked?: boolean
  selectedLayerId?: string | null
  selectedLayerIds?: string[]
  snapEnabled: boolean
  canvasAppearance: "template" | "workspace" | "neutral"
  canvasRef: RefObject<HTMLDivElement | null>
  viewFitScale?: number
  theme?: ThemeMode
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
  | "theme"
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
  theme,
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
        theme={theme}
      />
    </div>
  )
}

type DraftingPanOverlayProps = Pick<
  DraftingPaneViewportProps,
  | "activeCanvasTool"
  | "isPanning"
  | "onBeginPanePan"
  | "onCanvasPointerCancel"
  | "onCanvasPointerMove"
  | "onCanvasPointerUp"
  | "panOverlayRef"
  | "previewLocked"
>

function DraftingPanOverlay({
  activeCanvasTool,
  isPanning,
  onBeginPanePan,
  onCanvasPointerCancel,
  onCanvasPointerMove,
  onCanvasPointerUp,
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
      onPointerCancel={onCanvasPointerCancel}
      onPointerDown={onBeginPanePan}
      onPointerMove={onCanvasPointerMove}
      onPointerUp={onCanvasPointerUp}
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
      className="absolute inset-0 z-[var(--z-compose-toolbar)] cursor-text touch-none"
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
  onCanvasClick,
  onCanvasKeyDown,
  onCanvasPointerCancel,
  onCanvasPointerDown,
  onCanvasPointerDownCapture,
  onCanvasPointerMove,
  onCanvasPointerUp,
  onCanvasTouchEnd,
  onCanvasTouchMove,
  onCanvasTouchStart,
  pane,
  panOverlayRef,
  previewLocked = false,
  selectedLayerId,
  selectedLayerIds,
  snapEnabled,
  canvasAppearance,
  canvasRef,
  viewFitScale = 1,
  theme,
}: DraftingPaneViewportProps) {
  return (
    <div
      ref={canvasRef}
      key={pane.id}
      data-slot="desktop-compose-surface"
      data-canvas-appearance={canvasAppearance}
      data-preview-locked={previewLocked ? "true" : "false"}
      data-dragging={draggingPaneId === pane.id ? "true" : "false"}
      data-panning={isPanning ? "true" : "false"}
      data-snap-target={isSnapTarget ? "true" : "false"}
      draggable={canSwap}
      className={cn(
        "relative flex h-full w-full flex-col items-center justify-center overflow-hidden touch-none overscroll-none outline-none transition-opacity duration-150 ease-out",
        isFreeEditWorkspace
          ? "bg-[var(--canvas-bg,#f0f1f2)]"
          : "bg-[var(--canvas-bg,#f0f1f2)]",
        canSwap && "cursor-grab active:cursor-grabbing",
        draggingPaneId === pane.id && "opacity-55",
        isSnapTarget &&
          "after:pointer-events-none after:absolute after:inset-0 after:border-2 after:border-[var(--canvas-ink)] after:content-['']",
      )}
      style={{
        gridArea: areaName,
        backgroundImage:
          !isFreeEditWorkspace && !previewLocked
            ? "radial-gradient(circle, rgb(var(--canvas-dot-rgb) / var(--canvas-dot-opacity)) 2.4px, transparent 3px)"
            : "none",
        backgroundPosition: "0 0",
        backgroundSize: "30px 30px",
      }}
      role="group"
      aria-label="Canvas"
      onKeyDown={onCanvasKeyDown}
      onClick={onCanvasClick}
      onDragEnd={onPaneDragEnd}
      onDragLeave={(event) => onPaneDragLeave(pane.id, event)}
      onDragOver={(event) => onPaneDragOver(pane.id, event)}
      onDragStart={(event) => onPaneDragStart(pane.id, event)}
      onDrop={(event) => onPaneDrop(pane.id, event)}
      onPointerCancel={onCanvasPointerCancel}
      onPointerDownCapture={onCanvasPointerDownCapture}
      onPointerDown={onCanvasPointerDown}
      onPointerMove={onCanvasPointerMove}
      onPointerUp={onCanvasPointerUp}
      onTouchEnd={onCanvasTouchEnd}
      onTouchMove={onCanvasTouchMove}
      onTouchStart={onCanvasTouchStart}
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
        theme={theme}
      />
      <DraftingPanOverlay
        activeCanvasTool={activeCanvasTool}
        isPanning={isPanning}
        onBeginPanePan={onBeginPanePan}
        onCanvasPointerCancel={onCanvasPointerCancel}
        onCanvasPointerMove={onCanvasPointerMove}
        onCanvasPointerUp={onCanvasPointerUp}
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
