import { cloneCanvasCardState, type CanvasCardState } from "@/features/canvas/model/card-state";
import { cloneCanvasLayer } from "@/features/canvas/model/layers/fallback";
import type { CanvasLayer } from "@/features/canvas/model/layers/shared";
import { createDefaultQraftyState, type QraftyState } from "@/features/qr/model/state";
import { type QrInputType } from "@/features/qr/content/input-options";
import { type StaticQrContentValues } from "@/features/qr/content/static-payload";

export type CanvasQrStateByLayerId = Record<string, QraftyState>;
export type CanvasContentValuesByType = Partial<Record<QrInputType, StaticQrContentValues>>;

/**
 * The workspace document is a single canvas board. Per-QR state is indexed by
 * layer id (`qrStateByLayerId` / `contentTypeByLayerId`) — the only multi-entry
 * axis that exists — and the card and layer stack are flat fields.
 */
export type CanvasWorkspaceDocument = {
  activeQrLayerId: string;
  cardState: CanvasCardState;
  contentTypeByLayerId: Record<string, QrInputType>;
  contentValuesByType: CanvasContentValuesByType;
  layers: CanvasLayer[];
  qrStateByLayerId: CanvasQrStateByLayerId;
  selectedContentType: QrInputType;
};

const DEFAULT_PANE_QR_SIZE = 240;

export function cloneCanvasWorkspaceDocument(
  document: CanvasWorkspaceDocument,
): CanvasWorkspaceDocument {
  return {
    activeQrLayerId: document.activeQrLayerId,
    cardState: cloneCanvasCardState(document.cardState),
    contentTypeByLayerId: structuredClone(document.contentTypeByLayerId),
    contentValuesByType: structuredClone(document.contentValuesByType),
    layers: document.layers.map(cloneCanvasLayer),
    qrStateByLayerId: Object.fromEntries(
      Object.entries(document.qrStateByLayerId).map(([layerId, state]) => [
        layerId,
        cloneCanvasQrState(state),
      ]),
    ),
    selectedContentType: document.selectedContentType,
  };
}

export function serializeCanvasWorkspaceDocument(document: CanvasWorkspaceDocument): string {
  return JSON.stringify(cloneCanvasWorkspaceDocument(document));
}

export function createDefaultCanvasWorkspaceQrState(): QraftyState {
  const state = createDefaultQraftyState();

  state.width = DEFAULT_PANE_QR_SIZE;
  state.height = DEFAULT_PANE_QR_SIZE;

  return state;
}

export function cloneCanvasQrState(state: QraftyState): QraftyState {
  return structuredClone(state);
}
