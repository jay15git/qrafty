"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { type CanvasCardState } from "@/features/canvas/model/card-state";
import { type CanvasLayer } from "@/features/canvas/model/layers/shared";
import { createDefaultCanvasLayers } from "@/features/canvas/model/layers/card-qr";
import { ensureCanvasFontsForLayers } from "@/features/canvas/model/fonts";
import { type CanvasLayerMenuAction } from "@/features/canvas/components/canvas-layer-chrome.constants";
import { getCombinedLayerBounds } from "@/features/canvas/components/canvas-layer-geometry";
import type { ThemeMode } from "@/features/shell/components/WorkspaceChrome";
import type { QraftyState } from "@/features/qr/model/state";
import type { StaticQrValidationResult } from "@/features/qr/content/static-payload";
import type { CanvasQrStateByLayerId } from "@/features/canvas/model/document";
import { type SceneCompositionState } from "@/features/canvas/model/scene-templates";
import { useCardChrome } from "@/features/canvas/components/use-card-chrome";
import {
  useLayerContextMenu,
  type CanvasContextMenuState,
} from "@/features/canvas/components/use-layer-context-menu";
import {
  useLayerInteraction,
  type CanvasMultiSelectionPreview,
} from "@/features/canvas/components/use-layer-interaction";
import {
  useMarqueeSelection,
  type CanvasMarqueeState,
} from "@/features/canvas/components/use-marquee-selection";
import { useTextEditing } from "@/features/canvas/components/use-text-editing";

export type { CanvasContextMenuState, CanvasMarqueeState, CanvasMultiSelectionPreview };

export type CanvasWorkspaceInteractionsInput = {
  activeQrLayerId?: string;
  cardState: CanvasCardState;
  contentPan?: { x: number; y: number };
  contentOnlyZoom: boolean;
  contentValidation?: StaticQrValidationResult;
  interactionScale: number;
  viewFitScale: number;
  isSelected: boolean;
  layers?: CanvasLayer[];
  onLayerAction?: (layerIds: string[], action: CanvasLayerMenuAction) => void;
  onLayerChange?: (layerId: string, patch: Partial<CanvasLayer>) => void;
  onLayerCopy?: (layerIds: string[]) => void;
  onLayerSelect?: (layerId: string | null, options?: { additive?: boolean }) => void;
  onLayerSelectionChange?: (layerIds: string[], options?: { additive?: boolean }) => void;
  onSelect: () => void;
  onQrClick: () => void;
  qrStateByLayerId: CanvasQrStateByLayerId;
  sceneComposition: SceneCompositionState;
  selectedLayerId?: string | null;
  selectedLayerIds?: string[];
  snapEnabled: boolean;
  state: QraftyState;
  theme: ThemeMode;
};

function overlayLayerGeometry(
  layers: CanvasLayer[],
  geometryByLayerId: Record<string, Partial<CanvasLayer>> | null,
) {
  if (!geometryByLayerId) {
    return layers;
  }

  return layers.map((layer) => {
    const patch = geometryByLayerId[layer.id];
    return patch ? { ...layer, ...patch } : layer;
  });
}

function resolveSelectionState(
  selectedLayerIds: string[] | undefined,
  selectedLayerId: string | null | undefined,
  visibleLayers: CanvasLayer[],
) {
  const activeSelectedLayerIds = selectedLayerIds ?? (selectedLayerId ? [selectedLayerId] : []);
  const activeSelectedLayerIdSet = new Set(activeSelectedLayerIds);
  const selectedVisibleLayers = visibleLayers.filter((layer) =>
    activeSelectedLayerIdSet.has(layer.id),
  );
  const selectedVisibleLayerIds = selectedVisibleLayers.map((layer) => layer.id);

  return {
    activeSelectedLayerIds,
    activeSelectedLayerIdSet,
    selectedVisibleLayers,
    selectedVisibleLayerIds,
  };
}

function resolveContextMenuLayers(
  contextMenu: CanvasContextMenuState | null,
  resolvedLayers: CanvasLayer[],
) {
  if (!contextMenu) {
    return [];
  }

  const contextMenuLayerIdSet = new Set(contextMenu.layerIds);
  return resolvedLayers.filter((layer) => contextMenuLayerIdSet.has(layer.id));
}

