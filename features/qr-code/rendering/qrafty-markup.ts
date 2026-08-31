import { ReactQRCode } from "@qrafty/qr-internal/react-qr-code"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server.browser"

import { toReactQrCodeProps } from "@/features/qr-code/adapters/react-qr-adapter"
import type { QraftyState } from "@/features/qr-code/model/state"
import {
  getQrEncodeCacheKey,
  readCachedQrEncodeMarkup,
  writeCachedQrEncodeMarkup,
} from "@/features/qr-code/rendering/qr-encode-cache"
import {
  applyQraftyQrSvgMarkupExtensions,
  stripXmlDeclaration,
} from "@/features/qr-code/rendering/qr-svg-markup"
import {
  createDraftingQrArtworkState,
  sanitizeDraftingQrArtworkMarkup,
  scaleNestedSvgMarkup,
} from "@/features/workspace/rendering/qr-artwork"

function renderReactQrBaseMarkupCached(state: QraftyState) {
  const cacheKey = getQrEncodeCacheKey(state)
  const cached = readCachedQrEncodeMarkup(cacheKey)

  if (cached) {
    return cached
  }

  const markup = stripXmlDeclaration(
    renderToStaticMarkup(createElement(ReactQRCode, toReactQrCodeProps(state))),
  )
  writeCachedQrEncodeMarkup(cacheKey, markup)

  return markup
}

export function buildDraftingQraftyPreviewMarkup(
  state: QraftyState,
  targetWidth: number,
  targetHeight: number,
) {
  const artworkState = createDraftingQrArtworkState(state)
  const baseMarkup = renderReactQrBaseMarkupCached(artworkState)
  const enhanced = applyQraftyQrSvgMarkupExtensions(baseMarkup, artworkState)

  return scaleNestedSvgMarkup(
    sanitizeDraftingQrArtworkMarkup(enhanced),
    targetWidth,
    targetHeight,
  )
}

export function buildDraftingQraftyMarkup(state: QraftyState) {
  const artworkState = createDraftingQrArtworkState(state)
  const baseMarkup = renderReactQrBaseMarkupCached(artworkState)

  return sanitizeDraftingQrArtworkMarkup(
    applyQraftyQrSvgMarkupExtensions(baseMarkup, artworkState),
  )
}
