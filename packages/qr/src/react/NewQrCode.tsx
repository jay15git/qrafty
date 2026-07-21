"use client"

import { memo, useMemo } from "react"

import { renderNewQrSvg } from "../core/render-svg"
import type { NewQrCodeProps } from "../types"

export type { NewQrCodeProps, PortableQrConfig } from "../types"

export const NewQrCode = memo(function NewQrCode({
  className,
  style,
  ...props
}: NewQrCodeProps) {
  const svgMarkup = useMemo(
    () => renderNewQrSvg(props),
    [
      props.ariaLabel,
      props.background,
      props.backgroundGradient,
      props.boostLevel,
      props.colorMode,
      props.finderInner,
      props.finderOuter,
      props.finderInnerColor,
      props.finderOuterColor,
      props.finderInnerGradient,
      props.finderOuterGradient,
      props.foreground,
      props.gradient,
      props.level,
      props.logo,
      props.margin,
      props.minVersion,
      props.module,
      props.moduleLineWidth,
      props.moduleRoundSize,
      props.moduleSize,
      props.motion,
      props.motionPreset,
      props.palette,
      props.size,
      props.value,
    ],
  )

  return (
    <div
      className={className}
      data-slot="new-qr-code"
      style={{
        display: "block",
        height: "100%",
        width: "100%",
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  )
})
