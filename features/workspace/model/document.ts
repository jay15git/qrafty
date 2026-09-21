import {
  cloneDraftingCardState,
  createDefaultDraftingCardState,
  normalizeDraftingCardState,
  type DraftingCardState,
} from "@/features/workspace/model/card-state"
import {
  cloneDraftingLayerStateByNodeId,
  cloneDraftingCanvasLayer,
  createAdditionalDraftingQrLayerId,
  createDefaultDraftingLayers,
  createDraftingQrLayer,
  getDraftingQrLayerId,
  getQrCanvasLayers,
  normalizeDraftingCanvasLayers,
  type DraftingCanvasLayer,
  type DraftingLayerStateByNodeId,
} from "@/features/workspace/model/layers"
import { DASHBOARD_QR_NODE_ID } from "@/features/qr-code/rendering/compose-scene"
import {
  clampBackgroundShapeEdgeBlur,
  clampBackgroundShapeOffset,
  clampBackgroundShapeOpacity,
  clampBackgroundShapePaddingPx,
  clampBackgroundShapeStrokeWidth,
  clampBackgroundShapeTilt,
  createDefaultQraftyState,
  DEFAULT_BACKGROUND_SHAPE_OPTIONS,
  setDotMatrixAnimationOptions,
  type BackgroundShapeOptions,
  type QraftyState,
} from "@/features/qr-code/model/state"
import {
  DEFAULT_QR_INPUT_TYPE,
  type QrInputType,
} from "@/features/qr-code/content/input-options"
import {
  cloneSceneCompositionByNodeId,
  createDefaultSceneCompositionByNodeId,
  type SceneCompositionByNodeId,
} from "@/features/workspace/model/apply-scene-template"
import {
  createDefaultSceneComposition,
  normalizeSceneComposition,
  type SceneCompositionState,
} from "@/features/workspace/model/scene-templates"
import {
  getDefaultStaticQrValues,
  type StaticQrContentValues,
} from "@/features/qr-code/content/static-payload"

export type DraftingQrStateByNodeId = Record<string, QraftyState>
export type DraftingCardStateByNodeId = Record<string, DraftingCardState>
export type DraftingContentValuesByType = Partial<Record<QrInputType, StaticQrContentValues>>

export type DraftingQrStateByLayerId = Record<string, QraftyState>

export type DraftingWorkspaceDocumentV1 = {
  activeQrLayerId: string
  activeQrNodeId: string
  cardStateByNodeId: DraftingCardStateByNodeId
  contentTypeByLayerId: Record<string, QrInputType>
  contentTypeByNodeId: Record<string, QrInputType>
  contentValuesByType: DraftingContentValuesByType
  layerStateByNodeId: DraftingLayerStateByNodeId
  qrOrder: string[]
  qrStateByLayerId: DraftingQrStateByLayerId
  qrStateByNodeId: DraftingQrStateByNodeId
  sceneCompositionByNodeId: SceneCompositionByNodeId
  selectedContentType: QrInputType
  version: 1
}

const DEFAULT_DRAFTING_PANE_QR_SIZE = 240

export function cloneDraftingWorkspaceDocument(
  document: DraftingWorkspaceDocumentV1,
): DraftingWorkspaceDocumentV1 {
  return {
    activeQrLayerId: document.activeQrLayerId,
    activeQrNodeId: document.activeQrNodeId,
    cardStateByNodeId: Object.fromEntries(
      Object.entries(document.cardStateByNodeId).map(([nodeId, state]) => [
        nodeId,
        cloneDraftingCardState(state),
      ]),
    ),
    contentTypeByLayerId: structuredClone(document.contentTypeByLayerId),
    contentTypeByNodeId: structuredClone(document.contentTypeByNodeId),
    contentValuesByType: structuredClone(document.contentValuesByType),
    layerStateByNodeId: cloneDraftingLayerStateByNodeId(document.layerStateByNodeId),
    qrOrder: [...document.qrOrder],
    qrStateByLayerId: Object.fromEntries(
      Object.entries(document.qrStateByLayerId).map(([layerId, state]) => [
        layerId,
        cloneDraftingQrState(state),
      ]),
    ),
    qrStateByNodeId: Object.fromEntries(
      Object.entries(document.qrStateByNodeId).map(([nodeId, state]) => [
        nodeId,
        cloneDraftingQrState(state),
      ]),
    ),
    sceneCompositionByNodeId: cloneSceneCompositionByNodeId(document.sceneCompositionByNodeId),
    selectedContentType: document.selectedContentType,
    version: 1,
  }
}

