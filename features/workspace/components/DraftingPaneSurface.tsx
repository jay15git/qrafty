"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent,
  type WheelEvent,
} from "react"

import type { DraftingCardState } from "@/features/workspace/model/card-state"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import { Pane, type DraftingLayerMenuAction } from "@/features/workspace/components/Pane"
import { computeTemplatePreviewFit, DESKTOP_CANVAS_FIT_PADDING } from "@/features/workspace/model/template-preview-fit"
import type { QrStudioState } from "@/features/qr-code/model/state"
import { cn } from "@/lib/utils"

export type DraftingPaneToolbarVariant = "default" | "desktop-zoom"
export type DraftingPaneCanvasTool = "select" | "pan" | "text"

export type DraftingPane = {
  cardState: DraftingCardState
  id: string
  layers?: DraftingCanvasLayer[]
  name: string
  sceneComposition?: import("@/features/workspace/model/scene-templates").SceneCompositionState
  state: QrStudioState
}

const CANVAS_PAN_CURSOR_LOCK_CLASS = "drafting-canvas-panning"

function lockCanvasPanCursor() {
  document.documentElement.classList.add(CANVAS_PAN_CURSOR_LOCK_CLASS)
  document.body.classList.add(CANVAS_PAN_CURSOR_LOCK_CLASS)
}

function unlockCanvasPanCursor() {
  document.documentElement.classList.remove(CANVAS_PAN_CURSOR_LOCK_CLASS)
  document.body.classList.remove(CANVAS_PAN_CURSOR_LOCK_CLASS)
}

const MIN_PREVIEW_ZOOM = 0.1
const MAX_PREVIEW_ZOOM = 4
const WHEEL_ZOOM_SENSITIVITY = 0.001

function clampPreviewZoom(value: number) {
  return Math.min(MAX_PREVIEW_ZOOM, Math.max(MIN_PREVIEW_ZOOM, value))
}

function getTouchDistance(touches: React.TouchList) {
  const first = touches.item(0)
  const second = touches.item(1)

  if (!first || !second) {
    return null
  }

  return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY)
}

