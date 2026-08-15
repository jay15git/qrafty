"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent,
  type WheelEvent,
} from "react"

import type { DraftingPane, DraftingPaneCanvasTool } from "@/features/workspace/components/DraftingPaneSurface"
import { computeTemplatePreviewFit, DESKTOP_CANVAS_FIT_PADDING } from "@/features/workspace/model/template-preview-fit"

const CANVAS_PAN_CURSOR_LOCK_CLASS = "drafting-canvas-panning"

const MIN_PREVIEW_ZOOM = 0.1
const MAX_PREVIEW_ZOOM = 4
const WHEEL_ZOOM_SENSITIVITY = 0.001

function lockCanvasPanCursor() {
  document.documentElement.classList.add(CANVAS_PAN_CURSOR_LOCK_CLASS)
  document.body.classList.add(CANVAS_PAN_CURSOR_LOCK_CLASS)
}

function unlockCanvasPanCursor() {
  document.documentElement.classList.remove(CANVAS_PAN_CURSOR_LOCK_CLASS)
  document.body.classList.remove(CANVAS_PAN_CURSOR_LOCK_CLASS)
}

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

type UseDraftingPaneSurfaceInteractionsArgs = {
  activeCanvasTool?: DraftingPaneCanvasTool | null
  fitCanvasToViewport?: boolean
  layerEditingEnabled?: boolean
  onAddTextLayerAt?: (paneId: string, point: { x: number; y: number }) => void
  onCanvasToolChange?: (tool: DraftingPaneCanvasTool | null) => void
  onLayerSelect?: (
    paneId: string,
    layerId: string | null,
    options?: { additive?: boolean },
  ) => void
  onPanePan: (paneId: string, nextPan: { x: number; y: number }) => void
  onPaneQrClick: (paneId: string) => void
  onPaneSelect: (paneId: string) => void
  onPaneZoom: (paneId: string, nextZoom: number) => void
  pane: DraftingPane
  panePan: { x: number; y: number }
  paneZoom: number
  previewLocked?: boolean
  toolbarVariant?: "default" | "desktop-zoom"
}