export function createDefaultDraftingWorkspaceDocument(): DraftingWorkspaceDocumentV1 {
  const qrState = createDefaultDraftingWorkspaceQrState()
  const cardState = createDefaultDraftingCardState()
  const primaryQrLayerId = getDraftingQrLayerId(DASHBOARD_QR_NODE_ID)
  const document: DraftingWorkspaceDocumentV1 = {
    activeQrLayerId: primaryQrLayerId,
    activeQrNodeId: DASHBOARD_QR_NODE_ID,
    cardStateByNodeId: {
      [DASHBOARD_QR_NODE_ID]: cardState,
    },
    contentTypeByLayerId: {
      [primaryQrLayerId]: DEFAULT_QR_INPUT_TYPE,
    },
    contentTypeByNodeId: {
      [DASHBOARD_QR_NODE_ID]: DEFAULT_QR_INPUT_TYPE,
    },
    contentValuesByType: {
      [DEFAULT_QR_INPUT_TYPE]: {
        ...getDefaultStaticQrValues(DEFAULT_QR_INPUT_TYPE),
        url: qrState.data,
      },
    },
    layerStateByNodeId: {
      [DASHBOARD_QR_NODE_ID]: createDefaultDraftingLayers(
        DASHBOARD_QR_NODE_ID,
        qrState,
        cardState,
      ),
    },
    qrOrder: [DASHBOARD_QR_NODE_ID],
    qrStateByLayerId: {
      [primaryQrLayerId]: qrState,
    },
    qrStateByNodeId: {
      [DASHBOARD_QR_NODE_ID]: qrState,
    },
    sceneCompositionByNodeId: {},
    selectedContentType: DEFAULT_QR_INPUT_TYPE,
    version: 1,
  }

  document.sceneCompositionByNodeId = createDefaultSceneCompositionByNodeId(document)

  return document
}

