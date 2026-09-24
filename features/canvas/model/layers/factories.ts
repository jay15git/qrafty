import { createDefaultDraftingCardPaperShader } from "@/features/canvas/model/card-state";
import type { PaperShaderId } from "@/features/canvas/rendering/paper-shader-definitions";
import { createFallbackLayer } from "@/features/canvas/model/layers/fallback";
import { patchCanvasLayer } from "@/features/canvas/model/layers/patch";
import { normalizeElementShapeId } from "@/features/canvas/model/layers/shape";
import {
  DEFAULT_DRAFTING_SHAPE_LAYER,
  type CanvasLayer,
  type DraftingElementShapeId,
} from "@/features/canvas/model/layers/shared";

export function createDraftingTextLayer(
  nodeId: string,
  options: Partial<CanvasLayer> = {},
): CanvasLayer {
  const layer = createFallbackLayer(nodeId, "text");
  const fontOptions =
    typeof options.fontFamily === "string" && !("fontId" in options) ? { fontId: undefined } : null;

  return patchCanvasLayer(
    {
      ...layer,
      ...options,
      ...fontOptions,
      kind: "text",
    },
    {},
  );
}

export function createDraftingImageLayer(
  nodeId: string,
  options: Partial<CanvasLayer> = {},
): CanvasLayer {
  return patchCanvasLayer(
    {
      ...createFallbackLayer(nodeId, "image"),
      ...options,
      kind: "image",
    },
    {},
  );
}

export function createDraftingShaderLayer(
  nodeId: string,
  shaderId: PaperShaderId = "mesh-gradient",
  options: Partial<CanvasLayer> = {},
): CanvasLayer {
  return patchCanvasLayer(
    {
      ...createFallbackLayer(nodeId, "shader"),
      ...options,
      kind: "shader",
      paperShader: createDefaultDraftingCardPaperShader(shaderId),
    },
    {},
  );
}

export function createDraftingShapeLayer(
  nodeId: string,
  shapeId: DraftingElementShapeId = DEFAULT_DRAFTING_SHAPE_LAYER.shapeId,
  options: Partial<CanvasLayer> = {},
): CanvasLayer {
  const resolvedShapeId =
    typeof shapeId === "string"
      ? normalizeElementShapeId(shapeId, DEFAULT_DRAFTING_SHAPE_LAYER.shapeId)
      : DEFAULT_DRAFTING_SHAPE_LAYER.shapeId;
  const isStrokePrimitive = resolvedShapeId === "line" || resolvedShapeId === "arrow";

  return patchCanvasLayer(
    {
      ...createFallbackLayer(nodeId, "shape"),
      ...options,
      kind: "shape",
      shapeId: resolvedShapeId,
      ...(isStrokePrimitive
        ? {
            fillMode: options.fillMode ?? "none",
            stroke: options.stroke ?? options.fill ?? DEFAULT_DRAFTING_SHAPE_LAYER.fill,
            strokeWidth: options.strokeWidth ?? 4,
          }
        : null),
    },
    {},
  );
}
