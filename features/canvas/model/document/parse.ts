import {
  createDefaultDraftingCardState,
  normalizeDraftingCardState,
  type DraftingCardState,
} from "@/features/canvas/model/card-state";
import {
  createDefaultDraftingWorkspaceDocument,
  createDefaultDraftingWorkspaceQrState,
  type DraftingCardStateByNodeId,
  type DraftingContentValuesByType,
  type DraftingQrStateByLayerId,
  type DraftingQrStateByNodeId,
  type DraftingWorkspaceDocumentV1,
} from "@/features/canvas/model/document";
import { normalizeDraftingWorkspaceDocument } from "@/features/canvas/model/document/normalize";
import { normalizeCanvasLayers } from "@/features/canvas/model/layers/card-qr";
import { getDraftingQrLayerId } from "@/features/canvas/model/layers/shared";
import { type DraftingLayerStateByNodeId } from "@/features/canvas/model/layers/shared";
import { DASHBOARD_QR_NODE_ID } from "@/features/qr/rendering/compose-scene";
import {
  clampBackgroundShapeEdgeBlur,
  clampBackgroundShapeOffset,
  clampBackgroundShapeOpacity,
  clampBackgroundShapePaddingPx,
  clampBackgroundShapeStrokeWidth,
  clampBackgroundShapeTilt,
  DEFAULT_BACKGROUND_SHAPE_OPTIONS,
  setDotMatrixAnimationOptions,
  type BackgroundShapeOptions,
  type QraftyState,
} from "@/features/qr/model/state";
import { DEFAULT_QR_INPUT_TYPE, type QrInputType } from "@/features/qr/content/input-options";
import type { SceneCompositionByNodeId } from "@/features/canvas/model/apply-scene-template";
import {
  normalizeSceneComposition,
  type SceneCompositionState,
} from "@/features/canvas/model/scene-templates";
import { getDefaultStaticQrValues } from "@/features/qr/content/static-payload";

export function parseDraftingWorkspaceDocument(value: unknown): DraftingWorkspaceDocumentV1 {
  if (typeof value === "string") {
    try {
      return parseDraftingWorkspaceDocument(JSON.parse(value));
    } catch {
      return createDefaultDraftingWorkspaceDocument();
    }
  }

  if (!isRecord(value) || value.version !== 1) {
    return createDefaultDraftingWorkspaceDocument();
  }

  const rawQrStateByNodeId = isRecord(value.qrStateByNodeId) ? value.qrStateByNodeId : {};
  const rawCardStateByNodeId = isRecord(value.cardStateByNodeId) ? value.cardStateByNodeId : {};
  const rawLayerStateByNodeId = isRecord(value.layerStateByNodeId) ? value.layerStateByNodeId : {};
  const qrOrder = Array.isArray(value.qrOrder)
    ? value.qrOrder.filter((nodeId): nodeId is string => typeof nodeId === "string")
    : [];
  const fallback = createDefaultDraftingWorkspaceDocument();
  const orderedNodeIds = qrOrder.filter((nodeId) => isRecord(rawQrStateByNodeId[nodeId]));
  const orderedNodeIdSet = new Set(orderedNodeIds);

  for (const nodeId of Object.keys(rawQrStateByNodeId)) {
    if (!orderedNodeIdSet.has(nodeId) && isRecord(rawQrStateByNodeId[nodeId])) {
      orderedNodeIds.push(nodeId);
      orderedNodeIdSet.add(nodeId);
    }
  }

  if (orderedNodeIds.length === 0) {
    return fallback;
  }

  const qrStateByNodeId: DraftingQrStateByNodeId = {};
  const cardStateByNodeId: DraftingCardStateByNodeId = {};
  const layerStateByNodeId: DraftingLayerStateByNodeId = {};

  for (const nodeId of orderedNodeIds) {
    qrStateByNodeId[nodeId] = parseQrState(rawQrStateByNodeId[nodeId]);
    cardStateByNodeId[nodeId] = parseCardState(rawCardStateByNodeId[nodeId]);
    layerStateByNodeId[nodeId] = normalizeCanvasLayers(
      nodeId,
      rawLayerStateByNodeId[nodeId],
      qrStateByNodeId[nodeId],
      cardStateByNodeId[nodeId],
    );
  }

  const selectedContentType = parseQrInputType(value.selectedContentType);
  const contentValuesByType = parseContentValuesByType(value.contentValuesByType);
  const activeQrNodeId =
    typeof value.activeQrNodeId === "string" && qrStateByNodeId[value.activeQrNodeId]
      ? value.activeQrNodeId
      : orderedNodeIds[0]!;

  if (!contentValuesByType[selectedContentType]) {
    contentValuesByType[selectedContentType] =
      selectedContentType === DEFAULT_QR_INPUT_TYPE
        ? {
            ...getDefaultStaticQrValues(DEFAULT_QR_INPUT_TYPE),
            url:
              qrStateByNodeId[activeQrNodeId]?.data ??
              fallback.qrStateByNodeId[DASHBOARD_QR_NODE_ID]!.data,
          }
        : selectedContentType === "auto" || selectedContentType === "text"
          ? {
              ...getDefaultStaticQrValues(selectedContentType),
              text:
                qrStateByNodeId[activeQrNodeId]?.data ??
                fallback.qrStateByNodeId[DASHBOARD_QR_NODE_ID]!.data,
            }
          : getDefaultStaticQrValues(selectedContentType);
  }

  const contentTypeByNodeId = parseContentTypeByNodeId(
    value.contentTypeByNodeId,
    orderedNodeIds,
    selectedContentType,
  );

  const parsedDocument: DraftingWorkspaceDocumentV1 = {
    activeQrLayerId:
      typeof value.activeQrLayerId === "string"
        ? value.activeQrLayerId
        : getDraftingQrLayerId(activeQrNodeId),
    activeQrNodeId,
    cardStateByNodeId,
    contentTypeByLayerId: parseContentTypeByLayerId(
      value.contentTypeByLayerId,
      layerStateByNodeId,
      contentTypeByNodeId,
      activeQrNodeId,
    ),
    contentTypeByNodeId,
    contentValuesByType,
    layerStateByNodeId,
    qrOrder: orderedNodeIds,
    qrStateByLayerId: parseQrStateByLayerId(
      value.qrStateByLayerId,
      layerStateByNodeId,
      qrStateByNodeId,
      activeQrNodeId,
    ),
    qrStateByNodeId,
    sceneCompositionByNodeId: parseSceneCompositionByNodeId(
      value.sceneCompositionByNodeId,
      orderedNodeIds,
    ),
    selectedContentType,
    version: 1,
  };

  return normalizeDraftingWorkspaceDocument(parsedDocument);
}

