import {
  normalizeDraftingCardShadow,
  type DraftingCardState,
} from "@/features/canvas/model/card-state";
import {
  DEFAULT_DRAFTING_OUTLINE,
  hasLegacyBackgroundShapeShadow,
  legacyShadowToShadowLayer,
  shadowFromBackgroundShapeOptions,
} from "@/features/canvas/model/effects";
import { getQrRenderedDimensions } from "@/features/qr/rendering/svg-extension";
import { clampQrSize, type QraftyState } from "@/features/qr/model/state";
import { normalizeCanvasLayer } from "@/features/canvas/model/layers/normalize";
import { patchCanvasLayer } from "@/features/canvas/model/layers/patch";
import {
  createAdditionalDraftingQrLayerId,
  DEFAULT_DRAFTING_LAYER_SHADOW,
  getDraftingCardLayerId,
  getDraftingQrLayerId,
  type CanvasLayer,
} from "@/features/canvas/model/layers/shared";

export function createDraftingQrLayer(
  nodeId: string,
  qrState: QraftyState,
  cardState: Pick<DraftingCardState, "bottomSpace" | "height" | "padding" | "sizeMode" | "width">,
  options: {
    id?: string;
    nearLayer?: Pick<CanvasLayer, "height" | "width" | "x" | "y">;
    zIndex?: number;
  } = {},
): CanvasLayer {
  const qrDimensions = fitQrSizeInCard(qrState, cardState);
  const nearLayer = options.nearLayer;
  const offset = 40;
  const defaultLayout = getDraftingCardInsetLayout(qrState, cardState);
  const x = nearLayer ? nearLayer.x + offset : defaultLayout.qr.x;
  const y = nearLayer ? nearLayer.y + offset : defaultLayout.qr.y;

  return {
    blur: 0,
    height: qrDimensions.height,
    id: options.id ?? createAdditionalDraftingQrLayerId(nodeId),
    isVisible: true,
    kind: "qr",
    layerFilters: [],
    name: "QR code",
    nodeId,
    opacity: 1,
    outline: { ...DEFAULT_DRAFTING_OUTLINE },
    rotation: 0,
    tiltX: 0,
    tiltY: 0,
    shadow: { ...DEFAULT_DRAFTING_LAYER_SHADOW },
    shadows: [legacyShadowToShadowLayer(DEFAULT_DRAFTING_LAYER_SHADOW)],
    width: qrDimensions.width,
    x,
    y,
    zIndex: options.zIndex ?? 1,
  };
}

export function fitQrSizeInCard(
  qrState: QraftyState,
  cardState: Pick<DraftingCardState, "bottomSpace" | "height" | "padding" | "sizeMode" | "width">,
) {
  const qrDimensions = getQrRenderedDimensions(qrState);

  if (cardState.sizeMode !== "fixed") {
    return {
      height: qrDimensions.height,
      width: qrDimensions.width,
    };
  }

  const availableWidth = Math.max(24, cardState.width - cardState.padding * 2);
  const availableHeight = Math.max(
    24,
    cardState.height - cardState.padding * 2 - cardState.bottomSpace,
  );
  const fittedSize = clampQrSize(Math.min(availableWidth, availableHeight, qrDimensions.width));

  return {
    height: fittedSize,
    width: fittedSize,
  };
}

export function clampLayerGeometryToCanvas(
  layer: Pick<CanvasLayer, "height" | "width" | "x" | "y">,
  cardState: Pick<DraftingCardState, "height" | "width">,
): Pick<CanvasLayer, "height" | "width" | "x" | "y"> {
  const canvasLeft = -cardState.width / 2;
  const canvasTop = -cardState.height / 2;
  const width = Math.min(Math.max(1, layer.width), cardState.width);
  const height = Math.min(Math.max(1, layer.height), cardState.height);
  const maxX = canvasLeft + cardState.width - width;
  const maxY = canvasTop + cardState.height - height;

  return {
    height,
    width,
    x: Math.min(maxX, Math.max(canvasLeft, layer.x)),
    y: Math.min(maxY, Math.max(canvasTop, layer.y)),
  };
}

export function getDraftingCardInsetLayout(
  qrState: QraftyState,
  cardState: Pick<DraftingCardState, "bottomSpace" | "height" | "padding" | "sizeMode" | "width">,
) {
  const qrDimensions = fitQrSizeInCard(qrState, cardState);

  if (cardState.sizeMode === "fixed") {
    const cardWidth = cardState.width;
    const cardHeight = cardState.height;
    const cardX = -cardWidth / 2;
    const cardY = -cardHeight / 2;

    const contentTop = cardY + cardState.padding;
    const contentHeight = Math.max(
      qrDimensions.height,
      cardHeight - cardState.padding * 2 - cardState.bottomSpace,
    );

    return {
      card: {
        height: cardHeight,
        width: cardWidth,
        x: cardX,
        y: cardY,
      },
      qr: {
        height: qrDimensions.height,
        width: qrDimensions.width,
        x: -qrDimensions.width / 2,
        y: contentTop + (contentHeight - qrDimensions.height) / 2,
      },
    };
  }

  const cardWidth = qrDimensions.width + cardState.padding * 2;
  const cardHeight = qrDimensions.height + cardState.padding * 2 + cardState.bottomSpace;
  const cardX = -cardWidth / 2;
  const cardY = -cardHeight / 2;

  return {
    card: {
      height: cardHeight,
      width: cardWidth,
      x: cardX,
      y: cardY,
    },
    qr: {
      height: qrDimensions.height,
      width: qrDimensions.width,
      x: -qrDimensions.width / 2,
      y: cardY + cardState.padding,
    },
  };
}

