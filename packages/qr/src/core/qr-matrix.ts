import qrcodegen from "../../vendor/react-qr-code/src/lib/qrcodegen"
import { ERROR_LEVEL_MAP } from "../../vendor/react-qr-code/src/constants"
import type { ErrorCorrectionLevel } from "../react-qr-code"

export type QrModuleMetrics = {
  margin: number
  moduleCount: number
  numCells: number
}

export type QrModuleMetricsInput = {
  boostLevel?: boolean
  level: ErrorCorrectionLevel
  marginSize?: number
  minVersion?: number
  value: string | string[]
}

/**
 * Non-React equivalent of `useQRCode`: encodes the payload and returns the
 * module grid metrics used to size the rendered svg (viewBox = numCells).
 * Returns null when the payload cannot be encoded.
 */
export function getQrModuleMetrics(input: QrModuleMetricsInput): QrModuleMetrics | null {
  try {
    const values = Array.isArray(input.value) ? input.value : [input.value]
    const segments = values.reduce<qrcodegen.QrSegment[]>((accum, value) => {
      accum.push(...qrcodegen.QrSegment.makeSegments(value))
      return accum
    }, [])
    const qrcode = qrcodegen.QrCode.encodeSegments(
      segments,
      ERROR_LEVEL_MAP[input.level],
      Math.max(1, input.minVersion ?? 1),
      undefined,
      undefined,
      input.boostLevel,
    )
    const margin = Math.max(Math.floor(input.marginSize ?? 4), 0)
    const moduleCount = qrcode.getModules().length

    return {
      margin,
      moduleCount,
      numCells: moduleCount + margin * 2,
    }
  } catch {
    return null
  }
}
