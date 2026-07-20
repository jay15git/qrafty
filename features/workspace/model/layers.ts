import type {
  DraftingCardShadowState,
  DraftingCardState,
} from "@/features/workspace/model/card-state"
import {
  createDefaultDraftingShadowLayer,
  DEFAULT_DRAFTING_OUTLINE,
  type DraftingBorderStyle,
  type DraftingOutlineState,
  type DraftingPerSideBorderState,
  type DraftingShadowLayerState,
  hasLegacyBackgroundShapeShadow,
  legacyShadowToShadowLayer,
  normalizeBorderStyle,
  normalizeOutlineState,
  normalizePerSideBorderState,
  normalizeShadowLayerState,
  shadowFromBackgroundShapeOptions,
  shadowLayerToLegacyShadow,
} from "@/features/workspace/model/effects"
import {
  createDefaultDraftingFilterEffect,
  getBlurAmountFromFilters,
  normalizeFilterEffects,
  syncBlurFilter,
  syncLegacyBlurFromFilters,
  type DraftingFilterEffect,
} from "@/features/workspace/model/filters"
import {
  DEFAULT_DRAFTING_FONT_ID,
  getDraftingFontByFamily,
  getDraftingFontById,
  resolveDraftingFont,
} from "@/features/workspace/model/fonts"
import { getQrRenderedDimensions } from "@/features/qr-code/rendering/svg-extension"
import type { QrBackgroundShapeId } from "@/features/qr-code/styles/background-shapes"
import {
  clampBackgroundShapeTilt,
  clampQrSize,
  type QrStudioState,
  type StudioGradient,
} from "@/features/qr-code/model/state"
import {
  cloneDraftingCardPaperShaderState,
  createDefaultDraftingCardPaperShader,
  normalizeDraftingCardShadow,
  type DraftingCardPaperShaderState,
} from "@/features/workspace/model/card-state"
import type { PaperShaderId } from "@/features/workspace/rendering/paper-shaders"

export type DraftingCanvasLayerKind = "card" | "group" | "image" | "qr" | "shader" | "shape" | "text"
export type DraftingImageSourceMode = "none" | "upload" | "url"
export type DraftingImageFit = "contain" | "cover"
export type DraftingShapeFillMode = "gradient" | "image" | "none" | "solid"
export type DraftingShapePrimitiveId = "arrow" | "ellipse" | "line" | "rect"
export type DraftingElementShapeId =
  | DraftingShapePrimitiveId
  | Exclude<QrBackgroundShapeId, "none">
export type DraftingTextAlign = "center" | "left" | "right"
export type DraftingTextFontStyle = "italic" | "normal"
export type DraftingTextFontWeight = "bold" | "normal" | number
export type DraftingTextRun = {
  fill?: string
  fontFamily?: string
  fontId?: string
  fontSize?: number
  fontStyle?: DraftingTextFontStyle
  fontWeight?: DraftingTextFontWeight
  text: string
  underline?: boolean
}

export type DraftingCanvasLayer = {
  blur: number
  borderSides?: DraftingPerSideBorderState
  height: number
  id: string
  isLocked: boolean
  isVisible: boolean
  kind: DraftingCanvasLayerKind
  cornerRadius?: number
  fill?: string
  fillGradient?: StudioGradient
  fillMode?: DraftingShapeFillMode
  fontFamily?: string
  fontId?: string
  fontSize?: number
  fontStyle?: DraftingTextFontStyle
  fontWeight?: DraftingTextFontWeight
  imageFit?: DraftingImageFit
  imageSource?: DraftingImageSourceMode
  imageValue?: string
  layerFilters: DraftingFilterEffect[]
  letterSpacing?: number
  lineHeight?: number
  name: string
  nodeId: string
  opacity: number
  outline: DraftingOutlineState
  paperShader?: DraftingCardPaperShaderState
  rotation: number
  scaleX?: number
  scaleY?: number
  shapeId?: DraftingElementShapeId
  stroke?: string
  strokeOpacity?: number
  strokeStyle?: DraftingBorderStyle
  strokeWidth?: number
  tiltX: number
  tiltY: number
  shadow: DraftingCardShadowState
  shadows: DraftingShadowLayerState[]
  text?: string
  textAlign?: DraftingTextAlign
  textRuns?: DraftingTextRun[]
  underline?: boolean
  width: number
  x: number
  y: number
  zIndex: number
  children?: DraftingCanvasLayer[]
}

export type DraftingLayerStateByNodeId = Record<string, DraftingCanvasLayer[]>
export type DraftingLayerReorderAction = "back" | "backward" | "forward" | "front"
export type DraftingLayerAlignAction =
  | "bottom"
  | "center-x"
  | "center-y"
  | "left"
  | "right"
  | "top"
export type DraftingLayerDistributeAction = "horizontal" | "vertical"

const DRAFTING_CARD_LAYER_SUFFIX = ":card"
const DRAFTING_QR_LAYER_SUFFIX = ":qr"

const DEFAULT_LAYER_SHADOW: DraftingCardShadowState = {
  blur: 0,
  color: "#111827",
  inset: false,
  kind: "drop",
  offsetX: 0,
  offsetY: 0,
  opacity: 0,
  spread: 0,
  visible: false,
}
export const DEFAULT_DRAFTING_TEXT_LAYER = {
  fill: "#171717",
  fontFamily: "Satoshi",
  fontId: DEFAULT_DRAFTING_FONT_ID,
  fontSize: 32,
  fontStyle: "normal",
  fontWeight: "normal",
  letterSpacing: 0,
  lineHeight: 1.22,
  text: "Add text",
  textAlign: "left",
  underline: false,
} as const

export const DEFAULT_DRAFTING_IMAGE_LAYER = {
  cornerRadius: 0,
  imageFit: "cover",
  imageSource: "none",
  imageValue: "",
} as const satisfies Partial<DraftingCanvasLayer>

export const DEFAULT_DRAFTING_SHAPE_LAYER = {
  cornerRadius: 16,
  fill: "#E8E8E8",
  fillMode: "solid",
  shapeId: "rounded-square",
  stroke: "#171717",
  strokeOpacity: 100,
  strokeStyle: "solid",
  strokeWidth: 0,
} as const satisfies Partial<DraftingCanvasLayer>

export const DEFAULT_DRAFTING_SHADER_LAYER = {
  cornerRadius: 0,
} as const satisfies Partial<DraftingCanvasLayer>

export function getDraftingCardLayerId(nodeId: string) {
  return `${nodeId}${DRAFTING_CARD_LAYER_SUFFIX}`
}

export function getDraftingQrLayerId(nodeId: string) {
  return `${nodeId}${DRAFTING_QR_LAYER_SUFFIX}`
}

export function isDraftingCardLayerId(layerId: string | null | undefined) {
  return Boolean(layerId?.endsWith(DRAFTING_CARD_LAYER_SUFFIX))
}

export function isDraftingQrLayerId(layerId: string | null | undefined) {
  return Boolean(layerId?.endsWith(DRAFTING_QR_LAYER_SUFFIX))
}

