"use client"

import { memo, type CSSProperties, type ReactNode } from "react"

import { DotMatrixAnimatedQr } from "@/features/qr/components/DotMatrixAnimatedQr"
import { shouldUseDotMatrixMotionPreview } from "@/features/qr/motion/dot-matrix-bridge"
import type { QraftyState } from "@/features/qr/model/state"
import {
  getDraftingQrDomPlacementStyle,
  getDraftingQrLayerLayout,
} from "@/features/qr/rendering/svg-extension"
import { DraftingQrBackground } from "@/features/canvas/components/QrBackground"
import type { DraftingCanvasLayer } from "@/features/canvas/model/layers"
import { getDraftingPerSideBorderStyle } from "@/features/canvas/rendering/layer-appearance"
import { cn } from "@/lib/utils"

type DraftingQrLayerContentProps = {
  canvasSvgMarkup: string | null
  layer: DraftingCanvasLayer
  overlayMessage?: string | null
  overlayScale?: number
  /** SVG markup already sanitized by useDraftingQrMarkup (DOMPurify) upstream. */
  sanitizedQrMarkup: string
  shapeTiltInnerStyle: CSSProperties
  shapeTiltPerspectiveStyle: CSSProperties
  state: QraftyState
}

const QR_OVERLAY_PILL_CLASS =
  "max-w-[calc(100%-0.5rem)] rounded-full border border-black/10 bg-white px-5 py-2.5 text-center text-xl font-semibold leading-snug text-black shadow-[var(--glass-shadow)] dark:border-white/15 dark:bg-black dark:text-white"

function QrModulesWithOverlay({
  borderStyle,
  children,
  overlayMessage,
  overlayScale = 1,
  qrPlacementStyle,
  transformStyle,
}: {
  borderStyle?: CSSProperties
  children: ReactNode
  overlayMessage?: string | null
  overlayScale?: number
  qrPlacementStyle: CSSProperties
  transformStyle?: CSSProperties["transformStyle"]
}) {
  const showOverlay = Boolean(overlayMessage)
  const pillScale =
    Number.isFinite(overlayScale) && overlayScale > 0 && overlayScale !== 1
      ? `scale(${1 / overlayScale})`
      : undefined

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
          <p
            className={QR_OVERLAY_PILL_CLASS}
            style={{
              transform: pillScale,
              transformOrigin: "center center",
            }}
          >
            {overlayMessage}
          </p>
        </div>
      ) : null}
    </>
  )
}

export const DraftingQrLayerContent = memo(function DraftingQrLayerContent({
  canvasSvgMarkup,
  layer,
  overlayMessage,
  overlayScale,
  sanitizedQrMarkup,
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
            overlayScale={overlayScale}
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
          overlayScale={overlayScale}
          qrPlacementStyle={qrPlacementStyle}
          transformStyle={shapeTiltInnerStyle.transformStyle}
        >
          <div
            className="h-full w-full"
            data-slot="drafting-qr-component"
            {...(sanitizedQrMarkup ? { dangerouslySetInnerHTML: { __html: sanitizedQrMarkup } } : {})}
          />
        </QrModulesWithOverlay>
      </div>
    </div>
  )
})
