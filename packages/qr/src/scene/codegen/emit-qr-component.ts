import { formatPortableQrPropsForCodegen } from "../../core/format-props"
import type { NewQrCodeProps } from "../../types"
import { emitNewQrCodeAttributes } from "../../web-component"

function formatReactPropValue(key: string, value: unknown) {
  if (typeof value === "string") {
    return JSON.stringify(value)
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return `{${JSON.stringify(value)}}`
  }

  if (
    key === "gradient" ||
    key === "backgroundGradient" ||
    key === "finderInnerGradient" ||
    key === "finderOuterGradient" ||
    key === "logo" ||
    key === "palette"
  ) {
    return `{${JSON.stringify(value)}}`
  }

  return `{${JSON.stringify(value)}}`
}

export function formatNewQrCodeReactProps(props: NewQrCodeProps) {
  const formatted = formatPortableQrPropsForCodegen(props)

  return Object.entries(formatted)
    .map(([key, value]) => `${key}=${formatReactPropValue(key, value)}`)
    .join(" ")
}

export function emitNewQrCodeReact(props: NewQrCodeProps, indent = "      ") {
  const propString = formatNewQrCodeReactProps(props)
  return `${indent}<NewQrCode ${propString} />`
}

export function emitNewQrCodeHtml(props: NewQrCodeProps) {
  const attributes = emitNewQrCodeAttributes(props)
  return `<new-qr-code ${attributes}></new-qr-code>`
}