export function useCanvasWorkspaceInteractions({
  activeQrLayerId,
  cardState,
  contentPan,
  contentOnlyZoom,
  contentValidation,
  interactionScale,
  viewFitScale,
  snapEnabled,
  state,
  isSelected,
  layers,
  onLayerAction,
  onLayerChange,
  onLayerCopy,
  onLayerSelect,
  onLayerSelectionChange,
  onSelect,
  onQrClick,
  qrStateByLayerId,
  sceneComposition,
  selectedLayerId,
  selectedLayerIds,
  theme,
}: CanvasWorkspaceInteractionsInput) {
  const [liveLayerGeometryById, setLiveLayerGeometryById] = useState<Record<
    string,
    Partial<CanvasLayer>
  > | null>(null);
  const pendingDocumentLayerChangesRef = useRef<Map<string, Partial<CanvasLayer>>>(new Map());
  const documentLayerChangeRafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  useEffect(
    () => () => {
      if (documentLayerChangeRafRef.current !== null) {
        window.cancelAnimationFrame(documentLayerChangeRafRef.current);
      }
    },
    [],
  );

  const resolvedLayers = useMemo(
    () =>
      layers && layers.length > 0 ? layers : createDefaultCanvasLayers("preview", state, cardState),
    [cardState, layers, state],
  );
  const sceneLayers = useMemo(
    () => overlayLayerGeometry(resolvedLayers, liveLayerGeometryById),
    [liveLayerGeometryById, resolvedLayers],
  );

  useEffect(() => {
    void ensureCanvasFontsForLayers(resolvedLayers);
  }, [resolvedLayers]);

  const visibleLayers = sceneLayers
    .filter((layer) => layer.isVisible)
    .sort((a, b) => a.zIndex - b.zIndex);
  const {
    activeSelectedLayerIds,
    activeSelectedLayerIdSet,
    selectedVisibleLayers,
    selectedVisibleLayerIds,
  } = resolveSelectionState(selectedLayerIds, selectedLayerId, visibleLayers);
  const combinedLayerBounds = getCombinedLayerBounds(selectedVisibleLayers);

  function getScenePointFromClientPoint(clientX: number, clientY: number) {
    const rect = canvasRef.current?.getBoundingClientRect();
    const scale =
      (interactionScale > 0 ? interactionScale : 1) * (viewFitScale > 0 ? viewFitScale : 1);

    if (!rect) {
      return { x: 0, y: 0 };
    }

    return {
      x: (clientX - (rect.left + rect.width / 2)) / scale,
      y: (clientY - (rect.top + rect.height / 2)) / scale,
    };
  }

  function flushDocumentLayerChanges() {
    if (documentLayerChangeRafRef.current !== null) {
      window.cancelAnimationFrame(documentLayerChangeRafRef.current);
      documentLayerChangeRafRef.current = null;
    }

    const pending = pendingDocumentLayerChangesRef.current;
    if (pending.size === 0) {
      return;
    }

    pendingDocumentLayerChangesRef.current = new Map();
    for (const [layerId, patch] of pending) {
      onLayerChange?.(layerId, patch);
    }
  }

  function queueDocumentLayerChange(layerId: string, patch: Partial<CanvasLayer>) {
    const current = pendingDocumentLayerChangesRef.current.get(layerId);
    pendingDocumentLayerChangesRef.current.set(layerId, current ? { ...current, ...patch } : patch);
  }

  function scheduleDocumentLayerFlush() {
    if (documentLayerChangeRafRef.current !== null) {
      return;
    }

    documentLayerChangeRafRef.current = window.requestAnimationFrame(() => {
      documentLayerChangeRafRef.current = null;
      flushDocumentLayerChanges();
    });
  }

  const {
    editingTextDraft,
    editingTextLayerId,
    registerTextEditor,
    commitEditingTextDraft,
    handleTextEditorInput,
    startTextEditing,
  } = useTextEditing({
    onLayerChange,
    onLayerSelect,
    resolvedLayers,
  });

  const {
    contextMenu,
    closeContextMenu,
    openCanvasContextMenu,
    openFloatingLayerContextMenu,
    openLayerContextMenu,
    runLayerAction,
    runSelectedLayerAction,
    runSelectedLayerCopy,
  } = useLayerContextMenu({
    activeSelectedLayerIds,
    getScenePointFromClientPoint,
    onLayerAction,
    onLayerCopy,
    onLayerSelect,
    selectedVisibleLayerIds,
  });
  const contextMenuLayers = resolveContextMenuLayers(contextMenu, resolvedLayers);

  const {
    marquee,
    suppressCanvasClickRef,
    endMarqueeSelection,
    startMarqueeSelection,
    updateMarqueeSelection,
  } = useMarqueeSelection({
    closeContextMenu,
    commitEditingTextDraft,
    editingTextLayerId,
    getScenePointFromClientPoint,
    onLayerSelectionChange,
    visibleLayers,
  });

  const {
    isLayerInteracting,
    multiSelectionPreview,
    rotatingLayerId,
    rotationPreviewDegrees,
    snapGuides,
    activateLayerSelection,
    endLayerInteraction,
    selectLayerFromClick,
    startLayerInteraction,
    startMultiLayerInteraction,
    updateLayerInteraction,
  } = useLayerInteraction({
    activeSelectedLayerIdSet,
    activeSelectedLayerIds,
    cardState,
    combinedLayerBounds,
    commitEditingTextDraft,
    editingTextLayerId,
    flushDocumentLayerChanges,
    interactionScale,
    onLayerChange,
    onLayerSelect,
    onQrClick,
    queueDocumentLayerChange,
    scheduleDocumentLayerFlush,
    selectedVisibleLayers,
    setLiveLayerGeometryById,
    snapEnabled,
    viewFitScale,
    visibleLayers,
  });

  const {
    artboardScale,
    canvasHeight,
    canvasWidth,
    cardImageStyle,
    cardLayers,
    cardStyle,
    chromeSnapGuides,
    chromeSpace,
    contentLayers,
    contentTransformStyle,
    hasError,
    imageFilterShader,
    isImageFilterMode,
    isImageMode,
    isPaperShaderMode,
    preferLowPowerShaders,
    previewCameraStyle,
    previewStageBorderRadius,
    previewStageSize,
    qrOverlayScale,
    ratioMorph,
    setHasError,
    snapGuideClipBounds,
    toolbarRef,
    toolbarWidth,
  } = useCardChrome({
    canvasRef,
    cardState,
    contentOnlyZoom,
    contentPan,
    interactionScale,
    sceneComposition,
    selectedVisibleLayerIds,
    snapGuides,
    viewFitScale,
    visibleLayers,
  });

  return {
    activeQrLayerId,
    activeSelectedLayerIdSet,
    activeSelectedLayerIds,
    artboardScale,
    canvasHeight,
    canvasRef,
    canvasWidth,
    cardImageStyle,
    cardLayers,
    cardStyle,
    chromeSnapGuides,
    chromeSpace,
    combinedLayerBounds,
    contentLayers,
    contentTransformStyle,
    contextMenu,
    contextMenuLayers,
    editingTextDraft,
    editingTextLayerId,
    hasError,
    imageFilterShader,
    isImageFilterMode,
    isImageMode,
    isLayerInteracting,
    isPaperShaderMode,
    isSelected,
    marquee,
    multiSelectionPreview,
    preferLowPowerShaders,
    previewCameraStyle,
    previewStageBorderRadius,
    previewStageSize,
    qrOverlayScale,
    ratioMorph,
    rotatingLayerId,
    rotationPreviewDegrees,
    selectedVisibleLayers,
    selectedVisibleLayerIds,
    setHasError,
    snapGuideClipBounds,
    suppressCanvasClickRef,
    registerTextEditor,
    theme,
    toolbarRef,
    toolbarWidth,
    visibleLayers,
    activateLayerSelection,
    closeContextMenu,
    commitEditingTextDraft,
    endLayerInteraction,
    endMarqueeSelection,
    handleTextEditorInput,
    openCanvasContextMenu,
    openFloatingLayerContextMenu,
    openLayerContextMenu,
    runLayerAction,
    runSelectedLayerAction,
    runSelectedLayerCopy,
    selectLayerFromClick,
    startLayerInteraction,
    startMarqueeSelection,
    startMultiLayerInteraction,
    startTextEditing,
    updateLayerInteraction,
    updateMarqueeSelection,
  };
}
