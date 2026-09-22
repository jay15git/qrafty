"use client"

import { type ReactNode, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"

import type {
  QrErrorCorrectionLevel,
  QrFinderPatternOuterStyle,
  QrMode,
  QrTypeNumber,
} from "@/features/qr-code/model/types"
import type { QraftyCornerDotStyle } from "@/features/qr-code/model/state"

import {
  cloneDraftingCardState,
  createDefaultDraftingCardState,
  normalizeDraftingCardState,
  type DraftingCardState,
} from "@/features/workspace/model/card-state"
import { createUniformCornerRadii } from "@/features/workspace/model/corner-radius"
import {
  cloneDraftingCanvasLayer,
  createDraftingTextLayer,
  createDraftingImageLayer,
  createDefaultDraftingLayers,
  createDraftingQrLayer,
  DEFAULT_DRAFTING_TEXT_LAYER,
  fitQrSizeInCard,
  getDraftingCardLayerId,
  getDraftingQrLayerId,
  getQrCanvasLayers,
  isDraftingQrLayerId,
  isLayerDeletable,
  layoutDraftingCardInsetLayers,
  patchDraftingCanvasLayer,
  type DraftingCanvasLayer,
  type DraftingLayerStateByNodeId,
} from "@/features/workspace/model/layers"
import {
  cloneDraftingQrState,
  cloneDraftingWorkspaceDocument,
  createDefaultDraftingWorkspaceDocument,
  createDefaultDraftingWorkspaceQrState,
  type DraftingCardStateByNodeId,
  type DraftingContentValuesByType,
  type DraftingQrStateByNodeId,
  type DraftingWorkspaceDocumentV1,
} from "@/features/workspace/model/document"
import {
  applySceneCompositionPatch,
  cloneSceneCompositionByNodeId,
  createDefaultSceneCompositionByNodeId,
  type SceneCompositionByNodeId,
} from "@/features/workspace/model/apply-scene-template"
import {
  createDefaultSceneComposition,
  normalizeSceneComposition,
} from "@/features/workspace/model/scene-templates"
import { getCanvasSizeFromTemplate } from "@/features/workspace/model/size-templates"
import { sceneHasVideoExportContent } from "@/features/workspace/export/pipeline/clock"
import {
  buildDraftingWorkspaceDocumentFromState,
  mergeLiveQrStateByLayerId,
  resolveActiveQrLayerIdFromLayers,
} from "@/features/workspace/components/workspace-surface-document"
import {
  applyCornersSettingsPatchToQraftyState,
  applyLogoSettingsPatchToQraftyState,
  applyPatternSettingsPatchToQraftyState,
} from "@/features/workspace/components/workspace-qr-settings-patch"
import { clearDraftingQrMarkupCache } from "@/features/workspace/hooks/use-drafting-qr-markup"
import { clearQrEncodeMarkupCache } from "@/features/qr-code/rendering/qr-encode-cache"
import {
  buildDesktopToolbarSettingsSnapshots,
  pickDesktopToolbarSettingsSnapshots,
} from "@/features/workspace/components/workspace-desktop-settings-snapshots"
import {
  DEFAULT_DRAFTING_PANE_QR_SIZE,
  DEFAULT_DRAFTING_STUDIO_STATE,
  replaceTrackedObjectUrl,
  type DraftingDownloadExtension,
} from "@/features/workspace/components/workspace-surface.constants"
import {
  Canvas,
  type DraftingPaneToolbarVariant,
} from "@/features/workspace/components/Canvas"
import type {
  DesktopBackgroundInspectorTab,
  DesktopCornersSettings,
  DesktopEncodingSettings,
  DesktopAccessibilitySettings,
  DesktopExportSettings,
  DesktopExportTarget,
  DesktopImageSettings,
  DesktopLayerRow,
  DesktopLayersSettings,
  DesktopLogoSettings,
  DesktopLogoSettingsPatch,
  DesktopLogoSourceMode,
  DesktopMotionSettings,
  DesktopPatternSettings,
  DesktopPatternSettingsPatch,
  DesktopShapeSettings,
  DesktopTextSettings,
  DesktopThemeMode,
  DesktopToolbarController,
  DesktopToolbarToolId,
  ComposeSidebarPanel,
} from "@/features/desktop-shell/components/FloatingToolbar"
import type { UnifiedQrFillPatches } from "@/features/desktop-shell/inspector/desktopnew-settings-bridge"
import { DEFAULT_DESKTOP_EXPORT_SETTINGS } from "@/features/desktop-shell/model/desktop-toolbar-defaults"
import {
  buildDesktopAppearancePatch,
  getDesktopAppearanceSnapshot,
  type DesktopAppearancePatch,
} from "@/features/desktop-shell/model/appearance"
import {
  findBrandIconById,
  type BrandIconCategory,
  type BrandIconEntry,
} from "@/features/qr-code/assets/brand-icons"
import {
  parseIconstackSelectionId,
} from "@/features/qr-code/assets/iconstack-api"
import {
} from "@/features/qr-code/assets/iconstack-svg"
import { useQrScanSafety } from "@/features/qr-code/hooks/useQrScanSafety"
import { previewSession } from "@/features/workspace/preview/preview-session"
import { MobileWorkspaceInsetTransitionBridge } from "@/features/workspace/components/MobileWorkspaceInsetTransitionBridge"
import {
  createBrandIconDataUrl,
} from "@/features/qr-code/assets/brand-icon-svg"
import {
  applyAssetNoneSelection,
  applyAssetUrlValue,
  applyLogoPresetColor,
} from "@/features/qr-code/model/actions"
import { applyAssetUploadValue } from "@/features/qr-code/model/actions"
import { isRasterExportExtension } from "@/features/qr-code/export/raster-export"
import {
  DASHBOARD_QR_NODE_ID,
} from "@/features/qr-code/rendering/compose-scene"
import {
  clampQrBackgroundRound,
  type BackgroundShapeOptions,
  type QrDotMatrixAnimationOptions,
  type QrCrossOrigin,
  type QrGradientLinkMode,
  type QrLogoPositionMode,
  type QrLogoSizeMode,
  type QraftyState,
  type QraftyDataModulesStyle,
  type QraftyGradient,
  setDotMatrixAnimationOptions,
  getAssetValue,
  hasActiveBackgroundShapeOptions,
  hasBackgroundImage,
} from "@/features/qr-code/model/state"
import { type QrBackgroundShapeId } from "@/features/qr-code/styles/background-shapes"
import {
  buildStaticQrPayload,
  getDefaultStaticQrValues,
  getContentValuesForTypeChange,
  resolveContentValuesForType,
  validateStaticQrContent,
  type StaticQrContentValue,
  type StaticQrContentValues,
} from "@/features/qr-code/content/static-payload"
import {
  getPlatformDefaultValuesForIntent,
  isPlatformType,
} from "@/features/qr-code/content/platform-intents"
import {
  DEFAULT_QR_INPUT_TYPE,
  type QrInputType,
} from "@/features/qr-code/content/input-options"
import { cn } from "@/lib/utils"
import {
  formatValueSegmentsText,
  findDraftingLayerById,
  getDesktopAssetSourceMode,
  getDesktopExportTarget,
  getDesktopLogoSourceMode,
  getDesktopTextSettings,
  getDraftingDownloadTarget,
  isEditableShortcutTarget,
  parseValueSegmentsText,
  toDesktopLayerRow,
  ensureMandatoryDesktopLayerRows,
  type DraftingDownloadTarget,
} from "@/features/workspace/components/workspace-surface-helpers"
import {
  type DraftingAssetSourceMode,
  useWorkspaceSurfaceReducer,
} from "@/features/workspace/components/workspace-surface-reducer"
import { useDraftingHistory } from "@/features/workspace/canvas/use-drafting-history"
import { useWorkspaceExport } from "@/features/workspace/canvas/use-workspace-export"
import { createQrControls } from "@/features/workspace/canvas/qr-controls"
import { useQrLogoActions } from "@/features/workspace/canvas/use-qr-logo-actions"
import { useLayerActions } from "@/features/workspace/canvas/use-layer-actions"
import {
  useDraftingShortcuts,
  type DraftingShortcutHandlers,
} from "@/features/workspace/canvas/use-drafting-shortcuts"
type DraftingBrandIconCategoryFilter = BrandIconCategory | "all"

type DraftingWorkspaceController = DesktopToolbarController

type WorkspaceSurfaceProps = {
  desktopTheme?: DesktopThemeMode
  fontClassName?: string
  initialActiveTool?: DesktopToolbarToolId
  onDesktopThemeChange?: (theme: DesktopThemeMode) => void
  paneToolbarVariant?: DraftingPaneToolbarVariant
  renderOverlay?: (controller: DraftingWorkspaceController) => ReactNode
}

export function WorkspaceSurface({
  desktopTheme = "light",
  fontClassName,
  initialActiveTool,
  onDesktopThemeChange,
  paneToolbarVariant = "default",
  renderOverlay,
}: WorkspaceSurfaceProps = {}) {
  const [
    {
      desktopRailTool,
      backgroundInspectorTab,
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
      isDraftingWorkspaceReady,
      logoUploadObjectUrl,
      moduleFillUploadObjectUrl,
    },
    ,
    {
      setDesktopRailTool,
      setBackgroundInspectorTab,
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
      setIsDraftingWorkspaceReady,
      setLogoUploadObjectUrl,
      setModuleFillUploadObjectUrl,
    },
  ] = useWorkspaceSurfaceReducer(initialActiveTool)
  const brandIconQueryRef = useRef("")
  const brandIconCategoryRef = useRef<DraftingBrandIconCategoryFilter>("all")
  const draftingSurfaceRef = useRef<HTMLElement | null>(null)
  const draftingLayerClipboardRef = useRef<string>("")
  const logoUploadObjectUrlRef = useRef<string | null>(null)
  const moduleFillUploadObjectUrlRef = useRef<string | null>(null)
  const pendingQrPersistStateRef = useRef<QraftyState | null>(null)
  const selectedContentValues =
    contentValuesByType[selectedContentType] ?? getDefaultStaticQrValues(selectedContentType)
  const selectedContentValue = useMemo(
    () => buildStaticQrPayload(selectedContentType, selectedContentValues),
    [selectedContentType, selectedContentValues],
  )
  const selectedContentValidation = useMemo(
    () => validateStaticQrContent(selectedContentType, selectedContentValues),
    [selectedContentType, selectedContentValues],
  )
  const draftingQraftyState = useMemo<QraftyState>(
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
          selectedBackgroundAssetSourceMode === "url"
            ? selectedBackgroundRemoteUrl
            : undefined,
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
  )
  const shortcutHandlersRef = useRef<DraftingShortcutHandlers>(
    {} as DraftingShortcutHandlers,
  )
  const keyboardStateRef = useRef({
    activeQrLayerId,
    activeQrNodeId,
    draftingQraftyState,
    layerStateByNodeId,
    qrLayerCount: getQrCanvasLayers(
      layerStateByNodeId[activeQrNodeId] ??
        createDefaultDraftingLayers(activeQrNodeId, draftingQraftyState, selectedCardState),
    ).length,
    selectedCardState,
    selectedLayerIds,
  })
  const canDownload = selectedContentValidation.isValid && Boolean(draftingQraftyState.data.trim())
  const isDraftingRasterExport = isRasterExportExtension(selectedDownloadExtension)
  const selectedRasterPhotoLongEdge = isDraftingRasterExport ? selectedPhotoLongEdge : undefined
  const activeSceneComposition = normalizeSceneComposition(
    sceneCompositionByNodeId[activeQrNodeId] ?? createDefaultSceneComposition(),
  )

  const qrNodeIds = useMemo(() => [DASHBOARD_QR_NODE_ID], [])
  const activeCanvasLayers =
    layerStateByNodeId[activeQrNodeId] ??
    createDefaultDraftingLayers(activeQrNodeId, draftingQraftyState, selectedCardState)
  const qrCanvasLayers = useMemo(
    () => getQrCanvasLayers(activeCanvasLayers),
    [activeCanvasLayers],
  )
  const canExportVideo = sceneHasVideoExportContent(
    selectedCardState,
    activeCanvasLayers,
    draftingQraftyState,
  )
  const qrPaneNamesById = useMemo(() => {
    const next = new Map<string, string>()

    qrCanvasLayers.forEach((layer, index) => {
      next.set(layer.id, index === 0 ? "QR Code" : `QR Code ${index + 1}`)
    })

    return next
  }, [qrCanvasLayers])
  const activeQrDownloadTarget = `qr:${activeQrLayerId}` as DraftingDownloadTarget
  const shouldMeasureActiveQrExport =
    selectedDownloadTarget === "current" ||
    selectedDownloadTarget === activeQrDownloadTarget

  const draftingWorkspaceDocument = useMemo(
    () => buildDraftingWorkspaceDocument(),
    // buildDraftingWorkspaceDocument reads exactly the state listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      activeQrLayerId,
      activeQrNodeId,
      cardStateByNodeId,
      contentTypeByLayerId,
      contentTypeByNodeId,
      contentValuesByType,
      draftingQraftyState,
      layerStateByNodeId,
      qrStateByLayerId,
      sceneCompositionByNodeId,
      selectedCardState,
      selectedContentType,
    ],
  )
  const applyDocumentRef = useRef(applyDraftingWorkspaceDocumentToControls)
  useEffect(() => {
    applyDocumentRef.current = applyDraftingWorkspaceDocumentToControls
  })
  const {
    canRedo: canRedoDraftingWorkspace,
    canUndo: canUndoDraftingWorkspace,
    redo: handleRedoDraftingWorkspace,
    save: handleSaveDraftingWorkspace,
    shouldReplaceCurrentEntryRef: shouldReplaceCurrentDraftingHistoryEntryRef,
    undo: handleUndoDraftingWorkspace,
  } = useDraftingHistory({
    applyDocumentRef,
    document: draftingWorkspaceDocument,
    isWorkspaceReady: isDraftingWorkspaceReady,
    setIsWorkspaceReady: setIsDraftingWorkspaceReady,
  })
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
    qrPaneNamesById,
    qrStateByLayerId,
    rasterPhotoLongEdge: selectedRasterPhotoLongEdge,
    setDownloadError: setExportDownloadError,
    state: draftingQraftyState,
    video: {
      durationSeconds: selectedVideoDurationSeconds,
      format: selectedVideoFormat,
      frameRate: selectedVideoFrameRate,
      longEdge: selectedVideoLongEdge,
    },
  })

  const qrControls = createQrControls({
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
  })
  const logoActions = useQrLogoActions({
    commitState: commitActiveQraftyState,
    selectedLogoColor,
    selectedLogoColorMode,
    selectedLogoGradient,
    selectedLogoPresetId,
    setLogoAssetSourceMode: setSelectedLogoAssetSourceMode,
    state: draftingQraftyState,
  })

  function resolveLiveQrPersistState(): QraftyState {
    if (pendingQrPersistStateRef.current) {
      return pendingQrPersistStateRef.current
    }

    const live = draftingQraftyState
    const persisted = qrStateByLayerId[activeQrLayerId]
    if (!persisted) {
      return live
    }

    const liveModuleFill = getAssetValue(live.moduleFillImage)
    const persistedModuleFill = getAssetValue(persisted.moduleFillImage)
    if (!persistedModuleFill) {
      return live
    }

    const shouldPreferPersistedModuleFill =
      live.dotsColorMode === "image" && !liveModuleFill && Boolean(persistedModuleFill)

    if (!shouldPreferPersistedModuleFill) {
      return live
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
    }
  }

  function commitActiveQraftyState(nextState: QraftyState) {
    const committed = resolveLiveQrPersistState()
    const merged: QraftyState = {
      ...committed,
      logo: nextState.logo,
      logoGradient: nextState.logoGradient,
      imageOptions: nextState.imageOptions,
    }

    qrControls.syncLogo(merged)
    qrControls.syncModuleFill(merged)
    persistActiveQrLayerState(merged)
    clearDraftingQrMarkupCache()
  }

  function handleDraftingContentTypeChange(type: QrInputType) {
    setSelectedContentType(type)
    setContentTypeByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: type,
    }))
    setContentValuesByType((current) => {
      const previousType = selectedContentType
      const nextValues = current[type]
        ? resolveContentValuesForType(type, current[type])
        : getContentValuesForTypeChange(
            previousType,
            type,
            current[previousType] ?? getDefaultStaticQrValues(previousType),
          )

      return {
        ...current,
        [type]: nextValues,
      }
    })
  }

  function handleDraftingContentValueChange(
    field: string,
    value: StaticQrContentValue,
  ) {
    if (field === "intent" && typeof value === "string" && isPlatformType(selectedContentType)) {
      setContentValuesByType((current) => ({
        ...current,
        [selectedContentType]: getPlatformDefaultValuesForIntent(selectedContentType, value),
      }))
      return
    }

    setContentValuesByType((current) => ({
      ...current,
      [selectedContentType]: {
        ...(current[selectedContentType] ?? getDefaultStaticQrValues(selectedContentType)),
        [field]: value,
      },
    }))
  }

  function handleDraftingContentPasteApply(
    type: QrInputType,
    values: StaticQrContentValues,
  ) {
    setSelectedContentType(type)
    setContentTypeByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: type,
    }))
    setContentValuesByType((current) => ({
      ...current,
      [type]: values,
    }))
  }

  function buildDraftingWorkspaceDocument(): DraftingWorkspaceDocumentV1 {
    return buildDraftingWorkspaceDocumentFromState({
      activeQrLayerId,
      activeQrNodeId,
      cardStateByNodeId,
      contentTypeByLayerId,
      contentTypeByNodeId,
      contentValuesByType,
      draftingQraftyState,
      layerStateByNodeId,
      qrStateByLayerId,
      sceneCompositionByNodeId,
      selectedCardState,
      selectedContentType,
    })
  }

  function persistActiveQrLayerState(nextState: QraftyState = resolveLiveQrPersistState()) {
    const cloned = cloneDraftingQrState(nextState)
    pendingQrPersistStateRef.current = cloned
    setQrStateByLayerId((current) => ({
      ...current,
      [activeQrLayerId]: cloned,
    }))
    setContentTypeByLayerId((current) => ({
      ...current,
      [activeQrLayerId]: selectedContentType,
    }))
    setQrStateByNodeId({
      [DASHBOARD_QR_NODE_ID]: cloned,
    })
  }

  useEffect(() => {
    pendingQrPersistStateRef.current = null
  })

  function activateQrLayer(layerId: string) {
    if (!isDraftingQrLayerId(layerId) || layerId === activeQrLayerId) {
      return
    }

    shouldReplaceCurrentDraftingHistoryEntryRef.current = true
    persistActiveQrLayerState()

    const nextState =
      qrStateByLayerId[layerId] ?? createDefaultDraftingWorkspaceQrState()
    const nextContentType = contentTypeByLayerId[layerId] ?? DEFAULT_QR_INPUT_TYPE

    setActiveQrLayerId(layerId)
    qrControls.applyQrState(nextState)
    setSelectedContentType(nextContentType)
    selectSingleLayer(layerId)
  }

  function applyDraftingWorkspaceDocumentToControls(
    nextDocument: DraftingWorkspaceDocumentV1,
  ) {
    const nodeId = DASHBOARD_QR_NODE_ID
    const activeNodeId = nodeId
    const fallbackActiveLayerId =
      nextDocument.qrStateByLayerId[nextDocument.activeQrLayerId]
        ? nextDocument.activeQrLayerId
        : getDraftingQrLayerId(nodeId)
    const activeCardState =
      nextDocument.cardStateByNodeId[activeNodeId] ?? createDefaultDraftingCardState()
    const layers = (
      nextDocument.layerStateByNodeId[activeNodeId] ??
      createDefaultDraftingLayers(
        activeNodeId,
        nextDocument.qrStateByLayerId[fallbackActiveLayerId] ??
          nextDocument.qrStateByNodeId[activeNodeId] ??
          createDefaultDraftingWorkspaceQrState(),
        activeCardState,
      )
    ).map(cloneDraftingCanvasLayer)
    const activeLayerId = resolveActiveQrLayerIdFromLayers(
      fallbackActiveLayerId,
      layers,
      nextDocument.activeQrLayerId,
    )
    const activeState =
      nextDocument.qrStateByLayerId[activeLayerId] ??
      nextDocument.qrStateByLayerId[fallbackActiveLayerId] ??
      nextDocument.qrStateByNodeId[activeNodeId] ??
      createDefaultDraftingWorkspaceQrState()

    setActiveQrLayerId(activeLayerId)
    setActiveQrNodeId(activeNodeId)
    setQrStateByLayerId(structuredClone(nextDocument.qrStateByLayerId))
    setQrStateByNodeId({
      [activeNodeId]: cloneDraftingQrState(activeState),
    })
    setCardStateByNodeId({
      [activeNodeId]: cloneDraftingCardState(activeCardState),
    })
    setLayerStateByNodeId({
      [activeNodeId]: layers,
    })
    setSceneCompositionByNodeId(
      cloneSceneCompositionByNodeId(
        nextDocument.sceneCompositionByNodeId ??
          createDefaultSceneCompositionByNodeId(nextDocument),
      ),
    )
    setContentTypeByLayerId(structuredClone(nextDocument.contentTypeByLayerId))
    setContentTypeByNodeId(structuredClone(nextDocument.contentTypeByNodeId))
    setSelectedContentType(nextDocument.selectedContentType)
    setContentValuesByType(structuredClone(nextDocument.contentValuesByType))
    qrControls.applyQrState(activeState)
    setSelectedCardState(cloneDraftingCardState(activeCardState))
    selectSingleLayer(activeLayerId)
  }

  const {
    applyLayerSelection,
    clearDraftingLayerSelection,
    copySelectedDraftingLayers,
    deleteSelectedLayersOrPane,
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
    handlePaneQrClick,
    handlePaneSelection,
    handleRemoveQrCode,
    pasteDraftingLayers,
    selectAllActiveDraftingLayers,
    selectSingleLayer,
  } = useLayerActions({
    activateQrLayer,
    activeQrLayerId,
    activeQrNodeId,
    cardStateByNodeId,
    contentTypeByLayerId,
    draftingLayerClipboardRef,
    draftingQraftyState,
    draftingSurfaceRef,
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
    shouldReplaceCurrentEntryRef: shouldReplaceCurrentDraftingHistoryEntryRef,
  })


  function resetDraftingWorkspace() {
    const nextState = createDefaultDraftingWorkspaceQrState()

    setDesktopRailTool("content")
    qrControls.applyQrState(nextState)
    brandIconQueryRef.current = ""
    brandIconCategoryRef.current = "all"
    setActiveQrLayerId(getDraftingQrLayerId(DASHBOARD_QR_NODE_ID))
    setActiveQrNodeId(DASHBOARD_QR_NODE_ID)
    setContentTypeByNodeId({
      [DASHBOARD_QR_NODE_ID]: DEFAULT_QR_INPUT_TYPE,
    })
    setContentTypeByLayerId({
      [getDraftingQrLayerId(DASHBOARD_QR_NODE_ID)]: DEFAULT_QR_INPUT_TYPE,
    })
    setQrStateByLayerId({
      [getDraftingQrLayerId(DASHBOARD_QR_NODE_ID)]: cloneDraftingQrState(nextState),
    })
    setQrStateByNodeId({
      [DASHBOARD_QR_NODE_ID]: cloneDraftingQrState(nextState),
    })
    const nextCardState = createDefaultDraftingCardState()
    setSelectedCardState(cloneDraftingCardState(nextCardState))
    setCardStateByNodeId({
      [DASHBOARD_QR_NODE_ID]: cloneDraftingCardState(nextCardState),
    })
    setLayerStateByNodeId({
      [DASHBOARD_QR_NODE_ID]: createDefaultDraftingLayers(
        DASHBOARD_QR_NODE_ID,
        nextState,
        nextCardState,
      ),
    })
    selectSingleLayer(getDraftingQrLayerId(DASHBOARD_QR_NODE_ID))

    setSelectedDownloadExtension("png")
    setSelectedDownloadTarget("surface")
    setSelectedPhotoLongEdge(DEFAULT_DESKTOP_EXPORT_SETTINGS.photoLongEdge)
    setSelectedBackgroundTransparent(false)
    setSelectedBackgroundShapeId(nextState.backgroundShapeId)
  }

  useEffect(() => {
    if (!logoUploadObjectUrl) {
      return
    }

    return () => {
      URL.revokeObjectURL(logoUploadObjectUrl)
    }
  }, [logoUploadObjectUrl])

  useEffect(() => {
    if (!moduleFillUploadObjectUrl) {
      return
    }

    return () => {
      URL.revokeObjectURL(moduleFillUploadObjectUrl)
    }
  }, [moduleFillUploadObjectUrl])

  useEffect(() => {
    keyboardStateRef.current = {
      activeQrLayerId,
      activeQrNodeId,
      draftingQraftyState,
      layerStateByNodeId,
      qrLayerCount: qrCanvasLayers.length,
      selectedCardState,
      selectedLayerIds,
    }
  }, [
    activeQrLayerId,
    activeQrNodeId,
    draftingQraftyState,
    layerStateByNodeId,
    qrCanvasLayers.length,
    selectedCardState,
    selectedLayerIds,
  ])

  useEffect(() => {
    shortcutHandlersRef.current = {
      clearDraftingLayerSelection,
      copySelectedDraftingLayers,
      deleteSelectedLayersOrPane,
      duplicateSelectedLayers,
      handleLayerAction,
      handleLayerChange,
      handleRedoDraftingWorkspace,
      handleUndoDraftingWorkspace,
      pasteDraftingLayers,
      selectAllActiveDraftingLayers,
    }
  })
  useDraftingShortcuts({
    clipboardRef: draftingLayerClipboardRef,
    handlersRef: shortcutHandlersRef,
    stateRef: keyboardStateRef,
    surfaceRef: draftingSurfaceRef,
  })


  async function handleAddQrCode() {
    if (qrCanvasLayers.length >= 10) return

    persistActiveQrLayerState()

    const freshState = createDefaultDraftingWorkspaceQrState()
    const layers =
      layerStateByNodeId[activeQrNodeId] ??
      createDefaultDraftingLayers(activeQrNodeId, draftingQraftyState, selectedCardState)
    const maxZIndex = layers.reduce((max, layer) => Math.max(max, layer.zIndex), -1)
    const nearLayer =
      findDraftingLayerById(layers, activeQrLayerId) ??
      qrCanvasLayers.at(-1) ??
      undefined
    const nextLayer = createDraftingQrLayer(
      activeQrNodeId,
      freshState,
      selectedCardState,
      {
        nearLayer,
        zIndex: maxZIndex + 1,
      },
    )

    setQrStateByLayerId((current) => ({
      ...current,
      [nextLayer.id]: cloneDraftingQrState(freshState),
    }))
    setContentTypeByLayerId((current) => ({
      ...current,
      [nextLayer.id]: DEFAULT_QR_INPUT_TYPE,
    }))
    setLayerStateByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: [...layers.map(cloneDraftingCanvasLayer), nextLayer],
    }))

    setActiveQrLayerId(nextLayer.id)
    qrControls.applyQrState(freshState)
    setSelectedContentType(DEFAULT_QR_INPUT_TYPE)
    selectSingleLayer(nextLayer.id)
  }

  const activeCanvasLayerRows = [...activeCanvasLayers].sort(
    (a, b) => b.zIndex - a.zIndex,
  )
  const selectedTextLayer =
    selectedLayerId ? findDraftingLayerById(activeCanvasLayers, selectedLayerId) : null
  const selectedElementLayer =
    selectedLayerIds.length === 1 && selectedTextLayer &&
    (selectedTextLayer.kind === "text" ||
      selectedTextLayer.kind === "shape" ||
      selectedTextLayer.kind === "image" ||
      selectedTextLayer.kind === "shader")
      ? selectedTextLayer
      : null
  const selectedTransformLayer =
    selectedLayerIds.length === 1 && selectedTextLayer ? selectedTextLayer : null


  const panes = useMemo(() => {
    const mergedQrStateByLayerId = mergeLiveQrStateByLayerId({
      qrStateByLayerId,
      activeQrLayerId,
      canvasLayers: activeCanvasLayers,
      draftingQraftyState,
      selectedLayerId,
    })

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
        state: draftingQraftyState,
      },
    ]
  }, [
    activeCanvasLayers,
    activeQrLayerId,
    activeQrNodeId,
    activeSceneComposition,
    draftingQraftyState,
    qrStateByLayerId,
    selectedCardState,
    selectedContentValidation,
    selectedLayerId,
  ])

  const desktopActiveTool = desktopRailTool
  const fallbackAppearanceLayer =
    activeCanvasLayers.find((layer) => layer.kind === "card") ?? null
  const appearanceTargetLayer = selectedTransformLayer ?? fallbackAppearanceLayer
  const qrBackgroundSurfaceVisible =
    !hasBackgroundImage(draftingQraftyState) &&
    (!draftingQraftyState.backgroundOptions.transparent ||
      draftingQraftyState.backgroundGradient.enabled ||
      hasActiveBackgroundShapeOptions(draftingQraftyState.backgroundShapeOptions))
  const transformTargetLayer =
    selectedTransformLayer ??
    (selectedLayerIds.length === 0 ? appearanceTargetLayer : null)
  const propertiesTransformLayer =
    transformTargetLayer?.kind === "card" ? null : transformTargetLayer
  const desktopAppearanceSnapshot = appearanceTargetLayer
    ? getDesktopAppearanceSnapshot(appearanceTargetLayer, {
        cardBorder:
          appearanceTargetLayer.kind === "card" ? selectedCardState.border : undefined,
        cardCornerRadius:
          appearanceTargetLayer.kind === "card" ? selectedCardState.cornerRadius : undefined,
        cardCornerRadii:
          appearanceTargetLayer.kind === "card" ? selectedCardState.cornerRadii : undefined,
        qrBackgroundShapeId:
          appearanceTargetLayer.kind === "qr"
            ? draftingQraftyState.backgroundShapeId
            : undefined,
        qrBackgroundShapeOptions:
          appearanceTargetLayer.kind === "qr"
            ? draftingQraftyState.backgroundShapeOptions
            : undefined,
        qrBackgroundSurfaceVisible:
          appearanceTargetLayer.kind === "qr" ? qrBackgroundSurfaceVisible : undefined,
      })
    : null

  function handleDesktopAppearancePatch(patch: DesktopAppearancePatch) {
    if (!appearanceTargetLayer) {
      return
    }

    const result = buildDesktopAppearancePatch(appearanceTargetLayer, patch, {
      qrBackgroundShapeId:
        appearanceTargetLayer.kind === "qr"
          ? draftingQraftyState.backgroundShapeId
          : undefined,
      qrBackgroundShapeOptions:
        appearanceTargetLayer.kind === "qr"
          ? draftingQraftyState.backgroundShapeOptions
          : undefined,
      qrBackgroundSurfaceVisible:
        appearanceTargetLayer.kind === "qr" ? qrBackgroundSurfaceVisible : undefined,
    })

    if (Object.keys(result.layerPatch).length > 0) {
      handleLayerChange(activeQrNodeId, appearanceTargetLayer.id, result.layerPatch)
    }

    if (result.qrBackgroundShapeOptions) {
      setSelectedBackgroundShapeOptions((current) => ({
        ...current,
        ...result.qrBackgroundShapeOptions,
      }))
    }

    if (
      appearanceTargetLayer.kind === "card" &&
      (result.cardBorder !== undefined ||
        result.cardCornerRadius !== undefined ||
        result.cardCornerRadii !== undefined ||
        result.cardShadow)
    ) {
      setSelectedCardState((current) => ({
        ...current,
        border: result.cardBorder ?? current.border,
        cornerRadius: result.cardCornerRadius ?? current.cornerRadius,
        cornerRadii: result.cardCornerRadii ?? current.cornerRadii,
        shadow: result.cardShadow
          ? {
              ...current.shadow,
              ...result.cardShadow,
            }
          : current.shadow,
      }))
    }
  }

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
  } = pickDesktopToolbarSettingsSnapshots(
    buildDesktopToolbarSettingsSnapshots({
      activeQrNodeId,
      activeCanvasLayers,
      activeCanvasLayerRows,
      activeSceneComposition,
      draftingQraftyState,
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
  )

  function resetDesktopContent() {
    setSelectedContentType(DEFAULT_QR_INPUT_TYPE)
    setContentValuesByType((current) => ({
      ...current,
      [DEFAULT_QR_INPUT_TYPE]: {
        ...getDefaultStaticQrValues(DEFAULT_QR_INPUT_TYPE),
        url: DEFAULT_DRAFTING_STUDIO_STATE.data,
      },
    }))
  }

  function applyDesktopPatternPatchToControls(patch: DesktopPatternSettingsPatch) {
    if (patch.qrDotType) setSelectedDotType(patch.qrDotType)
    if (patch.moduleRoundSize !== undefined) setSelectedModuleRoundSize(patch.moduleRoundSize)
    if (patch.moduleSize !== undefined) setSelectedModuleSize(patch.moduleSize)
    if (patch.moduleLineWidth !== undefined) setSelectedModuleLineWidth(patch.moduleLineWidth)
    if (patch.gradientLinkMode) setSelectedGradientLinkMode(patch.gradientLinkMode)
    if (patch.dotsColorMode) {
      setSelectedDotsColorMode(patch.dotsColorMode)
    }
    if (patch.dotsSolidColor) {
      setSelectedDotsColorMode("solid")
      setSelectedDotColor(patch.dotsSolidColor)
    }
    if (patch.dataModulesGradient) {
      setSelectedDotsColorMode("gradient")
      setSelectedDotsGradient({ ...patch.dataModulesGradient, enabled: true })
    }
    if (patch.dotsPalette) {
      setSelectedDotsColorMode("palette")
      setSelectedDotsPalette([...patch.dotsPalette])
    }
    if (patch.dotsPalettePreset !== undefined) {
      setSelectedDotsColorMode("palette")
      setSelectedDotsPalettePreset(patch.dotsPalettePreset)
    }
    if (patch.moduleFillImageUrl !== undefined) {
      setSelectedDotsColorMode("image")
      const sourceMode = patch.moduleFillImageSourceMode ?? selectedModuleFillImageSourceMode
      setSelectedModuleFillImageSourceMode(sourceMode)
      if (!patch.moduleFillImageUrl) {
        setSelectedModuleFillImageUrl("")
        setSelectedModuleFillRemoteUrl("")
      } else if (sourceMode === "url") {
        setSelectedModuleFillRemoteUrl(patch.moduleFillImageUrl)
        setSelectedModuleFillImageUrl("")
      } else {
        setSelectedModuleFillImageUrl(patch.moduleFillImageUrl)
        setSelectedModuleFillRemoteUrl("")
      }
    }
    if (patch.moduleFillImageSourceMode && patch.moduleFillImageUrl === undefined) {
      setSelectedDotsColorMode("image")
      setSelectedModuleFillImageSourceMode(patch.moduleFillImageSourceMode)
    }
  }

  function applyDesktopCornersPatchToControls(patch: Partial<DesktopCornersSettings>) {
    if (patch.cornerSquareType) setSelectedQrFinderPatternOuterStyle(patch.cornerSquareType)
    if (patch.cornerSquareColorMode) setSelectedCornerSquareColorMode(patch.cornerSquareColorMode)
    if (patch.cornerSquareSolidColor) {
      setSelectedCornerSquareColorMode("solid")
      setSelectedCornerSquareColor(patch.cornerSquareSolidColor)
    }
    if (patch.cornerSquareGradient) {
      setSelectedCornerSquareColorMode("gradient")
      setSelectedCornerSquareGradient({ ...patch.cornerSquareGradient, enabled: true })
    }
    if (patch.cornerDotType) setSelectedQrFinderPatternInnerStyle(patch.cornerDotType)
    if (patch.cornerDotColorMode) setSelectedCornerDotColorMode(patch.cornerDotColorMode)
    if (patch.cornerDotSolidColor) {
      setSelectedCornerDotColorMode("solid")
      setSelectedCornerDotColor(patch.cornerDotSolidColor)
    }
    if (patch.cornerDotGradient) {
      setSelectedCornerDotColorMode("gradient")
      setSelectedCornerDotGradient({ ...patch.cornerDotGradient, enabled: true })
    }
  }

  function applyDesktopUnifiedLogoPatchToControls(patch: Partial<DesktopLogoSettings>) {
    if (patch.colorMode) setSelectedLogoColorMode(patch.colorMode)
    if (patch.solidColor) {
      setSelectedLogoColorMode("solid")
      setSelectedLogoColor(patch.solidColor)
    }
    if (patch.gradient) {
      setSelectedLogoColorMode("gradient")
      setSelectedLogoGradient({ ...patch.gradient, enabled: true })
    }
  }

  function updateDesktopPatternSettings(patch: DesktopPatternSettingsPatch) {
    applyDesktopPatternPatchToControls(patch)
    const nextState = applyPatternSettingsPatchToQraftyState(resolveLiveQrPersistState(), patch)

    clearQrEncodeMarkupCache()
    clearDraftingQrMarkupCache()
    persistActiveQrLayerState(nextState)
    qrControls.syncModuleFill(nextState)
  }

  function updateDesktopUnifiedQrFillSettings(patches: UnifiedQrFillPatches) {
    applyDesktopPatternPatchToControls(patches.pattern)
    applyDesktopCornersPatchToControls(patches.corners)
    applyDesktopUnifiedLogoPatchToControls(patches.logo)

    let nextState = resolveLiveQrPersistState()
    nextState = applyPatternSettingsPatchToQraftyState(nextState, patches.pattern)
    nextState = applyCornersSettingsPatchToQraftyState(nextState, patches.corners)
    nextState = applyLogoSettingsPatchToQraftyState(nextState, patches.logo)

    // A preset logo stores its rendered SVG in `logo.value`. Updating only
    // `presetColor` leaves that SVG painted with its previous color.
    if (patches.logo.solidColor) {
      const brandIcon = findBrandIconById(nextState.logo.presetId)
      if (brandIcon) {
        nextState = applyLogoPresetColor(
          nextState,
          createBrandIconDataUrl(brandIcon, patches.logo.solidColor),
          patches.logo.solidColor,
        )
      }
    }

    clearQrEncodeMarkupCache()
    clearDraftingQrMarkupCache()
    persistActiveQrLayerState(nextState)
    qrControls.syncModuleFill(nextState)
    qrControls.syncLogo(nextState)
  }

  function resetDesktopPatternSettings() {
    setSelectedDotType(DEFAULT_DRAFTING_STUDIO_STATE.dataModulesSettings.type)
    setSelectedDotsColorMode(DEFAULT_DRAFTING_STUDIO_STATE.dotsColorMode)
    setSelectedDotColor(DEFAULT_DRAFTING_STUDIO_STATE.dataModulesSettings.color)
    setSelectedDotsGradient(structuredClone(DEFAULT_DRAFTING_STUDIO_STATE.dataModulesGradient))
    setSelectedDotsPalette([...DEFAULT_DRAFTING_STUDIO_STATE.dotsPalette])
    setSelectedDotsPalettePreset("Signal")
    setSelectedModuleFillImageUrl("")
    setSelectedModuleFillRemoteUrl("")
    setSelectedModuleFillImageSourceMode("upload")
    setSelectedModuleRoundSize(DEFAULT_DRAFTING_STUDIO_STATE.dataModulesSettings.roundSize)
    setSelectedModuleSize(undefined)
    setSelectedModuleLineWidth(undefined)
    setSelectedGradientLinkMode(DEFAULT_DRAFTING_STUDIO_STATE.gradientLinkMode)
  }

  function updateDesktopLogoSettings(patch: DesktopLogoSettingsPatch) {
    if (patch.uploadedFile) {
      const uploadValue = replaceTrackedObjectUrl(
        logoUploadObjectUrlRef,
        patch.uploadedFile,
        setLogoUploadObjectUrl,
      )
      const nextState = applyAssetUploadValue(draftingQraftyState, "logo", uploadValue)
      commitActiveQraftyState(nextState)
    }
    if (patch.uploadedImageUrl !== undefined) {
      commitActiveQraftyState(
        patch.uploadedImageUrl
          ? applyAssetUploadValue(draftingQraftyState, "logo", patch.uploadedImageUrl)
          : applyAssetNoneSelection(draftingQraftyState, "logo"),
      )
    }
    if (patch.sourceMode) {
      if (patch.sourceMode === "none") {
        commitActiveQraftyState(applyAssetNoneSelection(draftingQraftyState, "logo"))
      } else if (patch.sourceMode === "brand") {
        setSelectedLogoSourceMode("preset")
      } else if (patch.sourceMode === "url") {
        const nextState = applyAssetUrlValue(
          draftingQraftyState,
          "logo",
          selectedLogoRemoteUrl,
        )
        commitActiveQraftyState(nextState)
      } else {
        logoActions.clearLogoPreset("upload")
      }
    }
    if (patch.uploadMode) {
      if (patch.uploadMode === "url") {
        const nextState = applyAssetUrlValue(
          draftingQraftyState,
          "logo",
          selectedLogoRemoteUrl,
        )
        commitActiveQraftyState(nextState)
      } else {
        logoActions.clearLogoPreset("upload")
      }
    }
    if (patch.remoteUrl !== undefined) {
      const nextState = applyAssetUrlValue(draftingQraftyState, "logo", patch.remoteUrl)
      commitActiveQraftyState(nextState)
    }
    if (patch.selectedBrandIconId) {
      if (parseIconstackSelectionId(patch.selectedBrandIconId)) {
        void logoActions.selectIconstackIcon(patch.selectedBrandIconId)
      } else {
        const brandIcon = findBrandIconById(patch.selectedBrandIconId)
        if (brandIcon) logoActions.selectBrandIcon(brandIcon)
      }
    }
    if (patch.colorMode) setSelectedLogoColorMode(patch.colorMode)
    if (patch.solidColor) void logoActions.changeLogoColor(patch.solidColor)
    if (patch.gradient) void logoActions.changeLogoGradient({ ...patch.gradient, enabled: true })
    logoActions.patchLogoImageOptions(patch)
  }

  function resetDesktopLogoSettings() {
    qrControls.applyQrState(createDefaultDraftingWorkspaceQrState())
  }

  function updateDesktopCornersSettings(patch: Partial<DesktopCornersSettings>) {
    applyDesktopCornersPatchToControls(patch)

    const nextState = applyCornersSettingsPatchToQraftyState(resolveLiveQrPersistState(), patch)
    clearQrEncodeMarkupCache()
    clearDraftingQrMarkupCache()
    persistActiveQrLayerState(nextState)
  }

  function mergeCardStateFromShapePatch(patch: Partial<DesktopShapeSettings>) {
    const nextCornerRadius = patch.cardRadius ?? selectedCardState.cornerRadius

    return {
      ...selectedCardState,
      bottomSpace: patch.bottomSpace ?? selectedCardState.bottomSpace,
      cornerRadius: nextCornerRadius,
      cornerRadii:
        patch.cardRadius !== undefined
          ? createUniformCornerRadii(nextCornerRadius)
          : selectedCardState.cornerRadii,
      enabled:
        patch.sizeMode === "fixed" ||
        patch.cardWidth !== undefined ||
        patch.cardHeight !== undefined ||
        patch.sizePresetId !== undefined
          ? true
          : selectedCardState.enabled,
      fill: patch.cardFill ?? selectedCardState.fill,
      height: patch.cardHeight ?? selectedCardState.height,
      lockAspectRatio: patch.lockAspectRatio ?? selectedCardState.lockAspectRatio,
      shadow: cardShadowFromPatch(patch),
      sizeMode: patch.sizeMode ?? selectedCardState.sizeMode,
      sizePresetId:
        patch.sizePresetId !== undefined ? patch.sizePresetId : selectedCardState.sizePresetId,
      styleMode:
        patch.cardFill !== undefined
          ? "solid"
          : selectedCardState.styleMode,
      width: patch.cardWidth ?? selectedCardState.width,
    }
  }

  function cardShadowFromPatch(patch: Partial<DesktopShapeSettings>) {
    return {
      ...selectedCardState.shadow,
      blur: patch.shadowBlur ?? selectedCardState.shadow.blur,
      color: patch.shadowColor ?? selectedCardState.shadow.color,
      offsetX: patch.shadowOffsetX ?? selectedCardState.shadow.offsetX,
      offsetY: patch.shadowOffsetY ?? selectedCardState.shadow.offsetY,
      opacity: patch.shadowOpacity ?? selectedCardState.shadow.opacity,
    }
  }

  function relayoutCardInset(normalizedCardState: ReturnType<typeof normalizeDraftingCardState>) {
    const baseQrState = resolveLiveQrPersistState()
    const fittedQr = fitQrSizeInCard(baseQrState, normalizedCardState)
    const nextQrState = {
      ...baseQrState,
      height: fittedQr.height,
      width: fittedQr.width,
    }

    if (normalizedCardState.sizeMode === "fixed") {
      setSelectedQrSize(fittedQr.width)
    }

    setLayerStateByNodeId((layerState) => {
      const layers =
        layerState[activeQrNodeId] ??
        createDefaultDraftingLayers(activeQrNodeId, nextQrState, normalizedCardState)

      return {
        ...layerState,
        [activeQrNodeId]: layoutDraftingCardInsetLayers(
          layers.map(cloneDraftingCanvasLayer),
          nextQrState,
          normalizedCardState,
        ),
      }
    })
  }

  function updateDesktopShapeSettings(patch: Partial<DesktopShapeSettings>) {
    if (patch.backgroundShapeId !== undefined) setSelectedBackgroundShapeId(patch.backgroundShapeId)
    if (patch.shapeColorMode) setSelectedBackgroundColorMode(patch.shapeColorMode)
    if (patch.shapeSolidColor) {
      setSelectedBackgroundColorMode("solid")
      setSelectedBackgroundColor(patch.shapeSolidColor)
      setSelectedBackgroundTransparent(false)
    }
    if (patch.shapeGradient) {
      setSelectedBackgroundColorMode("gradient")
      setSelectedBackgroundGradient({ ...patch.shapeGradient, enabled: true })
      setSelectedBackgroundTransparent(false)
    }
    if (patch.shapePadding !== undefined) {
      const paddingPx = patch.shapePadding
      setSelectedBackgroundShapeOptions((current) => ({ ...current, paddingPx }))
    }

    const qrShadowPatch = Object.fromEntries(
      (
        [
          ["blur", patch.shapeShadowBlur],
          ["color", patch.shapeShadowColor],
          ["offsetX", patch.shapeShadowOffsetX],
          ["offsetY", patch.shapeShadowOffsetY],
          ["opacity", patch.shapeShadowOpacity],
        ] as const
      ).filter(([, value]) => value !== undefined),
    )

    if (Object.keys(qrShadowPatch).length > 0) {
      const qrLayerId = getDraftingQrLayerId(activeQrNodeId)
      const currentQrLayer = findDraftingLayerById(activeCanvasLayers, qrLayerId)
      if (currentQrLayer) {
        handleLayerChange(activeQrNodeId, qrLayerId, {
          shadow: { ...currentQrLayer.shadow, ...qrShadowPatch },
        })
      }
    }

    const normalizedCardState = normalizeDraftingCardState(
      mergeCardStateFromShapePatch(patch),
    )
    setSelectedCardState(normalizedCardState)

    const shouldRelayoutCardInset =
      patch.bottomSpace !== undefined ||
      patch.cardHeight !== undefined ||
      patch.cardWidth !== undefined ||
      patch.sizeMode !== undefined ||
      patch.sizePresetId !== undefined

    if (shouldRelayoutCardInset) {
      relayoutCardInset(normalizedCardState)
    }

    if (
      patch.shadowBlur !== undefined ||
      patch.shadowColor !== undefined ||
      patch.shadowOffsetX !== undefined ||
      patch.shadowOffsetY !== undefined ||
      patch.shadowOpacity !== undefined
    ) {
      handleLayerChange(activeQrNodeId, getDraftingCardLayerId(activeQrNodeId), {
        shadow: cardShadowFromPatch(patch),
      })
    }
  }

  function updateDesktopImageSettings(patch: Partial<DesktopImageSettings>) {
    setSelectedCardState((current) => {
      if (patch.remoteUrl === "") {
        return {
          ...current,
          cardImage: {
            ...current.cardImage,
            opacity: patch.opacity ?? current.cardImage.opacity,
            source: "none",
            value: undefined,
          },
          styleMode: "paper-shader",
        }
      }

      const nextRemoteUrl =
        patch.remoteUrl !== undefined ? patch.remoteUrl : current.cardImage.value

      return {
        ...current,
        cardImage: {
          ...current.cardImage,
          fit: patch.fit ?? current.cardImage.fit,
          opacity: patch.opacity ?? current.cardImage.opacity,
          source:
            patch.sourceMode === "url"
              ? "url"
              : patch.sourceMode === "upload"
                ? "upload"
                : current.cardImage.source,
          value: nextRemoteUrl,
        },
        styleMode: nextRemoteUrl ? "image" : current.styleMode,
      }
    })
  }

  function resetDesktopShapeSettings() {
    const defaultCard = createDefaultDraftingCardState()
    setSelectedCardState(defaultCard)
    setSelectedBackgroundColor(DEFAULT_DRAFTING_STUDIO_STATE.backgroundOptions.color)
    setSelectedBackgroundColorMode(DEFAULT_DRAFTING_STUDIO_STATE.backgroundGradient.enabled ? "gradient" : "solid")
    setSelectedBackgroundGradient(structuredClone(DEFAULT_DRAFTING_STUDIO_STATE.backgroundGradient))
    setSelectedBackgroundShapeId(DEFAULT_DRAFTING_STUDIO_STATE.backgroundShapeId)
    setSelectedBackgroundShapeOptions({ ...DEFAULT_DRAFTING_STUDIO_STATE.backgroundShapeOptions })
  }

  function updateDesktopMotionSettings(patch: Parameters<typeof setDotMatrixAnimationOptions>[1]) {
    if (patch.enabled !== undefined) {
      clearQrEncodeMarkupCache()
      clearDraftingQrMarkupCache()
    }

    setSelectedDotMatrixAnimation((current) =>
      setDotMatrixAnimationOptions(
        { ...DEFAULT_DRAFTING_STUDIO_STATE, dotMatrixAnimation: current },
        patch,
      ).dotMatrixAnimation,
    )
  }

  function updateDesktopEncodingSettings(patch: Partial<DesktopEncodingSettings>) {
    if (patch.typeNumber !== undefined) setSelectedQrTypeNumber(patch.typeNumber)
    if (patch.errorCorrectionLevel) setSelectedQrErrorCorrectionLevel(patch.errorCorrectionLevel)
    if (patch.boostLevel !== undefined) setSelectedBoostLevel(patch.boostLevel)
    if (patch.valueSegmentsText !== undefined) setSelectedValueSegmentsText(patch.valueSegmentsText)
  }

  function updateDesktopAccessibilitySettings(patch: Partial<DesktopAccessibilitySettings>) {
    if (patch.ariaLabel !== undefined) setSelectedAriaLabel(patch.ariaLabel)
  }

  function updateDesktopTextSettings(patch: Partial<DesktopTextSettings>) {
    if (selectedTextLayer?.kind === "text") {
      handleLayerChange(activeQrNodeId, selectedTextLayer.id, patch)
      return
    }
    const layers =
      layerStateByNodeId[activeQrNodeId] ??
      createDefaultDraftingLayers(activeQrNodeId, draftingQraftyState, selectedCardState)
    const maxZIndex = layers.reduce((max, layer) => Math.max(max, layer.zIndex), -1)
    const textLayer = createDraftingTextLayer(activeQrNodeId, {
      ...patch,
      id: `${activeQrNodeId}:text:${Date.now()}`,
      zIndex: maxZIndex + 1,
    })
    setLayerStateByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: [...layers.map(cloneDraftingCanvasLayer), textLayer],
    }))
    selectSingleLayer(textLayer.id)
  }

  function updateDesktopLayersSettings(patch: Partial<DesktopLayersSettings>) {
    if (patch.selectedLayerId !== undefined) {
      handleLayerSelect(activeQrNodeId, patch.selectedLayerId, { preserveActiveTool: true })
    }
    if (patch.layers) {
      const mergedRows = ensureMandatoryDesktopLayerRows(patch.layers, activeCanvasLayers)
      const currentLayersById = new Map(activeCanvasLayers.map((layer) => [layer.id, layer]))
      const nextLayers = mergedRows.map((row) => {
        const layer = currentLayersById.get(row.id) ?? createDraftingTextLayer(activeQrNodeId, { id: row.id })

        return patchDraftingCanvasLayer(layer, {
          blur: row.blur,
          height: row.height,
          isVisible: true,
          name: row.name,
          opacity: row.opacity / 100,
          shadow: {
            ...layer.shadow,
            blur: row.shadowBlur,
            color: row.shadowColor,
            offsetX: row.shadowOffsetX,
            offsetY: row.shadowOffsetY,
            opacity: row.shadowOpacity,
          },
          tiltX: row.tiltX,
          tiltY: row.tiltY,
          width: row.width,
          x: row.x,
          y: row.y,
        })
      })
      setLayerStateByNodeId((current) => ({
        ...current,
        [activeQrNodeId]: nextLayers,
      }))
    }
  }

  function updateDesktopExportSettings(patch: Partial<DesktopExportSettings>) {
    if (patch.extension) setSelectedDownloadExtension(patch.extension as DraftingDownloadExtension)
    if (patch.photoLongEdge) setSelectedPhotoLongEdge(patch.photoLongEdge)
    if (patch.target) setSelectedDownloadTarget(getDraftingDownloadTarget(patch.target))
    if (patch.mediaKind) setSelectedExportMediaKind(patch.mediaKind)
    if (patch.videoDurationSeconds) setSelectedVideoDurationSeconds(patch.videoDurationSeconds)
    if (patch.videoFormat) setSelectedVideoFormat(patch.videoFormat)
    if (patch.videoFrameRate) setSelectedVideoFrameRate(patch.videoFrameRate)
    if (patch.videoLongEdge) setSelectedVideoLongEdge(patch.videoLongEdge)
  }

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
      scanSafetyCardLayer
        ? resolveWorkspaceExportTargetDimensions(scanSafetyCardLayer)
        : undefined,
    [scanSafetyCardLayer, selectedRasterPhotoLongEdge],
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
  const scanSafetyResult = useQrScanSafety(scanSafetyState, {
    contentIsValid: selectedContentValidation.isValid,
    enabled: !isPreviewInteracting,
    layer: scanSafetyQrLayer,
    scene: scanSafetyScene,
  })

  const canRemoveQrCode =
    paneToolbarVariant === "desktop-zoom" &&
    qrCanvasLayers.length > 1 &&
    Boolean(selectedLayerId?.includes(":qr"))

  const desktopController = useMemo<DraftingWorkspaceController>(() => ({
    activeTool: desktopActiveTool,
    canRedo: canRedoDraftingWorkspace,
    canUndo: canUndoDraftingWorkspace,
    contentType: selectedContentType,
    contentValues: selectedContentValues,
    contentValidation: selectedContentValidation,
    cornersSettings: desktopCornersSettings,
    backgroundSettings: desktopBackgroundSettings,
    backgroundInspectorTab,
    effectsSettings: desktopEffectsSettings,
    encodedContentValue: selectedContentValue,
    encodingSettings: desktopEncodingSettings,
    accessibilitySettings: desktopAccessibilitySettings,
    exportSettings: desktopExportSettings,
    imageSettings: desktopImageSettings,
    layoutSettings: desktopLayoutSettings,
    layersSettings: desktopLayersSettings,
    logoSettings: desktopLogoSettings,
    motionSettings: selectedDotMatrixAnimation as DesktopMotionSettings,
    patternSettings: desktopPatternSettings,
    sceneTemplateSettings: desktopSceneTemplateSettings,
    shapeSettings: desktopShapeSettings,
    textSettings: desktopTextSettings,
    insertNodeId: activeQrNodeId,
    composeSidebarPanel,
    selectedElementLayer,
    selectedLayerIds,
    selectedTransformLayer: propertiesTransformLayer,
    selectedAppearanceLayer: appearanceTargetLayer,
    appearanceSnapshot: desktopAppearanceSnapshot,
    scanSafetyResult,
    canvasTool: paneToolbarVariant === "desktop-zoom" ? desktopCanvasTool : undefined,
    onCanvasToolChange:
      paneToolbarVariant === "desktop-zoom" ? setDesktopCanvasTool : undefined,
    canAddQrCode: qrCanvasLayers.length < 10,
    onAddQrCode: () => {
      void handleAddQrCode()
    },
    onAddTextLayerAt: handleAddTextLayerAt,
    canRemoveQrCode,
    onRemoveQrCode:
      canRemoveQrCode && selectedLayerId
        ? () => handleRemoveQrCode(selectedLayerId)
        : undefined,
    onInsertLayer: handleInsertLayer,
    onOpenComposeSidebar: (panel) => {
      setComposeSidebarPanel(panel)
      selectSingleLayer(null)
    },
    onCloseComposeSidebar: () => {
      setComposeSidebarPanel(null)
    },
    onSelectWallpaper: (imagePath) => {
      updateDesktopImageSettings({ remoteUrl: imagePath, sourceMode: "url" })
      setComposeSidebarPanel(null)
    },
    onCanvasBackgroundTabChange: (tab) => {
      setSelectedCardState((current) => {
        if (tab === "shader") {
          return { ...current, styleMode: "paper-shader" }
        }

        if (tab === "image") {
          return {
            ...current,
            styleMode: current.cardImage.value ? "image" : current.styleMode,
          }
        }

        return {
          ...current,
          styleMode: "solid",
        }
      })
    },
    onElementLayerPatch: (patch) => {
      if (selectedElementLayer) {
        handleLayerChange(activeQrNodeId, selectedElementLayer.id, patch)
      }
    },
    onAppearancePatch: handleDesktopAppearancePatch,
    onTransformLayerPatch: (patch) => {
      const target = selectedTransformLayer ?? propertiesTransformLayer
      if (target) {
        handleLayerChange(activeQrNodeId, target.id, patch)
      }
    },
    onActiveToolChange: (toolId) => {
      setComposeSidebarPanel(null)
      setDesktopCanvasTool("select")
      setDesktopRailTool(toolId)
    },
    onRedo: handleRedoDraftingWorkspace,
    onResetDefaults: resetDraftingWorkspace,
    onSave: handleSaveDraftingWorkspace,
    onUndo: handleUndoDraftingWorkspace,
    onContentReset: resetDesktopContent,
    onContentTypeChange: handleDraftingContentTypeChange,
    onContentPasteApply: handleDraftingContentPasteApply,
    onContentValueChange: handleDraftingContentValueChange,
    onCornersReset: () => qrControls.applyQrState(createDefaultDraftingWorkspaceQrState()),
    onCornersSettingsChange: updateDesktopCornersSettings,
    onBackgroundReset: () =>
      setSelectedCardState((current) => ({
        ...current,
        paperShader: createDefaultDraftingCardState().paperShader,
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
    onBackgroundInspectorTabChange: setBackgroundInspectorTab,
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
      setSelectedQrTypeNumber(DEFAULT_DRAFTING_STUDIO_STATE.qrOptions.typeNumber)
      setSelectedQrErrorCorrectionLevel(DEFAULT_DRAFTING_STUDIO_STATE.qrOptions.errorCorrectionLevel)
      setSelectedBoostLevel(DEFAULT_DRAFTING_STUDIO_STATE.qrOptions.boostLevel)
      setSelectedQrMode(DEFAULT_DRAFTING_STUDIO_STATE.qrOptions.mode)
      setSelectedValueSegmentsText("")
    },
    onEncodingSettingsChange: updateDesktopEncodingSettings,
    onAccessibilityReset: () => setSelectedAriaLabel(""),
    onAccessibilitySettingsChange: updateDesktopAccessibilitySettings,
    onLayoutPresetSelect: (preset) => {
      setSceneCompositionByNodeId((current) =>
        applySceneCompositionPatch(current, activeQrNodeId, { layout: preset }),
      )
    },
    onLayoutSettingsChange: (patch) => {
      setSceneCompositionByNodeId((current) =>
        applySceneCompositionPatch(current, activeQrNodeId, {
          layout: { ...activeSceneComposition.layout, ...patch },
        }),
      )
    },
    onSceneTemplateSizeChange: (patch) => {
      updateDesktopShapeSettings({
        cardHeight: patch.cardHeight,
        cardWidth: patch.cardWidth,
        lockAspectRatio: patch.lockAspectRatio,
        sizeMode: patch.sizeMode,
        sizePresetId: patch.sizePresetId,
      })
    },
    onSceneTemplateSizeTemplateSelect: (template) => {
      const canvasSize = getCanvasSizeFromTemplate(template)
      updateDesktopShapeSettings({
        cardHeight: canvasSize.height,
        cardWidth: canvasSize.width,
        lockAspectRatio: true,
        sizeMode: "fixed",
        sizePresetId: template.id,
      })
    },
    onExportDownload: () => {
      void handleDownload()
    },
    onExportCancel: () => {
      cancelWorkspaceExport()
    },
    canExportDownload: canDownload,
    canExportVideo,
    exportInProgress,
    exportProgressLabel,
    exportProgressRatio,
    exportDownloadError,
    onExportReset: () => {
      setExportDownloadError(null)
      setSelectedDownloadExtension("png")
      setSelectedDownloadTarget("surface")
      setSelectedPhotoLongEdge(DEFAULT_DESKTOP_EXPORT_SETTINGS.photoLongEdge)
      setSelectedExportMediaKind(DEFAULT_DESKTOP_EXPORT_SETTINGS.mediaKind)
      setSelectedVideoDurationSeconds(DEFAULT_DESKTOP_EXPORT_SETTINGS.videoDurationSeconds)
      setSelectedVideoFormat(DEFAULT_DESKTOP_EXPORT_SETTINGS.videoFormat)
      setSelectedVideoFrameRate(DEFAULT_DESKTOP_EXPORT_SETTINGS.videoFrameRate)
      setSelectedVideoLongEdge(DEFAULT_DESKTOP_EXPORT_SETTINGS.videoLongEdge)
    },
    onExportSettingsChange: updateDesktopExportSettings,
    onImageReset: resetDesktopShapeSettings,
    onImageSettingsChange: updateDesktopImageSettings,
    onLayersReset: () =>
      setLayerStateByNodeId((current) => ({
        ...current,
        [activeQrNodeId]: createDefaultDraftingLayers(activeQrNodeId, draftingQraftyState, selectedCardState),
      })),
    onLayersSettingsChange: updateDesktopLayersSettings,
    onLayersReorder: handleLayerReorder,
    onLayerDelete: (layerId: string) => {
      handleLayerAction(activeQrNodeId, [layerId], "delete")
    },
    onLayerMenuAction: (action) => {
      handleLayerAction(activeQrNodeId, selectedLayerIds, action)
    },
    onLayerCopy: () => {
      void copySelectedDraftingLayers(selectedLayerIds)
    },
    canCopyLayers: selectedLayerIds.length > 0,
    canDeleteLayer: (layerId: string) => isLayerDeletable(layerId, activeCanvasLayers),
    onLogoReset: resetDesktopLogoSettings,
    onLogoSettingsChange: updateDesktopLogoSettings,
    onMotionReset: () => setSelectedDotMatrixAnimation({ ...DEFAULT_DRAFTING_STUDIO_STATE.dotMatrixAnimation }),
    onMotionSettingsChange: updateDesktopMotionSettings,
    onPatternReset: resetDesktopPatternSettings,
    onPatternSettingsChange: updateDesktopPatternSettings,
    onUnifiedQrFillSettingsChange: updateDesktopUnifiedQrFillSettings,
    onShapeReset: resetDesktopShapeSettings,
    onShapeSettingsChange: updateDesktopShapeSettings,
    onTextReset: () => updateDesktopTextSettings({ ...DEFAULT_DRAFTING_TEXT_LAYER }),
    onTextSettingsChange: updateDesktopTextSettings,
  }), [
    activeQrNodeId,
    appearanceTargetLayer,
    backgroundInspectorTab,
    canDownload,
    canExportVideo,
    canRedoDraftingWorkspace,
    canRemoveQrCode,
    canUndoDraftingWorkspace,
    composeSidebarPanel,
    desktopAccessibilitySettings,
    desktopActiveTool,
    desktopAppearanceSnapshot,
    desktopBackgroundSettings,
    desktopCanvasTool,
    desktopCornersSettings,
    desktopEffectsSettings,
    desktopEncodingSettings,
    desktopExportSettings,
    desktopImageSettings,
    desktopLayersSettings,
    desktopLayoutSettings,
    desktopLogoSettings,
    desktopPatternSettings,
    desktopSceneTemplateSettings,
    desktopShapeSettings,
    desktopTextSettings,
    exportDownloadError,
    exportInProgress,
    exportProgressLabel,
    exportProgressRatio,
    paneToolbarVariant,
    propertiesTransformLayer,
    qrCanvasLayers.length,
    scanSafetyResult,
    selectedContentType,
    selectedContentValidation,
    selectedContentValue,
    selectedContentValues,
    selectedDotMatrixAnimation,
    selectedElementLayer,
    selectedLayerId,
    selectedLayerIds,
    selectedTransformLayer,
  ])

  return (
    <section
      ref={draftingSurfaceRef}
      aria-label="Drafting workspace"
      data-logo-color-mode={selectedLogoColorMode}
      data-background-shape-id={selectedBackgroundShapeId}
      data-logo-preset-id={selectedLogoPresetId ?? ""}
      data-logo-preset-value={selectedLogoPresetValue ?? ""}
      data-logo-source-mode={selectedLogoSourceMode}
      data-qr-content-type={selectedContentType}
      data-qr-content-value={selectedContentValue}
      data-qr-error-correction-level={selectedQrErrorCorrectionLevel}
      data-qr-margin={selectedQrMargin}
      data-qr-radius={selectedQrRadius}
      data-qr-size={selectedQrSize}
      data-qr-type-number={selectedQrTypeNumber}
      data-slot="drafting-surface"
      tabIndex={-1}
      className={cn(
        "relative grid h-dvh w-full overflow-hidden overscroll-none bg-[var(--ws-surface-bg)] outline-none focus:outline-none focus-visible:outline-none sm:h-dvh lg:shadow-[var(--ws-shadow-shell)]",
        "grid-rows-1 sm:h-dvh",
      )}
      data-compose-edit-mode="false"
      data-compose-selected-node-id={activeQrNodeId ?? ""}
    >
      <MobileWorkspaceInsetTransitionBridge />

      <div
        data-slot="drafting-content-grid"
        className="min-h-0 min-w-0 block h-full"
      >
        <section
          aria-label="Workspace frame"
          data-slot="drafting-workspace"
          data-desktop-canvas-frame="true"
          className={cn("min-h-0 min-w-0 overflow-hidden", "h-full")}
        >
          <div
            data-slot="drafting-workspace-inset"
            className="h-full min-h-0 p-0"
          >
            <div
              data-slot="desktop-canvas-viewport"
              className="h-full min-h-0 min-w-0"
            >
            {isDraftingWorkspaceReady ? (
            <Canvas
              activePaneId={activeQrNodeId}
              layerEditingEnabled
              onLayerChange={handleLayerChange}
              onLayerAction={handleLayerAction}
              onLayerCopy={(_paneId, layerIds) => {
                void copySelectedDraftingLayers(layerIds, _paneId)
              }}
              activeCanvasTool={desktopCanvasTool}
              onAddTextLayerAt={handleAddTextLayerAt}
              onCanvasToolChange={setDesktopCanvasTool}
              onLayerPaste={(_paneId, point) => {
                void pasteDraftingLayers(point, undefined, _paneId)
              }}
              onLayerSelect={handleLayerSelect}
              onLayerSelectionChange={handleLayerSelectionChange}
              onPaneQrClick={handlePaneQrClick}
              onPaneSelect={handlePaneSelection}
              panes={panes}
              fitCanvasToViewport
              toolbarVariant={paneToolbarVariant}
              selectedLayerId={selectedLayerId}
              selectedLayerIds={selectedLayerIds}
            />
            ) : (
              <div
                aria-busy="true"
                aria-label="Loading workspace"
                className="grid h-full place-items-center text-sm font-medium text-[var(--ws-ink-muted)]"
                data-slot="drafting-workspace-loading"
              >
                Loading workspace…
              </div>
            )}
            </div>
          </div>
        </section>
      </div>
      {renderOverlay ? renderOverlay(desktopController) : null}
    </section>
  )
}
