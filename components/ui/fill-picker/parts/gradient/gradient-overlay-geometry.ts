import type { Gradient } from "../../lib/gradient";
import {
  HANDLE_PX,
  keywordToRadii,
  type GradientOverlayHandlePositions,
  type XY,
} from "./gradient-overlay-handles";

function angleToDir(angleDeg: number): XY {
  const r = (angleDeg * Math.PI) / 180;
  return { x: Math.sin(r), y: -Math.cos(r) };
}

function edgeExtent(dir: XY, halfW: number, halfH: number): number {
  const ex = dir.x === 0 ? Infinity : halfW / Math.abs(dir.x);
  const ey = dir.y === 0 ? Infinity : halfH / Math.abs(dir.y);
  return Math.min(ex, ey);
}

export function computeOverlayHandles(
  gradient: Gradient,
  dims: { w: number; h: number },
  conicDialRadius?: number,
): GradientOverlayHandlePositions | null {
  const { w, h } = dims;
  if (w === 0 || h === 0) return null;
  const cx = w / 2;
  const cy = h / 2;

  if (gradient.type === "linear") {
    if (gradient.start && gradient.end) {
      const inset = HANDLE_PX / 2;
      const clampX = (px: number) => Math.max(inset, Math.min(w - inset, px));
      const clampY = (px: number) => Math.max(inset, Math.min(h - inset, px));
      return {
        a: {
          x: clampX(gradient.start.x * w),
          y: clampY(gradient.start.y * h),
        },
        b: {
          x: clampX(gradient.end.x * w),
          y: clampY(gradient.end.y * h),
        },
        showConnector: true,
      };
    }
    const dir = angleToDir(gradient.angle);
    const inset = HANDLE_PX / 2;
    const t = edgeExtent(
      dir,
      Math.max(0, w / 2 - inset),
      Math.max(0, h / 2 - inset),
    );
    return {
      a: { x: cx - dir.x * t, y: cy - dir.y * t },
      b: { x: cx + dir.x * t, y: cy + dir.y * t },
      showConnector: true,
    };
  }

  if (gradient.type === "radial") {
    const ax = gradient.center.x * w;
    const ay = gradient.center.y * h;
    let bx: number;
    let by: number;
    if (gradient.shape === "circle" && gradient.radiusPx !== undefined) {
      bx = ax + gradient.radiusPx;
      by = ay;
    } else if (gradient.radii) {
      bx = ax + gradient.radii.x * w;
      by = ay + gradient.radii.y * h;
    } else {
      const seeded = keywordToRadii(
        gradient.shape,
        gradient.size,
        gradient.center,
        w,
        h,
      );
      bx = ax + seeded.x * w;
      by = ay + seeded.y * h;
    }
    return {
      a: { x: ax, y: ay },
      b: { x: bx, y: by },
      showConnector: false,
    };
  }

  const a = { x: gradient.center.x * w, y: gradient.center.y * h };
  const dir = angleToDir(gradient.startAngle);
  const dialR = conicDialRadius ?? Math.min(w, h) / 2 - HANDLE_PX;
  return {
    a,
    b: { x: a.x + dir.x * dialR, y: a.y + dir.y * dialR },
    showConnector: true,
  };
}
