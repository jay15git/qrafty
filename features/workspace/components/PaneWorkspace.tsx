"use client"

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type MouseEvent,
  type PointerEvent,
} from "react"
import { createPortal } from "react-dom"

import {
  DEFAULT_DRAFTING_CARD_STATE,
  type DraftingCardState,
} from "@/features/workspace/model/card-state"
import { cornerRadiiToCss } from "@/features/workspace/model/corner-radius"
import {
  clampLayerGeometryToCanvas,
  createDefaultDraftingLayers,
  getDraftingMarqueeSelection,
  type DraftingCanvasLayer,
} from "@/features/workspace/model/layers"
import {
  ensureDraftingFontsForLayers,
} from "@/features/workspace/model/fonts"
import {
  SceneCompositionTransform,
} from "@/features/workspace/components/SceneBackgroundLayer"
import {
  PaneLayerView,
  PaneDocumentCardLayer,
  type PaneLayerViewSharedProps,
} from "@/features/workspace/components/PaneLayerViews"
import {
  LayerContextMenu,
  LayerFloatingToolbar,
  ResizeFrameControls,
  SnapGuideOverlay,
} from "@/features/workspace/components/PaneLayerChrome"
import {
  CONTEXT_MENU_POINTER_OFFSET_PX,
  FLOATING_TOOLBAR_GAP_PX,
  FLOATING_TOOLBAR_HEIGHT_PX,
  FLOATING_TOOLBAR_MIN_WIDTH_PX,
  RESIZE_CONTROL_PADDING_PX,
  FLOATING_TOOLBAR_EDGE_GUTTER_PX,
  RESIZE_SNAP_THRESHOLD_PX,
  ROTATE_HANDLE_OFFSET_PX,
  ROTATE_HANDLE_RADIUS_PX,
  ROTATE_HANDLE_STEM_PX,
  ROTATE_LABEL_GAP_PX,
  type DraftingLayerMenuAction,
} from "@/features/workspace/components/pane-layer-chrome.constants"
import {
  documentToChromeOffset,
  documentToChromeSize,
  getChromeFrameRect,
  getFloatingToolbarChromePosition,
  type ChromeSpace,
} from "@/features/workspace/components/pane-layer-chrome-overlay"
import {
  getDraftingCardBorderStyle,
} from "@/features/workspace/rendering/layer-dom-styles"
import { cssFillToBackgroundStyle } from "@/features/workspace/model/css-fill-style"
import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import type { QrStudioState } from "@/features/qr-code/model/state"
import type { DraftingQrStateByLayerId } from "@/features/workspace/model/document"
import { createDefaultSceneComposition, type SceneCompositionState } from "@/features/workspace/model/scene-templates"
import {
  getCombinedLayerBounds,
  getLayerRotationLabel,
  getMarqueeBounds,
  normalizeLayerRotation,
  resizeDraftingLayer,
  rotatePoint,
  roundLayerNumber,
  snapLayerMove,
  snapLayerResize,
  snapLayerRotation,
  type ResizeDirection,
  type SnapGuides,
} from "@/features/workspace/components/pane-layer-geometry"
import { PaneSurfaceInteractive } from "@/features/workspace/components/pane-layer-a11y"
import { useTouchPrimary } from "@/hooks/use-touch-primary"
import { PreviewRuntimeProvider } from "@/features/workspace/preview/preview-context"
import {
  getPreviewCameraStyle,
  getPreviewStageSize,
  scalePreviewCornerRadiiState,
} from "@/features/workspace/preview/preview-camera"
import { previewDrawerResize } from "@/features/workspace/preview/preview-drawer-resize"

export type PaneWorkspaceProps = {
  cardState?: DraftingCardState
  contentPan?: { x: number; y: number }
  contentOnlyZoom?: boolean
  interactionScale?: number
  viewFitScale?: number
  isSelected: boolean
  layers?: DraftingCanvasLayer[]
  onLayerAction?: (layerIds: string[], action: DraftingLayerMenuAction) => void
  onLayerChange?: (layerId: string, patch: Partial<DraftingCanvasLayer>) => void
  onLayerCopy?: (layerIds: string[]) => void
  onLayerPaste?: (point: { x: number; y: number }) => void
  onLayerSelect?: (layerId: string | null, options?: { additive?: boolean }) => void
  onLayerSelectionChange?: (layerIds: string[], options?: { additive?: boolean }) => void
  onSelect: () => void
  onQrClick: () => void
  qrStateByLayerId: DraftingQrStateByLayerId
  sceneComposition?: SceneCompositionState
  selectedLayerId?: string | null
  selectedLayerIds?: string[]
  snapEnabled?: boolean
  state: QrStudioState
  theme?: DesktopThemeMode
}

const LAYER_MOVE_CURSOR_LOCK_CLASS = "drafting-layer-moving"

function lockLayerMoveCursor() {
  document.documentElement.classList.add(LAYER_MOVE_CURSOR_LOCK_CLASS)
  document.body.classList.add(LAYER_MOVE_CURSOR_LOCK_CLASS)
}

function unlockLayerMoveCursor() {
  document.documentElement.classList.remove(LAYER_MOVE_CURSOR_LOCK_CLASS)
  document.body.classList.remove(LAYER_MOVE_CURSOR_LOCK_CLASS)
}

const ROTATION_LABEL_HIDE_DELAY_MS = 2000
const SNAP_THRESHOLD_PX = 6
const INTERACTION_START_THRESHOLD_PX = 3

function overlayLayerGeometry(
  layers: DraftingCanvasLayer[],
  geometryByLayerId: Record<string, Partial<DraftingCanvasLayer>> | null,
) {
  if (!geometryByLayerId) {
    return layers
  }

  return layers.map((layer) => {
    const patch = geometryByLayerId[layer.id]
    return patch ? { ...layer, ...patch } : layer
  })
}

function hasTranslucentCardFill(fill: string) {
  const rgbaMatch = /^rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)$/i.exec(fill)
  if (rgbaMatch) {
    return Number(rgbaMatch[1]) < 0.98
  }

  return fill.includes("rgba(") && !fill.includes(", 1)") && !fill.includes(",1)")
}

function buildContentTransformStyle(
  contentPan: { x: number; y: number } | undefined,
  interactionScale: number,
): CSSProperties | undefined {
  const translate =
    contentPan && (contentPan.x !== 0 || contentPan.y !== 0)
      ? `translate3d(${contentPan.x}px, ${contentPan.y}px, 0)`
      : null
  const scale = interactionScale !== 1 ? `scale(${interactionScale})` : null
  const transform = [translate, scale].filter(Boolean).join(" ")

  if (!transform) {
    return undefined
  }

  return {
    transform,
    transformOrigin: "center center",
  }
}

