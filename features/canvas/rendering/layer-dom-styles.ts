import type { CSSProperties } from "react";

import type { CanvasCardState } from "@/features/canvas/model/card-state";
import {
  cornerRadiiToCss,
  resolveCornerRadii,
  resolveLayerCornerRadii,
} from "@/features/canvas/model/corner-radius";
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
import { clampBackgroundShapeTilt } from "@/features/qr/model/state";
import { cssFillToBackgroundStyle } from "@/features/canvas/model/css-fill-style";
import { paintSolidColor, paintToCss } from "@/features/canvas/model/paint";
import { formatFill } from "@/components/ui/fill-picker/lib/gradient";
import { shouldRenderShapeFillGradient } from "@/features/canvas/rendering/layer-fill";
import {
  getBackgroundShapeCssTiltTransform,
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

function getExportLayerTransform(layer: CanvasLayer) {
  const rotation = Number.isFinite(layer.rotation) ? layer.rotation : 0;
  const scaleX = layer.scaleX ?? 1;
  const scaleY = layer.scaleY ?? 1;
  const tiltX = clampBackgroundShapeTilt(layer.tiltX ?? 0);
  const tiltY = clampBackgroundShapeTilt(layer.tiltY ?? 0);
  const parts: string[] = [];

  if (rotation !== 0) {
    parts.push(`rotate(${rotation}deg)`);
  }

  if (scaleX !== 1 || scaleY !== 1) {
    parts.push(`scale(${scaleX}, ${scaleY})`);
  }

  if (tiltX !== 0 || tiltY !== 0) {
    const tiltTransform = getBackgroundShapeCssTiltTransform({ tiltX, tiltY });
    if (tiltTransform) {
      parts.push(tiltTransform);
    }
  }

  return parts.length > 0 ? parts.join(" ") : undefined;
}

export function getExportLayerPlacementStyle(layer: CanvasLayer): Record<string, string | number> {
  const transform = getExportLayerTransform(layer);
  const style: Record<string, string | number> = {
    boxSizing: "border-box",
    height: layer.height,
    left: layer.x,
    opacity: layer.opacity,
    position: "absolute",
    top: layer.y,
    width: layer.width,
    zIndex: layer.zIndex,
  };

  if (transform) {
    style.transform = transform;
    style.transformOrigin = "center center";
  }

  return style;
}

export function getExportLayerEffectStyle(layer: CanvasLayer): Record<string, string> {
  const effectStyle = getCanvasLayerEffectStyle(layer);
  const style: Record<string, string> = {};

  for (const [key, value] of Object.entries(effectStyle)) {
    if (typeof value === "string" && value) {
      style[key] = value;
    }
  }

  return style;
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

export function serializeCssProperties(
  properties: Record<string, string | number | undefined>,
): Record<string, string | number> {
  const result: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (value !== undefined && value !== "") {
      result[key] = value;
    }
  }

  return result;
}

export function cssPropertiesToInlineStyle(properties: Record<string, string | number>): string {
  return Object.entries(properties)
    .map(([key, value]) => {
      const cssKey = key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
      const unit =
        typeof value === "number" && !["opacity", "zIndex", "fontWeight"].includes(key) ? "px" : "";

      return `${cssKey}:${value}${unit}`;
    })
    .join(";");
}

export function getCanvasCardDomStyle(
  cardState: CanvasCardState,
  layer: CanvasLayer,
  options?: {
    includeShaderModes?: boolean;
  },
): Record<string, string | number> {
  const isImageMode = cardState.styleMode === "image";
  const isPaperShaderMode = cardState.styleMode === "paper-shader";
  const isImageFilterMode = cardState.styleMode === "image-filter";
  const cardImageStyle =
    isImageMode && cardState.cardImage.value
      ? {
          backgroundImage: `url("${cardState.cardImage.value}")`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: cardState.cardImage.fit,
        }
      : undefined;
  const border = normalizeCanvasCardBorder(cardState.border);
  const uniformBorder = getCanvasCardBorder(cardState);
  const borderStyle = uniformBorder
    ? { border: uniformBorder }
    : getCanvasPerSideBorderStyle(border.sides);

  return serializeCssProperties({
    ...cssFillToBackgroundStyle(paintToCss(cardState.fill)),
    ...cardImageStyle,
    ...borderStyle,
    borderRadius: cornerRadiiToCss(
      resolveCornerRadii(cardState.cornerRadii, cardState.cornerRadius),
    ),
  });
}

export function getCanvasImageDomStyle(layer: CanvasLayer): Record<string, string | number> {
  const imageValue = layer.imageValue ?? "";
  const borderRadius = cornerRadiiToCss(resolveLayerCornerRadii(layer, 0));
  const fit = layer.imageFit ?? "cover";

  if (!imageValue) {
    return {
      backgroundColor: "#f4f4f5",
      border: "1px dashed #d4d4d8",
      borderRadius,
    };
  }

  return {
    backgroundImage: `url("${imageValue}")`,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: fit,
    borderRadius,
  };
}

export function getCanvasShapeDomStyle(layer: CanvasLayer): Record<string, string | number> {
  if (!layer.fill || layer.fill.kind === "none") {
    return { backgroundColor: "transparent" };
  }

  if (layer.fill.kind === "image" && layer.fill.image) {
    return {
      backgroundColor: "transparent",
      backgroundImage: `url("${layer.fill.image}")`,
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundSize: layer.imageFit ?? "cover",
    };
  }

  return {
    backgroundColor: "transparent",
  };
}
