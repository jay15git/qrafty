import {
  createDashboardSurfaceQrState,
  renderDashboardQrSvgMarkup,
} from "@/features/qr-code/rendering/qr-svg"
import { rasterizeSvgMarkupToCanvas } from "@/features/qr-code/rendering/svg-raster"
import {
  getQrRenderedDimensions,
  scaleQrBackgroundShapeOptions,
} from "@/features/qr-code/rendering/svg-extension"
import {
  clampQrSize,
  clampRasterExportQualityPercent,
  type QraftyState,
} from "@/features/qr-code/model/state"
import qrcode from "qrcode-generator"
import type { QrFileExtension } from "@/features/qr-code/model/types"
import {
  parseNestedQrSvgMetrics,
  parseSvgViewBoxSize,
  snapDimensionToViewBoxGrid,
  snapLayeredRasterDimensionsToQrModuleGrid,
} from "@/features/workspace/rendering/qr-artwork"
const DASHBOARD_RASTER_EXPORT_MAX_DIMENSION = 4096

function getQrModuleCount(state: QraftyState): number {
  const qr = qrcode(state.qrOptions.typeNumber || 0, state.qrOptions.errorCorrectionLevel)
  qr.addData(state.data.trim() || "https://example.com", state.qrOptions.mode)
  qr.make()
  return qr.getModuleCount()
}

export type DashboardRasterExtension = Exclude<QrFileExtension, "svg">

type DashboardRasterExportOptions = {
  backgroundColor?: string
  extension: DashboardRasterExtension
  name: string
  qualityPercent: number
  state: QraftyState
  targetSizePx?: number
}

type DashboardRasterExportMeasurement = {
  blobSizeBytes: number
  encoderQuality?: number
  extension: DashboardRasterExtension
  height: number
  qualityPercent: number
  width: number
}

export function isRasterExportExtension(
  extension: QrFileExtension,
): extension is DashboardRasterExtension {
  return extension !== "svg"
}

export function getDashboardRasterExportScale(qualityPercent: number) {
  const normalizedQualityPercent = clampRasterExportQualityPercent(qualityPercent)

  if (normalizedQualityPercent >= 100) {
    return 4
  }

  if (normalizedQualityPercent >= 75) {
    return 3
  }

  if (normalizedQualityPercent >= 50) {
    return 2
  }

  return 1
}

export function clampDashboardRasterTargetSize(value: number) {
  if (!Number.isFinite(value)) {
    return DASHBOARD_RASTER_EXPORT_MAX_DIMENSION
  }

  return Math.max(1, Math.min(DASHBOARD_RASTER_EXPORT_MAX_DIMENSION, Math.round(value)))
}

function resolveQrModuleUnitsForRasterSnap(markup: string, state: QraftyState) {
  const nested = parseNestedQrSvgMetrics(markup)

  if (nested) {
    return nested.moduleUnits
  }

  const viewBox = parseSvgViewBoxSize(markup)

  if (viewBox && viewBox.width <= 200) {
    return viewBox.width
  }

  const margin = Math.max(0, Math.floor(state.margin))

  return getQrModuleCount(state) + margin * 2
}

export function getDashboardRasterExportDimensions(
  state: QraftyState,
  qualityPercent: number,
  targetSizePx?: number,
) {
  const renderedDimensions = getQrRenderedDimensions(state)

  if (targetSizePx !== undefined) {
    const targetSize = clampDashboardRasterTargetSize(targetSizePx)
    const moduleUnits = resolveQrModuleUnitsForRasterSnap(
      renderDashboardQrSvgMarkup(state),
      state,
    )
    const snappedTargetSize = moduleUnits
      ? snapDimensionToViewBoxGrid(targetSize, moduleUnits)
      : targetSize

    return {
      height: snappedTargetSize,
      requestedScale: snappedTargetSize / Math.max(1, renderedDimensions.width),
      scale: snappedTargetSize / Math.max(1, renderedDimensions.width),
      width: snappedTargetSize,
    }
  }

  const requestedScale = getDashboardRasterExportScale(qualityPercent)
  const effectiveScale = Math.max(
    1,
    Math.min(
      requestedScale,
      DASHBOARD_RASTER_EXPORT_MAX_DIMENSION / renderedDimensions.width,
      DASHBOARD_RASTER_EXPORT_MAX_DIMENSION / renderedDimensions.height,
    ),
  )

  return {
    height: Math.max(1, Math.round(renderedDimensions.height * effectiveScale)),
    requestedScale,
    scale: effectiveScale,
    width: Math.max(1, Math.round(renderedDimensions.width * effectiveScale)),
  }
}

