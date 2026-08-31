"use client"

import { useEffect, useMemo, useState } from "react"

import {
  createBrandIconDataUrl,
  createBrandIconGradientDataUrl,
} from "@/features/qr-code/assets/brand-icon-svg"
import { findBrandIconById } from "@/features/qr-code/assets/brand-icons"
import { renderDashboardQrSvgMarkup } from "@/features/qr-code/rendering/qr-svg-render"
import { getQrBackgroundShapeDefinition } from "@/features/qr-code/styles/background-shapes"
import { cn } from "@/lib/utils"

import type { LandingWheelCardPreset } from "@/components/landing/landing-card-wheel-presets"
import { buildLandingWheelQrState } from "@/components/landing/landing-wheel-qr-state"

export function LandingWheelQr({
  className,
  mounted,
  preset,
}: {
  className?: string
  mounted: boolean
  preset: LandingWheelCardPreset
}) {
  const [shapeReady, setShapeReady] = useState(false)

  useEffect(() => {
    setShapeReady(true)
  }, [])

  const logoSrc = useMemo(() => {
    const icon = findBrandIconById(preset.brandId)
    if (!icon) return undefined

    if (preset.logo.gradient) {
      return createBrandIconGradientDataUrl(icon, preset.logo.gradient)
    }

    if (preset.logo.color) {
      return createBrandIconDataUrl(icon, preset.logo.color)
    }

    return undefined
  }, [preset.brandId, preset.logo.color, preset.logo.gradient])

  const svgMarkup = useMemo(() => {
    if (!mounted) return ""
    return renderDashboardQrSvgMarkup(buildLandingWheelQrState(preset, logoSrc))
  }, [logoSrc, mounted, preset])

  const shape = getQrBackgroundShapeDefinition(preset.shape.id)
  if (!shape) {
    return null
  }

  const { width, height } = shape.viewBox
  const padding = preset.shape.padding

  return (
    <div
      className={cn("os-wheel-shaped", className)}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <svg
        aria-hidden="true"
        className="os-wheel-shaped-svg"
        viewBox={`0 0 ${width} ${height}`}
      >
        <path d={shape.path} fill={preset.shape.fill} />
      </svg>
      {mounted && shapeReady && svgMarkup ? (
        <div
          className="os-wheel-shaped-qr"
          style={{
            inset: `${padding}%`,
          }}
        >
          <div
            className="os-wheel-qr-markup"
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
        </div>
      ) : null}
    </div>
  )
}
