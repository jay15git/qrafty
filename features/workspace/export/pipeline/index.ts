import { zipSync } from "fflate"

import {
  getLossyRasterEncoderQuality,
} from "@/features/qr-code/export/raster-export"
import type { QrFileExtension } from "@/features/qr-code/model/types"
import type { DraftingCardState } from "@/features/workspace/model/card-state"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import type { QraftyState } from "@/features/qr-code/model/state"
import {
  buildWorkspaceExportPayload,
  isWorkspaceRasterExtension,
  renderWorkspaceRasterBlob,
} from "@/features/workspace/export/pipeline/photo"
import {
  exportWorkspaceVideo,
  type WorkspaceVideoExportRequest,
  type WorkspaceVideoExportProgress,
} from "@/features/workspace/export/pipeline/video"
import { getArtboardExportBounds } from "@/features/workspace/export/pipeline/bounds"

export type WorkspaceExportProgress =
  | ({ kind: "photo" } & { stage: "building" | "encoding" })
  | ({ kind: "video" } & WorkspaceVideoExportProgress)

export type RunWorkspaceExportOptions = {
  abortSignal?: AbortSignal
  backgroundColor?: string
  cardState: DraftingCardState
  extension: QrFileExtension
  layers: DraftingCanvasLayer[]
  mediaKind: "photo" | "video"
  name: string
  nodeId: string
  onProgress?: (progress: WorkspaceExportProgress) => void
  qualityPercent: number
  state: QraftyState
  targetDimensions?: { height: number; width: number }
  videoRequest?: WorkspaceVideoExportRequest
}

function sanitizeDownloadFileName(name: string) {
  const sanitized = name
    .replace(/[\u0000-\u001f<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "")
    .trim()

  return sanitized || "QR Code"
}

export function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement("a")

  anchor.download = fileName
  anchor.href = objectUrl
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(objectUrl)
}

export async function runWorkspaceExport({
  abortSignal,
  backgroundColor,
  cardState,
  extension,
  layers,
  mediaKind,
  name,
  nodeId,
  onProgress,
  qualityPercent,
  state,
  targetDimensions,
  videoRequest,
}: RunWorkspaceExportOptions) {
  const cardLayer = layers.find((layer) => layer.kind === "card" && layer.isVisible)
  if (!cardLayer) {
    throw new Error("The artboard card is unavailable for export.")
  }

  if (mediaKind === "video") {
    if (!videoRequest) {
      throw new Error("Video export settings are missing.")
    }

    const blob = await exportWorkspaceVideo({
      abortSignal,
      cardLayer,
      cardState,
      layers,
      name,
      nodeId,
      onProgress: (progress) => onProgress?.({ kind: "video", ...progress }),
      request: videoRequest,
      state,
    })

    const extensionName = blob.type.includes("mp4") ? "mp4" : "webm"
    downloadBlob(blob, `${sanitizeDownloadFileName(name)}.${extensionName}`)
    return
  }

  onProgress?.({ kind: "photo", stage: "building" })
  const payload = await buildWorkspaceExportPayload({
    cardLayer,
    cardState,
    layers,
    mode: "photo",
    name,
    nodeId,
    state,
  })

  if (extension === "svg") {
    const blob = new Blob([payload.originalSvgMarkup], {
      type: "image/svg+xml;charset=utf-8",
    })
    downloadBlob(blob, `${sanitizeDownloadFileName(name)}.svg`)
    return
  }

  if (!isWorkspaceRasterExtension(extension)) {
    throw new Error(`Unsupported export format: ${extension}`)
  }

  onProgress?.({ kind: "photo", stage: "encoding" })
  const blob = await renderWorkspaceRasterBlob({
    backgroundColor: backgroundColor ?? "#ffffff",
    cardLayer,
    cardState,
    extension,
    layers,
    mode: "photo",
    nodeId,
    qualityPercent,
    shaderSession: undefined,
    state,
    targetDimensions,
  })

  downloadBlob(blob, `${sanitizeDownloadFileName(name)}.${extension}`)
}

export async function runWorkspaceBatchExport({
  abortSignal,
  backgroundColor,
  cardState,
  extension,
  items,
  layers,
  name,
  nodeId,
  qualityPercent,
  targetDimensions,
}: {
  abortSignal?: AbortSignal
  backgroundColor?: string
  cardState: DraftingCardState
  extension: QrFileExtension
  items: Array<{ layerId: string; name: string; state: QraftyState }>
  layers: DraftingCanvasLayer[]
  name: string
  nodeId: string
  qualityPercent: number
  targetDimensions?: { height: number; width: number }
}) {
  const cardLayer = layers.find((layer) => layer.kind === "card" && layer.isVisible)
  if (!cardLayer) {
    throw new Error("The artboard card is unavailable for export.")
  }

  const files = await Promise.all(
    items.map(async (item) => {
      const isolatedLayers = layers.map((layer) => ({
        ...layer,
        isVisible:
          layer.kind === "card" || layer.id === item.layerId ? layer.isVisible : false,
      }))

      const payload = await buildWorkspaceExportPayload({
        cardLayer,
        cardState,
        layers: isolatedLayers,
        mode: "photo",
        name: item.name,
        nodeId,
        state: item.state,
      })

      if (extension === "svg") {
        return {
          data: new TextEncoder().encode(payload.originalSvgMarkup),
          name: item.name,
        }
      }

      if (!isWorkspaceRasterExtension(extension)) {
        throw new Error(`Unsupported export format: ${extension}`)
      }

      const blob = await renderWorkspaceRasterBlob({
        backgroundColor: backgroundColor ?? "#ffffff",
        cardLayer,
        cardState,
        extension,
        layers: isolatedLayers,
        mode: "photo",
        nodeId,
        qualityPercent,
        state: item.state,
        targetDimensions,
      })

      return {
        data: new Uint8Array(await blob.arrayBuffer()),
        name: item.name,
      }
    }),
  )

  if (abortSignal?.aborted) {
    throw new DOMException("Export cancelled.", "AbortError")
  }

  const fileNameCounts = new Map<string, number>()
  const zipped = zipSync(
    Object.fromEntries(
      files.map((file) => {
        const baseName = sanitizeDownloadFileName(file.name)
        const nextCount = (fileNameCounts.get(baseName) ?? 0) + 1
        fileNameCounts.set(baseName, nextCount)
        return [
          `${baseName}${nextCount > 1 ? `-${nextCount}` : ""}.${extension}`,
          file.data,
        ]
      }),
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

export { getArtboardExportBounds }
