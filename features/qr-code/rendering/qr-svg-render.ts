import { ReactQRCode } from "@qrafty/qr-internal/react-qr-code"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server.browser"

import { toReactQrCodeProps } from "@/features/qr-code/adapters/react-qr-adapter"
import { type QraftyState } from "@/features/qr-code/model/state"
import {
  getQrEncodeCacheKey,
  readCachedQrEncodeMarkup,
  writeCachedQrEncodeMarkup,
} from "@/features/qr-code/rendering/qr-encode-cache"
import {
  applyQraftyQrSvgMarkupExtensions,
  buildDashboardQrNodePayloadFromBaseMarkup,
  createDashboardSurfaceQrState,
  stripXmlDeclaration,
} from "@/features/qr-code/rendering/qr-svg-markup"

function renderReactQrBaseMarkup(state: QraftyState) {
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

export async function buildDashboardQrNodePayload(state: QraftyState) {
  return buildDashboardQrNodePayloadFromBaseMarkup(renderReactQrBaseMarkup(state), state)
}

export function renderDashboardQrSvgMarkup(state: QraftyState) {
  return applyQraftyQrSvgMarkupExtensions(renderReactQrBaseMarkup(state), createDashboardSurfaceQrState(state))
}
