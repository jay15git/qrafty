import type { CSSProperties } from "react";

import type { CanvasCardState } from "@/features/canvas/model/card-state";
import { cornerRadiiToCss, resolveLayerCornerRadii } from "@/features/canvas/model/corner-radius";
import { normalizeCanvasCardBorder } from "@/features/canvas/model/card-state";
import {
  DEFAULT_TEXT_COLOR,
  DEFAULT_TEXT_LAYER,
  type CanvasLayer,
  type CanvasTextRun,
} from "@/features/canvas/model/layers/shared";
import { getCanvasFontCssFamily } from "@/features/canvas/model/fonts";
import { getCanvasTextFontFamily } from "@/features/canvas/rendering/text-layout";
import {
  buildCssFilterString,
  getCanvasLayerBoxShadowStyle,
  getCanvasLayerDropShadowFilter,
  getCanvasOutlineStyle,
  getCanvasPerSideBorderStyle,
  getCanvasUniformBorderStyle,
  hasVisibleBorderSide,
  mergeCssFilterStrings,
} from "@/features/canvas/rendering/layer-appearance";
import { paintSolidColor } from "@/features/canvas/model/paint";
import { formatFill } from "@/components/ui/fill-picker/lib/gradient";
import { shouldRenderShapeFillGradient } from "@/features/canvas/rendering/layer-fill";
import {
  getLayerPlacementTransform,
  getLayerTiltPerspectiveStyle,
} from "@/features/canvas/rendering/layer-transform";

function getCanvasCardBorder(cardState: CanvasCardState) {
  const border = normalizeCanvasCardBorder(cardState.border);
  const hasPerSideOverrides =
    border.sides.top.width !== border.width ||
    border.sides.right.width !== border.width ||
    border.sides.bottom.width !== border.width ||
    border.sides.left.width !== border.width;

  if (hasPerSideOverrides) {
    return undefined;
  }

  return getCanvasUniformBorderStyle({
    color: border.color,
    opacity: border.opacity,
    style: border.style,
    width: border.width,
  });
}

export function getCanvasCardBorderStyle(cardState: CanvasCardState): CSSProperties {
  const border = normalizeCanvasCardBorder(cardState.border);
  const uniformBorder = getCanvasCardBorder({ ...cardState, border });

  if (uniformBorder) {
    return { border: uniformBorder };
  }

  return getCanvasPerSideBorderStyle(border.sides);
}

function getCanvasLayerEffectStyle(layer: CanvasLayer): CSSProperties {
  const shadows =
    layer.shadows && layer.shadows.length > 0 ? layer.shadows : layer.shadow ? [layer.shadow] : [];
  const insetShadows = shadows.filter((shadow) => shadow.inset);
  const dropShadows = shadows.filter((shadow) => !shadow.inset);
  const filter = mergeCssFilterStrings(
    buildCssFilterString(layer.layerFilters ?? []),
    getCanvasLayerDropShadowFilter(dropShadows),
  );
  const usesBoxBorder = layer.kind !== "qr" && layer.kind !== "shape" && layer.kind !== "card";
  const hasBorderSides = usesBoxBorder && hasVisibleBorderSide(layer.borderSides);
  const borderStyle = hasBorderSides ? getCanvasPerSideBorderStyle(layer.borderSides!) : {};
  const boxShadow =
    insetShadows.length > 0 ? getCanvasLayerBoxShadowStyle(insetShadows) : undefined;
  const borderRadius = hasBorderSides
    ? cornerRadiiToCss(resolveLayerCornerRadii(layer, 0))
    : undefined;

  return {
    ...borderStyle,
    ...(borderRadius ? { borderRadius } : {}),
    ...getCanvasOutlineStyle(layer.outline),
    ...(boxShadow ? { boxShadow } : {}),
    ...(filter ? { filter } : {}),
  };
}

export function getLayerPlacementStyle(layer: CanvasLayer, nested = false): CSSProperties {
  const tiltPerspectiveStyle = nested ? {} : getLayerTiltPerspectiveStyle(layer);

  return {
    height: layer.height,
    left: nested ? 0 : "50%",
    opacity: layer.opacity,
    top: nested ? 0 : "50%",
    transform: nested ? undefined : getLayerPlacementTransform(layer),
    transformOrigin: "center center",
    transformStyle: tiltPerspectiveStyle.perspective ? "preserve-3d" : undefined,
    width: layer.width,
    zIndex: layer.zIndex,
    ...tiltPerspectiveStyle,
  };
}

export function getTextLayerStyle(layer: CanvasLayer): CSSProperties {
  const gradient = shouldRenderShapeFillGradient(layer) ? (layer.fill?.gradient ?? null) : null;

  return {
    ...(gradient
      ? {
          backgroundImage: formatFill({ kind: "gradient", gradient }),
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
          caretColor: paintSolidColor(layer.fill, "#171717"),
        }
      : { color: paintSolidColor(layer.fill, "#171717") }),
    fontFamily: getCanvasTextFontFamily(layer),
    fontSize: layer.fontSize ?? 32,
    fontStyle: layer.fontStyle ?? "normal",
    fontWeight: layer.fontWeight ?? "normal",
    letterSpacing: layer.letterSpacing ?? 0,
    lineHeight: layer.lineHeight ?? 1.22,
    textAlign: layer.textAlign ?? "left",
    textDecorationLine: layer.underline ? "underline" : "none",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  };
}

export function getTextRunStyle(
  layer: CanvasLayer,
  run: CanvasTextRun,
): Record<string, string | number> {
  const hasLayerGradient = shouldRenderShapeFillGradient(layer);

  return {
    color:
      run.fill ??
      (hasLayerGradient ? "transparent" : paintSolidColor(layer.fill, DEFAULT_TEXT_COLOR)),
    fontFamily: getCanvasFontCssFamily({
      fontFamily: run.fontFamily ?? layer.fontFamily,
      fontId: run.fontId ?? layer.fontId,
    }),
    fontSize: run.fontSize ?? layer.fontSize ?? DEFAULT_TEXT_LAYER.fontSize,
    fontStyle: run.fontStyle ?? layer.fontStyle ?? DEFAULT_TEXT_LAYER.fontStyle,
    fontWeight: run.fontWeight ?? layer.fontWeight ?? DEFAULT_TEXT_LAYER.fontWeight,
    textDecorationLine: (run.underline ?? layer.underline) ? "underline" : "none",
  };
}