export function getLossyRasterEncoderQuality(qualityPercent: number) {
  return Math.max(0.25, clampRasterExportQualityPercent(qualityPercent) / 100)
}

export async function downloadDashboardRasterExport({
  backgroundColor,
  extension,
  name,
  qualityPercent,
  state,
  targetSizePx,
}: DashboardRasterExportOptions) {
  const result = await renderDashboardRasterExport({
    backgroundColor,
    extension,
    qualityPercent,
    state,
    targetSizePx,
  })

  downloadBlob(result.blob, `${name}.${extension}`)
}

export async function measureDashboardRasterExport({
  extension,
  qualityPercent,
  state,
  targetSizePx,
}: Omit<DashboardRasterExportOptions, "name">) {
  const result = await renderDashboardRasterExport({
    extension,
    qualityPercent,
    state,
    targetSizePx,
  })

  return {
    blobSizeBytes: result.blob.size,
    encoderQuality: result.encoderQuality,
    extension: result.extension,
    height: result.height,
    qualityPercent: result.qualityPercent,
    width: result.width,
  } satisfies DashboardRasterExportMeasurement
}

export function formatDashboardExportFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B"
  }

  const units = ["B", "KB", "MB", "GB"] as const
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  )
  const normalizedValue = bytes / 1024 ** unitIndex
  const decimals = normalizedValue >= 100 || unitIndex === 0 ? 0 : normalizedValue >= 10 ? 1 : 2

  return `${normalizedValue.toFixed(decimals)} ${units[unitIndex]}`
}

async function renderDashboardRasterExport({
  backgroundColor,
  extension,
  qualityPercent,
  state,
  targetSizePx,
}: Omit<DashboardRasterExportOptions, "name">) {
  const dimensions = getDashboardRasterExportDimensions(
    state,
    qualityPercent,
    targetSizePx,
  )
  const baseRenderedDimensions = getQrRenderedDimensions(state)
  const renderScale = dimensions.width / Math.max(1, baseRenderedDimensions.width)
  const exportState = {
    ...createDashboardSurfaceQrState(state),
    backgroundShapeOptions: scaleQrBackgroundShapeOptions(
      state.backgroundShapeOptions,
      renderScale,
    ),
    height: Math.max(1, Math.round(clampQrSize(state.height) * renderScale)),
    width: Math.max(1, Math.round(clampQrSize(state.width) * renderScale)),
  }
  const canvas = await rasterizeSvgMarkupToCanvas(
    renderDashboardQrSvgMarkup(exportState),
    dimensions.width,
    dimensions.height,
    backgroundColor ? { backgroundColor } : {},
  )

  const mimeType = getMimeTypeForRasterExtension(extension)
  const encoderQuality =
    extension === "png"
      ? undefined
      : getLossyRasterEncoderQuality(qualityPercent)
  const rasterBlob = await canvasToBlob(canvas, mimeType, encoderQuality)

  return {
    blob: rasterBlob,
    encoderQuality,
    extension,
    height: dimensions.height,
    qualityPercent: clampRasterExportQualityPercent(qualityPercent),
    width: dimensions.width,
  }
}

function getMimeTypeForRasterExtension(extension: DashboardRasterExtension) {
  switch (extension) {
    case "jpeg":
      return "image/jpeg"
    case "png":
      return "image/png"
    case "webp":
      return "image/webp"
  }
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number,
) {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("The raster export could not be encoded."))
        return
      }

      resolve(blob)
    }, mimeType, quality)
  })
}

function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement("a")

  anchor.download = fileName
  anchor.href = objectUrl
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(objectUrl)
}
