"use client"

import { useMemo, useSyncExternalStore } from "react"

import {
  cloneDraftingCanvasLayer,
  type DraftingCanvasLayer,
} from "@/features/canvas/model/layers"
import type { DraftingCardState } from "@/features/canvas/model/card-state"
import type { DraftingQrStateByLayerId } from "@/features/canvas/model/document"
import type { DraftingDownloadTarget } from "@/features/canvas/components/workspace-surface-helpers"
import type { DraftingDownloadExtension } from "@/features/canvas/components/workspace-surface.constants"
import type { OutputDimensions } from "@/features/canvas/export/pipeline/bounds"
import { previewSession } from "@/features/canvas/preview/preview-session"
import { useQrScanSafety } from "@/features/qr/hooks/useQrScanSafety"
import type { QraftyState } from "@/features/qr/model/state"

type ResolveTargetDimensions = (
  cardLayer: DraftingCanvasLayer,
) => OutputDimensions | undefined

/**
 * Builds the scan-safety probe for the workspace: which QR layer is being
 * exported, the scene it sits in, and the resulting scan verdict. Kept out of
 * the workspace view model so the export-target → scene → verdict chain reads
 * on its own.
 */
export function useWorkspaceScanSafety({
  activeCanvasLayers,
  activeQrLayerId,
  activeQrNodeId,
  draftingQraftyState,
  qrCanvasLayers,
  qrStateByLayerId,
  resolveTargetDimensions,
  selectedCardState,
  selectedContentIsValid,
  selectedDownloadExtension,
  selectedDownloadTarget,
}: {
  activeCanvasLayers: DraftingCanvasLayer[]
  activeQrLayerId: string
  activeQrNodeId: string
  draftingQraftyState: QraftyState
  qrCanvasLayers: DraftingCanvasLayer[]
  qrStateByLayerId: DraftingQrStateByLayerId
  resolveTargetDimensions: ResolveTargetDimensions
  selectedCardState: DraftingCardState
  selectedContentIsValid: boolean
  selectedDownloadExtension: DraftingDownloadExtension
  selectedDownloadTarget: DraftingDownloadTarget
}) {
  const isPreviewInteracting = useSyncExternalStore(
    previewSession.subscribe,
    previewSession.getIsInteracting,
    () => false,
  )

  const scanSafetyQrLayer = useMemo(() => {
    const targetLayerId = selectedDownloadTarget.startsWith("qr:")
      ? selectedDownloadTarget.slice("qr:".length)
      : activeQrLayerId

    return (
      activeCanvasLayers.find((layer) => layer.id === targetLayerId) ??
      activeCanvasLayers.find((layer) => layer.id === activeQrLayerId) ??
      qrCanvasLayers[0]
    )
  }, [
    activeCanvasLayers,
    activeQrLayerId,
    qrCanvasLayers,
    selectedDownloadTarget,
  ])

  const scanSafetyState = useMemo(
    () =>
      scanSafetyQrLayer && scanSafetyQrLayer.id !== activeQrLayerId
        ? (qrStateByLayerId[scanSafetyQrLayer.id] ?? draftingQraftyState)
        : draftingQraftyState,
    [activeQrLayerId, draftingQraftyState, qrStateByLayerId, scanSafetyQrLayer],
  )

  const scanSafetyLayers = useMemo(
    () =>
      selectedDownloadTarget === "surface"
        ? activeCanvasLayers
        : activeCanvasLayers.map((layer) =>
            cloneDraftingCanvasLayer({
              ...layer,
              isVisible:
                layer.kind === "card" || layer.id === scanSafetyQrLayer?.id
                  ? layer.isVisible
                  : false,
            }),
          ),
    [activeCanvasLayers, scanSafetyQrLayer?.id, selectedDownloadTarget],
  )

  const scanSafetyCardLayer = useMemo(
    () =>
      scanSafetyLayers.find((layer) => layer.kind === "card" && layer.isVisible),
    [scanSafetyLayers],
  )

  const scanSafetyTargetDimensions = useMemo(
    () =>
      scanSafetyCardLayer ? resolveTargetDimensions(scanSafetyCardLayer) : undefined,
    [scanSafetyCardLayer, resolveTargetDimensions],
  )

  const scanSafetyScene = useMemo(
    () =>
      scanSafetyCardLayer
        ? {
            backgroundColor: selectedCardState.fill || "#ffffff",
            cardState: selectedCardState,
            extension: selectedDownloadExtension,
            layers: scanSafetyLayers,
            nodeId: activeQrNodeId,
            qualityPercent: draftingQraftyState.rasterExportQualityPercent,
            targetDimensions: scanSafetyTargetDimensions,
          }
        : undefined,
    [
      activeQrNodeId,
      draftingQraftyState.rasterExportQualityPercent,
      scanSafetyCardLayer,
      scanSafetyLayers,
      scanSafetyTargetDimensions,
      selectedCardState,
      selectedDownloadExtension,
    ],
  )

  return useQrScanSafety(scanSafetyState, {
    contentIsValid: selectedContentIsValid,
    enabled: !isPreviewInteracting,
    layer: scanSafetyQrLayer,
    scene: scanSafetyScene,
  })
}
