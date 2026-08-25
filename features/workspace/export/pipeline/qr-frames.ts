import { seekDotMatrixAnimation } from "@new-qr/qr/dot-matrix"

import { toDotMatrixQrConfig } from "@/features/qr-code/motion/dot-matrix-bridge"
import type { QrStudioState } from "@/features/qr-code/model/state"
import { sanitizeDraftingQrArtworkMarkup } from "@/features/workspace/rendering/qr-artwork"

export function shouldExportAnimatedQr(state: QrStudioState) {
  return state.dotMatrixAnimation.enabled && state.dotMatrixAnimation.animated
}

export function buildAnimatedQrMarkupAtTime(
  qrMarkup: string,
  state: QrStudioState,
  timeMs: number,
) {
  const config = toDotMatrixQrConfig(state, {
    canvasSvgMarkup: sanitizeDraftingQrArtworkMarkup(qrMarkup),
  })

  if (!config.useExternalSvg || !config.externalSvg) {
    return qrMarkup
  }

  if (typeof DOMParser === "undefined" || typeof XMLSerializer === "undefined") {
    return qrMarkup
  }

  const document = new DOMParser().parseFromString(config.externalSvg, "image/svg+xml")
  if (document.querySelector("parsererror")) {
    return qrMarkup
  }

  const container = document.createElement("div")
  container.appendChild(document.documentElement.cloneNode(true))

  seekDotMatrixAnimation(container, config.animationPreset, timeMs, {
    animationSpeed: config.animationSpeed,
    dotMatrixColorBase: config.dotMatrixColorBase,
    dotMatrixColorMid: config.dotMatrixColorMid,
    dotMatrixColorPeak: config.dotMatrixColorPeak,
    dotMatrixOpacityBase: config.dotMatrixOpacityBase,
    dotMatrixOpacityMid: config.dotMatrixOpacityMid,
    dotMatrixOpacityPeak: config.dotMatrixOpacityPeak,
    preserveModuleFills: config.preserveModuleFills,
  })

  const svg = container.firstElementChild
  if (!svg) {
    return qrMarkup
  }

  return new XMLSerializer().serializeToString(svg)
}
