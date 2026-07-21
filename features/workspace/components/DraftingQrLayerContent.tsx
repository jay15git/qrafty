"use client"

import { memo, useMemo, type CSSProperties } from "react"

import type { QrStudioState } from "@/features/qr-code/model/state"
import { buildDraftingQrStudioPreviewMarkup } from "@/features/qr-code/rendering/drafting-qr-preview"
import {
  getDraftingQrDomPlacementStyle,
  getDraftingQrLayerLayout,
} from "@/features/qr-code/rendering/svg-extension"
import { DraftingQrBackground } from "@/features/workspace/components/QrBackground"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"

type DraftingQrLayerContentProps = {
  canvasSvgMarkup: string | null
  layer: DraftingCanvasLayer
  qrMarkup: string
  shapeTiltInnerStyle: CSSProperties
  shapeTiltPerspectiveStyle: CSSProperties
  state: QrStudioState
}

export const DraftingQrLayerContent = memo(function DraftingQrLayerContent({
  layer,
  shapeTiltInnerStyle,
  shapeTiltPerspectiveStyle,
  state,
}: DraftingQrLayerContentProps) {
  const layout = getDraftingQrLayerLayout(layer.width, state, layer.height)
  const qrPlacementStyle = getDraftingQrDomPlacementStyle(layout)
  const qrSvgMarkup = useMemo(
    () => buildDraftingQrStudioPreviewMarkup(state, layout.innerWidth, layout.innerHeight),
    [layout.innerHeight, layout.innerWidth, state],
  )

  return (
    <div className="relative h-full w-full" style={shapeTiltPerspectiveStyle}>
      <div className="relative h-full w-full" style={shapeTiltInnerStyle}>
        <DraftingQrBackground layer={layer} state={state} />
        <div
          className="pointer-events-none z-10 overflow-hidden"
          data-slot="drafting-qr-component"
          style={{
            ...qrPlacementStyle,
            transformStyle: shapeTiltInnerStyle.transformStyle,
          }}
          {...(qrSvgMarkup ? { dangerouslySetInnerHTML: { __html: qrSvgMarkup } } : {})}
        />
      </div>
    </div>
  )
})
