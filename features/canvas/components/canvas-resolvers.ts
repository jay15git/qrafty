import type { CanvasCardState } from "@/features/canvas/model/card-state";
import type { CanvasLayer, CanvasLayerStateByNodeId } from "@/features/canvas/model/layers/shared";
import { createDefaultCanvasLayers } from "@/features/canvas/model/layers/card-qr";
import type { CanvasContentValuesByType } from "@/features/canvas/model/document";
import type { SceneCompositionByNodeId } from "@/features/canvas/model/apply-scene-template";
import {
  createDefaultSceneComposition,
  normalizeSceneComposition,
} from "@/features/canvas/model/scene-templates";
import type { CanvasBoardToolbarVariant } from "@/features/canvas/components/Canvas";
import { findCanvasLayerById } from "@/features/canvas/components/canvas-operations";
import { getAppearanceSnapshot } from "@/features/shell/model/appearance";
import { getDefaultStaticQrValues } from "@/features/qr/content/static-payload";
import type { QrInputType } from "@/features/qr/content/input-options";
import {
  hasActiveBackgroundShapeOptions,
  hasBackgroundImage,
  type QraftyState,
} from "@/features/qr/model/state";

/**
 * Pure derivations for the canvas view model. No React, no DOM —
 * every function here is a plain state → value mapping so it can be reasoned
 * about (and tested) without mounting the workspace.
 */

export function resolveSelectedContentValues(
  contentValuesByType: CanvasContentValuesByType,
  selectedContentType: QrInputType,
) {
  return contentValuesByType[selectedContentType] ?? getDefaultStaticQrValues(selectedContentType);
}

export function resolveActiveSceneComposition(
  sceneCompositionByNodeId: SceneCompositionByNodeId,
  activeQrNodeId: string,
) {
  return normalizeSceneComposition(
    sceneCompositionByNodeId[activeQrNodeId] ?? createDefaultSceneComposition(),
  );
}

export function resolveActiveCanvasLayers(
  layerStateByNodeId: CanvasLayerStateByNodeId,
  activeQrNodeId: string,
  canvasQraftyState: QraftyState,
  selectedCardState: CanvasCardState,
) {
  return (
    layerStateByNodeId[activeQrNodeId] ??
    createDefaultCanvasLayers(activeQrNodeId, canvasQraftyState, selectedCardState)
  );
}

export function resolveSelectedTextLayer(
  activeCanvasLayers: CanvasLayer[],
  selectedLayerId: string | null,
) {
  return selectedLayerId ? findCanvasLayerById(activeCanvasLayers, selectedLayerId) : null;
}

export function resolveSelectedElementLayer(
  selectedLayerIds: string[],
  selectedTextLayer: CanvasLayer | null,
) {
  return selectedLayerIds.length === 1 &&
    selectedTextLayer &&
    (selectedTextLayer.kind === "text" ||
      selectedTextLayer.kind === "shape" ||
      selectedTextLayer.kind === "image" ||
      selectedTextLayer.kind === "shader")
    ? selectedTextLayer
    : null;
}

export function resolveQrBackgroundVisible(canvasQraftyState: QraftyState) {
  return (
    !hasBackgroundImage(canvasQraftyState) &&
    (!canvasQraftyState.backgroundOptions.transparent ||
      canvasQraftyState.backgroundGradient.enabled ||
      hasActiveBackgroundShapeOptions(canvasQraftyState.backgroundShapeOptions))
  );
}

export function resolveLayerTargets(
  activeCanvasLayers: CanvasLayer[],
  selectedLayerIds: string[],
  selectedTransformLayer: CanvasLayer | null,
) {
  const fallbackAppearanceLayer = activeCanvasLayers.find((layer) => layer.kind === "card") ?? null;
  const appearanceTargetLayer = selectedTransformLayer ?? fallbackAppearanceLayer;
  const transformTargetLayer =
    selectedTransformLayer ?? (selectedLayerIds.length === 0 ? appearanceTargetLayer : null);
  const propertiesTransformLayer =
    transformTargetLayer?.kind === "card" ? null : transformTargetLayer;

  return {
    appearanceTargetLayer,
    propertiesTransformLayer,
    transformTargetLayer,
  };
}

export function resolveAppearanceSnapshot(
  appearanceTargetLayer: CanvasLayer | null,
  selectedCardState: CanvasCardState,
  canvasQraftyState: QraftyState,
  qrBackgroundVisible: boolean,
) {
  return appearanceTargetLayer
    ? getAppearanceSnapshot(appearanceTargetLayer, {
        cardBorder: appearanceTargetLayer.kind === "card" ? selectedCardState.border : undefined,
        cardCornerRadius:
          appearanceTargetLayer.kind === "card" ? selectedCardState.cornerRadius : undefined,
        cardCornerRadii:
          appearanceTargetLayer.kind === "card" ? selectedCardState.cornerRadii : undefined,
        qrBackgroundShapeId:
          appearanceTargetLayer.kind === "qr" ? canvasQraftyState.backgroundShapeId : undefined,
        qrBackgroundShapeOptions:
          appearanceTargetLayer.kind === "qr"
            ? canvasQraftyState.backgroundShapeOptions
            : undefined,
        qrBackgroundSurfaceVisible:
          appearanceTargetLayer.kind === "qr" ? qrBackgroundVisible : undefined,
      })
    : null;
}

export function resolveCanRemoveQrCode(
  boardToolbarVariant: CanvasBoardToolbarVariant,
  qrCanvasLayers: CanvasLayer[],
  selectedLayerId: string | null,
) {
  return (
    boardToolbarVariant === "zoom" &&
    qrCanvasLayers.length > 1 &&
    Boolean(selectedLayerId?.includes(":qr"))
  );
}
