"use client"

import { useCallback, useRef, useState } from "react"

import { playSound } from "@/features/shell/audio/cuelume"
import {
  DEFAULT_DOWNLOAD_NAME,
  type DraftingDownloadExtension,
} from "@/features/canvas/components/drafting-canvas.constants"
import {
  resolveVideoOutputDimensions,
  type OutputDimensions,
} from "@/features/canvas/export/pipeline/bounds"
import { sceneHasVideoExportContent } from "@/features/canvas/export/pipeline/clock"
import {
  runWorkspaceBatchExport,
  runWorkspaceExport,
  type WorkspaceExportProgress,
} from "@/features/canvas/export/pipeline"
import type {
  DraftingCanvasLayer,
  DraftingLayerStateByNodeId,
} from "@/features/canvas/model/layers/shared"
import { cloneDraftingCanvasLayer } from "@/features/canvas/model/layers/fallback"
import { createDefaultDraftingLayers } from "@/features/canvas/model/layers/card-qr"
import type { DraftingCardState } from "@/features/canvas/model/card-state"
import type { DraftingQrStateByNodeId } from "@/features/canvas/model/document"
import type { QraftyState } from "@/features/qr/model/state"
import type { VideoExportLongEdge } from "@/features/qr/export/video-export"

export function useWorkspaceExport({
  activeQrLayerId,
  activeQrNodeId,
  canDownload,
  cardState,
  downloadExtension,
  downloadTarget,
  exportMediaKind,
  layerStateByNodeId,
  qrCanvasLayers,
  qrPaneNamesById,
  qrStateByLayerId,
  rasterPhotoLongEdge,
  setDownloadError,
  state,
  video,
}: {
  activeQrLayerId: string
  activeQrNodeId: string
  canDownload: boolean
  cardState: DraftingCardState
  downloadExtension: DraftingDownloadExtension
  downloadTarget: string
  exportMediaKind: string
  layerStateByNodeId: DraftingLayerStateByNodeId
  qrCanvasLayers: DraftingCanvasLayer[]
  qrPaneNamesById: Map<string, string>
  qrStateByLayerId: DraftingQrStateByNodeId
  rasterPhotoLongEdge: VideoExportLongEdge | undefined
  setDownloadError: (error: string | null) => void
  state: QraftyState
  video: {
    durationSeconds: number
    format: "mp4" | "webm"
    frameRate: 30 | 60
    longEdge: VideoExportLongEdge
  }
}) {
  const [inProgress, setInProgress] = useState(false)
  const [progressLabel, setProgressLabel] = useState<string | null>(null)
  const [progressRatio, setProgressRatio] = useState<number | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const resolveTargetDimensions = useCallback(
    (cardLayer: DraftingCanvasLayer): OutputDimensions | undefined => {
      if (rasterPhotoLongEdge) {
        return resolveVideoOutputDimensions(
          cardLayer.width,
          cardLayer.height,
          rasterPhotoLongEdge,
        )
      }

      return undefined
    },
    [rasterPhotoLongEdge],
  )

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  const download = useCallback(async () => {
    if (!canDownload || inProgress) {
      return
    }

    abortControllerRef.current?.abort()
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      setDownloadError(null)
      setInProgress(true)
      setProgressLabel("Preparing export...")
      setProgressRatio(0.05)
      playSound("loading")

      const exportLayers =
        layerStateByNodeId[activeQrNodeId] ??
        createDefaultDraftingLayers(activeQrNodeId, state, cardState)
      const cardLayer = exportLayers.find(
        (layer) => layer.kind === "card" && layer.isVisible,
      )

      if (!cardLayer) {
        throw new Error("The artboard card is unavailable for export.")
      }

      const targetDimensions = resolveTargetDimensions(cardLayer)
      const qualityPercent = state.rasterExportQualityPercent
      const backgroundColor = cardState.fill || "#ffffff"
      const isVideoExport =
        exportMediaKind === "video" &&
        sceneHasVideoExportContent(cardState, exportLayers, state)

      const onProgress = (progress: WorkspaceExportProgress) => {
        if (progress.kind === "video") {
          setProgressLabel(
            `Encoding video ${progress.frameIndex}/${progress.frameCount}...`,
          )
          setProgressRatio(
            progress.frameCount > 0
              ? progress.frameIndex / progress.frameCount
              : null,
          )
          return
        }

        setProgressLabel(
          progress.stage === "building" ? "Building export..." : "Encoding image...",
        )
        setProgressRatio(progress.stage === "building" ? 0.45 : 0.85)
      }

      const runExport = (
        overrides: Pick<
          Parameters<typeof runWorkspaceExport>[0],
          "layers" | "name" | "state"
        >,
      ) =>
        runWorkspaceExport({
          abortSignal: abortController.signal,
          backgroundColor,
          cardState,
          extension: downloadExtension,
          mediaKind: isVideoExport ? "video" : "photo",
          nodeId: activeQrNodeId,
          onProgress,
          qualityPercent,
          targetDimensions: isVideoExport ? undefined : targetDimensions,
          videoRequest: isVideoExport
            ? {
                durationSeconds: video.durationSeconds,
                format: video.format,
                frameRate: video.frameRate,
                longEdge: video.longEdge,
              }
            : undefined,
          ...overrides,
        })

      if (downloadTarget === "all-qr") {
        if (isVideoExport) {
          throw new Error(
            "Batch video export is not supported. Export one QR at a time.",
          )
        }

        const items = qrCanvasLayers.map((layer) => ({
          layerId: layer.id,
          name: qrPaneNamesById.get(layer.id) ?? "QR Code",
          state:
            layer.id === activeQrLayerId
              ? state
              : (qrStateByLayerId[layer.id] ?? state),
        }))

        if (items.length === 0) {
          throw new Error("No QR codes are available for export.")
        }

        await runWorkspaceBatchExport({
          abortSignal: abortController.signal,
          backgroundColor,
          cardState,
          extension: downloadExtension,
          items,
          layers: exportLayers,
          name: DEFAULT_DOWNLOAD_NAME,
          nodeId: activeQrNodeId,
          qualityPercent,
          targetDimensions,
        })
      } else if (
        downloadTarget === "current" ||
        downloadTarget.startsWith("qr:")
      ) {
        const layerId =
          downloadTarget === "current"
            ? activeQrLayerId
            : downloadTarget.slice("qr:".length)
        const exportState =
          layerId === activeQrLayerId ? state : qrStateByLayerId[layerId]

        if (!exportState) {
          throw new Error("The selected QR code is unavailable for export.")
        }

        await runExport({
          layers: exportLayers.map((entry) =>
            cloneDraftingCanvasLayer({
              ...entry,
              isVisible:
                entry.kind === "card" || entry.id === layerId
                  ? entry.isVisible
                  : false,
            }),
          ),
          name: qrPaneNamesById.get(layerId) ?? "QR Code",
          state: exportState,
        })
      } else if (downloadTarget === "surface") {
        await runExport({
          layers: exportLayers,
          name: DEFAULT_DOWNLOAD_NAME,
          state,
        })
      }

      playSound("success")
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setDownloadError("Export cancelled.")
        playSound("droplet")
        return
      }

      setDownloadError(error instanceof Error ? error.message : "Export failed.")
      playSound("error")
    } finally {
      setInProgress(false)
      setProgressLabel(null)
      setProgressRatio(null)
      abortControllerRef.current = null
    }
  }, [
    activeQrLayerId,
    activeQrNodeId,
    canDownload,
    cardState,
    downloadExtension,
    downloadTarget,
    exportMediaKind,
    inProgress,
    layerStateByNodeId,
    qrCanvasLayers,
    qrPaneNamesById,
    qrStateByLayerId,
    resolveTargetDimensions,
    setDownloadError,
    state,
    video,
  ])

  return {
    cancel,
    download,
    inProgress,
    progressLabel,
    progressRatio,
    resolveTargetDimensions,
  }
}
