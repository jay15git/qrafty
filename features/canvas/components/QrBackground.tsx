"use client";

import { useMemo } from "react";

import type { DraftingCanvasLayer } from "@/features/canvas/model/layers/shared";
import type { QraftyState } from "@/features/qr/model/state";
import { buildDraftingQrBackgroundSvgPayload } from "@/features/canvas/components/drafting-qr-background";

function getDraftingQrBackgroundFrame(layer: DraftingCanvasLayer) {
  return {
    height: layer.height,
    width: layer.width,
    x: 0,
    y: 0,
  };
}

export function DraftingQrBackground({
  layer,
  state,
}: {
  layer: DraftingCanvasLayer;
  state: QraftyState;
}) {
  const frame = getDraftingQrBackgroundFrame(layer);
  const payload = useMemo(() => buildDraftingQrBackgroundSvgPayload(layer, state), [layer, state]);

  if (!payload) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-0 overflow-visible"
      data-background-shape={payload.shapeId}
      data-slot="drafting-qr-background"
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
