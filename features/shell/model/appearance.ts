import type { BackgroundShapeOptions } from "@/features/qr/model/state";
import {
  normalizeCanvasCardBorder,
  type CanvasCardBorderState,
  type CanvasCardShadowState,
} from "@/features/canvas/model/card-state";
import type {
  CanvasBorderSideValue,
  CanvasShadowLayerState,
} from "@/features/canvas/model/effects";
import type { CanvasFilterEffect } from "@/features/canvas/model/filters";
import {
  DEFAULT_DRAFTING_SHAPE_LAYER,
  type CanvasLayer,
} from "@/features/canvas/model/layers/shared";
import {
  layerSupportsCornerRadius,
  resolveCornerRadii,
  type CanvasCornerRadiiState,
} from "@/features/canvas/model/corner-radius";
import {
  createUniformPerSideBorder,
  legacyShadowToShadowLayer,
} from "@/features/canvas/model/effects";

export type AppearanceBorderSnapshot = CanvasBorderSideValue;

export type AppearancePatch = Partial<CanvasLayer> & {
  border?: AppearanceBorderSnapshot;
};

export type AppearanceSnapshot = {
  blur: number;
  border: AppearanceBorderSnapshot;
  cornerRadius?: number;
  cornerRadii?: CanvasCornerRadiiState;
  layerFilters: CanvasFilterEffect[];
  opacity: number;
  shadow: CanvasCardShadowState;
  shadows: CanvasShadowLayerState[];
  supportsBorder: boolean;
  supportsCornerRadius: boolean;
};

const DEFAULT_APPEARANCE_BORDER: AppearanceBorderSnapshot = {
  color: "#111827",
  opacity: 100,
  style: "solid",
  width: 0,
};

function qrHasBorderableBackdrop(options?: {
  qrBackgroundShapeId?: string;
  qrBackgroundSurfaceVisible?: boolean;
}) {
  return Boolean(
    (options?.qrBackgroundShapeId && options.qrBackgroundShapeId !== "none") ||
    options?.qrBackgroundSurfaceVisible,
  );
}

function getLayerBorderSnapshot(
  layer: CanvasLayer,
  options?: {
    cardBorder?: CanvasCardBorderState;
    qrBackgroundShapeId?: string;
    qrBackgroundSurfaceVisible?: boolean;
    qrBackgroundShapeOptions?: BackgroundShapeOptions;
  },
): AppearanceBorderSnapshot {
  if (
    layer.kind === "qr" &&
    qrHasBorderableBackdrop(options) &&
    options?.qrBackgroundShapeOptions
  ) {
    return {
      color: options.qrBackgroundShapeOptions.strokeColor,
      opacity: options.qrBackgroundShapeOptions.strokeOpacity,
      style: "solid",
      width: options.qrBackgroundShapeOptions.strokeWidth,
    };
  }

  if (layer.kind === "card") {
    const border = normalizeCanvasCardBorder(options?.cardBorder);
    return {
      color: border.color,
      opacity: border.opacity,
      style: border.style,
      width: border.width,
    };
  }

  if (layer.kind === "shape") {
    return {
      color: layer.stroke ?? DEFAULT_DRAFTING_SHAPE_LAYER.stroke ?? "#171717",
      opacity: layer.strokeOpacity ?? DEFAULT_DRAFTING_SHAPE_LAYER.strokeOpacity ?? 100,
      style: layer.strokeStyle ?? DEFAULT_DRAFTING_SHAPE_LAYER.strokeStyle ?? "solid",
      width: layer.strokeWidth ?? DEFAULT_DRAFTING_SHAPE_LAYER.strokeWidth ?? 0,
    };
  }

  return { ...DEFAULT_APPEARANCE_BORDER, ...layer.borderSides?.top };
}