function hasAuthoredLayerComposition(layers: CanvasLayer[]): boolean {
  return layers.some(
    (layer) => layer.isVisible && (layer.kind === "shape" || layer.kind === "image"),
  );
}

export function hasCustomDraftingQrPlacement(
  layers: CanvasLayer[],
  nodeId: string,
  qrState: QraftyState,
  cardState: Pick<DraftingCardState, "bottomSpace" | "height" | "padding" | "sizeMode" | "width">,
  tolerance = 2,
): boolean {
  const qrLayer = layers.find(
    (layer) => layer.kind === "qr" && layer.id === getDraftingQrLayerId(nodeId),
  );

  if (!qrLayer) {
    return false;
  }

  const inset = getDraftingCardInsetLayout(qrState, cardState).qr;

  return (
    Math.abs(qrLayer.x - inset.x) > tolerance ||
    Math.abs(qrLayer.y - inset.y) > tolerance ||
    Math.abs(qrLayer.width - inset.width) > tolerance ||
    Math.abs(qrLayer.height - inset.height) > tolerance
  );
}

export type LayoutDraftingCardInsetLayersOptions = {
  preserveCustomQrPlacement?: boolean;
};

export function layoutDraftingCardInsetLayers(
  layers: CanvasLayer[],
  qrState: QraftyState,
  cardState: Pick<DraftingCardState, "bottomSpace" | "height" | "padding" | "sizeMode" | "width">,
  options?: LayoutDraftingCardInsetLayersOptions,
): CanvasLayer[] {
  const nodeId = layers.find((layer) => layer.kind === "qr")?.nodeId ?? layers[0]?.nodeId;
  const layout = getDraftingCardInsetLayout(qrState, cardState);
  const preserveQrPlacement =
    options?.preserveCustomQrPlacement ??
    (nodeId ? hasCustomDraftingQrPlacement(layers, nodeId, qrState, cardState) : false);

  return layers.map((layer) => {
    if (layer.kind === "card") {
      return patchCanvasLayer(layer, layout.card);
    }

    if (layer.kind === "qr") {
      if (preserveQrPlacement) {
        return layer;
      }

      return patchCanvasLayer(layer, layout.qr);
    }

    return layer;
  });
}

export function createDefaultDraftingLayers(
  nodeId: string,
  qrState: QraftyState,
  cardState: DraftingCardState,
): CanvasLayer[] {
  const qrDimensions = fitQrSizeInCard(qrState, cardState);
  const layout = getDraftingCardInsetLayout(qrState, cardState);

  return [
    {
      blur: 0,
      height: layout.card.height,
      id: getDraftingCardLayerId(nodeId),
      isVisible: true,
      kind: "card",
      layerFilters: [],
      name: "Card",
      nodeId,
      opacity: 1,
      outline: { ...DEFAULT_DRAFTING_OUTLINE },
      rotation: 0,
      tiltX: 0,
      tiltY: 0,
      shadow: normalizeDraftingCardShadow(cardState.shadow),
      shadows: [legacyShadowToShadowLayer(normalizeDraftingCardShadow(cardState.shadow))],
      width: layout.card.width,
      x: layout.card.x,
      y: layout.card.y,
      zIndex: 0,
    },
    {
      blur: 0,
      height: qrDimensions.height,
      id: getDraftingQrLayerId(nodeId),
      isVisible: true,
      kind: "qr",
      layerFilters: [],
      name: "QR code",
      nodeId,
      opacity: 1,
      outline: { ...DEFAULT_DRAFTING_OUTLINE },
      rotation: 0,
      tiltX: 0,
      tiltY: 0,
      shadow: { ...DEFAULT_DRAFTING_LAYER_SHADOW },
      shadows: [legacyShadowToShadowLayer(DEFAULT_DRAFTING_LAYER_SHADOW)],
      width: qrDimensions.width,
      x: layout.qr.x,
      y: layout.qr.y,
      zIndex: 1,
    },
  ];
}

export function normalizeCanvasLayers(
  nodeId: string,
  value: unknown,
  qrState: QraftyState,
  cardState: DraftingCardState,
): CanvasLayer[] {
  const fallback = createDefaultDraftingLayers(nodeId, qrState, cardState);

  if (!Array.isArray(value)) {
    return fallback;
  }

  const normalized = value
    .map((layer) => normalizeCanvasLayer(nodeId, layer, fallback))
    .filter((layer): layer is CanvasLayer => Boolean(layer));

  const hasCard = normalized.some((layer) => layer.kind === "card");
  const hasQr = normalized.some((layer) => layer.kind === "qr");

  return [...(hasCard ? [] : [fallback[0]!]), ...normalized, ...(hasQr ? [] : [fallback[1]!])]
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((layer) => migrateLegacyQrLayerShadow(layer, qrState));
}

function migrateLegacyQrLayerShadow(layer: CanvasLayer, qrState: QraftyState): CanvasLayer {
  if (layer.kind !== "qr") {
    return layer;
  }

  const hasLayerShadow =
    layer.shadow.opacity > 0 &&
    (layer.shadow.blur > 0 || layer.shadow.offsetX !== 0 || layer.shadow.offsetY !== 0);

  if (hasLayerShadow || !hasLegacyBackgroundShapeShadow(qrState.backgroundShapeOptions)) {
    return layer;
  }

  return patchCanvasLayer(layer, {
    shadow: shadowFromBackgroundShapeOptions(qrState.backgroundShapeOptions),
  });
}
