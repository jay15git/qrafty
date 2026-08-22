import type { StudioGradient } from "@/features/qr-code/model/state"
import {
  getStudioGradientCenter,
  studioRadialCenterAsPercent,
} from "@/features/qr-code/styles/studio-gradient-geometry"

const ICONSTACK_GRADIENT_ID = "iconstack-icon-gradient"
const ICONSTACK_SHAPE_TAG =
  /<(path|circle|rect|polygon|polyline|ellipse|line)\b/i

function readSvgLengthAttribute(value: string | null | undefined, fallback: number) {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function ensureIconstackSvgViewBox(markup: string) {
  if (/\bviewBox=/i.test(markup)) {
    return markup
  }

  const openTagMatch = markup.match(/<svg\b([^>]*)>/i)
  if (!openTagMatch) {
    return markup
  }

  const attributes = openTagMatch[1]
  const width = readSvgLengthAttribute(attributes.match(/\bwidth="([^"]+)"/i)?.[1], 24)
  const height = readSvgLengthAttribute(attributes.match(/\bheight="([^"]+)"/i)?.[1], 24)

  return markup.replace(
    /<svg\b([^>]*)>/i,
    `<svg$1 viewBox="0 0 ${width} ${height}">`,
  )
}

export function normalizeIconstackSvgMarkup(svg: string) {
  const withoutComments = svg.replace(/<!--[\s\S]*?-->/g, "").trim()
  return ensureIconstackSvgViewBox(withoutComments)
}

export function isValidIconstackSvgMarkup(svg: string) {
  const normalized = normalizeIconstackSvgMarkup(svg)

  if (!/<svg[\s>]/i.test(normalized)) {
    return false
  }

  return ICONSTACK_SHAPE_TAG.test(normalized)
}

function svgMarkupToDataUrl(markup: string) {
  return `data:image/svg+xml,${encodeURIComponent(markup)}`
}

export function recolorSvgMarkup(svg: string, color: string) {
  let next = svg

  next = next.replaceAll("currentColor", color)
  next = next.replace(/stroke="(?!none)([^"]+)"/gi, `stroke="${color}"`)
  next = next.replace(/fill="(?!none)([^"]+)"/gi, `fill="${color}"`)

  return next
}

export function createIconstackIconDataUrl(svg: string, color: string) {
  return svgMarkupToDataUrl(recolorSvgMarkup(normalizeIconstackSvgMarkup(svg), color))
}

export function createIconstackIconGradientDataUrl(svg: string, gradient: StudioGradient) {
  const gradientMarkup = createSvgGradientMarkup(gradient)
  const fillValue = `url(#${ICONSTACK_GRADIENT_ID})`
  const withDefinitions = injectSvgDefinitions(normalizeIconstackSvgMarkup(svg), gradientMarkup)

  return svgMarkupToDataUrl(
    withDefinitions
      .replaceAll("currentColor", fillValue)
      .replace(/stroke="(?!none)([^"]+)"/gi, `stroke="${fillValue}"`)
      .replace(/fill="(?!none)([^"]+)"/gi, `fill="${fillValue}"`),
  )
}

function injectSvgDefinitions(markup: string, definitionsMarkup: string) {
  return markup.replace(
    /<svg\b([^>]*)>/,
    `<svg$1><defs>${definitionsMarkup}</defs>`,
  )
}

function createSvgGradientMarkup(gradient: StudioGradient) {
  const colorStopsMarkup = gradient.colorStops
    .map(
      (colorStop) =>
        `<stop offset="${Math.round(colorStop.offset * 100)}%" stop-color="${colorStop.color}" />`,
    )
    .join("")

  if (gradient.type === "radial") {
    const { cx, cy } = studioRadialCenterAsPercent(getStudioGradientCenter(gradient))
    return `<radialGradient id="${ICONSTACK_GRADIENT_ID}" cx="${cx}" cy="${cy}" r="50%">${colorStopsMarkup}</radialGradient>`
  }

  const rotationDegrees = (gradient.rotation * 180) / Math.PI

  return `<linearGradient id="${ICONSTACK_GRADIENT_ID}" gradientUnits="objectBoundingBox" gradientTransform="rotate(${rotationDegrees} 0.5 0.5)">${colorStopsMarkup}</linearGradient>`
}
