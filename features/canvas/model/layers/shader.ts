import {
  cloneCanvasCardPaperShaderState,
  createDefaultCanvasCardPaperShader,
  type CanvasCardPaperShaderState,
} from "@/features/canvas/model/card-state";
import type { PaperShaderId } from "@/features/canvas/rendering/paper-shader-definitions";
import {
  DEFAULT_DRAFTING_SHADER_LAYER,
  isRecord,
  normalizeCanvasLayerBorderSides,
  normalizeLayerCornerRadiusFields,
  normalizeSharedCanvasLayerFields,
  readFiniteNumber,
  type CanvasLayer,
  type NormalizeCanvasLayerContext,
} from "@/features/canvas/model/layers/shared";

export function normalizeShaderCanvasLayer(
  context: NormalizeCanvasLayerContext & { kind: "shader" },
): CanvasLayer {
  const { fallback, value } = context;
  const fallbackPaperShader = fallback.paperShader ?? createDefaultCanvasCardPaperShader();

  return {
    ...normalizeSharedCanvasLayerFields(context),
    borderSides: normalizeCanvasLayerBorderSides(value.borderSides, fallback.borderSides),
    ...normalizeLayerCornerRadiusFields(
      value,
      fallback,
      DEFAULT_DRAFTING_SHADER_LAYER.cornerRadius,
    ),
    kind: "shader",
    paperShader: normalizeLayerPaperShader(value.paperShader, fallbackPaperShader),
  } satisfies CanvasLayer;
}

function normalizeLayerPaperShader(
  value: unknown,
  fallback: CanvasCardPaperShaderState,
): CanvasCardPaperShaderState {
  if (!isRecord(value)) {
    return cloneCanvasCardPaperShaderState(fallback);
  }

  const shaderId =
    typeof value.shaderId === "string" ? (value.shaderId as PaperShaderId) : fallback.shaderId;
  const nextFallback =
    shaderId === fallback.shaderId ? fallback : createDefaultCanvasCardPaperShader(shaderId);

  return {
    frame: readFiniteNumber(value.frame, nextFallback.frame),
    image: isRecord(value.image)
      ? {
          source:
            value.image.source === "none" ||
            value.image.source === "sample" ||
            value.image.source === "upload" ||
            value.image.source === "url"
              ? value.image.source
              : nextFallback.image.source,
          value:
            typeof value.image.value === "string" ? value.image.value : nextFallback.image.value,
        }
      : { ...nextFallback.image },
    params: isRecord(value.params)
      ? structuredClone(value.params as CanvasCardPaperShaderState["params"])
      : structuredClone(nextFallback.params),
    paused: typeof value.paused === "boolean" ? value.paused : nextFallback.paused,
    presetName: typeof value.presetName === "string" ? value.presetName : nextFallback.presetName,
    shaderId,
    speed: readFiniteNumber(value.speed, nextFallback.speed),
  };
}
