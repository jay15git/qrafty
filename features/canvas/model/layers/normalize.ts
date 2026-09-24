import { createFallbackLayer } from "@/features/canvas/model/layers/fallback";
import { normalizeImageCanvasLayer } from "@/features/canvas/model/layers/image";
import { normalizeShaderCanvasLayer } from "@/features/canvas/model/layers/shader";
import { normalizeShapeCanvasLayer } from "@/features/canvas/model/layers/shape";
import { normalizeTextCanvasLayer } from "@/features/canvas/model/layers/text";
import {
  isRecord,
  normalizeSharedCanvasLayerFields,
  readFiniteNumber,
  type CanvasLayer,
  type CanvasLayerKind,
  type NormalizeCanvasLayerContext,
} from "@/features/canvas/model/layers/shared";

export function normalizeCanvasLayer(
  nodeId: string,
  value: unknown,
  fallbackLayers: CanvasLayer[],
): CanvasLayer | null {
  if (!isRecord(value)) {
    return null;
  }

  const kind = getCanvasLayerKind(value.kind);

  if (!kind) {
    return null;
  }

  const fallback = getCanvasLayerFallback(nodeId, kind, fallbackLayers);
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
    return normalizeQrCanvasLayer({ ...context, kind });
  }

  if (kind === "text") {
    return normalizeTextCanvasLayer({ ...context, kind });
  }

  if (kind === "image") {
    return normalizeImageCanvasLayer({ ...context, kind });
  }

  if (kind === "shape") {
    return normalizeShapeCanvasLayer({ ...context, kind });
  }

  if (kind === "group") {
    return normalizeGroupCanvasLayer({ ...context, kind });
  }

  if (kind === "shader") {
    return normalizeShaderCanvasLayer({ ...context, kind });
  }

  return normalizeNonTextCanvasLayer({ ...context, kind });
}

function getCanvasLayerKind(value: unknown): CanvasLayerKind | null {
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

function getCanvasLayerFallback(
  nodeId: string,
  kind: CanvasLayerKind,
  fallbackLayers: CanvasLayer[],
) {
  return fallbackLayers.find((layer) => layer.kind === kind) ?? createFallbackLayer(nodeId, kind);
}

function normalizeNonTextCanvasLayer(
  context: NormalizeCanvasLayerContext & { kind: "card" },
): CanvasLayer {
  return {
    ...normalizeSharedCanvasLayerFields(context),
    kind: context.kind,
  } satisfies CanvasLayer;
}

function normalizeQrCanvasLayer(
  context: NormalizeCanvasLayerContext & { kind: "qr" },
): CanvasLayer {
  const width = Math.max(1, context.width);

  return {
    ...normalizeSharedCanvasLayerFields(context),
    height: width,
    kind: "qr",
    width,
  } satisfies CanvasLayer;
}

function normalizeGroupCanvasLayer(
  context: NormalizeCanvasLayerContext & { kind: "group" },
): CanvasLayer {
  return {
    ...normalizeSharedCanvasLayerFields(context),
    children: normalizeCanvasGroupChildren(context),
    kind: "group",
  } satisfies CanvasLayer;
}

function normalizeCanvasGroupChildren({
  fallbackLayers,
  nodeId,
  value,
}: NormalizeCanvasLayerContext) {
  if (!Array.isArray(value.children)) {
    return undefined;
  }

  return value.children
    .map((child): CanvasLayer | null => normalizeCanvasLayer(nodeId, child, fallbackLayers))
    .filter((child): child is CanvasLayer => Boolean(child));
}
