import type { StudioGradient } from "@/features/qr-code/model/state"

export type StudioGradientCenter = {
  x: number
  y: number
}

export const DEFAULT_STUDIO_GRADIENT_CENTER: StudioGradientCenter = {
  x: 0.5,
  y: 0.5,
}

export function getStudioGradientCenter(
  gradient: Pick<StudioGradient, "center">,
): StudioGradientCenter {
  return gradient.center ?? DEFAULT_STUDIO_GRADIENT_CENTER
}

export function clampStudioGradientCenter(
  center: StudioGradientCenter,
): StudioGradientCenter {
  return {
    x: Math.min(1, Math.max(0, center.x)),
    y: Math.min(1, Math.max(0, center.y)),
  }
}

export function studioRadialCenterInUserSpace(
  center: StudioGradientCenter,
  bounds: { x: number; y: number; width: number; height: number },
) {
  return {
    cx: bounds.x + center.x * bounds.width,
    cy: bounds.y + center.y * bounds.height,
    r: Math.max(bounds.width, bounds.height) / 2,
  }
}

export function studioRadialCenterAsPercent(center: StudioGradientCenter) {
  return {
    cx: `${center.x * 100}%`,
    cy: `${center.y * 100}%`,
  }
}
