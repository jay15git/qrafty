import {
  normalizeSvgPaintColor,
  type CanvasIllustrationColorStop,
} from "@/features/canvas/assets/illustration-recolor";
import {
  DEFAULT_DRAFTING_IMAGE_LAYER,
  isRecord,
  normalizeCanvasLayerBorderSides,
  normalizeImageSourceMode,
  normalizeLayerCornerRadiusFields,
  normalizeSharedCanvasLayerFields,
  type CanvasLayer,
  type NormalizeCanvasLayerContext,
} from "@/features/canvas/model/layers/shared";

export function normalizeImageCanvasLayer(
  context: NormalizeCanvasLayerContext & { kind: "image" },
): CanvasLayer {
  const { fallback, value } = context;

  return {
    ...normalizeSharedCanvasLayerFields(context),
    borderSides: normalizeCanvasLayerBorderSides(value.borderSides, fallback.borderSides),
    ...normalizeLayerCornerRadiusFields(value, fallback, DEFAULT_DRAFTING_IMAGE_LAYER.cornerRadius),
    imageFit:
      value.imageFit === "contain" || value.imageFit === "cover"
        ? value.imageFit
        : (fallback.imageFit ?? DEFAULT_DRAFTING_IMAGE_LAYER.imageFit),
    imageSource: normalizeImageSourceMode(value.imageSource, fallback.imageSource),
    imageValue:
      typeof value.imageValue === "string"
        ? value.imageValue
        : (fallback.imageValue ?? DEFAULT_DRAFTING_IMAGE_LAYER.imageValue),
    illustrationColorStops: normalizeIllustrationColorStops(
      value.illustrationColorStops,
      fallback.illustrationColorStops,
    ),
    kind: "image",
  } satisfies CanvasLayer;
}

function normalizeIllustrationColorStops(
  value: unknown,
  fallback: CanvasIllustrationColorStop[] | undefined,
): CanvasIllustrationColorStop[] | undefined {
  const source = Array.isArray(value) ? value : fallback;
  if (!Array.isArray(source)) {
    return undefined;
  }

  const stops: CanvasIllustrationColorStop[] = [];
  for (const item of source) {
    if (!isRecord(item) || typeof item.from !== "string" || typeof item.to !== "string") {
      continue;
    }

    const from = normalizeSvgPaintColor(item.from);
    const to = normalizeSvgPaintColor(item.to);
    if (!from || !to) {
      continue;
    }

    stops.push({ from, to });
  }

  return stops.length > 0 ? stops : undefined;
}
