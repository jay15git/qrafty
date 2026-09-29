import type { Fill } from "@/components/ui/fill-picker/public-api";
import {
  paintFromPickerFill,
  paintSolidColor,
  paintToCss,
  paintToPickerCss,
} from "@/features/canvas/model/paint";
import { normalizeFillForQrTarget } from "@/features/shell/settings/FillPicker.utils";

/**
 * The QR-style SVG defs path only supports linear/radial two-stop gradients.
 * Clamp picker output the way `fillCssToQraftyGradient` used to: conic →
 * radial, exotic radials → circle, multi-stop ramps → first + last stops.
 */
function clampPickerFillForCanvas(fill: Fill): Fill {
  const normalized = normalizeFillForQrTarget(fill);

  if (normalized.kind !== "gradient" || normalized.gradient.stops.length <= 2) {
    return normalized;
  }

  const stops = [...normalized.gradient.stops].sort((a, b) => a.position - b.position);
  const first = stops[0];
  const last = stops[stops.length - 1];

  return {
    kind: "gradient",
    gradient: { ...normalized.gradient, stops: [first, last] },
  };
}
import {
  DEFAULT_SHAPE_LAYER,
  DEFAULT_TEXT_LAYER,
  type CanvasLayer,
} from "@/features/canvas/model/layers/shared";

export function getShapeLayerFillCssValue(layer: CanvasLayer) {
  return paintToPickerCss(layer.fill ?? DEFAULT_SHAPE_LAYER.fill);
}

export function patchShapeLayerFillFromPicker(
  layer: CanvasLayer,
  fill: Fill,
): Partial<CanvasLayer> {
  return { fill: paintFromPickerFill(clampPickerFillForCanvas(fill), layer.fill) };
}

export function getTextLayerFillCssValue(layer: CanvasLayer) {
  return paintToPickerCss(layer.fill ?? DEFAULT_TEXT_LAYER.fill);
}

export function patchTextLayerFillFromPicker(layer: CanvasLayer, fill: Fill): Partial<CanvasLayer> {
  return { fill: paintFromPickerFill(clampPickerFillForCanvas(fill), layer.fill) };
}

export function getShapeLayerGradientId(layerId: string) {
  return `${layerId.replace(/[^\w-]+/g, "-")}-shape-fill-gradient`;
}

export function shouldRenderShapeFillGradient(layer: CanvasLayer) {
  const gradient = layer.fill?.kind === "gradient" ? layer.fill.gradient : undefined;
  return Boolean(gradient) && gradient?.type !== "conic";
}

export function resolveShapeSvgFill(layer: CanvasLayer): string {
  const paint = layer.fill;

  if (!paint || paint.kind === "none") {
    return "none";
  }

  if (shouldRenderShapeFillGradient(layer)) {
    return `url(#${getShapeLayerGradientId(layer.id)})`;
  }

  return paintSolidColor(paint, paintToCss(DEFAULT_SHAPE_LAYER.fill));
}
