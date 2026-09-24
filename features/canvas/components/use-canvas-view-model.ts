"use client";

import { useEffect, useMemo, useRef } from "react";

import {
  cloneCanvasCardState,
  createDefaultCanvasCardState,
} from "@/features/canvas/model/card-state";
import {
  DEFAULT_DRAFTING_TEXT_LAYER,
  getCanvasQrLayerId,
  getQrCanvasLayers,
  isCanvasQrLayerId,
} from "@/features/canvas/model/layers/shared";
import { cloneCanvasLayer } from "@/features/canvas/model/layers/fallback";
import {
  createDefaultCanvasLayers,
  createCanvasQrLayer,
} from "@/features/canvas/model/layers/card-qr";
import {
  cloneCanvasQrState,
  createDefaultCanvasWorkspaceQrState,
  type CanvasWorkspaceDocumentV1,
} from "@/features/canvas/model/document";
import {
  applySceneCompositionPatch,
  cloneSceneCompositionByNodeId,
  createDefaultSceneCompositionByNodeId,
} from "@/features/canvas/model/apply-scene-template";
import { getCanvasSizeFromTemplate } from "@/features/canvas/model/size-templates";
import { sceneHasVideoExportContent } from "@/features/canvas/export/pipeline/clock";
import {
  buildCanvasWorkspaceDocumentFromState,
  mergeLiveQrStateByLayerId,
  resolveActiveQrLayerIdFromLayers,
} from "@/features/canvas/components/canvas-document";
import { clearCanvasQrMarkupCache } from "@/features/canvas/hooks/use-canvas-qr-markup";
import {
  buildToolbarSettingsSnapshots,
  pickToolbarSettingsSnapshots,
} from "@/features/canvas/components/chrome-settings-snapshots";
import { DEFAULT_DRAFTING_STUDIO_STATE } from "@/features/canvas/components/canvas.constants";
import { type CanvasBoardToolbarVariant } from "@/features/canvas/components/Canvas";
import type {
  MotionSettings,
  ToolbarController,
  ToolbarToolId,
} from "@/features/shell/model/toolbar-types";
import { DEFAULT_DESKTOP_EXPORT_SETTINGS } from "@/features/shell/model/toolbar-defaults";
import { type BrandIconCategory } from "@/features/qr/assets/brand-icons";
import { isRasterExportExtension } from "@/features/qr/export/raster-export";
import { DASHBOARD_QR_NODE_ID } from "@/features/qr/rendering/compose-scene";
import { type QraftyState, getAssetValue } from "@/features/qr/model/state";
import {
  buildStaticQrPayload,
  getDefaultStaticQrValues,
  getContentValuesForTypeChange,
  resolveContentValuesForType,
  validateStaticQrContent,
  type StaticQrContentValue,
  type StaticQrContentValues,
} from "@/features/qr/content/static-payload";
import {
  getPlatformDefaultValuesForIntent,
  isPlatformType,
} from "@/features/qr/content/platform-intents";
import { DEFAULT_QR_INPUT_TYPE, type QrInputType } from "@/features/qr/content/input-options";
import {
  findCanvasLayerById,
  parseValueSegmentsText,
  type CanvasDownloadTarget,
} from "@/features/canvas/components/canvas-operations";
import { useCanvasSurfaceReducer } from "@/features/canvas/components/canvas-reducer";
import {
  resolveActiveCanvasLayers,
  resolveActiveSceneComposition,
  resolveCanRemoveQrCode,
  resolveAppearanceSnapshot,
  resolveLayerTargets,
  resolveQrBackgroundVisible,
  resolveSelectedContentValues,
  resolveSelectedElementLayer,
  resolveSelectedTextLayer,
} from "@/features/canvas/components/canvas-resolvers";
import { useCanvasScanSafety } from "@/features/canvas/components/use-canvas-scan-safety";
import { buildToolbarController } from "@/features/canvas/components/chrome-controller";
import { useCanvasHistory } from "@/features/canvas/canvas/use-canvas-history";
import { useWorkspaceExport } from "@/features/canvas/canvas/use-workspace-export";
import { createQrControls } from "@/features/canvas/canvas/qr-controls";
import { useQrLogoActions } from "@/features/canvas/canvas/use-qr-logo-actions";
import { useLayerActions } from "@/features/canvas/canvas/use-layer-actions";
import { useSettingsActions } from "@/features/canvas/canvas/use-settings-actions";
import {
  useCanvasShortcuts,
  type CanvasShortcutHandlers,
} from "@/features/canvas/canvas/use-canvas-shortcuts";
type CanvasBrandIconCategoryFilter = BrandIconCategory | "all";

type CanvasWorkspaceController = ToolbarController;

type CanvasSurfaceViewModelInput = {
  initialActiveTool?: ToolbarToolId;
  boardToolbarVariant: CanvasBoardToolbarVariant;
};

