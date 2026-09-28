import { DEFAULT_QR_INPUT_TYPE, type QrInputType } from "@/features/qr/content/input-options";
import type { QraftyState } from "@/features/qr/model/state";
import type {
  CanvasContentValuesByType,
  CanvasQrStateByLayerId,
  CanvasWorkspaceDocument,
} from "@/features/canvas/model/document";
import { type CanvasCardState } from "@/features/canvas/model/card-state";
import { getQrCanvasLayers, type CanvasLayer } from "@/features/canvas/model/layers/shared";

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
  cardState: CanvasCardState;
  contentTypeByLayerId: Record<string, QrInputType>;
  contentValuesByType: CanvasContentValuesByType;
  canvasQraftyState: QraftyState;
  layers: CanvasLayer[];
  qrStateByLayerId: CanvasQrStateByLayerId;
  selectedContentType: QrInputType;
};

export function buildCanvasWorkspaceDocument({
  activeQrLayerId,
  cardState,
  contentTypeByLayerId,
  contentValuesByType,
  canvasQraftyState,
  layers,
  qrStateByLayerId,
  selectedContentType,
}: BuildCanvasWorkspaceDocumentInput): CanvasWorkspaceDocument {
  const nextQrStateByLayerId = mergeLiveQrStateByLayerId({
    qrStateByLayerId,
    activeQrLayerId,
    canvasLayers: layers,
    canvasQraftyState,
  });
  const nextContentTypeByLayerId: Record<string, QrInputType> = {
    ...contentTypeByLayerId,
    [activeQrLayerId]: selectedContentType,
  };

  for (const layer of getQrCanvasLayers(layers)) {
    if (!nextContentTypeByLayerId[layer.id]) {
      nextContentTypeByLayerId[layer.id] = DEFAULT_QR_INPUT_TYPE;
    }
  }

  return {
    activeQrLayerId,
    cardState,
    contentTypeByLayerId: nextContentTypeByLayerId,
    contentValuesByType,
    layers,
    qrStateByLayerId: nextQrStateByLayerId,
    selectedContentType,
  };
}
