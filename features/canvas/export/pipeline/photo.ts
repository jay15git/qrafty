import { emitSvg, preprocessSvg } from "@qrafty/qr-internal/codegen"

import { buildSceneIr } from "@/features/qr/export/build-scene-ir"
import { buildDashboardQrNodePayload } from "@/features/qr/rendering/qr-svg-render"
import {
  getLossyRasterEncoderQuality,
  isRasterExportExtension,
} from "@/features/qr/export/raster-export"
import type { QrFileExtension } from "@/features/qr/model/types"
import type { DraftingCardState } from "@/features/canvas/model/card-state"
import type { DraftingCanvasLayer } from "@/features/canvas/model/layers"
import type { QraftyState } from "@/features/qr/model/state"
import { createDraftingQrArtworkState } from "@/features/canvas/rendering/qr-artwork"
import { inlineSvgImageHrefs } from "@/features/canvas/export/pipeline/assets"
import { renderWorkspaceCompositorCanvas } from "@/features/canvas/export/pipeline/compositor"
import {
  buildAnimatedQrMarkupAtTime,
  shouldExportAnimatedQr,
} from "@/features/canvas/export/pipeline/qr-frames"
import {
  resolveQrExportTimeMs,
  type ExportClockMode,
} from "@/features/canvas/export/pipeline/clock"
import {
  captureWorkspaceShaderSnapshots,
  type WorkspaceShaderCaptureSession,
} from "@/features/canvas/export/pipeline/shader-snapshots"

export type RenderWorkspaceSvgOptions = {
  cardLayer: DraftingCanvasLayer
  cardState: DraftingCardState
  layers: DraftingCanvasLayer[]
  mode: ExportClockMode
  name: string
  nodeId: string
  qrMarkup: string
  shaderSession?: WorkspaceShaderCaptureSession
  state: QraftyState
  videoTimeMs?: number
}

async function renderWorkspaceSvgMarkup({
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
}: Omit<RenderWorkspaceSvgOptions, "qrMarkup"> & { state: QraftyState }) {
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
  state: QraftyState
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
