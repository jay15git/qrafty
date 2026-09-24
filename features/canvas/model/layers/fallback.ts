import {
  cloneDraftingCardPaperShaderState,
  createDefaultDraftingCardPaperShader,
} from "@/features/canvas/model/card-state";
import {
  DEFAULT_DRAFTING_OUTLINE,
  legacyShadowToShadowLayer,
} from "@/features/canvas/model/effects";
import { createUniformCornerRadii } from "@/features/canvas/model/corner-radius";
import {
  DEFAULT_DRAFTING_IMAGE_LAYER,
  DEFAULT_DRAFTING_LAYER_SHADOW,
  DEFAULT_DRAFTING_SHADER_LAYER,
  DEFAULT_DRAFTING_SHAPE_LAYER,
  DEFAULT_DRAFTING_TEXT_LAYER,
  getDraftingCardLayerId,
  getDraftingQrLayerId,
  type CanvasLayer,
  type CanvasLayerKind,
  type DraftingLayerStateByNodeId,
} from "@/features/canvas/model/layers/shared";

export function cloneCanvasLayer(layer: CanvasLayer): CanvasLayer {
  return {
    ...layer,
    borderSides: layer.borderSides
      ? {
          bottom: { ...layer.borderSides.bottom },
          left: { ...layer.borderSides.left },
          right: { ...layer.borderSides.right },
          top: { ...layer.borderSides.top },
        }
      : undefined,
    children: layer.children?.map(cloneCanvasLayer),
    layerFilters: (layer.layerFilters ?? []).map((filter) => ({ ...filter })),
    outline: { ...(layer.outline ?? DEFAULT_DRAFTING_OUTLINE) },
    shadow: { ...(layer.shadow ?? DEFAULT_DRAFTING_LAYER_SHADOW) },
    shadows: (
      layer.shadows ?? [legacyShadowToShadowLayer(layer.shadow ?? DEFAULT_DRAFTING_LAYER_SHADOW)]
    ).map((shadow) => ({ ...shadow })),
    textRuns: layer.textRuns?.map((run) => ({ ...run })),
    illustrationColorStops: layer.illustrationColorStops?.map((stop) => ({ ...stop })),
    paperShader: layer.paperShader
      ? cloneDraftingCardPaperShaderState(layer.paperShader)
      : undefined,
  };
}

export function cloneDraftingLayerStateByNodeId(
  layersByNodeId: DraftingLayerStateByNodeId,
): DraftingLayerStateByNodeId {
  return Object.fromEntries(
    Object.entries(layersByNodeId).map(([nodeId, layers]) => [
      nodeId,
      layers.map(cloneCanvasLayer),
    ]),
  );
}

const FALLBACK_LAYER_NAMES: Record<CanvasLayerKind, string> = {
  card: "Card",
  qr: "QR code",
  text: "Text",
  image: "Image",
  shape: "Shape",
  shader: "Shader",
  group: "Group",
};

function fallbackLayerId(nodeId: string, kind: CanvasLayerKind) {
  if (kind === "card") {
    return getDraftingCardLayerId(nodeId);
  }

  if (kind === "qr") {
    return getDraftingQrLayerId(nodeId);
  }

  if (kind === "text" || kind === "image" || kind === "shape" || kind === "shader") {
    return createDraftingLayerInstanceId(nodeId, kind);
  }

  return `${nodeId}:group`;
}

/** Kind-specific fields for `createFallbackLayer`. Everything not listed
 * here keeps the shared defaults in the base literal. */
