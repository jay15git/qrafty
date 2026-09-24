"use client";

import { useMemo, useSyncExternalStore } from "react";

import type { CanvasLayer } from "@/features/canvas/model/layers/shared";
import { cloneCanvasLayer } from "@/features/canvas/model/layers/fallback";
import type { CanvasCardState } from "@/features/canvas/model/card-state";
import type { CanvasQrStateByLayerId } from "@/features/canvas/model/document";
import type { CanvasDownloadTarget } from "@/features/canvas/components/canvas-operations";
import type { CanvasDownloadExtension } from "@/features/canvas/components/canvas.constants";
import type { OutputDimensions } from "@/features/canvas/export/pipeline/bounds";
import { previewSession } from "@/features/canvas/preview/preview-session";
import { useQrScanSafety } from "@/features/qr/hooks/use-qr-scan-safety";
import type { QraftyState } from "@/features/qr/model/state";

type ResolveTargetDimensions = (cardLayer: CanvasLayer) => OutputDimensions | undefined;

/**
 * Builds the scan-safety probe for the workspace: which QR layer is being
 * exported, the scene it sits in, and the resulting scan verdict. Kept out of
 * the workspace view model so the export-target → scene → verdict chain reads
 * on its own.
 */
export function useCanvasScanSafety({
  activeCanvasLayers,
  activeQrLayerId,
  activeQrNodeId,
  canvasQraftyState,
  qrCanvasLayers,
  qrStateByLayerId,
  resolveTargetDimensions,
  selectedCardState,
  selectedContentIsValid,
  selectedDownloadExtension,
  selectedDownloadTarget,
}: {
  activeCanvasLayers: CanvasLayer[];
  activeQrLayerId: string;
  activeQrNodeId: string;
  canvasQraftyState: QraftyState;
  qrCanvasLayers: CanvasLayer[];
  qrStateByLayerId: CanvasQrStateByLayerId;
  resolveTargetDimensions: ResolveTargetDimensions;
  selectedCardState: CanvasCardState;
  selectedContentIsValid: boolean;
  selectedDownloadExtension: CanvasDownloadExtension;
  selectedDownloadTarget: CanvasDownloadTarget;
}) {
  const isPreviewInteracting = useSyncExternalStore(
    previewSession.subscribe,
    previewSession.getIsInteracting,
    () => false,
  );

  const scanSafetyQrLayer = useMemo(() => {
    const targetLayerId = selectedDownloadTarget.startsWith("qr:")
      ? selectedDownloadTarget.slice("qr:".length)
      : activeQrLayerId;

    return (
      activeCanvasLayers.find((layer) => layer.id === targetLayerId) ??
      activeCanvasLayers.find((layer) => layer.id === activeQrLayerId) ??
      qrCanvasLayers[0]
    );
  }, [activeCanvasLayers, activeQrLayerId, qrCanvasLayers, selectedDownloadTarget]);

  const scanSafetyState = useMemo(
    () =>
      scanSafetyQrLayer && scanSafetyQrLayer.id !== activeQrLayerId
        ? (qrStateByLayerId[scanSafetyQrLayer.id] ?? canvasQraftyState)
        : canvasQraftyState,
    [activeQrLayerId, canvasQraftyState, qrStateByLayerId, scanSafetyQrLayer],
  );

  const scanSafetyLayers = useMemo(
    () =>
      selectedDownloadTarget === "surface"
        ? activeCanvasLayers
        : activeCanvasLayers.map((layer) =>
            cloneCanvasLayer({
              ...layer,
              isVisible:
                layer.kind === "card" || layer.id === scanSafetyQrLayer?.id
                  ? layer.isVisible
                  : false,
            }),
          ),
    [activeCanvasLayers, scanSafetyQrLayer?.id, selectedDownloadTarget],
  );

  const scanSafetyCardLayer = useMemo(
    () => scanSafetyLayers.find((layer) => layer.kind === "card" && layer.isVisible),
    [scanSafetyLayers],
  );

  const scanSafetyTargetDimensions = useMemo(
    () => (scanSafetyCardLayer ? resolveTargetDimensions(scanSafetyCardLayer) : undefined),
    [scanSafetyCardLayer, resolveTargetDimensions],
  );

  const scanSafetyScene = useMemo(
    () =>
      scanSafetyCardLayer
        ? {
            backgroundColor: selectedCardState.fill || "#ffffff",
            cardState: selectedCardState,
            extension: selectedDownloadExtension,
            layers: scanSafetyLayers,
            nodeId: activeQrNodeId,
            qualityPercent: canvasQraftyState.rasterExportQualityPercent,
            targetDimensions: scanSafetyTargetDimensions,
          }
        : undefined,
    [
      activeQrNodeId,
      canvasQraftyState.rasterExportQualityPercent,
      scanSafetyCardLayer,
      scanSafetyLayers,
      scanSafetyTargetDimensions,
      selectedCardState,
      selectedDownloadExtension,
    ],
  );

  return useQrScanSafety(scanSafetyState, {
    contentIsValid: selectedContentIsValid,
    enabled: !isPreviewInteracting,
    layer: scanSafetyQrLayer,
    scene: scanSafetyScene,
  });
}
