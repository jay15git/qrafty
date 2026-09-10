"use client"

import { memo, type CSSProperties } from "react"

import { DotMatrixAnimatedQr } from "@/features/qr-code/components/DotMatrixAnimatedQr"
import { shouldUseDotMatrixMotionPreview } from "@/features/qr-code/motion/dot-matrix-bridge"
import type { QraftyState } from "@/features/qr-code/model/state"
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
  state: QraftyState
}

export const DraftingQrLayerContent = memo(function DraftingQrLayerContent({
  canvasSvgMarkup,
  layer,
  qrMarkup,
  shapeTiltInnerStyle,
  shapeTiltPerspectiveStyle,
  state,
}: DraftingQrLayerContentProps) {
  const layout = getDraftingQrLayerLayout(layer.width, state, layer.height)
  const qrPlacementStyle = getDraftingQrDomPlacementStyle(layout)
  const useAnimatedQr = shouldUseDotMatrixMotionPreview(state) && Boolean(canvasSvgMarkup)

  if (useAnimatedQr) {
    return (
      <div className="relative h-full w-full" style={shapeTiltPerspectiveStyle}>
        <div className="relative h-full w-full" style={shapeTiltInnerStyle}>
          <DraftingQrBackground layer={layer} state={state} />
          <DotMatrixAnimatedQr
            canvasSvgMarkup={canvasSvgMarkup}
            height={layout.innerHeight}
            state={state}
            style={{
              ...qrPlacementStyle,
              transformStyle: shapeTiltInnerStyle.transformStyle,
              zIndex: 10,
            }}
            width={layout.innerWidth}
          />
        </div>
      </div>
    )
  }

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
          {...(qrMarkup ? { dangerouslySetInnerHTML: { __html: qrMarkup } } : {})}
        />
      </div>
    </div>
  )
})
