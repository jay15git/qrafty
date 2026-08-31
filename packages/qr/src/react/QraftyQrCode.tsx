"use client"

import { memo, useMemo } from "react"

import { renderQraftyQrSvg } from "../core/render-svg"
import type { QraftyQrCodeProps } from "../types"

export type { QraftyQrCodeProps, QraftyQrConfig } from "../types"

export const QraftyQrCode = memo(function QraftyQrCode({
  className,
  style,
  ...props
}: QraftyQrCodeProps) {
  const svgMarkup = useMemo(
    () => renderQraftyQrSvg(props),
    // eslint-disable-next-line react-doctor/exhaustive-deps -- explicit QR render inputs listed below
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
      props.palette,
      props.size,
      props.value,
    ],
  )

  return (
    <div
      className={className}
      data-slot="qrafty-code"
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
