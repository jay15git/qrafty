import {
  downloadDashboardQrBatchZipExport,
  downloadDashboardQrNodeExport,
} from "@/features/qr-code/export/batch-export"
import type { QrFileExtension } from "@/features/qr-code/model/types"
import type { QrStudioState } from "@/features/qr-code/model/state"
import { buildDraftingLayeredNodePayload } from "@/features/workspace/export/layered-export"
import { downloadArtboardDomExport } from "@/features/workspace/export/artboard-raster-export"
import type { DraftingCardState } from "@/features/workspace/model/card-state"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import {
  createDefaultSceneComposition,
  normalizeSceneComposition,
  type SceneCompositionState,
} from "@/features/workspace/model/scene-templates"

export const DEFAULT_WORKSPACE_DOWNLOAD_NAME = "new-qr-studio"

export type WorkspaceDownloadTarget =
  | "all-qr"
  | "current"
  | "surface"
  | `qr:${string}`

export type WorkspaceDownloadRequest = {
  activeNodeId: string
  artboardElement?: HTMLElement | null
  cardStateByNodeId: Record<string, DraftingCardState>
  extension: QrFileExtension
  layerStateByNodeId: Record<string, DraftingCanvasLayer[]>
  name?: string
  paneNamesById: Map<string, string>
  qualityPercent: number
  qrStateByNodeId: Record<string, QrStudioState>
  sceneCompositionByNodeId: Record<string, SceneCompositionState>
  target: WorkspaceDownloadTarget
  targetDimensions?: { height: number; width: number }
  targetSizePx?: number
}

export async function executeWorkspaceDownload({
  activeNodeId,
  artboardElement,
  cardStateByNodeId,
  extension,
  layerStateByNodeId,
  name = DEFAULT_WORKSPACE_DOWNLOAD_NAME,
  paneNamesById,
  qualityPercent,
  qrStateByNodeId,
  sceneCompositionByNodeId,
  target,
  targetDimensions,
  targetSizePx,
}: WorkspaceDownloadRequest) {
  if (target === "all-qr") {
    const nodes = await Promise.all(
      Object.entries(qrStateByNodeId).map(async ([nodeId, state]) => {
        const cardState = cardStateByNodeId[nodeId]
        const layers = layerStateByNodeId[nodeId]

        if (!cardState || !layers) {
          throw new Error(`QR pane "${nodeId}" is unavailable for export.`)
        }

        return await buildDraftingLayeredNodePayload({
          cardState,
          layers,
          name: paneNamesById.get(nodeId) ?? "QR Code",
          nodeId,
          sceneComposition: normalizeSceneComposition(
            sceneCompositionByNodeId[nodeId] ?? createDefaultSceneComposition(),
          ),
          state,
        })
      }),
    )

    if (nodes.length === 0) {
      throw new Error("No QR codes are available for export.")
    }

    await downloadDashboardQrBatchZipExport({
      extension,
      name,
      nodes,
      qualityPercent,
      targetDimensions,
      targetSizePx,
    })
    return
  }

  const nodeId =
    target === "current" || target === "surface"
      ? activeNodeId
      : target.startsWith("qr:")
        ? target.slice("qr:".length)
        : activeNodeId
  const state = qrStateByNodeId[nodeId]
  const cardState = cardStateByNodeId[nodeId]
  const layers = layerStateByNodeId[nodeId]

  if (!state || !cardState || !layers) {
    throw new Error("The selected QR code is unavailable for export.")
  }

  if (target === "surface" && artboardElement && extension !== "svg") {
    await downloadArtboardDomExport({
      element: artboardElement,
      extension,
      fileName: name,
      qualityPercent,
      pixelRatio: targetSizePx
        ? Math.max(1, targetSizePx / Math.max(cardState.width, cardState.height))
        : 2,
    })
    return
  }

  if (target === "surface" && artboardElement && extension === "svg") {
    await downloadArtboardDomExport({
      element: artboardElement,
      extension: "svg",
      fileName: name,
    })
    return
  }

  const payload = await buildDraftingLayeredNodePayload({
    cardState,
    layers,
    name: paneNamesById.get(nodeId) ?? name,
    nodeId,
    sceneComposition: normalizeSceneComposition(
      sceneCompositionByNodeId[nodeId] ?? createDefaultSceneComposition(),
    ),
    state,
  })

  await downloadDashboardQrNodeExport({
    extension,
    name: target === "surface" ? name : (paneNamesById.get(nodeId) ?? name),
    node: payload,
    qualityPercent,
    targetDimensions,
    targetSizePx,
  })
}
