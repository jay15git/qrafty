"use client"

import { useEffect, useId, useMemo, useState } from "react"
import { QraftyQrCode, type QraftyQrCodeProps } from "@qrafty/qr/react"
import { renderQraftyQrSvg } from "@qrafty/qr-internal/core"

import { createBrandIconDataUrl } from "@/features/qr-code/assets/brand-icon-svg"
import { findBrandIconById } from "@/features/qr-code/assets/brand-icons"
import {
  getQrBackgroundShapeDefinition,
  type QrBackgroundShapeId,
} from "@/features/qr-code/styles/background-shapes"
import { cn } from "@/lib/utils"

export const LANDING_QR_VALUE = "https://qrafty.app"
export const LANDING_QR_LABEL = "Sample QRafty QR code"

export const LANDING_QR_GRADIENT = {
  type: "linear" as const,
  rotation: 48,
  stops: [
    { offset: 0, color: "#5b21b6" },
    { offset: 1, color: "#db2777" },
  ] as [{ offset: number; color: string }, { offset: number; color: string }],
}

export function useBrandLogoSrc(brandId = "instagram", color = "#ffffff") {
  return useMemo(() => {
    const icon = findBrandIconById(brandId)
    return icon ? createBrandIconDataUrl(icon, color) : undefined
  }, [brandId, color])
}

export function landingQrProps(
  logoSrc: string | undefined,
  overrides: Partial<QraftyQrCodeProps> = {},
): QraftyQrCodeProps {
  return {
    ariaLabel: LANDING_QR_LABEL,
    background: "#ffffff",
    colorMode: "gradient",
    finderInner: "rounded",
    finderOuter: "rounded",
    foreground: "#3b1d6e",
    gradient: LANDING_QR_GRADIENT,
    level: "H",
    logo: logoSrc
      ? {
          excavate: true,
          size: 0.22,
          src: logoSrc,
        }
      : undefined,
    margin: 1,
    module: "rounded",
    size: 220,
    value: LANDING_QR_VALUE,
    ...overrides,
  }
}

/** Landing wheel cards — transparent QR surface on dark card chrome. */
export function wheelQrProps(
  overrides: Partial<QraftyQrCodeProps> = {},
): QraftyQrCodeProps {
  return landingQrProps(undefined, {
    background: "transparent",
    logo: undefined,
    ...overrides,
  })
}

export function renderLandingQrSvg(
  logoSrc: string | undefined,
  overrides: Partial<QraftyQrCodeProps> = {},
) {
  return renderQraftyQrSvg(landingQrProps(logoSrc, overrides))
}

export function QraftyQr({
  className,
  ...overrides
}: Partial<QraftyQrCodeProps> & { className?: string }) {
  const logoSrc = useBrandLogoSrc()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className={cn("lfc-qr", className)}>
      {mounted ? <QraftyQrCode {...landingQrProps(logoSrc, overrides)} /> : null}
    </div>
  )
}

export function QraftyShapedQr({
  className,
  fill,
  padding = 16,
  shapeId,
  ...overrides
}: Partial<QraftyQrCodeProps> & {
  className?: string
  fill: string
  padding?: number
  shapeId: Exclude<QrBackgroundShapeId, "none">
}) {
  const shape = getQrBackgroundShapeDefinition(shapeId)
  const clipId = useId()
  const logoSrc = useBrandLogoSrc()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!shape) {
    return <QraftyQr className={className} {...overrides} />
  }

  const { width, height } = shape.viewBox

  return (
    <div
      className={cn("lfc-shaped", className)}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <svg
        aria-hidden="true"
        className="lfc-shaped-svg"
        viewBox={`0 0 ${width} ${height}`}
      >
        <defs>
          <filter
            id={`${clipId}-shadow`}
            x="-12%"
            y="-8%"
            width="124%"
            height="124%"
          >
            <feDropShadow
              dx="0"
              dy="10"
              stdDeviation="14"
              floodColor="oklch(0.28 0.08 304 / 0.28)"
            />
          </filter>
        </defs>
        <path d={shape.path} fill={fill} filter={`url(#${clipId}-shadow)`} />
      </svg>
      {mounted ? (
        <div
          className="lfc-shaped-qr"
          style={{ inset: `${padding}%` }}
        >
          <QraftyQrCode
            {...landingQrProps(logoSrc, {
              background: "transparent",
              ...overrides,
            })}
          />
        </div>
      ) : null}
    </div>
  )
}
