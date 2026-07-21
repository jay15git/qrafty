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

export type NewQrGradientConfig = {
  type: "linear" | "radial"
  rotation?: number
  stops: [{ offset: number; color: string }, { offset: number; color: string }]
}

export type NewQrLogoConfig = {
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

export type NewQrShaderConfig = {
  shaderId: string
  params?: Record<string, unknown>
}

export type NewQrCodeProps = {
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
  finderInnerGradient?: NewQrGradientConfig | "none"
  finderOuterGradient?: NewQrGradientConfig | "none"
  foreground?: string
  background?: string
  backgroundGradient?: NewQrGradientConfig | "none"
  margin?: number
  logo?: NewQrLogoConfig
  gradient?: NewQrGradientConfig | "none"
  colorMode?: "solid" | "gradient" | "palette"
  palette?: string[]
  moduleRoundSize?: boolean
  gradientMode?: "split" | "unified"
  motion?: "none" | "bitjson"
  motionPreset?: string
  className?: string
  style?: CSSProperties
}

export type PortableQrConfig = NewQrCodeProps
