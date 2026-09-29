import { createFallbackLayer } from "@/features/canvas/model/layers/fallback";
import { patchCanvasLayer } from "@/features/canvas/model/layers/patch";
import { normalizeElementShapeId } from "@/features/canvas/model/layers/shape";
import { nonePaint, paintSolidColor } from "@/features/canvas/model/paint";
import {
  DEFAULT_SHAPE_LAYER,
  type CanvasLayer,
  type CanvasElementShapeId,
} from "@/features/canvas/model/layers/shared";

export function createCanvasTextLayer(
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

export function createCanvasImageLayer(
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

export function createCanvasShapeLayer(
  nodeId: string,
  shapeId: CanvasElementShapeId = DEFAULT_SHAPE_LAYER.shapeId,
  options: Partial<CanvasLayer> = {},
): CanvasLayer {
  const resolvedShapeId =
    typeof shapeId === "string"
      ? normalizeElementShapeId(shapeId, DEFAULT_SHAPE_LAYER.shapeId)
      : DEFAULT_SHAPE_LAYER.shapeId;
  const isStrokePrimitive = resolvedShapeId === "line" || resolvedShapeId === "arrow";

  return patchCanvasLayer(
    {
      ...createFallbackLayer(nodeId, "shape"),
      ...options,
      kind: "shape",
      shapeId: resolvedShapeId,
      ...(isStrokePrimitive
        ? {
            fill: options.fill ?? nonePaint(),
            stroke:
              options.stroke ??
              paintSolidColor(options.fill ?? DEFAULT_SHAPE_LAYER.fill, DEFAULT_SHAPE_LAYER.stroke),
            strokeWidth: options.strokeWidth ?? 4,
          }
        : null),
    },
    {},
  );
}