function fallbackLayerKindDefaults(kind: CanvasLayerKind): Partial<CanvasLayer> {
  switch (kind) {
    case "text":
      return {
        height: 48,
        y: -24,
        fill: DEFAULT_DRAFTING_TEXT_LAYER.fill,
        fillMode: "solid",
        fontFamily: DEFAULT_DRAFTING_TEXT_LAYER.fontFamily,
        fontId: DEFAULT_DRAFTING_TEXT_LAYER.fontId,
        fontSize: DEFAULT_DRAFTING_TEXT_LAYER.fontSize,
        fontStyle: DEFAULT_DRAFTING_TEXT_LAYER.fontStyle,
        fontWeight: DEFAULT_DRAFTING_TEXT_LAYER.fontWeight,
        letterSpacing: DEFAULT_DRAFTING_TEXT_LAYER.letterSpacing,
        lineHeight: DEFAULT_DRAFTING_TEXT_LAYER.lineHeight,
        text: DEFAULT_DRAFTING_TEXT_LAYER.text,
        textAlign: DEFAULT_DRAFTING_TEXT_LAYER.textAlign,
        underline: DEFAULT_DRAFTING_TEXT_LAYER.underline,
      };
    case "image":
      return {
        cornerRadius: DEFAULT_DRAFTING_IMAGE_LAYER.cornerRadius,
        cornerRadii: createUniformCornerRadii(DEFAULT_DRAFTING_IMAGE_LAYER.cornerRadius),
        height: 180,
        width: 180,
        x: -90,
        y: -90,
        imageFit: DEFAULT_DRAFTING_IMAGE_LAYER.imageFit,
        imageSource: DEFAULT_DRAFTING_IMAGE_LAYER.imageSource,
        imageValue: DEFAULT_DRAFTING_IMAGE_LAYER.imageValue,
      };
    case "shape":
      return {
        cornerRadius: DEFAULT_DRAFTING_SHAPE_LAYER.cornerRadius,
        cornerRadii: createUniformCornerRadii(DEFAULT_DRAFTING_SHAPE_LAYER.cornerRadius),
        height: 180,
        width: 180,
        x: -90,
        y: -90,
        fill: DEFAULT_DRAFTING_SHAPE_LAYER.fill,
        fillMode: DEFAULT_DRAFTING_SHAPE_LAYER.fillMode,
        shapeId: DEFAULT_DRAFTING_SHAPE_LAYER.shapeId,
        stroke: DEFAULT_DRAFTING_SHAPE_LAYER.stroke,
        strokeOpacity: DEFAULT_DRAFTING_SHAPE_LAYER.strokeOpacity,
        strokeStyle: DEFAULT_DRAFTING_SHAPE_LAYER.strokeStyle,
        strokeWidth: DEFAULT_DRAFTING_SHAPE_LAYER.strokeWidth,
      };
    case "shader":
      return {
        cornerRadius: DEFAULT_DRAFTING_SHADER_LAYER.cornerRadius,
        cornerRadii: createUniformCornerRadii(DEFAULT_DRAFTING_SHADER_LAYER.cornerRadius),
        height: 180,
        width: 180,
        x: -90,
        y: -90,
        paperShader: createDefaultDraftingCardPaperShader(),
      };
    default:
      return {};
  }
}

export function createFallbackLayer(nodeId: string, kind: CanvasLayerKind): CanvasLayer {
  const defaultShadow = { ...DEFAULT_DRAFTING_LAYER_SHADOW };

  return {
    blur: 0,
    borderSides: undefined,
    cornerRadius: undefined,
    cornerRadii: undefined,
    fill: undefined,
    fillMode: undefined,
    height: 240,
    id: fallbackLayerId(nodeId, kind),
    isVisible: true,
    kind,
    fontFamily: undefined,
    fontId: undefined,
    fontSize: undefined,
    fontStyle: undefined,
    fontWeight: undefined,
    layerFilters: [],
    letterSpacing: undefined,
    lineHeight: undefined,
    name: FALLBACK_LAYER_NAMES[kind],
    nodeId,
    opacity: 1,
    outline: { ...DEFAULT_DRAFTING_OUTLINE },
    rotation: 0,
    tiltX: 0,
    tiltY: 0,
    shadow: defaultShadow,
    shadows: [legacyShadowToShadowLayer(defaultShadow)],
    imageFit: undefined,
    imageSource: undefined,
    imageValue: undefined,
    illustrationColorStops: undefined,
    paperShader: undefined,
    shapeId: undefined,
    stroke: undefined,
    strokeOpacity: undefined,
    strokeStyle: undefined,
    strokeWidth: undefined,
    text: undefined,
    textAlign: undefined,
    underline: undefined,
    width: 240,
    x: -120,
    y: -120,
    zIndex: kind === "card" ? 0 : 1,
    ...fallbackLayerKindDefaults(kind),
  };
}

export function createDraftingLayerInstanceId(nodeId: string, kind: CanvasLayerKind) {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${nodeId}:${kind}:${randomId}`;
}