export function PaneWorkspace({
  cardState = DEFAULT_DRAFTING_CARD_STATE,
  contentPan,
  contentOnlyZoom = false,
  interactionScale = 1,
  viewFitScale = 1,
  snapEnabled = true,
  state,
  isSelected,
  layers,
  onLayerAction,
  onLayerChange,
  onLayerCopy,
  onLayerSelect,
  onLayerSelectionChange,
  onSelect,
  onQrClick,
  qrStateByLayerId,
  sceneComposition = createDefaultSceneComposition(),
  selectedLayerId,
  selectedLayerIds,
  theme = "dark",
}: PaneWorkspaceProps) {
  const preferLowPowerShaders = useTouchPrimary()
  const [hasError, setHasError] = useState(false)
  const [rotatingLayerId, setRotatingLayerId] = useState<string | null>(null)
  const [isLayerInteracting, setIsLayerInteracting] = useState(false)
  const [isMovingLayers, setIsMovingLayers] = useState(false)
  const [canvasHeight, setCanvasHeight] = useState(0)
  const [canvasWidth, setCanvasWidth] = useState(0)
  const [toolbarWidth, setToolbarWidth] = useState(FLOATING_TOOLBAR_MIN_WIDTH_PX)
  const [rotationPreviewDegrees, setRotationPreviewDegrees] = useState<number | null>(null)
  const [multiSelectionPreview, setMultiSelectionPreview] = useState<{
    bounds: Pick<DraftingCanvasLayer, "height" | "width" | "x" | "y"> & { rotation?: number }
    rotation: number
  } | null>(null)
  const [snapGuides, setSnapGuides] = useState<SnapGuides>({
    horizontal: [],
    vertical: [],
  })
  const [contextMenu, setContextMenu] = useState<{
    layerIds: string[]
    scenePoint?: { x: number; y: number }
    x: number
    y: number
  } | null>(null)
  const [marquee, setMarquee] = useState<{
    additive: boolean
    end: { x: number; y: number }
    pointerId: number
    start: { x: number; y: number }
  } | null>(null)
  const [editingTextLayerId, setEditingTextLayerId] = useState<string | null>(null)
  const [editingTextDraft, setEditingTextDraft] = useState("")
  const [liveLayerGeometryById, setLiveLayerGeometryById] = useState<Record<
    string,
    Partial<DraftingCanvasLayer>
  > | null>(null)
  const pendingDocumentLayerChangesRef = useRef<Map<string, Partial<DraftingCanvasLayer>>>(
    new Map(),
  )
  const documentLayerChangeRafRef = useRef<number | null>(null)
  const interactionRef = useRef<{
    centerClientX?: number
    centerClientY?: number
    groupBounds?: Pick<DraftingCanvasLayer, "height" | "width" | "x" | "y"> & { rotation?: number }
    groupCenter?: { x: number; y: number }
    layers?: DraftingCanvasLayer[]
    layer: DraftingCanvasLayer
    lockedResizeAxis?: "horizontal" | "vertical"
    mode: "move" | "resize" | "rotate"
    pointerId: number
    resizeDirection?: ResizeDirection
    startAngle?: number
    startRotation?: number
    startX: number
    startY: number
  } | null>(null)
  const rotationLabelTimeoutRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const toolbarRef = useRef<HTMLDivElement | null>(null)
  const textEditorRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})
  const marqueeRef = useRef<typeof marquee>(null)
  const suppressCanvasClickRef = useRef(false)
  const suppressLayerClickRef = useRef(false)

  useEffect(
    () => () => {
      if (rotationLabelTimeoutRef.current !== null) {
        window.clearTimeout(rotationLabelTimeoutRef.current)
      }
      if (documentLayerChangeRafRef.current !== null) {
        window.cancelAnimationFrame(documentLayerChangeRafRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const updateCanvasHeight = () => {
      if (previewDrawerResize.getIsResizing()) {
        return
      }

      setCanvasHeight(canvas.getBoundingClientRect().height)
      setCanvasWidth(canvas.getBoundingClientRect().width)
    }

    updateCanvasHeight()

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateCanvasHeight)
      const unsubscribeDrawerResizeEnded = previewDrawerResize.subscribeOnEnded(updateCanvasHeight)

      return () => {
        window.removeEventListener("resize", updateCanvasHeight)
        unsubscribeDrawerResizeEnded()
      }
    }

    const observer = new ResizeObserver(updateCanvasHeight)
    observer.observe(canvas)
    const unsubscribeDrawerResizeEnded = previewDrawerResize.subscribeOnEnded(updateCanvasHeight)

    return () => {
      observer.disconnect()
      unsubscribeDrawerResizeEnded()
    }
  }, [])

  useEffect(() => {
    if (!contextMenu) {
      return
    }

    function closeContextMenuOnOutsidePointer(event: Event) {
      const target = event.target

      if (
        target instanceof Element &&
        target.closest('[data-slot="drafting-layer-context-menu"]')
      ) {
        return
      }

      setContextMenu(null)
    }

    document.addEventListener("pointerdown", closeContextMenuOnOutsidePointer, true)

    return () => {
      document.removeEventListener("pointerdown", closeContextMenuOnOutsidePointer, true)
    }
  }, [contextMenu])

  const resolvedLayers = useMemo(
    () =>
      layers && layers.length > 0
        ? layers
        : createDefaultDraftingLayers("preview", state, cardState),
    [cardState, layers, state],
  )
  const sceneLayers = useMemo(
    () => overlayLayerGeometry(resolvedLayers, liveLayerGeometryById),
    [liveLayerGeometryById, resolvedLayers],
  )

  useEffect(() => {
    void ensureDraftingFontsForLayers(resolvedLayers)
  }, [resolvedLayers])

  useEffect(() => {
    if (!editingTextLayerId) {
      return
    }

    const editor = textEditorRefs.current[editingTextLayerId]
    editor?.focus()
    editor?.setSelectionRange(editor.value.length, editor.value.length)
  }, [editingTextLayerId])

  useEffect(() => {
    if (!isMovingLayers) {
      return
    }

    lockLayerMoveCursor()

    return () => {
      unlockLayerMoveCursor()
    }
  }, [isMovingLayers])

  useEffect(() => {
    return () => {
      unlockLayerMoveCursor()
    }
  }, [])

  const visibleLayers = sceneLayers
    .filter((layer) => layer.isVisible)
    .sort((a, b) => a.zIndex - b.zIndex)
  const cardLayers = contentOnlyZoom
    ? visibleLayers.filter((layer) => layer.kind === "card")
    : []
  const contentLayers = contentOnlyZoom
    ? visibleLayers.filter((layer) => layer.kind !== "card")
    : visibleLayers
  // Desktop compose zoom belongs to content layers. Keep card/background fixed.
  const artboardInteractionScale = contentOnlyZoom ? 1 : interactionScale
  const artboardScale = viewFitScale * artboardInteractionScale
  const previewStageSize = getPreviewStageSize(cardState.width, cardState.height, artboardScale)
  const previewCameraStyle = getPreviewCameraStyle(
    cardState.width,
    cardState.height,
    artboardScale,
  )
  const previewStageBorderRadius = cornerRadiiToCss(
    scalePreviewCornerRadiiState(cardState.cornerRadii, artboardScale),
  )
  const chromeSpace: ChromeSpace = {
    contentOnlyZoom,
    contentPanX: contentPan?.x ?? 0,
    contentPanY: contentPan?.y ?? 0,
    interactionScale,
    viewFitScale,
  }
  const contentTransformStyle: CSSProperties | undefined = contentOnlyZoom
    ? buildContentTransformStyle(contentPan, interactionScale)
    : undefined
  const activeSelectedLayerIds = selectedLayerIds ?? (selectedLayerId ? [selectedLayerId] : [])
  const activeSelectedLayerIdSet = new Set(activeSelectedLayerIds)
  const selectedVisibleLayers = visibleLayers.filter((layer) => activeSelectedLayerIdSet.has(layer.id))
  const selectedVisibleLayerIds = selectedVisibleLayers.map((layer) => layer.id)
  const contextMenuLayerIdSet = contextMenu ? new Set(contextMenu.layerIds) : null
  const contextMenuLayers = contextMenu
    ? resolvedLayers.filter((layer) => contextMenuLayerIdSet?.has(layer.id))
    : []
  const combinedLayerBounds = getCombinedLayerBounds(selectedVisibleLayers)
  const chromeSnapGuides: SnapGuides = {
    horizontal: snapGuides.horizontal.map(
      (y) => documentToChromeOffset(0, y, chromeSpace).y,
    ),
    vertical: snapGuides.vertical.map(
      (x) => documentToChromeOffset(x, 0, chromeSpace).x,
    ),
  }

  useLayoutEffect(() => {
    const toolbar = toolbarRef.current

    if (!toolbar) {
      return
    }

    const width = toolbar.getBoundingClientRect().width

    if (Number.isFinite(width) && width > 0) {
      setToolbarWidth(width)
    }
  }, [selectedVisibleLayerIds, chromeSpace.interactionScale, chromeSpace.viewFitScale])
  const isPaperShaderMode = cardState.styleMode === "paper-shader"
  const isImageMode = cardState.styleMode === "image"
  const isImageFilterMode = cardState.styleMode === "image-filter"
  const cardImageStyle =
    (isImageMode || isImageFilterMode) && cardState.cardImage.value
      ? {
          backgroundImage: `url("${cardState.cardImage.value}")`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: cardState.cardImage.fit,
        }
      : undefined
  const cardStyle: CSSProperties = {
    ...(isPaperShaderMode || isImageFilterMode || isImageMode
      ? { backgroundColor: "transparent" }
      : cssFillToBackgroundStyle(cardState.fill)),
    ...cardImageStyle,
    ...getDraftingCardBorderStyle(cardState),
    borderRadius: cornerRadiiToCss(cardState.cornerRadii),
    ...(hasTranslucentCardFill(cardState.fill) ? { backdropFilter: "blur(16px)" } : {}),
  }
  const imageFilterShader = {
    ...cardState.imageFilter,
    image: {
      ...cardState.imageFilter.image,
      source: cardState.cardImage.source === "none" ? cardState.imageFilter.image.source : cardState.cardImage.source,
      value: cardState.cardImage.value ?? cardState.imageFilter.image.value,
    },
  }

  function constrainLayerPatch(
    layer: DraftingCanvasLayer,
    patch: Partial<DraftingCanvasLayer>,
  ): Partial<DraftingCanvasLayer> {
    if (layer.kind === "card") {
      return patch
    }

    const constrained = clampLayerGeometryToCanvas({ ...layer, ...patch }, cardState)
    const result = { ...patch }

    for (const key of ["height", "width", "x", "y"] as const) {
      if (key in patch) {
        result[key] = constrained[key]
      }
    }

    return result
  }

  function flushDocumentLayerChanges() {
    if (documentLayerChangeRafRef.current !== null) {
      window.cancelAnimationFrame(documentLayerChangeRafRef.current)
      documentLayerChangeRafRef.current = null
    }

    const pending = pendingDocumentLayerChangesRef.current
    if (pending.size === 0) {
      return
    }

    pendingDocumentLayerChangesRef.current = new Map()
    for (const [layerId, patch] of pending) {
      onLayerChange?.(layerId, patch)
    }
  }

  function queueDocumentLayerChange(layerId: string, patch: Partial<DraftingCanvasLayer>) {
    const current = pendingDocumentLayerChangesRef.current.get(layerId)
    pendingDocumentLayerChangesRef.current.set(layerId, current ? { ...current, ...patch } : patch)
  }

  function scheduleDocumentLayerFlush() {
    if (documentLayerChangeRafRef.current !== null) {
      return
    }

    documentLayerChangeRafRef.current = window.requestAnimationFrame(() => {
      documentLayerChangeRafRef.current = null
      flushDocumentLayerChanges()
    })
  }

  function publishLiveLayerGeometry(
    geometryByLayerId: Record<string, Partial<DraftingCanvasLayer>>,
    guides?: SnapGuides,
  ) {
    setLiveLayerGeometryById(geometryByLayerId)
    if (guides) {
      setSnapGuides(guides)
    }

    for (const [layerId, patch] of Object.entries(geometryByLayerId)) {
      queueDocumentLayerChange(layerId, patch)
    }
    scheduleDocumentLayerFlush()
  }

  function startLayerInteraction(
    event: PointerEvent<HTMLElement>,
    layer: DraftingCanvasLayer,
    mode: "move" | "resize" | "rotate",
    resizeDirection?: ResizeDirection,
  ) {
    if (editingTextLayerId && editingTextLayerId !== layer.id) {
      commitEditingTextDraft()
    }

    if (event.metaKey || event.ctrlKey) {
      return
    }

    if (!onLayerChange) {
      return
    }

    if (
      mode === "move" &&
      activeSelectedLayerIds.length > 1 &&
      activeSelectedLayerIdSet.has(layer.id)
    ) {
      startMultiLayerInteraction(event, "move")
      return
    }

    event.stopPropagation()
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    const layerElement = event.currentTarget.closest<HTMLElement>("[data-layer-id]")
    const layerRect = layerElement?.getBoundingClientRect()
    const centerClientX = layerRect ? layerRect.left + layerRect.width / 2 : event.clientX
    const centerClientY = layerRect ? layerRect.top + layerRect.height / 2 : event.clientY

    interactionRef.current = {
      centerClientX,
      centerClientY,
      layer,
      mode,
      pointerId: event.pointerId,
      resizeDirection,
      startAngle:
        (Math.atan2(event.clientY - centerClientY, event.clientX - centerClientX) * 180) /
        Math.PI,
      startRotation: layer.rotation,
      startX: event.clientX,
      startY: event.clientY,
    }
    setIsLayerInteracting(true)
    if (mode === "move") {
      lockLayerMoveCursor()
      setIsMovingLayers(true)
    }
    if (mode === "rotate") {
      if (rotationLabelTimeoutRef.current !== null) {
        window.clearTimeout(rotationLabelTimeoutRef.current)
        rotationLabelTimeoutRef.current = null
      }
      setRotatingLayerId(layer.id)
      setRotationPreviewDegrees(getLayerRotationLabel(layer.rotation))
    }
    onLayerSelect?.(layer.id)
  }

  function openLayerContextMenu(
    event: MouseEvent<HTMLElement>,
    layerIds: string[],
  ) {
    if (layerIds.length === 0) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    setContextMenu({
      layerIds,
      scenePoint: getScenePointFromClientPoint(event.clientX, event.clientY),
      x: event.clientX,
      y: event.clientY + CONTEXT_MENU_POINTER_OFFSET_PX,
    })
    onLayerSelect?.(layerIds.at(-1) ?? null)
  }

  function openFloatingLayerContextMenu(
    event: MouseEvent<HTMLButtonElement>,
    layerIds: string[],
  ) {
    if (layerIds.length === 0) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const x = rect.left
    const y = rect.bottom + CONTEXT_MENU_POINTER_OFFSET_PX

    event.preventDefault()
    event.stopPropagation()
    setContextMenu({
      layerIds,
      scenePoint: getScenePointFromClientPoint(rect.left + rect.width / 2, rect.bottom),
      x,
      y,
    })
    onLayerSelect?.(layerIds.at(-1) ?? null)
  }

  function openCanvasContextMenu(event: MouseEvent<HTMLElement>) {
    if (event.target !== event.currentTarget) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    setContextMenu({
      layerIds: activeSelectedLayerIds,
      scenePoint: getScenePointFromClientPoint(event.clientX, event.clientY),
      x: event.clientX,
      y: event.clientY + CONTEXT_MENU_POINTER_OFFSET_PX,
    })
  }

  function runLayerAction(action: DraftingLayerMenuAction) {
    if (!contextMenu || contextMenu.layerIds.length === 0) {
      return
    }

    onLayerAction?.(contextMenu.layerIds, action)
    setContextMenu(null)
  }

  function runSelectedLayerAction(action: DraftingLayerMenuAction) {
    if (selectedVisibleLayerIds.length === 0) {
      return
    }

    onLayerAction?.(selectedVisibleLayerIds, action)
  }

  function runSelectedLayerCopy() {
    if (selectedVisibleLayerIds.length === 0) {
      return
    }

    onLayerCopy?.(selectedVisibleLayerIds)
  }

  function getScenePointFromClientPoint(clientX: number, clientY: number) {
    const rect = canvasRef.current?.getBoundingClientRect()
    const scale =
      (interactionScale > 0 ? interactionScale : 1) * (viewFitScale > 0 ? viewFitScale : 1)

    if (!rect) {
      return { x: 0, y: 0 }
    }

    return {
      x: (clientX - (rect.left + rect.width / 2)) / scale,
      y: (clientY - (rect.top + rect.height / 2)) / scale,
    }
  }

  function startMarqueeSelection(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0 || event.target !== event.currentTarget) {
      return
    }

    if (editingTextLayerId) {
      commitEditingTextDraft()
    }

    const point = getScenePointFromClientPoint(event.clientX, event.clientY)

    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    setContextMenu(null)
    const nextMarquee = {
      additive: event.shiftKey || event.metaKey || event.ctrlKey,
      end: point,
      pointerId: event.pointerId,
      start: point,
    }
    marqueeRef.current = nextMarquee
    setMarquee(nextMarquee)
  }

  function updateMarqueeSelection(event: PointerEvent<HTMLElement>) {
    const current = marqueeRef.current

    if (!current || current.pointerId !== event.pointerId) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const nextMarquee = {
      ...current,
      end: getScenePointFromClientPoint(event.clientX, event.clientY),
    }
    marqueeRef.current = nextMarquee
    setMarquee(nextMarquee)
  }

  function endMarqueeSelection(event: PointerEvent<HTMLElement>) {
    const current = marqueeRef.current

    if (!current || current.pointerId !== event.pointerId) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    marqueeRef.current = null
    setMarquee(null)

    const moved =
      Math.abs(current.end.x - current.start.x) > 1 ||
      Math.abs(current.end.y - current.start.y) > 1
    suppressCanvasClickRef.current = moved

    const selectedIds = getDraftingMarqueeSelection(
      visibleLayers,
      getMarqueeBounds(current.start, current.end),
    )

    onLayerSelectionChange?.(selectedIds, { additive: current.additive })
  }

  function startMultiLayerInteraction(
    event: PointerEvent<HTMLElement>,
    mode: "move" | "resize" | "rotate",
    resizeDirection?: ResizeDirection,
  ) {
    if (!combinedLayerBounds || selectedVisibleLayers.length < 2 || !onLayerChange) {
      return
    }

    event.stopPropagation()
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    const frameElement =
      event.currentTarget.closest<HTMLElement>("[data-slot='drafting-layer-multi-select-frame']") ??
      event.currentTarget
        .closest<HTMLElement>("[data-slot='desktop-compose-canvas']")
        ?.querySelector<HTMLElement>("[data-slot='drafting-layer-multi-select-frame']")
    const frameRect = frameElement?.getBoundingClientRect()
    const centerClientX = frameRect ? frameRect.left + frameRect.width / 2 : event.clientX
    const centerClientY = frameRect ? frameRect.top + frameRect.height / 2 : event.clientY

    interactionRef.current = {
      centerClientX,
      centerClientY,
      groupBounds: combinedLayerBounds,
      groupCenter: {
        x: combinedLayerBounds.x + combinedLayerBounds.width / 2,
        y: combinedLayerBounds.y + combinedLayerBounds.height / 2,
      },
      layer: selectedVisibleLayers[0],
      layers: selectedVisibleLayers,
      mode,
      pointerId: event.pointerId,
      resizeDirection,
      startAngle:
        (Math.atan2(event.clientY - centerClientY, event.clientX - centerClientX) * 180) /
        Math.PI,
      startRotation: 0,
      startX: event.clientX,
      startY: event.clientY,
    }
    setIsLayerInteracting(true)
    if (mode === "move") {
      lockLayerMoveCursor()
      setIsMovingLayers(true)
    }
    if (mode === "rotate") {
      if (rotationLabelTimeoutRef.current !== null) {
        window.clearTimeout(rotationLabelTimeoutRef.current)
        rotationLabelTimeoutRef.current = null
      }
      setRotatingLayerId("selection")
      setRotationPreviewDegrees(0)
      setMultiSelectionPreview({
        bounds: combinedLayerBounds,
        rotation: combinedLayerBounds.rotation ?? 0,
      })
    }
  }

  function updateLayerInteraction(event: PointerEvent<HTMLElement>) {
    const interaction = interactionRef.current

    if (!interaction || interaction.pointerId !== event.pointerId) {
      return
    }

    event.stopPropagation()
    const scale =
      (interactionScale > 0 ? interactionScale : 1) * (viewFitScale > 0 ? viewFitScale : 1)
    const snapThreshold = SNAP_THRESHOLD_PX / scale
    const resizeSnapThreshold = RESIZE_SNAP_THRESHOLD_PX / scale
    const deltaX = (event.clientX - interaction.startX) / scale
    const deltaY = (event.clientY - interaction.startY) / scale
    const layer = interaction.layer
    const hasStartedInteraction =
      Math.hypot(event.clientX - interaction.startX, event.clientY - interaction.startY) >=
      INTERACTION_START_THRESHOLD_PX

    if (!hasStartedInteraction && interaction.mode !== "rotate") {
      setSnapGuides({ horizontal: [], vertical: [] })
      return
    }

    if (interaction.layers && interaction.groupBounds && interaction.groupCenter) {
      if (interaction.mode === "move") {
        const geometryByLayerId: Record<string, Partial<DraftingCanvasLayer>> = {}

        for (const selectedLayer of interaction.layers) {
          if (selectedLayer.kind === "card") {
            continue
          }

          geometryByLayerId[selectedLayer.id] = constrainLayerPatch(selectedLayer, {
            x: roundLayerNumber(selectedLayer.x + deltaX),
            y: roundLayerNumber(selectedLayer.y + deltaY),
          })
        }

        publishLiveLayerGeometry(geometryByLayerId)
        return
      }

      if (interaction.mode === "rotate") {
        const centerClientX = interaction.centerClientX ?? event.clientX
        const centerClientY = interaction.centerClientY ?? event.clientY
        const angle =
          (Math.atan2(event.clientY - centerClientY, event.clientX - centerClientX) * 180) /
          Math.PI
        const freeRotation = normalizeLayerRotation(angle - (interaction.startAngle ?? angle))
        const rotation = snapEnabled ? snapLayerRotation(freeRotation) : freeRotation

        setRotationPreviewDegrees(getLayerRotationLabel(rotation))
        setMultiSelectionPreview((current) =>
          current
            ? {
                ...current,
                rotation: getLayerRotationLabel((interaction.groupBounds?.rotation ?? 0) + rotation),
              }
            : current,
        )

        const geometryByLayerId: Record<string, Partial<DraftingCanvasLayer>> = {}

        for (const selectedLayer of interaction.layers) {
          if (selectedLayer.kind === "card") {
            continue
          }

          const center = {
            x: selectedLayer.x + selectedLayer.width / 2,
            y: selectedLayer.y + selectedLayer.height / 2,
          }
          const nextCenter = rotatePoint(center, interaction.groupCenter, rotation)
          geometryByLayerId[selectedLayer.id] = constrainLayerPatch(selectedLayer, {
            rotation: normalizeLayerRotation(selectedLayer.rotation + rotation),
            x: roundLayerNumber(nextCenter.x - selectedLayer.width / 2),
            y: roundLayerNumber(nextCenter.y - selectedLayer.height / 2),
          })
        }

        publishLiveLayerGeometry(geometryByLayerId, {
          horizontal: [],
          vertical: snapEnabled && rotation !== freeRotation ? [0] : [],
        })
        return
      }

      if (interaction.mode === "resize") {
        const nextBounds = resizeDraftingLayer(
          {
            ...interaction.groupBounds,
            blur: 0,
            id: "selection",
            isVisible: true,
            kind: "card",
            name: "Selection",
            nodeId: "selection",
            opacity: 1,
            rotation: 0,
            tiltX: 0,
            tiltY: 0,
            shadow: { blur: 0, color: "#000000", offsetX: 0, offsetY: 0, opacity: 0 },
            zIndex: 0,
          },
          interaction.resizeDirection ?? "se",
          deltaX,
          deltaY,
        )
        const scaleX = interaction.groupBounds.width > 0 ? nextBounds.width / interaction.groupBounds.width : 1
        const scaleY = interaction.groupBounds.height > 0 ? nextBounds.height / interaction.groupBounds.height : 1
        const geometryByLayerId: Record<string, Partial<DraftingCanvasLayer>> = {}

        for (const selectedLayer of interaction.layers) {
          if (selectedLayer.kind === "card") {
            continue
          }

          geometryByLayerId[selectedLayer.id] = constrainLayerPatch(selectedLayer, {
            height: roundLayerNumber(selectedLayer.height * scaleY),
            width: roundLayerNumber(selectedLayer.width * scaleX),
            x: roundLayerNumber(nextBounds.x + (selectedLayer.x - interaction.groupBounds.x) * scaleX),
            y: roundLayerNumber(nextBounds.y + (selectedLayer.y - interaction.groupBounds.y) * scaleY),
          })
        }

        publishLiveLayerGeometry(geometryByLayerId)
        return
      }
    }

    if (interaction.mode === "rotate") {
      const centerClientX = interaction.centerClientX ?? event.clientX
      const centerClientY = interaction.centerClientY ?? event.clientY
      const angle =
        (Math.atan2(event.clientY - centerClientY, event.clientX - centerClientX) * 180) /
        Math.PI

      const freeRotation = normalizeLayerRotation(
        angle - (interaction.startAngle ?? angle) + (interaction.startRotation ?? layer.rotation),
      )
      const rotation = snapEnabled ? snapLayerRotation(freeRotation) : freeRotation

      setRotationPreviewDegrees(getLayerRotationLabel(rotation))
      publishLiveLayerGeometry(
        { [layer.id]: { rotation } },
        {
          horizontal: [],
          vertical: snapEnabled && rotation !== freeRotation ? [0] : [],
        },
      )
      return
    }

    if (interaction.mode === "move") {
      const proposedX = layer.x + deltaX
      const proposedY = layer.y + deltaY
      const nextMove = snapEnabled
        ? snapLayerMove({
            layer,
            layers: visibleLayers,
            proposedX,
            proposedY,
            threshold: snapThreshold,
          })
        : { guides: { horizontal: [], vertical: [] }, x: proposedX, y: proposedY }

      publishLiveLayerGeometry(
        {
          [layer.id]: constrainLayerPatch(layer, {
            x: nextMove.x,
            y: nextMove.y,
          }),
        },
        nextMove.guides,
      )
      return
    }

    const resizeDirection = interaction.resizeDirection ?? "se"
    const isCornerResize = resizeDirection.length === 2

    if (
      interaction.mode === "resize" &&
      isCornerResize &&
      layer.kind === "qr" &&
      interaction.lockedResizeAxis === undefined &&
      hasStartedInteraction
    ) {
      interaction.lockedResizeAxis =
        Math.abs(deltaX) >= Math.abs(deltaY) ? "horizontal" : "vertical"
    }

    const nextGeometry = resizeDraftingLayer(
      layer,
      interaction.resizeDirection ?? "se",
      deltaX,
      deltaY,
      interaction.lockedResizeAxis,
    )
    const snappedResize = snapEnabled
      ? snapLayerResize({
          direction: interaction.resizeDirection ?? "se",
          layer,
          layers: visibleLayers,
          geometry: nextGeometry,
          threshold: resizeSnapThreshold,
        })
      : { geometry: nextGeometry, guides: { horizontal: [], vertical: [] } }

    publishLiveLayerGeometry(
      { [layer.id]: constrainLayerPatch(layer, snappedResize.geometry) },
      snappedResize.guides,
    )
  }

  function endLayerInteraction(event: PointerEvent<HTMLElement>) {
    const interaction = interactionRef.current

    if (interaction?.pointerId === event.pointerId) {
      flushDocumentLayerChanges()
      setLiveLayerGeometryById(null)
      setSnapGuides({ horizontal: [], vertical: [] })
      suppressLayerClickRef.current =
        Math.abs(event.clientX - interaction.startX) > 1 ||
        Math.abs(event.clientY - interaction.startY) > 1

      if (interaction.mode === "rotate") {
        if (rotationLabelTimeoutRef.current !== null) {
          window.clearTimeout(rotationLabelTimeoutRef.current)
        }
        rotationLabelTimeoutRef.current = window.setTimeout(() => {
          setRotatingLayerId(null)
          setRotationPreviewDegrees(null)
          setMultiSelectionPreview(null)
          rotationLabelTimeoutRef.current = null
        }, ROTATION_LABEL_HIDE_DELAY_MS)
      }
      setIsLayerInteracting(false)
      setIsMovingLayers(false)
      unlockLayerMoveCursor()
      interactionRef.current = null
    }
  }

  function activateLayerSelection(
    layer: DraftingCanvasLayer,
    options?: { additive?: boolean; qr?: boolean },
  ) {
    if (layer.kind === "card") {
      return
    }

    if (editingTextLayerId && editingTextLayerId !== layer.id) {
      commitEditingTextDraft()
    }

    onLayerSelect?.(layer.id, { additive: options?.additive ?? false })
    if (options?.qr) {
      onQrClick()
    }
  }

  function selectLayerFromClick(
    event: MouseEvent<HTMLElement>,
    layer: DraftingCanvasLayer,
    options?: { qr?: boolean },
  ) {
    if (layer.kind === "card") {
      return
    }

    event.stopPropagation()

    if (suppressLayerClickRef.current) {
      event.preventDefault()
      suppressLayerClickRef.current = false
      return
    }

    if (editingTextLayerId && editingTextLayerId !== layer.id) {
      commitEditingTextDraft()
    }

    onLayerSelect?.(layer.id, { additive: event.metaKey || event.ctrlKey })
    if (options?.qr) {
      onQrClick()
    }
  }

  function startTextEditing(event: MouseEvent<HTMLElement>, layer: DraftingCanvasLayer) {
    if (layer.kind !== "text") {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    onLayerSelect?.(layer.id)
    setEditingTextLayerId(layer.id)
    setEditingTextDraft(layer.text ?? "")
  }

  function handleTextEditorInput(event: FormEvent<HTMLTextAreaElement>) {
    setEditingTextDraft(event.currentTarget.value)
  }

  function commitEditingTextDraft() {
    if (!editingTextLayerId) {
      return
    }

    const layer = resolvedLayers.find((candidate) => candidate.id === editingTextLayerId)
    const text = textEditorRefs.current[editingTextLayerId]?.value ?? editingTextDraft

    if (layer?.kind === "text" && ((layer.text ?? "") !== text || layer.textRuns)) {
      onLayerChange?.(layer.id, { text, textRuns: undefined })
    }

    setEditingTextDraft(text)
    setEditingTextLayerId(null)
  }

  function renderFloatingToolbar() {
    const bounds = combinedLayerBounds

    if (
      !bounds ||
      selectedVisibleLayers.length === 0 ||
      isLayerInteracting ||
      marquee ||
      rotatingLayerId !== null
    ) {
      return null
    }

    const { x, y } = getFloatingToolbarChromePosition({
      bounds,
      canvasHeight,
      canvasWidth,
      gapPx: FLOATING_TOOLBAR_GAP_PX,
      gutterPx: FLOATING_TOOLBAR_EDGE_GUTTER_PX,
      paddingPx: RESIZE_CONTROL_PADDING_PX,
      rotateStemPx: ROTATE_HANDLE_STEM_PX,
      space: chromeSpace,
      toolbarHeightPx: FLOATING_TOOLBAR_HEIGHT_PX,
      toolbarWidthPx: toolbarWidth,
    })

    return (
      <LayerFloatingToolbar
        ref={toolbarRef}
        layers={selectedVisibleLayers}
        onAction={onLayerAction ? runSelectedLayerAction : undefined}
        onCopy={onLayerCopy ? runSelectedLayerCopy : undefined}
        onLayerChange={
          onLayerChange && selectedVisibleLayers.length === 1
            ? (patch) => onLayerChange(selectedVisibleLayers[0]!.id, patch)
            : undefined
        }
        onMore={(event) => openFloatingLayerContextMenu(event, selectedVisibleLayerIds)}
        style={{
          transform: `translate3d(${x}px, ${y}px, 0) translateX(-50%)`,
        }}
        theme={theme}
      />
    )
  }

  function renderMarquee() {
    if (!marquee) {
      return null
    }

    const bounds = getMarqueeBounds(marquee.start, marquee.end)
    const origin = documentToChromeOffset(bounds.x, bounds.y, chromeSpace)

    return (
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-[9998] border-2 border-[var(--ws-ink)] bg-[var(--ws-ink)]/10"
        data-slot="drafting-layer-marquee"
        style={{
          height: documentToChromeSize(bounds.height, chromeSpace),
          transform: `translate3d(${origin.x}px, ${origin.y}px, 0)`,
          width: documentToChromeSize(bounds.width, chromeSpace),
        }}
      />
    )
  }

  function renderLayerControls(layer: DraftingCanvasLayer) {
    if (activeSelectedLayerIds.length !== 1 || !activeSelectedLayerIdSet.has(layer.id)) {
      return null
    }

    if (layer.kind === "text" && editingTextLayerId === layer.id) {
      return null
    }

    const frame = getChromeFrameRect(layer, RESIZE_CONTROL_PADDING_PX, chromeSpace)
    const isRotating = rotatingLayerId === layer.id
    const rotationDegrees = rotationPreviewDegrees ?? getLayerRotationLabel(layer.rotation)
    const rotation =
      Number.isFinite(layer.rotation) && layer.rotation !== 0
        ? ` rotate(${layer.rotation}deg)`
        : ""

    return (
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 touch-none overflow-visible border-2 border-[var(--ws-resize-frame)]"
        data-layer-id={layer.id}
        data-slot="drafting-layer-resize-frame"
        key={`${layer.id}:controls`}
        style={{
          height: frame.height,
          transform: `translate3d(${frame.x}px, ${frame.y}px, 0)${rotation}`,
          transformOrigin: "center center",
          width: frame.width,
          zIndex: 10000,
        }}
        onContextMenu={(event) => openLayerContextMenu(event, [layer.id])}
      >
        <div
          className="pointer-events-none absolute left-1/2 top-0 w-0.5 -translate-x-1/2 -translate-y-full bg-[var(--ws-resize-frame)]"
          style={{ height: ROTATE_HANDLE_OFFSET_PX }}
        />
        {isRotating ? (
          <div
            className="pointer-events-none absolute left-1/2 top-0 rounded-full border border-white/[0.12] bg-[var(--desktop-glass-bg)] px-2.5 py-1 text-[0.68rem] font-semibold text-white/82 shadow-[var(--desktop-glass-shadow)] backdrop-blur-2xl"
            data-slot="drafting-layer-rotation-value"
            data-toolbar-appearance="desktop-glass"
            style={{
              transform: `translate(-50%, calc(-${ROTATE_HANDLE_OFFSET_PX}px - ${ROTATE_HANDLE_RADIUS_PX}px - ${ROTATE_LABEL_GAP_PX}px - 100%))`,
            }}
          >
            {rotationDegrees}°
          </div>
        ) : null}
        <button
          aria-label={`Rotate ${layer.name}`}
          className="pointer-events-auto absolute left-1/2 top-0 z-30 flex size-4 items-center justify-center border-0 bg-transparent p-0"
          data-slot="drafting-layer-rotate-handle"
          onClick={(event) => event.stopPropagation()}
          onPointerCancel={endLayerInteraction}
          onPointerDown={(event) => startLayerInteraction(event, layer, "rotate")}
          onPointerMove={updateLayerInteraction}
          onPointerUp={endLayerInteraction}
          style={{
            transform: `translate(-50%, calc(-${ROTATE_HANDLE_OFFSET_PX}px - 50%))`,
          }}
          type="button"
        >
          <span
            aria-hidden="true"
            className="size-2 rounded-full border-2 border-[var(--ws-resize-frame)] bg-white shadow-[var(--ws-shadow-rest)]"
            data-slot="drafting-layer-rotate-handle-knob"
          />
        </button>
        <ResizeFrameControls
          onPointerCancel={endLayerInteraction}
          onPointerMove={updateLayerInteraction}
          onPointerUp={endLayerInteraction}
          onResizePointerDown={(event, direction) =>
            startLayerInteraction(event, layer, "resize", direction)
          }
          targetLabel={layer.name}
        />
      </div>
    )
  }

  function createMultiLayerControls() {
    const bounds = multiSelectionPreview?.bounds ?? combinedLayerBounds

    if (activeSelectedLayerIds.length < 2 || !bounds) {
      return null
    }

    const frame = getChromeFrameRect(bounds, RESIZE_CONTROL_PADDING_PX, chromeSpace)
    const isRotating = rotatingLayerId === "selection"
    const rotationDegrees = multiSelectionPreview?.rotation ?? bounds.rotation ?? rotationPreviewDegrees ?? 0
    const rotationTransform = rotationDegrees ? ` rotate(${rotationDegrees}deg)` : ""

    return (
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 touch-none overflow-visible border-2 border-[var(--ws-resize-frame)]"
        data-layer-ids={activeSelectedLayerIds.join(" ")}
        data-slot="drafting-layer-multi-select-frame"
        style={{
          height: frame.height,
          transform: `translate3d(${frame.x}px, ${frame.y}px, 0)${rotationTransform}`,
          transformOrigin: "center center",
          width: frame.width,
          zIndex: 50,
        }}
        onContextMenu={(event) => openLayerContextMenu(event, activeSelectedLayerIds)}
      >
        <div
          className="pointer-events-none absolute left-1/2 top-0 w-0.5 -translate-x-1/2 -translate-y-full bg-[var(--ws-resize-frame)]"
          style={{ height: ROTATE_HANDLE_OFFSET_PX }}
        />
        {isRotating ? (
          <div
            className="pointer-events-none absolute left-1/2 top-0 rounded-full border border-white/[0.12] bg-[var(--desktop-glass-bg)] px-2.5 py-1 text-[0.68rem] font-semibold text-white/82 shadow-[var(--desktop-glass-shadow)] backdrop-blur-2xl"
            data-slot="drafting-layer-rotation-value"
            data-toolbar-appearance="desktop-glass"
            style={{
              transform: `translate(-50%, calc(-${ROTATE_HANDLE_OFFSET_PX}px - ${ROTATE_HANDLE_RADIUS_PX}px - ${ROTATE_LABEL_GAP_PX}px - 100%))`,
            }}
          >
            {rotationDegrees}°
          </div>
        ) : null}
        <button
          aria-label="Rotate selection"
          className="pointer-events-auto absolute left-1/2 top-0 z-30 flex size-4 items-center justify-center border-0 bg-transparent p-0"
          data-slot="drafting-layer-rotate-handle"
          onClick={(event) => event.stopPropagation()}
          onPointerCancel={endLayerInteraction}
          onPointerDown={(event) => startMultiLayerInteraction(event, "rotate")}
          onPointerMove={updateLayerInteraction}
          onPointerUp={endLayerInteraction}
          style={{
            transform: `translate(-50%, calc(-${ROTATE_HANDLE_OFFSET_PX}px - 50%))`,
          }}
          type="button"
        >
          <span
            aria-hidden="true"
            className="size-2 rounded-full border-2 border-[var(--ws-resize-frame)] bg-white shadow-[var(--ws-shadow-rest)]"
            data-slot="drafting-layer-rotate-handle-knob"
          />
        </button>
        <ResizeFrameControls
          onPointerCancel={endLayerInteraction}
          onPointerMove={updateLayerInteraction}
          onPointerUp={endLayerInteraction}
          onResizePointerDown={(event, direction) =>
            startMultiLayerInteraction(event, "resize", direction)
          }
          targetLabel="selection"
        />
      </div>
    )
  }

  const layerViewSharedProps: PaneLayerViewSharedProps = {
    activeSelectedLayerIdSet,
    cardImageStyle,
    cardState,
    cardStyle,
    imageFilterShader,
    isImageFilterMode,
    isImageMode,
    isPaperShaderMode,
    qrStateByLayerId,
    state,
  }

  function renderLayerView(layer: DraftingCanvasLayer) {
    return (
      <PaneLayerView
        key={layer.id}
        {...layerViewSharedProps}
        editingTextDraft={editingTextDraft}
        editingTextLayerId={editingTextLayerId}
        layer={layer}
        onCommitEditingTextDraft={commitEditingTextDraft}
        onEndLayerInteraction={endLayerInteraction}
        onHandleTextEditorInput={handleTextEditorInput}
        onOpenLayerContextMenu={openLayerContextMenu}
        onActivateLayerSelection={activateLayerSelection}
        onSelectLayerFromClick={selectLayerFromClick}
        onStartLayerInteraction={startLayerInteraction}
        onStartTextEditing={startTextEditing}
        onUpdateLayerInteraction={updateLayerInteraction}
        textEditorRefs={textEditorRefs}
      />
    )
  }

  function renderContentChrome() {
    return (
      <>
        <SnapGuideOverlay guides={chromeSnapGuides} />
        {renderMarquee()}
        {activeSelectedLayerIds.length > 0
          ? contentLayers.map((layer) => renderLayerControls(layer))
          : null}
        {createMultiLayerControls()}
        {renderFloatingToolbar()}
      </>
    )
  }

  return (
    <PreviewRuntimeProvider
      artboardScale={artboardScale}
      preferLowPowerShaders={preferLowPowerShaders}
    >
    <PaneSurfaceInteractive
      data-slot="qr-pane"
      data-selected={isSelected ? "true" : "false"}
      className="relative flex h-full w-full flex-col items-center justify-center overflow-visible"
      label="QR pane"
      onActivate={onSelect}
      onClick={(e) => {
        // Only select if clicking the pane background, not the QR itself
        if (e.target === e.currentTarget) {
          onSelect()
        }
      }}
    >
      <PaneSurfaceInteractive
        ref={canvasRef}
        data-slot="desktop-compose-canvas"
        data-compose-mode="compose"
        className="relative h-full w-full overflow-visible"
        label="Compose canvas"
        onActivate={() => {
          onLayerSelect?.(null)
          onSelect()
        }}
        onClick={(event) => {
          if (suppressCanvasClickRef.current) {
            event.preventDefault()
            event.stopPropagation()
            suppressCanvasClickRef.current = false
            return
          }

          onLayerSelect?.(null)
          onSelect()
        }}
        onContextMenu={openCanvasContextMenu}
        onPointerCancel={endMarqueeSelection}
        onPointerDown={startMarqueeSelection}
        onPointerMove={updateMarqueeSelection}
        onPointerUp={endMarqueeSelection}
      >
        {hasError ? (
          <div className="grid h-full place-items-center text-sm font-medium text-[var(--ws-ink-muted)]">
            Could not generate QR
          </div>
        ) : (
          <>
            <div
              className="absolute left-1/2 top-1/2 overflow-hidden"
              data-slot="desktop-compose-artboard-stage"
              style={{
                borderRadius: previewStageBorderRadius,
                height: previewStageSize.height,
                transform: "translate(-50%, -50%)",
                width: previewStageSize.width,
              }}
            >
              <div
                className="overflow-hidden"
                data-slot="desktop-compose-artboard"
                style={{
                  ...previewCameraStyle,
                  borderRadius: cornerRadiiToCss(cardState.cornerRadii),
                }}
              >
              {contentOnlyZoom ? (
                <div className="relative h-full w-full" data-export-root>
                  {cardLayers.map((layer) => (
                    <PaneDocumentCardLayer
                      key={layer.id}
                      cardState={cardState}
                      isImageFilterMode={isImageFilterMode}
                      isImageMode={isImageMode}
                      isPaperShaderMode={isPaperShaderMode}
                      isLayerSelected={activeSelectedLayerIdSet.has(layer.id)}
                      layer={layer}
                    />
                  ))}
                  <SceneCompositionTransform layout={sceneComposition.layout}>
                    <div
                      className="relative h-full w-full"
                      data-slot="desktop-compose-content-zoom"
                      style={contentTransformStyle}
                    >
                      {contentLayers.map((layer) => renderLayerView(layer))}
                    </div>
                  </SceneCompositionTransform>
                </div>
              ) : (
                <SceneCompositionTransform layout={sceneComposition.layout}>
                  <div className="relative h-full w-full" data-export-root>
                    {visibleLayers.map((layer) => renderLayerView(layer))}
                  </div>
                </SceneCompositionTransform>
              )}
            </div>
            </div>
            <div
              className="pointer-events-none absolute inset-0 z-[10000] overflow-visible"
              data-slot="drafting-layer-chrome-overlay"
            >
              {renderContentChrome()}
            </div>
            {contextMenu && typeof document !== "undefined"
              ? createPortal(
                  <LayerContextMenu
                    layerCount={contextMenu.layerIds.length}
                    layers={contextMenuLayers}
                    onAction={runLayerAction}
                    style={{
                      left: contextMenu.x,
                      top: contextMenu.y,
                    }}
                  />,
                  document.body,
                )
              : null}
          </>
        )}
      </PaneSurfaceInteractive>
    </PaneSurfaceInteractive>
    </PreviewRuntimeProvider>
  )
}