export function fitQrSizeInCard(
  qrState: QrStudioState,
  cardState: Pick<DraftingCardState, "bottomSpace" | "height" | "padding" | "sizeMode" | "width">,
) {
  const qrDimensions = getQrRenderedDimensions(qrState)

  if (cardState.sizeMode !== "fixed") {
    return {
      height: qrDimensions.height,
      width: qrDimensions.width,
    }
  }

  const availableWidth = Math.max(24, cardState.width - cardState.padding * 2)
  const availableHeight = Math.max(
    24,
    cardState.height - cardState.padding * 2 - cardState.bottomSpace,
  )
  const fittedSize = clampQrSize(Math.min(availableWidth, availableHeight, qrDimensions.width))

  return {
    height: fittedSize,
    width: fittedSize,
  }
}

export function getDraftingCardInsetLayout(
  qrState: QrStudioState,
  cardState: Pick<
    DraftingCardState,
    "bottomSpace" | "height" | "padding" | "sizeMode" | "width"
  >,
) {
  const qrDimensions = fitQrSizeInCard(qrState, cardState)

  if (cardState.sizeMode === "fixed") {
    const cardWidth = cardState.width
    const cardHeight = cardState.height
    const cardX = -cardWidth / 2
    const cardY = -cardHeight / 2

    return {
      card: {
        height: cardHeight,
        width: cardWidth,
        x: cardX,
        y: cardY,
      },
      qr: {
        height: qrDimensions.height,
        width: qrDimensions.width,
        x: -qrDimensions.width / 2,
        y: cardY + cardState.padding,
      },
    }
  }

  const cardWidth = qrDimensions.width + cardState.padding * 2
  const cardHeight = qrDimensions.height + cardState.padding * 2 + cardState.bottomSpace
  const cardX = -cardWidth / 2
  const cardY = -cardHeight / 2

  return {
    card: {
      height: cardHeight,
      width: cardWidth,
      x: cardX,
      y: cardY,
    },
    qr: {
      height: qrDimensions.height,
      width: qrDimensions.width,
      x: -qrDimensions.width / 2,
      y: cardY + cardState.padding,
    },
  }
}

export function layoutDraftingCardInsetLayers(
  layers: DraftingCanvasLayer[],
  qrState: QrStudioState,
  cardState: Pick<
    DraftingCardState,
    "bottomSpace" | "height" | "padding" | "sizeMode" | "width"
  >,
): DraftingCanvasLayer[] {
  const layout = getDraftingCardInsetLayout(qrState, cardState)

  return layers.map((layer) => {
    if (layer.kind === "card") {
      return patchDraftingCanvasLayer(layer, layout.card)
    }

    if (layer.kind === "qr") {
      return patchDraftingCanvasLayer(layer, layout.qr)
    }

    return layer
  })
}

export function createDefaultDraftingLayers(
  nodeId: string,
  qrState: QrStudioState,
  cardState: DraftingCardState,
): DraftingCanvasLayer[] {
  const qrDimensions = fitQrSizeInCard(qrState, cardState)
  const layout = getDraftingCardInsetLayout(qrState, cardState)

  return [
    {
      blur: 0,
      height: layout.card.height,
      id: getDraftingCardLayerId(nodeId),
      isLocked: false,
      isVisible: cardState.enabled,
      kind: "card",
      layerFilters: [],
      name: "Card",
      nodeId,
      opacity: 1,
      outline: { ...DEFAULT_DRAFTING_OUTLINE },
      rotation: 0,
      tiltX: 0,
      tiltY: 0,
      shadow: normalizeDraftingCardShadow(cardState.shadow),
      shadows: [legacyShadowToShadowLayer(normalizeDraftingCardShadow(cardState.shadow))],
      width: layout.card.width,
      x: layout.card.x,
      y: layout.card.y,
      zIndex: 0,
    },
    {
      blur: 0,
      height: qrDimensions.height,
      id: getDraftingQrLayerId(nodeId),
      isLocked: false,
      isVisible: true,
      kind: "qr",
      layerFilters: [],
      name: "QR code",
      nodeId,
      opacity: 1,
      outline: { ...DEFAULT_DRAFTING_OUTLINE },
      rotation: 0,
      tiltX: 0,
      tiltY: 0,
      shadow: { ...DEFAULT_LAYER_SHADOW },
      shadows: [legacyShadowToShadowLayer(DEFAULT_LAYER_SHADOW)],
      width: qrDimensions.width,
      x: layout.qr.x,
      y: layout.qr.y,
      zIndex: 1,
    },
  ]
}

export function createDraftingTextLayer(
  nodeId: string,
  options: Partial<DraftingCanvasLayer> = {},
): DraftingCanvasLayer {
  const layer = createFallbackLayer(nodeId, "text")
  const fontOptions =
    typeof options.fontFamily === "string" && !("fontId" in options)
      ? { fontId: undefined }
      : null

  return patchDraftingCanvasLayer(
    {
      ...layer,
      ...options,
      ...fontOptions,
      kind: "text",
    },
    {},
  )
}

export function createDraftingImageLayer(
  nodeId: string,
  options: Partial<DraftingCanvasLayer> = {},
): DraftingCanvasLayer {
  return patchDraftingCanvasLayer(
    {
      ...createFallbackLayer(nodeId, "image"),
      ...options,
      kind: "image",
    },
    {},
  )
}

export function createDraftingShaderLayer(
  nodeId: string,
  shaderId: PaperShaderId = "mesh-gradient",
  options: Partial<DraftingCanvasLayer> = {},
): DraftingCanvasLayer {
  return patchDraftingCanvasLayer(
    {
      ...createFallbackLayer(nodeId, "shader"),
      ...options,
      kind: "shader",
      paperShader: createDefaultDraftingCardPaperShader(shaderId),
    },
    {},
  )
}

export function createDraftingShapeLayer(
  nodeId: string,
  shapeId: DraftingElementShapeId = DEFAULT_DRAFTING_SHAPE_LAYER.shapeId,
  options: Partial<DraftingCanvasLayer> = {},
): DraftingCanvasLayer {
  const resolvedShapeId =
    typeof shapeId === "string"
      ? normalizeElementShapeId(shapeId, DEFAULT_DRAFTING_SHAPE_LAYER.shapeId)
      : DEFAULT_DRAFTING_SHAPE_LAYER.shapeId
  const isStrokePrimitive =
    resolvedShapeId === "line" || resolvedShapeId === "arrow"

  return patchDraftingCanvasLayer(
    {
      ...createFallbackLayer(nodeId, "shape"),
      ...options,
      kind: "shape",
      shapeId: resolvedShapeId,
      ...(isStrokePrimitive
        ? {
            fillMode: options.fillMode ?? "none",
            stroke: options.stroke ?? options.fill ?? DEFAULT_DRAFTING_SHAPE_LAYER.fill,
            strokeWidth: options.strokeWidth ?? 4,
          }
        : null),
    },
    {},
  )
}

