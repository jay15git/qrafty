import { ReactQRCode } from "@new-qr/qr-internal/react-qr-code"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server.browser"

import { toReactQrCodeProps } from "@/features/qr-code/adapters/react-qr-adapter"
import { type QrStudioState } from "@/features/qr-code/model/state"
import {
  getQrEncodeCacheKey,
  readCachedQrEncodeMarkup,
  writeCachedQrEncodeMarkup,
} from "@/features/qr-code/rendering/qr-encode-cache"
import {
  applyStudioQrSvgMarkupExtensions,
  buildDashboardQrNodePayloadFromBaseMarkup,
  createDashboardSurfaceQrState,
  stripXmlDeclaration,
} from "@/features/qr-code/rendering/qr-svg-markup"

function renderReactQrBaseMarkup(state: QrStudioState) {
  const dashboardState = createDashboardSurfaceQrState(state)
  const cacheKey = getQrEncodeCacheKey(dashboardState)
  const cached = readCachedQrEncodeMarkup(cacheKey)

  if (cached) {
    return cached
  }

  const markup = stripXmlDeclaration(
    renderToStaticMarkup(createElement(ReactQRCode, toReactQrCodeProps(dashboardState))),
  )
  writeCachedQrEncodeMarkup(cacheKey, markup)

  return markup
}

export async function buildDashboardQrNodePayload(state: QrStudioState) {
  return buildDashboardQrNodePayloadFromBaseMarkup(renderReactQrBaseMarkup(state), state)
}

export function renderDashboardQrSvgMarkup(state: QrStudioState) {
  return applyStudioQrSvgMarkupExtensions(renderReactQrBaseMarkup(state), createDashboardSurfaceQrState(state))
}