export function parseDraftingWorkspaceDocument(
  value: unknown,
): DraftingWorkspaceDocumentV1 {
  if (typeof value === "string") {
    try {
      return parseDraftingWorkspaceDocument(JSON.parse(value))
    } catch {
      return createDefaultDraftingWorkspaceDocument()
    }
  }

  if (!isRecord(value) || value.version !== 1) {
    return createDefaultDraftingWorkspaceDocument()
  }

  const rawQrStateByNodeId = isRecord(value.qrStateByNodeId)
    ? value.qrStateByNodeId
    : {}
  const rawCardStateByNodeId = isRecord(value.cardStateByNodeId)
    ? value.cardStateByNodeId
    : {}
  const rawLayerStateByNodeId = isRecord(value.layerStateByNodeId)
    ? value.layerStateByNodeId
    : {}
  const qrOrder = Array.isArray(value.qrOrder)
    ? value.qrOrder.filter((nodeId): nodeId is string => typeof nodeId === "string")
    : []
  const fallback = createDefaultDraftingWorkspaceDocument()
  const orderedNodeIds = qrOrder.filter((nodeId) => isRecord(rawQrStateByNodeId[nodeId]))
  const orderedNodeIdSet = new Set(orderedNodeIds)

  for (const nodeId of Object.keys(rawQrStateByNodeId)) {
    if (!orderedNodeIdSet.has(nodeId) && isRecord(rawQrStateByNodeId[nodeId])) {
      orderedNodeIds.push(nodeId)
      orderedNodeIdSet.add(nodeId)
    }
  }

  if (orderedNodeIds.length === 0) {
    return fallback
  }

  const qrStateByNodeId: DraftingQrStateByNodeId = {}
  const cardStateByNodeId: DraftingCardStateByNodeId = {}
  const layerStateByNodeId: DraftingLayerStateByNodeId = {}

  for (const nodeId of orderedNodeIds) {
    qrStateByNodeId[nodeId] = parseQrState(rawQrStateByNodeId[nodeId])
    cardStateByNodeId[nodeId] = parseCardState(rawCardStateByNodeId[nodeId])
    layerStateByNodeId[nodeId] = normalizeDraftingCanvasLayers(
      nodeId,
      rawLayerStateByNodeId[nodeId],
      qrStateByNodeId[nodeId],
      cardStateByNodeId[nodeId],
    )
  }

  const selectedContentType = parseQrInputType(value.selectedContentType)
  const contentValuesByType = parseContentValuesByType(value.contentValuesByType)
  const activeQrNodeId =
    typeof value.activeQrNodeId === "string" && qrStateByNodeId[value.activeQrNodeId]
      ? value.activeQrNodeId
      : orderedNodeIds[0]!

  if (!contentValuesByType[selectedContentType]) {
    contentValuesByType[selectedContentType] =
      selectedContentType === DEFAULT_QR_INPUT_TYPE
        ? {
            ...getDefaultStaticQrValues(DEFAULT_QR_INPUT_TYPE),
            url: qrStateByNodeId[activeQrNodeId]?.data ?? fallback.qrStateByNodeId[DASHBOARD_QR_NODE_ID]!.data,
          }
        : selectedContentType === "auto" || selectedContentType === "text"
          ? {
              ...getDefaultStaticQrValues(selectedContentType),
              text: qrStateByNodeId[activeQrNodeId]?.data ?? fallback.qrStateByNodeId[DASHBOARD_QR_NODE_ID]!.data,
            }
        : getDefaultStaticQrValues(selectedContentType)
  }

  const contentTypeByNodeId = parseContentTypeByNodeId(
    value.contentTypeByNodeId,
    orderedNodeIds,
    selectedContentType,
  )

  const parsedDocument: DraftingWorkspaceDocumentV1 = {
    activeQrLayerId:
      typeof value.activeQrLayerId === "string"
        ? value.activeQrLayerId
        : getDraftingQrLayerId(activeQrNodeId),
    activeQrNodeId,
    cardStateByNodeId,
    contentTypeByLayerId: parseContentTypeByLayerId(
      value.contentTypeByLayerId,
      layerStateByNodeId,
      contentTypeByNodeId,
      activeQrNodeId,
    ),
    contentTypeByNodeId,
    contentValuesByType,
    layerStateByNodeId,
    qrOrder: orderedNodeIds,
    qrStateByLayerId: parseQrStateByLayerId(
      value.qrStateByLayerId,
      layerStateByNodeId,
      qrStateByNodeId,
      activeQrNodeId,
    ),
    qrStateByNodeId,
    sceneCompositionByNodeId: parseSceneCompositionByNodeId(
      value.sceneCompositionByNodeId,
      orderedNodeIds,
    ),
    selectedContentType,
    version: 1,
  }

  return normalizeDraftingWorkspaceDocument(parsedDocument)
}

export function serializeDraftingWorkspaceDocument(
  document: DraftingWorkspaceDocumentV1,
): string {
  return JSON.stringify(cloneDraftingWorkspaceDocument(document))
}

export function createDefaultDraftingWorkspaceQrState(): QraftyState {
  const state = createDefaultQraftyState()

  state.width = DEFAULT_DRAFTING_PANE_QR_SIZE
  state.height = DEFAULT_DRAFTING_PANE_QR_SIZE

  return state
}

export function cloneDraftingQrState(state: QraftyState): QraftyState {
  return structuredClone(state)
}

function parseQrState(value: unknown): QraftyState {
  const fallback = createDefaultDraftingWorkspaceQrState()

  if (!isRecord(value)) {
    return fallback
  }
  const clonedValue = structuredClone(value)
  const rawDotMatrixAnimation = isRecord(value.dotMatrixAnimation)
    ? value.dotMatrixAnimation
    : {}
  const dotMatrixAnimation = setDotMatrixAnimationOptions(
    {
      ...fallback,
      dotMatrixAnimation: {
        ...fallback.dotMatrixAnimation,
        ...rawDotMatrixAnimation,
      },
    },
    rawDotMatrixAnimation,
  ).dotMatrixAnimation

  return {
    ...fallback,
    ...clonedValue,
    dotMatrixAnimation,
    backgroundShapeOptions: parseBackgroundShapeOptions(
      isRecord(value.backgroundShapeOptions) ? value.backgroundShapeOptions : undefined,
      fallback,
    ),
  } as QraftyState
}