function parseQrState(value: unknown): QraftyState {
  const fallback = createDefaultDraftingWorkspaceQrState();

  if (!isRecord(value)) {
    return fallback;
  }
  const clonedValue = structuredClone(value);
  const rawDotMatrixAnimation = isRecord(value.dotMatrixAnimation) ? value.dotMatrixAnimation : {};
  const dotMatrixAnimation = setDotMatrixAnimationOptions(
    {
      ...fallback,
      dotMatrixAnimation: {
        ...fallback.dotMatrixAnimation,
        ...rawDotMatrixAnimation,
      },
    },
    rawDotMatrixAnimation,
  ).dotMatrixAnimation;

  return {
    ...fallback,
    ...clonedValue,
    dotMatrixAnimation,
    backgroundShapeOptions: parseBackgroundShapeOptions(
      isRecord(value.backgroundShapeOptions) ? value.backgroundShapeOptions : undefined,
      fallback,
    ),
  } as QraftyState;
}

function parseBackgroundShapeOptions(
  value: Record<string, unknown> | undefined,
  fallback: QraftyState,
): BackgroundShapeOptions {
  const legacySizePercent = typeof value?.sizePercent === "number" ? value.sizePercent : undefined;
  const legacyPaddingPx =
    legacySizePercent !== undefined && legacySizePercent > 100
      ? ((legacySizePercent - 100) / 200) * fallback.width
      : undefined;

  const num = (key: keyof BackgroundShapeOptions) =>
    typeof value?.[key] === "number" ? (value[key] as number) : undefined;
  const str = (key: keyof BackgroundShapeOptions) =>
    typeof value?.[key] === "string" ? (value[key] as string) : undefined;
  const numField = (
    key: keyof BackgroundShapeOptions,
    clamp: (n: number) => number,
    fallbackValue?: number,
  ) => clamp(num(key) ?? fallbackValue ?? (DEFAULT_BACKGROUND_SHAPE_OPTIONS[key] as number));
  const strField = (key: keyof BackgroundShapeOptions) =>
    str(key) ?? (DEFAULT_BACKGROUND_SHAPE_OPTIONS[key] as string);

  return {
    edgeBlur: numField("edgeBlur", clampBackgroundShapeEdgeBlur),
    paddingPx: numField("paddingPx", clampBackgroundShapePaddingPx, legacyPaddingPx),
    shadowColor: strField("shadowColor"),
    shadowOffsetX: numField("shadowOffsetX", clampBackgroundShapeOffset),
    shadowOffsetY: numField("shadowOffsetY", clampBackgroundShapeOffset),
    shadowOpacity: numField("shadowOpacity", clampBackgroundShapeOpacity),
    strokeColor: strField("strokeColor"),
    strokeOpacity: numField("strokeOpacity", clampBackgroundShapeOpacity),
    strokeWidth: numField("strokeWidth", clampBackgroundShapeStrokeWidth),
    tiltX: numField("tiltX", clampBackgroundShapeTilt),
    tiltY: numField("tiltY", clampBackgroundShapeTilt),
  };
}

