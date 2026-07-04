export type CursorCastShadowOptions = {
  baseLength?: number
  depthLengthMultiplier?: number
  baseBlur?: number
  depthBlurMultiplier?: number
  baseOpacity?: number
  depthOpacityMultiplier?: number
  maxOpacity?: number
  fallbackOffsetX?: number
  fallbackOffsetY?: number
}

const DEFAULT_OPTIONS: Required<CursorCastShadowOptions> = {
  baseLength: 32,
  depthLengthMultiplier: 12,
  baseBlur: 36,
  depthBlurMultiplier: 12,
  baseOpacity: 0.28,
  depthOpacityMultiplier: 0.02,
  maxOpacity: 0.38,
  fallbackOffsetX: 20,
  fallbackOffsetY: 32,
}

export function computeCursorCastShadowOffset(
  lightX: number,
  lightY: number,
  elementCenterX: number,
  elementCenterY: number,
  depth: number,
  options: CursorCastShadowOptions = {},
): { x: number; y: number } {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const dx = elementCenterX - lightX
  const dy = elementCenterY - lightY
  const distance = Math.hypot(dx, dy)

  if (distance < 0.001) {
    return { x: config.fallbackOffsetX, y: config.fallbackOffsetY }
  }

  const normalizedX = dx / distance
  const normalizedY = dy / distance
  const length =
    config.baseLength + Math.max(depth, 0) * config.depthLengthMultiplier

  return {
    x: normalizedX * length,
    y: normalizedY * length,
  }
}

export function buildCursorCastShadowFilterFromOffset(
  offsetX: number,
  offsetY: number,
  depth: number,
  options: CursorCastShadowOptions = {},
): string {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const blur =
    config.baseBlur + Math.max(depth, 0) * config.depthBlurMultiplier
  const opacity = Math.min(
    config.maxOpacity,
    config.baseOpacity + Math.max(depth, 0) * config.depthOpacityMultiplier,
  )

  const contactOffsetX = offsetX * 0.3
  const contactOffsetY = offsetY * 0.3
  const contactBlur = blur * 0.4
  const contactOpacity = Math.min(config.maxOpacity, opacity * 0.45)

  return [
    `drop-shadow(${offsetX.toFixed(2)}px ${offsetY.toFixed(2)}px ${blur.toFixed(2)}px rgba(0, 0, 0, ${opacity.toFixed(3)}))`,
    `drop-shadow(${contactOffsetX.toFixed(2)}px ${contactOffsetY.toFixed(2)}px ${contactBlur.toFixed(2)}px rgba(0, 0, 0, ${contactOpacity.toFixed(3)}))`,
  ].join(" ")
}

export function buildCursorCastShadowFilter(
  lightX: number,
  lightY: number,
  elementCenterX: number,
  elementCenterY: number,
  depth: number,
  options: CursorCastShadowOptions = {},
): string {
  const { x: offsetX, y: offsetY } = computeCursorCastShadowOffset(
    lightX,
    lightY,
    elementCenterX,
    elementCenterY,
    depth,
    options,
  )

  return buildCursorCastShadowFilterFromOffset(offsetX, offsetY, depth, options)
}
