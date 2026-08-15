"use client"

import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import {
  CopyIcon,
  LockIcon,
  MoreHorizontalIcon,
  Trash2Icon,
  UnlockIcon,
} from "lucide-react"

import {
  DEFAULT_DRAFTING_CARD_STATE,
  type DraftingCardState,
} from "@/features/workspace/model/card-state"
import { DraftingCardPaperShaderLayer } from "@/features/workspace/components/CardPaperShaderLayer"
import { createDefaultDraftingCardPaperShader } from "@/features/workspace/model/card-state"
import { cornerRadiiToCss, resolveLayerCornerRadii } from "@/features/workspace/model/corner-radius"
import { getDraftingCardPatternStyle } from "@/features/workspace/model/card-patterns"
import {
  clampLayerGeometryToCanvas,
  createDefaultDraftingLayers,
  DEFAULT_DRAFTING_SHAPE_LAYER,
  getDraftingMarqueeSelection,
  isProtectedDraftingLayerId,
  type DraftingCanvasLayer,
  type DraftingTextRun,
} from "@/features/workspace/model/layers"
import {
  ensureDraftingFontsForLayers,
} from "@/features/workspace/model/fonts"
import {
  layoutDraftingText,
} from "@/features/workspace/rendering/text-layout"
import {
  createDraftingQrArtworkState,
  sanitizeDraftingQrArtworkMarkup,
} from "@/features/workspace/rendering/qr-artwork"
import { DraftingLayerTiltShell } from "@/features/workspace/components/DraftingLayerTiltShell"
import {
  SceneCompositionTransform,
} from "@/features/workspace/components/SceneBackgroundLayer"
import { DraftingQrLayerContent } from "@/features/workspace/components/DraftingQrLayerContent"
import {
  LayerContextMenu,
  LayerFloatingToolbar,
  LayerSizeValue,
  ResizeFrameControls,
  SnapGuideOverlay,
} from "@/features/workspace/components/PaneLayerChrome"
import {
  CONTEXT_MENU_POINTER_OFFSET_PX,
  FLOATING_TOOLBAR_GAP_PX,
  FLOATING_TOOLBAR_HEIGHT_PX,
  RESIZE_CONTROL_PADDING_PX,
  RESIZE_SNAP_THRESHOLD_PX,
  ROTATE_HANDLE_OFFSET_PX,
  ROTATE_HANDLE_RADIUS_PX,
  ROTATE_LABEL_GAP_PX,
  SIZE_LABEL_GAP_PX,
  type DraftingLayerMenuAction,
} from "@/features/workspace/components/pane-layer-chrome.constants"
import {
  getDraftingCardBorderStyle,
  getDraftingLayerEffectStyle,
  getLayerControlShellStyle,
  getLayerPlacementStyle,
  getTextLayerStyle,
  getTextRunStyle,
} from "@/features/workspace/rendering/layer-dom-styles"
import { cssFillToBackgroundStyle } from "@/features/workspace/model/css-fill-style"
import {
  getBackgroundShapeTiltInnerStyle,
  getBackgroundShapeTiltPerspectiveStyle,
} from "@/features/workspace/rendering/layer-transform"
import {
  DraftingImageLayerContent,
  DraftingShapeLayerContent,
} from "@/features/workspace/rendering/shape-layer"
import { buildDashboardQrNodePayload } from "@/features/qr-code/rendering/qr-svg"
import type { QrStudioState } from "@/features/qr-code/model/state"
import { createDefaultSceneComposition, type SceneCompositionState } from "@/features/workspace/model/scene-templates"
import { cn } from "@/lib/utils"
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

export type { ResizeDirection } from "@/features/workspace/components/pane-layer-geometry"
export { resizeDraftingLayer } from "@/features/workspace/components/pane-layer-geometry"
export type { DraftingLayerMenuAction } from "@/features/workspace/components/pane-layer-chrome.constants"

function layerExportAttrs(kind: DraftingCanvasLayer["kind"]) {
  return {
    "data-export-kind": kind,
    "data-export-layer": "true",
  } as const
}