function parseBackgroundShapeOptions(
  value: Record<string, unknown> | undefined,
  fallback: QraftyState,
): BackgroundShapeOptions {
  const legacySizePercent =
    typeof value?.sizePercent === "number" ? value.sizePercent : undefined
  const legacyPaddingPx =
    legacySizePercent !== undefined && legacySizePercent > 100
      ? ((legacySizePercent - 100) / 200) * fallback.width
      : undefined

  const num = (key: keyof BackgroundShapeOptions) =>
    typeof value?.[key] === "number" ? (value[key] as number) : undefined
  const str = (key: keyof BackgroundShapeOptions) =>
    typeof value?.[key] === "string" ? (value[key] as string) : undefined
  const numField = (
    key: keyof BackgroundShapeOptions,
    clamp: (n: number) => number,
    fallbackValue?: number,
  ) => clamp(num(key) ?? fallbackValue ?? (DEFAULT_BACKGROUND_SHAPE_OPTIONS[key] as number))
  const strField = (key: keyof BackgroundShapeOptions) =>
    str(key) ?? (DEFAULT_BACKGROUND_SHAPE_OPTIONS[key] as string)

  return {
    edgeBlur: numField("edgeBlur", clampBackgroundShapeEdgeBlur),
    paddingPx: numField("paddingPx", clampBackgroundShapePaddingPx, legacyPaddingPx),
    shadowColor: strField("shadowColor"),
    shadowOffsetX: numField("shadowOffsetX", clampBackgroundShapeOffset),
    shadowOffsetY: numField("shadowOffsetY", clampBackgroundShapeOffset),
    shadowOpacity: numField("shadowOpacity", clampBackgroundShapeOpacity),
    strokeColor: strField("strokeColor"),
    strokeOpacity: numField("strokeOpacity", clampBackgroundShapeOpacity),
    strokeWidth: numField("strokeWidth", clampBackgroundShapeStrokeWidth),
    tiltX: numField("tiltX", clampBackgroundShapeTilt),
    tiltY: numField("tiltY", clampBackgroundShapeTilt),
  }
}

function parseCardState(value: unknown): DraftingCardState {
  const fallback = createDefaultDraftingCardState()

  if (!isRecord(value)) {
    return fallback
  }

  return normalizeDraftingCardState({
    ...fallback,
    ...structuredClone(value),
  } as DraftingCardState)
}

function parseContentValuesByType(value: unknown): DraftingContentValuesByType {
  if (!isRecord(value)) {
    return {}
  }

  return structuredClone(value) as DraftingContentValuesByType
}

function parseContentTypeByLayerId(
  value: unknown,
  layerStateByNodeId: DraftingLayerStateByNodeId,
  contentTypeByNodeId: Record<string, QrInputType>,
  activeQrNodeId: string,
): Record<string, QrInputType> {
  const raw = isRecord(value) ? value : {}
  const contentTypeByLayerId: Record<string, QrInputType> = {}
  const fallbackType = contentTypeByNodeId[activeQrNodeId] ?? DEFAULT_QR_INPUT_TYPE

  for (const layers of Object.values(layerStateByNodeId)) {
    for (const layer of layers) {
      if (layer.kind !== "qr") {
        continue
      }

      contentTypeByLayerId[layer.id] = parseQrInputType(raw[layer.id] ?? fallbackType)
    }
  }

  return contentTypeByLayerId
}

function parseQrStateByLayerId(
  value: unknown,
  layerStateByNodeId: DraftingLayerStateByNodeId,
  qrStateByNodeId: DraftingQrStateByNodeId,
  activeQrNodeId: string,
): DraftingQrStateByLayerId {
  const raw = isRecord(value) ? value : {}
  const qrStateByLayerId: DraftingQrStateByLayerId = {}
  const fallbackState =
    qrStateByNodeId[activeQrNodeId] ?? createDefaultDraftingWorkspaceQrState()

  for (const [nodeId, layers] of Object.entries(layerStateByNodeId)) {
    const nodeState = qrStateByNodeId[nodeId] ?? fallbackState

    for (const layer of layers) {
      if (layer.kind !== "qr") {
        continue
      }

      qrStateByLayerId[layer.id] = parseQrState(raw[layer.id] ?? nodeState)
    }
  }

  return qrStateByLayerId
}