export function useDraftingPaneSurfaceInteractions({
  activeCanvasTool,
  fitCanvasToViewport = false,
  layerEditingEnabled = true,
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
  previewLocked = false,
  toolbarVariant = "default",
}: UseDraftingPaneSurfaceInteractionsArgs) {
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
  const isBoundedCanvas = fitCanvasToViewport && !previewLocked
  const isFreeEditWorkspace =
    toolbarVariant === "desktop-zoom" &&
    layerEditingEnabled &&
    !previewLocked &&
    !isBoundedCanvas
  const effectivePan = previewLocked || isBoundedCanvas ? { x: 0, y: 0 } : panePan
  const shouldAutoFitViewport = previewLocked || fitCanvasToViewport
  const fitScaleRef = useRef(1)
  const paneZoomRef = useRef(paneZoom)
  const onPaneZoomRef = useRef(onPaneZoom)
  const surfaceAppearance: "template" | "workspace" | "neutral" = previewLocked
    ? "template"
    : isFreeEditWorkspace
      ? "workspace"
      : "neutral"
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
      const previousFitScale = fitScaleRef.current
      fitScaleRef.current = nextFitScale

      if (previewLocked) {
        onPaneZoom(pane.id, nextFitScale)
        return
      }

      if (isBoundedCanvas) {
        if (!hasSeededFitZoomRef.current) {
          onPaneZoom(pane.id, nextFitScale)
          hasSeededFitZoomRef.current = true
          return
        }

        const currentZoom = paneZoomRef.current
        const zoomRatio = previousFitScale > 0 ? currentZoom / previousFitScale : 1
        const nextZoom = clampPreviewZoom(Math.max(nextFitScale, nextFitScale * zoomRatio))
        onPaneZoom(pane.id, nextZoom)
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
    isBoundedCanvas,
    isFreeEditWorkspace,
    onPaneZoom,
    pane.cardState.height,
    pane.cardState.width,
    pane.id,
    shouldAutoFitViewport,
  ])

  useEffect(() => {
    if (!isFreeEditWorkspace && !isBoundedCanvas) {
      hasSeededFitZoomRef.current = false
    }
  }, [isBoundedCanvas, isFreeEditWorkspace])

  useEffect(() => {
    if (!isBoundedCanvas) {
      return
    }

    if (panePan.x !== 0 || panePan.y !== 0) {
      onPanePan(pane.id, { x: 0, y: 0 })
    }
  }, [isBoundedCanvas, onPanePan, pane.id, panePan.x, panePan.y])

  useEffect(() => {
    if (isBoundedCanvas && activeCanvasTool === "pan") {
      onCanvasToolChange?.("select")
    }
  }, [activeCanvasTool, isBoundedCanvas, onCanvasToolChange])

  useEffect(() => {
    onPaneSelectRef.current = onPaneSelect
  }, [onPaneSelect])

  useEffect(() => {
    onPaneQrClickRef.current = onPaneQrClick
  }, [onPaneQrClick])

  useEffect(() => {
    paneZoomRef.current = paneZoom
  }, [paneZoom])

  useEffect(() => {
    onPaneZoomRef.current = onPaneZoom
  }, [onPaneZoom])

  useEffect(() => {
    pinchZoomRef.current = paneZoom
  }, [paneZoom])

  useEffect(() => {
    return () => {
      unlockCanvasPanCursor()
    }
  }, [])

  useEffect(() => {
    const surface = surfaceRef.current

    if (!surface || previewLocked) {
      return
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      event.stopPropagation()
      onPaneSelectRef.current(pane.id)

      const currentZoom = paneZoomRef.current
      const rawZoom = currentZoom * Math.exp(-event.deltaY * WHEEL_ZOOM_SENSITIVITY)
      const minZoom = isBoundedCanvas ? fitScaleRef.current : MIN_PREVIEW_ZOOM
      const nextZoom = clampPreviewZoom(Math.max(minZoom, rawZoom))
      onPaneZoomRef.current(pane.id, nextZoom)
    }

    surface.addEventListener("wheel", onWheel, { passive: false })

    return () => {
      surface.removeEventListener("wheel", onWheel)
    }
  }, [isBoundedCanvas, pane.id, previewLocked])

  const handleSelect = useCallback(() => {
    onPaneSelectRef.current(pane.id)
  }, [pane.id])

  const getPlacementPoint = useCallback(
    (event: ReactMouseEvent<HTMLDivElement> | ReactPointerEvent<HTMLDivElement>) => {
      if (isBoundedCanvas) {
        const artboard = event.currentTarget.querySelector('[data-slot="desktop-compose-artboard"]')
        const rect = artboard?.getBoundingClientRect()

        if (rect && rect.width > 0) {
          const scale = rect.width / pane.cardState.width

          return {
            x: (event.clientX - (rect.left + rect.width / 2)) / scale,
            y: (event.clientY - (rect.top + rect.height / 2)) / scale,
          }
        }
      }

      const rect = event.currentTarget.getBoundingClientRect()

      return {
        x: (event.clientX - rect.left - rect.width / 2 - effectivePan.x) / effectiveZoom,
        y: (event.clientY - rect.top - rect.height / 2 - effectivePan.y) / effectiveZoom,
      }
    },
    [
      effectivePan.x,
      effectivePan.y,
      effectiveZoom,
      isBoundedCanvas,
      pane.cardState.width,
    ],
  )

  const isPlacementTarget = useCallback(
    (event: ReactMouseEvent<HTMLDivElement> | ReactPointerEvent<HTMLDivElement>) =>
      !(
        event.target instanceof Element &&
        event.target.closest(
          "[data-layer-id], [data-slot='drafting-layer-resize-frame'], button, [data-konva-layer-mirror='true']",
        )
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

  const handleSurfaceKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return
      }
      event.preventDefault()
      handleSurfaceClick(event as unknown as ReactMouseEvent<HTMLDivElement>)
    },
    [handleSurfaceClick],
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
      if (previewLocked || isBoundedCanvas) {
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
    [isBoundedCanvas, pane.id, panePan.x, panePan.y, previewLocked],
  )

  const handlePanePointerDownCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (
        isBoundedCanvas ||
        activeCanvasTool !== "pan" ||
        event.button !== 0 ||
        event.pointerType === "touch"
      ) {
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
    [activeCanvasTool, beginPanePan, isBoundedCanvas, shouldIgnorePanToolTarget],
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

      const rawZoom = paneZoom * Math.exp(-event.deltaY * WHEEL_ZOOM_SENSITIVITY)
      const minZoom = isBoundedCanvas ? fitScaleRef.current : MIN_PREVIEW_ZOOM
      const nextZoom = clampPreviewZoom(Math.max(minZoom, rawZoom))
      onPaneZoom(pane.id, nextZoom)
    },
    [isBoundedCanvas, onPaneZoom, pane.id, paneZoom, previewLocked],
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
      const minZoom = isBoundedCanvas ? fitScaleRef.current : MIN_PREVIEW_ZOOM
      onPaneZoom(
        pane.id,
        clampPreviewZoom(
          Math.max(minZoom, pinchZoomRef.current * (nextDistance / startDistance)),
        ),
      )
    },
    [isBoundedCanvas, onPaneZoom, pane.id, previewLocked],
  )

  const handleTouchEnd = useCallback((event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length < 2) {
      pinchDistanceRef.current = null
    }
  }, [])

  return {
    beginPanePan,
    effectivePan,
    effectiveZoom,
    hideLayerSelectionChrome,
    isBoundedCanvas,
    isFreeEditWorkspace,
    isPanning,
    panOverlayRef,
    surfaceAppearance,
    surfaceRef,
    handleQrClick,
    handleSelect,
    handlePanePointerDown,
    handlePanePointerDownCapture,
    handlePanePointerEnd,
    handlePanePointerMove,
    handleSurfaceClick,
    handleSurfaceKeyDown,
    handleTouchEnd,
    handleTouchMove,
    handleTouchStart,
    handleWheel,
  }
}
