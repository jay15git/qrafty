"use client"

import { memo, useMemo, type CSSProperties } from "react"

import { BitjsonAnimatedQr } from "@/features/qr-code/components/BitjsonAnimatedQr"
import { shouldUseBitjsonMotionPreview } from "@/features/qr-code/motion/bitjson-bridge"
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
  canvasSvgMarkup,
  layer,
  qrMarkup,
  shapeTiltInnerStyle,
  shapeTiltPerspectiveStyle,
  state,
}: DraftingQrLayerContentProps) {
  const layout = getDraftingQrLayerLayout(layer.width, state, layer.height)
  const qrPlacementStyle = getDraftingQrDomPlacementStyle(layout)
  const useAnimatedQr = shouldUseBitjsonMotionPreview(state) && Boolean(canvasSvgMarkup)
  const qrSvgMarkup = useMemo(
    () => buildDraftingQrStudioPreviewMarkup(state, layout.innerWidth, layout.innerHeight),
    [layout.innerHeight, layout.innerWidth, state],
  )

  if (useAnimatedQr) {
    return (
      <div className="relative h-full w-full" style={shapeTiltPerspectiveStyle}>
        <div className="relative h-full w-full" style={shapeTiltInnerStyle}>
          <DraftingQrBackground layer={layer} state={state} />
          <BitjsonAnimatedQr
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
          {...(qrSvgMarkup ? { dangerouslySetInnerHTML: { __html: qrSvgMarkup } } : {})}
        />
      </div>
    </div>
  )
})