export function cloneDraftingCanvasLayer(layer: DraftingCanvasLayer): DraftingCanvasLayer {
  return {
    ...layer,
    borderSides: layer.borderSides
      ? {
          bottom: { ...layer.borderSides.bottom },
          left: { ...layer.borderSides.left },
          right: { ...layer.borderSides.right },
          top: { ...layer.borderSides.top },
        }
      : undefined,
    children: layer.children?.map(cloneDraftingCanvasLayer),
    layerFilters: (layer.layerFilters ?? []).map((filter) => ({ ...filter })),
    outline: { ...(layer.outline ?? DEFAULT_DRAFTING_OUTLINE) },
    shadow: { ...(layer.shadow ?? DEFAULT_LAYER_SHADOW) },
    shadows: (layer.shadows ?? [legacyShadowToShadowLayer(layer.shadow ?? DEFAULT_LAYER_SHADOW)]).map(
      (shadow) => ({ ...shadow }),
    ),
    textRuns: layer.textRuns?.map((run) => ({ ...run })),
    paperShader: layer.paperShader
      ? cloneDraftingCardPaperShaderState(layer.paperShader)
      : undefined,
  }
}

export function cloneDraftingLayerStateByNodeId(
  layersByNodeId: DraftingLayerStateByNodeId,
): DraftingLayerStateByNodeId {
  return Object.fromEntries(
    Object.entries(layersByNodeId).map(([nodeId, layers]) => [
      nodeId,
      layers.map(cloneDraftingCanvasLayer),
    ]),
  )
}

export function normalizeDraftingCanvasLayers(
  nodeId: string,
  value: unknown,
  qrState: QrStudioState,
  cardState: DraftingCardState,
): DraftingCanvasLayer[] {
  const fallback = createDefaultDraftingLayers(nodeId, qrState, cardState)

  if (!Array.isArray(value)) {
    return fallback
  }

  const normalized = value
    .map((layer) => normalizeDraftingCanvasLayer(nodeId, layer, fallback))
    .filter((layer): layer is DraftingCanvasLayer => Boolean(layer))

  const hasCard = normalized.some((layer) => layer.kind === "card")
  const hasQr = normalized.some((layer) => layer.kind === "qr")

  return [
    ...(hasCard ? [] : [fallback[0]!]),
    ...normalized,
    ...(hasQr ? [] : [fallback[1]!]),
  ]
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((layer) => migrateLegacyQrLayerShadow(layer, qrState))
}

export function patchDraftingCanvasLayer(
  layer: DraftingCanvasLayer,
  patch: Partial<DraftingCanvasLayer>,
): DraftingCanvasLayer {
  const merged = { ...layer, ...patch }

  if (patch.shadow && !patch.shadows) {
    merged.shadows = [
      legacyShadowToShadowLayer(
        {
          ...layer.shadow,
          ...patch.shadow,
        },
        layer.shadows[0]?.id,
      ),
      ...layer.shadows.slice(1),
    ]
  }

  if (patch.shadows) {
    merged.shadow = normalizeDraftingLayerShadow(
      shadowLayerToLegacyShadow(patch.shadows[0] ?? layer.shadows[0] ?? legacyShadowToShadowLayer(layer.shadow)),
      layer.shadow,
    )
  }

  if (patch.blur !== undefined && patch.layerFilters === undefined) {
    merged.layerFilters = syncBlurFilter(layer.layerFilters, patch.blur)
  }

  if (patch.layerFilters) {
    merged.blur = syncLegacyBlurFromFilters(patch.layerFilters)
  }

  return normalizeDraftingCanvasLayer(layer.nodeId, merged, [layer]) ?? layer
}

export function reorderDraftingCanvasLayer(
  layers: DraftingCanvasLayer[],
  layerId: string,
  action: DraftingLayerReorderAction,
) {
  const ordered = [...layers].sort((a, b) => a.zIndex - b.zIndex)
  const currentIndex = ordered.findIndex((layer) => layer.id === layerId)

  if (currentIndex === -1) {
    return layers.map(cloneDraftingCanvasLayer)
  }

  const [layer] = ordered.splice(currentIndex, 1)
  const nextIndex =
    action === "back"
      ? 0
      : action === "backward"
        ? Math.max(0, currentIndex - 1)
        : action === "forward"
          ? Math.min(ordered.length, currentIndex + 1)
          : ordered.length

  ordered.splice(nextIndex, 0, layer!)
  return normalizeLayerZIndexes(ordered)
}

export function alignDraftingCanvasLayers(
  layers: DraftingCanvasLayer[],
  selectedLayerIds: string[],
  action: DraftingLayerAlignAction,
) {
  const selectedIdSet = new Set(selectedLayerIds)
  const selectedLayers = layers.filter((layer) => selectedIdSet.has(layer.id))
  const bounds = getLayerBounds(selectedLayers)

  if (!bounds) {
    return layers.map(cloneDraftingCanvasLayer)
  }

  return layers.map((layer) => {
    if (!selectedIdSet.has(layer.id)) {
      return cloneDraftingCanvasLayer(layer)
    }

    const patch =
      action === "left"
        ? { x: bounds.left }
        : action === "center-x"
          ? { x: bounds.centerX - layer.width / 2 }
          : action === "right"
            ? { x: bounds.right - layer.width }
            : action === "top"
              ? { y: bounds.top }
              : action === "center-y"
                ? { y: bounds.centerY - layer.height / 2 }
                : { y: bounds.bottom - layer.height }

    return patchDraftingCanvasLayer(layer, roundLayerPatch(patch))
  })
}

export function distributeDraftingCanvasLayers(
  layers: DraftingCanvasLayer[],
  selectedLayerIds: string[],
  action: DraftingLayerDistributeAction,
) {
  const selectedIdSet = new Set(selectedLayerIds)
  const selectedLayers = selectedLayerIds
    .map((id) => layers.find((layer) => layer.id === id))
    .filter((layer): layer is DraftingCanvasLayer => Boolean(layer))
  const bounds = getLayerBounds(selectedLayers)

  if (!bounds || selectedLayers.length < 3) {
    return layers.map(cloneDraftingCanvasLayer)
  }

  const step =
    action === "horizontal"
      ? (bounds.right - bounds.left) / (selectedLayers.length - 1)
      : (bounds.bottom - bounds.top) / (selectedLayers.length - 1)
  const patchById = new Map<string, Partial<DraftingCanvasLayer>>()

  selectedLayers.forEach((layer, index) => {
    patchById.set(
      layer.id,
      action === "horizontal"
        ? { x: bounds.left + step * index }
        : { y: bounds.top + step * index },
    )
  })

  return layers.map((layer) =>
    selectedIdSet.has(layer.id)
      ? patchDraftingCanvasLayer(layer, roundLayerPatch(patchById.get(layer.id) ?? {}))
      : cloneDraftingCanvasLayer(layer),
  )
}

export function cloneDraftingCanvasLayersForPaste({
  layers,
  nodeId,
  offset,
  startingZIndex,
}: {
  layers: DraftingCanvasLayer[]
  nodeId: string
  offset: { x: number; y: number }
  startingZIndex: number
}) {
  return layers.map((layer, index) =>
    remapDraftingCanvasLayerForPaste(layer, {
      nodeId,
      offset,
      zIndex: startingZIndex + index,
    }),
  )
}

