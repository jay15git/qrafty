import { createDefaultCanvasCardState } from "@/features/canvas/model/card-state";
import {
  createDefaultCanvasWorkspaceQrState,
  cloneCanvasQrState,
  type CanvasQrStateByLayerId,
  type CanvasWorkspaceDocumentV1,
} from "@/features/canvas/model/document";
import {
  createDefaultCanvasLayers,
  createCanvasQrLayer,
} from "@/features/canvas/model/layers/card-qr";
import {
  createAdditionalCanvasQrLayerId,
  getCanvasQrLayerId,
  getQrCanvasLayers,
} from "@/features/canvas/model/layers/shared";
import { cloneCanvasLayer } from "@/features/canvas/model/layers/fallback";
import { type CanvasLayer } from "@/features/canvas/model/layers/shared";
import { DASHBOARD_QR_NODE_ID } from "@/features/qr/rendering/compose-scene";
import { type QrInputType } from "@/features/qr/content/input-options";
import { createDefaultSceneComposition } from "@/features/canvas/model/scene-templates";

function normalizeSingleNodeDocument(
  document: CanvasWorkspaceDocumentV1,
  primaryNodeId: string,
): CanvasWorkspaceDocumentV1 {
  const primaryQrLayerId = getCanvasQrLayerId(primaryNodeId);
  const primaryLayers =
    document.layerStateByNodeId[primaryNodeId] ??
    createDefaultCanvasLayers(
      primaryNodeId,
      document.qrStateByLayerId[primaryQrLayerId] ??
        document.qrStateByNodeId[primaryNodeId] ??
        createDefaultCanvasWorkspaceQrState(),
      document.cardStateByNodeId[primaryNodeId] ?? createDefaultCanvasCardState(),
    );

  return {
    ...document,
    activeQrLayerId: document.qrStateByLayerId[document.activeQrLayerId]
      ? document.activeQrLayerId
      : primaryQrLayerId,
    activeQrNodeId: primaryNodeId,
    cardStateByNodeId: {
      [primaryNodeId]: document.cardStateByNodeId[primaryNodeId] ?? createDefaultCanvasCardState(),
    },
    layerStateByNodeId: {
      [primaryNodeId]: primaryLayers,
    },
    qrOrder: [primaryNodeId],
    qrStateByNodeId: {
      [primaryNodeId]:
        document.qrStateByLayerId[primaryQrLayerId] ??
        document.qrStateByNodeId[primaryNodeId] ??
        createDefaultCanvasWorkspaceQrState(),
    },
    sceneCompositionByNodeId: {
      [primaryNodeId]:
        document.sceneCompositionByNodeId[primaryNodeId] ?? createDefaultSceneComposition(),
    },
  };
}

/** Copy each source node's QR into a new layer on the primary card. */
function foldExtraNodesIntoPrimaryLayers(
  document: CanvasWorkspaceDocumentV1,
  orderedNodeIds: string[],
  primaryNode: string,
  primaryNodeId: string,
  primaryLayers: CanvasLayer[],
  primaryCardState: ReturnType<typeof createDefaultCanvasCardState>,
  qrStateByLayerId: CanvasQrStateByLayerId,
  contentTypeByLayerId: Record<string, QrInputType>,
) {
  let nextZIndex = primaryLayers.reduce((max, layer) => Math.max(max, layer.zIndex), 0) + 1;
  let extraIndex = 0;

  for (const nodeId of orderedNodeIds) {
    if (nodeId === primaryNode) {
      continue;
    }

    const nodeState = document.qrStateByNodeId[nodeId] ?? createDefaultCanvasWorkspaceQrState();
    const sourceQrLayer = document.layerStateByNodeId[nodeId]?.find((layer) => layer.kind === "qr");
    const layerId = createAdditionalCanvasQrLayerId(primaryNodeId);
    const nearLayer =
      getQrCanvasLayers(primaryLayers).at(-1) ?? primaryLayers.find((layer) => layer.kind === "qr");

    primaryLayers.push(
      createCanvasQrLayer(primaryNodeId, nodeState, primaryCardState, {
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

    qrStateByLayerId[layerId] = cloneCanvasQrState(nodeState);
    contentTypeByLayerId[layerId] =
      document.contentTypeByNodeId[nodeId] ?? document.selectedContentType;
    nextZIndex += 1;
    extraIndex += 1;
  }
}

export function normalizeCanvasWorkspaceDocument(
  document: CanvasWorkspaceDocumentV1,
): CanvasWorkspaceDocumentV1 {
  const primaryNodeId = DASHBOARD_QR_NODE_ID;
  const orderedNodeIds =
    document.qrOrder.length > 0 ? [...document.qrOrder] : Object.keys(document.qrStateByNodeId);

  if (orderedNodeIds.length <= 1 && orderedNodeIds[0] === primaryNodeId) {
    return normalizeSingleNodeDocument(document, primaryNodeId);
  }

  const primaryNode = orderedNodeIds.includes(primaryNodeId) ? primaryNodeId : orderedNodeIds[0]!;
  const primaryCardState =
    document.cardStateByNodeId[primaryNode] ?? createDefaultCanvasCardState();
  const primaryLayers = (
    document.layerStateByNodeId[primaryNode] ??
    createDefaultCanvasLayers(
      primaryNodeId,
      document.qrStateByNodeId[primaryNode] ?? createDefaultCanvasWorkspaceQrState(),
      primaryCardState,
    )
  ).map(cloneCanvasLayer);
  const qrStateByLayerId: CanvasQrStateByLayerId = {};
  const contentTypeByLayerId: Record<string, QrInputType> = {};

  for (const layer of primaryLayers) {
    if (layer.kind !== "qr") {
      continue;
    }

    qrStateByLayerId[layer.id] = cloneCanvasQrState(
      document.qrStateByLayerId[layer.id] ??
        document.qrStateByNodeId[primaryNode] ??
        createDefaultCanvasWorkspaceQrState(),
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

  const primaryQrLayerId = getCanvasQrLayerId(primaryNodeId);

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
        createDefaultCanvasWorkspaceQrState(),
    },
    sceneCompositionByNodeId: {
      [primaryNodeId]:
        document.sceneCompositionByNodeId[primaryNode] ??
        document.sceneCompositionByNodeId[primaryNodeId] ??
        createDefaultSceneComposition(),
    },
  };
}