export function getAppearanceSnapshot(
  layer: CanvasLayer,
  options?: {
    cardBorder?: CanvasCardBorderState;
    cardCornerRadius?: number;
    cardCornerRadii?: CanvasCornerRadiiState;
    qrBackgroundShapeId?: string;
    qrBackgroundSurfaceVisible?: boolean;
    qrBackgroundShapeOptions?: BackgroundShapeOptions;
  },
): AppearanceSnapshot {
  const layerFilters = layer.layerFilters ?? [];
  const border = getLayerBorderSnapshot(layer, options);
  const shadows = layer.shadows ?? [legacyShadowToShadowLayer(layer.shadow)];
  const supportsBorder =
    layer.kind === "card" ||
    layer.kind === "shape" ||
    (layer.kind === "qr" && qrHasBorderableBackdrop(options));

  if (layer.kind === "card" && options?.cardCornerRadius !== undefined) {
    const cornerRadii = resolveCornerRadii(options.cardCornerRadii, options.cardCornerRadius);
    return {
      blur: layer.blur,
      border,
      cornerRadius: cornerRadii.topLeft,
      cornerRadii,
      layerFilters,
      opacity: layer.opacity,
      shadow: layer.shadow,
      shadows,
      supportsBorder,
      supportsCornerRadius: true,
    };
  }

  if (layer.kind === "qr" && options?.qrBackgroundShapeOptions) {
    return {
      blur: layer.blur,
      border,
      layerFilters,
      opacity: layer.opacity,
      shadow: layer.shadow,
      shadows,
      supportsBorder,
      supportsCornerRadius: false,
    };
  }

  const isRectShape =
    layer.kind === "shape" && (layer.shapeId ?? DEFAULT_DRAFTING_SHAPE_LAYER.shapeId) === "rect";
  const cornerRadii = resolveCornerRadii(
    layer.cornerRadii,
    layer.cornerRadius ??
      (layer.kind === "image" ? 0 : isRectShape ? DEFAULT_DRAFTING_SHAPE_LAYER.cornerRadius : 0),
  );

  return {
    blur: layer.blur,
    border,
    cornerRadius: cornerRadii.topLeft,
    cornerRadii,
    layerFilters,
    opacity: layer.opacity,
    shadow: layer.shadow,
    shadows,
    supportsBorder,
    supportsCornerRadius: layerSupportsCornerRadius(layer),
  };
}

export type AppearancePatchResult = {
  cardBorder?: CanvasCardBorderState;
  cardCornerRadius?: number;
  cardCornerRadii?: CanvasCornerRadiiState;
  cardShadow?: Partial<CanvasCardShadowState>;
  layerPatch: Partial<CanvasLayer>;
  qrBackgroundShapeOptions?: Partial<BackgroundShapeOptions>;
};

export function buildAppearancePatch(
  layer: CanvasLayer,
  patch: AppearancePatch,
  options?: {
    cardBorder?: unknown;
    qrBackgroundShapeId?: string;
    qrBackgroundSurfaceVisible?: boolean;
    qrBackgroundShapeOptions?: BackgroundShapeOptions;
  },
): AppearancePatchResult {
  const layerPatch: Partial<CanvasLayer> = {};
  let cardBorder: CanvasCardBorderState | undefined;
  let qrBackgroundShapeOptions: Partial<BackgroundShapeOptions> | undefined;

  if (patch.border !== undefined) {
    if (layer.kind === "card") {
      cardBorder = normalizeCanvasCardBorder({
        ...patch.border,
        sides: createUniformPerSideBorder(patch.border),
      });
      layerPatch.borderSides = createUniformPerSideBorder({ width: 0 });
    } else if (layer.kind === "shape") {
      layerPatch.stroke = patch.border.color;
      layerPatch.strokeWidth = patch.border.width;
      layerPatch.strokeOpacity = patch.border.opacity;
      layerPatch.strokeStyle = patch.border.style;
      layerPatch.borderSides = createUniformPerSideBorder({ width: 0 });
    } else if (layer.kind === "qr" && qrHasBorderableBackdrop(options)) {
      qrBackgroundShapeOptions = {
        strokeColor: patch.border.color,
        strokeOpacity: patch.border.opacity,
        strokeWidth: patch.border.width,
      };
      layerPatch.borderSides = createUniformPerSideBorder({ width: 0 });
    } else {
      layerPatch.borderSides = createUniformPerSideBorder(patch.border);
    }
  }

  if (patch.blur !== undefined) {
    layerPatch.blur = patch.blur;
  }

  if (patch.layerFilters !== undefined) {
    layerPatch.layerFilters = patch.layerFilters;
  }

  if (patch.opacity !== undefined) {
    layerPatch.opacity = patch.opacity;
  }

  if (patch.cornerRadius !== undefined) {
    layerPatch.cornerRadius = patch.cornerRadius;
  }

  if (patch.cornerRadii !== undefined) {
    layerPatch.cornerRadii = patch.cornerRadii;
  }

  if (patch.outline !== undefined) {
    layerPatch.outline = patch.outline;
  }

  if (patch.shadows !== undefined) {
    layerPatch.shadows = patch.shadows;
  }

  if (patch.shadow) {
    layerPatch.shadow = {
      ...layer.shadow,
      ...patch.shadow,
    };
  }

  if (layer.kind === "card") {
    const primaryShadow =
      patch.shadows?.[0] ?? (patch.shadow ? { ...layer.shadow, ...patch.shadow } : undefined);

    return {
      cardBorder,
      cardCornerRadius: patch.cornerRadius,
      cardCornerRadii: patch.cornerRadii,
      cardShadow: primaryShadow,
      layerPatch,
    };
  }

  if (layer.kind === "qr") {
    return { layerPatch, qrBackgroundShapeOptions };
  }

  return { layerPatch };
}