function normalizeSingleNodeDocument(
  document: DraftingWorkspaceDocumentV1,
  primaryNodeId: string,
): DraftingWorkspaceDocumentV1 {
  const primaryQrLayerId = getDraftingQrLayerId(primaryNodeId)
  const primaryLayers =
    document.layerStateByNodeId[primaryNodeId] ??
    createDefaultDraftingLayers(
      primaryNodeId,
      document.qrStateByLayerId[primaryQrLayerId] ??
        document.qrStateByNodeId[primaryNodeId] ??
        createDefaultDraftingWorkspaceQrState(),
      document.cardStateByNodeId[primaryNodeId] ?? createDefaultDraftingCardState(),
    )

  return {
    ...document,
    activeQrLayerId: document.qrStateByLayerId[document.activeQrLayerId]
      ? document.activeQrLayerId
      : primaryQrLayerId,
    activeQrNodeId: primaryNodeId,
    cardStateByNodeId: {
      [primaryNodeId]:
        document.cardStateByNodeId[primaryNodeId] ?? createDefaultDraftingCardState(),
    },
    layerStateByNodeId: {
      [primaryNodeId]: primaryLayers,
    },
    qrOrder: [primaryNodeId],
    qrStateByNodeId: {
      [primaryNodeId]:
        document.qrStateByLayerId[primaryQrLayerId] ??
        document.qrStateByNodeId[primaryNodeId] ??
        createDefaultDraftingWorkspaceQrState(),
    },
    sceneCompositionByNodeId: {
      [primaryNodeId]:
        document.sceneCompositionByNodeId[primaryNodeId] ?? createDefaultSceneComposition(),
    },
  }
}

/** Copy each source node's QR into a new layer on the primary card. */
function foldExtraNodesIntoPrimaryLayers(
  document: DraftingWorkspaceDocumentV1,
  orderedNodeIds: string[],
  primaryNode: string,
  primaryNodeId: string,
  primaryLayers: DraftingCanvasLayer[],
  primaryCardState: ReturnType<typeof createDefaultDraftingCardState>,
  qrStateByLayerId: DraftingQrStateByLayerId,
  contentTypeByLayerId: Record<string, QrInputType>,
) {
  let nextZIndex =
    primaryLayers.reduce((max, layer) => Math.max(max, layer.zIndex), 0) + 1
  let extraIndex = 0

  for (const nodeId of orderedNodeIds) {
    if (nodeId === primaryNode) {
      continue
    }

    const nodeState =
      document.qrStateByNodeId[nodeId] ?? createDefaultDraftingWorkspaceQrState()
    const sourceQrLayer = document.layerStateByNodeId[nodeId]?.find(
      (layer) => layer.kind === "qr",
    )
    const layerId = createAdditionalDraftingQrLayerId(primaryNodeId)
    const nearLayer =
      getQrCanvasLayers(primaryLayers).at(-1) ??
      primaryLayers.find((layer) => layer.kind === "qr")

    primaryLayers.push(
      createDraftingQrLayer(primaryNodeId, nodeState, primaryCardState, {
        id: layerId,
        nearLayer,
        zIndex: nextZIndex,
      }),
    )

    const targetLayer = primaryLayers.at(-1)
    if (sourceQrLayer && targetLayer) {
      targetLayer.x = sourceQrLayer.x + extraIndex * 24
      targetLayer.y = sourceQrLayer.y + extraIndex * 24
      targetLayer.width = sourceQrLayer.width
      targetLayer.height = sourceQrLayer.height
      targetLayer.rotation = sourceQrLayer.rotation
    }

    qrStateByLayerId[layerId] = cloneDraftingQrState(nodeState)
    contentTypeByLayerId[layerId] =
      document.contentTypeByNodeId[nodeId] ?? document.selectedContentType
    nextZIndex += 1
    extraIndex += 1
  }
}

