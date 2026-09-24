import {
  cloneCanvasCardState,
  createDefaultCanvasCardState,
  type CanvasCardState,
} from "@/features/canvas/model/card-state";
import { createDefaultCanvasLayers } from "@/features/canvas/model/layers/card-qr";
import { getCanvasQrLayerId } from "@/features/canvas/model/layers/shared";
import { cloneCanvasLayerStateByNodeId } from "@/features/canvas/model/layers/fallback";
import type { CanvasLayerStateByNodeId } from "@/features/canvas/model/layers/shared";
import { DASHBOARD_QR_NODE_ID } from "@/features/qr/rendering/compose-scene";
import { createDefaultQraftyState, type QraftyState } from "@/features/qr/model/state";
import { DEFAULT_QR_INPUT_TYPE, type QrInputType } from "@/features/qr/content/input-options";
import {
  cloneSceneCompositionByNodeId,
  createDefaultSceneCompositionByNodeId,
  type SceneCompositionByNodeId,
} from "@/features/canvas/model/apply-scene-template";
import {
  getDefaultStaticQrValues,
  type StaticQrContentValues,
} from "@/features/qr/content/static-payload";

export type CanvasQrStateByNodeId = Record<string, QraftyState>;
export type CanvasCardStateByNodeId = Record<string, CanvasCardState>;
export type CanvasContentValuesByType = Partial<Record<QrInputType, StaticQrContentValues>>;

export type CanvasQrStateByLayerId = Record<string, QraftyState>;

export type CanvasWorkspaceDocumentV1 = {
  activeQrLayerId: string;
  activeQrNodeId: string;
  cardStateByNodeId: CanvasCardStateByNodeId;
  contentTypeByLayerId: Record<string, QrInputType>;
  contentTypeByNodeId: Record<string, QrInputType>;
  contentValuesByType: CanvasContentValuesByType;
  layerStateByNodeId: CanvasLayerStateByNodeId;
  qrOrder: string[];
  qrStateByLayerId: CanvasQrStateByLayerId;
  qrStateByNodeId: CanvasQrStateByNodeId;
  sceneCompositionByNodeId: SceneCompositionByNodeId;
  selectedContentType: QrInputType;
  version: 1;
};

const DEFAULT_DRAFTING_PANE_QR_SIZE = 240;

export function cloneCanvasWorkspaceDocument(
  document: CanvasWorkspaceDocumentV1,
): CanvasWorkspaceDocumentV1 {
  return {
    activeQrLayerId: document.activeQrLayerId,
    activeQrNodeId: document.activeQrNodeId,
    cardStateByNodeId: Object.fromEntries(
      Object.entries(document.cardStateByNodeId).map(([nodeId, state]) => [
        nodeId,
        cloneCanvasCardState(state),
      ]),
    ),
    contentTypeByLayerId: structuredClone(document.contentTypeByLayerId),
    contentTypeByNodeId: structuredClone(document.contentTypeByNodeId),
    contentValuesByType: structuredClone(document.contentValuesByType),
    layerStateByNodeId: cloneCanvasLayerStateByNodeId(document.layerStateByNodeId),
    qrOrder: [...document.qrOrder],
    qrStateByLayerId: Object.fromEntries(
      Object.entries(document.qrStateByLayerId).map(([layerId, state]) => [
        layerId,
        cloneCanvasQrState(state),
      ]),
    ),
    qrStateByNodeId: Object.fromEntries(
      Object.entries(document.qrStateByNodeId).map(([nodeId, state]) => [
        nodeId,
        cloneCanvasQrState(state),
      ]),
    ),
    sceneCompositionByNodeId: cloneSceneCompositionByNodeId(document.sceneCompositionByNodeId),
    selectedContentType: document.selectedContentType,
    version: 1,
  };
}

export function createDefaultCanvasWorkspaceDocument(): CanvasWorkspaceDocumentV1 {
  const qrState = createDefaultCanvasWorkspaceQrState();
  const cardState = createDefaultCanvasCardState();
  const primaryQrLayerId = getCanvasQrLayerId(DASHBOARD_QR_NODE_ID);
  const document: CanvasWorkspaceDocumentV1 = {
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
      [DASHBOARD_QR_NODE_ID]: createDefaultCanvasLayers(DASHBOARD_QR_NODE_ID, qrState, cardState),
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
  };

  document.sceneCompositionByNodeId = createDefaultSceneCompositionByNodeId(document);

  return document;
}

export function serializeCanvasWorkspaceDocument(document: CanvasWorkspaceDocumentV1): string {
  return JSON.stringify(cloneCanvasWorkspaceDocument(document));
}

export function createDefaultCanvasWorkspaceQrState(): QraftyState {
  const state = createDefaultQraftyState();

  state.width = DEFAULT_DRAFTING_PANE_QR_SIZE;
  state.height = DEFAULT_DRAFTING_PANE_QR_SIZE;

  return state;
}

export function cloneCanvasQrState(state: QraftyState): QraftyState {
  return structuredClone(state);
}
