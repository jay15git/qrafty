import { ReactQRCode } from "../react-qr-code"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import type { QraftyQrCodeProps } from "../types"
import { applyQraftyQrSvgExtensions } from "./svg-extension"
import { qraftyPropsToReactQrProps } from "./map-props"

export function stripXmlDeclaration(markup: string) {
  return markup
    .replace(/<\?xml[\s\S]*?\?>\s*/i, "")
    .replace(/<!doctype[\s\S]*?>\s*/i, "")
    .trim()
}

export function renderQraftyQrSvg(props: QraftyQrCodeProps) {
  const markup = stripXmlDeclaration(
    renderToStaticMarkup(createElement(ReactQRCode, qraftyPropsToReactQrProps(props))),
  )

  if (typeof DOMParser === "undefined") {
    return markup
  }

  const document = new DOMParser().parseFromString(markup, "image/svg+xml")
  const svg = document.documentElement

  if (svg.tagName.toLowerCase() !== "svg" || document.querySelector("parsererror")) {
    return markup
  }

  applyQraftyQrSvgExtensions(svg as unknown as SVGElement, props)
  return new XMLSerializer().serializeToString(svg)
}
