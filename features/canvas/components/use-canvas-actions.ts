import { useEffect, useMemo, useRef, type MutableRefObject } from "react";

import {
  cloneCanvasCardState,
  createDefaultCanvasCardState,
} from "@/features/canvas/model/card-state";
import { getCanvasQrLayerId, isCanvasQrLayerId } from "@/features/canvas/model/layers/shared";
import { cloneCanvasLayer } from "@/features/canvas/model/layers/fallback";
import {
  createCanvasQrLayer,
  createDefaultCanvasLayers,
} from "@/features/canvas/model/layers/card-qr";
import {
  cloneCanvasQrState,
  createDefaultCanvasWorkspaceQrState,
  type CanvasWorkspaceDocumentV1,
} from "@/features/canvas/model/document";
import {
  cloneSceneCompositionByNodeId,
  createDefaultSceneCompositionByNodeId,
} from "@/features/canvas/model/apply-scene-template";
import {
  buildCanvasWorkspaceDocumentFromState,
  resolveActiveQrLayerIdFromLayers,
} from "@/features/canvas/components/canvas-document";
import { findCanvasLayerById } from "@/features/canvas/components/canvas-operations";
import type {
  CanvasSurfaceSetters,
  CanvasSurfaceState,
} from "@/features/canvas/components/canvas-reducer";
import type { CanvasBoards } from "@/features/canvas/components/use-canvas-boards";
import type { QrControlsApi } from "@/features/canvas/canvas/qr-controls";
import { useCanvasHistory } from "@/features/canvas/canvas/use-canvas-history";
import { useWorkspaceExport } from "@/features/canvas/canvas/use-workspace-export";
import { useQrLogoActions } from "@/features/canvas/canvas/use-qr-logo-actions";
import { useLayerActions } from "@/features/canvas/canvas/use-layer-actions";
import type { CanvasPersistence } from "@/features/canvas/components/use-canvas-persistence";
import { useSettingsActions } from "@/features/canvas/canvas/use-settings-actions";
import {
  useCanvasShortcuts,
  type CanvasShortcutHandlers,
} from "@/features/canvas/canvas/use-canvas-shortcuts";
import { DEFAULT_DESKTOP_EXPORT_SETTINGS } from "@/features/shell/model/toolbar-defaults";
import type { BrandIconCategory } from "@/features/qr/assets/brand-icons";
import { isRasterExportExtension } from "@/features/qr/export/raster-export";
import { DASHBOARD_QR_NODE_ID } from "@/features/qr/rendering/compose-scene";
import {
  getContentValuesForTypeChange,
  getDefaultStaticQrValues,
  resolveContentValuesForType,
  type StaticQrContentValue,
  type StaticQrContentValues,
} from "@/features/qr/content/static-payload";
import {
  getPlatformDefaultValuesForIntent,
  isPlatformType,
} from "@/features/qr/content/platform-intents";
import { DEFAULT_QR_INPUT_TYPE, type QrInputType } from "@/features/qr/content/input-options";

type CanvasBrandIconCategoryFilter = BrandIconCategory | "all";

/**
 * Workspace actions: history, export, logo/layer/settings action hooks, and
 * keyboard shortcuts, plus the document round-trip (build/apply) they share.
 * The document apply and layer activation live here because they need
 * `selectSingleLayer`, which `useLayerActions` produces — keeping them in the
 * same hook preserves the original call graph without ref indirection.
 */
