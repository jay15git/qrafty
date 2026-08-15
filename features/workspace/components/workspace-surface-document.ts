import { DEFAULT_QR_INPUT_TYPE, type QrInputType } from "@/features/qr-code/content/input-options"
import type { QrStudioState } from "@/features/qr-code/model/state"
import { DASHBOARD_QR_NODE_ID } from "@/features/qr-code/rendering/compose-scene"
import {
  cloneDraftingQrState,
  type DraftingCardStateByNodeId,
  type DraftingContentValuesByType,
  type DraftingQrStateByLayerId,
  type DraftingQrStateByNodeId,
  type DraftingWorkspaceDocumentV1,
} from "@/features/workspace/model/document"
import { cloneSceneCompositionByNodeId, type SceneCompositionByNodeId } from "@/features/workspace/model/apply-scene-template"
import { cloneDraftingCardState, type DraftingCardState } from "@/features/workspace/model/card-state"
import {
  cloneDraftingCanvasLayer,
  createDefaultDraftingLayers,
  getDraftingQrLayerId,
  getQrCanvasLayers,
  type DraftingLayerStateByNodeId,
} from "@/features/workspace/model/layers"

export type BuildDraftingWorkspaceDocumentInput = {
  activeQrLayerId: string
  activeQrNodeId: string
  cardStateByNodeId: DraftingCardStateByNodeId
  contentTypeByLayerId: Record<string, QrInputType>
  contentTypeByNodeId: Record<string, QrInputType>
  contentValuesByType: DraftingContentValuesByType
  draftingStudioState: QrStudioState
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
  draftingStudioState,
  layerStateByNodeId,
  qrStateByLayerId,
  sceneCompositionByNodeId,
  selectedCardState,
  selectedContentType,
}: BuildDraftingWorkspaceDocumentInput): DraftingWorkspaceDocumentV1 {
  const nodeId = DASHBOARD_QR_NODE_ID
  const layers = (
    layerStateByNodeId[nodeId] ??
    createDefaultDraftingLayers(nodeId, draftingStudioState, selectedCardState)
  ).map(cloneDraftingCanvasLayer)
  const nextQrStateByLayerId: DraftingQrStateByLayerId = {
    ...Object.fromEntries(
      Object.entries(qrStateByLayerId).map(([layerId, state]) => [
        layerId,
        cloneDraftingQrState(layerId === activeQrLayerId ? draftingStudioState : state),
      ]),
    ),
  }

  for (const layer of getQrCanvasLayers(layers)) {
    if (!nextQrStateByLayerId[layer.id]) {
      nextQrStateByLayerId[layer.id] = cloneDraftingQrState(
        layer.id === activeQrLayerId
          ? draftingStudioState
          : (qrStateByLayerId[layer.id] ?? draftingStudioState),
      )
    }
  }

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
    cloneDraftingQrState(draftingStudioState)

  return {
    activeQrLayerId,
    activeQrNodeId: nodeId,
    cardStateByNodeId: {
      [nodeId]: cloneDraftingCardState(selectedCardState),
    },
    contentTypeByLayerId: nextContentTypeByLayerId,
    contentTypeByNodeId: {
      ...contentTypeByNodeId,
      [nodeId]: selectedContentType,
    },
    contentValuesByType: structuredClone(contentValuesByType),
    layerStateByNodeId: {
      [nodeId]: layers,
    },
    qrOrder: [nodeId],
    qrStateByLayerId: nextQrStateByLayerId,
    qrStateByNodeId: {
      [nodeId]: primaryState,
    } satisfies DraftingQrStateByNodeId,
    sceneCompositionByNodeId: cloneSceneCompositionByNodeId(sceneCompositionByNodeId),
    selectedContentType,
    version: 1,
  }
}
