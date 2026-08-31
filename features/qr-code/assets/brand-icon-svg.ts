import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server.browser"

import type { BrandIconEntry } from "@/features/qr-code/assets/brand-icons"
import type { QraftyGradient } from "@/features/qr-code/model/state"
import {
  getQraftyGradientCenter,
  qraftyRadialCenterAsPercent,
} from "@/features/qr-code/styles/qrafty-gradient-geometry"

export const DEFAULT_BRAND_ICON_COLOR = "#111827"
const BRAND_ICON_SIZE = 256
const BRAND_ICON_GRADIENT_ID = "brand-icon-gradient"

function renderBrandIconMarkup(brandIcon: BrandIconEntry, color: string) {
  return renderToStaticMarkup(
    createElement(brandIcon.icon, {
      color,
      size: BRAND_ICON_SIZE,
      title: brandIcon.label,
    }),
  )
}

function createBrandIconSvgMarkup(
  brandIcon: BrandIconEntry,
  color: string,
) {
  return renderBrandIconMarkup(brandIcon, color).replaceAll("currentColor", color)
}

function svgMarkupToDataUrl(markup: string) {
  return `data:image/svg+xml,${encodeURIComponent(markup)}`
}

export function createBrandIconDataUrl(
  brandIcon: BrandIconEntry,
  color: string,
) {
  return svgMarkupToDataUrl(createBrandIconSvgMarkup(brandIcon, color))
}

function createBrandIconGradientSvgMarkup(
  brandIcon: BrandIconEntry,
  gradient: QraftyGradient,
) {
  const baseMarkup = renderBrandIconMarkup(brandIcon, DEFAULT_BRAND_ICON_COLOR)
  const gradientMarkup = createSvgGradientMarkup(gradient)
  const fillValue = `url(#${BRAND_ICON_GRADIENT_ID})`

  return injectSvgDefinitions(baseMarkup, gradientMarkup).replaceAll(
    "currentColor",
    fillValue,
  )
}

export function createBrandIconGradientDataUrl(
  brandIcon: BrandIconEntry,
  gradient: QraftyGradient,
) {
  return svgMarkupToDataUrl(createBrandIconGradientSvgMarkup(brandIcon, gradient))
}

function injectSvgDefinitions(markup: string, definitionsMarkup: string) {
  return markup.replace(
    /<svg\b([^>]*)>/,
    `<svg$1><defs>${definitionsMarkup}</defs>`,
  )
}

function createSvgGradientMarkup(gradient: QraftyGradient) {
  const colorStopsMarkup = gradient.colorStops
    .map(
      (colorStop) =>
        `<stop offset="${Math.round(colorStop.offset * 100)}%" stop-color="${colorStop.color}" />`,
    )
    .join("")

  if (gradient.type === "radial") {
    const { cx, cy } = qraftyRadialCenterAsPercent(getQraftyGradientCenter(gradient))
    return `<radialGradient id="${BRAND_ICON_GRADIENT_ID}" cx="${cx}" cy="${cy}" r="50%">${colorStopsMarkup}</radialGradient>`
  }

  const rotationDegrees = (gradient.rotation * 180) / Math.PI

  return `<linearGradient id="${BRAND_ICON_GRADIENT_ID}" gradientUnits="objectBoundingBox" gradientTransform="rotate(${rotationDegrees} 0.5 0.5)">${colorStopsMarkup}</linearGradient>`
}
