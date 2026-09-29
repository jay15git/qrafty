import { useMemo } from "react";

import { mergeLiveQrStateByLayerId } from "@/features/canvas/components/canvas-document";
import type { CanvasSurfaceState } from "@/features/canvas/components/canvas-reducer";
import {
  resolveAppearanceSnapshot,
  resolveCanRemoveQrCode,
  resolveLayerTargets,
  resolveQrBackgroundVisible,
  resolveSelectedElementLayer,
  resolveSelectedTextLayer,
} from "@/features/canvas/components/canvas-resolvers";
import { sceneHasVideoExportContent } from "@/features/canvas/export/pipeline/clock";
import { getQrCanvasLayers } from "@/features/canvas/model/layers/shared";
import { DASHBOARD_QR_NODE_ID } from "@/features/qr/rendering/compose-scene";
import type { QraftyState } from "@/features/qr/model/state";
import type { StaticQrValidationResult } from "@/features/qr/content/static-payload";

/**
 * Board/artboard derivations: resolves the active layer stack, QR layers,
 * selection targets, appearance snapshot, and the `boards` array the canvas
 * renders. Pure memos over reducer state — no effects.
 */
export function useCanvasBoards({
  canvasQraftyState,
  selectedContentValidation,
  state,
}: {
  canvasQraftyState: QraftyState;
  selectedContentValidation: StaticQrValidationResult;
  state: CanvasSurfaceState;
}) {
  const {
    activeQrLayerId,
    canvasLayers: activeCanvasLayers,
    qrStateByLayerId,
    selectedCardState,
    selectedLayerId,
    selectedLayerIds,
  } = state;
  const qrCanvasLayers = useMemo(() => getQrCanvasLayers(activeCanvasLayers), [activeCanvasLayers]);
  const canExportVideo = sceneHasVideoExportContent(selectedCardState, canvasQraftyState);
  const qrBoardNamesById = useMemo(() => {
    const next = new Map<string, string>();

    qrCanvasLayers.forEach((layer, index) => {
      next.set(layer.id, index === 0 ? "QR Code" : `QR Code ${index + 1}`);
    });

    return next;
  }, [qrCanvasLayers]);

  const activeCanvasLayerRows = [...activeCanvasLayers].sort((a, b) => b.zIndex - a.zIndex);
  const selectedTextLayer = resolveSelectedTextLayer(activeCanvasLayers, selectedLayerId);
  const selectedElementLayer = resolveSelectedElementLayer(selectedLayerIds, selectedTextLayer);
  const selectedTransformLayer =
    selectedLayerIds.length === 1 && selectedTextLayer ? selectedTextLayer : null;

  const boards = useMemo(() => {
    const mergedQrStateByLayerId = mergeLiveQrStateByLayerId({
      qrStateByLayerId,
      activeQrLayerId,
      canvasLayers: activeCanvasLayers,
      canvasQraftyState,
      selectedLayerId,
    });

    return [
      {
        activeQrLayerId,
        cardState: selectedCardState,
        contentValidation: selectedContentValidation,
        id: DASHBOARD_QR_NODE_ID,
        layers: activeCanvasLayers,
        name: "QR Code",
        qrStateByLayerId: mergedQrStateByLayerId,
        state: canvasQraftyState,
      },
    ];
  }, [
    activeCanvasLayers,
    activeQrLayerId,
    canvasQraftyState,
    qrStateByLayerId,
    selectedCardState,
    selectedContentValidation,
    selectedLayerId,
  ]);

  const { appearanceTargetLayer, propertiesTransformLayer } = resolveLayerTargets(
    activeCanvasLayers,
    selectedLayerIds,
    selectedTransformLayer,
  );
  const qrBackgroundVisible = resolveQrBackgroundVisible(canvasQraftyState);
  const desktopAppearanceSnapshot = resolveAppearanceSnapshot(
    appearanceTargetLayer,
    selectedCardState,
    canvasQraftyState,
    qrBackgroundVisible,
  );
  const canRemoveQrCode = resolveCanRemoveQrCode(qrCanvasLayers, selectedLayerId);

  return {
    activeCanvasLayerRows,
    activeCanvasLayers,
    appearanceTargetLayer,
    boards,
    canExportVideo,
    canRemoveQrCode,
    desktopAppearanceSnapshot,
    propertiesTransformLayer,
    qrBackgroundVisible,
    qrBoardNamesById,
    qrCanvasLayers,
    selectedElementLayer,
    selectedTextLayer,
    selectedTransformLayer,
  };
}

export type CanvasBoards = ReturnType<typeof useCanvasBoards>;
