import type { QraftyState } from "@/features/qr/model/state"
import type { QrFileExtension } from "@/features/qr/model/types"
import type { DraftingCardState } from "@/features/canvas/model/card-state"
import type { DraftingCanvasLayer } from "@/features/canvas/model/layers/shared"
import { getLossyRasterEncoderQuality, isRasterExportExtension } from "@/features/qr/export/raster-export"
import { buildDashboardQrNodePayload } from "@/features/qr/rendering/qr-svg-render"
import { createDraftingQrArtworkState } from "@/features/canvas/rendering/qr-artwork"
import { renderWorkspaceCompositorCanvas } from "@/features/canvas/export/pipeline/compositor"
import { resolveQrScanRegion } from "@/features/qr/scan-safety/scan-region"

export type ScanSafetyScene = {
  backgroundColor?: string
  cardState: DraftingCardState
  extension: QrFileExtension
  layers: DraftingCanvasLayer[]
  nodeId: string
  qualityPercent: number
  targetDimensions?: { height: number; width: number }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  extension: Exclude<QrFileExtension, "svg">,
  qualityPercent: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("The QR scan preview could not be encoded."))
          return
        }
        resolve(blob)
      },
      extension === "jpeg"
        ? "image/jpeg"
        : extension === "webp"
          ? "image/webp"
          : "image/png",
      extension === "png" ? undefined : getLossyRasterEncoderQuality(qualityPercent),
    )
  })
}

/**
 * Renders the selected QR through the real workspace compositor. The returned
 * pixels are clipped to the exported card, include every visible layer, and go
 * through the selected encoder so lossy formats degrade the scan input exactly
 * like the downloaded file.
 */
export async function rasterizeQraftyScanPreview(
  state: QraftyState,
  layer: DraftingCanvasLayer,
  scene: ScanSafetyScene,
): Promise<ImageData> {
  const cardLayer = scene.layers.find(
    (entry) => entry.kind === "card" && entry.isVisible,
  )

  if (!cardLayer) {
    throw new Error("The artboard card is unavailable for scannability analysis.")
  }

  const region = resolveQrScanRegion(layer, cardLayer)
  const exportExtension = isRasterExportExtension(scene.extension)
    ? scene.extension
    : "png"
  const outputScale = scene.targetDimensions
    ? scene.targetDimensions.width / Math.max(1, cardLayer.width)
    : 1
  const qrPayload = await buildDashboardQrNodePayload(
    createDraftingQrArtworkState(state),
  )
  const canvas = await renderWorkspaceCompositorCanvas({
    backgroundColor: scene.backgroundColor,
    cardLayer,
    cardState: scene.cardState,
    extension: exportExtension,
    layers: scene.layers,
    mode: "photo",
    nodeId: scene.nodeId,
    qrMarkup: qrPayload.markup,
    renderBounds: region,
    state,
    targetDimensions: {
      height: Math.max(1, Math.round(region.height * outputScale)),
      width: Math.max(1, Math.round(region.width * outputScale)),
    },
    videoTimeMs: 0,
  })
  const blob = await canvasToBlob(canvas, exportExtension, scene.qualityPercent)
  const bitmap = await createImageBitmap(blob)
  const pixels = document.createElement("canvas")

  pixels.width = bitmap.width
  pixels.height = bitmap.height
  const context = pixels.getContext("2d", { willReadFrequently: true })

  if (!context) {
    bitmap.close()
    throw new Error("The QR scan preview could not be read back.")
  }

  context.drawImage(bitmap, 0, 0)
  bitmap.close()

  return context.getImageData(0, 0, pixels.width, pixels.height)
}
