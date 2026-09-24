"use client";

import { useMemo } from "react";

import type { CanvasLayer } from "@/features/canvas/model/layers/shared";
import type { QraftyState } from "@/features/qr/model/state";
import { buildCanvasQrBackgroundSvgPayload } from "@/features/canvas/components/canvas-qr-background";

function getCanvasQrBackgroundFrame(layer: CanvasLayer) {
  return {
    height: layer.height,
    width: layer.width,
    x: 0,
    y: 0,
  };
}

export function CanvasQrBackground({ layer, state }: { layer: CanvasLayer; state: QraftyState }) {
  const frame = getCanvasQrBackgroundFrame(layer);
  const payload = useMemo(() => buildCanvasQrBackgroundSvgPayload(layer, state), [layer, state]);

  if (!payload) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-0 overflow-visible"
      data-background-shape={payload.shapeId}
      data-slot="canvas-qr-background"
      style={{
        height: frame.height,
        left: frame.x,
        top: frame.y,
        width: frame.width,
      }}
      dangerouslySetInnerHTML={{ __html: payload.markup }}
    />
  );
}