function parseCardState(value: unknown): DraftingCardState {
  const fallback = createDefaultDraftingCardState();

  if (!isRecord(value)) {
    return fallback;
  }

  return normalizeDraftingCardState({
    ...fallback,
    ...structuredClone(value),
  } as DraftingCardState);
}

function parseContentValuesByType(value: unknown): DraftingContentValuesByType {
  if (!isRecord(value)) {
    return {};
  }

  return structuredClone(value) as DraftingContentValuesByType;
}

function parseContentTypeByLayerId(
  value: unknown,
  layerStateByNodeId: DraftingLayerStateByNodeId,
  contentTypeByNodeId: Record<string, QrInputType>,
  activeQrNodeId: string,
): Record<string, QrInputType> {
  const raw = isRecord(value) ? value : {};
  const contentTypeByLayerId: Record<string, QrInputType> = {};
  const fallbackType = contentTypeByNodeId[activeQrNodeId] ?? DEFAULT_QR_INPUT_TYPE;

  for (const layers of Object.values(layerStateByNodeId)) {
    for (const layer of layers) {
      if (layer.kind !== "qr") {
        continue;
      }

      contentTypeByLayerId[layer.id] = parseQrInputType(raw[layer.id] ?? fallbackType);
    }
  }

  return contentTypeByLayerId;
}

function parseQrStateByLayerId(
  value: unknown,
  layerStateByNodeId: DraftingLayerStateByNodeId,
  qrStateByNodeId: DraftingQrStateByNodeId,
  activeQrNodeId: string,
): DraftingQrStateByLayerId {
  const raw = isRecord(value) ? value : {};
  const qrStateByLayerId: DraftingQrStateByLayerId = {};
  const fallbackState = qrStateByNodeId[activeQrNodeId] ?? createDefaultDraftingWorkspaceQrState();

  for (const [nodeId, layers] of Object.entries(layerStateByNodeId)) {
    const nodeState = qrStateByNodeId[nodeId] ?? fallbackState;

    for (const layer of layers) {
      if (layer.kind !== "qr") {
        continue;
      }

      qrStateByLayerId[layer.id] = parseQrState(raw[layer.id] ?? nodeState);
    }
  }

  return qrStateByLayerId;
}

function parseContentTypeByNodeId(
  value: unknown,
  nodeIds: string[],
  fallbackType: QrInputType,
): Record<string, QrInputType> {
  const raw = isRecord(value) ? value : {};
  const contentTypeByNodeId: Record<string, QrInputType> = {};

  for (const nodeId of nodeIds) {
    contentTypeByNodeId[nodeId] = parseQrInputType(raw[nodeId] ?? fallbackType);
  }

  return contentTypeByNodeId;
}

function parseQrInputType(value: unknown): QrInputType {
  return typeof value === "string" ? (value as QrInputType) : DEFAULT_QR_INPUT_TYPE;
}

function parseSceneCompositionByNodeId(
  value: unknown,
  nodeIds: string[],
): SceneCompositionByNodeId {
  const raw = isRecord(value) ? value : {};
  const compositions: SceneCompositionByNodeId = {};

  for (const nodeId of nodeIds) {
    compositions[nodeId] = normalizeSceneComposition(
      isRecord(raw[nodeId]) ? (raw[nodeId] as SceneCompositionState) : undefined,
    );
  }

  return compositions;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
