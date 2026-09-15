import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import { clampBackgroundShapeTilt } from "@/features/qr-code/model/state"

export type ScanRegionBounds = {
  height: number
  minX: number
  minY: number
  width: number
}

function transformLayerPoint(
  layer: Pick<
    DraftingCanvasLayer,
    "height" | "rotation" | "tiltX" | "tiltY" | "width" | "x" | "y"
  >,
  point: { x: number; y: number },
) {
  const centerX = layer.width / 2
  const centerY = layer.height / 2
  const skewX = Math.tan((clampBackgroundShapeTilt(layer.tiltY ?? 0) * Math.PI) / 180)
  const skewY = Math.tan((clampBackgroundShapeTilt(layer.tiltX ?? 0) * Math.PI) / 180)
  const localX = point.x - centerX
  const localY = point.y - centerY
  const skewedX = localX + localY * skewX
  const skewedY = localX * skewY + localY
  const radians = ((Number.isFinite(layer.rotation) ? layer.rotation : 0) * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)

  return {
    x: layer.x + centerX + skewedX * cos - skewedY * sin,
    y: layer.y + centerY + skewedX * sin + skewedY * cos,
  }
}

export function getTransformedLayerBounds(
  layer: Pick<
    DraftingCanvasLayer,
    "height" | "rotation" | "tiltX" | "tiltY" | "width" | "x" | "y"
  >,
): ScanRegionBounds {
  const points = [
    { x: 0, y: 0 },
    { x: layer.width, y: 0 },
    { x: layer.width, y: layer.height },
    { x: 0, y: layer.height },
  ].map((point) => transformLayerPoint(layer, point))
  const minX = Math.min(...points.map((point) => point.x))
  const minY = Math.min(...points.map((point) => point.y))
  const maxX = Math.max(...points.map((point) => point.x))
  const maxY = Math.max(...points.map((point) => point.y))

  return {
    height: Math.max(1, maxY - minY),
    minX,
    minY,
    width: Math.max(1, maxX - minX),
  }
}

export function resolveQrScanRegion(
  qrLayer: Pick<
    DraftingCanvasLayer,
    "height" | "rotation" | "tiltX" | "tiltY" | "width" | "x" | "y"
  >,
  cardLayer: Pick<DraftingCanvasLayer, "height" | "width" | "x" | "y">,
): ScanRegionBounds {
  const bounds = getTransformedLayerBounds(qrLayer)
  const padding = Math.max(bounds.width, bounds.height) * 0.25
  const minX = bounds.minX - padding
  const minY = bounds.minY - padding
  const maxX = bounds.minX + bounds.width + padding
  const maxY = bounds.minY + bounds.height + padding
  const cardMinX = cardLayer.x
  const cardMinY = cardLayer.y
  const cardMaxX = cardLayer.x + cardLayer.width
  const cardMaxY = cardLayer.y + cardLayer.height
  const clippedMinX = Math.max(minX, cardMinX)
  const clippedMinY = Math.max(minY, cardMinY)
  const clippedMaxX = Math.min(maxX, cardMaxX)
  const clippedMaxY = Math.min(maxY, cardMaxY)

  return {
    height: Math.max(1, clippedMaxY - clippedMinY),
    minX: clippedMinX,
    minY: clippedMinY,
    width: Math.max(1, clippedMaxX - clippedMinX),
  }
}
