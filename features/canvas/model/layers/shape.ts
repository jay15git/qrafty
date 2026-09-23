import {
  normalizeBorderStyle,
} from "@/features/canvas/model/effects"
import type { QraftyGradient } from "@/features/qr/model/state"
import {
  clamp,
  DEFAULT_DRAFTING_SHAPE_LAYER,
  normalizeDraftingLayerBorderSides,
  normalizeHexColor,
  normalizeImageSourceMode,
  normalizeLayerCornerRadiusFields,
  normalizeShapeFillGradient,
  normalizeSharedDraftingCanvasLayerFields,
  readFiniteNumber,
  type DraftingCanvasLayer,
  type DraftingElementShapeId,
  type DraftingShapeFillMode,
  type DraftingShapePrimitiveId,
  type NormalizeDraftingLayerContext,
} from "@/features/canvas/model/layers/shared"

export function normalizeShapeDraftingCanvasLayer(
  context: NormalizeDraftingLayerContext & { kind: "shape" },
): DraftingCanvasLayer {
  const { fallback, value } = context

  return {
    ...normalizeSharedDraftingCanvasLayerFields(context),
    borderSides: normalizeDraftingLayerBorderSides(value.borderSides, fallback.borderSides),
    ...normalizeLayerCornerRadiusFields(
      value,
      fallback,
      DEFAULT_DRAFTING_SHAPE_LAYER.cornerRadius,
    ),
    fill: normalizeHexColor(value.fill, fallback.fill ?? DEFAULT_DRAFTING_SHAPE_LAYER.fill),
    fillGradient: normalizeShapeFillGradient(value.fillGradient, fallback.fillGradient),
    fillMode: normalizeShapeFillMode(value.fillMode, fallback.fillMode),
    imageFit:
      value.imageFit === "contain" || value.imageFit === "cover"
        ? value.imageFit
        : fallback.imageFit,
    imageSource: normalizeImageSourceMode(value.imageSource, fallback.imageSource),
    imageValue: typeof value.imageValue === "string" ? value.imageValue : fallback.imageValue,
    kind: "shape",
    shapeId: normalizeElementShapeId(value.shapeId, fallback.shapeId),
    stroke: normalizeHexColor(value.stroke, fallback.stroke ?? DEFAULT_DRAFTING_SHAPE_LAYER.stroke),
    strokeOpacity: clamp(
      readFiniteNumber(value.strokeOpacity, fallback.strokeOpacity ?? DEFAULT_DRAFTING_SHAPE_LAYER.strokeOpacity),
      0,
      100,
    ),
    strokeStyle: normalizeBorderStyle(
      value.strokeStyle,
      fallback.strokeStyle ?? DEFAULT_DRAFTING_SHAPE_LAYER.strokeStyle,
    ),
    strokeWidth: clamp(
      readFiniteNumber(value.strokeWidth, fallback.strokeWidth ?? DEFAULT_DRAFTING_SHAPE_LAYER.strokeWidth),
      0,
      64,
    ),
  } satisfies DraftingCanvasLayer
}

function normalizeShapeFillMode(
  value: unknown,
  fallback: DraftingShapeFillMode | undefined,
): DraftingShapeFillMode {
  if (value === "gradient" || value === "image" || value === "none" || value === "solid") {
    return value
  }

  return fallback ?? DEFAULT_DRAFTING_SHAPE_LAYER.fillMode
}

const DRAFTING_SHAPE_PRIMITIVE_IDS = new Set<DraftingShapePrimitiveId>([
  "arrow",
  "ellipse",
  "line",
  "rect",
])

const DRAFTING_ELEMENT_SHAPE_IDS = new Set<DraftingElementShapeId>([
  "arrow",
  "arch",
  "arc-cross",
  "atom",
  "bubble-plus",
  "butterfly",
  "circle",
  "curved-squircle",
  "diamond-ring",
  "diagonal-pill",
  "eight-point-star",
  "ellipse",
  "flower",
  "folded-pentagon",
  "four-lobes",
  "gear-bloom",
  "heart",
  "burst-star",
  "blob",
  "dome",
  "pentagon",
  "plus",
  "sun-scallop",
  "sparkle",
  "rosette",
  "cross-burst",
  "diamond",
  "octagon-star",
  "seal-badge",
  "hexagon-flat",
  "octagon-flat",
  "quarter-circle",
  "tag",
  "soft-star",
  "teardrop",
  "squircle-octagon",
  "clover-cross",
  "ghost",
  "hexagon",
  "hourglass",
  "line",
  "notched-badge",
  "notched-diamond",
  "organic-seal",
  "ornate-star",
  "propeller",
  "rect",
  "rounded-square",
  "scallop-seal",
  "skew-card",
  "soft-cross",
  "spark",
  "disc-clover",
  "orb-bloom",
  "orb-flower",
  "pointed-shield",
  "pinched-seal",
  "quad-bloom",
  "quarter-cross",
  "soft-quarter-cross",
  "triple-bloom",
  "wave-square",
  "woven-bloom",
  "wavy-badge",
])

export function normalizeElementShapeId(
  value: unknown,
  fallback: DraftingElementShapeId | undefined,
): DraftingElementShapeId {
  if (typeof value === "string" && DRAFTING_ELEMENT_SHAPE_IDS.has(value as DraftingElementShapeId)) {
    return value as DraftingElementShapeId
  }

  return fallback ?? DEFAULT_DRAFTING_SHAPE_LAYER.shapeId
}
