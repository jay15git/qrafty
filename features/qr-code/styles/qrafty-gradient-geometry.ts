import type { QraftyGradient } from "@/features/qr-code/model/state"

export type QraftyGradientCenter = {
  x: number
  y: number
}

export const DEFAULT_STUDIO_GRADIENT_CENTER: QraftyGradientCenter = {
  x: 0.5,
  y: 0.5,
}

export function getQraftyGradientCenter(
  gradient: Pick<QraftyGradient, "center">,
): QraftyGradientCenter {
  return gradient.center ?? DEFAULT_STUDIO_GRADIENT_CENTER
}

export function clampQraftyGradientCenter(
  center: QraftyGradientCenter,
): QraftyGradientCenter {
  return {
    x: Math.min(1, Math.max(0, center.x)),
    y: Math.min(1, Math.max(0, center.y)),
  }
}

export function qraftyRadialCenterInUserSpace(
  center: QraftyGradientCenter,
  bounds: { x: number; y: number; width: number; height: number },
) {
  return {
    cx: bounds.x + center.x * bounds.width,
    cy: bounds.y + center.y * bounds.height,
    r: Math.max(bounds.width, bounds.height) / 2,
  }
}

export function qraftyRadialCenterAsPercent(center: QraftyGradientCenter) {
  return {
    cx: `${center.x * 100}%`,
    cy: `${center.y * 100}%`,
  }
}
