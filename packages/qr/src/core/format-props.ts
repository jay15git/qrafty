import type { QraftyQrCodeProps } from "../types"

const DEFAULTS: Partial<QraftyQrCodeProps> = {
  boostLevel: true,
  level: "Q",
  minVersion: 1,
  module: "square",
  finderInner: "square",
  finderOuter: "square",
  foreground: "#000000",
  background: "#ffffff",
  margin: 12,
  size: 320,
  colorMode: "solid",
  gradient: "none",
  backgroundGradient: "none",
}

export function formatQraftyQrPropsForCodegen(props: QraftyQrCodeProps) {
  const formatted: Record<string, unknown> = {
    value: props.value,
  }

  const entries: Array<keyof QraftyQrCodeProps> = [
    "level",
    "minVersion",
    "boostLevel",
    "ariaLabel",
    "module",
    "moduleSize",
    "moduleLineWidth",
    "finderInner",
    "finderOuter",
    "finderInnerColor",
    "finderOuterColor",
    "finderInnerGradient",
    "finderOuterGradient",
    "foreground",
    "background",
    "backgroundGradient",
    "margin",
    "size",
    "colorMode",
    "palette",
    "gradient",
    "logo",
    "gradientMode",
    "moduleRoundSize",
  ]

  for (const key of entries) {
    const value = props[key]
    const defaultValue = DEFAULTS[key]

    if (value === undefined || value === null) {
      continue
    }

    if (JSON.stringify(value) === JSON.stringify(defaultValue)) {
      continue
    }

    if ((key === "gradient" || key === "backgroundGradient") && value === "none") {
      continue
    }

    formatted[key] = value
  }

  return formatted
}

export { qraftyPropsToReactQrProps } from "./map-props"
export { applyQraftyQrSvgExtensions } from "./svg-extension"
export { renderQraftyQrSvg, stripXmlDeclaration } from "./render-svg"
