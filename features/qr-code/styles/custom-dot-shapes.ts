import type { QraftyDataModulesStyle } from "@/features/qr-code/model/state"

export type CustomDotShape = "diamond" | "heart"

type ShapeDefinition = {
  d: string
  minX: number
  minY: number
  maxX: number
  maxY: number
  insetRatio: number
}

type CustomDotShapeGeometry = {
  d: string
  translateX: number
  translateY: number
  scaleX: number
  scaleY: number
  originX: number
  originY: number
}

const CUSTOM_DOT_SHAPES: Record<CustomDotShape, ShapeDefinition> = {
  diamond: {
    d: "M256 0 L72.115 256 L256 512 L439.885 256 Z",
    minX: 72.115,
    minY: 0,
    maxX: 439.885,
    maxY: 512,
    insetRatio: 0.02,
  },
  heart: {
    d: "M1.24264 8.24264 L8 15 L14.7574 8.24264 C15.553 7.44699 16 6.36786 16 5.24264 V5.05234 C16 2.8143 14.1857 1 11.9477 1 C10.7166 1 9.55233 1.55959 8.78331 2.52086 L8 3.5 L7.21669 2.52086 C6.44767 1.55959 5.28338 1 4.05234 1 C1.8143 1 0 2.8143 0 5.05234 V5.24264 C0 6.36786 0.44699 7.44699 1.24264 8.24264 Z",
    minX: 0,
    minY: 1,
    maxX: 16,
    maxY: 15,
    insetRatio: 0.04,
  },
}

export function isCustomDotShape(value: string): value is CustomDotShape {
  return value === "diamond" || value === "heart"
}

export function getCustomDotShapeGeometry(
  shape: CustomDotShape,
  x: number,
  y: number,
  size: number,
): CustomDotShapeGeometry {
  const definition = CUSTOM_DOT_SHAPES[shape]
  const inset = size * definition.insetRatio
  const innerSize = size - inset * 2
  const shapeWidth = definition.maxX - definition.minX
  const shapeHeight = definition.maxY - definition.minY

  return {
    d: definition.d,
    translateX: x + inset,
    translateY: y + inset,
    scaleX: innerSize / shapeWidth,
    scaleY: innerSize / shapeHeight,
    originX: -definition.minX,
    originY: -definition.minY,
  }
}

export function getActiveCustomDotShape(type: QraftyDataModulesStyle): CustomDotShape | null {
  return isCustomDotShape(type) ? type : null
}
