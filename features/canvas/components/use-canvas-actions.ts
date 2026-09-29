import { useEffect, useMemo, useRef, type MutableRefObject } from "react";

import {
  cloneCanvasCardState,
  createDefaultCanvasCardState,
} from "@/features/canvas/model/card-state";
import { getCanvasQrLayerId, isCanvasQrLayerId } from "@/features/canvas/model/layers/shared";
import { cloneCanvasLayer } from "@/features/canvas/model/layers/fallback";
import { createCanvasQrLayer } from "@/features/canvas/model/layers/card-qr";
import {
  createDefaultCanvasWorkspaceQrState,
  type CanvasWorkspaceDocument,
} from "@/features/canvas/model/document";
import {
  buildCanvasWorkspaceDocument,
  resolveActiveQrLayerIdFromLayers,
} from "@/features/canvas/components/canvas-document";
import { findCanvasLayerById } from "@/features/canvas/components/canvas-operations";
import type {
  CanvasSurfaceSetters,
  CanvasSurfaceState,
} from "@/features/canvas/components/canvas-reducer";
import type { CanvasBoards } from "@/features/canvas/components/use-canvas-boards";
import { useCanvasHistory } from "@/features/canvas/canvas/use-canvas-history";
import { useWorkspaceExport } from "@/features/canvas/canvas/use-workspace-export";
import { useQrLogoActions } from "@/features/canvas/canvas/use-qr-logo-actions";
import { useLayerActions } from "@/features/canvas/canvas/use-layer-actions";
import type { ActiveQrApi } from "@/features/canvas/components/use-active-qr";
import { useSettingsActions } from "@/features/canvas/canvas/use-settings-actions";
import {
  useCanvasShortcuts,
  type CanvasShortcutHandlers,
} from "@/features/canvas/canvas/use-canvas-shortcuts";
import { isRasterExportExtension } from "@/features/qr/export/raster-export";
import { DASHBOARD_QR_NODE_ID } from "@/features/qr/rendering/compose-scene";
import {
  getContentValuesForTypeChange,
  getDefaultStaticQrValues,
  resolveContentValuesForType,
  type StaticQrContentValue,
  type StaticQrContentValues,
} from "@/features/qr/content/static-payload";
import { isPlatformType } from "@/features/qr/content/platform-intents";
import { DEFAULT_QR_INPUT_TYPE, type QrInputType } from "@/features/qr/content/input-options";

/**
 * Workspace actions: history, export, logo/layer/settings action hooks, and
 * keyboard shortcuts, plus the document round-trip (build/apply) they share.
 * The document apply and layer activation live here because they need
 * `selectSingleLayer`, which `useLayerActions` produces — keeping them in the
 * same hook preserves the original call graph without ref indirection.
 */