type PaneProps = {
  cardState?: DraftingCardState
  interactionScale?: number
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
  sceneComposition?: SceneCompositionState
  selectedLayerId?: string | null
  selectedLayerIds?: string[]
  snapEnabled?: boolean
  state: QrStudioState
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

const LAYER_MOVE_CURSOR_CLASS = "cursor-all-scroll"
const ROTATION_LABEL_HIDE_DELAY_MS = 2000
const SNAP_THRESHOLD_PX = 6
const INTERACTION_START_THRESHOLD_PX = 3

function getTextLayerRuns(layer: DraftingCanvasLayer): DraftingTextRun[] {
  const text = layer.text ?? ""
  const runs = layer.textRuns

  if (!runs?.length || runs.map((run) => run.text).join("") !== text) {
    return text ? [{ text }] : []
  }

  return runs
}

function hasValidTextRuns(layer: DraftingCanvasLayer) {
  return Boolean(layer.textRuns?.length) && layer.textRuns?.map((run) => run.text).join("") === (layer.text ?? "")
}

function renderTextLayerContent(layer: DraftingCanvasLayer) {
  if (hasValidTextRuns(layer)) {
    return getTextLayerRuns(layer).map((run, index) => (
      <span
        data-slot="drafting-text-run"
        key={getTextRunKey(layer.id, run, index)}
        style={getTextRunStyle(layer, run)}
      >
        {run.text}
      </span>
    ))
  }

  const layout = layoutDraftingText(layer)

  return layout.lines.map((line, index) => (
    <div
      data-slot="drafting-text-line"
      key={`${layer.id}:line:${index}`}
      style={{ minHeight: layout.lineHeight }}
    >
      {line || "\u00a0"}
      {line && index < layout.lines.length - 1 ? " " : null}
    </div>
  ))
}

function getTextRunKey(layerId: string, run: DraftingTextRun, index: number) {
  return `${layerId}:run:${index}:${run.text.length}`
}

export const Pane = memo(function Pane({
  cardState = DEFAULT_DRAFTING_CARD_STATE,
  interactionScale = 1,
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
  sceneComposition = createDefaultSceneComposition(),
  selectedLayerId,
  selectedLayerIds,
}: PaneProps) {
  const [markup, setMarkup] = useState<string | null>(null)
  const [hasError, setHasError] = useState(false)
  const [rotatingLayerId, setRotatingLayerId] = useState<string | null>(null)
  const [isLayerInteracting, setIsLayerInteracting] = useState(false)
  const [isMovingLayers, setIsMovingLayers] = useState(false)
  const [canvasHeight, setCanvasHeight] = useState(0)
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
  const textEditorRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})
  const marqueeRef = useRef<typeof marquee>(null)
  const suppressCanvasClickRef = useRef(false)
  const suppressLayerClickRef = useRef(false)
  const requestRef = useRef(0)
  const markupCacheRef = useRef(new Map<string, string>())
  const qrArtworkState = useMemo(() => createDraftingQrArtworkState(state), [state])
  const stateCacheKey = useMemo(() => JSON.stringify(qrArtworkState), [qrArtworkState])

  useEffect(() => {
    const requestId = ++requestRef.current
    const cachedMarkup = markupCacheRef.current.get(stateCacheKey)

    if (cachedMarkup) {
      setMarkup(cachedMarkup)
      setHasError(false)
      return
    }

    void buildDashboardQrNodePayload(qrArtworkState)
      .then((payload) => {
        if (requestRef.current !== requestId) return
        const nextMarkup = sanitizeDraftingQrArtworkMarkup(payload.markup)
        markupCacheRef.current.set(stateCacheKey, nextMarkup)
        setMarkup(nextMarkup)
        setHasError(false)
      })
      .catch(() => {
        if (requestRef.current !== requestId) return
        setMarkup(null)
        setHasError(true)
      })
  }, [qrArtworkState, stateCacheKey])

  useEffect(
    () => () => {
      if (rotationLabelTimeoutRef.current !== null) {
        window.clearTimeout(rotationLabelTimeoutRef.current)
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
      setCanvasHeight(canvas.getBoundingClientRect().height)
    }

    updateCanvasHeight()

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateCanvasHeight)
      return () => window.removeEventListener("resize", updateCanvasHeight)
    }

    const observer = new ResizeObserver(updateCanvasHeight)
    observer.observe(canvas)

    return () => observer.disconnect()
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
  const isLoading = markup === null && !hasError

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

  const visibleLayers = resolvedLayers
    .filter((layer) => layer.isVisible)
    .sort((a, b) => a.zIndex - b.zIndex)
  const activeSelectedLayerIds = selectedLayerIds ?? (selectedLayerId ? [selectedLayerId] : [])
  const activeSelectedLayerIdSet = new Set(activeSelectedLayerIds)
  const selectedVisibleLayers = visibleLayers.filter((layer) => activeSelectedLayerIdSet.has(layer.id))
  const selectedVisibleLayerIds = selectedVisibleLayers.map((layer) => layer.id)
  const contextMenuLayerIdSet = contextMenu ? new Set(contextMenu.layerIds) : null
  const contextMenuLayers = contextMenu
    ? resolvedLayers.filter((layer) => contextMenuLayerIdSet?.has(layer.id))
    : []
  const combinedLayerBounds = getCombinedLayerBounds(selectedVisibleLayers)
  const isPaperShaderMode = cardState.styleMode === "paper-shader"
  const isImageMode = cardState.styleMode === "image"
  const isImageFilterMode = cardState.styleMode === "image-filter"
  const cardPatternStyle = getDraftingCardPatternStyle(
    cardState.patternId,
    cardState.patternId === "none" ? undefined : cardState.patternColors[cardState.patternId],
  )
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
    ...cssFillToBackgroundStyle(cardState.fill),
    ...(isPaperShaderMode || isImageFilterMode || isImageMode ? undefined : cardPatternStyle),
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

    if (layer.isLocked || !onLayerChange) {
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
    const scale = interactionScale > 0 ? interactionScale : 1

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
    const scale = interactionScale > 0 ? interactionScale : 1
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
        for (const selectedLayer of interaction.layers) {
          if (selectedLayer.kind === "card") {
            continue
          }

          onLayerChange?.(
            selectedLayer.id,
            constrainLayerPatch(selectedLayer, {
              x: roundLayerNumber(selectedLayer.x + deltaX),
              y: roundLayerNumber(selectedLayer.y + deltaY),
            }),
          )
        }
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
        setSnapGuides({
          horizontal: [],
          vertical: snapEnabled && rotation !== freeRotation ? [0] : [],
        })

        for (const selectedLayer of interaction.layers) {
          if (selectedLayer.kind === "card") {
            continue
          }

          const center = {
            x: selectedLayer.x + selectedLayer.width / 2,
            y: selectedLayer.y + selectedLayer.height / 2,
          }
          const nextCenter = rotatePoint(center, interaction.groupCenter, rotation)
          onLayerChange?.(
            selectedLayer.id,
            constrainLayerPatch(selectedLayer, {
              rotation: normalizeLayerRotation(selectedLayer.rotation + rotation),
              x: roundLayerNumber(nextCenter.x - selectedLayer.width / 2),
              y: roundLayerNumber(nextCenter.y - selectedLayer.height / 2),
            }),
          )
        }
        return
      }

      if (interaction.mode === "resize") {
        const nextBounds = resizeDraftingLayer(
          {
            ...interaction.groupBounds,
            blur: 0,
            id: "selection",
            isLocked: false,
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

        for (const selectedLayer of interaction.layers) {
          if (selectedLayer.kind === "card") {
            continue
          }

          onLayerChange?.(
            selectedLayer.id,
            constrainLayerPatch(selectedLayer, {
              height: roundLayerNumber(selectedLayer.height * scaleY),
              width: roundLayerNumber(selectedLayer.width * scaleX),
              x: roundLayerNumber(nextBounds.x + (selectedLayer.x - interaction.groupBounds.x) * scaleX),
              y: roundLayerNumber(nextBounds.y + (selectedLayer.y - interaction.groupBounds.y) * scaleY),
            }),
          )
        }
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
      setSnapGuides({
        horizontal: [],
        vertical: snapEnabled && rotation !== freeRotation ? [0] : [],
      })
      onLayerChange?.(layer.id, { rotation })
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

      setSnapGuides(nextMove.guides)
      onLayerChange?.(
        layer.id,
        constrainLayerPatch(layer, {
          x: nextMove.x,
          y: nextMove.y,
        }),
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

    setSnapGuides(snappedResize.guides)
    onLayerChange?.(layer.id, constrainLayerPatch(layer, snappedResize.geometry))
  }

  function endLayerInteraction(event: PointerEvent<HTMLElement>) {
    const interaction = interactionRef.current

    if (interaction?.pointerId === event.pointerId) {
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
    if (layer.kind !== "text" || layer.isLocked) {
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

    const x = bounds.x + bounds.width / 2
    const rawY =
      bounds.y -
      RESIZE_CONTROL_PADDING_PX -
      ROTATE_HANDLE_OFFSET_PX -
      ROTATE_HANDLE_RADIUS_PX -
      FLOATING_TOOLBAR_GAP_PX -
      FLOATING_TOOLBAR_HEIGHT_PX
    const minY = canvasHeight > 0 ? -canvasHeight / 2 + FLOATING_TOOLBAR_GAP_PX : rawY
    const y = Math.max(rawY, minY)
    const layerToolbarStyle = {
      transform: `translate3d(${x}px, ${y}px, 0) translateX(-50%)`,
    }

    return (
      <LayerFloatingToolbar
        layers={selectedVisibleLayers}
        onAction={onLayerAction ? runSelectedLayerAction : undefined}
        onCopy={onLayerCopy ? runSelectedLayerCopy : undefined}
        onMore={(event) => openFloatingLayerContextMenu(event, selectedVisibleLayerIds)}
        style={layerToolbarStyle}
      />
    )
  }

  function renderMarquee() {
    if (!marquee) {
      return null
    }

    const bounds = getMarqueeBounds(marquee.start, marquee.end)

    return (
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-[9998] border border-[var(--ws-ink)] bg-[var(--ws-ink)]/10"
        data-slot="drafting-layer-marquee"
        style={{
          height: bounds.height,
          transform: `translate3d(${bounds.x}px, ${bounds.y}px, 0)`,
          width: bounds.width,
        }}
      />
    )
  }

  function renderLayerControls(layer: DraftingCanvasLayer) {
    if (activeSelectedLayerIds.length !== 1 || layer.isLocked || !activeSelectedLayerIdSet.has(layer.id)) {
      return null
    }

    if (layer.kind === "text" && editingTextLayerId === layer.id) {
      return null
    }

    const controlHeight = layer.height + RESIZE_CONTROL_PADDING_PX * 2
    const controlWidth = layer.width + RESIZE_CONTROL_PADDING_PX * 2
    const isRotating = rotatingLayerId === layer.id
    const rotationDegrees = rotationPreviewDegrees ?? getLayerRotationLabel(layer.rotation)

    return (
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 touch-none overflow-visible border border-[var(--ws-resize-frame)]"
        data-layer-id={layer.id}
        data-slot="drafting-layer-resize-frame"
        key={`${layer.id}:controls`}
        style={{
          height: controlHeight,
          width: controlWidth,
          zIndex: 10000,
          ...getLayerControlShellStyle(layer, RESIZE_CONTROL_PADDING_PX),
        }}
        onContextMenu={(event) => openLayerContextMenu(event, [layer.id])}
      >
        <DraftingLayerTiltShell className="relative" layer={layer}>
          <div
            className="pointer-events-none absolute left-1/2 top-0 w-px -translate-x-1/2 -translate-y-full bg-[var(--ws-resize-frame)]"
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
          <LayerSizeValue height={layer.height} width={layer.width} />
          <button
            aria-label={`Rotate ${layer.name}`}
            className="pointer-events-auto absolute left-1/2 top-0 z-30 size-3 rounded-full border border-[#a8b0bb] bg-white shadow-[var(--ws-shadow-rest)]"
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
          />
          <ResizeFrameControls
            onPointerCancel={endLayerInteraction}
            onPointerMove={updateLayerInteraction}
            onPointerUp={endLayerInteraction}
            onResizePointerDown={(event, direction) =>
              startLayerInteraction(event, layer, "resize", direction)
            }
            targetLabel={layer.name}
          />
        </DraftingLayerTiltShell>
      </div>
    )
  }

  function createMultiLayerControls() {
    const bounds = multiSelectionPreview?.bounds ?? combinedLayerBounds

    if (activeSelectedLayerIds.length < 2 || !bounds) {
      return null
    }

    const controlHeight = bounds.height + RESIZE_CONTROL_PADDING_PX * 2
    const controlWidth = bounds.width + RESIZE_CONTROL_PADDING_PX * 2
    const isRotating = rotatingLayerId === "selection"
    const rotationDegrees = multiSelectionPreview?.rotation ?? bounds.rotation ?? rotationPreviewDegrees ?? 0
    const rotationTransform = rotationDegrees ? ` rotate(${rotationDegrees}deg)` : ""

    return (
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 touch-none overflow-visible border border-[var(--ws-resize-frame)]"
        data-layer-ids={activeSelectedLayerIds.join(" ")}
        data-slot="drafting-layer-multi-select-frame"
        style={{
          height: controlHeight,
          transform: `translate3d(${bounds.x - RESIZE_CONTROL_PADDING_PX}px, ${bounds.y - RESIZE_CONTROL_PADDING_PX}px, 0)${rotationTransform}`,
          transformOrigin: "center center",
          width: controlWidth,
          zIndex: 50,
        }}
        onContextMenu={(event) => openLayerContextMenu(event, activeSelectedLayerIds)}
      >
        <div
          className="pointer-events-none absolute left-1/2 top-0 w-px -translate-x-1/2 -translate-y-full bg-[var(--ws-resize-frame)]"
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
        <LayerSizeValue height={bounds.height} width={bounds.width} />
        <button
          aria-label="Rotate selection"
          className="pointer-events-auto absolute left-1/2 top-0 z-30 size-3 rounded-full border border-[#a8b0bb] bg-white shadow-[var(--ws-shadow-rest)]"
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
        />
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

  function renderLayer(layer: DraftingCanvasLayer) {
    const isLayerSelected = activeSelectedLayerIdSet.has(layer.id)

    if (layer.kind === "group") {
      return (
        <div
          key={layer.id}
          data-slot="drafting-layer-group"
          data-layer-id={layer.id}
          data-selected={isLayerSelected ? "true" : "false"}
          {...layerExportAttrs("group")}
          className={cn(
            "absolute max-h-none max-w-none touch-none",
            LAYER_MOVE_CURSOR_CLASS,
            layer.isLocked && "cursor-default",
          )}
          style={{
            ...getLayerPlacementStyle(layer),
            ...getDraftingLayerEffectStyle(layer),
          }}
          onClick={(event) => selectLayerFromClick(event, layer)}
          onPointerDown={(event) => startLayerInteraction(event, layer, "move")}
          onPointerMove={updateLayerInteraction}
          onPointerUp={endLayerInteraction}
          onPointerCancel={endLayerInteraction}
          onContextMenu={(event) => openLayerContextMenu(event, [layer.id])}
        >
          <DraftingLayerTiltShell layer={layer}>
            {(layer.children ?? [])
              .filter((child) => child.isVisible)
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((child) => renderNestedLayer(child))}
          </DraftingLayerTiltShell>
        </div>
      )
    }

    if (layer.kind === "qr") {
      const shapeTiltPerspectiveStyle = getBackgroundShapeTiltPerspectiveStyle(state.backgroundShapeOptions)
      const shapeTiltInnerStyle = getBackgroundShapeTiltInnerStyle(state.backgroundShapeOptions)

      return (
        <div
          key={layer.id}
          data-slot="desktop-compose-node"
          data-layer-id={layer.id}
          data-node-id={state.data}
          data-selected={isLayerSelected ? "true" : "false"}
          {...layerExportAttrs("qr")}
          className={cn(
            "absolute max-h-none max-w-none touch-none",
            LAYER_MOVE_CURSOR_CLASS,
            layer.isLocked && "cursor-default",
          )}
          style={{
            ...getLayerPlacementStyle(layer),
            ...getDraftingLayerEffectStyle(layer),
          }}
          onClick={(event) => selectLayerFromClick(event, layer, { qr: true })}
          onPointerDown={(event) => startLayerInteraction(event, layer, "move")}
          onPointerMove={updateLayerInteraction}
          onPointerUp={endLayerInteraction}
          onPointerCancel={endLayerInteraction}
          onContextMenu={(event) => openLayerContextMenu(event, [layer.id])}
        >
          <DraftingLayerTiltShell layer={layer}>
            <DraftingQrLayerContent
              canvasSvgMarkup={markup}
              layer={layer}
              qrMarkup={markup ?? ""}
              shapeTiltInnerStyle={shapeTiltInnerStyle}
              shapeTiltPerspectiveStyle={shapeTiltPerspectiveStyle}
              state={state}
            />
          </DraftingLayerTiltShell>
        </div>
      )
    }

    if (layer.kind === "text") {
      const isEditing = editingTextLayerId === layer.id

      return (
        <div
          key={layer.id}
          data-slot="drafting-text-layer"
          data-layer-id={layer.id}
          data-selected={isLayerSelected ? "true" : "false"}
          {...layerExportAttrs("text")}
          className={cn(
            "absolute max-h-none max-w-none touch-none overflow-hidden",
            isEditing ? "cursor-text" : LAYER_MOVE_CURSOR_CLASS,
            layer.isLocked && !isEditing && "cursor-default",
          )}
          style={{
            ...getLayerPlacementStyle(layer),
            ...getDraftingLayerEffectStyle(layer),
          }}
          onClick={(event) => selectLayerFromClick(event, layer)}
          onDoubleClick={(event) => startTextEditing(event, layer)}
          onPointerDown={(event) => startLayerInteraction(event, layer, "move")}
          onPointerMove={updateLayerInteraction}
          onPointerUp={endLayerInteraction}
          onPointerCancel={endLayerInteraction}
          onContextMenu={(event) => openLayerContextMenu(event, [layer.id])}
        >
          <DraftingLayerTiltShell layer={layer}>
            {isEditing ? (
              <textarea
                aria-label="Edit text layer"
                className="h-full w-full resize-none cursor-text overflow-hidden border-0 bg-transparent p-0 outline-none"
                data-slot="drafting-text-editor"
                ref={(element) => {
                  textEditorRefs.current[layer.id] = element
                }}
                spellCheck={false}
                style={getTextLayerStyle(layer)}
                value={editingTextDraft}
                onBlur={commitEditingTextDraft}
                onClick={(event) => event.stopPropagation()}
                onDoubleClick={(event) => event.stopPropagation()}
                onInput={handleTextEditorInput}
                onKeyDown={(event) => {
                  event.stopPropagation()
                  if (event.key === "Escape") {
                    event.preventDefault()
                    commitEditingTextDraft()
                  }
                }}
                onPointerDown={(event) => event.stopPropagation()}
              />
            ) : (
              <div className="h-full w-full" data-slot="drafting-text-content" style={getTextLayerStyle(layer)}>
                {renderTextLayerContent(layer)}
              </div>
            )}
          </DraftingLayerTiltShell>
        </div>
      )
    }

    if (layer.kind === "image") {
      return (
        <div
          key={layer.id}
          data-slot="drafting-image-layer"
          data-layer-id={layer.id}
          data-selected={isLayerSelected ? "true" : "false"}
          {...layerExportAttrs("image")}
          className={cn(
            "absolute max-h-none max-w-none touch-none overflow-hidden",
          LAYER_MOVE_CURSOR_CLASS,
            layer.isLocked && "cursor-default",
          )}
          style={{
            ...getLayerPlacementStyle(layer),
            borderRadius: cornerRadiiToCss(resolveLayerCornerRadii(layer, 0)),
            ...getDraftingLayerEffectStyle(layer),
          }}
          onClick={(event) => selectLayerFromClick(event, layer)}
          onPointerDown={(event) => startLayerInteraction(event, layer, "move")}
          onPointerMove={updateLayerInteraction}
          onPointerUp={endLayerInteraction}
          onPointerCancel={endLayerInteraction}
          onContextMenu={(event) => openLayerContextMenu(event, [layer.id])}
        >
          <DraftingLayerTiltShell layer={layer}>
            <DraftingImageLayerContent layer={layer} />
          </DraftingLayerTiltShell>
        </div>
      )
    }

    if (layer.kind === "shape") {
      return (
        <div
          key={layer.id}
          data-shape-id={layer.shapeId ?? DEFAULT_DRAFTING_SHAPE_LAYER.shapeId}
          data-slot="drafting-shape-layer"
          data-layer-id={layer.id}
          data-selected={isLayerSelected ? "true" : "false"}
          {...layerExportAttrs("shape")}
          className={cn(
            "absolute max-h-none max-w-none touch-none overflow-visible",
          LAYER_MOVE_CURSOR_CLASS,
            layer.isLocked && "cursor-default",
          )}
          style={{
            ...getLayerPlacementStyle(layer),
            ...getDraftingLayerEffectStyle(layer),
          }}
          onClick={(event) => selectLayerFromClick(event, layer)}
          onPointerDown={(event) => startLayerInteraction(event, layer, "move")}
          onPointerMove={updateLayerInteraction}
          onPointerUp={endLayerInteraction}
          onPointerCancel={endLayerInteraction}
          onContextMenu={(event) => openLayerContextMenu(event, [layer.id])}
        >
          <DraftingLayerTiltShell layer={layer}>
            <DraftingShapeLayerContent layer={layer} />
          </DraftingLayerTiltShell>
        </div>
      )
    }

    if (layer.kind === "shader") {
      const paperShader = layer.paperShader ?? createDefaultDraftingCardPaperShader()

      return (
        <div
          key={layer.id}
          data-slot="drafting-shader-layer"
          data-layer-id={layer.id}
          data-paper-shader-id={paperShader.shaderId}
          data-selected={isLayerSelected ? "true" : "false"}
          {...layerExportAttrs("shader")}
          className={cn(
            "absolute max-h-none max-w-none touch-none overflow-hidden",
            LAYER_MOVE_CURSOR_CLASS,
            layer.isLocked && "cursor-default",
          )}
          style={{
            ...getLayerPlacementStyle(layer),
            borderRadius: cornerRadiiToCss(resolveLayerCornerRadii(layer, 0)),
            ...getDraftingLayerEffectStyle(layer),
          }}
          onClick={(event) => selectLayerFromClick(event, layer)}
          onPointerDown={(event) => startLayerInteraction(event, layer, "move")}
          onPointerMove={updateLayerInteraction}
          onPointerUp={endLayerInteraction}
          onPointerCancel={endLayerInteraction}
          onContextMenu={(event) => openLayerContextMenu(event, [layer.id])}
        >
          <DraftingLayerTiltShell layer={layer}>
            <DraftingCardPaperShaderLayer
              layoutHeight={layer.height}
              layoutWidth={layer.width}
              paperShader={paperShader}
            />
          </DraftingLayerTiltShell>
        </div>
      )
    }

    return (
      <div
        key={layer.id}
        data-slot="desktop-compose-card"
        data-layer-id={layer.id}
        data-card-pattern={isPaperShaderMode || isImageFilterMode || isImageMode ? "none" : cardState.patternId}
        data-card-paper-shader={
          isPaperShaderMode
            ? cardState.paperShader.shaderId
            : isImageFilterMode
              ? cardState.imageFilter.shaderId
              : "none"
        }
        data-card-shadow-blur={layer.shadow.blur}
        data-card-shadow-offset-x={layer.shadow.offsetX}
        data-card-shadow-offset-y={layer.shadow.offsetY}
        data-card-style-mode={cardState.styleMode}
        data-card-enabled={layer.isVisible ? "true" : "false"}
        data-card-border-width={cardState.border.width}
        data-selected={isLayerSelected ? "true" : "false"}
        {...layerExportAttrs("card")}
        className={cn(
          "absolute max-h-none max-w-none transition-[filter,background-color,border-radius] duration-150",
          "pointer-events-none overflow-hidden",
        )}
        style={{
          ...cardStyle,
          ...getLayerPlacementStyle(layer),
          ...getDraftingLayerEffectStyle(layer),
        }}
      >
        <DraftingLayerTiltShell layer={layer}>
          {isImageMode && cardState.cardImage.value ? (
            <div
              aria-hidden="true"
              data-slot="desktop-compose-card-image"
              className="pointer-events-none absolute inset-0 z-0"
              style={{
                ...cardImageStyle,
                borderRadius: "inherit",
                opacity: cardState.cardImage.opacity / 100,
              }}
            />
          ) : null}
          {isPaperShaderMode ? (
            <DraftingCardPaperShaderLayer
              layoutHeight={layer.height}
              layoutWidth={layer.width}
              paperShader={cardState.paperShader}
            />
          ) : null}
          {isImageFilterMode ? (
            <DraftingCardPaperShaderLayer
              layoutHeight={layer.height}
              layoutWidth={layer.width}
              paperShader={imageFilterShader}
            />
          ) : null}
        </DraftingLayerTiltShell>
      </div>
    )
  }

  function renderNestedLayer(layer: DraftingCanvasLayer) {
    const isLayerSelected = activeSelectedLayerIdSet.has(layer.id)

    if (layer.kind === "group") {
      return (
        <div
          key={layer.id}
          data-slot="drafting-layer-group"
          data-layer-id={layer.id}
          data-selected={isLayerSelected ? "true" : "false"}
          {...layerExportAttrs("group")}
          className="absolute max-h-none max-w-none"
          style={{
            ...getLayerPlacementStyle(layer, true),
            ...getDraftingLayerEffectStyle(layer),
          }}
        >
          {(layer.children ?? [])
            .filter((child) => child.isVisible)
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((child) => renderNestedLayer(child))}
        </div>
      )
    }

    if (layer.kind === "qr") {
      const shapeTiltPerspectiveStyle = getBackgroundShapeTiltPerspectiveStyle(state.backgroundShapeOptions)
      const shapeTiltInnerStyle = getBackgroundShapeTiltInnerStyle(state.backgroundShapeOptions)

      return (
        <div
          key={layer.id}
          data-slot="desktop-compose-node"
          data-layer-id={layer.id}
          data-selected={isLayerSelected ? "true" : "false"}
          {...layerExportAttrs("qr")}
          className="absolute max-h-none max-w-none"
          style={{
            ...getLayerPlacementStyle(layer, true),
            ...getDraftingLayerEffectStyle(layer),
          }}
        >
          <DraftingQrLayerContent
            canvasSvgMarkup={markup}
            layer={layer}
            qrMarkup={markup ?? ""}
            shapeTiltInnerStyle={shapeTiltInnerStyle}
            shapeTiltPerspectiveStyle={shapeTiltPerspectiveStyle}
            state={state}
          />
        </div>
      )
    }

    if (layer.kind === "text") {
      return (
        <div
          key={layer.id}
          data-slot="drafting-text-layer"
          data-layer-id={layer.id}
          data-selected={isLayerSelected ? "true" : "false"}
          {...layerExportAttrs("text")}
          className="absolute max-h-none max-w-none overflow-hidden"
          style={{
            ...getLayerPlacementStyle(layer, true),
            ...getDraftingLayerEffectStyle(layer),
          }}
        >
          <div className="h-full w-full" data-slot="drafting-text-content" style={getTextLayerStyle(layer)}>
            {renderTextLayerContent(layer)}
          </div>
        </div>
      )
    }

    if (layer.kind === "image") {
      return (
        <div
          key={layer.id}
          data-slot="drafting-image-layer"
          data-layer-id={layer.id}
          data-selected={isLayerSelected ? "true" : "false"}
          {...layerExportAttrs("image")}
          className="absolute max-h-none max-w-none overflow-hidden"
          style={{
            ...getLayerPlacementStyle(layer, true),
            ...getDraftingLayerEffectStyle(layer),
          }}
        >
          <DraftingImageLayerContent layer={layer} />
        </div>
      )
    }

    if (layer.kind === "shape") {
      return (
        <div
          key={layer.id}
          data-shape-id={layer.shapeId ?? DEFAULT_DRAFTING_SHAPE_LAYER.shapeId}
          data-slot="drafting-shape-layer"
          data-layer-id={layer.id}
          data-selected={isLayerSelected ? "true" : "false"}
          {...layerExportAttrs("shape")}
          className="absolute max-h-none max-w-none overflow-visible"
          style={{
            ...getLayerPlacementStyle(layer, true),
            ...getDraftingLayerEffectStyle(layer),
          }}
        >
          <DraftingShapeLayerContent layer={layer} />
        </div>
      )
    }

    if (layer.kind === "shader") {
      const paperShader = layer.paperShader ?? createDefaultDraftingCardPaperShader()

      return (
        <div
          key={layer.id}
          data-slot="drafting-shader-layer"
          data-layer-id={layer.id}
          data-paper-shader-id={paperShader.shaderId}
          data-selected={isLayerSelected ? "true" : "false"}
          {...layerExportAttrs("shader")}
          className="absolute max-h-none max-w-none overflow-hidden"
          style={{
            ...getLayerPlacementStyle(layer, true),
            borderRadius: cornerRadiiToCss(resolveLayerCornerRadii(layer, 0)),
            ...getDraftingLayerEffectStyle(layer),
          }}
        >
          <DraftingCardPaperShaderLayer
            layoutHeight={layer.height}
            layoutWidth={layer.width}
            paperShader={paperShader}
          />
        </div>
      )
    }

    return (
      <div
        key={layer.id}
        data-slot="desktop-compose-card"
        data-layer-id={layer.id}
        data-selected={isLayerSelected ? "true" : "false"}
        {...layerExportAttrs("card")}
        className="absolute max-h-none max-w-none overflow-visible"
        style={{
          ...cardStyle,
          ...getLayerPlacementStyle(layer, true),
          ...getDraftingLayerEffectStyle(layer),
        }}
      >
        {isPaperShaderMode ? (
          <DraftingCardPaperShaderLayer
            layoutHeight={layer.height}
            layoutWidth={layer.width}
            paperShader={cardState.paperShader}
          />
        ) : null}
      </div>
    )
  }

  return (
    <div
      data-slot="qr-pane"
      data-selected={isSelected ? "true" : "false"}
      className="relative flex h-full w-full flex-col items-center justify-center overflow-visible"
      onClick={(e) => {
        // Only select if clicking the pane background, not the QR itself
        if (e.target === e.currentTarget) {
          onSelect()
        }
      }}
    >
      <div
        ref={canvasRef}
        data-slot="desktop-compose-canvas"
        data-compose-mode="compose"
        className="relative h-full w-full overflow-visible"
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
        {isLoading ? (
          <div className="grid h-full place-items-center text-sm font-medium text-[var(--ws-ink-muted)]">
            Loading QR…
          </div>
        ) : markup ? (
          <>
            <div
              className="absolute left-1/2 top-1/2 overflow-hidden"
              data-slot="desktop-compose-artboard"
              style={{
                borderRadius: cornerRadiiToCss(cardState.cornerRadii),
                height: cardState.height,
                transform: "translate(-50%, -50%)",
                width: cardState.width,
              }}
            >
              <SceneCompositionTransform layout={sceneComposition.layout}>
                <div className="relative h-full w-full" data-export-root>
                  {visibleLayers.map(renderLayer)}
                </div>
              </SceneCompositionTransform>
              <SnapGuideOverlay guides={snapGuides} />
              {renderMarquee()}
              {activeSelectedLayerIds.length > 0
                ? visibleLayers.map((layer) => renderLayerControls(layer))
                : null}
              {createMultiLayerControls()}
              {renderFloatingToolbar()}
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
        ) : (
          <div className="grid h-full place-items-center text-sm font-medium text-[var(--ws-ink-muted)]">
            Could not generate QR
          </div>
        )}
      </div>
    </div>
  )
},
(previousProps, nextProps) =>
  previousProps.cardState === nextProps.cardState &&
  previousProps.sceneComposition === nextProps.sceneComposition &&
  previousProps.state === nextProps.state &&
  previousProps.isSelected === nextProps.isSelected &&
  previousProps.interactionScale === nextProps.interactionScale &&
  previousProps.layers === nextProps.layers &&
  previousProps.onLayerAction === nextProps.onLayerAction &&
  previousProps.selectedLayerId === nextProps.selectedLayerId &&
  previousProps.selectedLayerIds === nextProps.selectedLayerIds &&
  previousProps.snapEnabled === nextProps.snapEnabled,
)

function hasTranslucentCardFill(fill: string) {
  const rgbaMatch = /^rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)$/i.exec(fill)
  if (rgbaMatch) {
    return Number(rgbaMatch[1]) < 0.98
  }

  return fill.includes("rgba(") && !fill.includes(", 1)") && !fill.includes(",1)")
}
