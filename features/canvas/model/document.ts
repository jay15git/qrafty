import {
  cloneDraftingCardState,
  createDefaultDraftingCardState,
  type DraftingCardState,
} from "@/features/canvas/model/card-state";
import { createDefaultDraftingLayers } from "@/features/canvas/model/layers/card-qr";
import { getDraftingQrLayerId } from "@/features/canvas/model/layers/shared";
import { cloneDraftingLayerStateByNodeId } from "@/features/canvas/model/layers/fallback";
import type { DraftingLayerStateByNodeId } from "@/features/canvas/model/layers/shared";
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

export type DraftingQrStateByNodeId = Record<string, QraftyState>;
export type DraftingCardStateByNodeId = Record<string, DraftingCardState>;
export type DraftingContentValuesByType = Partial<Record<QrInputType, StaticQrContentValues>>;

export type DraftingQrStateByLayerId = Record<string, QraftyState>;

export type DraftingWorkspaceDocumentV1 = {
  activeQrLayerId: string;
  activeQrNodeId: string;
  cardStateByNodeId: DraftingCardStateByNodeId;
  contentTypeByLayerId: Record<string, QrInputType>;
  contentTypeByNodeId: Record<string, QrInputType>;
  contentValuesByType: DraftingContentValuesByType;
  layerStateByNodeId: DraftingLayerStateByNodeId;
  qrOrder: string[];
  qrStateByLayerId: DraftingQrStateByLayerId;
  qrStateByNodeId: DraftingQrStateByNodeId;
  sceneCompositionByNodeId: SceneCompositionByNodeId;
  selectedContentType: QrInputType;
  version: 1;
};

const DEFAULT_DRAFTING_PANE_QR_SIZE = 240;

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
  };
}

export function createDefaultDraftingWorkspaceDocument(): DraftingWorkspaceDocumentV1 {
  const qrState = createDefaultDraftingWorkspaceQrState();
  const cardState = createDefaultDraftingCardState();
  const primaryQrLayerId = getDraftingQrLayerId(DASHBOARD_QR_NODE_ID);
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
      [DASHBOARD_QR_NODE_ID]: createDefaultDraftingLayers(DASHBOARD_QR_NODE_ID, qrState, cardState),
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

export function serializeDraftingWorkspaceDocument(document: DraftingWorkspaceDocumentV1): string {
  return JSON.stringify(cloneDraftingWorkspaceDocument(document));
}

export function createDefaultDraftingWorkspaceQrState(): QraftyState {
  const state = createDefaultQraftyState();

  state.width = DEFAULT_DRAFTING_PANE_QR_SIZE;
  state.height = DEFAULT_DRAFTING_PANE_QR_SIZE;

  return state;
}

export function cloneDraftingQrState(state: QraftyState): QraftyState {
  return structuredClone(state);
}
