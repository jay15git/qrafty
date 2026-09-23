import {
  clampBackgroundShapeTilt,
  type BackgroundShapeOptions,
} from "@/features/qr/model/state"
import type { DraftingCanvasLayer } from "@/features/canvas/model/layers/shared"

type LayerTransformInput = Pick<
  DraftingCanvasLayer,
  "height" | "rotation" | "tiltX" | "tiltY" | "width" | "x" | "y"
>

function formatTransformNumber(value: number) {
  if (Math.abs(value) < 0.000001) {
    return "0"
  }

  return Number(value.toFixed(4)).toString()
}

export function getBackgroundShapeCssTiltTransform(
  shapeOptions: Pick<BackgroundShapeOptions, "tiltX" | "tiltY">,
) {
  const tiltX = clampBackgroundShapeTilt(shapeOptions.tiltX ?? 0)
  const tiltY = clampBackgroundShapeTilt(shapeOptions.tiltY ?? 0)

  if (tiltX === 0 && tiltY === 0) {
    return undefined
  }

  return `rotateX(${tiltY}deg) rotateY(${tiltX}deg)`
}

export type BackgroundShapeTiltContainerStyle = {
  perspective?: string
  transform?: string
  transformOrigin?: string
  transformStyle?: "preserve-3d"
}

export function getBackgroundShapeTiltPerspectiveStyle(
  shapeOptions: Pick<BackgroundShapeOptions, "tiltX" | "tiltY">,
): Pick<BackgroundShapeTiltContainerStyle, "perspective"> {
  const tiltTransform = getBackgroundShapeCssTiltTransform(shapeOptions)

  if (!tiltTransform) {
    return {}
  }

  return {
    perspective: "600px",
  }
}

export function getBackgroundShapeTiltInnerStyle(
  shapeOptions: Pick<BackgroundShapeOptions, "tiltX" | "tiltY">,
): Pick<BackgroundShapeTiltContainerStyle, "transform" | "transformOrigin" | "transformStyle"> {
  const tiltTransform = getBackgroundShapeCssTiltTransform(shapeOptions)

  if (!tiltTransform) {
    return {}
  }

  return {
    transform: tiltTransform,
    transformOrigin: "center center",
    transformStyle: "preserve-3d",
  }
}

export function getLayerPlacementTransform(
  layer: LayerTransformInput & Pick<DraftingCanvasLayer, "scaleX" | "scaleY">,
) {
  const rotation = Number.isFinite(layer.rotation) ? layer.rotation : 0
  const scaleX = layer.scaleX ?? 1
  const scaleY = layer.scaleY ?? 1
  const translation = `translate3d(${layer.x}px, ${layer.y}px, 0)`
  const scale = scaleX === 1 && scaleY === 1 ? "" : ` scale(${scaleX}, ${scaleY})`
  const rotationPart = rotation !== 0 ? ` rotate(${rotation}deg)` : ""

  return `${translation}${scale}${rotationPart}`
}

export function getLayerTiltPerspectiveStyle(
  layer: Pick<DraftingCanvasLayer, "tiltX" | "tiltY">,
) {
  return getBackgroundShapeTiltPerspectiveStyle({
    tiltX: layer.tiltX ?? 0,
    tiltY: layer.tiltY ?? 0,
  })
}

export function getLayerTiltInnerStyle(
  layer: Pick<DraftingCanvasLayer, "tiltX" | "tiltY">,
): Pick<BackgroundShapeTiltContainerStyle, "transform" | "transformOrigin" | "transformStyle"> {
  return getBackgroundShapeTiltInnerStyle({
    tiltX: layer.tiltX ?? 0,
    tiltY: layer.tiltY ?? 0,
  })
}

export function appendTiltSkewToSvgTransform(
  baseTransform: string,
  tiltX: number,
  tiltY: number,
  centerX: number,
  centerY: number,
) {
  const normalizedTiltX = clampBackgroundShapeTilt(tiltX)
  const normalizedTiltY = clampBackgroundShapeTilt(tiltY)

  if (normalizedTiltX === 0 && normalizedTiltY === 0) {
    return baseTransform
  }

  return `${baseTransform} translate(${formatTransformNumber(centerX)} ${formatTransformNumber(centerY)}) skewX(${formatTransformNumber(normalizedTiltY)}) skewY(${formatTransformNumber(normalizedTiltX)}) translate(${formatTransformNumber(-centerX)} ${formatTransformNumber(-centerY)})`
}

export function getBackgroundShapeSkewTransform(
  baseTransform: string,
  shapeOptions: Pick<BackgroundShapeOptions, "tiltX" | "tiltY">,
  centerX: number,
  centerY: number,
) {
  return appendTiltSkewToSvgTransform(
    baseTransform,
    shapeOptions.tiltX,
    shapeOptions.tiltY,
    centerX,
    centerY,
  )
}

export function getLayerSvgTransform(layer: LayerTransformInput) {
  const centerX = layer.width / 2
  const centerY = layer.height / 2
  const rotation = Number.isFinite(layer.rotation) ? layer.rotation : 0
  const baseTransform = `translate(${formatTransformNumber(layer.x)} ${formatTransformNumber(layer.y)}) rotate(${formatTransformNumber(rotation)} ${formatTransformNumber(centerX)} ${formatTransformNumber(centerY)})`

  return appendTiltSkewToSvgTransform(
    baseTransform,
    layer.tiltX ?? 0,
    layer.tiltY ?? 0,
    centerX,
    centerY,
  )
}
