import { useMemo } from "react";

import type { CanvasBoardToolbarVariant } from "@/features/canvas/components/Canvas";
import { mergeLiveQrStateByLayerId } from "@/features/canvas/components/canvas-document";
import type { CanvasSurfaceState } from "@/features/canvas/components/canvas-reducer";
import {
  resolveActiveCanvasLayers,
  resolveActiveSceneComposition,
  resolveAppearanceSnapshot,
  resolveCanRemoveQrCode,
  resolveLayerTargets,
  resolveQrBackgroundVisible,
  resolveSelectedElementLayer,
  resolveSelectedTextLayer,
} from "@/features/canvas/components/canvas-resolvers";
import { sceneHasVideoExportContent } from "@/features/canvas/export/pipeline/clock";
import { getQrCanvasLayers } from "@/features/canvas/model/layers/shared";
import type { QraftyState } from "@/features/qr/model/state";
import type { StaticQrValidationResult } from "@/features/qr/content/static-payload";

/**
 * Board/artboard derivations: resolves the active layer stack, QR layers,
 * selection targets, appearance snapshot, and the `boards` array the canvas
 * renders. Pure memos over reducer state — no effects.
 */
export function useCanvasBoards({
  boardToolbarVariant,
  canvasQraftyState,
  selectedContentValidation,
  state,
}: {
  boardToolbarVariant: CanvasBoardToolbarVariant;
  canvasQraftyState: QraftyState;
  selectedContentValidation: StaticQrValidationResult;
  state: CanvasSurfaceState;
}) {
  const {
    activeQrLayerId,
    activeQrNodeId,
    layerStateByNodeId,
    qrStateByLayerId,
    sceneCompositionByNodeId,
    selectedCardState,
    selectedLayerId,
    selectedLayerIds,
  } = state;

  const activeSceneComposition = resolveActiveSceneComposition(
    sceneCompositionByNodeId,
    activeQrNodeId,
  );
  const activeCanvasLayers = resolveActiveCanvasLayers(
    layerStateByNodeId,
    activeQrNodeId,
    canvasQraftyState,
    selectedCardState,
  );
  const qrCanvasLayers = useMemo(() => getQrCanvasLayers(activeCanvasLayers), [activeCanvasLayers]);
  const canExportVideo = sceneHasVideoExportContent(
    selectedCardState,
    activeCanvasLayers,
    canvasQraftyState,
  );
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
        id: activeQrNodeId,
        layers: activeCanvasLayers,
        name: "QR Code",
        qrStateByLayerId: mergedQrStateByLayerId,
        sceneComposition: activeSceneComposition,
        state: canvasQraftyState,
      },
    ];
  }, [
    activeCanvasLayers,
    activeQrLayerId,
    activeQrNodeId,
    activeSceneComposition,
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
  const canRemoveQrCode = resolveCanRemoveQrCode(
    boardToolbarVariant,
    qrCanvasLayers,
    selectedLayerId,
  );

  return {
    activeCanvasLayerRows,
    activeCanvasLayers,
    activeSceneComposition,
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
