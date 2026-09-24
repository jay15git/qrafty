import type { CSSProperties } from "react";

import { cornerRadiiToCss, resolveLayerCornerRadii } from "@/features/canvas/model/corner-radius";
import type { CanvasLayer } from "@/features/canvas/model/layers/shared";
import type { CanvasCardShadowState } from "@/features/canvas/model/card-state";
import type { CanvasShadowLayerState } from "@/features/canvas/model/effects";
import {
  buildCssFilterString,
  getCanvasLayerBoxShadowStyle,
  getCanvasLayerDropShadowFilter,
  getCanvasOutlineStyle,
  getCanvasPerSideBorderStyle,
  hasVisibleBorderSide,
  mergeCssFilterStrings,
} from "@/features/canvas/rendering/layer-appearance";

export type PreviewLayerEffectOptions = {
  previewScale?: number;
};

function scaleShadowNumber(value: number, previewScale: number) {
  if (!Number.isFinite(previewScale) || previewScale <= 0 || previewScale === 1) {
    return value;
  }

  return value * previewScale;
}

function scalePreviewShadow(
  shadow: CanvasCardShadowState | CanvasShadowLayerState,
  previewScale: number,
) {
  return {
    ...shadow,
    blur: scaleShadowNumber(shadow.blur, previewScale),
    offsetX: scaleShadowNumber(shadow.offsetX, previewScale),
    offsetY: scaleShadowNumber(shadow.offsetY, previewScale),
    spread: scaleShadowNumber(shadow.spread ?? 0, previewScale),
  };
}

export function getPreviewLayerEffectStyle(
  layer: CanvasLayer,
  options: PreviewLayerEffectOptions = {},
): CSSProperties {
  const previewScale = options.previewScale ?? 1;
  const shadows =
    layer.shadows && layer.shadows.length > 0 ? layer.shadows : layer.shadow ? [layer.shadow] : [];
  const insetShadows = shadows.filter((shadow) => shadow.inset);
  const dropShadows = shadows.filter((shadow) => !shadow.inset);
  const layerFilters = buildCssFilterString(layer.layerFilters ?? []);
  const usesBoxBorder = layer.kind !== "qr" && layer.kind !== "shape" && layer.kind !== "card";
  const hasBorderSides = usesBoxBorder && hasVisibleBorderSide(layer.borderSides);
  const borderStyle = hasBorderSides ? getCanvasPerSideBorderStyle(layer.borderSides!) : {};
  const borderRadius = hasBorderSides
    ? cornerRadiiToCss(resolveLayerCornerRadii(layer, 0))
    : undefined;
  const boxShadow =
    insetShadows.length > 0
      ? getCanvasLayerBoxShadowStyle(
          insetShadows.map((shadow) => scalePreviewShadow(shadow, previewScale)),
        )
      : undefined;
  const filter = mergeCssFilterStrings(
    layerFilters,
    getCanvasLayerDropShadowFilter(
      dropShadows.map((shadow) => scalePreviewShadow(shadow, previewScale)),
    ),
  );

  return {
    ...borderStyle,
    ...(borderRadius ? { borderRadius } : {}),
    ...getCanvasOutlineStyle(layer.outline),
    ...(boxShadow ? { boxShadow } : {}),
    ...(filter ? { filter } : {}),
  };
}