export function useCanvasActions({
  boards,
  canvasRef,
  persistence,
  qrControls,
  setters,
  state,
}: {
  boards: CanvasBoards;
  canvasRef: MutableRefObject<HTMLElement | null>;
  persistence: CanvasPersistence;
  qrControls: QrControlsApi;
  setters: CanvasSurfaceSetters;
  state: CanvasSurfaceState;
}) {
  const {
    activeQrLayerId,
    activeQrNodeId,
    cardStateByNodeId,
    contentTypeByLayerId,
    contentTypeByNodeId,
    contentValuesByType,
    isCanvasWorkspaceReady,
    layerStateByNodeId,
    qrStateByLayerId,
    sceneCompositionByNodeId,
    selectedCardState,
    selectedContentType,
    selectedDownloadExtension,
    selectedDownloadTarget,
    selectedExportMediaKind,
    selectedLayerIds,
    selectedLogoColor,
    selectedLogoColorMode,
    selectedLogoGradient,
    selectedLogoPresetId,
    selectedPhotoLongEdge,
    selectedVideoDurationSeconds,
    selectedVideoFormat,
    selectedVideoFrameRate,
    selectedVideoLongEdge,
  } = state;
  const {
    setActiveQrLayerId,
    setActiveQrNodeId,
    setCardStateByNodeId,
    setContentTypeByLayerId,
    setContentTypeByNodeId,
    setContentValuesByType,
    setDesktopRailTool,
    setExportDownloadError,
    setLayerStateByNodeId,
    setQrStateByLayerId,
    setQrStateByNodeId,
    setSceneCompositionByNodeId,
    setSelectedBackgroundShapeId,
    setSelectedBackgroundTransparent,
    setSelectedCardState,
    setSelectedContentType,
    setSelectedDownloadExtension,
    setSelectedDownloadTarget,
    setSelectedPhotoLongEdge,
    setIsCanvasWorkspaceReady,
  } = setters;
  const {
    canvasQraftyState,
    commitActiveQraftyState,
    persistActiveQrLayerState,
    resolveLiveQrPersistState,
    selectedContentValidation,
  } = persistence;
  const {
    activeCanvasLayers,
    appearanceTargetLayer,
    qrBackgroundVisible,
    qrBoardNamesById,
    qrCanvasLayers,
    selectedTextLayer,
  } = boards;

  const brandIconQueryRef = useRef("");
  const brandIconCategoryRef = useRef<CanvasBrandIconCategoryFilter>("all");
  const canvasLayerClipboardRef = useRef<string>("");
  const logoUploadObjectUrlRef = useRef<string | null>(null);
  const shortcutHandlersRef = useRef<CanvasShortcutHandlers>({} as CanvasShortcutHandlers);
  const keyboardStateRef = useRef({
    activeQrLayerId,
    activeQrNodeId,
    canvasQraftyState,
    layerStateByNodeId,
    qrLayerCount: qrCanvasLayers.length,
    selectedCardState,
    selectedLayerIds,
  });

  const canDownload = selectedContentValidation.isValid && Boolean(canvasQraftyState.data.trim());
  const isCanvasRasterExport = isRasterExportExtension(selectedDownloadExtension);
  const selectedRasterPhotoLongEdge = isCanvasRasterExport ? selectedPhotoLongEdge : undefined;

  const canvasWorkspaceDocument = useMemo(
    () => buildCanvasWorkspaceDocument(),
    // buildCanvasWorkspaceDocument reads exactly the state listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      activeQrLayerId,
      activeQrNodeId,
      cardStateByNodeId,
      contentTypeByLayerId,
      contentTypeByNodeId,
      contentValuesByType,
      canvasQraftyState,
      layerStateByNodeId,
      qrStateByLayerId,
      sceneCompositionByNodeId,
      selectedCardState,
      selectedContentType,
    ],
  );
  const applyDocumentRef = useRef(applyCanvasWorkspaceDocumentToControls);
  useEffect(() => {
    applyDocumentRef.current = applyCanvasWorkspaceDocumentToControls;
  });
  const {
    canRedo: canRedoCanvasWorkspace,
    canUndo: canUndoCanvasWorkspace,
    redo: handleRedoCanvasWorkspace,
    save: handleSaveCanvasWorkspace,
    shouldReplaceCurrentEntryRef: shouldReplaceCurrentCanvasHistoryEntryRef,
    undo: handleUndoCanvasWorkspace,
  } = useCanvasHistory({
    applyDocumentRef,
    document: canvasWorkspaceDocument,
    isWorkspaceReady: isCanvasWorkspaceReady,
    setIsWorkspaceReady: setIsCanvasWorkspaceReady,
  });
  const {
    cancel: cancelWorkspaceExport,
    download: handleDownload,
    inProgress: exportInProgress,
    progressLabel: exportProgressLabel,
    progressRatio: exportProgressRatio,
    resolveTargetDimensions: resolveWorkspaceExportTargetDimensions,
  } = useWorkspaceExport({
    activeQrLayerId,
    activeQrNodeId,
    canDownload,
    cardState: selectedCardState,
    downloadExtension: selectedDownloadExtension,
    downloadTarget: selectedDownloadTarget,
    exportMediaKind: selectedExportMediaKind,
    layerStateByNodeId,
    qrCanvasLayers,
    qrBoardNamesById,
    qrStateByLayerId,
    rasterPhotoLongEdge: selectedRasterPhotoLongEdge,
    setDownloadError: setExportDownloadError,
    state: canvasQraftyState,
    video: {
      durationSeconds: selectedVideoDurationSeconds,
      format: selectedVideoFormat,
      frameRate: selectedVideoFrameRate,
      longEdge: selectedVideoLongEdge,
    },
  });

  const logoActions = useQrLogoActions({
    commitState: commitActiveQraftyState,
    selectedLogoColor,
    selectedLogoColorMode,
    selectedLogoGradient,
    selectedLogoPresetId,
    setLogoAssetSourceMode: setters.setSelectedLogoAssetSourceMode,
    state: canvasQraftyState,
  });

  function handleCanvasContentTypeChange(type: QrInputType) {
    setSelectedContentType(type);
    setContentTypeByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: type,
    }));
    setContentValuesByType((current) => {
      const previousType = selectedContentType;
      const nextValues = current[type]
        ? resolveContentValuesForType(type, current[type])
        : getContentValuesForTypeChange(
            previousType,
            type,
            current[previousType] ?? getDefaultStaticQrValues(previousType),
          );

      return {
        ...current,
        [type]: nextValues,
      };
    });
  }

  function handleCanvasContentValueChange(field: string, value: StaticQrContentValue) {
    if (field === "intent" && typeof value === "string" && isPlatformType(selectedContentType)) {
      setContentValuesByType((current) => ({
        ...current,
        [selectedContentType]: getPlatformDefaultValuesForIntent(selectedContentType, value),
      }));
      return;
    }

    setContentValuesByType((current) => ({
      ...current,
      [selectedContentType]: {
        ...(current[selectedContentType] ?? getDefaultStaticQrValues(selectedContentType)),
        [field]: value,
      },
    }));
  }

  function handleCanvasContentPasteApply(type: QrInputType, values: StaticQrContentValues) {
    setSelectedContentType(type);
    setContentTypeByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: type,
    }));
    setContentValuesByType((current) => ({
      ...current,
      [type]: values,
    }));
  }

  function buildCanvasWorkspaceDocument(): CanvasWorkspaceDocumentV1 {
    return buildCanvasWorkspaceDocumentFromState({
      activeQrLayerId,
      activeQrNodeId,
      cardStateByNodeId,
      contentTypeByLayerId,
      contentTypeByNodeId,
      contentValuesByType,
      canvasQraftyState,
      layerStateByNodeId,
      qrStateByLayerId,
      sceneCompositionByNodeId,
      selectedCardState,
      selectedContentType,
    });
  }

  function activateQrLayer(layerId: string) {
    if (!isCanvasQrLayerId(layerId) || layerId === activeQrLayerId) {
      return;
    }

    shouldReplaceCurrentCanvasHistoryEntryRef.current = true;
    persistActiveQrLayerState();

    const nextState = qrStateByLayerId[layerId] ?? createDefaultCanvasWorkspaceQrState();
    const nextContentType = contentTypeByLayerId[layerId] ?? DEFAULT_QR_INPUT_TYPE;

    setActiveQrLayerId(layerId);
    qrControls.applyQrState(nextState);
    setSelectedContentType(nextContentType);
    selectSingleLayer(layerId);
  }

  function applyCanvasWorkspaceDocumentToControls(nextDocument: CanvasWorkspaceDocumentV1) {
    const nodeId = DASHBOARD_QR_NODE_ID;
    const activeNodeId = nodeId;
    const fallbackActiveLayerId = nextDocument.qrStateByLayerId[nextDocument.activeQrLayerId]
      ? nextDocument.activeQrLayerId
      : getCanvasQrLayerId(nodeId);
    const activeCardState =
      nextDocument.cardStateByNodeId[activeNodeId] ?? createDefaultCanvasCardState();
    const layers = (
      nextDocument.layerStateByNodeId[activeNodeId] ??
      createDefaultCanvasLayers(
        activeNodeId,
        nextDocument.qrStateByLayerId[fallbackActiveLayerId] ??
          nextDocument.qrStateByNodeId[activeNodeId] ??
          createDefaultCanvasWorkspaceQrState(),
        activeCardState,
      )
    ).map(cloneCanvasLayer);
    const activeLayerId = resolveActiveQrLayerIdFromLayers(
      fallbackActiveLayerId,
      layers,
      nextDocument.activeQrLayerId,
    );
    const activeState =
      nextDocument.qrStateByLayerId[activeLayerId] ??
      nextDocument.qrStateByLayerId[fallbackActiveLayerId] ??
      nextDocument.qrStateByNodeId[activeNodeId] ??
      createDefaultCanvasWorkspaceQrState();

    setActiveQrLayerId(activeLayerId);
    setActiveQrNodeId(activeNodeId);
    setQrStateByLayerId(structuredClone(nextDocument.qrStateByLayerId));
    setQrStateByNodeId({
      [activeNodeId]: cloneCanvasQrState(activeState),
    });
    setCardStateByNodeId({
      [activeNodeId]: cloneCanvasCardState(activeCardState),
    });
    setLayerStateByNodeId({
      [activeNodeId]: layers,
    });
    setSceneCompositionByNodeId(
      cloneSceneCompositionByNodeId(
        nextDocument.sceneCompositionByNodeId ??
          createDefaultSceneCompositionByNodeId(nextDocument),
      ),
    );
    setContentTypeByLayerId(structuredClone(nextDocument.contentTypeByLayerId));
    setContentTypeByNodeId(structuredClone(nextDocument.contentTypeByNodeId));
    setSelectedContentType(nextDocument.selectedContentType);
    setContentValuesByType(structuredClone(nextDocument.contentValuesByType));
    qrControls.applyQrState(activeState);
    setSelectedCardState(cloneCanvasCardState(activeCardState));
    selectSingleLayer(activeLayerId);
  }

  const {
    clearCanvasLayerSelection,
    copySelectedCanvasLayers,
    deleteSelectedLayersOrBoard,
    duplicateSelectedLayers,
    handleLayerAction,
    handleLayerChange,
    pasteCanvasLayers,
    selectAllActiveCanvasLayers,
    selectSingleLayer,
    ...layerActions
  } = useLayerActions({
    ...state,
    ...setters,
    activateQrLayer,
    canvasLayerClipboardRef,
    canvasQraftyState,
    canvasRef,
    keyboardStateRef,
    persistActiveQrLayerState,
    qrControls,
    shouldReplaceCurrentEntryRef: shouldReplaceCurrentCanvasHistoryEntryRef,
  });

  function resetCanvasWorkspace() {
    const nextState = createDefaultCanvasWorkspaceQrState();

    setDesktopRailTool("content");
    qrControls.applyQrState(nextState);
    brandIconQueryRef.current = "";
    brandIconCategoryRef.current = "all";
    setActiveQrLayerId(getCanvasQrLayerId(DASHBOARD_QR_NODE_ID));
    setActiveQrNodeId(DASHBOARD_QR_NODE_ID);
    setContentTypeByNodeId({
      [DASHBOARD_QR_NODE_ID]: DEFAULT_QR_INPUT_TYPE,
    });
    setContentTypeByLayerId({
      [getCanvasQrLayerId(DASHBOARD_QR_NODE_ID)]: DEFAULT_QR_INPUT_TYPE,
    });
    setQrStateByLayerId({
      [getCanvasQrLayerId(DASHBOARD_QR_NODE_ID)]: cloneCanvasQrState(nextState),
    });
    setQrStateByNodeId({
      [DASHBOARD_QR_NODE_ID]: cloneCanvasQrState(nextState),
    });
    const nextCardState = createDefaultCanvasCardState();
    setSelectedCardState(cloneCanvasCardState(nextCardState));
    setCardStateByNodeId({
      [DASHBOARD_QR_NODE_ID]: cloneCanvasCardState(nextCardState),
    });
    setLayerStateByNodeId({
      [DASHBOARD_QR_NODE_ID]: createDefaultCanvasLayers(
        DASHBOARD_QR_NODE_ID,
        nextState,
        nextCardState,
      ),
    });
    selectSingleLayer(getCanvasQrLayerId(DASHBOARD_QR_NODE_ID));

    setSelectedDownloadExtension("png");
    setSelectedDownloadTarget("surface");
    setSelectedPhotoLongEdge(DEFAULT_DESKTOP_EXPORT_SETTINGS.photoLongEdge);
    setSelectedBackgroundTransparent(false);
    setSelectedBackgroundShapeId(nextState.backgroundShapeId);
  }

  async function handleAddQrCode() {
    if (qrCanvasLayers.length >= 10) return;

    persistActiveQrLayerState();

    const freshState = createDefaultCanvasWorkspaceQrState();
    const layers =
      layerStateByNodeId[activeQrNodeId] ??
      createDefaultCanvasLayers(activeQrNodeId, canvasQraftyState, selectedCardState);
    const maxZIndex = layers.reduce((max, layer) => Math.max(max, layer.zIndex), -1);
    const nearLayer =
      findCanvasLayerById(layers, activeQrLayerId) ?? qrCanvasLayers.at(-1) ?? undefined;
    const nextLayer = createCanvasQrLayer(activeQrNodeId, freshState, selectedCardState, {
      nearLayer,
      zIndex: maxZIndex + 1,
    });

    setQrStateByLayerId((current) => ({
      ...current,
      [nextLayer.id]: cloneCanvasQrState(freshState),
    }));
    setContentTypeByLayerId((current) => ({
      ...current,
      [nextLayer.id]: DEFAULT_QR_INPUT_TYPE,
    }));
    setLayerStateByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: [...layers.map(cloneCanvasLayer), nextLayer],
    }));

    setActiveQrLayerId(nextLayer.id);
    qrControls.applyQrState(freshState);
    setSelectedContentType(DEFAULT_QR_INPUT_TYPE);
    selectSingleLayer(nextLayer.id);
  }

  const settingsActions = useSettingsActions({
    ...state,
    ...setters,
    activeCanvasLayers,
    appearanceTargetLayer,
    commitActiveQraftyState,
    canvasQraftyState,
    handleLayerChange,
    handleLayerSelect: layerActions.handleLayerSelect,
    logoActions,
    logoUploadObjectUrlRef,
    persistActiveQrLayerState,
    qrBackgroundVisible,
    qrControls,
    resolveLiveQrPersistState,
    selectedTextLayer,
    selectSingleLayer,
  });

  useEffect(() => {
    keyboardStateRef.current = {
      activeQrLayerId,
      activeQrNodeId,
      canvasQraftyState,
      layerStateByNodeId,
      qrLayerCount: qrCanvasLayers.length,
      selectedCardState,
      selectedLayerIds,
    };
  }, [
    activeQrLayerId,
    activeQrNodeId,
    canvasQraftyState,
    layerStateByNodeId,
    qrCanvasLayers.length,
    selectedCardState,
    selectedLayerIds,
  ]);

  useEffect(() => {
    shortcutHandlersRef.current = {
      clearCanvasLayerSelection,
      copySelectedCanvasLayers,
      deleteSelectedLayersOrBoard,
      duplicateSelectedLayers,
      handleLayerAction,
      handleLayerChange,
      handleRedoCanvasWorkspace,
      handleUndoCanvasWorkspace,
      pasteCanvasLayers,
      selectAllActiveCanvasLayers,
    };
  });
  useCanvasShortcuts({
    clipboardRef: canvasLayerClipboardRef,
    handlersRef: shortcutHandlersRef,
    stateRef: keyboardStateRef,
    canvasRef: canvasRef,
  });

  return {
    ...layerActions,
    ...settingsActions,
    canDownload,
    canRedoCanvasWorkspace,
    canUndoCanvasWorkspace,
    cancelWorkspaceExport,
    clearCanvasLayerSelection,
    copySelectedCanvasLayers,
    deleteSelectedLayersOrBoard,
    duplicateSelectedLayers,
    exportInProgress,
    exportProgressLabel,
    exportProgressRatio,
    handleAddQrCode,
    handleCanvasContentPasteApply,
    handleCanvasContentTypeChange,
    handleCanvasContentValueChange,
    handleDownload,
    handleLayerAction,
    handleLayerChange,
    handleRedoCanvasWorkspace,
    handleSaveCanvasWorkspace,
    handleUndoCanvasWorkspace,
    pasteCanvasLayers,
    resetCanvasWorkspace,
    resolveWorkspaceExportTargetDimensions,
    selectAllActiveCanvasLayers,
    selectSingleLayer,
  };
}

export type CanvasWorkspaceActions = ReturnType<typeof useCanvasActions>;