export function useCanvasActions({
  activeQr,
  boards,
  canvasRef,
  setters,
  state,
}: {
  activeQr: ActiveQrApi;
  boards: CanvasBoards;
  canvasRef: MutableRefObject<HTMLElement | null>;
  setters: CanvasSurfaceSetters;
  state: CanvasSurfaceState;
}) {
  const {
    activeQrLayerId,
    cardState,
    canvasLayers,
    contentTypeByLayerId,
    contentValuesByType,
    qrStateByLayerId,
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
    setCardState,
    setCanvasLayers,
    setContentTypeByLayerId,
    setContentValuesByType,
    setExportDownloadError,
    setQrStateByLayerId,
    setSelectedContentType,
  } = setters;
  const {
    canvasQraftyState,
    commitActiveQraftyState,
    persistActiveQrLayerState,
    resolveLiveQrPersistState,
    selectedContentValidation,
    setActiveQrState,
  } = activeQr;
  const {
    activeCanvasLayers,
    appearanceTargetLayer,
    qrBackgroundVisible,
    qrBoardNamesById,
    qrCanvasLayers,
  } = boards;

  const canvasLayerClipboardRef = useRef<string>("");
  const logoUploadObjectUrlRef = useRef<string | null>(null);
  const shortcutHandlersRef = useRef<CanvasShortcutHandlers>({} as CanvasShortcutHandlers);
  const keyboardStateRef = useRef({
    activeQrLayerId,
    canvasLayers,
    qrLayerCount: qrCanvasLayers.length,
    selectedLayerIds,
  });

  const canDownload = selectedContentValidation.isValid && Boolean(canvasQraftyState.data.trim());
  const isCanvasRasterExport = isRasterExportExtension(selectedDownloadExtension);
  const selectedRasterPhotoLongEdge = isCanvasRasterExport ? selectedPhotoLongEdge : undefined;

  const canvasWorkspaceDocument = useMemo(
    () => buildCanvasWorkspaceDocumentSnapshot(),
    // buildCanvasWorkspaceDocumentSnapshot reads exactly the state listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      activeQrLayerId,
      cardState,
      canvasLayers,
      contentTypeByLayerId,
      contentValuesByType,
      canvasQraftyState,
      qrStateByLayerId,
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
    shouldReplaceCurrentEntryRef: shouldReplaceCurrentCanvasHistoryEntryRef,
    undo: handleUndoCanvasWorkspace,
  } = useCanvasHistory({
    applyDocumentRef,
    document: canvasWorkspaceDocument,
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
    canDownload,
    cardState: selectedCardState,
    canvasLayers,
    downloadExtension: selectedDownloadExtension,
    downloadTarget: selectedDownloadTarget,
    exportMediaKind: selectedExportMediaKind,
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
    setContentTypeByLayerId((current) => ({
      ...current,
      [activeQrLayerId]: type,
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
        [selectedContentType]: resolveContentValuesForType(selectedContentType, { intent: value }),
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
    setContentTypeByLayerId((current) => ({
      ...current,
      [activeQrLayerId]: type,
    }));
    setContentValuesByType((current) => ({
      ...current,
      [type]: values,
    }));
  }

  function buildCanvasWorkspaceDocumentSnapshot(): CanvasWorkspaceDocument {
    return buildCanvasWorkspaceDocument({
      activeQrLayerId,
      cardState: selectedCardState,
      contentTypeByLayerId,
      contentValuesByType,
      canvasQraftyState,
      layers: canvasLayers,
      qrStateByLayerId,
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

    setActiveQrState(nextState, { layerId, contentType: nextContentType });
    selectSingleLayer(layerId);
  }

  function applyCanvasWorkspaceDocumentToControls(nextDocument: CanvasWorkspaceDocument) {
    const layers = nextDocument.layers.map(cloneCanvasLayer);
    const fallbackActiveLayerId = nextDocument.qrStateByLayerId[nextDocument.activeQrLayerId]
      ? nextDocument.activeQrLayerId
      : getCanvasQrLayerId(DASHBOARD_QR_NODE_ID);
    const activeLayerId = resolveActiveQrLayerIdFromLayers(
      fallbackActiveLayerId,
      layers,
      nextDocument.activeQrLayerId,
    );
    const activeState =
      nextDocument.qrStateByLayerId[activeLayerId] ??
      nextDocument.qrStateByLayerId[fallbackActiveLayerId] ??
      createDefaultCanvasWorkspaceQrState();
    const activeCardState = nextDocument.cardState ?? createDefaultCanvasCardState();

    setQrStateByLayerId(structuredClone(nextDocument.qrStateByLayerId));
    setCardState(cloneCanvasCardState(activeCardState));
    setCanvasLayers(layers);
    setContentTypeByLayerId(structuredClone(nextDocument.contentTypeByLayerId));
    setContentValuesByType(structuredClone(nextDocument.contentValuesByType));
    setActiveQrState(activeState, {
      layerId: activeLayerId,
      contentType: nextDocument.selectedContentType,
    });
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
    setActiveQrState,
  });

  async function handleAddQrCode() {
    if (qrCanvasLayers.length >= 10) return;

    persistActiveQrLayerState();

    const freshState = createDefaultCanvasWorkspaceQrState();
    const maxZIndex = canvasLayers.reduce((max, layer) => Math.max(max, layer.zIndex), -1);
    const nearLayer =
      findCanvasLayerById(canvasLayers, activeQrLayerId) ?? qrCanvasLayers.at(-1) ?? undefined;
    const nextLayer = createCanvasQrLayer(DASHBOARD_QR_NODE_ID, freshState, selectedCardState, {
      nearLayer,
      zIndex: maxZIndex + 1,
    });

    setCanvasLayers([...canvasLayers.map(cloneCanvasLayer), nextLayer]);

    setActiveQrState(freshState, {
      layerId: nextLayer.id,
      contentType: DEFAULT_QR_INPUT_TYPE,
    });
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
    resolveLiveQrPersistState,
  });

  useEffect(() => {
    keyboardStateRef.current = {
      activeQrLayerId,
      canvasLayers,
      qrLayerCount: qrCanvasLayers.length,
      selectedLayerIds,
    };
  }, [activeQrLayerId, canvasLayers, qrCanvasLayers.length, selectedLayerIds]);

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
    handleUndoCanvasWorkspace,
    pasteCanvasLayers,
    resolveWorkspaceExportTargetDimensions,
    selectAllActiveCanvasLayers,
    selectSingleLayer,
  };
}

export type CanvasWorkspaceActions = ReturnType<typeof useCanvasActions>;
