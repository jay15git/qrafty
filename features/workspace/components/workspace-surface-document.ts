import { DEFAULT_QR_INPUT_TYPE, type QrInputType } from "@/features/qr-code/content/input-options"
import type { QraftyState } from "@/features/qr-code/model/state"
import { DASHBOARD_QR_NODE_ID } from "@/features/qr-code/rendering/compose-scene"
import {
  type DraftingCardStateByNodeId,
  type DraftingContentValuesByType,
  type DraftingQrStateByLayerId,
  type DraftingQrStateByNodeId,
  type DraftingWorkspaceDocumentV1,
} from "@/features/workspace/model/document"
import { type SceneCompositionByNodeId } from "@/features/workspace/model/apply-scene-template"
import { type DraftingCardState } from "@/features/workspace/model/card-state"
import {
  createDefaultDraftingLayers,
  getDraftingQrLayerId,
  getQrCanvasLayers,
  type DraftingCanvasLayer,
  type DraftingLayerStateByNodeId,
} from "@/features/workspace/model/layers"

export function resolveActiveQrLayerIdFromLayers(
  activeQrLayerId: string,
  canvasLayers: DraftingCanvasLayer[],
  selectedLayerId: string | null = null,
): string {
  const qrLayers = getQrCanvasLayers(canvasLayers)

  if (qrLayers.some((layer) => layer.id === activeQrLayerId)) {
    return activeQrLayerId
  }

  if (selectedLayerId && qrLayers.some((layer) => layer.id === selectedLayerId)) {
    return selectedLayerId
  }

  return qrLayers[0]?.id ?? activeQrLayerId
}

export function mergeLiveQrStateByLayerId({
  qrStateByLayerId,
  activeQrLayerId,
  canvasLayers,
  draftingQraftyState,
  selectedLayerId = null,
}: {
  qrStateByLayerId: DraftingQrStateByLayerId
  activeQrLayerId: string
  canvasLayers: DraftingCanvasLayer[]
  draftingQraftyState: QraftyState
  selectedLayerId?: string | null
}): DraftingQrStateByLayerId {
  const merged: DraftingQrStateByLayerId = {
    ...qrStateByLayerId,
    [activeQrLayerId]: draftingQraftyState,
  }
  const qrLayers = getQrCanvasLayers(canvasLayers)
  const activeLayerOnCanvas = qrLayers.some((layer) => layer.id === activeQrLayerId)

  for (const layer of qrLayers) {
    const isLiveEditingTarget =
      layer.id === activeQrLayerId ||
      layer.id === selectedLayerId ||
      (!activeLayerOnCanvas && qrLayers.length === 1)

    if (isLiveEditingTarget) {
      merged[layer.id] = draftingQraftyState
      continue
    }

    if (!merged[layer.id]) {
      merged[layer.id] = qrStateByLayerId[layer.id] ?? draftingQraftyState
    }
  }

  return merged
}

export type BuildDraftingWorkspaceDocumentInput = {
  activeQrLayerId: string
  activeQrNodeId: string
  cardStateByNodeId: DraftingCardStateByNodeId
  contentTypeByLayerId: Record<string, QrInputType>
  contentTypeByNodeId: Record<string, QrInputType>
  contentValuesByType: DraftingContentValuesByType
  draftingQraftyState: QraftyState
  layerStateByNodeId: DraftingLayerStateByNodeId
  qrStateByLayerId: DraftingQrStateByLayerId
  sceneCompositionByNodeId: SceneCompositionByNodeId
  selectedCardState: DraftingCardState
  selectedContentType: QrInputType
}

export function buildDraftingWorkspaceDocumentFromState({
  activeQrLayerId,
  activeQrNodeId,
  cardStateByNodeId,
  contentTypeByLayerId,
  contentTypeByNodeId,
  contentValuesByType,
  draftingQraftyState,
  layerStateByNodeId,
  qrStateByLayerId,
  sceneCompositionByNodeId,
  selectedCardState,
  selectedContentType,
}: BuildDraftingWorkspaceDocumentInput): DraftingWorkspaceDocumentV1 {
  const nodeId = DASHBOARD_QR_NODE_ID
  const layers =
    layerStateByNodeId[nodeId] ??
    createDefaultDraftingLayers(nodeId, draftingQraftyState, selectedCardState)
  const nextQrStateByLayerId = mergeLiveQrStateByLayerId({
    qrStateByLayerId,
    activeQrLayerId,
    canvasLayers: layers,
    draftingQraftyState,
  })

  const primaryQrLayerId = getDraftingQrLayerId(nodeId)
  const nextContentTypeByLayerId: Record<string, QrInputType> = {
    ...contentTypeByLayerId,
    [activeQrLayerId]: selectedContentType,
  }

  for (const layer of getQrCanvasLayers(layers)) {
    if (!nextContentTypeByLayerId[layer.id]) {
      nextContentTypeByLayerId[layer.id] = DEFAULT_QR_INPUT_TYPE
    }
  }

  const primaryState =
    nextQrStateByLayerId[primaryQrLayerId] ??
    nextQrStateByLayerId[activeQrLayerId] ??
    draftingQraftyState

  return {
    activeQrLayerId,
    activeQrNodeId: nodeId,
    cardStateByNodeId: {
      [nodeId]: selectedCardState,
    },
    contentTypeByLayerId: nextContentTypeByLayerId,
    contentTypeByNodeId: {
      ...contentTypeByNodeId,
      [nodeId]: selectedContentType,
    },
    contentValuesByType,
    layerStateByNodeId: {
      [nodeId]: layers,
    },
    qrOrder: [nodeId],
    qrStateByLayerId: nextQrStateByLayerId,
    qrStateByNodeId: {
      [nodeId]: primaryState,
    } satisfies DraftingQrStateByNodeId,
    sceneCompositionByNodeId,
    selectedContentType,
    version: 1,
  }
}
