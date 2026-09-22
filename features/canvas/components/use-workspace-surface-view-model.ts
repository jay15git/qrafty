"use client"

import { type ReactNode, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"

import type {
  QrErrorCorrectionLevel,
  QrFinderPatternOuterStyle,
  QrMode,
  QrTypeNumber,
} from "@/features/qr/model/types"
import type { QraftyCornerDotStyle } from "@/features/qr/model/state"

import {
  cloneDraftingCardState,
  createDefaultDraftingCardState,
  normalizeDraftingCardState,
  type DraftingCardState,
} from "@/features/canvas/model/card-state"
import { createUniformCornerRadii } from "@/features/canvas/model/corner-radius"
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
} from "@/features/canvas/model/layers"
import {
  cloneDraftingQrState,
  cloneDraftingWorkspaceDocument,
  createDefaultDraftingWorkspaceDocument,
  createDefaultDraftingWorkspaceQrState,
  type DraftingCardStateByNodeId,
  type DraftingContentValuesByType,
  type DraftingQrStateByNodeId,
  type DraftingWorkspaceDocumentV1,
} from "@/features/canvas/model/document"
import {
  applySceneCompositionPatch,
  cloneSceneCompositionByNodeId,
  createDefaultSceneCompositionByNodeId,
  type SceneCompositionByNodeId,
} from "@/features/canvas/model/apply-scene-template"
import {
  createDefaultSceneComposition,
  normalizeSceneComposition,
} from "@/features/canvas/model/scene-templates"
import { getCanvasSizeFromTemplate } from "@/features/canvas/model/size-templates"
import { sceneHasVideoExportContent } from "@/features/canvas/export/pipeline/clock"
import {
  buildDraftingWorkspaceDocumentFromState,
  mergeLiveQrStateByLayerId,
  resolveActiveQrLayerIdFromLayers,
} from "@/features/canvas/components/workspace-surface-document"
import {
  applyCornersSettingsPatchToQraftyState,
  applyLogoSettingsPatchToQraftyState,
  applyPatternSettingsPatchToQraftyState,
} from "@/features/canvas/components/workspace-qr-settings-patch"
import { clearDraftingQrMarkupCache } from "@/features/canvas/hooks/use-drafting-qr-markup"
import { clearQrEncodeMarkupCache } from "@/features/qr/rendering/qr-encode-cache"
import {
  buildDesktopToolbarSettingsSnapshots,
  pickDesktopToolbarSettingsSnapshots,
} from "@/features/canvas/components/workspace-desktop-settings-snapshots"
import {
  DEFAULT_DRAFTING_PANE_QR_SIZE,
  DEFAULT_DRAFTING_STUDIO_STATE,
  replaceTrackedObjectUrl,
  type DraftingDownloadExtension,
} from "@/features/canvas/components/workspace-surface.constants"
import {
  Canvas,
  type DraftingPaneToolbarVariant,
} from "@/features/canvas/components/Canvas"
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
} from "@/features/shell/model/desktop-toolbar-types"
import type { UnifiedQrFillPatches } from "@/features/shell/inspector/settings-bridge"
import { DEFAULT_DESKTOP_EXPORT_SETTINGS } from "@/features/shell/model/desktop-toolbar-defaults"
import {
  buildDesktopAppearancePatch,
  getDesktopAppearanceSnapshot,
  type DesktopAppearancePatch,
} from "@/features/shell/model/appearance"
import {
  findBrandIconById,
  type BrandIconCategory,
  type BrandIconEntry,
} from "@/features/qr/assets/brand-icons"
import {
  parseIconstackSelectionId,
} from "@/features/qr/assets/iconstack-api"
import {
} from "@/features/qr/assets/iconstack-svg"
import { useQrScanSafety } from "@/features/qr/hooks/useQrScanSafety"
import { previewSession } from "@/features/canvas/preview/preview-session"
import { MobileWorkspaceInsetTransitionBridge } from "@/features/canvas/components/MobileWorkspaceInsetTransitionBridge"
import {
  createBrandIconDataUrl,
} from "@/features/qr/assets/brand-icon-svg"
import {
  applyAssetNoneSelection,
  applyAssetUrlValue,
  applyLogoPresetColor,
} from "@/features/qr/model/actions"
import { applyAssetUploadValue } from "@/features/qr/model/actions"
import { isRasterExportExtension } from "@/features/qr/export/raster-export"
import {
  DASHBOARD_QR_NODE_ID,
} from "@/features/qr/rendering/compose-scene"
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
} from "@/features/qr/model/state"
import { type QrBackgroundShapeId } from "@/features/qr/styles/background-shapes"
import {
  buildStaticQrPayload,
  getDefaultStaticQrValues,
  getContentValuesForTypeChange,
  resolveContentValuesForType,
  validateStaticQrContent,
  type StaticQrContentValue,
  type StaticQrContentValues,
} from "@/features/qr/content/static-payload"
import {
  getPlatformDefaultValuesForIntent,
  isPlatformType,
} from "@/features/qr/content/platform-intents"
import {
  DEFAULT_QR_INPUT_TYPE,
  type QrInputType,
} from "@/features/qr/content/input-options"
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
} from "@/features/canvas/components/workspace-surface-helpers"
import {
  type DraftingAssetSourceMode,
  useWorkspaceSurfaceReducer,
} from "@/features/canvas/components/workspace-surface-reducer"
import { useDraftingHistory } from "@/features/canvas/canvas/use-drafting-history"
import { useWorkspaceExport } from "@/features/canvas/canvas/use-workspace-export"
import { createQrControls } from "@/features/canvas/canvas/qr-controls"
import { useQrLogoActions } from "@/features/canvas/canvas/use-qr-logo-actions"
import { useLayerActions } from "@/features/canvas/canvas/use-layer-actions"
import { useInspectorActions } from "@/features/canvas/canvas/use-inspector-actions"
import {
  useDraftingShortcuts,
  type DraftingShortcutHandlers,
} from "@/features/canvas/canvas/use-drafting-shortcuts"
type DraftingBrandIconCategoryFilter = BrandIconCategory | "all"

