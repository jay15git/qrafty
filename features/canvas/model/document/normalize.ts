import { createDefaultDraftingCardState } from "@/features/canvas/model/card-state";
import {
  createDefaultDraftingWorkspaceQrState,
  cloneDraftingQrState,
  type DraftingQrStateByLayerId,
  type DraftingWorkspaceDocumentV1,
} from "@/features/canvas/model/document";
import {
  createDefaultDraftingLayers,
  createDraftingQrLayer,
} from "@/features/canvas/model/layers/card-qr";
import {
  createAdditionalDraftingQrLayerId,
  getDraftingQrLayerId,
  getQrCanvasLayers,
} from "@/features/canvas/model/layers/shared";
import { cloneDraftingCanvasLayer } from "@/features/canvas/model/layers/fallback";
import { type DraftingCanvasLayer } from "@/features/canvas/model/layers/shared";
import { DASHBOARD_QR_NODE_ID } from "@/features/qr/rendering/compose-scene";
import { type QrInputType } from "@/features/qr/content/input-options";
import { createDefaultSceneComposition } from "@/features/canvas/model/scene-templates";

function normalizeSingleNodeDocument(
  document: DraftingWorkspaceDocumentV1,
  primaryNodeId: string,
): DraftingWorkspaceDocumentV1 {
  const primaryQrLayerId = getDraftingQrLayerId(primaryNodeId);
  const primaryLayers =
    document.layerStateByNodeId[primaryNodeId] ??
    createDefaultDraftingLayers(
      primaryNodeId,
      document.qrStateByLayerId[primaryQrLayerId] ??
        document.qrStateByNodeId[primaryNodeId] ??
        createDefaultDraftingWorkspaceQrState(),
      document.cardStateByNodeId[primaryNodeId] ?? createDefaultDraftingCardState(),
    );

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
  };
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
  let nextZIndex = primaryLayers.reduce((max, layer) => Math.max(max, layer.zIndex), 0) + 1;
  let extraIndex = 0;

  for (const nodeId of orderedNodeIds) {
    if (nodeId === primaryNode) {
      continue;
    }

    const nodeState = document.qrStateByNodeId[nodeId] ?? createDefaultDraftingWorkspaceQrState();
    const sourceQrLayer = document.layerStateByNodeId[nodeId]?.find((layer) => layer.kind === "qr");
    const layerId = createAdditionalDraftingQrLayerId(primaryNodeId);
    const nearLayer =
      getQrCanvasLayers(primaryLayers).at(-1) ?? primaryLayers.find((layer) => layer.kind === "qr");

    primaryLayers.push(
      createDraftingQrLayer(primaryNodeId, nodeState, primaryCardState, {
        id: layerId,
        nearLayer,
        zIndex: nextZIndex,
      }),
    );

    const targetLayer = primaryLayers.at(-1);
    if (sourceQrLayer && targetLayer) {
      targetLayer.x = sourceQrLayer.x + extraIndex * 24;
      targetLayer.y = sourceQrLayer.y + extraIndex * 24;
      targetLayer.width = sourceQrLayer.width;
      targetLayer.height = sourceQrLayer.height;
      targetLayer.rotation = sourceQrLayer.rotation;
    }

    qrStateByLayerId[layerId] = cloneDraftingQrState(nodeState);
    contentTypeByLayerId[layerId] =
      document.contentTypeByNodeId[nodeId] ?? document.selectedContentType;
    nextZIndex += 1;
    extraIndex += 1;
  }
}

export function normalizeDraftingWorkspaceDocument(
  document: DraftingWorkspaceDocumentV1,
): DraftingWorkspaceDocumentV1 {
  const primaryNodeId = DASHBOARD_QR_NODE_ID;
  const orderedNodeIds =
    document.qrOrder.length > 0 ? [...document.qrOrder] : Object.keys(document.qrStateByNodeId);

  if (orderedNodeIds.length <= 1 && orderedNodeIds[0] === primaryNodeId) {
    return normalizeSingleNodeDocument(document, primaryNodeId);
  }

  const primaryNode = orderedNodeIds.includes(primaryNodeId) ? primaryNodeId : orderedNodeIds[0]!;
  const primaryCardState =
    document.cardStateByNodeId[primaryNode] ?? createDefaultDraftingCardState();
  const primaryLayers = (
    document.layerStateByNodeId[primaryNode] ??
    createDefaultDraftingLayers(
      primaryNodeId,
      document.qrStateByNodeId[primaryNode] ?? createDefaultDraftingWorkspaceQrState(),
      primaryCardState,
    )
  ).map(cloneDraftingCanvasLayer);
  const qrStateByLayerId: DraftingQrStateByLayerId = {};
  const contentTypeByLayerId: Record<string, QrInputType> = {};

  for (const layer of primaryLayers) {
    if (layer.kind !== "qr") {
      continue;
    }

    qrStateByLayerId[layer.id] = cloneDraftingQrState(
      document.qrStateByLayerId[layer.id] ??
        document.qrStateByNodeId[primaryNode] ??
        createDefaultDraftingWorkspaceQrState(),
    );
    contentTypeByLayerId[layer.id] =
      document.contentTypeByNodeId[primaryNode] ??
      document.contentTypeByLayerId[layer.id] ??
      document.selectedContentType;
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
  );

  const primaryQrLayerId = getDraftingQrLayerId(primaryNodeId);

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
  };
}