export function groupDraftingCanvasLayers(
  layers: DraftingCanvasLayer[],
  selectedLayerIds: string[],
  options: { groupId: string; name: string },
) {
  const selectedIdSet = new Set(selectedLayerIds)
  const selectedLayers = layers.filter((layer) => selectedIdSet.has(layer.id))
  const bounds = getLayerBounds(selectedLayers)

  if (!bounds || selectedLayers.length < 2) {
    return layers.map(cloneDraftingCanvasLayer)
  }

  const lowestZIndex = Math.min(...selectedLayers.map((layer) => layer.zIndex))
  const groupLayer = patchDraftingCanvasLayer(
    {
      blur: 0,
      children: selectedLayers
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((layer, index) =>
          patchDraftingCanvasLayer(cloneDraftingCanvasLayer(layer), {
            x: layer.x - bounds.left,
            y: layer.y - bounds.top,
            zIndex: index,
          }),
        ),
      height: bounds.bottom - bounds.top,
      id: options.groupId,
      isLocked: false,
      isVisible: true,
      kind: "group",
      layerFilters: [],
      name: options.name,
      nodeId: selectedLayers[0]?.nodeId ?? layers[0]?.nodeId ?? "preview",
      opacity: 1,
      outline: { ...DEFAULT_DRAFTING_OUTLINE },
      rotation: 0,
      tiltX: 0,
      tiltY: 0,
      shadow: { ...DEFAULT_LAYER_SHADOW },
      shadows: [legacyShadowToShadowLayer(DEFAULT_LAYER_SHADOW)],
      width: bounds.right - bounds.left,
      x: bounds.left,
      y: bounds.top,
      zIndex: lowestZIndex,
    },
    {},
  )

  return normalizeLayerZIndexes([
    ...layers.filter((layer) => !selectedIdSet.has(layer.id)).map(cloneDraftingCanvasLayer),
    groupLayer,
  ].sort((a, b) => a.zIndex - b.zIndex))
}

export function ungroupDraftingCanvasLayer(
  layers: DraftingCanvasLayer[],
  groupLayerId: string,
) {
  const groupLayer = layers.find((layer) => layer.id === groupLayerId && layer.kind === "group")

  if (!groupLayer?.children?.length) {
    return layers.map(cloneDraftingCanvasLayer)
  }

  const restoredChildren = groupLayer.children.map((child) =>
    patchDraftingCanvasLayer(cloneDraftingCanvasLayer(child), {
      nodeId: groupLayer.nodeId,
      x: groupLayer.x + child.x,
      y: groupLayer.y + child.y,
      zIndex: groupLayer.zIndex + child.zIndex,
    }),
  )

  return normalizeLayerZIndexes([
    ...layers.filter((layer) => layer.id !== groupLayerId).map(cloneDraftingCanvasLayer),
    ...restoredChildren,
  ].sort((a, b) => a.zIndex - b.zIndex))
}

export function getDraftingMarqueeSelection(
  layers: DraftingCanvasLayer[],
  marquee: Pick<DraftingCanvasLayer, "height" | "width" | "x" | "y">,
) {
  const marqueeBounds = {
    bottom: marquee.y + marquee.height,
    left: marquee.x,
    right: marquee.x + marquee.width,
    top: marquee.y,
  }

  return layers
    .filter((layer) => layer.isVisible && !layer.isLocked)
    .filter((layer) =>
      rectanglesIntersect(marqueeBounds, {
        bottom: layer.y + layer.height,
        left: layer.x,
        right: layer.x + layer.width,
        top: layer.y,
      }),
    )
    .map((layer) => layer.id)
}

function normalizeLayerZIndexes(layers: DraftingCanvasLayer[]) {
  return layers.map((layer, index) => patchDraftingCanvasLayer(layer, { zIndex: index }))
}

function getLayerBounds(layers: DraftingCanvasLayer[]) {
  if (layers.length === 0) {
    return null
  }

  const left = Math.min(...layers.map((layer) => layer.x))
  const top = Math.min(...layers.map((layer) => layer.y))
  const right = Math.max(...layers.map((layer) => layer.x + layer.width))
  const bottom = Math.max(...layers.map((layer) => layer.y + layer.height))

  return {
    bottom,
    centerX: left + (right - left) / 2,
    centerY: top + (bottom - top) / 2,
    left,
    right,
    top,
  }
}

function roundLayerPatch(patch: Partial<DraftingCanvasLayer>) {
  return Object.fromEntries(
    Object.entries(patch).map(([key, value]) => [
      key,
      typeof value === "number" ? Math.round(value * 100) / 100 : value,
    ]),
  ) as Partial<DraftingCanvasLayer>
}

function normalizeDraftingCanvasLayer(
  nodeId: string,
  value: unknown,
  fallbackLayers: DraftingCanvasLayer[],
): DraftingCanvasLayer | null {
  if (!isRecord(value)) {
    return null
  }

  const kind = getDraftingCanvasLayerKind(value.kind)

  if (!kind) {
    return null
  }

  const fallback = getDraftingLayerFallback(nodeId, kind, fallbackLayers)
  const width = readFiniteNumber(value.width, fallback.width)
  const height = readFiniteNumber(value.height, fallback.height)

  const context = {
    fallback,
    fallbackLayers,
    height,
    kind,
    nodeId,
    value,
    width,
  }

  if (kind === "qr") {
    return normalizeQrDraftingCanvasLayer({ ...context, kind })
  }

  if (kind === "text") {
    return normalizeTextDraftingCanvasLayer({ ...context, kind })
  }

  if (kind === "image") {
    return normalizeImageDraftingCanvasLayer({ ...context, kind })
  }

  if (kind === "shape") {
    return normalizeShapeDraftingCanvasLayer({ ...context, kind })
  }

  if (kind === "group") {
    return normalizeGroupDraftingCanvasLayer({ ...context, kind })
  }

  if (kind === "shader") {
    return normalizeShaderDraftingCanvasLayer({ ...context, kind })
  }

  return normalizeNonTextDraftingCanvasLayer({ ...context, kind })
}

type NormalizeDraftingLayerContext = {
  fallback: DraftingCanvasLayer
  fallbackLayers: DraftingCanvasLayer[]
  height: number
  kind: DraftingCanvasLayerKind
  nodeId: string
  value: Record<string, unknown>
  width: number
}

function getDraftingCanvasLayerKind(value: unknown): DraftingCanvasLayerKind | null {
  return value === "card" ||
    value === "group" ||
    value === "image" ||
    value === "qr" ||
    value === "shape" ||
    value === "shader" ||
    value === "text"
    ? value
    : null
}

function getDraftingLayerFallback(
  nodeId: string,
  kind: DraftingCanvasLayerKind,
  fallbackLayers: DraftingCanvasLayer[],
) {
  return fallbackLayers.find((layer) => layer.kind === kind) ?? createFallbackLayer(nodeId, kind)
}

