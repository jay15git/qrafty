import { clampRasterExportQualityPercent } from "@/features/qr-code/model/state"
import type { QrFileExtension } from "@/features/qr-code/model/types"

export type DashboardRasterExtension = Exclude<QrFileExtension, "svg">

export function isRasterExportExtension(
  extension: QrFileExtension,
): extension is DashboardRasterExtension {
  return extension !== "svg"
}

export function getLossyRasterEncoderQuality(qualityPercent: number) {
  return Math.max(0.25, clampRasterExportQualityPercent(qualityPercent) / 100)
}
