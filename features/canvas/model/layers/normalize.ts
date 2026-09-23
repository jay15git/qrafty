import { createFallbackLayer } from "@/features/canvas/model/layers/fallback";
import { normalizeImageDraftingCanvasLayer } from "@/features/canvas/model/layers/image";
import { normalizeShaderDraftingCanvasLayer } from "@/features/canvas/model/layers/shader";
import { normalizeShapeDraftingCanvasLayer } from "@/features/canvas/model/layers/shape";
import { normalizeTextDraftingCanvasLayer } from "@/features/canvas/model/layers/text";
import {
  isRecord,
  normalizeSharedDraftingCanvasLayerFields,
  readFiniteNumber,
  type DraftingCanvasLayer,
  type DraftingCanvasLayerKind,
  type NormalizeDraftingLayerContext,
} from "@/features/canvas/model/layers/shared";

export function normalizeDraftingCanvasLayer(
  nodeId: string,
  value: unknown,
  fallbackLayers: DraftingCanvasLayer[],
): DraftingCanvasLayer | null {
  if (!isRecord(value)) {
    return null;
  }

  const kind = getDraftingCanvasLayerKind(value.kind);

  if (!kind) {
    return null;
  }

  const fallback = getDraftingLayerFallback(nodeId, kind, fallbackLayers);
  const width = readFiniteNumber(value.width, fallback.width);
  const height = readFiniteNumber(value.height, fallback.height);

  const context = {
    fallback,
    fallbackLayers,
    height,
    kind,
    nodeId,
    value,
    width,
  };

  if (kind === "qr") {
    return normalizeQrDraftingCanvasLayer({ ...context, kind });
  }

  if (kind === "text") {
    return normalizeTextDraftingCanvasLayer({ ...context, kind });
  }

  if (kind === "image") {
    return normalizeImageDraftingCanvasLayer({ ...context, kind });
  }

  if (kind === "shape") {
    return normalizeShapeDraftingCanvasLayer({ ...context, kind });
  }

  if (kind === "group") {
    return normalizeGroupDraftingCanvasLayer({ ...context, kind });
  }

  if (kind === "shader") {
    return normalizeShaderDraftingCanvasLayer({ ...context, kind });
  }

  return normalizeNonTextDraftingCanvasLayer({ ...context, kind });
}

function getDraftingCanvasLayerKind(value: unknown): DraftingCanvasLayerKind | null {
  return value === "card" ||
    value === "group" ||
    value === "image" ||
    value === "qr" ||
    value === "shape" ||
    value === "shader" ||
    value === "text"
    ? value
    : null;
}

function getDraftingLayerFallback(
  nodeId: string,
  kind: DraftingCanvasLayerKind,
  fallbackLayers: DraftingCanvasLayer[],
) {
  return fallbackLayers.find((layer) => layer.kind === kind) ?? createFallbackLayer(nodeId, kind);
}

function normalizeNonTextDraftingCanvasLayer(
  context: NormalizeDraftingLayerContext & { kind: "card" },
): DraftingCanvasLayer {
  return {
    ...normalizeSharedDraftingCanvasLayerFields(context),
    kind: context.kind,
  } satisfies DraftingCanvasLayer;
}

function normalizeQrDraftingCanvasLayer(
  context: NormalizeDraftingLayerContext & { kind: "qr" },
): DraftingCanvasLayer {
  const width = Math.max(1, context.width);

  return {
    ...normalizeSharedDraftingCanvasLayerFields(context),
    height: width,
    kind: "qr",
    width,
  } satisfies DraftingCanvasLayer;
}

function normalizeGroupDraftingCanvasLayer(
  context: NormalizeDraftingLayerContext & { kind: "group" },
): DraftingCanvasLayer {
  return {
    ...normalizeSharedDraftingCanvasLayerFields(context),
    children: normalizeDraftingGroupChildren(context),
    kind: "group",
  } satisfies DraftingCanvasLayer;
}

function normalizeDraftingGroupChildren({
  fallbackLayers,
  nodeId,
  value,
}: NormalizeDraftingLayerContext) {
  if (!Array.isArray(value.children)) {
    return undefined;
  }

  return value.children
    .map((child): DraftingCanvasLayer | null =>
      normalizeDraftingCanvasLayer(nodeId, child, fallbackLayers),
    )
    .filter((child): child is DraftingCanvasLayer => Boolean(child));
}
