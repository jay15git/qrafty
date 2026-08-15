"use client";

import * as React from "react";
import type { Gradient } from "../../lib/gradient";
import { useGradientPickerContext } from "../../contexts/gradient";
import { useLiveAnnounce } from "../use-live-announce";
import { trackPointerDrag } from "./pointer-drag";
import {
  HANDLE_PX,
  keywordToRadii,
  type HandleKind,
  type XY,
} from "./gradient-overlay-handles";

function dirToAngle(dx: number, dy: number): number {
  const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return (deg + 360) % 360;
}

function angleToDir(angleDeg: number): XY {
  const r = (angleDeg * Math.PI) / 180;
  return { x: Math.sin(r), y: -Math.cos(r) };
}

function edgeExtent(dir: XY, halfW: number, halfH: number): number {
  const ex = dir.x === 0 ? Infinity : halfW / Math.abs(dir.x);
  const ey = dir.y === 0 ? Infinity : halfH / Math.abs(dir.y);
  return Math.min(ex, ey);
}

function snapDeg(deg: number, step: number): number {
  const s = Math.round(deg / step) * step;
  return ((s % 360) + 360) % 360;
}

function rotateAngle(current: number, e: React.KeyboardEvent): number | null {
  const step = e.shiftKey ? 15 : 1;
  let next = current;
  if (e.key === "ArrowRight" || e.key === "ArrowUp") next = current + step;
  else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = current - step;
  else if (e.key === "Home") next = 0;
  else if (e.key === "End") next = 359;
  else return null;
  return ((next % 360) + 360) % 360;
}

