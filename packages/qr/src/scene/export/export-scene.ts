import { buildStaticDecorSvg } from "../core/render-static-svg"
import type { SceneDocumentV1 } from "../schema"

export type SceneExportFormat = "svg" | "png" | "webp" | "jpeg"

export type SceneExportOptions = {
  format: SceneExportFormat
  profile?: "static" | "snapshot"
  shaderSnapshotUrl?: string
  quality?: number
}

export function exportSceneSvg(
  scene: SceneDocumentV1,
  options: Pick<SceneExportOptions, "shaderSnapshotUrl"> = {},
) {
  return buildStaticDecorSvg(scene, {
    shaderSnapshotUrl: options.shaderSnapshotUrl,
  })
}

export async function rasterizeSvgMarkup(
  svgMarkup: string,
  width: number,
  height: number,
  format: Exclude<SceneExportFormat, "svg">,
  quality = 0.92,
) {
  if (typeof document === "undefined") {
    throw new Error("Raster export requires a browser environment.")
  }

  const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" })
  const url = URL.createObjectURL(blob)

  try {
    const image = await loadImage(url)
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d")

    if (!context) {
      throw new Error("Canvas 2D context is unavailable.")
    }

    context.drawImage(image, 0, 0, width, height)
    const mimeType =
      format === "png" ? "image/png" : format === "webp" ? "image/webp" : "image/jpeg"

    return canvas.toDataURL(mimeType, quality)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Failed to load SVG image."))
    image.src = url
  })
}

export async function exportScene(
  scene: SceneDocumentV1,
  options: SceneExportOptions,
) {
  const svg = exportSceneSvg(scene, {
    shaderSnapshotUrl: options.shaderSnapshotUrl,
  })

  if (options.format === "svg") {
    return { svg, dataUrl: null as string | null }
  }

  const dataUrl = await rasterizeSvgMarkup(
    svg,
    scene.width,
    scene.height,
    options.format,
    options.quality,
  )

  return { svg, dataUrl }
}