type DraftingWorkspaceController = DesktopToolbarController

type WorkspaceSurfaceViewModelInput = {
  initialActiveTool?: DesktopToolbarToolId
  paneToolbarVariant: DraftingPaneToolbarVariant
}

function resolveSelectedContentValues(
  contentValuesByType: DraftingContentValuesByType,
  selectedContentType: QrInputType,
) {
  return (
    contentValuesByType[selectedContentType] ?? getDefaultStaticQrValues(selectedContentType)
  )
}

function resolveActiveSceneComposition(
  sceneCompositionByNodeId: SceneCompositionByNodeId,
  activeQrNodeId: string,
) {
  return normalizeSceneComposition(
    sceneCompositionByNodeId[activeQrNodeId] ?? createDefaultSceneComposition(),
  )
}

function resolveActiveCanvasLayers(
  layerStateByNodeId: DraftingLayerStateByNodeId,
  activeQrNodeId: string,
  draftingQraftyState: QraftyState,
  selectedCardState: DraftingCardState,
) {
  return (
    layerStateByNodeId[activeQrNodeId] ??
    createDefaultDraftingLayers(activeQrNodeId, draftingQraftyState, selectedCardState)
  )
}

function resolveSelectedTextLayer(
  activeCanvasLayers: DraftingCanvasLayer[],
  selectedLayerId: string | null,
) {
  return selectedLayerId ? findDraftingLayerById(activeCanvasLayers, selectedLayerId) : null
}

function resolveSelectedElementLayer(
  selectedLayerIds: string[],
  selectedTextLayer: DraftingCanvasLayer | null,
) {
  return selectedLayerIds.length === 1 && selectedTextLayer &&
    (selectedTextLayer.kind === "text" ||
      selectedTextLayer.kind === "shape" ||
      selectedTextLayer.kind === "image" ||
      selectedTextLayer.kind === "shader")
    ? selectedTextLayer
    : null
}

function resolveQrBackgroundSurfaceVisible(draftingQraftyState: QraftyState) {
  return (
    !hasBackgroundImage(draftingQraftyState) &&
    (!draftingQraftyState.backgroundOptions.transparent ||
      draftingQraftyState.backgroundGradient.enabled ||
      hasActiveBackgroundShapeOptions(draftingQraftyState.backgroundShapeOptions))
  )
}

