import { ReactQRCode } from "@new-qr/qr-internal/react-qr-code"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server.browser"

import { toReactQrCodeProps } from "@/features/qr-code/adapters/react-qr-adapter"
import type { QrStudioState } from "@/features/qr-code/model/state"
import { applyStudioQrSvgMarkupExtensions, stripXmlDeclaration } from "@/features/qr-code/rendering/qr-svg-markup"
import {
  createDraftingQrArtworkState,
  sanitizeDraftingQrArtworkMarkup,
  scaleNestedSvgMarkup,
} from "@/features/workspace/rendering/qr-artwork"

export function buildDraftingQrStudioPreviewMarkup(
  state: QrStudioState,
  targetWidth: number,
  targetHeight: number,
) {
  const artworkState = createDraftingQrArtworkState(state)
  const markup = stripXmlDeclaration(
    renderToStaticMarkup(createElement(ReactQRCode, toReactQrCodeProps(artworkState))),
  )
  const enhanced = applyStudioQrSvgMarkupExtensions(markup, artworkState)

  return scaleNestedSvgMarkup(
    sanitizeDraftingQrArtworkMarkup(enhanced),
    targetWidth,
    targetHeight,
  )
}
