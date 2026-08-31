"use client"

import { useMemo } from "react"

import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import type { QraftyState } from "@/features/qr-code/model/state"
import { buildDraftingQrBackgroundSvgPayload } from "@/features/workspace/components/drafting-qr-background.utils"

function getDraftingQrBackgroundFrame(layer: DraftingCanvasLayer) {
  return {
    height: layer.height,
    width: layer.width,
    x: 0,
    y: 0,
  }
}

export function DraftingQrBackground({
  layer,
  state,
}: {
  layer: DraftingCanvasLayer
  state: QraftyState
}) {
  const frame = getDraftingQrBackgroundFrame(layer)
  const payload = useMemo(
    () => buildDraftingQrBackgroundSvgPayload(layer, state),
    [layer, state],
  )

  if (!payload) {
    return null
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
  )
}
