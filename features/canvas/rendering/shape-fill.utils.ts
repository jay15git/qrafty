import type { Fill } from "@/components/ui/fill-picker/public-api"
import { DEFAULT_DESKTOP_SHAPE_SETTINGS } from "@/features/shell/model/desktop-toolbar-defaults"
import { fillPreviewHex } from "@/features/shell/inspector/fill-picker.utils"
import {
  fillCssToQraftyGradient,
  solidColorToFillCss,
  qraftyGradientToFillCss,
} from "@/features/shell/inspector/settings-bridge"
import {
  DEFAULT_DRAFTING_SHAPE_LAYER,
  DEFAULT_DRAFTING_TEXT_LAYER,
  type DraftingCanvasLayer,
} from "@/features/canvas/model/layers"

export function getShapeLayerFillCssValue(layer: DraftingCanvasLayer) {
  if (layer.fillMode === "gradient" && layer.fillGradient) {
    return qraftyGradientToFillCss(layer.fillGradient)
  }

  return solidColorToFillCss(layer.fill ?? DEFAULT_DRAFTING_SHAPE_LAYER.fill)
}

export function patchShapeLayerFillFromPicker(
  layer: DraftingCanvasLayer,
  fill: Fill,
  css: string,
): Partial<DraftingCanvasLayer> {
  const fallbackGradient =
    layer.fillGradient ?? DEFAULT_DESKTOP_SHAPE_SETTINGS.shapeGradient

  if (fill.kind === "gradient") {
    return {
      fill: fillPreviewHex(css),
      fillGradient: fillCssToQraftyGradient(css, fallbackGradient),
      fillMode: "gradient",
    }
  }

  return {
    fill: fillPreviewHex(css),
    fillMode: "solid",
  }
}

export function getTextLayerFillCssValue(layer: DraftingCanvasLayer) {
  if (layer.fillMode === "gradient" && layer.fillGradient) {
    return qraftyGradientToFillCss(layer.fillGradient)
  }

  return solidColorToFillCss(layer.fill ?? DEFAULT_DRAFTING_TEXT_LAYER.fill)
}

export function patchTextLayerFillFromPicker(
  layer: DraftingCanvasLayer,
  fill: Fill,
  css: string,
): Partial<DraftingCanvasLayer> {
  const fallbackGradient =
    layer.fillGradient ?? DEFAULT_DESKTOP_SHAPE_SETTINGS.shapeGradient

  if (fill.kind === "gradient") {
    return {
      fill: fillPreviewHex(css),
      fillGradient: fillCssToQraftyGradient(css, fallbackGradient),
      fillMode: "gradient",
    }
  }

  return {
    fill: fillPreviewHex(css),
    fillMode: "solid",
  }
}

export function getShapeLayerGradientId(layerId: string) {
  return `${layerId.replace(/[^\w-]+/g, "-")}-shape-fill-gradient`
}

export function shouldRenderShapeFillGradient(layer: DraftingCanvasLayer) {
  return layer.fillMode === "gradient" && layer.fillGradient?.enabled !== false
}

export function resolveShapeSvgFill(layer: DraftingCanvasLayer): string {
  if (layer.fillMode === "none") {
    return "none"
  }

  if (shouldRenderShapeFillGradient(layer)) {
    return `url(#${getShapeLayerGradientId(layer.id)})`
  }

  return layer.fill ?? DEFAULT_DRAFTING_SHAPE_LAYER.fill
}
