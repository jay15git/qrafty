import { emitSvg, preprocessSvg } from "@new-qr/qr-internal/codegen"

import { buildSceneIr } from "@/features/qr-code/export/build-scene-ir"
import { buildDashboardQrNodePayload } from "@/features/qr-code/rendering/qr-svg-render"
import {
  getLossyRasterEncoderQuality,
  isRasterExportExtension,
} from "@/features/qr-code/export/raster-export"
import { rasterizeSvgMarkupToCanvas } from "@/features/qr-code/rendering/svg-raster"
import type { QrFileExtension } from "@/features/qr-code/model/types"
import type { DraftingCardState } from "@/features/workspace/model/card-state"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import type { QrStudioState } from "@/features/qr-code/model/state"
import { createDraftingQrArtworkState } from "@/features/workspace/rendering/qr-artwork"
import { computeLetterboxFit } from "@/features/workspace/export/pipeline/bounds"
import { inlineSvgImageHrefs } from "@/features/workspace/export/pipeline/assets"
import { renderWorkspaceCompositorCanvas } from "@/features/workspace/export/pipeline/compositor"
import {
  buildAnimatedQrMarkupAtTime,
  shouldExportAnimatedQr,
} from "@/features/workspace/export/pipeline/qr-frames"
import {
  resolveQrExportTimeMs,
  type ExportClockMode,
} from "@/features/workspace/export/pipeline/clock"
import {
  captureWorkspaceShaderSnapshots,
  type WorkspaceShaderCaptureSession,
} from "@/features/workspace/export/pipeline/shader-snapshots"

export type RenderWorkspaceSvgOptions = {
  cardLayer: DraftingCanvasLayer
  cardState: DraftingCardState
  layers: DraftingCanvasLayer[]
  mode: ExportClockMode
  name: string
  nodeId: string
  qrMarkup: string
  shaderSession?: WorkspaceShaderCaptureSession
  state: QrStudioState
  videoTimeMs?: number
}

export async function renderWorkspaceSvgMarkup({
  cardLayer,
  cardState,
  layers,
  mode,
  name,
  nodeId,
  qrMarkup,
  shaderSession,
  state,
  videoTimeMs = 0,
}: RenderWorkspaceSvgOptions) {
  const shaderSnapshots = await captureWorkspaceShaderSnapshots({
    cardLayer,
    cardState,
    layers,
    mode,
    session: shaderSession,
    videoTimeMs,
  })

  const qrTimeMs = resolveQrExportTimeMs(state, mode, videoTimeMs)
  const resolvedQrMarkup = shouldExportAnimatedQr(state)
    ? buildAnimatedQrMarkupAtTime(qrMarkup, state, qrTimeMs)
    : qrMarkup

  const ir = await buildSceneIr({
    cardState,
    componentName: name.replace(/[^a-zA-Z0-9]/g, "") || "QrCard",
    layers,
    qrMarkup: resolvedQrMarkup,
    state,
    shaderSnapshots,
  })

  const rawSvg = emitSvg(ir)
  const svg = await inlineSvgImageHrefs(preprocessSvg(rawSvg, { idPrefix: nodeId }))

  return {
    ir,
    shaderSnapshots,
    svg,
  }
}

export type RasterizeWorkspaceSvgOptions = {
  backgroundColor?: string
  extension: Exclude<QrFileExtension, "svg">
  qualityPercent: number
  svg: string
  targetDimensions?: { height: number; width: number }
}

