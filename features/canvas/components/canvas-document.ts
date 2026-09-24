import { DEFAULT_QR_INPUT_TYPE, type QrInputType } from "@/features/qr/content/input-options";
import type { QraftyState } from "@/features/qr/model/state";
import { DASHBOARD_QR_NODE_ID } from "@/features/qr/rendering/compose-scene";
import type {
  CanvasCardStateByNodeId,
  CanvasContentValuesByType,
  CanvasQrStateByLayerId,
  CanvasQrStateByNodeId,
  CanvasWorkspaceDocumentV1,
} from "@/features/canvas/model/document";
import { type SceneCompositionByNodeId } from "@/features/canvas/model/apply-scene-template";
import { type CanvasCardState } from "@/features/canvas/model/card-state";
import {
  getCanvasQrLayerId,
  getQrCanvasLayers,
  type CanvasLayer,
  type CanvasLayerStateByNodeId,
} from "@/features/canvas/model/layers/shared";
import { createDefaultCanvasLayers } from "@/features/canvas/model/layers/card-qr";

export function resolveActiveQrLayerIdFromLayers(
  activeQrLayerId: string,
  canvasLayers: CanvasLayer[],
  selectedLayerId: string | null = null,
): string {
  const qrLayers = getQrCanvasLayers(canvasLayers);

  if (qrLayers.some((layer) => layer.id === activeQrLayerId)) {
    return activeQrLayerId;
  }

  if (selectedLayerId && qrLayers.some((layer) => layer.id === selectedLayerId)) {
    return selectedLayerId;
  }

  return qrLayers[0]?.id ?? activeQrLayerId;
}

export function mergeLiveQrStateByLayerId({
  qrStateByLayerId,
  activeQrLayerId,
  canvasLayers,
  canvasQraftyState,
  selectedLayerId = null,
}: {
  qrStateByLayerId: CanvasQrStateByLayerId;
  activeQrLayerId: string;
  canvasLayers: CanvasLayer[];
  canvasQraftyState: QraftyState;
  selectedLayerId?: string | null;
}): CanvasQrStateByLayerId {
  const merged: CanvasQrStateByLayerId = {
    ...qrStateByLayerId,
    [activeQrLayerId]: canvasQraftyState,
  };
  const qrLayers = getQrCanvasLayers(canvasLayers);
  const activeLayerOnCanvas = qrLayers.some((layer) => layer.id === activeQrLayerId);

  for (const layer of qrLayers) {
    const isLiveEditingTarget =
      layer.id === activeQrLayerId ||
      layer.id === selectedLayerId ||
      (!activeLayerOnCanvas && qrLayers.length === 1);

    if (isLiveEditingTarget) {
      merged[layer.id] = canvasQraftyState;
      continue;
    }

    if (!merged[layer.id]) {
      merged[layer.id] = qrStateByLayerId[layer.id] ?? canvasQraftyState;
    }
  }

  return merged;
}

export type BuildCanvasWorkspaceDocumentInput = {
  activeQrLayerId: string;
  activeQrNodeId: string;
  cardStateByNodeId: CanvasCardStateByNodeId;
  contentTypeByLayerId: Record<string, QrInputType>;
  contentTypeByNodeId: Record<string, QrInputType>;
  contentValuesByType: CanvasContentValuesByType;
  canvasQraftyState: QraftyState;
  layerStateByNodeId: CanvasLayerStateByNodeId;
  qrStateByLayerId: CanvasQrStateByLayerId;
  sceneCompositionByNodeId: SceneCompositionByNodeId;
  selectedCardState: CanvasCardState;
  selectedContentType: QrInputType;
};

export function buildCanvasWorkspaceDocumentFromState({
  activeQrLayerId,
  activeQrNodeId,
  cardStateByNodeId,
  contentTypeByLayerId,
  contentTypeByNodeId,
  contentValuesByType,
  canvasQraftyState,
  layerStateByNodeId,
  qrStateByLayerId,
  sceneCompositionByNodeId,
  selectedCardState,
  selectedContentType,
}: BuildCanvasWorkspaceDocumentInput): CanvasWorkspaceDocumentV1 {
  const nodeId = DASHBOARD_QR_NODE_ID;
  const layers =
    layerStateByNodeId[nodeId] ??
    createDefaultCanvasLayers(nodeId, canvasQraftyState, selectedCardState);
  const nextQrStateByLayerId = mergeLiveQrStateByLayerId({
    qrStateByLayerId,
    activeQrLayerId,
    canvasLayers: layers,
    canvasQraftyState,
  });

  const primaryQrLayerId = getCanvasQrLayerId(nodeId);
  const nextContentTypeByLayerId: Record<string, QrInputType> = {
    ...contentTypeByLayerId,
    [activeQrLayerId]: selectedContentType,
  };

  for (const layer of getQrCanvasLayers(layers)) {
    if (!nextContentTypeByLayerId[layer.id]) {
      nextContentTypeByLayerId[layer.id] = DEFAULT_QR_INPUT_TYPE;
    }
  }

  const primaryState =
    nextQrStateByLayerId[primaryQrLayerId] ??
    nextQrStateByLayerId[activeQrLayerId] ??
    canvasQraftyState;

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
    } satisfies CanvasQrStateByNodeId,
    sceneCompositionByNodeId,
    selectedContentType,
    version: 1,
  };
}