function resolveDesktopLayerTargets(
  activeCanvasLayers: DraftingCanvasLayer[],
  selectedLayerIds: string[],
  selectedTransformLayer: DraftingCanvasLayer | null,
) {
  const fallbackAppearanceLayer =
    activeCanvasLayers.find((layer) => layer.kind === "card") ?? null
  const appearanceTargetLayer = selectedTransformLayer ?? fallbackAppearanceLayer
  const transformTargetLayer =
    selectedTransformLayer ??
    (selectedLayerIds.length === 0 ? appearanceTargetLayer : null)
  const propertiesTransformLayer =
    transformTargetLayer?.kind === "card" ? null : transformTargetLayer

  return {
    appearanceTargetLayer,
    propertiesTransformLayer,
    transformTargetLayer,
  }
}

function resolveDesktopAppearanceSnapshot(
  appearanceTargetLayer: DraftingCanvasLayer | null,
  selectedCardState: DraftingCardState,
  draftingQraftyState: QraftyState,
  qrBackgroundSurfaceVisible: boolean,
) {
  return appearanceTargetLayer
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
}

function resolveCanRemoveQrCode(
  paneToolbarVariant: DraftingPaneToolbarVariant,
  qrCanvasLayers: DraftingCanvasLayer[],
  selectedLayerId: string | null,
) {
  return (
    paneToolbarVariant === "desktop-zoom" &&
    qrCanvasLayers.length > 1 &&
    Boolean(selectedLayerId?.includes(":qr"))
  )
}

export function useWorkspaceSurfaceViewModel({
  initialActiveTool,
  paneToolbarVariant,
}: WorkspaceSurfaceViewModelInput) {
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
  const selectedContentValues = resolveSelectedContentValues(
    contentValuesByType,
    selectedContentType,
  )
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
  const activeSceneComposition = resolveActiveSceneComposition(
    sceneCompositionByNodeId,
    activeQrNodeId,
  )

  const qrNodeIds = useMemo(() => [DASHBOARD_QR_NODE_ID], [])
  const activeCanvasLayers = resolveActiveCanvasLayers(
    layerStateByNodeId,
    activeQrNodeId,
    draftingQraftyState,
    selectedCardState,
  )
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
  )
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
  const selectedTextLayer = resolveSelectedTextLayer(activeCanvasLayers, selectedLayerId)
  const selectedElementLayer = resolveSelectedElementLayer(selectedLayerIds, selectedTextLayer)
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
  const {
    appearanceTargetLayer,
    propertiesTransformLayer,
    transformTargetLayer,
  } = resolveDesktopLayerTargets(
    activeCanvasLayers,
    selectedLayerIds,
    selectedTransformLayer,
  )
  const qrBackgroundSurfaceVisible = resolveQrBackgroundSurfaceVisible(draftingQraftyState)
  const desktopAppearanceSnapshot = resolveDesktopAppearanceSnapshot(
    appearanceTargetLayer,
    selectedCardState,
    draftingQraftyState,
    qrBackgroundSurfaceVisible,
  )

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
  } = useInspectorActions({
    activeCanvasLayers,
    activeQrNodeId,
    appearanceTargetLayer,
    commitActiveQraftyState,
    draftingQraftyState,
    handleLayerChange,
    handleLayerSelect,
    layerStateByNodeId,
    logoActions,
    logoUploadObjectUrlRef,
    persistActiveQrLayerState,
    qrBackgroundSurfaceVisible,
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
  })

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
    [scanSafetyCardLayer, resolveWorkspaceExportTargetDimensions],
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

  const canRemoveQrCode = resolveCanRemoveQrCode(
    paneToolbarVariant,
    qrCanvasLayers,
    selectedLayerId,
  )

  const desktopController: DraftingWorkspaceController = {
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
  }

  return {
    activeQrNodeId,
    desktopCanvasTool,
    desktopController,
    draftingSurfaceRef,
    isDraftingWorkspaceReady,
    panes,
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
    copySelectedDraftingLayers,
    handleAddTextLayerAt,
    handleLayerAction,
    handleLayerChange,
    handleLayerSelect,
    handleLayerSelectionChange,
    handlePaneQrClick,
    handlePaneSelection,
    pasteDraftingLayers,
    setDesktopCanvasTool,
  }
}
