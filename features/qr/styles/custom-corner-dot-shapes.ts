export type CustomCornerDotShape =
  | "orbit-weave"
  | "soft-cross"
  | "rounded-plus"
  | "wave-burst"
  | "rounded-diamond"
  | "folded-seal"
  | "twin-orbit"

type ShapeDefinition = {
  d: string
  fillRule?: "evenodd"
  insetRatio: number
  maxX: number
  maxY: number
  minX: number
  minY: number
}

export type CustomCornerDotGeometry = {
  d: string
  fillRule?: "evenodd"
  originX: number
  originY: number
  scaleX: number
  scaleY: number
  translateX: number
  translateY: number
}

const CUSTOM_CORNER_DOT_SHAPES: Record<CustomCornerDotShape, ShapeDefinition> = {
  "orbit-weave": {
    d: "M 228 0 C 172.772 0 128 44.772 128 100 L 128 0 L 0 0 L 0 28 C 0 83.228 44.772 128 100 128 L 0 128 L 0 256 L 28 256 C 83.228 256 128 211.228 128 156 L 128 256 L 256 256 L 256 228 C 256 172.772 211.228 128 156 128 L 256 128 L 256 0 Z",
    insetRatio: 0.04,
    minX: 0,
    minY: 0,
    maxX: 256,
    maxY: 256,
  },
  "soft-cross": {
    d: "M 78 0 C 105.614 0 128 22.386 128 50 C 128 22.386 150.386 0 178 0 L 256 0 L 256 78 C 256 105.614 233.614 128 206 128 C 233.614 128 256 150.386 256 178 L 256 256 L 178 256 C 150.386 256 128 233.614 128 206 C 128 233.614 105.614 256 78 256 L 0 256 L 0 178 C 0 150.386 22.386 128 50 128 C 22.386 128 0 105.614 0 78 L 0 0 Z",
    insetRatio: 0.04,
    minX: 0,
    minY: 0,
    maxX: 256,
    maxY: 256,
  },
  "rounded-plus": {
    d: "M 108 0 C 119.046 0 128 8.954 128 20 L 128.007 19.483 C 128.281 8.676 137.127 0 148 0 L 236 0 C 247.046 0 256 8.954 256 20 L 256 108 C 256 119.046 247.046 128 236 128 C 247.046 128 256 136.954 256 148 L 256 236 C 256 247.046 247.046 256 236 256 L 148 256 C 136.954 256 128 247.046 128 236 C 128 247.046 119.046 256 108 256 L 20 256 C 8.954 256 0 247.046 0 236 L 0 148 C 0 137.127 8.676 128.281 19.483 128.007 L 20 128 C 8.954 128 0 119.046 0 108 L 0 20 C 0 8.954 8.954 0 20 0 Z M 128 64 C 128 99.346 99.346 128 64 128 C 99.346 128 128 156.654 128 192 C 128 156.654 156.654 128 192 128 C 156.654 128 128 99.346 128 64 Z",
    fillRule: "evenodd",
    insetRatio: 0.04,
    minX: 0,
    minY: 0,
    maxX: 256,
    maxY: 256,
  },
  "wave-burst": {
    d: "M 256 0 C 256 35.346 227.346 64 192 64 C 227.346 64 256 92.654 256 128 C 256 163.346 227.346 192 192 192 C 227.346 192 256 220.654 256 256 L 0 256 C 0 220.654 28.654 192 64 192 C 28.654 192 0 163.346 0 128 C 0 92.654 28.654 64 64 64 C 28.654 64 0 35.346 0 0 Z",
    insetRatio: 0.04,
    minX: 0,
    minY: 0,
    maxX: 256,
    maxY: 256,
  },
  "rounded-diamond": {
    d: "M 206 0 C 233.614 0 256 22.386 256 50 L 256 206 C 256 233.614 233.614 256 206 256 L 50 256 C 22.386 256 0 233.614 0 206 L 0 50 C 0 22.386 22.386 0 50 0 Z M 128 64 C 128 99.346 99.346 128 64 128 C 99.346 128 128 156.654 128 192 C 128 156.654 156.654 128 192 128 C 156.654 128 128 99.346 128 64 Z",
    fillRule: "evenodd",
    insetRatio: 0.04,
    minX: 0,
    minY: 0,
    maxX: 256,
    maxY: 256,
  },
  "folded-seal": {
    d: "M 28 0 C 83.228 0 128 44.772 128 100 C 128 44.772 172.772 0 228 0 L 256 0 L 256 156 C 256 211.228 211.228 256 156 256 L 100 256 C 44.772 256 0 211.228 0 156 L 0 0 Z",
    insetRatio: 0.04,
    minX: 0,
    minY: 0,
    maxX: 256,
    maxY: 256,
  },
  "twin-orbit": {
    d: "M 64 0 C 99.346 0 128 28.654 128 64 L 128 192 C 128 227.346 99.346 256 64 256 C 28.654 256 0 227.346 0 192 C 0 156.654 28.654 128 64 128 C 28.654 128 0 99.346 0 64 C 0 28.654 28.654 0 64 0 Z M 192 128 C 156.654 128 128 99.346 128 64 C 128 28.654 156.654 0 192 0 C 227.346 0 256 28.654 256 64 L 256 192 C 256 227.346 227.346 256 192 256 C 156.654 256 128 227.346 128 192 C 128 156.654 156.654 128 192 128 Z",
    insetRatio: 0.04,
    minX: 0,
    minY: 0,
    maxX: 256,
    maxY: 256,
  },
}

export const CUSTOM_CORNER_DOT_SHAPE_OPTIONS: Array<{
  label: string
  value: CustomCornerDotShape
}> = [
  { label: "Orbit weave", value: "orbit-weave" },
  { label: "Soft cross", value: "soft-cross" },
  { label: "Rounded plus", value: "rounded-plus" },
  { label: "Wave burst", value: "wave-burst" },
  { label: "Rounded diamond", value: "rounded-diamond" },
  { label: "Folded seal", value: "folded-seal" },
  { label: "Twin orbit", value: "twin-orbit" },
]

export function isCustomCornerDotShape(value: string): value is CustomCornerDotShape {
  return value in CUSTOM_CORNER_DOT_SHAPES
}

export function getCustomCornerDotShapeGeometry(
  shape: CustomCornerDotShape,
  x: number,
  y: number,
  size: number,
): CustomCornerDotGeometry {
  const definition = CUSTOM_CORNER_DOT_SHAPES[shape]
  const inset = size * definition.insetRatio
  const innerSize = size - inset * 2
  const shapeWidth = definition.maxX - definition.minX
  const shapeHeight = definition.maxY - definition.minY

  return {
    d: definition.d,
    fillRule: definition.fillRule,
    translateX: x + inset,
    translateY: y + inset,
    scaleX: innerSize / shapeWidth,
    scaleY: innerSize / shapeHeight,
    originX: -definition.minX,
    originY: -definition.minY,
  }
}

export function buildCustomCornerDotTransform(geometry: CustomCornerDotGeometry) {
  return `translate(${geometry.translateX} ${geometry.translateY}) scale(${geometry.scaleX} ${geometry.scaleY}) translate(${geometry.originX} ${geometry.originY})`
}
