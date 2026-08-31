import type { CSSProperties } from "react"

import type {
  CrossOrigin,
  DataModulesStyle,
  ErrorCorrectionLevel,
  FinderPatternInnerStyle,
  FinderPatternOuterStyle,
} from "./react-qr-code"

export type QrModuleStyle = DataModulesStyle
export type QrFinderInnerStyle = FinderPatternInnerStyle
export type QrFinderOuterStyle = FinderPatternOuterStyle
/** @deprecated Use `QrFinderInnerStyle` or `QrFinderOuterStyle` instead. */
export type QrFinderStyle = QrFinderInnerStyle | QrFinderOuterStyle

export type { CrossOrigin, ErrorCorrectionLevel }

export type QraftyQrGradientConfig = {
  type: "linear" | "radial"
  rotation?: number
  center?: { x: number; y: number }
  stops: [{ offset: number; color: string }, { offset: number; color: string }]
}

export type QraftyQrLogoConfig = {
  src: string
  /** Logo size as a fraction of QR size (0–1). Ignored when `width` / `height` are set. */
  size?: number
  /** Logo width in pixels. */
  width?: number
  /** Logo height in pixels. Defaults to `width`. */
  height?: number
  excavate?: boolean
  x?: number
  y?: number
  opacity?: number
  crossOrigin?: CrossOrigin
}

export type QraftyQrShaderConfig = {
  shaderId: string
  params?: Record<string, unknown>
}

export type QraftyQrCodeProps = {
  value: string | string[]
  size?: number
  level?: ErrorCorrectionLevel
  minVersion?: number
  boostLevel?: boolean
  ariaLabel?: string
  module?: QrModuleStyle
  moduleSize?: number
  moduleLineWidth?: number
  finderInner?: QrFinderInnerStyle
  finderOuter?: QrFinderOuterStyle
  finderInnerColor?: string
  finderOuterColor?: string
  finderInnerGradient?: QraftyQrGradientConfig | "none"
  finderOuterGradient?: QraftyQrGradientConfig | "none"
  foreground?: string
  background?: string
  backgroundGradient?: QraftyQrGradientConfig | "none"
  margin?: number
  logo?: QraftyQrLogoConfig
  gradient?: QraftyQrGradientConfig | "none"
  colorMode?: "solid" | "gradient" | "palette" | "image"
  palette?: string[]
  moduleFillImage?: string
  moduleRoundSize?: boolean
  gradientMode?: "split" | "unified" | "unified-image"
  className?: string
  style?: CSSProperties
}

export type QraftyQrConfig = QraftyQrCodeProps
