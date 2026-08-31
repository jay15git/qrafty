import {
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  WebMOutputFormat,
  type VideoCodec,
} from "mediabunny"

import { frameIndexToTimeMs } from "@/features/workspace/export/pipeline/clock"
import {
  makeEvenDimension,
  resolveVideoOutputDimensions,
} from "@/features/workspace/export/pipeline/bounds"
import { renderWorkspaceCompositorCanvas } from "@/features/workspace/export/pipeline/compositor"
import { WorkspaceShaderCaptureSession } from "@/features/workspace/export/pipeline/shader-snapshots"
import { buildDashboardQrNodePayload } from "@/features/qr-code/rendering/qr-svg-render"
import { createDraftingQrArtworkState } from "@/features/workspace/rendering/qr-artwork"
import type { DraftingCardState } from "@/features/workspace/model/card-state"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import type { QraftyState } from "@/features/qr-code/model/state"
import type {
  VideoExportDuration,
  VideoExportFormat,
  VideoExportFrameRate,
} from "@/features/qr-code/export/video-export"

export type WorkspaceVideoExportRequest = {
  durationSeconds: VideoExportDuration
  format: VideoExportFormat
  frameRate: VideoExportFrameRate
  longEdge: 1080 | 2160
}

export type WorkspaceVideoExportProgress = {
  frameIndex: number
  frameCount: number
}

const MP4_CODEC_CANDIDATES: VideoCodec[] = ["avc", "vp9", "av1"]
const WEBM_CODEC_CANDIDATES: VideoCodec[] = ["vp9", "av1"]

async function encodeVideoWithMediabunny({
  abortSignal,
  canvas,
  codec,
  drawFrame,
  format,
  frameCount,
  frameRate,
  onProgress,
}: {
  abortSignal?: AbortSignal
  canvas: HTMLCanvasElement
  codec: VideoCodec
  drawFrame: (frameIndex: number) => Promise<void>
  format: VideoExportFormat
  frameCount: number
  frameRate: number
  onProgress?: (progress: WorkspaceVideoExportProgress) => void
}) {
  const outputFormat = format === "mp4" ? new Mp4OutputFormat() : new WebMOutputFormat()
  const target = new BufferTarget()
  const output = new Output({
    format: outputFormat,
    target,
  })
  const videoSource = new CanvasSource(canvas, {
    codec,
    quality: QUALITY_HIGH,
  })

  output.addVideoTrack(videoSource, { frameRate })
  await output.start()

  const frameDuration = 1 / frameRate

  try {
    for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
      if (abortSignal?.aborted) {
        await output.cancel()
        throw new DOMException("Export cancelled.", "AbortError")
      }

      await drawFrame(frameIndex)
      await videoSource.add(frameIndex * frameDuration, frameDuration)
      onProgress?.({ frameCount, frameIndex: frameIndex + 1 })
    }

    await output.finalize()
  } catch (error) {
    await output.cancel()
    throw error
  }

  if (!target.buffer) {
    throw new Error("Video export did not produce an output buffer.")
  }

  return new Blob([target.buffer], {
    type: format === "mp4" ? "video/mp4" : "video/webm",
  })
}

async function encodeWorkspaceVideoBlob({
  abortSignal,
  canvas,
  drawFrame,
  format,
  frameCount,
  frameRate,
  onProgress,
}: {
  abortSignal?: AbortSignal
  canvas: HTMLCanvasElement
  drawFrame: (frameIndex: number) => Promise<void>
  format: VideoExportFormat
  frameCount: number
  frameRate: number
  onProgress?: (progress: WorkspaceVideoExportProgress) => void
}) {
  const candidates = format === "mp4" ? MP4_CODEC_CANDIDATES : WEBM_CODEC_CANDIDATES
  let lastError: unknown

  for (const codec of candidates) {
    try {
      return await encodeVideoWithMediabunny({
        abortSignal,
        canvas,
        codec,
        drawFrame,
        format,
        frameCount,
        frameRate,
        onProgress,
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error
      }

      lastError = error
    }
  }

  if (format === "mp4") {
    throw new Error("This browser cannot encode MP4 (H.264 / VP9 / AV1).")
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("This browser cannot record exported video.")
}

export async function exportWorkspaceVideo({
  abortSignal,
  cardLayer,
  cardState,
  layers,
  name,
  nodeId,
  onProgress,
  request,
  state,
}: {
  abortSignal?: AbortSignal
  cardLayer: DraftingCanvasLayer
  cardState: DraftingCardState
  layers: DraftingCanvasLayer[]
  name: string
  nodeId: string
  onProgress?: (progress: WorkspaceVideoExportProgress) => void
  request: WorkspaceVideoExportRequest
  state: QraftyState
}) {
  const output = resolveVideoOutputDimensions(
    cardLayer.width,
    cardLayer.height,
    request.longEdge,
  )
  const frameCount = request.durationSeconds * request.frameRate
  const targetDimensions = {
    height: makeEvenDimension(output.height),
    width: makeEvenDimension(output.width),
  }
  const canvas = document.createElement("canvas")
  canvas.width = targetDimensions.width
  canvas.height = targetDimensions.height
  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("Could not create video export canvas.")
  }

  const shaderSession = new WorkspaceShaderCaptureSession()
  await shaderSession.mount({
    cardLayer,
    cardState,
    layers,
    mode: "video",
    videoTimeMs: 0,
  })

  const qrPayload = await buildDashboardQrNodePayload(createDraftingQrArtworkState(state))

  const renderFrame = async (frameIndex: number) => {
    if (abortSignal?.aborted) {
      throw new DOMException("Export cancelled.", "AbortError")
    }

    const videoTimeMs = frameIndexToTimeMs(frameIndex, request.frameRate)
    const frameCanvas = await renderWorkspaceCompositorCanvas({
      cardLayer,
      cardState,
      extension: "png",
      layers,
      mode: "video",
      nodeId,
      qrMarkup: qrPayload.markup,
      shaderSession,
      state,
      targetDimensions,
      videoTimeMs,
    })

    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(frameCanvas, 0, 0, canvas.width, canvas.height)
  }

  try {
    return await encodeWorkspaceVideoBlob({
      abortSignal,
      canvas,
      drawFrame: renderFrame,
      format: request.format,
      frameCount,
      frameRate: request.frameRate,
      onProgress,
    })
  } finally {
    shaderSession.dispose()
  }
}