function normalizeSharedDraftingCanvasLayerFields({
  fallback,
  height,
  nodeId,
  value,
  width,
}: NormalizeDraftingLayerContext): Omit<DraftingCanvasLayer, "kind"> {
  const legacyBlur = clamp(readFiniteNumber(value.blur, fallback.blur), 0, 96)
  const layerFilters = normalizeDraftingLayerFilters(
    value.layerFilters,
    fallback.layerFilters ?? [],
    legacyBlur,
  )
  const shadow = normalizeDraftingLayerShadow(value.shadow, fallback.shadow)
  const shadows = normalizeDraftingLayerShadows(
    value.shadows,
    shadow,
    fallback.shadows ?? [legacyShadowToShadowLayer(shadow)],
  )

  return {
    blur: syncLegacyBlurFromFilters(layerFilters),
    borderSides: normalizeDraftingLayerBorderSides(value.borderSides, fallback.borderSides),
    children: undefined,
    height: Math.max(1, height),
    id: typeof value.id === "string" ? value.id : fallback.id,
    isLocked:
      typeof value.isLocked === "boolean" ? value.isLocked : fallback.isLocked,
    isVisible:
      typeof value.isVisible === "boolean" ? value.isVisible : fallback.isVisible,
    fill: undefined,
    fontFamily: undefined,
    fontId: undefined,
    fontSize: undefined,
    fontStyle: undefined,
    fontWeight: undefined,
    layerFilters,
    letterSpacing: undefined,
    lineHeight: undefined,
    name: typeof value.name === "string" && value.name.trim() ? value.name : fallback.name,
    nodeId,
    opacity: clamp(readFiniteNumber(value.opacity, fallback.opacity), 0, 1),
    outline: normalizeOutlineState(value.outline, fallback.outline ?? DEFAULT_DRAFTING_OUTLINE),
    rotation: readFiniteNumber(value.rotation, fallback.rotation),
    scaleX: normalizeFlipScale(value.scaleX, fallback.scaleX ?? 1),
    scaleY: normalizeFlipScale(value.scaleY, fallback.scaleY ?? 1),
    shadow,
    shadows,
    text: undefined,
    textAlign: undefined,
    textRuns: undefined,
    tiltX: clampBackgroundShapeTilt(readFiniteNumber(value.tiltX, fallback.tiltX)),
    tiltY: clampBackgroundShapeTilt(readFiniteNumber(value.tiltY, fallback.tiltY)),
    underline: undefined,
    width: Math.max(1, width),
    x: readFiniteNumber(value.x, fallback.x),
    y: readFiniteNumber(value.y, fallback.y),
    zIndex: readFiniteNumber(value.zIndex, fallback.zIndex),
  }
}

function normalizeNonTextDraftingCanvasLayer(
  context: NormalizeDraftingLayerContext & { kind: "card" },
): DraftingCanvasLayer {
  return {
    ...normalizeSharedDraftingCanvasLayerFields(context),
    kind: context.kind,
  } satisfies DraftingCanvasLayer
}

function normalizeQrDraftingCanvasLayer(
  context: NormalizeDraftingLayerContext & { kind: "qr" },
): DraftingCanvasLayer {
  const width = Math.max(1, context.width)

  return {
    ...normalizeSharedDraftingCanvasLayerFields(context),
    height: width,
    kind: "qr",
    width,
  } satisfies DraftingCanvasLayer
}

function normalizeGroupDraftingCanvasLayer(
  context: NormalizeDraftingLayerContext & { kind: "group" },
): DraftingCanvasLayer {
  return {
    ...normalizeSharedDraftingCanvasLayerFields(context),
    children: normalizeDraftingGroupChildren(context),
    kind: "group",
  } satisfies DraftingCanvasLayer
}

function normalizeDraftingGroupChildren({
  fallbackLayers,
  nodeId,
  value,
}: NormalizeDraftingLayerContext) {
  if (!Array.isArray(value.children)) {
    return undefined
  }

  return value.children
    .map((child): DraftingCanvasLayer | null =>
      normalizeDraftingCanvasLayer(nodeId, child, fallbackLayers),
    )
    .filter((child): child is DraftingCanvasLayer => Boolean(child))
}

function normalizeImageDraftingCanvasLayer(
  context: NormalizeDraftingLayerContext & { kind: "image" },
): DraftingCanvasLayer {
  const { fallback, value } = context

  return {
    ...normalizeSharedDraftingCanvasLayerFields(context),
    borderSides: normalizeDraftingLayerBorderSides(value.borderSides, fallback.borderSides),
    cornerRadius: clamp(
      readFiniteNumber(value.cornerRadius, fallback.cornerRadius ?? DEFAULT_DRAFTING_IMAGE_LAYER.cornerRadius),
      0,
      512,
    ),
    imageFit:
      value.imageFit === "contain" || value.imageFit === "cover"
        ? value.imageFit
        : (fallback.imageFit ?? DEFAULT_DRAFTING_IMAGE_LAYER.imageFit),
    imageSource: normalizeImageSourceMode(value.imageSource, fallback.imageSource),
    imageValue:
      typeof value.imageValue === "string"
        ? value.imageValue
        : (fallback.imageValue ?? DEFAULT_DRAFTING_IMAGE_LAYER.imageValue),
    kind: "image",
  } satisfies DraftingCanvasLayer
}

function normalizeShaderDraftingCanvasLayer(
  context: NormalizeDraftingLayerContext & { kind: "shader" },
): DraftingCanvasLayer {
  const { fallback, value } = context
  const fallbackPaperShader =
    fallback.paperShader ?? createDefaultDraftingCardPaperShader()

  return {
    ...normalizeSharedDraftingCanvasLayerFields(context),
    borderSides: normalizeDraftingLayerBorderSides(value.borderSides, fallback.borderSides),
    cornerRadius: clamp(
      readFiniteNumber(
        value.cornerRadius,
        fallback.cornerRadius ?? DEFAULT_DRAFTING_SHADER_LAYER.cornerRadius,
      ),
      0,
      512,
    ),
    kind: "shader",
    paperShader: normalizeLayerPaperShader(value.paperShader, fallbackPaperShader),
  } satisfies DraftingCanvasLayer
}

function normalizeLayerPaperShader(
  value: unknown,
  fallback: DraftingCardPaperShaderState,
): DraftingCardPaperShaderState {
  if (!isRecord(value)) {
    return cloneDraftingCardPaperShaderState(fallback)
  }

  const shaderId =
    typeof value.shaderId === "string" ? (value.shaderId as PaperShaderId) : fallback.shaderId
  const nextFallback =
    shaderId === fallback.shaderId
      ? fallback
      : createDefaultDraftingCardPaperShader(shaderId)

  return {
    frame: readFiniteNumber(value.frame, nextFallback.frame),
    image: isRecord(value.image)
      ? {
          source:
            value.image.source === "none" ||
            value.image.source === "sample" ||
            value.image.source === "upload" ||
            value.image.source === "url"
              ? value.image.source
              : nextFallback.image.source,
          value:
            typeof value.image.value === "string"
              ? value.image.value
              : nextFallback.image.value,
        }
      : { ...nextFallback.image },
    params: isRecord(value.params)
      ? structuredClone(value.params as DraftingCardPaperShaderState["params"])
      : structuredClone(nextFallback.params),
    paused: typeof value.paused === "boolean" ? value.paused : nextFallback.paused,
    presetName:
      typeof value.presetName === "string" ? value.presetName : nextFallback.presetName,
    shaderId,
    speed: readFiniteNumber(value.speed, nextFallback.speed),
  }
}