export function DraftingPaneSurface({
  areaName,
  canSwap,
  draggingPaneId,
  isSelected,
  isSnapTarget,
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
}: {
  areaName?: string
  canSwap: boolean
  draggingPaneId: string | null
  isSelected: boolean
  isSnapTarget: boolean
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
}) {
  const hideLayerSelectionChrome = activeCanvasTool === "pan" || !layerEditingEnabled
  const surfaceRef = useRef<HTMLDivElement | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const onPaneSelectRef = useRef(onPaneSelect)
  const onPaneQrClickRef = useRef(onPaneQrClick)
  const panOverlayRef = useRef<HTMLDivElement>(null)
  const panInteractionRef = useRef<{
    pointerId: number
    startClientX: number
    startClientY: number
    startPanX: number
    startPanY: number
  } | null>(null)
  const pinchDistanceRef = useRef<number | null>(null)
  const pinchZoomRef = useRef(paneZoom)
  const effectiveZoom = paneZoom
  const effectivePan = previewLocked ? { x: 0, y: 0 } : panePan
  const isFreeEditWorkspace =
    toolbarVariant === "desktop-zoom" && layerEditingEnabled && !previewLocked
  const shouldAutoFitViewport = previewLocked || fitCanvasToViewport
  const surfaceAppearance = previewLocked ? "template" : isFreeEditWorkspace ? "workspace" : "neutral"
  const hasSeededFitZoomRef = useRef(false)

  useEffect(() => {
    if (!shouldAutoFitViewport && !isFreeEditWorkspace) {
      return
    }

    const surface = surfaceRef.current

    if (!surface) {
      return
    }

    const updateFitScale = () => {
      const rect = surface.getBoundingClientRect()

      if (rect.width <= 0 || rect.height <= 0) {
        return
      }

      const nextFitScale = computeTemplatePreviewFit(
        { width: pane.cardState.width, height: pane.cardState.height },
        { width: rect.width, height: rect.height },
        fitCanvasToViewport
          ? { allowUpscale: true, padding: DESKTOP_CANVAS_FIT_PADDING }
          : undefined,
      )

      if (shouldAutoFitViewport) {
        onPaneZoom(pane.id, nextFitScale)
        return
      }

      if (isFreeEditWorkspace && !hasSeededFitZoomRef.current) {
        onPaneZoom(pane.id, nextFitScale)
        hasSeededFitZoomRef.current = true
      }
    }

    updateFitScale()

    const observer = new ResizeObserver(updateFitScale)
    observer.observe(surface)

    return () => {
      observer.disconnect()
    }
  }, [
    fitCanvasToViewport,
    isFreeEditWorkspace,
    onPaneZoom,
    pane.cardState.height,
    pane.cardState.width,
    pane.id,
    shouldAutoFitViewport,
  ])

  useEffect(() => {
    if (!isFreeEditWorkspace) {
      hasSeededFitZoomRef.current = false
    }
  }, [isFreeEditWorkspace])

  useEffect(() => {
    onPaneSelectRef.current = onPaneSelect
  }, [onPaneSelect])

  useEffect(() => {
    onPaneQrClickRef.current = onPaneQrClick
  }, [onPaneQrClick])

  useEffect(() => {
    pinchZoomRef.current = paneZoom
  }, [paneZoom])

  useEffect(() => {
    return () => {
      unlockCanvasPanCursor()
    }
  }, [])

  const handleSelect = useCallback(() => {
    onPaneSelectRef.current(pane.id)
  }, [pane.id])

  const getPlacementPoint = useCallback(
    (event: ReactMouseEvent<HTMLDivElement> | ReactPointerEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()

      return {
        x: (event.clientX - rect.left - rect.width / 2 - effectivePan.x) / effectiveZoom,
        y: (event.clientY - rect.top - rect.height / 2 - effectivePan.y) / effectiveZoom,
      }
    },
    [effectivePan.x, effectivePan.y, effectiveZoom],
  )

  const isPlacementTarget = useCallback(
    (event: ReactMouseEvent<HTMLDivElement> | ReactPointerEvent<HTMLDivElement>) =>
      !(
        event.target instanceof Element &&
        event.target.closest("[data-layer-id], [data-slot='drafting-layer-resize-frame'], button")
      ),
    [],
  )

  const handleSurfaceClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (activeCanvasTool === "text" && onAddTextLayerAt && isPlacementTarget(event)) {
        event.preventDefault()
        event.stopPropagation()
        onPaneSelectRef.current(pane.id)
        onAddTextLayerAt(pane.id, getPlacementPoint(event))
        onCanvasToolChange?.(null)
        return
      }

      handleSelect()
    },
    [
      activeCanvasTool,
      getPlacementPoint,
      handleSelect,
      isPlacementTarget,
      onAddTextLayerAt,
      onCanvasToolChange,
      pane.id,
    ],
  )

  const handleQrClick = useCallback(() => {
    onPaneQrClickRef.current(pane.id)
  }, [pane.id])

  const shouldIgnorePanToolTarget = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) =>
      event.target instanceof Element &&
      Boolean(
        event.target.closest(
          "button, input, textarea, select, [data-slot='drafting-layer-floating-toolbar'], [data-slot='drafting-layer-context-menu']",
        ),
      ),
    [],
  )

  const beginPanePan = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (previewLocked) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      const captureTarget = panOverlayRef.current ?? event.currentTarget
      captureTarget.setPointerCapture(event.pointerId)
      onPaneSelectRef.current(pane.id)
      panInteractionRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startPanX: panePan.x,
        startPanY: panePan.y,
      }
      lockCanvasPanCursor()
      setIsPanning(true)
    },
    [pane.id, panePan.x, panePan.y, previewLocked],
  )

  const handlePanePointerDownCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (activeCanvasTool !== "pan" || event.button !== 0 || event.pointerType === "touch") {
        return
      }

      if (shouldIgnorePanToolTarget(event)) {
        return
      }

      if (event.target instanceof Element && event.target.closest("[data-slot='drafting-pan-overlay']")) {
        return
      }

      beginPanePan(event)
    },
    [activeCanvasTool, beginPanePan, shouldIgnorePanToolTarget],
  )

  const handlePanePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || event.pointerType === "touch") {
        return
      }

      if (!isPlacementTarget(event)) {
        return
      }

      if (activeCanvasTool === "text" && onAddTextLayerAt) {
        event.preventDefault()
        event.stopPropagation()
        return
      }

      if (activeCanvasTool !== "pan") {
        onPaneSelectRef.current(pane.id)
        onLayerSelect?.(pane.id, null)
        return
      }
    },
    [activeCanvasTool, isPlacementTarget, onAddTextLayerAt, onLayerSelect, pane.id],
  )

  const handlePanePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const interaction = panInteractionRef.current

      if (!interaction || interaction.pointerId !== event.pointerId) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      onPanePan(pane.id, {
        x: interaction.startPanX + event.clientX - interaction.startClientX,
        y: interaction.startPanY + event.clientY - interaction.startClientY,
      })
    },
    [onPanePan, pane.id],
  )

  const handlePanePointerEnd = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (panInteractionRef.current?.pointerId === event.pointerId) {
      panInteractionRef.current = null
      unlockCanvasPanCursor()
      setIsPanning(false)
    }
  }, [])

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      if (previewLocked) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      onPaneSelectRef.current(pane.id)

      const nextZoom = clampPreviewZoom(paneZoom * Math.exp(-event.deltaY * WHEEL_ZOOM_SENSITIVITY))
      onPaneZoom(pane.id, nextZoom)
    },
    [onPaneZoom, pane.id, paneZoom, previewLocked],
  )

  const handleTouchStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (previewLocked) {
        return
      }

      const distance = getTouchDistance(event.touches)

      if (distance === null) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      onPaneSelectRef.current(pane.id)
      pinchDistanceRef.current = distance
      pinchZoomRef.current = paneZoom
    },
    [pane.id, paneZoom, previewLocked],
  )

  const handleTouchMove = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (previewLocked) {
        return
      }

      const startDistance = pinchDistanceRef.current
      const nextDistance = getTouchDistance(event.touches)

      if (startDistance === null || nextDistance === null || startDistance <= 0) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      onPaneZoom(pane.id, clampPreviewZoom(pinchZoomRef.current * (nextDistance / startDistance)))
    },
    [onPaneZoom, pane.id, previewLocked],
  )

  const handleTouchEnd = useCallback((event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length < 2) {
      pinchDistanceRef.current = null
    }
  }, [])

  return (
    <div
      ref={surfaceRef}
      key={pane.id}
      data-slot="desktop-compose-surface"
      data-surface-appearance={surfaceAppearance}
      data-preview-locked={previewLocked ? "true" : "false"}
      data-dragging={draggingPaneId === pane.id ? "true" : "false"}
      data-grid-visible={showCanvasGrid ? "true" : "false"}
      data-panning={isPanning ? "true" : "false"}
      data-snap-target={isSnapTarget ? "true" : "false"}
      draggable={canSwap}
      className={cn(
        "relative flex h-full w-full touch-none flex-col items-center justify-center overflow-hidden transition-opacity duration-150 ease-out after:pointer-events-none after:absolute after:inset-0 after:border-2 after:border-dashed after:border-transparent after:content-[''] after:transition-colors after:duration-150 after:ease-out",
        isFreeEditWorkspace
          ? "bg-[var(--ws-workspace-bg,#ffffff)]"
          : "bg-[var(--ws-canvas-bg)]",
        canSwap && "cursor-grab active:cursor-grabbing",
        draggingPaneId === pane.id && "opacity-55",
        isSnapTarget && "after:border-[var(--ws-ink)]",
      )}
      style={{
        gridArea: areaName,
        backgroundImage:
          showCanvasGrid && !isFreeEditWorkspace && !previewLocked
            ? "radial-gradient(circle, rgb(var(--ws-canvas-dot-rgb) / var(--ws-canvas-dot-opacity)) 2.4px, transparent 3px)"
            : "none",
        backgroundPosition: "0 0",
        backgroundSize: "30px 30px",
      }}
      role="group"
      aria-label="Canvas surface"
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return
        }
        event.preventDefault()
        handleSurfaceClick(event as unknown as React.MouseEvent<HTMLDivElement>)
      }}
      onClick={handleSurfaceClick}
      onDragEnd={onPaneDragEnd}
      onDragLeave={(event) => onPaneDragLeave(pane.id, event)}
      onDragOver={(event) => onPaneDragOver(pane.id, event)}
      onDragStart={(event) => onPaneDragStart(pane.id, event)}
      onDrop={(event) => onPaneDrop(pane.id, event)}
      onPointerCancel={handlePanePointerEnd}
      onPointerDownCapture={handlePanePointerDownCapture}
      onPointerDown={handlePanePointerDown}
      onPointerMove={handlePanePointerMove}
      onPointerUp={handlePanePointerEnd}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      onWheel={previewLocked ? undefined : handleWheel}
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
          transform: `translate3d(${effectivePan.x}px, ${effectivePan.y}px, 0) scale(${effectiveZoom})`,
          transformOrigin: "center center",
          transition: "transform 150ms ease-out",
        }}
        className="flex h-full w-full items-center justify-center"
      >
        <Pane
          cardState={pane.cardState}
          interactionScale={effectiveZoom}
          layers={pane.layers}
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
          onQrClick={handleQrClick}
          onSelect={handleSelect}
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
          onPointerCancel={handlePanePointerEnd}
          onPointerDown={beginPanePan}
          onPointerMove={handlePanePointerMove}
          onPointerUp={handlePanePointerEnd}
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
