import { toCanvas, toJpeg, toPng, toSvg } from "html-to-image"

import type { DashboardRasterExtension } from "@/features/qr-code/export/raster-export"
import { getLossyRasterEncoderQuality } from "@/features/qr-code/export/raster-export"

export type ArtboardRasterExportOptions = {
  element: HTMLElement
  extension: DashboardRasterExtension
  fileName: string
  pixelRatio?: number
  qualityPercent?: number
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

export async function captureArtboardRasterBlob({
  element,
  extension,
  pixelRatio = 2,
  qualityPercent = 100,
}: Omit<ArtboardRasterExportOptions, "fileName">) {
  const options = {
    cacheBust: true,
    pixelRatio,
  }

  switch (extension) {
    case "png":
      return await toPng(element, options)
    case "jpeg":
      return await toJpeg(element, {
        ...options,
        quality: getLossyRasterEncoderQuality(qualityPercent),
      })
    case "webp": {
      const canvas = await toCanvas(element, options)
      return canvas.toDataURL(
        "image/webp",
        getLossyRasterEncoderQuality(qualityPercent),
      )
    }
  }
}

export async function captureArtboardSvgBlob(element: HTMLElement) {
  const dataUrl = await toSvg(element, { cacheBust: true })
  const response = await fetch(dataUrl)
  return await response.blob()
}

export async function downloadArtboardRasterExport({
  element,
  extension,
  fileName,
  pixelRatio,
  qualityPercent,
}: ArtboardRasterExportOptions) {
  const dataUrl = await captureArtboardRasterBlob({
    element,
    extension,
    pixelRatio,
    qualityPercent,
  })
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  downloadBlob(blob, `${fileName}.${extension}`)
}

export async function downloadArtboardSvgExport({
  element,
  fileName,
}: {
  element: HTMLElement
  fileName: string
}) {
  const blob = await captureArtboardSvgBlob(element)
  downloadBlob(blob, `${fileName}.svg`)
}

export async function downloadArtboardDomExport({
  element,
  extension,
  fileName,
  pixelRatio,
  qualityPercent,
}: ArtboardRasterExportOptions | { element: HTMLElement; extension: "svg"; fileName: string }) {
  if (extension === "svg") {
    await downloadArtboardSvgExport({ element, fileName })
    return
  }

  await downloadArtboardRasterExport({
    element,
    extension,
    fileName,
    pixelRatio,
    qualityPercent,
  })
}
