"use client"

import { useEffect, useRef, type CSSProperties } from "react"

import {
  runDotMatrixAnimation,
  type QRCodeAnimationSettings,
} from "./run-dot-matrix-animation"

export type DotMatrixAnimatedSvgProps = {
  svgMarkup: string
  preset: string
  settings?: QRCodeAnimationSettings
  width: number
  height: number
  className?: string
  style?: CSSProperties
  respectReducedMotion?: boolean
}

export function DotMatrixAnimatedSvg({
  className,
  height,
  preset,
  respectReducedMotion = true,
  settings,
  style,
  svgMarkup,
  width,
}: DotMatrixAnimatedSvgProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const parsed = new DOMParser().parseFromString(svgMarkup, "image/svg+xml")
    const svg = parsed.documentElement
    container.replaceChildren(svg)
  }, [svgMarkup])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !preset) {
      return
    }

    if (respectReducedMotion && typeof window !== "undefined") {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      if (reduced) {
        return
      }
    }

    const handle = runDotMatrixAnimation(container, preset, settings)
    return () => handle?.stop()
  }, [preset, respectReducedMotion, settings, svgMarkup])

  return (
    <div
      ref={containerRef}
      className={className}
      data-export-animated-qr="true"
      style={{ position: "relative", width, height, ...style }}
    />
  )
}