export async function rasterizeWorkspaceSvg({
  backgroundColor,
  extension,
  qualityPercent,
  svg,
  targetDimensions,
}: RasterizeWorkspaceSvgOptions) {
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1]
  let sourceWidth = 1
  let sourceHeight = 1

  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/).map(Number.parseFloat)
    if (parts.length === 4 && parts[2] && parts[3]) {
      sourceWidth = parts[2]
      sourceHeight = parts[3]
    }
  } else {
    sourceWidth = Number.parseFloat(svg.match(/\bwidth="([\d.]+)"/)?.[1] ?? "1")
    sourceHeight = Number.parseFloat(svg.match(/\bheight="([\d.]+)"/)?.[1] ?? "1")
  }

  if (!targetDimensions) {
    return rasterizeSvgMarkupToCanvas(svg, sourceWidth, sourceHeight, {
      backgroundColor: extension === "png" ? undefined : backgroundColor ?? "#ffffff",
    })
  }

  const outputCanvas = document.createElement("canvas")
  outputCanvas.width = targetDimensions.width
  outputCanvas.height = targetDimensions.height
  const context = outputCanvas.getContext("2d")

  if (!context) {
    throw new Error("Could not create export canvas context.")
  }

  if (backgroundColor && extension !== "png") {
    context.fillStyle = backgroundColor
    context.fillRect(0, 0, outputCanvas.width, outputCanvas.height)
  }

  const fit = computeLetterboxFit(
    sourceWidth,
    sourceHeight,
    targetDimensions.width,
    targetDimensions.height,
  )

  const artboardCanvas = await rasterizeSvgMarkupToCanvas(svg, fit.width, fit.height, {
    backgroundColor: extension === "png" ? undefined : backgroundColor ?? "#ffffff",
  })

  context.imageSmoothingEnabled = true
  context.drawImage(artboardCanvas, fit.offsetX, fit.offsetY, fit.width, fit.height)

  return outputCanvas
}

export async function buildWorkspaceExportPayload({
  cardLayer,
  cardState,
  layers,
  mode,
  name,
  nodeId,
  shaderSession,
  state,
  videoTimeMs = 0,
}: Omit<RenderWorkspaceSvgOptions, "qrMarkup"> & { state: QrStudioState }) {
  const qrPayload = await buildDashboardQrNodePayload(createDraftingQrArtworkState(state))
  const { ir, svg } = await renderWorkspaceSvgMarkup({
    cardLayer,
    cardState,
    layers,
    mode,
    name,
    nodeId,
    qrMarkup: qrPayload.markup,
    shaderSession,
    state,
    videoTimeMs,
  })

  return {
    id: nodeId,
    ir,
    name,
    naturalHeight: ir.bounds.height,
    naturalWidth: ir.bounds.width,
    originalSvgMarkup: svg,
  }
}

export async function renderWorkspaceRasterBlob({
  backgroundColor,
  cardLayer,
  cardState,
  extension,
  layers,
  mode,
  nodeId,
  qualityPercent,
  shaderSession,
  state,
  targetDimensions,
  videoTimeMs = 0,
}: {
  backgroundColor?: string
  cardLayer: DraftingCanvasLayer
  cardState: DraftingCardState
  extension: Exclude<QrFileExtension, "svg">
  layers: DraftingCanvasLayer[]
  mode: ExportClockMode
  nodeId: string
  qualityPercent: number
  shaderSession?: WorkspaceShaderCaptureSession
  state: QrStudioState
  targetDimensions?: { height: number; width: number }
  videoTimeMs?: number
}) {
  const qrPayload = await buildDashboardQrNodePayload(
    createDraftingQrArtworkState(state),
  )
  const canvas = await renderWorkspaceCompositorCanvas({
    backgroundColor,
    cardLayer,
    cardState,
    extension,
    layers,
    mode,
    nodeId,
    qrMarkup: qrPayload.markup,
    shaderSession,
    state,
    targetDimensions,
    videoTimeMs,
  })

  const mimeType =
    extension === "png"
      ? "image/png"
      : extension === "jpeg"
        ? "image/jpeg"
        : "image/webp"
  const encoderQuality =
    extension === "png" ? undefined : getLossyRasterEncoderQuality(qualityPercent)

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("The raster export could not be encoded."))
        return
      }
      resolve(blob)
    }, mimeType, encoderQuality)
  })
}

export function isWorkspaceRasterExtension(
  extension: QrFileExtension,
): extension is Exclude<QrFileExtension, "svg"> {
  return isRasterExportExtension(extension)
}
