import { DEFAULT_QR_INPUT_TYPE, type QrInputType } from "@/features/qr-code/content/input-options"
import type { QrStudioState } from "@/features/qr-code/model/state"
import {
  cloneDraftingQrState,
  type DraftingCardStateByNodeId,
  type DraftingContentValuesByType,
  type DraftingQrStateByNodeId,
  type DraftingWorkspaceDocumentV1,
} from "@/features/workspace/model/document"
import { cloneSceneCompositionByNodeId, type SceneCompositionByNodeId } from "@/features/workspace/model/apply-scene-template"
import { cloneDraftingCardState, type DraftingCardState } from "@/features/workspace/model/card-state"
import {
  cloneDraftingCanvasLayer,
  createDefaultDraftingLayers,
  type DraftingLayerStateByNodeId,
} from "@/features/workspace/model/layers"

export type BuildDraftingWorkspaceDocumentInput = {
  activeQrNodeId: string
  cardStateByNodeId: DraftingCardStateByNodeId
  contentTypeByNodeId: Record<string, QrInputType>
  contentValuesByType: DraftingContentValuesByType
  draftingStudioState: QrStudioState
  layerStateByNodeId: DraftingLayerStateByNodeId
  qrStateByNodeId: DraftingQrStateByNodeId
  sceneCompositionByNodeId: SceneCompositionByNodeId
  selectedCardState: DraftingCardState
  selectedContentType: QrInputType
}

export function buildDraftingWorkspaceDocumentFromState({
  activeQrNodeId,
  cardStateByNodeId,
  contentTypeByNodeId,
  contentValuesByType,
  draftingStudioState,
  layerStateByNodeId,
  qrStateByNodeId,
  sceneCompositionByNodeId,
  selectedCardState,
  selectedContentType,
}: BuildDraftingWorkspaceDocumentInput): DraftingWorkspaceDocumentV1 {
  const qrStateEntries = Object.entries(qrStateByNodeId)
  const nextQrStateByNodeId: DraftingQrStateByNodeId = {}
  const nextCardStateByNodeId: DraftingCardStateByNodeId = {}
  const nextLayerStateByNodeId: DraftingLayerStateByNodeId = {}
  const qrOrder =
    qrStateEntries.length > 0 ? qrStateEntries.map(([nodeId]) => nodeId) : [activeQrNodeId]

  for (const nodeId of qrOrder) {
    nextQrStateByNodeId[nodeId] =
      nodeId === activeQrNodeId
        ? cloneDraftingQrState(draftingStudioState)
        : cloneDraftingQrState(qrStateByNodeId[nodeId] ?? draftingStudioState)
    nextCardStateByNodeId[nodeId] =
      nodeId === activeQrNodeId
        ? cloneDraftingCardState(selectedCardState)
        : cloneDraftingCardState(cardStateByNodeId[nodeId] ?? selectedCardState)
    nextLayerStateByNodeId[nodeId] = (
      layerStateByNodeId[nodeId] ??
      createDefaultDraftingLayers(
        nodeId,
        nextQrStateByNodeId[nodeId],
        nextCardStateByNodeId[nodeId],
      )
    ).map(cloneDraftingCanvasLayer)
  }

  if (!nextQrStateByNodeId[activeQrNodeId]) {
    qrOrder.push(activeQrNodeId)
    nextQrStateByNodeId[activeQrNodeId] = cloneDraftingQrState(draftingStudioState)
    nextCardStateByNodeId[activeQrNodeId] = cloneDraftingCardState(selectedCardState)
    nextLayerStateByNodeId[activeQrNodeId] = createDefaultDraftingLayers(
      activeQrNodeId,
      draftingStudioState,
      selectedCardState,
    )
  }

  const nextContentTypeByNodeId: Record<string, QrInputType> = {
    ...contentTypeByNodeId,
    [activeQrNodeId]: selectedContentType,
  }
  for (const nodeId of qrOrder) {
    if (!nextContentTypeByNodeId[nodeId]) {
      nextContentTypeByNodeId[nodeId] = DEFAULT_QR_INPUT_TYPE
    }
  }

  return {
    activeQrNodeId,
    cardStateByNodeId: nextCardStateByNodeId,
    contentTypeByNodeId: nextContentTypeByNodeId,
    contentValuesByType: structuredClone(contentValuesByType),
    layerStateByNodeId: nextLayerStateByNodeId,
    qrOrder,
    qrStateByNodeId: nextQrStateByNodeId,
    sceneCompositionByNodeId: cloneSceneCompositionByNodeId(sceneCompositionByNodeId),
    selectedContentType,
    version: 1,
  }
}
