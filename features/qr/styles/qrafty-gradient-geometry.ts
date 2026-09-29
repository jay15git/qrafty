import type { QraftyGradient, QraftyGradientCenter } from "@/features/qr/model/state";

const DEFAULT_STUDIO_GRADIENT_CENTER: QraftyGradientCenter = {
  x: 0.5,
  y: 0.5,
};

export function getQraftyGradientCenter(
  gradient: Pick<QraftyGradient, "center">,
): QraftyGradientCenter {
  return gradient.center ?? DEFAULT_STUDIO_GRADIENT_CENTER;
}

export function clampQraftyGradientCenter(center: QraftyGradientCenter): QraftyGradientCenter {
  return {
    x: Math.min(1, Math.max(0, center.x)),
    y: Math.min(1, Math.max(0, center.y)),
  };
}

export function qraftyRadialCenterAsPercent(center: QraftyGradientCenter) {
  return {
    cx: `${center.x * 100}%`,
    cy: `${center.y * 100}%`,
  };
}
