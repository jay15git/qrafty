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

import {
  type DraftingCardState,
} from "@/features/workspace/model/card-state"
import { cornerRadiiToCss } from "@/features/workspace/model/corner-radius"
import {
  clampLayerGeometryToCanvas,
  createDefaultDraftingLayers,
  DEFAULT_DRAFTING_LAYER_SHADOW,
  getDraftingMarqueeSelection,
  type DraftingCanvasLayer,
} from "@/features/workspace/model/layers"
import { DEFAULT_DRAFTING_OUTLINE } from "@/features/workspace/model/effects"
import {
  ensureDraftingFontsForLayers,
} from "@/features/workspace/model/fonts"
import {
  CONTEXT_MENU_POINTER_OFFSET_PX,
  FLOATING_TOOLBAR_MIN_WIDTH_PX,
  RESIZE_SNAP_THRESHOLD_PX,
  type DraftingLayerMenuAction,
} from "@/features/workspace/components/pane-layer-chrome.constants"
import {
  documentToChromeOffset,
  getChromeFrameRect,
  getChromeVisualScale,
  type ChromeSpace,
} from "@/features/workspace/components/pane-layer-chrome-overlay"
import {
  getDraftingCardBorderStyle,
} from "@/features/workspace/rendering/layer-dom-styles"
import { cssFillToBackgroundStyle } from "@/features/workspace/model/css-fill-style"
import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import type { QraftyState } from "@/features/qr-code/model/state"
import type { StaticQrValidationResult } from "@/features/qr-code/content/static-payload"
import type { DraftingQrStateByLayerId } from "@/features/workspace/model/document"
import { type SceneCompositionState } from "@/features/workspace/model/scene-templates"
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
import { useTouchPrimary } from "@/lib/hooks/use-touch-primary"
import {
  getPreviewCameraStyle,
  getPreviewStageSize,
  scalePreviewCornerRadiiState,
} from "@/features/workspace/preview/preview-camera"
import { previewDrawerResize } from "@/features/workspace/preview/preview-drawer-resize"

export type PaneWorkspaceInteractionsInput = {
  activeQrLayerId?: string
  cardState: DraftingCardState
  contentPan?: { x: number; y: number }
  contentOnlyZoom: boolean
  contentValidation?: StaticQrValidationResult
  interactionScale: number
  viewFitScale: number
  isSelected: boolean
  layers?: DraftingCanvasLayer[]
  onLayerAction?: (layerIds: string[], action: DraftingLayerMenuAction) => void
  onLayerChange?: (layerId: string, patch: Partial<DraftingCanvasLayer>) => void
  onLayerCopy?: (layerIds: string[]) => void
  onLayerSelect?: (layerId: string | null, options?: { additive?: boolean }) => void
  onLayerSelectionChange?: (layerIds: string[], options?: { additive?: boolean }) => void
  onSelect: () => void
  onQrClick: () => void
  qrStateByLayerId: DraftingQrStateByLayerId
  sceneComposition: SceneCompositionState
  selectedLayerId?: string | null
  selectedLayerIds?: string[]
  snapEnabled: boolean
  state: QraftyState
  theme: DesktopThemeMode
}

export type PaneMarqueeState = {
  additive: boolean
  end: { x: number; y: number }
  pointerId: number
  start: { x: number; y: number }
}