export function useCanvasViewModel({
  initialActiveTool,
  boardToolbarVariant,
}: CanvasSurfaceViewModelInput) {
  const [
    {
      desktopRailTool,
      backgroundSettingsTab,
      composeSidebarPanel,
      selectedContentType,
      contentValuesByType,
      contentTypeByNodeId,
      contentTypeByLayerId,
      selectedQrMargin,
      selectedQrRadius,
      selectedRasterExportQualityPercent,
      selectedQrSize,
      selectedDotType,
      selectedDotsColorMode,
      selectedDotColor,
      selectedDotsGradient,
      selectedDotsPalette,
      selectedDotsPalettePreset,
      selectedModuleFillImageUrl,
      selectedModuleFillImageSourceMode,
      selectedModuleFillRemoteUrl,
      selectedDotMatrixAnimation,
      selectedQrFinderPatternOuterStyle,
      selectedCornerSquareColorMode,
      selectedCornerSquareColor,
      selectedCornerSquareGradient,
      selectedQrFinderPatternInnerStyle,
      selectedCornerDotColorMode,
      selectedCornerDotColor,
      selectedCornerDotGradient,
      selectedBackgroundColorMode,
      selectedBackgroundColor,
      selectedBackgroundTransparent,
      selectedBackgroundGradient,
      selectedBackgroundShapeId,
      selectedBackgroundShapeOptions,
      selectedBackgroundAssetSourceMode,
      selectedBackgroundRemoteUrl,
      selectedLogoColorMode,
      selectedLogoSourceMode,
      selectedLogoColor,
      selectedLogoGradient,
      selectedLogoPresetId,
      selectedLogoPresetValue,
      selectedLogoAssetSourceMode,
      selectedLogoRemoteUrl,
      selectedLogoUploadValue,
      selectedLogoSize,
      selectedLogoMargin,
      selectedHideBackgroundDots,
      selectedQrTypeNumber,
      selectedQrErrorCorrectionLevel,
      selectedBoostLevel,
      selectedQrMode,
      selectedValueSegmentsText,
      selectedAriaLabel,
      selectedModuleRoundSize,
      selectedModuleSize,
      selectedModuleLineWidth,
      selectedGradientLinkMode,
      selectedLogoOpacity,
      selectedLogoSizeMode,
      selectedLogoWidthPx,
      selectedLogoHeightPx,
      selectedLogoLockAspect,
      selectedLogoPositionMode,
      selectedLogoOffsetX,
      selectedLogoOffsetY,
      selectedLogoCrossOrigin,
      activeQrLayerId,
      activeQrNodeId,
      qrStateByLayerId,
      qrStateByNodeId,
      selectedCardState,
      cardStateByNodeId,
      sceneCompositionByNodeId,
      layerStateByNodeId,
      selectedLayerId,
      selectedLayerIds,
      desktopCanvasTool,
      selectedDownloadExtension,
      selectedDownloadTarget,
      exportDownloadError,
      selectedPhotoLongEdge,
      selectedExportMediaKind,
      selectedVideoDurationSeconds,
      selectedVideoFormat,
      selectedVideoFrameRate,
      selectedVideoLongEdge,
      isCanvasWorkspaceReady,
      logoUploadObjectUrl,
      moduleFillUploadObjectUrl,
    },
    ,
    {
      setDesktopRailTool,
      setBackgroundSettingsTab,
      setComposeSidebarPanel,
      setSelectedContentType,
      setContentValuesByType,
      setContentTypeByNodeId,
      setContentTypeByLayerId,
      setSelectedQrMargin,
      setSelectedQrRadius,
      setSelectedRasterExportQualityPercent,
      setSelectedQrSize,
      setSelectedDotType,
      setSelectedDotsColorMode,
      setSelectedDotColor,
      setSelectedDotsGradient,
      setSelectedDotsPalette,
      setSelectedDotsPalettePreset,
      setSelectedModuleFillImageUrl,
      setSelectedModuleFillImageSourceMode,
      setSelectedModuleFillRemoteUrl,
      setSelectedDotMatrixAnimation,
      setSelectedQrFinderPatternOuterStyle,
      setSelectedCornerSquareColorMode,
      setSelectedCornerSquareColor,
      setSelectedCornerSquareGradient,
      setSelectedQrFinderPatternInnerStyle,
      setSelectedCornerDotColorMode,
      setSelectedCornerDotColor,
      setSelectedCornerDotGradient,
      setSelectedBackgroundColorMode,
      setSelectedBackgroundColor,
      setSelectedBackgroundTransparent,
      setSelectedBackgroundGradient,
      setSelectedBackgroundShapeId,
      setSelectedBackgroundShapeOptions,
      setSelectedBackgroundAssetSourceMode,
      setSelectedBackgroundRemoteUrl,
      setSelectedLogoColorMode,
      setSelectedLogoSourceMode,
      setSelectedLogoColor,
      setSelectedLogoGradient,
      setSelectedLogoPresetId,
      setSelectedLogoPresetValue,
      setSelectedLogoAssetSourceMode,
      setSelectedLogoRemoteUrl,
      setSelectedLogoUploadValue,
      setSelectedLogoSize,
      setSelectedLogoMargin,
      setSelectedHideBackgroundDots,
      setSelectedQrTypeNumber,
      setSelectedQrErrorCorrectionLevel,
      setSelectedBoostLevel,
      setSelectedQrMode,
      setSelectedValueSegmentsText,
      setSelectedAriaLabel,
      setSelectedModuleRoundSize,
      setSelectedModuleSize,
      setSelectedModuleLineWidth,
      setSelectedGradientLinkMode,
      setSelectedLogoOpacity,
      setSelectedLogoSizeMode,
      setSelectedLogoWidthPx,
      setSelectedLogoHeightPx,
      setSelectedLogoLockAspect,
      setSelectedLogoPositionMode,
      setSelectedLogoOffsetX,
      setSelectedLogoOffsetY,
      setSelectedLogoCrossOrigin,
      setActiveQrLayerId,
      setActiveQrNodeId,
      setQrStateByLayerId,
      setQrStateByNodeId,
      setSelectedCardState,
      setCardStateByNodeId,
      setSceneCompositionByNodeId,
      setLayerStateByNodeId,
      setSelectedLayerId,
      setSelectedLayerIds,
      setDesktopCanvasTool,
      setSelectedDownloadExtension,
      setSelectedDownloadTarget,
      setExportDownloadError,
      setSelectedPhotoLongEdge,
      setSelectedExportMediaKind,
      setSelectedVideoDurationSeconds,
      setSelectedVideoFormat,
      setSelectedVideoFrameRate,
      setSelectedVideoLongEdge,
      setIsCanvasWorkspaceReady,
      setLogoUploadObjectUrl,
      setModuleFillUploadObjectUrl,
    },
  ] = useCanvasSurfaceReducer(initialActiveTool);
  const brandIconQueryRef = useRef("");
  const brandIconCategoryRef = useRef<CanvasBrandIconCategoryFilter>("all");
  const canvasRef = useRef<HTMLElement | null>(null);
  const canvasLayerClipboardRef = useRef<string>("");
  const logoUploadObjectUrlRef = useRef<string | null>(null);
  const moduleFillUploadObjectUrlRef = useRef<string | null>(null);
  const pendingQrPersistStateRef = useRef<QraftyState | null>(null);
  const selectedContentValues = resolveSelectedContentValues(
    contentValuesByType,
    selectedContentType,
  );
  const selectedContentValue = useMemo(
    () => buildStaticQrPayload(selectedContentType, selectedContentValues),
    [selectedContentType, selectedContentValues],
  );
  const selectedContentValidation = useMemo(
    () => validateStaticQrContent(selectedContentType, selectedContentValues),
    [selectedContentType, selectedContentValues],
  );
  const canvasQraftyState = useMemo<QraftyState>(
    () => ({
      ...DEFAULT_DRAFTING_STUDIO_STATE,
      data: selectedContentValue,
      type: DEFAULT_DRAFTING_STUDIO_STATE.type,
      width: selectedQrSize,
      height: selectedQrSize,
      margin: selectedQrMargin,
      rasterExportQualityPercent: selectedRasterExportQualityPercent,
      logo: {
        presetColor: selectedLogoColor,
        presetId: selectedLogoPresetId,
        source: selectedLogoSourceMode,
        value:
          selectedLogoSourceMode === "preset"
            ? selectedLogoPresetValue
            : selectedLogoSourceMode === "url"
              ? selectedLogoRemoteUrl
              : selectedLogoSourceMode === "upload"
                ? selectedLogoUploadValue
                : undefined,
      },
      backgroundImage: {
        presetColor: undefined,
        presetId: undefined,
        source: selectedBackgroundAssetSourceMode === "url" ? "url" : "none",
        value:
          selectedBackgroundAssetSourceMode === "url" ? selectedBackgroundRemoteUrl : undefined,
      },
      moduleFillImage: {
        presetColor: undefined,
        presetId: undefined,
        source:
          selectedDotsColorMode === "image"
            ? selectedModuleFillImageSourceMode === "url"
              ? "url"
              : "upload"
            : "none",
        value:
          selectedDotsColorMode === "image"
            ? selectedModuleFillImageSourceMode === "url"
              ? selectedModuleFillRemoteUrl
              : selectedModuleFillImageUrl
            : undefined,
      },
      backgroundShapeId: selectedBackgroundShapeId,
      backgroundShapeOptions: { ...selectedBackgroundShapeOptions },
      qrOptions: {
        ...DEFAULT_DRAFTING_STUDIO_STATE.qrOptions,
        typeNumber: selectedQrTypeNumber,
        errorCorrectionLevel: selectedQrErrorCorrectionLevel,
        boostLevel: selectedBoostLevel,
        mode: selectedQrMode,
      },
      imageOptions: {
        ...DEFAULT_DRAFTING_STUDIO_STATE.imageOptions,
        hideBackgroundDots: selectedHideBackgroundDots,
        imageSize: selectedLogoSize / 100,
        margin: selectedLogoMargin,
        crossOrigin: selectedLogoCrossOrigin,
        opacity: selectedLogoOpacity / 100,
        sizeMode: selectedLogoSizeMode,
        lockAspect: selectedLogoLockAspect,
        logoPositionMode: selectedLogoPositionMode,
        ...(selectedLogoWidthPx !== undefined ? { widthPx: selectedLogoWidthPx } : {}),
        ...(selectedLogoHeightPx !== undefined ? { heightPx: selectedLogoHeightPx } : {}),
        ...(selectedLogoPositionMode === "custom"
          ? { x: selectedLogoOffsetX, y: selectedLogoOffsetY }
          : {}),
      },
      dataModulesSettings: {
        ...DEFAULT_DRAFTING_STUDIO_STATE.dataModulesSettings,
        type: selectedDotType,
        color: selectedDotColor,
        roundSize: selectedModuleRoundSize,
        ...(selectedModuleSize !== undefined ? { moduleSize: selectedModuleSize } : {}),
        ...(selectedModuleLineWidth !== undefined ? { lineWidth: selectedModuleLineWidth } : {}),
      },
      ariaLabel: selectedAriaLabel || undefined,
      valueSegments: parseValueSegmentsText(selectedValueSegmentsText),
      gradientLinkMode: selectedGradientLinkMode,
      dotsColorMode: selectedDotsColorMode,
      dotsPalette: [...selectedDotsPalette],
      dotMatrixAnimation: { ...selectedDotMatrixAnimation },
      finderPatternOuterSettings: {
        type: selectedQrFinderPatternOuterStyle,
        color: selectedCornerSquareColor,
      },
      finderPatternInnerSettings: {
        type: selectedQrFinderPatternInnerStyle,
        color: selectedCornerDotColor,
      },
      backgroundOptions: {
        color: selectedBackgroundColor,
        round: selectedQrRadius,
        transparent: selectedBackgroundTransparent,
      },
      logoGradient: {
        ...structuredClone(selectedLogoGradient),
        enabled: selectedLogoColorMode === "gradient",
      },
      dataModulesGradient: {
        ...structuredClone(selectedDotsGradient),
        enabled: selectedDotsColorMode === "gradient",
      },
      finderPatternOuterGradient: {
        ...structuredClone(selectedCornerSquareGradient),
        enabled: selectedCornerSquareColorMode === "gradient",
      },
      finderPatternInnerGradient: {
        ...structuredClone(selectedCornerDotGradient),
        enabled: selectedCornerDotColorMode === "gradient",
      },
      backgroundGradient: {
        ...structuredClone(selectedBackgroundGradient),
        enabled: selectedBackgroundColorMode === "gradient",
      },
    }),
    [
      selectedBackgroundAssetSourceMode,
      selectedBackgroundColor,
      selectedBackgroundColorMode,
      selectedBackgroundGradient,
      selectedBackgroundShapeId,
      selectedBackgroundShapeOptions,
      selectedBackgroundTransparent,
      selectedBackgroundRemoteUrl,
      selectedQrRadius,
      selectedContentValue,
      selectedCornerDotColor,
      selectedCornerDotColorMode,
      selectedCornerDotGradient,
      selectedQrFinderPatternInnerStyle,
      selectedCornerSquareColor,
      selectedCornerSquareColorMode,
      selectedCornerSquareGradient,
      selectedQrFinderPatternOuterStyle,
      selectedDotColor,
      selectedDotMatrixAnimation,
      selectedDotsColorMode,
      selectedDotsGradient,
      selectedDotsPalette,
      selectedDotsPalettePreset,
      selectedModuleFillImageUrl,
      selectedModuleFillImageSourceMode,
      selectedModuleFillRemoteUrl,
      selectedDotType,
      selectedQrErrorCorrectionLevel,
      selectedBoostLevel,
      selectedQrMode,
      selectedValueSegmentsText,
      selectedAriaLabel,
      selectedModuleRoundSize,
      selectedModuleSize,
      selectedModuleLineWidth,
      selectedGradientLinkMode,
      selectedLogoOpacity,
      selectedLogoSizeMode,
      selectedLogoWidthPx,
      selectedLogoHeightPx,
      selectedLogoLockAspect,
      selectedLogoPositionMode,
      selectedLogoOffsetX,
      selectedLogoOffsetY,
      selectedLogoCrossOrigin,
      selectedHideBackgroundDots,
      selectedLogoColor,
      selectedLogoColorMode,
      selectedLogoGradient,
      selectedLogoMargin,
      selectedLogoPresetId,
      selectedLogoPresetValue,
      selectedLogoRemoteUrl,
      selectedLogoUploadValue,
      selectedLogoSize,
      selectedLogoSourceMode,
      selectedRasterExportQualityPercent,
      selectedQrMargin,
      selectedQrSize,
      selectedQrTypeNumber,
    ],
  );
  const shortcutHandlersRef = useRef<CanvasShortcutHandlers>({} as CanvasShortcutHandlers);
  const keyboardStateRef = useRef({
    activeQrLayerId,
    activeQrNodeId,
    canvasQraftyState,
    layerStateByNodeId,
    qrLayerCount: getQrCanvasLayers(
      layerStateByNodeId[activeQrNodeId] ??
        createDefaultCanvasLayers(activeQrNodeId, canvasQraftyState, selectedCardState),
    ).length,
    selectedCardState,
    selectedLayerIds,
  });
  const canDownload = selectedContentValidation.isValid && Boolean(canvasQraftyState.data.trim());
  const isCanvasRasterExport = isRasterExportExtension(selectedDownloadExtension);
  const selectedRasterPhotoLongEdge = isCanvasRasterExport ? selectedPhotoLongEdge : undefined;
  const activeSceneComposition = resolveActiveSceneComposition(
    sceneCompositionByNodeId,
    activeQrNodeId,
  );

  const qrNodeIds = useMemo(() => [DASHBOARD_QR_NODE_ID], []);
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
  const activeQrDownloadTarget = `qr:${activeQrLayerId}` as CanvasDownloadTarget;
  const shouldMeasureActiveQrExport =
    selectedDownloadTarget === "current" || selectedDownloadTarget === activeQrDownloadTarget;

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

  const qrControls = useMemo(
    () =>
      createQrControls({
        setSelectedAriaLabel,
        setSelectedBackgroundAssetSourceMode,
        setSelectedBackgroundColor,
        setSelectedBackgroundColorMode,
        setSelectedBackgroundGradient,
        setSelectedBackgroundRemoteUrl,
        setSelectedBackgroundShapeId,
        setSelectedBackgroundShapeOptions,
        setSelectedBackgroundTransparent,
        setSelectedBoostLevel,
        setSelectedCornerDotColor,
        setSelectedCornerDotColorMode,
        setSelectedCornerDotGradient,
        setSelectedCornerSquareColor,
        setSelectedCornerSquareColorMode,
        setSelectedCornerSquareGradient,
        setSelectedDotColor,
        setSelectedDotMatrixAnimation,
        setSelectedDotType,
        setSelectedDotsColorMode,
        setSelectedDotsGradient,
        setSelectedDotsPalette,
        setSelectedGradientLinkMode,
        setSelectedHideBackgroundDots,
        setSelectedLogoAssetSourceMode,
        setSelectedLogoColor,
        setSelectedLogoColorMode,
        setSelectedLogoCrossOrigin,
        setSelectedLogoGradient,
        setSelectedLogoHeightPx,
        setSelectedLogoLockAspect,
        setSelectedLogoMargin,
        setSelectedLogoOffsetX,
        setSelectedLogoOffsetY,
        setSelectedLogoOpacity,
        setSelectedLogoPositionMode,
        setSelectedLogoPresetId,
        setSelectedLogoPresetValue,
        setSelectedLogoRemoteUrl,
        setSelectedLogoSize,
        setSelectedLogoSizeMode,
        setSelectedLogoSourceMode,
        setSelectedLogoUploadValue,
        setSelectedLogoWidthPx,
        setSelectedModuleFillImageSourceMode,
        setSelectedModuleFillImageUrl,
        setSelectedModuleFillRemoteUrl,
        setSelectedModuleLineWidth,
        setSelectedModuleRoundSize,
        setSelectedModuleSize,
        setSelectedQrErrorCorrectionLevel,
        setSelectedQrFinderPatternInnerStyle,
        setSelectedQrFinderPatternOuterStyle,
        setSelectedQrMargin,
        setSelectedQrMode,
        setSelectedQrRadius,
        setSelectedQrSize,
        setSelectedQrTypeNumber,
        setSelectedRasterExportQualityPercent,
        setSelectedValueSegmentsText,
      }),
    [
      setSelectedAriaLabel,
      setSelectedBackgroundAssetSourceMode,
      setSelectedBackgroundColor,
      setSelectedBackgroundColorMode,
      setSelectedBackgroundGradient,
      setSelectedBackgroundRemoteUrl,
      setSelectedBackgroundShapeId,
      setSelectedBackgroundShapeOptions,
      setSelectedBackgroundTransparent,
      setSelectedBoostLevel,
      setSelectedCornerDotColor,
      setSelectedCornerDotColorMode,
      setSelectedCornerDotGradient,
      setSelectedCornerSquareColor,
      setSelectedCornerSquareColorMode,
      setSelectedCornerSquareGradient,
      setSelectedDotColor,
      setSelectedDotMatrixAnimation,
      setSelectedDotType,
      setSelectedDotsColorMode,
      setSelectedDotsGradient,
      setSelectedDotsPalette,
      setSelectedGradientLinkMode,
      setSelectedHideBackgroundDots,
      setSelectedLogoAssetSourceMode,
      setSelectedLogoColor,
      setSelectedLogoColorMode,
      setSelectedLogoCrossOrigin,
      setSelectedLogoGradient,
      setSelectedLogoHeightPx,
      setSelectedLogoLockAspect,
      setSelectedLogoMargin,
      setSelectedLogoOffsetX,
      setSelectedLogoOffsetY,
      setSelectedLogoOpacity,
      setSelectedLogoPositionMode,
      setSelectedLogoPresetId,
      setSelectedLogoPresetValue,
      setSelectedLogoRemoteUrl,
      setSelectedLogoSize,
      setSelectedLogoSizeMode,
      setSelectedLogoSourceMode,
      setSelectedLogoUploadValue,
      setSelectedLogoWidthPx,
      setSelectedModuleFillImageSourceMode,
      setSelectedModuleFillImageUrl,
      setSelectedModuleFillRemoteUrl,
      setSelectedModuleLineWidth,
      setSelectedModuleRoundSize,
      setSelectedModuleSize,
      setSelectedQrErrorCorrectionLevel,
      setSelectedQrFinderPatternInnerStyle,
      setSelectedQrFinderPatternOuterStyle,
      setSelectedQrMargin,
      setSelectedQrMode,
      setSelectedQrRadius,
      setSelectedQrSize,
      setSelectedQrTypeNumber,
      setSelectedRasterExportQualityPercent,
      setSelectedValueSegmentsText,
    ],
  );
  const logoActions = useQrLogoActions({
    commitState: commitActiveQraftyState,
    selectedLogoColor,
    selectedLogoColorMode,
    selectedLogoGradient,
    selectedLogoPresetId,
    setLogoAssetSourceMode: setSelectedLogoAssetSourceMode,
    state: canvasQraftyState,
  });

  function resolveLiveQrPersistState(): QraftyState {
    if (pendingQrPersistStateRef.current) {
      return pendingQrPersistStateRef.current;
    }

    const live = canvasQraftyState;
    const persisted = qrStateByLayerId[activeQrLayerId];
    if (!persisted) {
      return live;
    }

    const liveModuleFill = getAssetValue(live.moduleFillImage);
    const persistedModuleFill = getAssetValue(persisted.moduleFillImage);
    if (!persistedModuleFill) {
      return live;
    }

    const shouldPreferPersistedModuleFill =
      live.dotsColorMode === "image" && !liveModuleFill && Boolean(persistedModuleFill);

    if (!shouldPreferPersistedModuleFill) {
      return live;
    }

    return {
      ...live,
      dotsColorMode: "image",
      moduleFillImage: {
        ...live.moduleFillImage,
        ...persisted.moduleFillImage,
        source: persisted.moduleFillImage.source === "url" ? "url" : "upload",
        value: persistedModuleFill,
      },
    };
  }

  function commitActiveQraftyState(nextState: QraftyState) {
    const committed = resolveLiveQrPersistState();
    const merged: QraftyState = {
      ...committed,
      logo: nextState.logo,
      logoGradient: nextState.logoGradient,
      imageOptions: nextState.imageOptions,
    };

    qrControls.syncLogo(merged);
    qrControls.syncModuleFill(merged);
    persistActiveQrLayerState(merged);
    clearCanvasQrMarkupCache();
  }

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

  function persistActiveQrLayerState(nextState: QraftyState = resolveLiveQrPersistState()) {
    const cloned = cloneCanvasQrState(nextState);
    pendingQrPersistStateRef.current = cloned;
    setQrStateByLayerId((current) => ({
      ...current,
      [activeQrLayerId]: cloned,
    }));
    setContentTypeByLayerId((current) => ({
      ...current,
      [activeQrLayerId]: selectedContentType,
    }));
    setQrStateByNodeId({
      [DASHBOARD_QR_NODE_ID]: cloned,
    });
  }

  useEffect(() => {
    pendingQrPersistStateRef.current = null;
  });

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
    applyLayerSelection,
    clearCanvasLayerSelection,
    copySelectedCanvasLayers,
    deleteSelectedLayersOrBoard,
    duplicateSelectedLayers,
    getActiveSelectableLayers,
    getSelectedActiveLayers,
    handleAddFrameCardLayer,
    handleAddTextLayer,
    handleAddTextLayerAt,
    handleInsertLayer,
    handleLayerAction,
    handleLayerChange,
    handleLayerReorder,
    handleLayerSelect,
    handleLayerSelectionChange,
    handleBoardQrClick,
    handleBoardSelection,
    handleRemoveQrCode,
    pasteCanvasLayers,
    selectAllActiveCanvasLayers,
    selectSingleLayer,
  } = useLayerActions({
    activateQrLayer,
    activeQrLayerId,
    activeQrNodeId,
    cardStateByNodeId,
    contentTypeByLayerId,
    canvasLayerClipboardRef,
    canvasQraftyState,
    canvasRef,
    keyboardStateRef,
    layerStateByNodeId,
    persistActiveQrLayerState,
    qrControls,
    qrStateByLayerId,
    qrStateByNodeId,
    selectedCardState,
    selectedContentType,
    selectedLayerIds,
    setActiveQrLayerId,
    setActiveQrNodeId,
    setCardStateByNodeId,
    setContentTypeByLayerId,
    setDesktopRailTool,
    setLayerStateByNodeId,
    setQrStateByLayerId,
    setQrStateByNodeId,
    setSelectedCardState,
    setSelectedContentType,
    setSelectedLayerId,
    setSelectedLayerIds,
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

  useEffect(() => {
    if (!logoUploadObjectUrl) {
      return;
    }

    return () => {
      URL.revokeObjectURL(logoUploadObjectUrl);
    };
  }, [logoUploadObjectUrl]);

  useEffect(() => {
    if (!moduleFillUploadObjectUrl) {
      return;
    }

    return () => {
      URL.revokeObjectURL(moduleFillUploadObjectUrl);
    };
  }, [moduleFillUploadObjectUrl]);

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

  const desktopActiveTool = desktopRailTool;
  const { appearanceTargetLayer, propertiesTransformLayer, transformTargetLayer } =
    resolveLayerTargets(activeCanvasLayers, selectedLayerIds, selectedTransformLayer);
  const qrBackgroundVisible = resolveQrBackgroundVisible(canvasQraftyState);
  const desktopAppearanceSnapshot = resolveAppearanceSnapshot(
    appearanceTargetLayer,
    selectedCardState,
    canvasQraftyState,
    qrBackgroundVisible,
  );

  const {
    handleDesktopAppearancePatch,
    resetDesktopContent,
    applyDesktopPatternPatchToControls,
    applyDesktopCornersPatchToControls,
    applyDesktopUnifiedLogoPatchToControls,
    updateDesktopPatternSettings,
    updateDesktopUnifiedQrFillSettings,
    resetDesktopPatternSettings,
    updateDesktopLogoSettings,
    resetDesktopLogoSettings,
    updateDesktopCornersSettings,
    mergeCardStateFromShapePatch,
    cardShadowFromPatch,
    relayoutCardInset,
    updateDesktopShapeSettings,
    updateDesktopImageSettings,
    resetDesktopShapeSettings,
    updateDesktopMotionSettings,
    updateDesktopEncodingSettings,
    updateDesktopAccessibilitySettings,
    updateDesktopTextSettings,
    updateDesktopLayersSettings,
    updateDesktopExportSettings,
  } = useSettingsActions({
    activeCanvasLayers,
    activeQrNodeId,
    appearanceTargetLayer,
    commitActiveQraftyState,
    canvasQraftyState,
    handleLayerChange,
    handleLayerSelect,
    layerStateByNodeId,
    logoActions,
    logoUploadObjectUrlRef,
    persistActiveQrLayerState,
    qrBackgroundVisible,
    qrControls,
    resolveLiveQrPersistState,
    selectedCardState,
    selectedLayerId,
    selectedLogoRemoteUrl,
    selectedModuleFillImageSourceMode,
    selectedModuleFillImageUrl,
    selectedTextLayer,
    selectSingleLayer,
    setContentValuesByType,
    setLayerStateByNodeId,
    setLogoUploadObjectUrl,
    setSelectedAriaLabel,
    setSelectedBackgroundColor,
    setSelectedBackgroundColorMode,
    setSelectedBackgroundGradient,
    setSelectedBackgroundShapeId,
    setSelectedBackgroundShapeOptions,
    setSelectedBackgroundTransparent,
    setSelectedBoostLevel,
    setSelectedCardState,
    setSelectedContentType,
    setSelectedCornerDotColor,
    setSelectedCornerDotColorMode,
    setSelectedCornerDotGradient,
    setSelectedCornerSquareColor,
    setSelectedCornerSquareColorMode,
    setSelectedCornerSquareGradient,
    setSelectedDotColor,
    setSelectedDotMatrixAnimation,
    setSelectedDotType,
    setSelectedDotsColorMode,
    setSelectedDotsGradient,
    setSelectedDotsPalette,
    setSelectedDotsPalettePreset,
    setSelectedDownloadExtension,
    setSelectedDownloadTarget,
    setSelectedExportMediaKind,
    setSelectedGradientLinkMode,
    setSelectedLogoColor,
    setSelectedLogoColorMode,
    setSelectedLogoGradient,
    setSelectedLogoSourceMode,
    setSelectedModuleFillImageSourceMode,
    setSelectedModuleFillImageUrl,
    setSelectedModuleFillRemoteUrl,
    setSelectedModuleLineWidth,
    setSelectedModuleRoundSize,
    setSelectedModuleSize,
    setSelectedPhotoLongEdge,
    setSelectedQrErrorCorrectionLevel,
    setSelectedQrFinderPatternInnerStyle,
    setSelectedQrFinderPatternOuterStyle,
    setSelectedQrSize,
    setSelectedQrTypeNumber,
    setSelectedValueSegmentsText,
    setSelectedVideoDurationSeconds,
    setSelectedVideoFormat,
    setSelectedVideoFrameRate,
    setSelectedVideoLongEdge,
  });

  const {
    desktopPatternSettings,
    desktopLogoSettings,
    desktopCornersSettings,
    desktopShapeSettings,
    desktopEncodingSettings,
    desktopAccessibilitySettings,
    desktopImageSettings,
    desktopBackgroundSettings,
    desktopEffectsSettings,
    desktopLayersSettings,
    desktopExportSettings,
    desktopSceneTemplateSettings,
    desktopLayoutSettings,
    desktopTextSettings,
  } = pickToolbarSettingsSnapshots(
    buildToolbarSettingsSnapshots({
      activeQrNodeId,
      activeCanvasLayers,
      activeCanvasLayerRows,
      activeSceneComposition,
      canvasQraftyState,
      selectedAriaLabel,
      selectedBackgroundColor,
      selectedBackgroundColorMode,
      selectedBackgroundGradient,
      selectedBackgroundShapeId,
      selectedBackgroundShapeOptions,
      selectedBoostLevel,
      selectedCardState,
      selectedCornerDotColor,
      selectedCornerDotColorMode,
      selectedCornerDotGradient,
      selectedCornerSquareColor,
      selectedCornerSquareColorMode,
      selectedCornerSquareGradient,
      selectedDotColor,
      selectedDotType,
      selectedDotsColorMode,
      selectedDotsGradient,
      selectedDotsPalette,
      selectedDotsPalettePreset,
      selectedModuleFillImageUrl,
      selectedModuleFillImageSourceMode,
      selectedModuleFillRemoteUrl,
      selectedDownloadExtension,
      selectedDownloadTarget,
      selectedExportMediaKind,
      selectedVideoDurationSeconds,
      selectedVideoFormat,
      selectedVideoFrameRate,
      selectedVideoLongEdge,
      selectedGradientLinkMode,
      selectedHideBackgroundDots,
      selectedLayerId,
      selectedLogoAssetSourceMode,
      selectedLogoColor,
      selectedLogoColorMode,
      selectedLogoCrossOrigin,
      selectedLogoGradient,
      selectedLogoHeightPx,
      selectedLogoLockAspect,
      selectedLogoMargin,
      selectedLogoOffsetX,
      selectedLogoOffsetY,
      selectedLogoOpacity,
      selectedLogoPositionMode,
      selectedLogoPresetId: selectedLogoPresetId ?? null,
      selectedLogoRemoteUrl,
      selectedLogoSize,
      selectedLogoSizeMode,
      selectedLogoSourceMode,
      selectedLogoWidthPx,
      selectedModuleLineWidth,
      selectedModuleRoundSize,
      selectedModuleSize,
      selectedQrErrorCorrectionLevel,
      selectedQrFinderPatternInnerStyle,
      selectedQrFinderPatternOuterStyle,
      selectedQrTypeNumber,
      selectedPhotoLongEdge,
      selectedTextLayer,
      selectedValueSegmentsText,
    }),
  );

  const scanSafetyResult = useCanvasScanSafety({
    activeCanvasLayers,
    activeQrLayerId,
    activeQrNodeId,
    canvasQraftyState,
    qrCanvasLayers,
    qrStateByLayerId,
    resolveTargetDimensions: resolveWorkspaceExportTargetDimensions,
    selectedCardState,
    selectedContentIsValid: selectedContentValidation.isValid,
    selectedDownloadExtension,
    selectedDownloadTarget,
  });

  const canRemoveQrCode = resolveCanRemoveQrCode(
    boardToolbarVariant,
    qrCanvasLayers,
    selectedLayerId,
  );

  const desktopController: CanvasWorkspaceController = buildToolbarController({
    core: {
      activeTool: desktopActiveTool,
      appearanceSnapshot: desktopAppearanceSnapshot,
      canRedo: canRedoCanvasWorkspace,
      canUndo: canUndoCanvasWorkspace,
      composeSidebarPanel,
      contentValidation: selectedContentValidation,
      contentValues: selectedContentValues,
      contentType: selectedContentType,
      encodedContentValue: selectedContentValue,
      insertNodeId: activeQrNodeId,
      onActiveToolChange: (toolId) => {
        setComposeSidebarPanel(null);
        setDesktopCanvasTool("select");
        setDesktopRailTool(toolId);
      },
      onContentPasteApply: handleCanvasContentPasteApply,
      onContentReset: resetDesktopContent,
      onContentTypeChange: handleCanvasContentTypeChange,
      onContentValueChange: handleCanvasContentValueChange,
      onRedo: handleRedoCanvasWorkspace,
      onResetDefaults: resetCanvasWorkspace,
      onSave: handleSaveCanvasWorkspace,
      onUndo: handleUndoCanvasWorkspace,
      scanSafetyResult,
      selectedAppearanceLayer: appearanceTargetLayer,
      selectedElementLayer,
      selectedLayerIds,
      selectedTransformLayer: propertiesTransformLayer,
    },
    qrSettings: {
      accessibilitySettings: desktopAccessibilitySettings,
      backgroundSettingsTab,
      backgroundSettings: desktopBackgroundSettings,
      cornersSettings: desktopCornersSettings,
      effectsSettings: desktopEffectsSettings,
      encodingSettings: desktopEncodingSettings,
      imageSettings: desktopImageSettings,
      logoSettings: desktopLogoSettings,
      motionSettings: selectedDotMatrixAnimation as MotionSettings,
      onAccessibilityReset: () => setSelectedAriaLabel(""),
      onAccessibilitySettingsChange: updateDesktopAccessibilitySettings,
      onBackgroundSettingsTabChange: setBackgroundSettingsTab,
      onBackgroundReset: () =>
        setSelectedCardState((current) => ({
          ...current,
          paperShader: createDefaultCanvasCardState().paperShader,
          styleMode: "paper-shader",
        })),
      onBackgroundSettingsChange: (settings) =>
        setSelectedCardState((current) => ({
          ...current,
          paperShader: settings.paperShader ?? current.paperShader,
          styleMode:
            settings.styleMode ??
            (settings.paperShader !== undefined ? "paper-shader" : current.styleMode),
        })),
      onCornersReset: () => qrControls.applyQrState(createDefaultCanvasWorkspaceQrState()),
      onCornersSettingsChange: updateDesktopCornersSettings,
      onEffectsReset: resetDesktopShapeSettings,
      onEffectsSettingsChange: (patch) =>
        setSelectedCardState((current) => ({
          ...current,
          imageFilter: {
            ...current.imageFilter,
            presetName: patch.filterPresetName ?? current.imageFilter.presetName,
            shaderId: patch.filterId ?? current.imageFilter.shaderId,
          },
          styleMode: patch.filterId ? "image-filter" : current.styleMode,
        })),
      onEncodingReset: () => {
        setSelectedQrTypeNumber(DEFAULT_DRAFTING_STUDIO_STATE.qrOptions.typeNumber);
        setSelectedQrErrorCorrectionLevel(
          DEFAULT_DRAFTING_STUDIO_STATE.qrOptions.errorCorrectionLevel,
        );
        setSelectedBoostLevel(DEFAULT_DRAFTING_STUDIO_STATE.qrOptions.boostLevel);
        setSelectedQrMode(DEFAULT_DRAFTING_STUDIO_STATE.qrOptions.mode);
        setSelectedValueSegmentsText("");
      },
      onEncodingSettingsChange: updateDesktopEncodingSettings,
      onImageReset: resetDesktopShapeSettings,
      onImageSettingsChange: updateDesktopImageSettings,
      onLogoReset: resetDesktopLogoSettings,
      onLogoSettingsChange: updateDesktopLogoSettings,
      onMotionReset: () =>
        setSelectedDotMatrixAnimation({ ...DEFAULT_DRAFTING_STUDIO_STATE.dotMatrixAnimation }),
      onMotionSettingsChange: updateDesktopMotionSettings,
      onPatternReset: resetDesktopPatternSettings,
      onPatternSettingsChange: updateDesktopPatternSettings,
      onShapeReset: resetDesktopShapeSettings,
      onShapeSettingsChange: updateDesktopShapeSettings,
      onTextReset: () => updateDesktopTextSettings({ ...DEFAULT_DRAFTING_TEXT_LAYER }),
      onTextSettingsChange: updateDesktopTextSettings,
      onUnifiedQrFillSettingsChange: updateDesktopUnifiedQrFillSettings,
      patternSettings: desktopPatternSettings,
      shapeSettings: desktopShapeSettings,
      textSettings: desktopTextSettings,
    },
    scene: {
      activeQrNodeId,
      activeSceneComposition,
      layoutSettings: desktopLayoutSettings,
      onBackgroundTabChange: (tab) => {
        setSelectedCardState((current) => {
          if (tab === "shader") {
            return { ...current, styleMode: "paper-shader" };
          }

          if (tab === "image") {
            return {
              ...current,
              styleMode: current.cardImage.value ? "image" : current.styleMode,
            };
          }

          return {
            ...current,
            styleMode: "solid",
          };
        });
      },
      onCloseComposeSidebar: () => {
        setComposeSidebarPanel(null);
      },
      onLayoutPresetSelect: (preset) => {
        setSceneCompositionByNodeId((current) =>
          applySceneCompositionPatch(current, activeQrNodeId, { layout: preset }),
        );
      },
      onLayoutSettingsChange: (patch) => {
        setSceneCompositionByNodeId((current) =>
          applySceneCompositionPatch(current, activeQrNodeId, {
            layout: { ...activeSceneComposition.layout, ...patch },
          }),
        );
      },
      onOpenComposeSidebar: (panel) => {
        setComposeSidebarPanel(panel);
        selectSingleLayer(null);
      },
      onSceneTemplateSizeChange: (patch) => {
        updateDesktopShapeSettings({
          cardHeight: patch.cardHeight,
          cardWidth: patch.cardWidth,
          lockAspectRatio: patch.lockAspectRatio,
          sizeMode: patch.sizeMode,
          sizePresetId: patch.sizePresetId,
        });
      },
      onSceneTemplateSizeTemplateSelect: (template) => {
        const canvasSize = getCanvasSizeFromTemplate(template);
        updateDesktopShapeSettings({
          cardHeight: canvasSize.height,
          cardWidth: canvasSize.width,
          lockAspectRatio: true,
          sizeMode: "fixed",
          sizePresetId: template.id,
        });
      },
      onSelectWallpaper: (imagePath) => {
        updateDesktopImageSettings({ remoteUrl: imagePath, sourceMode: "url" });
        setComposeSidebarPanel(null);
      },
      sceneTemplateSettings: desktopSceneTemplateSettings,
    },
    canvas: {
      canRemoveQrCode,
      canvasTool: boardToolbarVariant === "zoom" ? desktopCanvasTool : null,
      onAddQrCode: () => {
        void handleAddQrCode();
      },
      onAddTextLayerAt: handleAddTextLayerAt,
      onCanvasToolChange: boardToolbarVariant === "zoom" ? setDesktopCanvasTool : () => undefined,
      onInsertLayer: handleInsertLayer,
      onRemoveQrCode:
        canRemoveQrCode && selectedLayerId ? () => handleRemoveQrCode(selectedLayerId) : undefined,
      qrLayerCount: qrCanvasLayers.length,
    },
    element: {
      activeQrNodeId,
      onAppearancePatch: handleDesktopAppearancePatch,
      onLayerChange: handleLayerChange,
      propertiesTransformLayer,
      selectedElementLayer,
      selectedTransformLayer,
    },
    export: {
      canExportDownload: canDownload,
      canExportVideo,
      exportDownloadError,
      exportInProgress,
      exportProgressLabel,
      exportProgressRatio,
      exportSettings: desktopExportSettings,
      onExportCancel: () => {
        cancelWorkspaceExport();
      },
      onExportDownload: () => {
        void handleDownload();
      },
      onExportReset: () => {
        setExportDownloadError(null);
        setSelectedDownloadExtension("png");
        setSelectedDownloadTarget("surface");
        setSelectedPhotoLongEdge(DEFAULT_DESKTOP_EXPORT_SETTINGS.photoLongEdge);
        setSelectedExportMediaKind(DEFAULT_DESKTOP_EXPORT_SETTINGS.mediaKind);
        setSelectedVideoDurationSeconds(DEFAULT_DESKTOP_EXPORT_SETTINGS.videoDurationSeconds);
        setSelectedVideoFormat(DEFAULT_DESKTOP_EXPORT_SETTINGS.videoFormat);
        setSelectedVideoFrameRate(DEFAULT_DESKTOP_EXPORT_SETTINGS.videoFrameRate);
        setSelectedVideoLongEdge(DEFAULT_DESKTOP_EXPORT_SETTINGS.videoLongEdge);
      },
      onExportSettingsChange: updateDesktopExportSettings,
    },
    layers: {
      activeCanvasLayers,
      activeQrNodeId,
      layersSettings: desktopLayersSettings,
      onLayerAction: handleLayerAction,
      onLayerCopy: () => {
        void copySelectedCanvasLayers(selectedLayerIds);
      },
      onLayersReset: () =>
        setLayerStateByNodeId((current) => ({
          ...current,
          [activeQrNodeId]: createDefaultCanvasLayers(
            activeQrNodeId,
            canvasQraftyState,
            selectedCardState,
          ),
        })),
      onLayersReorder: handleLayerReorder,
      onLayersSettingsChange: updateDesktopLayersSettings,
      selectedLayerIds,
    },
  });

  return {
    activeQrNodeId,
    desktopCanvasTool,
    desktopController,
    canvasRef,
    isCanvasWorkspaceReady,
    boards,
    selectedBackgroundShapeId,
    selectedContentType,
    selectedContentValue,
    selectedLayerId,
    selectedLayerIds,
    selectedLogoColorMode,
    selectedLogoPresetId,
    selectedLogoPresetValue,
    selectedLogoSourceMode,
    selectedQrErrorCorrectionLevel,
    selectedQrMargin,
    selectedQrRadius,
    selectedQrSize,
    selectedQrTypeNumber,
    copySelectedCanvasLayers,
    handleAddTextLayerAt,
    handleLayerAction,
    handleLayerChange,
    handleLayerSelect,
    handleLayerSelectionChange,
    handleBoardQrClick,
    handleBoardSelection,
    pasteCanvasLayers,
    setDesktopCanvasTool,
  };
}