function normalizeDraftingWorkspaceDocument(
  document: DraftingWorkspaceDocumentV1,
): DraftingWorkspaceDocumentV1 {
  const primaryNodeId = DASHBOARD_QR_NODE_ID
  const orderedNodeIds =
    document.qrOrder.length > 0 ? [...document.qrOrder] : Object.keys(document.qrStateByNodeId)

  if (orderedNodeIds.length <= 1 && orderedNodeIds[0] === primaryNodeId) {
    return normalizeSingleNodeDocument(document, primaryNodeId)
  }

  const primaryNode =
    orderedNodeIds.includes(primaryNodeId) ? primaryNodeId : orderedNodeIds[0]!
  const primaryCardState =
    document.cardStateByNodeId[primaryNode] ?? createDefaultDraftingCardState()
  const primaryLayers = (
    document.layerStateByNodeId[primaryNode] ??
    createDefaultDraftingLayers(
      primaryNodeId,
      document.qrStateByNodeId[primaryNode] ?? createDefaultDraftingWorkspaceQrState(),
      primaryCardState,
    )
  ).map(cloneDraftingCanvasLayer)
  const qrStateByLayerId: DraftingQrStateByLayerId = {}
  const contentTypeByLayerId: Record<string, QrInputType> = {}

  for (const layer of primaryLayers) {
    if (layer.kind !== "qr") {
      continue
    }

    qrStateByLayerId[layer.id] = cloneDraftingQrState(
      document.qrStateByLayerId[layer.id] ??
        document.qrStateByNodeId[primaryNode] ??
        createDefaultDraftingWorkspaceQrState(),
    )
    contentTypeByLayerId[layer.id] =
      document.contentTypeByNodeId[primaryNode] ??
      document.contentTypeByLayerId[layer.id] ??
      document.selectedContentType
  }

  foldExtraNodesIntoPrimaryLayers(
    document,
    orderedNodeIds,
    primaryNode,
    primaryNodeId,
    primaryLayers,
    primaryCardState,
    qrStateByLayerId,
    contentTypeByLayerId,
  )

  const primaryQrLayerId = getDraftingQrLayerId(primaryNodeId)

  return {
    ...document,
    activeQrLayerId: document.qrStateByLayerId[document.activeQrLayerId]
      ? document.activeQrLayerId
      : primaryQrLayerId,
    activeQrNodeId: primaryNodeId,
    cardStateByNodeId: {
      [primaryNodeId]: primaryCardState,
    },
    contentTypeByLayerId,
    layerStateByNodeId: {
      [primaryNodeId]: primaryLayers,
    },
    qrOrder: [primaryNodeId],
    qrStateByLayerId,
    qrStateByNodeId: {
      [primaryNodeId]:
        qrStateByLayerId[primaryQrLayerId] ??
        document.qrStateByNodeId[primaryNode] ??
        createDefaultDraftingWorkspaceQrState(),
    },
    sceneCompositionByNodeId: {
      [primaryNodeId]:
        document.sceneCompositionByNodeId[primaryNode] ??
        document.sceneCompositionByNodeId[primaryNodeId] ??
        createDefaultSceneComposition(),
    },
  }
}

function parseContentTypeByNodeId(
  value: unknown,
  nodeIds: string[],
  fallbackType: QrInputType,
): Record<string, QrInputType> {
  const raw = isRecord(value) ? value : {}
  const contentTypeByNodeId: Record<string, QrInputType> = {}

  for (const nodeId of nodeIds) {
    contentTypeByNodeId[nodeId] = parseQrInputType(raw[nodeId] ?? fallbackType)
  }

  return contentTypeByNodeId
}

function parseQrInputType(value: unknown): QrInputType {
  return typeof value === "string" ? (value as QrInputType) : DEFAULT_QR_INPUT_TYPE
}

function parseSceneCompositionByNodeId(
  value: unknown,
  nodeIds: string[],
): SceneCompositionByNodeId {
  const raw = isRecord(value) ? value : {}
  const compositions: SceneCompositionByNodeId = {}

  for (const nodeId of nodeIds) {
    compositions[nodeId] = normalizeSceneComposition(
      isRecord(raw[nodeId]) ? (raw[nodeId] as SceneCompositionState) : undefined,
    )
  }

  return compositions
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