function normalizeShapeDraftingCanvasLayer(
  context: NormalizeDraftingLayerContext & { kind: "shape" },
): DraftingCanvasLayer {
  const { fallback, value } = context

  return {
    ...normalizeSharedDraftingCanvasLayerFields(context),
    borderSides: normalizeDraftingLayerBorderSides(value.borderSides, fallback.borderSides),
    cornerRadius: clamp(
      readFiniteNumber(value.cornerRadius, fallback.cornerRadius ?? DEFAULT_DRAFTING_SHAPE_LAYER.cornerRadius),
      0,
      512,
    ),
    fill: normalizeHexColor(value.fill, fallback.fill ?? DEFAULT_DRAFTING_SHAPE_LAYER.fill),
    fillGradient: normalizeShapeFillGradient(value.fillGradient, fallback.fillGradient),
    fillMode: normalizeShapeFillMode(value.fillMode, fallback.fillMode),
    imageFit:
      value.imageFit === "contain" || value.imageFit === "cover"
        ? value.imageFit
        : fallback.imageFit,
    imageSource: normalizeImageSourceMode(value.imageSource, fallback.imageSource),
    imageValue: typeof value.imageValue === "string" ? value.imageValue : fallback.imageValue,
    kind: "shape",
    shapeId: normalizeElementShapeId(value.shapeId, fallback.shapeId),
    stroke: normalizeHexColor(value.stroke, fallback.stroke ?? DEFAULT_DRAFTING_SHAPE_LAYER.stroke),
    strokeOpacity: clamp(
      readFiniteNumber(value.strokeOpacity, fallback.strokeOpacity ?? DEFAULT_DRAFTING_SHAPE_LAYER.strokeOpacity),
      0,
      100,
    ),
    strokeStyle: normalizeBorderStyle(
      value.strokeStyle,
      fallback.strokeStyle ?? DEFAULT_DRAFTING_SHAPE_LAYER.strokeStyle,
    ),
    strokeWidth: clamp(
      readFiniteNumber(value.strokeWidth, fallback.strokeWidth ?? DEFAULT_DRAFTING_SHAPE_LAYER.strokeWidth),
      0,
      64,
    ),
  } satisfies DraftingCanvasLayer
}

function normalizeTextDraftingCanvasLayer(
  context: NormalizeDraftingLayerContext & { kind: "text" },
): DraftingCanvasLayer {
  const { fallback, value } = context
  const text =
    typeof value.text === "string"
      ? value.text
      : (fallback.text ?? DEFAULT_DRAFTING_TEXT_LAYER.text)

  return {
    ...normalizeSharedDraftingCanvasLayerFields(context),
    fill: normalizeHexColor(value.fill, fallback.fill ?? DEFAULT_DRAFTING_TEXT_LAYER.fill),
    fontFamily: normalizeTextFontFamily(value, fallback),
    fontId: normalizeTextFontId(value, fallback),
    fontSize: clamp(
      readFiniteNumber(value.fontSize, fallback.fontSize ?? DEFAULT_DRAFTING_TEXT_LAYER.fontSize),
      6,
      300,
    ),
    fontStyle: value.fontStyle === "italic" ? "italic" : "normal",
    fontWeight: normalizeTextFontWeight(value.fontWeight, fallback.fontWeight),
    kind: "text",
    letterSpacing: clamp(
      readFiniteNumber(
        value.letterSpacing,
        fallback.letterSpacing ?? DEFAULT_DRAFTING_TEXT_LAYER.letterSpacing,
      ),
      -50,
      200,
    ),
    lineHeight: clamp(
      readFiniteNumber(value.lineHeight, fallback.lineHeight ?? DEFAULT_DRAFTING_TEXT_LAYER.lineHeight),
      0.6,
      4,
    ),
    text,
    textAlign: normalizeTextAlign(value.textAlign, fallback.textAlign),
    textRuns: normalizeTextRuns(value.textRuns, fallback.textRuns, text),
    underline:
      typeof value.underline === "boolean"
        ? value.underline
        : (fallback.underline ?? DEFAULT_DRAFTING_TEXT_LAYER.underline),
  } satisfies DraftingCanvasLayer
}

function normalizeDraftingLayerShadow(
  value: unknown,
  fallback: DraftingCardShadowState,
): DraftingCardShadowState {
  if (!isRecord(value)) {
    return normalizeDraftingCardShadow(fallback)
  }

  return normalizeDraftingCardShadow({
    ...fallback,
    blur: readFiniteNumber(value.blur, fallback.blur),
    color: typeof value.color === "string" ? value.color : fallback.color,
    inset: typeof value.inset === "boolean" ? value.inset : fallback.inset,
    kind: "drop",
    offsetX: readFiniteNumber(value.offsetX, fallback.offsetX),
    offsetY: readFiniteNumber(value.offsetY, fallback.offsetY),
    opacity: readFiniteNumber(value.opacity, fallback.opacity),
    spread: readFiniteNumber(value.spread, fallback.spread),
    visible: typeof value.visible === "boolean" ? value.visible : fallback.visible,
  })
}

function normalizeDraftingLayerShadows(
  value: unknown,
  primaryShadow: DraftingCardShadowState,
  fallback: DraftingShadowLayerState[],
): DraftingShadowLayerState[] {
  if (!Array.isArray(value) || value.length === 0) {
    if (fallback.length > 0) {
      return fallback.map((shadow) => ({ ...shadow }))
    }

    return [legacyShadowToShadowLayer(primaryShadow)]
  }

  return value
    .map((entry, index) =>
      normalizeShadowLayerState(
        entry,
        fallback[index] ?? legacyShadowToShadowLayer(primaryShadow),
      ),
    )
    .filter((shadow) => shadow.visible !== false || shadow.opacity > 0)
}

function normalizeDraftingLayerFilters(
  value: unknown,
  fallback: DraftingFilterEffect[],
  legacyBlur: number,
): DraftingFilterEffect[] {
  const normalized = normalizeFilterEffects(value, fallback)

  if (Array.isArray(value)) {
    return syncBlurFilter(normalized, getBlurAmountFromFilters(normalized))
  }

  if (normalized.length > 0) {
    return normalized
  }

  return legacyBlur > 0 ? syncBlurFilter([], legacyBlur) : []
}

function normalizeDraftingLayerBorderSides(
  value: unknown,
  fallback: DraftingPerSideBorderState | undefined,
): DraftingPerSideBorderState | undefined {
  if (value === undefined && fallback === undefined) {
    return undefined
  }

  return normalizePerSideBorderState(value, fallback?.top)
}

function migrateLegacyQrLayerShadow(
  layer: DraftingCanvasLayer,
  qrState: QrStudioState,
): DraftingCanvasLayer {
  if (layer.kind !== "qr") {
    return layer
  }

  const hasLayerShadow =
    layer.shadow.opacity > 0 &&
    (layer.shadow.blur > 0 || layer.shadow.offsetX !== 0 || layer.shadow.offsetY !== 0)

  if (hasLayerShadow || !hasLegacyBackgroundShapeShadow(qrState.backgroundShapeOptions)) {
    return layer
  }

  return patchDraftingCanvasLayer(layer, {
    shadow: shadowFromBackgroundShapeOptions(qrState.backgroundShapeOptions),
  })
}

