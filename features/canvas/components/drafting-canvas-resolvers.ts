import type { DraftingCardState } from "@/features/canvas/model/card-state";
import type {
  DraftingCanvasLayer,
  DraftingLayerStateByNodeId,
} from "@/features/canvas/model/layers/shared";
import { createDefaultDraftingLayers } from "@/features/canvas/model/layers/card-qr";
import type { DraftingContentValuesByType } from "@/features/canvas/model/document";
import type { SceneCompositionByNodeId } from "@/features/canvas/model/apply-scene-template";
import {
  createDefaultSceneComposition,
  normalizeSceneComposition,
} from "@/features/canvas/model/scene-templates";
import type { DraftingPaneToolbarVariant } from "@/features/canvas/components/Canvas";
import { findDraftingLayerById } from "@/features/canvas/components/drafting-canvas-operations";
import { getAppearanceSnapshot } from "@/features/shell/model/appearance";
import { getDefaultStaticQrValues } from "@/features/qr/content/static-payload";
import type { QrInputType } from "@/features/qr/content/input-options";
import {
  hasActiveBackgroundShapeOptions,
  hasBackgroundImage,
  type QraftyState,
} from "@/features/qr/model/state";

/**
 * Pure derivations for the drafting canvas view model. No React, no DOM —
 * every function here is a plain state → value mapping so it can be reasoned
 * about (and tested) without mounting the workspace.
 */

export function resolveSelectedContentValues(
  contentValuesByType: DraftingContentValuesByType,
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
  layerStateByNodeId: DraftingLayerStateByNodeId,
  activeQrNodeId: string,
  draftingQraftyState: QraftyState,
  selectedCardState: DraftingCardState,
) {
  return (
    layerStateByNodeId[activeQrNodeId] ??
    createDefaultDraftingLayers(activeQrNodeId, draftingQraftyState, selectedCardState)
  );
}

export function resolveSelectedTextLayer(
  activeCanvasLayers: DraftingCanvasLayer[],
  selectedLayerId: string | null,
) {
  return selectedLayerId ? findDraftingLayerById(activeCanvasLayers, selectedLayerId) : null;
}

export function resolveSelectedElementLayer(
  selectedLayerIds: string[],
  selectedTextLayer: DraftingCanvasLayer | null,
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

export function resolveQrBackgroundVisible(draftingQraftyState: QraftyState) {
  return (
    !hasBackgroundImage(draftingQraftyState) &&
    (!draftingQraftyState.backgroundOptions.transparent ||
      draftingQraftyState.backgroundGradient.enabled ||
      hasActiveBackgroundShapeOptions(draftingQraftyState.backgroundShapeOptions))
  );
}

export function resolveLayerTargets(
  activeCanvasLayers: DraftingCanvasLayer[],
  selectedLayerIds: string[],
  selectedTransformLayer: DraftingCanvasLayer | null,
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
  appearanceTargetLayer: DraftingCanvasLayer | null,
  selectedCardState: DraftingCardState,
  draftingQraftyState: QraftyState,
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
          appearanceTargetLayer.kind === "qr" ? draftingQraftyState.backgroundShapeId : undefined,
        qrBackgroundShapeOptions:
          appearanceTargetLayer.kind === "qr"
            ? draftingQraftyState.backgroundShapeOptions
            : undefined,
        qrBackgroundSurfaceVisible:
          appearanceTargetLayer.kind === "qr" ? qrBackgroundVisible : undefined,
      })
    : null;
}

export function resolveCanRemoveQrCode(
  paneToolbarVariant: DraftingPaneToolbarVariant,
  qrCanvasLayers: DraftingCanvasLayer[],
  selectedLayerId: string | null,
) {
  return (
    paneToolbarVariant === "zoom" &&
    qrCanvasLayers.length > 1 &&
    Boolean(selectedLayerId?.includes(":qr"))
  );
}