export type PaneMultiSelectionPreview = {
  bounds: Pick<DraftingCanvasLayer, "height" | "width" | "x" | "y"> & { rotation?: number }
  rotation: number
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

export type PaneContextMenuState = {
  layerIds: string[]
  scenePoint?: { x: number; y: number }
  x: number
  y: number
}

const ROTATION_LABEL_HIDE_DELAY_MS = 2000
/* Bencho-style crop morph: frame and document move on
   width/height with the same curve, never a scale. */
const RATIO_MORPH_MS = 520
const RATIO_MORPH_FLAG_MS = RATIO_MORPH_MS + 120
const SNAP_THRESHOLD_PX = 6
const INTERACTION_START_THRESHOLD_PX = 3
const INTERACTION_START_THRESHOLD_TOUCH_PX = 8

function isTouchLikePointer(event: { pointerType: string }) {
  return event.pointerType === "touch" || event.pointerType === "pen"
}

function releasePointerCaptureSafe(event: PointerEvent<HTMLElement>) {
  const target = event.currentTarget
  if (typeof target.hasPointerCapture === "function" && target.hasPointerCapture(event.pointerId)) {
    target.releasePointerCapture(event.pointerId)
  }
}

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

function resolveVisibleLayerGroups(
  visibleLayers: DraftingCanvasLayer[],
  contentOnlyZoom: boolean,
) {
  const cardLayers = contentOnlyZoom
    ? visibleLayers.filter((layer) => layer.kind === "card")
    : []
  const contentLayers = contentOnlyZoom
    ? visibleLayers.filter((layer) => layer.kind !== "card")
    : visibleLayers

  return { cardLayers, contentLayers }
}

function buildChromeSpace(
  contentOnlyZoom: boolean,
  contentPan: { x: number; y: number } | undefined,
  interactionScale: number,
  viewFitScale: number,
): ChromeSpace {
  return {
    contentOnlyZoom,
    contentPanX: contentPan?.x ?? 0,
    contentPanY: contentPan?.y ?? 0,
    interactionScale,
    viewFitScale,
  }
}

function resolveSelectionState(
  selectedLayerIds: string[] | undefined,
  selectedLayerId: string | null | undefined,
  visibleLayers: DraftingCanvasLayer[],
  contextMenu: { layerIds: string[] } | null,
  resolvedLayers: DraftingCanvasLayer[],
) {
  const activeSelectedLayerIds = selectedLayerIds ?? (selectedLayerId ? [selectedLayerId] : [])
  const activeSelectedLayerIdSet = new Set(activeSelectedLayerIds)
  const selectedVisibleLayers = visibleLayers.filter((layer) =>
    activeSelectedLayerIdSet.has(layer.id),
  )
  const selectedVisibleLayerIds = selectedVisibleLayers.map((layer) => layer.id)
  const contextMenuLayerIdSet = contextMenu ? new Set(contextMenu.layerIds) : null
  const contextMenuLayers = contextMenu
    ? resolvedLayers.filter((layer) => contextMenuLayerIdSet?.has(layer.id))
    : []

  return {
    activeSelectedLayerIds,
    activeSelectedLayerIdSet,
    contextMenuLayers,
    selectedVisibleLayers,
    selectedVisibleLayerIds,
  }
}

function resolveSceneLayoutZoom(sceneComposition: SceneCompositionState) {
  return Number.isFinite(sceneComposition.layout.zoom) && sceneComposition.layout.zoom > 0
    ? sceneComposition.layout.zoom
    : 1
}

function resolveSnapGuideClipBounds(
  visibleLayers: DraftingCanvasLayer[],
  chromeSpace: ChromeSpace,
) {
  const snapGuideClipLayer = visibleLayers.find((layer) => layer.kind === "card") ?? null
  return snapGuideClipLayer
    ? getChromeFrameRect(snapGuideClipLayer, 0, chromeSpace)
    : null
}

function resolveCardChrome(cardState: DraftingCardState) {
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

  return {
    cardImageStyle,
    cardStyle,
    imageFilterShader,
    isImageFilterMode,
    isImageMode,
    isPaperShaderMode,
  }
}

export function usePaneWorkspaceInteractions({
  activeQrLayerId,
  cardState,
  contentPan,
  contentOnlyZoom,
  contentValidation,
  interactionScale,
  viewFitScale,
  snapEnabled,
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
  sceneComposition,
  selectedLayerId,
  selectedLayerIds,
  theme,
}: PaneWorkspaceInteractionsInput) {
  const preferLowPowerShaders = useTouchPrimary()
  const [hasError, setHasError] = useState(false)
  const [rotatingLayerId, setRotatingLayerId] = useState<string | null>(null)
  const [isLayerInteracting, setIsLayerInteracting] = useState(false)
  const [isMovingLayers, setIsMovingLayers] = useState(false)
  const [canvasHeight, setCanvasHeight] = useState(0)
  const [canvasWidth, setCanvasWidth] = useState(0)
  /* data-ratio-morph has to be on in the same commit that moves
     the card, or the first frame paints the new size before the
     transition exists. So the flag is set during render — the
     documented "adjust state when props change" pattern — and
     only the timeout that clears it lives in an effect. */
  const [ratioMorph, setRatioMorph] = useState({
    active: false,
    height: cardState.height,
    sizePresetId: cardState.sizePresetId,
    width: cardState.width,
  })
  const ratioMorphTimeoutRef = useRef<number | null>(null)
  const [toolbarWidth, setToolbarWidth] = useState(FLOATING_TOOLBAR_MIN_WIDTH_PX)
  const [rotationPreviewDegrees, setRotationPreviewDegrees] = useState<number | null>(null)
  const [multiSelectionPreview, setMultiSelectionPreview] = useState<PaneMultiSelectionPreview | null>(null)
  const [snapGuides, setSnapGuides] = useState<SnapGuides>({
    horizontal: [],
    vertical: [],
  })
  const [contextMenu, setContextMenu] = useState<PaneContextMenuState | null>(null)
  const [marquee, setMarquee] = useState<PaneMarqueeState | null>(null)
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
    pointerType?: string
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
      if (ratioMorphTimeoutRef.current !== null) {
        window.clearTimeout(ratioMorphTimeoutRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    if (!ratioMorph.active) {
      return
    }

    ratioMorphTimeoutRef.current = window.setTimeout(() => {
      ratioMorphTimeoutRef.current = null
      setRatioMorph((current) => ({ ...current, active: false }))
    }, RATIO_MORPH_FLAG_MS)

    return () => {
      if (ratioMorphTimeoutRef.current !== null) {
        window.clearTimeout(ratioMorphTimeoutRef.current)
      }
    }
  }, [ratioMorph])

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const updateCanvasHeight = () => {
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
  const { cardLayers, contentLayers } = resolveVisibleLayerGroups(visibleLayers, contentOnlyZoom)
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
  const chromeSpace: ChromeSpace = buildChromeSpace(
    contentOnlyZoom,
    contentPan,
    interactionScale,
    viewFitScale,
  )
  const contentTransformStyle: CSSProperties | undefined = contentOnlyZoom
    ? buildContentTransformStyle(contentPan, interactionScale)
    : undefined
  const {
    activeSelectedLayerIds,
    activeSelectedLayerIdSet,
    contextMenuLayers,
    selectedVisibleLayers,
    selectedVisibleLayerIds,
  } = resolveSelectionState(
    selectedLayerIds,
    selectedLayerId,
    visibleLayers,
    contextMenu,
    resolvedLayers,
  )
  const combinedLayerBounds = getCombinedLayerBounds(selectedVisibleLayers)
  const chromeSnapGuides: SnapGuides = {
    horizontal: snapGuides.horizontal.map(
      (y) => documentToChromeOffset(0, y, chromeSpace).y,
    ),
    vertical: snapGuides.vertical.map(
      (x) => documentToChromeOffset(x, 0, chromeSpace).x,
    ),
  }
  const sceneLayoutZoom = resolveSceneLayoutZoom(sceneComposition)
  const qrOverlayScale = getChromeVisualScale(chromeSpace) * sceneLayoutZoom
  const snapGuideClipBounds = resolveSnapGuideClipBounds(visibleLayers, chromeSpace)

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
  const {
    cardImageStyle,
    cardStyle,
    imageFilterShader,
    isImageFilterMode,
    isImageMode,
    isPaperShaderMode,
  } = resolveCardChrome(cardState)

  if (
    ratioMorph.width !== cardState.width ||
    ratioMorph.height !== cardState.height ||
    ratioMorph.sizePresetId !== cardState.sizePresetId
  ) {
    setRatioMorph({
      /* Auto mode re-derives the card from the QR on every
         content change — only fixed-mode size jumps morph. */
      active: cardState.sizeMode === "fixed",
      height: cardState.height,
      sizePresetId: cardState.sizePresetId,
      width: cardState.width,
    })
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
      pointerType: event.pointerType,
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

    if (isTouchLikePointer(event)) {
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
      pointerType: event.pointerType,
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

  function applyGroupMoveInteraction(
    interaction: NonNullable<typeof interactionRef.current>,
    deltaX: number,
    deltaY: number,
  ) {
    const geometryByLayerId: Record<string, Partial<DraftingCanvasLayer>> = {}

    for (const selectedLayer of interaction.layers ?? []) {
      if (selectedLayer.kind === "card") {
        continue
      }

      geometryByLayerId[selectedLayer.id] = constrainLayerPatch(selectedLayer, {
        x: roundLayerNumber(selectedLayer.x + deltaX),
        y: roundLayerNumber(selectedLayer.y + deltaY),
      })
    }

    publishLiveLayerGeometry(geometryByLayerId)
  }

  function applyGroupRotateInteraction(
    interaction: NonNullable<typeof interactionRef.current>,
    event: PointerEvent<HTMLElement>,
  ) {
    const groupCenter = interaction.groupCenter
    if (!groupCenter || !interaction.layers) {
      return
    }

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
      const nextCenter = rotatePoint(center, groupCenter, rotation)
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
  }

  function applyGroupResizeInteraction(
    interaction: NonNullable<typeof interactionRef.current>,
    deltaX: number,
    deltaY: number,
  ) {
    const groupBounds = interaction.groupBounds
    if (!groupBounds || !interaction.layers) {
      return
    }

    const nextBounds = resizeDraftingLayer(
      {
        ...groupBounds,
        blur: 0,
        id: "selection",
        isVisible: true,
        kind: "card",
        layerFilters: [],
        name: "Selection",
        nodeId: "selection",
        opacity: 1,
        outline: { ...DEFAULT_DRAFTING_OUTLINE },
        rotation: 0,
        shadows: [],
        tiltX: 0,
        tiltY: 0,
        shadow: { ...DEFAULT_DRAFTING_LAYER_SHADOW, color: "#000000" },
        zIndex: 0,
      },
      interaction.resizeDirection ?? "se",
      deltaX,
      deltaY,
    )
    const scaleX = groupBounds.width > 0 ? nextBounds.width / groupBounds.width : 1
    const scaleY = groupBounds.height > 0 ? nextBounds.height / groupBounds.height : 1
    const geometryByLayerId: Record<string, Partial<DraftingCanvasLayer>> = {}

    for (const selectedLayer of interaction.layers) {
      if (selectedLayer.kind === "card") {
        continue
      }

      geometryByLayerId[selectedLayer.id] = constrainLayerPatch(selectedLayer, {
        height: roundLayerNumber(selectedLayer.height * scaleY),
        width: roundLayerNumber(selectedLayer.width * scaleX),
        x: roundLayerNumber(nextBounds.x + (selectedLayer.x - groupBounds.x) * scaleX),
        y: roundLayerNumber(nextBounds.y + (selectedLayer.y - groupBounds.y) * scaleY),
      })
    }

    publishLiveLayerGeometry(geometryByLayerId)
  }

  function applySingleRotateInteraction(
    interaction: NonNullable<typeof interactionRef.current>,
    event: PointerEvent<HTMLElement>,
  ) {
    const layer = interaction.layer
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
  }

  function applySingleMoveInteraction(
    interaction: NonNullable<typeof interactionRef.current>,
    deltaX: number,
    deltaY: number,
    snapThreshold: number,
  ) {
    const layer = interaction.layer
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
  }

  function applySingleResizeInteraction(
    interaction: NonNullable<typeof interactionRef.current>,
    deltaX: number,
    deltaY: number,
    resizeSnapThreshold: number,
    hasStartedInteraction: boolean,
  ) {
    const layer = interaction.layer
    const resizeDirection = interaction.resizeDirection ?? "se"
    const isCornerResize = resizeDirection.length === 2

    if (
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
      resizeDirection,
      deltaX,
      deltaY,
      interaction.lockedResizeAxis,
    )
    const snappedResize = snapEnabled
      ? snapLayerResize({
          direction: resizeDirection,
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

  function updateLayerInteraction(event: PointerEvent<HTMLElement>) {
    const interaction = interactionRef.current

    if (!interaction || interaction.pointerId !== event.pointerId) {
      return
    }

    event.stopPropagation()
    event.preventDefault()
    const scale =
      (interactionScale > 0 ? interactionScale : 1) * (viewFitScale > 0 ? viewFitScale : 1)
    const snapThreshold = SNAP_THRESHOLD_PX / scale
    const resizeSnapThreshold = RESIZE_SNAP_THRESHOLD_PX / scale
    const deltaX = (event.clientX - interaction.startX) / scale
    const deltaY = (event.clientY - interaction.startY) / scale
    const startThreshold = isTouchLikePointer({ pointerType: interaction.pointerType ?? "mouse" })
      ? INTERACTION_START_THRESHOLD_TOUCH_PX
      : INTERACTION_START_THRESHOLD_PX
    const hasStartedInteraction =
      Math.hypot(event.clientX - interaction.startX, event.clientY - interaction.startY) >=
      startThreshold

    if (!hasStartedInteraction && interaction.mode !== "rotate") {
      setSnapGuides({ horizontal: [], vertical: [] })
      return
    }

    if (interaction.layers && interaction.groupBounds && interaction.groupCenter) {
      if (interaction.mode === "move") {
        applyGroupMoveInteraction(interaction, deltaX, deltaY)
        return
      }

      if (interaction.mode === "rotate") {
        applyGroupRotateInteraction(interaction, event)
        return
      }

      if (interaction.mode === "resize") {
        applyGroupResizeInteraction(interaction, deltaX, deltaY)
        return
      }
    }

    if (interaction.mode === "rotate") {
      applySingleRotateInteraction(interaction, event)
      return
    }

    if (interaction.mode === "move") {
      applySingleMoveInteraction(interaction, deltaX, deltaY, snapThreshold)
      return
    }

    applySingleResizeInteraction(
      interaction,
      deltaX,
      deltaY,
      resizeSnapThreshold,
      hasStartedInteraction,
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
      releasePointerCaptureSafe(event)
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

  return {
    activeQrLayerId,
    activeSelectedLayerIdSet,
    activeSelectedLayerIds,
    artboardScale,
    canvasHeight,
    canvasRef,
    canvasWidth,
    cardImageStyle,
    cardLayers,
    cardStyle,
    chromeSnapGuides,
    chromeSpace,
    combinedLayerBounds,
    contentLayers,
    contentTransformStyle,
    contextMenu,
    contextMenuLayers,
    editingTextDraft,
    editingTextLayerId,
    hasError,
    imageFilterShader,
    isImageFilterMode,
    isImageMode,
    isLayerInteracting,
    isPaperShaderMode,
    isSelected,
    marquee,
    multiSelectionPreview,
    preferLowPowerShaders,
    previewCameraStyle,
    previewStageBorderRadius,
    previewStageSize,
    qrOverlayScale,
    ratioMorph,
    rotatingLayerId,
    rotationPreviewDegrees,
    selectedVisibleLayers,
    selectedVisibleLayerIds,
    setHasError,
    snapGuideClipBounds,
    suppressCanvasClickRef,
    textEditorRefs,
    theme,
    toolbarRef,
    toolbarWidth,
    visibleLayers,
    activateLayerSelection,
    commitEditingTextDraft,
    endLayerInteraction,
    endMarqueeSelection,
    handleTextEditorInput,
    openCanvasContextMenu,
    openFloatingLayerContextMenu,
    openLayerContextMenu,
    runLayerAction,
    runSelectedLayerAction,
    runSelectedLayerCopy,
    selectLayerFromClick,
    startLayerInteraction,
    startMarqueeSelection,
    startMultiLayerInteraction,
    startTextEditing,
    updateLayerInteraction,
    updateMarqueeSelection,
  }
}