function createFallbackLayer(
  nodeId: string,
  kind: DraftingCanvasLayerKind,
): DraftingCanvasLayer {
  const defaultShadow = { ...DEFAULT_LAYER_SHADOW }
  const defaultShadowLayer = legacyShadowToShadowLayer(defaultShadow)

  return {
    blur: 0,
    borderSides: undefined,
    cornerRadius:
      kind === "image"
        ? DEFAULT_DRAFTING_IMAGE_LAYER.cornerRadius
        : kind === "shape"
          ? DEFAULT_DRAFTING_SHAPE_LAYER.cornerRadius
          : kind === "shader"
            ? DEFAULT_DRAFTING_SHADER_LAYER.cornerRadius
            : undefined,
    fill: kind === "shape" ? DEFAULT_DRAFTING_SHAPE_LAYER.fill : kind === "text" ? DEFAULT_DRAFTING_TEXT_LAYER.fill : undefined,
    fillMode: kind === "shape" ? DEFAULT_DRAFTING_SHAPE_LAYER.fillMode : undefined,
    height: kind === "text" ? 48 : kind === "image" || kind === "shape" || kind === "shader" ? 180 : 240,
    id:
      kind === "card"
        ? getDraftingCardLayerId(nodeId)
        : kind === "qr"
          ? getDraftingQrLayerId(nodeId)
          : kind === "text" || kind === "image" || kind === "shape" || kind === "shader"
            ? createDraftingLayerInstanceId(nodeId, kind)
            : `${nodeId}:group`,
    isLocked: false,
    isVisible: true,
    kind,
    fontFamily: kind === "text" ? DEFAULT_DRAFTING_TEXT_LAYER.fontFamily : undefined,
    fontId: kind === "text" ? DEFAULT_DRAFTING_TEXT_LAYER.fontId : undefined,
    fontSize: kind === "text" ? DEFAULT_DRAFTING_TEXT_LAYER.fontSize : undefined,
    fontStyle: kind === "text" ? DEFAULT_DRAFTING_TEXT_LAYER.fontStyle : undefined,
    fontWeight: kind === "text" ? DEFAULT_DRAFTING_TEXT_LAYER.fontWeight : undefined,
    layerFilters: [],
    letterSpacing: kind === "text" ? DEFAULT_DRAFTING_TEXT_LAYER.letterSpacing : undefined,
    lineHeight: kind === "text" ? DEFAULT_DRAFTING_TEXT_LAYER.lineHeight : undefined,
    name:
      kind === "card"
        ? "Card"
        : kind === "qr"
          ? "QR code"
          : kind === "text"
            ? "Text"
            : kind === "image"
              ? "Image"
              : kind === "shape"
                ? "Shape"
                : kind === "shader"
                  ? "Shader"
                  : "Group",
    nodeId,
    opacity: 1,
    outline: { ...DEFAULT_DRAFTING_OUTLINE },
    rotation: 0,
    tiltX: 0,
    tiltY: 0,
    shadow: defaultShadow,
    shadows: [defaultShadowLayer],
    imageFit: kind === "image" ? DEFAULT_DRAFTING_IMAGE_LAYER.imageFit : undefined,
    imageSource: kind === "image" ? DEFAULT_DRAFTING_IMAGE_LAYER.imageSource : undefined,
    imageValue: kind === "image" ? DEFAULT_DRAFTING_IMAGE_LAYER.imageValue : undefined,
    paperShader: kind === "shader" ? createDefaultDraftingCardPaperShader() : undefined,
    shapeId: kind === "shape" ? DEFAULT_DRAFTING_SHAPE_LAYER.shapeId : undefined,
    stroke: kind === "shape" ? DEFAULT_DRAFTING_SHAPE_LAYER.stroke : undefined,
    strokeOpacity: kind === "shape" ? DEFAULT_DRAFTING_SHAPE_LAYER.strokeOpacity : undefined,
    strokeStyle: kind === "shape" ? DEFAULT_DRAFTING_SHAPE_LAYER.strokeStyle : undefined,
    strokeWidth: kind === "shape" ? DEFAULT_DRAFTING_SHAPE_LAYER.strokeWidth : undefined,
    text: kind === "text" ? DEFAULT_DRAFTING_TEXT_LAYER.text : undefined,
    textAlign: kind === "text" ? DEFAULT_DRAFTING_TEXT_LAYER.textAlign : undefined,
    underline: kind === "text" ? DEFAULT_DRAFTING_TEXT_LAYER.underline : undefined,
    width: kind === "image" || kind === "shape" || kind === "shader" ? 180 : 240,
    x: kind === "image" || kind === "shape" || kind === "shader" ? -90 : -120,
    y: kind === "text" ? -24 : kind === "image" || kind === "shape" || kind === "shader" ? -90 : -120,
    zIndex: kind === "card" ? 0 : 1,
  }
}

function remapDraftingCanvasLayerForPaste(
  layer: DraftingCanvasLayer,
  options: {
    nodeId: string
    offset: { x: number; y: number }
    zIndex: number
  },
): DraftingCanvasLayer {
  const nextId = createDraftingLayerInstanceId(options.nodeId, layer.kind)

  return patchDraftingCanvasLayer(
    {
      ...cloneDraftingCanvasLayer(layer),
      children: layer.children?.map((child, index) =>
        remapDraftingCanvasLayerForPaste(child, {
          nodeId: options.nodeId,
          offset: { x: 0, y: 0 },
          zIndex: index,
        }),
      ),
      id: nextId,
      nodeId: options.nodeId,
      x: layer.x + options.offset.x,
      y: layer.y + options.offset.y,
      zIndex: options.zIndex,
    },
    {},
  )
}

function createDraftingLayerInstanceId(nodeId: string, kind: DraftingCanvasLayerKind) {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)

  return `${nodeId}:${kind}:${randomId}`
}

function rectanglesIntersect(
  a: { bottom: number; left: number; right: number; top: number },
  b: { bottom: number; left: number; right: number; top: number },
) {
  return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top
}

function readFiniteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function normalizeHexColor(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback
}

function normalizeFlipScale(value: unknown, fallback: number) {
  const raw = typeof value === "number" && Number.isFinite(value) ? value : fallback
  return raw < 0 ? -1 : 1
}

function normalizeImageSourceMode(
  value: unknown,
  fallback: DraftingImageSourceMode | undefined,
): DraftingImageSourceMode {
  if (value === "none" || value === "upload" || value === "url") {
    return value
  }

  return fallback ?? DEFAULT_DRAFTING_IMAGE_LAYER.imageSource
}

function normalizeShapeFillMode(
  value: unknown,
  fallback: DraftingShapeFillMode | undefined,
): DraftingShapeFillMode {
  if (value === "gradient" || value === "image" || value === "none" || value === "solid") {
    return value
  }

  return fallback ?? DEFAULT_DRAFTING_SHAPE_LAYER.fillMode
}

const DRAFTING_SHAPE_PRIMITIVE_IDS = new Set<DraftingShapePrimitiveId>([
  "arrow",
  "ellipse",
  "line",
  "rect",
])

