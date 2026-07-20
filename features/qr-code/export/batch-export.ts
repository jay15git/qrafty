import { zipSync } from "fflate"

import type { DashboardComposeSvgNode } from "@/features/qr-code/rendering/compose-scene"
import { rasterizeSvgMarkupToCanvas } from "@/features/qr-code/rendering/svg-raster"
import type { QrFileExtension } from "@/features/qr-code/model/types"
import {
  clampDashboardRasterTargetSize,
  getDashboardRasterExportScale,
  getLossyRasterEncoderQuality,
  type DashboardRasterExtension,
} from "@/features/qr-code/export/raster-export"
import {
  parseNestedQrSvgMetrics,
  snapLayeredRasterDimensionsToQrModuleGrid,
} from "@/features/workspace/rendering/qr-artwork"

const DASHBOARD_QR_NODE_EXPORT_MAX_DIMENSION = 4096

type DashboardQrFileExportNode = Pick<
  DashboardComposeSvgNode,
  "id" | "name" | "naturalHeight" | "naturalWidth" | "originalSvgMarkup"
>

type DashboardQrNodeExportOptions = {
  extension: QrFileExtension
  name: string
  node: DashboardQrFileExportNode
  qualityPercent: number
  targetDimensions?: { height: number; width: number }
  targetSizePx?: number
}

type DashboardQrBatchZipExportOptions = {
  extension: QrFileExtension
  name: string
  nodes: DashboardQrFileExportNode[]
  qualityPercent: number
  targetDimensions?: { height: number; width: number }
  targetSizePx?: number
}

export async function downloadDashboardQrNodeExport({
  extension,
  name,
  node,
  qualityPercent,
  targetDimensions,
  targetSizePx,
}: DashboardQrNodeExportOptions) {
  const result = await renderDashboardQrNodeExport({
    extension,
    node,
    qualityPercent,
    targetDimensions,
    targetSizePx,
  })

  downloadBlob(result.blob, `${sanitizeDownloadFileName(name)}.${extension}`)
}

export async function downloadDashboardQrBatchZipExport({
  extension,
  name,
  nodes,
  qualityPercent,
  targetDimensions,
  targetSizePx,
}: DashboardQrBatchZipExportOptions) {
  const files = await Promise.all(
    nodes.map(async (node) => {
      const result = await renderDashboardQrNodeExport({
        extension,
        node,
        qualityPercent,
        targetDimensions,
        targetSizePx,
      })

      return {
        data: new Uint8Array(await result.blob.arrayBuffer()),
        name: node.name,
      }
    }),
  )
  const fileNameCounts = new Map<string, number>()
  const zipped = zipSync(
    Object.fromEntries(
      files.map((file) => [
        getUniqueDownloadFileName(file.name, extension, fileNameCounts),
        file.data,
      ]),
    ),
    {
      level: extension === "png" ? 0 : 6,
      mtime: new Date("1980-01-01T00:00:00.000Z"),
    },
  )
  const zipBuffer = (zipped.buffer as ArrayBuffer).slice(
    zipped.byteOffset,
    zipped.byteOffset + zipped.byteLength,
  )

  downloadBlob(
    new Blob([zipBuffer], { type: "application/zip" }),
    `${sanitizeDownloadFileName(name)}.zip`,
  )
}

async function renderDashboardQrNodeExport({
  extension,
  node,
  qualityPercent,
  targetDimensions,
  targetSizePx,
}: Omit<DashboardQrNodeExportOptions, "name">) {
  if (extension === "svg") {
    const blob = new Blob([node.originalSvgMarkup], {
      type: "image/svg+xml;charset=utf-8",
    })
    return { blob, extension }
  }

  const dimensions = getDashboardQrNodeRasterDimensions(
    node,
    qualityPercent,
    targetSizePx,
    targetDimensions,
  )
  const canvas = await rasterizeSvgMarkupToCanvas(
    node.originalSvgMarkup,
    dimensions.width,
    dimensions.height,
  )

  const blob = await canvasToBlob(
    canvas,
    getMimeTypeForRasterExtension(extension),
    extension === "png" ? undefined : getLossyRasterEncoderQuality(qualityPercent),
  )

  return { blob, extension }
}

function getDashboardQrNodeRasterDimensions(
  node: DashboardQrFileExportNode,
  qualityPercent: number,
  targetSizePx?: number,
  targetDimensions?: { height: number; width: number },
) {
  let dimensions: { height: number; width: number }

  if (targetDimensions) {
    dimensions = {
      height: Math.max(1, Math.round(targetDimensions.height)),
      width: Math.max(1, Math.round(targetDimensions.width)),
    }
  } else if (targetSizePx !== undefined) {
    const targetSize = clampDashboardRasterTargetSize(targetSizePx)
    const maxNatural = Math.max(node.naturalWidth, node.naturalHeight)

    if (maxNatural <= 0) {
      dimensions = {
        height: targetSize,
        width: targetSize,
      }
    } else {
      const scale = targetSize / maxNatural

      dimensions = {
        height: Math.max(1, Math.round(node.naturalHeight * scale)),
        width: Math.max(1, Math.round(node.naturalWidth * scale)),
      }
    }
  } else {
    const requestedScale = getDashboardRasterExportScale(qualityPercent)
    const effectiveScale = Math.max(
      1,
      Math.min(
        requestedScale,
        DASHBOARD_QR_NODE_EXPORT_MAX_DIMENSION / node.naturalWidth,
        DASHBOARD_QR_NODE_EXPORT_MAX_DIMENSION / node.naturalHeight,
      ),
    )

    dimensions = {
      height: Math.max(1, Math.round(node.naturalHeight * effectiveScale)),
      width: Math.max(1, Math.round(node.naturalWidth * effectiveScale)),
    }
  }

  const qrMetrics = parseNestedQrSvgMetrics(node.originalSvgMarkup)

  if (!qrMetrics) {
    return dimensions
  }

  return snapLayeredRasterDimensionsToQrModuleGrid({
    exportHeight: dimensions.height,
    exportWidth: dimensions.width,
    naturalHeight: node.naturalHeight,
    naturalWidth: node.naturalWidth,
    qrMetrics,
  })
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

function getUniqueDownloadFileName(
  name: string,
  extension: QrFileExtension,
  counts: Map<string, number>,
) {
  const baseName = sanitizeDownloadFileName(name)
  const nextCount = (counts.get(baseName) ?? 0) + 1

  counts.set(baseName, nextCount)

  return `${baseName}${nextCount > 1 ? `-${nextCount}` : ""}.${extension}`
}

function sanitizeDownloadFileName(name: string) {
  const sanitized = name
    .replace(/[\u0000-\u001f<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "")
    .trim()

  return sanitized || "QR Code"
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
