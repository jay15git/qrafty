"use client"

import { useMemo } from "react"

import { DotMatrixAnimatedSvg } from "../../dot-matrix/DotMatrixAnimatedSvg"
import {
  buildAnimatedQrConfig,
  type AnimatedQrProps,
} from "./bitjson-config"

export function AnimatedQr({
  className,
  contents: _contents,
  externalSvg,
  height,
  preset,
  respectReducedMotion,
  speed,
  style,
  width,
}: AnimatedQrProps & { style?: React.CSSProperties }) {
  const config = useMemo(
    () =>
      buildAnimatedQrConfig({
        contents: _contents,
        externalSvg,
        preset,
        respectReducedMotion,
        speed,
        width,
        height,
      }),
    [_contents, externalSvg, height, preset, respectReducedMotion, speed, width],
  )

  if (!config.useExternalSvg) {
    return null
  }

  return (
    <DotMatrixAnimatedSvg
      className={className}
      height={height}
      preset={config.preset}
      respectReducedMotion={config.respectReducedMotion}
      settings={config.settings}
      style={style}
      svgMarkup={config.externalSvg}
      width={width}
    />
  )
}