const DRAFTING_ELEMENT_SHAPE_IDS = new Set<DraftingElementShapeId>([
  "arrow",
  "arch",
  "atom",
  "circle",
  "diagonal-pill",
  "eight-point-star",
  "ellipse",
  "flower",
  "folded-pentagon",
  "four-lobes",
  "gear-bloom",
  "heart",
  "burst-star",
  "blob",
  "dome",
  "pentagon",
  "plus",
  "sun-scallop",
  "sparkle",
  "rosette",
  "cross-burst",
  "diamond",
  "octagon-star",
  "seal-badge",
  "hexagon-flat",
  "octagon-flat",
  "quarter-circle",
  "tag",
  "soft-star",
  "teardrop",
  "squircle-octagon",
  "clover-cross",
  "ghost",
  "hexagon",
  "hourglass",
  "line",
  "notched-badge",
  "organic-seal",
  "ornate-star",
  "propeller",
  "rect",
  "rounded-square",
  "scallop-seal",
  "skew-card",
  "soft-cross",
  "spark",
  "wavy-badge",
])

function normalizeElementShapeId(
  value: unknown,
  fallback: DraftingElementShapeId | undefined,
): DraftingElementShapeId {
  if (typeof value === "string" && DRAFTING_ELEMENT_SHAPE_IDS.has(value as DraftingElementShapeId)) {
    return value as DraftingElementShapeId
  }

  return fallback ?? DEFAULT_DRAFTING_SHAPE_LAYER.shapeId
}

function normalizeShapeFillGradient(
  value: unknown,
  fallback: StudioGradient | undefined,
): StudioGradient | undefined {
  if (!isRecord(value)) {
    return fallback
  }

  const colorStops = Array.isArray(value.colorStops) ? value.colorStops : null
  if (!colorStops || colorStops.length < 2) {
    return fallback
  }

  const firstStop = colorStops[0]
  const secondStop = colorStops[1]

  if (!isRecord(firstStop) || !isRecord(secondStop)) {
    return fallback
  }

  return {
    colorStops: [
      {
        color: typeof firstStop.color === "string" ? firstStop.color : "#111111",
        offset: clamp(readFiniteNumber(firstStop.offset, 0), 0, 1),
      },
      {
        color: typeof secondStop.color === "string" ? secondStop.color : "#ffffff",
        offset: clamp(readFiniteNumber(secondStop.offset, 1), 0, 1),
      },
    ],
    enabled: typeof value.enabled === "boolean" ? value.enabled : true,
    rotation: readFiniteNumber(value.rotation, 0),
    type: value.type === "radial" ? "radial" : "linear",
  }
}

function normalizeTextAlign(value: unknown, fallback: unknown): DraftingTextAlign {
  if (value === "center" || value === "left" || value === "right") {
    return value
  }

  return fallback === "center" || fallback === "left" || fallback === "right"
    ? fallback
    : DEFAULT_DRAFTING_TEXT_LAYER.textAlign
}

function normalizeTextFontFamily(
  value: Record<string, unknown>,
  fallback: DraftingCanvasLayer,
) {
  if (typeof value.fontFamily === "string" && value.fontFamily.trim()) {
    return typeof value.fontId === "string"
      ? resolveDraftingFont({ fontFamily: value.fontFamily, fontId: value.fontId }).family
      : value.fontFamily.trim().slice(0, 80)
  }

  if (typeof fallback.fontFamily === "string" && fallback.fontFamily.trim()) {
    return typeof fallback.fontId === "string"
      ? resolveDraftingFont({ fontFamily: fallback.fontFamily, fontId: fallback.fontId }).family
      : fallback.fontFamily.trim().slice(0, 80)
  }

  return DEFAULT_DRAFTING_TEXT_LAYER.fontFamily
}

function normalizeTextFontId(value: Record<string, unknown>, fallback: DraftingCanvasLayer) {
  if (typeof value.fontId === "string" && getDraftingFontById(value.fontId)) {
    return value.fontId
  }

  if (typeof value.fontFamily === "string" && value.fontFamily.trim()) {
    return getDraftingFontByFamily(value.fontFamily)?.id
  }

  if (typeof fallback.fontId === "string" && getDraftingFontById(fallback.fontId)) {
    return fallback.fontId
  }

  if (typeof fallback.fontFamily === "string" && fallback.fontFamily.trim()) {
    return getDraftingFontByFamily(fallback.fontFamily)?.id
  }

  return DEFAULT_DRAFTING_TEXT_LAYER.fontId
}

function normalizeTextFontWeight(value: unknown, fallback: unknown): DraftingTextFontWeight {
  if (value === "bold" || value === "normal") {
    return value
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return clamp(Math.round(value), 100, 900)
  }

  return fallback === "bold" || fallback === "normal" || typeof fallback === "number"
    ? normalizeTextFontWeight(fallback, DEFAULT_DRAFTING_TEXT_LAYER.fontWeight)
    : DEFAULT_DRAFTING_TEXT_LAYER.fontWeight
}

function normalizeTextRuns(
  value: unknown,
  fallback: unknown,
  text: string,
): DraftingTextRun[] | undefined {
  const normalized = normalizeTextRunArray(value, text)
  if (normalized) {
    return normalized
  }

  return normalizeTextRunArray(fallback, text)
}

function normalizeTextRunArray(value: unknown, text: string): DraftingTextRun[] | undefined {
  if (!Array.isArray(value) || text.length === 0) {
    return undefined
  }

  const runs = value
    .map((run): DraftingTextRun | null => {
      if (!isRecord(run) || typeof run.text !== "string" || run.text.length === 0) {
        return null
      }

      const fontFamily =
        typeof run.fontFamily === "string" && run.fontFamily.trim()
          ? run.fontFamily.trim().slice(0, 80)
          : undefined
      const fontId = typeof run.fontId === "string" && getDraftingFontById(run.fontId)
        ? run.fontId
        : fontFamily
          ? getDraftingFontByFamily(fontFamily)?.id
          : undefined

      return {
        fill: typeof run.fill === "string" ? normalizeHexColor(run.fill, DEFAULT_DRAFTING_TEXT_LAYER.fill) : undefined,
        fontFamily,
        fontId,
        fontSize:
          typeof run.fontSize === "number" && Number.isFinite(run.fontSize)
            ? clamp(run.fontSize, 6, 300)
            : undefined,
        fontStyle: run.fontStyle === "italic" ? "italic" : run.fontStyle === "normal" ? "normal" : undefined,
        fontWeight:
          run.fontWeight === undefined
            ? undefined
            : normalizeTextFontWeight(run.fontWeight, undefined),
        text: run.text,
        underline: typeof run.underline === "boolean" ? run.underline : undefined,
      }
    })
    .filter((run): run is DraftingTextRun => Boolean(run))

  if (runs.length === 0 || runs.map((run) => run.text).join("") !== text) {
    return undefined
  }

  return mergeAdjacentTextRuns(runs)
}

function mergeAdjacentTextRuns(runs: DraftingTextRun[]) {
  return runs.reduce<DraftingTextRun[]>((merged, run) => {
    const previous = merged.at(-1)

    if (previous && areTextRunStylesEqual(previous, run)) {
      previous.text += run.text
      return merged
    }

    merged.push({ ...run })
    return merged
  }, [])
}

function areTextRunStylesEqual(a: DraftingTextRun, b: DraftingTextRun) {
  return (
    a.fill === b.fill &&
    a.fontFamily === b.fontFamily &&
    a.fontId === b.fontId &&
    a.fontSize === b.fontSize &&
    a.fontStyle === b.fontStyle &&
    a.fontWeight === b.fontWeight &&
    a.underline === b.underline
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
