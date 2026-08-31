import {
  createBrandIconDataUrl,
  createBrandIconGradientDataUrl,
} from "@/features/qr-code/assets/brand-icon-svg"
import { findBrandIconById } from "@/features/qr-code/assets/brand-icons"
import { renderDashboardQrSvgMarkup } from "@/features/qr-code/rendering/qr-svg-render"
import { getQrBackgroundShapeDefinition } from "@/features/qr-code/styles/background-shapes"
import { parseSvgViewBoxSize } from "@/features/workspace/rendering/qr-artwork"

import type { LandingWheelCardPreset } from "@/components/landing/landing-card-wheel-presets"
import { buildLandingWheelQrState } from "@/components/landing/landing-wheel-qr-state"

const WHEEL_ASSET_DIR = "/landing/wheel"

export function getLandingWheelCardSrc(id: string) {
  return `${WHEEL_ASSET_DIR}/${id}.svg`
}

function resolveLogoSrc(preset: LandingWheelCardPreset) {
  const icon = findBrandIconById(preset.brandId)
  if (!icon) return undefined

  if (preset.logo.gradient) {
    return createBrandIconGradientDataUrl(icon, preset.logo.gradient)
  }

  if (preset.logo.color) {
    return createBrandIconDataUrl(icon, preset.logo.color)
  }

  return undefined
}

function extractSvgInner(markup: string) {
  const match = markup.match(/<svg[^>]*>([\s\S]*)<\/svg>/i)
  return match?.[1]?.trim() ?? markup
}

function parseSvgViewBox(markup: string) {
  const openTag = markup.match(/<svg\b[^>]*>/i)?.[0] ?? ""
  const viewBox = openTag.match(/viewBox="([^"]+)"/i)?.[1]

  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/).map(Number)

    if (parts.length >= 4 && parts[2] > 0 && parts[3] > 0) {
      return {
        x: parts[0] ?? 0,
        y: parts[1] ?? 0,
        width: parts[2],
        height: parts[3],
      }
    }
  }

  const parsed = parseSvgViewBoxSize(markup)
  if (parsed) {
    return { x: 0, y: 0, width: parsed.width, height: parsed.height }
  }

  const widthMatch = markup.match(/\bwidth="([\d.]+)"/)
  const heightMatch = markup.match(/\bheight="([\d.]+)"/)

  return {
    x: 0,
    y: 0,
    width: widthMatch ? Number(widthMatch[1]) : 168,
    height: heightMatch ? Number(heightMatch[1]) : 168,
  }
}

export function renderLandingWheelCardSvg(preset: LandingWheelCardPreset) {
  const shape = getQrBackgroundShapeDefinition(preset.shape.id)
  if (!shape) {
    throw new Error(`Unknown landing wheel shape: ${preset.shape.id}`)
  }

  const { width, height } = shape.viewBox
  const padding = preset.shape.padding / 100
  const insetX = width * padding
  const insetY = height * padding
  const innerWidth = width - insetX * 2
  const innerHeight = height - insetY * 2

  const qrMarkup = renderDashboardQrSvgMarkup(
    buildLandingWheelQrState(preset, resolveLogoSrc(preset)),
  )
  const viewBox = parseSvgViewBox(qrMarkup)
  const qrInner = extractSvgInner(qrMarkup)
  const scale = Math.min(innerWidth / viewBox.width, innerHeight / viewBox.height)
  const drawWidth = viewBox.width * scale
  const drawHeight = viewBox.height * scale
  const offsetX = insetX + (innerWidth - drawWidth) / 2
  const offsetY = insetY + (innerHeight - drawHeight) / 2

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${preset.id} QR code">
  <path d="${shape.path}" fill="${preset.shape.fill}" />
  <svg x="${offsetX}" y="${offsetY}" width="${drawWidth}" height="${drawHeight}" viewBox="${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}" xmlns="http://www.w3.org/2000/svg">
    ${qrInner}
  </svg>
</svg>`
}