export function useGradientOverlayInteractions(
  padRef: React.RefObject<HTMLDivElement | null>,
  dims: { w: number; h: number },
  gradient: Gradient,
) {
  const ctx = useGradientPickerContext();
  const [liveText, announce] = useLiveAnnounce();

  const localFromEvent = (clientX: number, clientY: number): XY => {
    const el = padRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  };

  const handleAt = (kind: HandleKind, p: XY, shiftKey: boolean) => {
    const { w, h } = dims;
    const cx = w / 2;
    const cy = h / 2;

    if (kind === "linear-a" || kind === "linear-b") {
      if (gradient.type !== "linear") return;
      const nx = Math.max(0, Math.min(1, p.x / w));
      const ny = Math.max(0, Math.min(1, p.y / h));
      const ensureOther = (existing: { x: number; y: number } | undefined) => {
        if (existing) return existing;
        const dir = angleToDir(gradient.angle);
        const inset = HANDLE_PX / 2;
        const t = edgeExtent(
          dir,
          Math.max(0, w / 2 - inset),
          Math.max(0, h / 2 - inset),
        );
        const sign = kind === "linear-a" ? 1 : -1;
        const ox = cx + dir.x * t * sign;
        const oy = cy + dir.y * t * sign;
        return { x: ox / w, y: oy / h };
      };
      if (kind === "linear-a") {
        const other = ensureOther(gradient.end);
        if (!gradient.end) ctx.setLinearEnd(other);
        ctx.setLinearStart({ x: nx, y: ny });
      } else {
        const other = ensureOther(gradient.start);
        if (!gradient.start) ctx.setLinearStart(other);
        ctx.setLinearEnd({ x: nx, y: ny });
      }
      return;
    }

    if (kind === "center") {
      const nx = Math.max(0, Math.min(1, p.x / w));
      const ny = Math.max(0, Math.min(1, p.y / h));
      ctx.setCenter({ x: nx, y: ny });
      return;
    }

    if (kind === "radial-edge") {
      if (gradient.type !== "radial") return;
      const ax = gradient.center.x * w;
      const ay = gradient.center.y * h;
      const dxPx = Math.abs(p.x - ax);
      const dyPx = Math.abs(p.y - ay);
      const renderAsCircle = (gradient.shape === "circle") !== shiftKey;
      if (renderAsCircle) {
        const rPx = Math.max(dxPx, dyPx);
        ctx.setRadiusPx(rPx);
      } else {
        ctx.setRadii({
          x: Math.max(0, Math.min(2, dxPx / w)),
          y: Math.max(0, Math.min(2, dyPx / h)),
        });
      }
      return;
    }

    if (gradient.type !== "conic") return;
    const ax = gradient.center.x * w;
    const ay = gradient.center.y * h;
    let deg = dirToAngle(p.x - ax, p.y - ay);
    if (shiftKey) deg = snapDeg(deg, 15);
    ctx.setStartAngle(deg);
  };

  const onKeyDownAngle = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (gradient.type !== "linear") return;
    const next = rotateAngle(gradient.angle, e);
    if (next === null) return;
    e.preventDefault();
    ctx.setAngle(next);
  };

  const onKeyDownLinearEndpoint = (
    which: "linear-a" | "linear-b",
    e: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (gradient.type !== "linear") return;
    const point = which === "linear-a" ? gradient.start : gradient.end;
    if (!point) {
      onKeyDownAngle(e);
      return;
    }
    const step = e.shiftKey ? 0.05 : 0.01;
    let { x, y } = point;
    if (e.key === "ArrowLeft") x -= step;
    else if (e.key === "ArrowRight") x += step;
    else if (e.key === "ArrowUp") y -= step;
    else if (e.key === "ArrowDown") y += step;
    else return;
    e.preventDefault();
    const next = {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    };
    if (which === "linear-a") ctx.setLinearStart(next);
    else ctx.setLinearEnd(next);
    announce(
      `${which === "linear-a" ? "Start" : "End"} x ${Math.round(next.x * 100)}%, y ${Math.round(next.y * 100)}%`,
    );
  };

  const onKeyDownConicDial = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (gradient.type !== "conic") return;
    const next = rotateAngle(gradient.startAngle, e);
    if (next === null) return;
    e.preventDefault();
    ctx.setStartAngle(next);
  };

  const onKeyDownRadii = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (gradient.type !== "radial") return;
    const { w, h } = dims;
    if (w === 0 || h === 0) return;
    const renderAsCircle = (gradient.shape === "circle") !== e.shiftKey;
    const stepRatio = e.shiftKey ? 0.05 : 0.01;

    if (renderAsCircle) {
      const currentPx =
        gradient.radiusPx ??
        (gradient.radii
          ? Math.max(gradient.radii.x * w, gradient.radii.y * h)
          : keywordToRadii(
              gradient.shape,
              gradient.size,
              gradient.center,
              w,
              h,
            ).x * w);
      const stepPx = stepRatio * Math.min(w, h);
      let next = currentPx;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") next -= stepPx;
      else if (e.key === "ArrowRight" || e.key === "ArrowUp") next += stepPx;
      else return;
      e.preventDefault();
      ctx.setRadiusPx(Math.max(0, next));
      return;
    }

    const current =
      gradient.radii ??
      keywordToRadii(gradient.shape, gradient.size, gradient.center, w, h);
    let { x, y } = current;
    if (e.key === "ArrowLeft") x -= stepRatio;
    else if (e.key === "ArrowRight") x += stepRatio;
    else if (e.key === "ArrowUp") y -= stepRatio;
    else if (e.key === "ArrowDown") y += stepRatio;
    else return;
    e.preventDefault();
    ctx.setRadii({
      x: Math.max(0, Math.min(2, x)),
      y: Math.max(0, Math.min(2, y)),
    });
  };

  const onKeyDownCenter = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (gradient.type === "linear") return;
    const center = gradient.center;
    const step = e.shiftKey ? 0.05 : 0.01;
    let { x, y } = center;
    if (e.key === "ArrowLeft") x -= step;
    else if (e.key === "ArrowRight") x += step;
    else if (e.key === "ArrowUp") y -= step;
    else if (e.key === "ArrowDown") y += step;
    else if (e.key === "Home") {
      x = 0.5;
      y = 0.5;
    } else return;
    e.preventDefault();
    const next = {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    };
    ctx.setCenter(next);
    announce(
      `Center x ${Math.round(next.x * 100)}%, y ${Math.round(next.y * 100)}%`,
    );
  };

  const beginDrag = (kind: HandleKind) => (
    e: React.PointerEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    handleAt(kind, localFromEvent(e.clientX, e.clientY), e.shiftKey);
    trackPointerDrag(e.currentTarget, e.pointerId, (ev) =>
      handleAt(kind, localFromEvent(ev.clientX, ev.clientY), ev.shiftKey),
    );
  };

  return {
    liveText,
    stops: ctx.stops,
    beginDrag,
    onKeyDownLinearEndpoint,
    onKeyDownCenter,
    onKeyDownConicDial,
    onKeyDownRadii,
  };
}
