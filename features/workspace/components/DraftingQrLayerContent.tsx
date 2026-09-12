"use client"

import { memo, type CSSProperties, type ReactNode } from "react"

import { DotMatrixAnimatedQr } from "@/features/qr-code/components/DotMatrixAnimatedQr"
import { shouldUseDotMatrixMotionPreview } from "@/features/qr-code/motion/dot-matrix-bridge"
import type { QraftyState } from "@/features/qr-code/model/state"
import {
  getDraftingQrDomPlacementStyle,
  getDraftingQrLayerLayout,
} from "@/features/qr-code/rendering/svg-extension"
import { DraftingQrBackground } from "@/features/workspace/components/QrBackground"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import { getDraftingPerSideBorderStyle } from "@/features/workspace/rendering/layer-appearance"
import { cn } from "@/lib/utils"

type DraftingQrLayerContentProps = {
  canvasSvgMarkup: string | null
  layer: DraftingCanvasLayer
  overlayMessage?: string | null
  qrMarkup: string
  shapeTiltInnerStyle: CSSProperties
  shapeTiltPerspectiveStyle: CSSProperties
  state: QraftyState
}

const QR_OVERLAY_PILL_CLASS =
  "max-w-[calc(100%-0.5rem)] rounded-full border border-white/[0.12] bg-[var(--desktop-glass-bg)] px-2.5 py-1 text-center text-[0.68rem] font-semibold leading-snug text-white/82 shadow-[var(--desktop-glass-shadow)] backdrop-blur-2xl"

function QrModulesWithOverlay({
  borderStyle,
  children,
  overlayMessage,
  qrPlacementStyle,
  transformStyle,
}: {
  borderStyle?: CSSProperties
  children: ReactNode
  overlayMessage?: string | null
  qrPlacementStyle: CSSProperties
  transformStyle?: CSSProperties["transformStyle"]
}) {
  const showOverlay = Boolean(overlayMessage)

  return (
    <>
      <div
        className={cn("pointer-events-none z-10 overflow-hidden", showOverlay && "blur-sm")}
        style={{
          ...qrPlacementStyle,
          ...borderStyle,
          transformStyle,
        }}
      >
        {children}
      </div>
      {showOverlay ? (
        <div
          aria-live="polite"
          className="pointer-events-none absolute z-20 flex items-center justify-center px-2"
          role="status"
          style={{
            ...qrPlacementStyle,
            transformStyle,
          }}
        >
          <p className={QR_OVERLAY_PILL_CLASS}>{overlayMessage}</p>
        </div>
      ) : null}
    </>
  )
}

export const DraftingQrLayerContent = memo(function DraftingQrLayerContent({
  canvasSvgMarkup,
  layer,
  overlayMessage,
  qrMarkup,
  shapeTiltInnerStyle,
  shapeTiltPerspectiveStyle,
  state,
}: DraftingQrLayerContentProps) {
  const layout = getDraftingQrLayerLayout(layer.width, state, layer.height)
  const qrPlacementStyle = getDraftingQrDomPlacementStyle(layout)
  const qrBorderStyle = layer.borderSides
    ? getDraftingPerSideBorderStyle(layer.borderSides)
    : undefined
  const useAnimatedQr = shouldUseDotMatrixMotionPreview(state) && Boolean(canvasSvgMarkup)

  if (useAnimatedQr) {
    return (
      <div className="relative h-full w-full" style={shapeTiltPerspectiveStyle}>
        <div className="relative h-full w-full" style={shapeTiltInnerStyle}>
          <DraftingQrBackground layer={layer} state={state} />
          <QrModulesWithOverlay
            borderStyle={qrBorderStyle}
            overlayMessage={overlayMessage}
            qrPlacementStyle={qrPlacementStyle}
            transformStyle={shapeTiltInnerStyle.transformStyle}
          >
            <DotMatrixAnimatedQr
              canvasSvgMarkup={canvasSvgMarkup}
              height={layout.innerHeight}
              state={state}
              style={{
                height: "100%",
                width: "100%",
              }}
              width={layout.innerWidth}
            />
          </QrModulesWithOverlay>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full" style={shapeTiltPerspectiveStyle}>
      <div className="relative h-full w-full" style={shapeTiltInnerStyle}>
        <DraftingQrBackground layer={layer} state={state} />
        <QrModulesWithOverlay
          borderStyle={qrBorderStyle}
          overlayMessage={overlayMessage}
          qrPlacementStyle={qrPlacementStyle}
          transformStyle={shapeTiltInnerStyle.transformStyle}
        >
          <div
            className="h-full w-full"
            data-slot="drafting-qr-component"
            {...(qrMarkup ? { dangerouslySetInnerHTML: { __html: qrMarkup } } : {})}
          />
        </QrModulesWithOverlay>
      </div>
    </div>
  )
})
