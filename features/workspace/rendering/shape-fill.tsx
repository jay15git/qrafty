"use client"

import type { Fill } from "@/components/ui/fill-picker-base/public-api"
import { DEFAULT_DESKTOP_SHAPE_SETTINGS } from "@/features/desktop-shell/model/desktop-toolbar-defaults"
import { fillPreviewHex } from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"
import {
  fillCssToStudioGradient,
  solidColorToFillCss,
  studioGradientToFillCss,
} from "@/features/desktop-shell/inspector/desktopnew-settings-bridge"
import {
  DEFAULT_DRAFTING_SHAPE_LAYER,
  type DraftingCanvasLayer,
} from "@/features/workspace/model/layers"
import type { StudioGradient } from "@/features/qr-code/model/state"
import {
  getStudioGradientCenter,
  studioRadialCenterAsPercent,
} from "@/features/qr-code/styles/studio-gradient-geometry"

export function getShapeLayerFillCssValue(layer: DraftingCanvasLayer) {
  if (layer.fillMode === "gradient" && layer.fillGradient) {
    return studioGradientToFillCss(layer.fillGradient)
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
      fillGradient: fillCssToStudioGradient(css, fallbackGradient),
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

export function resolveShapeSvgFill(layer: DraftingCanvasLayer): string {
  if (layer.fillMode === "none") {
    return "none"
  }

  if (shouldRenderShapeFillGradient(layer)) {
    return `url(#${getShapeLayerGradientId(layer.id)})`
  }

  return layer.fill ?? DEFAULT_DRAFTING_SHAPE_LAYER.fill
}

export function shouldRenderShapeFillGradient(layer: DraftingCanvasLayer) {
  return layer.fillMode === "gradient" && layer.fillGradient?.enabled !== false
}

export function ShapeFillGradientDefs({
  gradient,
  layerId,
}: {
  gradient: StudioGradient
  layerId: string
}) {
  const gradientId = getShapeLayerGradientId(layerId)
  const stops = gradient.colorStops.map((colorStop) => (
    <stop
      key={`${colorStop.offset}-${colorStop.color}`}
      offset={`${Math.round(colorStop.offset * 100)}%`}
      stopColor={colorStop.color}
    />
  ))

  if (gradient.type === "radial") {
    const { cx, cy } = studioRadialCenterAsPercent(getStudioGradientCenter(gradient))

    return (
      <radialGradient cx={`${cx}%`} cy={`${cy}%`} id={gradientId} r="50%">
        {stops}
      </radialGradient>
    )
  }

  const rotationDegrees = (gradient.rotation * 180) / Math.PI

  return (
    <linearGradient
      gradientTransform={`rotate(${rotationDegrees} 0.5 0.5)`}
      gradientUnits="objectBoundingBox"
      id={gradientId}
    >
      {stops}
    </linearGradient>
  )
}
