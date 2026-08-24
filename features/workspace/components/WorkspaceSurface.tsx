"use client"

import { useLazyRef } from "@/hooks/use-lazy-ref"
import { type ReactNode, useEffect, useMemo, useRef } from "react"

import type {
  QrErrorCorrectionLevel,
  QrFinderPatternOuterStyle,
  QrMode,
  QrTypeNumber,
} from "@/features/qr-code/model/types"
import type { StudioCornerDotStyle } from "@/features/qr-code/model/state"

import {
  cloneDraftingCardState,
  createDefaultDraftingCardState,
  normalizeDraftingCardState,
  type DraftingCardState,
} from "@/features/workspace/model/card-state"
import { createUniformCornerRadii } from "@/features/workspace/model/corner-radius"
import {
  alignDraftingCanvasLayers,
  clampLayerGeometryToCanvas,
  cloneDraftingCanvasLayer,
  cloneDraftingCanvasLayersForPaste,
  createDraftingTextLayer,
  createDraftingImageLayer,
  createDefaultDraftingLayers,
  createDraftingQrLayer,
  DEFAULT_DRAFTING_TEXT_LAYER,
  distributeDraftingCanvasLayers,
  fitQrSizeInCard,
  getDraftingCardLayerId,
  getDraftingQrLayerId,
  getQrCanvasLayers,
  groupDraftingCanvasLayers,
  isDraftingCardLayerId,
  isDraftingQrLayerId,
  isLayerDeletable,
  isProtectedDraftingLayerId,
  layoutDraftingCardInsetLayers,
  patchDraftingCanvasLayer,
  reorderDraftingCanvasLayer,
  ungroupDraftingCanvasLayer,
  type DraftingCanvasLayer,
  type DraftingLayerAlignAction,
  type DraftingLayerDistributeAction,
  type DraftingLayerReorderAction,
  type DraftingLayerStateByNodeId,
} from "@/features/workspace/model/layers"
import {
  cloneDraftingQrState,
  cloneDraftingWorkspaceDocument,
  createDefaultDraftingWorkspaceDocument,
  createDefaultDraftingWorkspaceQrState,
  serializeDraftingWorkspaceDocument,
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
  getExportPreset,
  resolveExportDimensions,
  type ExportPresetId,
} from "@/features/workspace/model/export-presets"
import {
  createDefaultSceneComposition,
  normalizeSceneComposition,
} from "@/features/workspace/model/scene-templates"
import { getCanvasSizeFromTemplate } from "@/features/workspace/model/size-templates"
import { writeDraftingWorkspaceDraft } from "@/features/workspace/model/storage"
import { resolveWorkspaceBootstrapDocument } from "@/features/workspace/model/workspace-bootstrap"
import {
  buildDraftingLayeredNodePayload,
} from "@/features/workspace/export/layered-export"
import {
  buildDraftingWorkspaceDocumentFromState,
  mergeLiveQrStateByLayerId,
  resolveActiveQrLayerIdFromLayers,
} from "@/features/workspace/components/workspace-surface-document"
import { clearDraftingQrMarkupCache } from "@/features/workspace/hooks/use-drafting-qr-markup"
import {
  buildDesktopToolbarSettingsSnapshots,
  pickDesktopToolbarSettingsSnapshots,
} from "@/features/workspace/components/workspace-desktop-settings-snapshots"
import {
  DEFAULT_DRAFTING_PANE_QR_SIZE,
  DEFAULT_DRAFTING_RASTER_EXPORT_PRESET_ID,
  DEFAULT_DRAFTING_STUDIO_STATE,
  DEFAULT_DOWNLOAD_NAME,
  DRAFTING_LAYER_PASTE_OFFSET,
  DRAFTING_RASTER_EXPORT_PRESETS,
  replaceTrackedObjectUrl,
  type DraftingDownloadExtension,
  type DraftingRasterExportPresetId,
} from "@/features/workspace/components/workspace-surface.constants"
import {
  Canvas,
  type DraftingPaneCanvasTool,
  type DraftingPaneToolbarVariant,
} from "@/features/workspace/components/Canvas"
import type {
  DesktopBackgroundInspectorTab,
  DesktopBackgroundSettings,
  DesktopCornersSettings,
  DesktopEncodingSettings,
  DesktopAccessibilitySettings,
  DesktopEffectsSettings,
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
import {
  buildDesktopAppearancePatch,
  getDesktopAppearanceSnapshot,
} from "@/features/desktop-shell/model/appearance"
import type { DraftingLayerMenuAction } from "@/features/workspace/components/Pane"
import {
  findBrandIconById,
  type BrandIconCategory,
  type BrandIconEntry,
} from "@/features/qr-code/assets/brand-icons"
import {
  fetchIconSvg,
  parseIconstackSelectionId,
} from "@/features/qr-code/assets/iconstack-api"
import {
  createIconstackIconDataUrl,
  createIconstackIconGradientDataUrl,
} from "@/features/qr-code/assets/iconstack-svg"
import { useQrScanSafety } from "@/features/qr-code/hooks/useQrScanSafety"
import {
  createBrandIconDataUrl,
  createBrandIconGradientDataUrl,
  DEFAULT_BRAND_ICON_COLOR,
} from "@/features/qr-code/assets/brand-icon-svg"
import {
  applyAssetNoneSelection,
  applyAssetUrlValue,
  applyLogoPresetColor,
  applyLogoPresetGradient,
  applyLogoPresetSelection,
} from "@/features/qr-code/model/actions"
import { applyAssetUploadValue, applyIconstackLogoPresetSelection } from "@/features/qr-code/model/actions"
import {
  downloadDashboardQrBatchZipExport,
  downloadDashboardQrNodeExport,
} from "@/features/qr-code/export/batch-export"
import { isRasterExportExtension } from "@/features/qr-code/export/raster-export"
import {
  DASHBOARD_QR_NODE_ID,
} from "@/features/qr-code/rendering/compose-scene"
import {
  clampQrBackgroundRound,
  type BackgroundShapeOptions,
  type DotsColorMode,
  type QrDotMatrixAnimationOptions,
  type QrCrossOrigin,
  type QrGradientLinkMode,
  type QrLogoPositionMode,
  type QrLogoSizeMode,
  type QrStudioState,
  type StudioDataModulesStyle,
  type StudioGradient,
  setDotMatrixAnimationOptions,
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
  getDraftingLayerClipboardPayload,
  getDraftingQrNodeDownloadTarget,
  isEditableShortcutTarget,
  parseDraftingLayerClipboardPayload,
  parseValueSegmentsText,
  patchDraftingLayerById,
  toDesktopLayerRow,
  ensureMandatoryDesktopLayerRows,
  type DraftingDownloadTarget,
} from "@/features/workspace/components/workspace-surface-helpers"
import {
  type DraftingAssetSourceMode,
  type DraftingBinaryColorMode,
  useWorkspaceSurfaceReducer,
} from "@/features/workspace/components/workspace-surface-reducer"
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
      desktopSnapEnabled,
      selectedDownloadExtension,
      selectedDownloadTarget,
      exportDownloadError,
      selectedRasterExportPresetId,
      selectedExportPresetId,
      selectedUsePlatformExportPreset,
      isDraftingWorkspaceReady,
      draftingHistoryRevision,
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
      setDesktopSnapEnabled,
      setSelectedDownloadExtension,
      setSelectedDownloadTarget,
      setExportDownloadError,
      setSelectedRasterExportPresetId,
      setSelectedExportPresetId,
      setSelectedUsePlatformExportPreset,
      setIsDraftingWorkspaceReady,
      setDraftingHistoryRevision,
      setLogoUploadObjectUrl,
      setModuleFillUploadObjectUrl,
    },
  ] = useWorkspaceSurfaceReducer(initialActiveTool)
  const openDotsColorItemsRef = useLazyRef(() => new Set<DotsColorMode>(["solid"]))
  const openCornerSquareColorItemsRef = useLazyRef(
    () => new Set<DraftingBinaryColorMode>(["solid"]),
  )
  const openCornerDotColorItemsRef = useLazyRef(
    () => new Set<DraftingBinaryColorMode>(["solid"]),
  )
  const openBackgroundColorItemsRef = useLazyRef(
    () => new Set<DraftingBinaryColorMode>(["solid"]),
  )
  const openBackgroundUploadItemsRef = useLazyRef(
    () => new Set<DraftingAssetSourceMode>(["upload"]),
  )
  const openLogoColorItemsRef = useLazyRef(
    () => new Set<DraftingBinaryColorMode>(["solid"]),
  )
  const brandIconQueryRef = useRef("")
  const brandIconCategoryRef = useRef<DraftingBrandIconCategoryFilter>("all")
  const openLogoUploadItemsRef = useLazyRef(
    () => new Set<DraftingAssetSourceMode>(["upload"]),
  )
  const draftingWorkspaceAutosaveTimerRef = useRef<number | null>(null)
  const draftingWorkspaceHistoryTimerRef = useRef<number | null>(null)
  const draftingWorkspaceHistoryRef = useRef<DraftingWorkspaceDocumentV1[]>([])
  const draftingWorkspaceHistoryIndexRef = useRef(-1)
  const isApplyingDraftingWorkspaceHistoryRef = useRef(false)
  const shouldReplaceCurrentDraftingHistoryEntryRef = useRef(false)
  const draftingSurfaceRef = useRef<HTMLElement | null>(null)
  const iconstackSvgCacheRef = useRef<Map<string, string>>(new Map())
  const draftingLayerClipboardRef = useRef<string>("")
  const logoUploadObjectUrlRef = useRef<string | null>(null)
  const moduleFillUploadObjectUrlRef = useRef<string | null>(null)
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
  const draftingStudioState = useMemo<QrStudioState>(
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
  const keyboardStateRef = useRef({
    activeQrLayerId,
    activeQrNodeId,
    draftingStudioState,
    layerStateByNodeId,
    qrLayerCount: getQrCanvasLayers(
      layerStateByNodeId[activeQrNodeId] ??
        createDefaultDraftingLayers(activeQrNodeId, draftingStudioState, selectedCardState),
    ).length,
    selectedCardState,
    selectedLayerIds,
  })
  const ensureDotsColorItemExpanded = (itemId: DotsColorMode) => {
    openDotsColorItemsRef.current.add(itemId)
  }
  const ensureCornerSquareColorItemExpanded = (itemId: DraftingBinaryColorMode) => {
    openCornerSquareColorItemsRef.current.add(itemId)
  }
  const ensureCornerDotColorItemExpanded = (itemId: DraftingBinaryColorMode) => {
    openCornerDotColorItemsRef.current.add(itemId)
  }
  const ensureBackgroundColorItemExpanded = (itemId: DraftingBinaryColorMode) => {
    openBackgroundColorItemsRef.current.add(itemId)
  }
  const ensureLogoColorItemExpanded = (itemId: DraftingBinaryColorMode) => {
    openLogoColorItemsRef.current.add(itemId)
  }
  const ensureBackgroundUploadItemExpanded = (itemId: DraftingAssetSourceMode) => {
    openBackgroundUploadItemsRef.current.add(itemId)
  }
  const ensureLogoUploadItemExpanded = (itemId: DraftingAssetSourceMode) => {
    openLogoUploadItemsRef.current.add(itemId)
  }
  const canDownload = selectedContentValidation.isValid && Boolean(draftingStudioState.data.trim())
  const isDraftingRasterExport = isRasterExportExtension(selectedDownloadExtension)
  const selectedRasterExportPreset =
    DRAFTING_RASTER_EXPORT_PRESETS.find(
      (preset) => preset.id === selectedRasterExportPresetId,
    ) ?? DRAFTING_RASTER_EXPORT_PRESETS[1]
  const selectedRasterExportTargetSizePx = isDraftingRasterExport
    ? selectedRasterExportPreset.sizePx
    : undefined
  const selectedPlatformExportDimensions = useMemo(() => {
    if (!selectedUsePlatformExportPreset || !selectedExportPresetId) {
      return undefined
    }

    const preset = getExportPreset(selectedExportPresetId)
    return preset ? resolveExportDimensions(preset) : undefined
  }, [selectedExportPresetId, selectedUsePlatformExportPreset])
  const activeSceneComposition = normalizeSceneComposition(
    sceneCompositionByNodeId[activeQrNodeId] ?? createDefaultSceneComposition(),
  )

  const qrNodeIds = useMemo(() => [DASHBOARD_QR_NODE_ID], [])
  const activeCanvasLayers =
    layerStateByNodeId[activeQrNodeId] ??
    createDefaultDraftingLayers(activeQrNodeId, draftingStudioState, selectedCardState)
  const qrCanvasLayers = useMemo(
    () => getQrCanvasLayers(activeCanvasLayers),
    [activeCanvasLayers],
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
      draftingStudioState,
      layerStateByNodeId,
      qrStateByLayerId,
      sceneCompositionByNodeId,
      selectedCardState,
      selectedContentType,
    ],
  )
  const canUndoDraftingWorkspace =
    draftingHistoryRevision >= 0 && draftingWorkspaceHistoryIndexRef.current > 0
  const canRedoDraftingWorkspace =
    draftingHistoryRevision >= 0 &&
    draftingWorkspaceHistoryIndexRef.current <
      draftingWorkspaceHistoryRef.current.length - 1

  function syncDraftingLogoAsset(nextState: QrStudioState) {
    setSelectedLogoSourceMode(nextState.logo.source)
    setSelectedLogoPresetId(nextState.logo.presetId)
    setSelectedLogoPresetValue(
      nextState.logo.source === "preset" ? nextState.logo.value : undefined,
    )

    if (nextState.logo.source === "url") {
      setSelectedLogoAssetSourceMode("url")
      setSelectedLogoRemoteUrl(nextState.logo.value ?? "")
      setSelectedLogoUploadValue("")
    } else if (nextState.logo.source === "upload") {
      setSelectedLogoAssetSourceMode("upload")
      setSelectedLogoUploadValue(nextState.logo.value ?? "")
      setSelectedLogoRemoteUrl("")
    }
  }

  function syncDraftingLogoControlsFromState(nextState: QrStudioState) {
    syncDraftingLogoAsset(nextState)
    setSelectedLogoColor(nextState.logo.presetColor ?? DEFAULT_BRAND_ICON_COLOR)
    setSelectedLogoColorMode(nextState.logoGradient.enabled ? "gradient" : "solid")
    setSelectedLogoGradient(structuredClone(nextState.logoGradient))
    setSelectedLogoSize(Math.round(nextState.imageOptions.imageSize * 100))
    setSelectedLogoMargin(nextState.imageOptions.margin)
    setSelectedHideBackgroundDots(nextState.imageOptions.hideBackgroundDots)
    setSelectedLogoOpacity(nextState.imageOptions.opacity * 100)
    setSelectedLogoSizeMode(nextState.imageOptions.sizeMode)
    setSelectedLogoWidthPx(nextState.imageOptions.widthPx)
    setSelectedLogoHeightPx(nextState.imageOptions.heightPx)
    setSelectedLogoLockAspect(nextState.imageOptions.lockAspect)
    setSelectedLogoPositionMode(nextState.imageOptions.logoPositionMode)
    setSelectedLogoOffsetX(nextState.imageOptions.x ?? 0)
    setSelectedLogoOffsetY(nextState.imageOptions.y ?? 0)
    setSelectedLogoCrossOrigin(nextState.imageOptions.crossOrigin)
  }

  function commitActiveQrStudioState(nextState: QrStudioState) {
    syncDraftingLogoControlsFromState(nextState)
    persistActiveQrLayerState(nextState)
    clearDraftingQrMarkupCache()
  }

  function patchActiveQrLogoImageOptions(
    patch: Pick<
      DesktopLogoSettingsPatch,
      | "size"
      | "margin"
      | "hideBackgroundDots"
      | "opacity"
      | "sizeMode"
      | "widthPx"
      | "heightPx"
      | "lockAspect"
      | "positionMode"
      | "offsetX"
      | "offsetY"
      | "crossOrigin"
    >,
  ) {
    const nextImageOptions = { ...draftingStudioState.imageOptions }
    let changed = false

    if (patch.size !== undefined) {
      nextImageOptions.imageSize = patch.size / 100
      changed = true
    }
    if (patch.margin !== undefined) {
      nextImageOptions.margin = patch.margin
      changed = true
    }
    if (patch.hideBackgroundDots !== undefined) {
      nextImageOptions.hideBackgroundDots = patch.hideBackgroundDots
      changed = true
    }
    if (patch.opacity !== undefined) {
      nextImageOptions.opacity = patch.opacity / 100
      changed = true
    }
    if (patch.sizeMode) {
      nextImageOptions.sizeMode = patch.sizeMode
      changed = true
    }
    if (patch.widthPx !== undefined) {
      nextImageOptions.widthPx = patch.widthPx
      changed = true
    }
    if (patch.heightPx !== undefined) {
      nextImageOptions.heightPx = patch.heightPx
      changed = true
    }
    if (patch.lockAspect !== undefined) {
      nextImageOptions.lockAspect = patch.lockAspect
      changed = true
    }
    if (patch.positionMode) {
      nextImageOptions.logoPositionMode = patch.positionMode
      changed = true
    }
    if (patch.offsetX !== undefined) {
      nextImageOptions.x = patch.offsetX
      changed = true
    }
    if (patch.offsetY !== undefined) {
      nextImageOptions.y = patch.offsetY
      changed = true
    }
    if (patch.crossOrigin !== undefined) {
      nextImageOptions.crossOrigin = patch.crossOrigin
      changed = true
    }

    if (!changed) {
      return
    }

    commitActiveQrStudioState({
      ...draftingStudioState,
      imageOptions: nextImageOptions,
    })
  }

  function clearDraftingLogoPreset(nextSourceMode: DraftingAssetSourceMode) {
    const clearedState = applyAssetNoneSelection(draftingStudioState, "logo")

    setSelectedLogoAssetSourceMode(nextSourceMode)

    if (nextSourceMode === "upload") {
      commitActiveQrStudioState({
        ...clearedState,
        logo: {
          ...clearedState.logo,
          source: "upload",
          value: undefined,
        },
      })
      return
    }

    commitActiveQrStudioState(clearedState)
  }

  async function resolveIconstackSvgMarkup(selectionId: string) {
    const cached = iconstackSvgCacheRef.current.get(selectionId)
    if (cached) {
      return cached
    }

    const parsed = parseIconstackSelectionId(selectionId)
    if (!parsed) {
      return undefined
    }

    const response = await fetchIconSvg({
      library: parsed.library,
      id: parsed.iconId,
    })

    iconstackSvgCacheRef.current.set(selectionId, response.svg)
    return response.svg
  }

  async function handleDraftingIconstackIconSelection(selectionId: string) {
    const svg = await resolveIconstackSvgMarkup(selectionId)
    if (!svg) {
      return
    }

    const nextValue =
      selectedLogoColorMode === "gradient"
        ? createIconstackIconGradientDataUrl(svg, {
            ...structuredClone(selectedLogoGradient),
            enabled: true,
          })
        : createIconstackIconDataUrl(svg, selectedLogoColor)
    const nextState = applyIconstackLogoPresetSelection(
      draftingStudioState,
      selectionId,
      nextValue,
      selectedLogoColor,
    )

    commitActiveQrStudioState(nextState)
  }

  function handleDraftingBrandIconSelection(brandIcon: BrandIconEntry) {
    const nextValue =
      selectedLogoColorMode === "gradient"
        ? createBrandIconGradientDataUrl(brandIcon, {
            ...structuredClone(selectedLogoGradient),
            enabled: true,
          })
        : createBrandIconDataUrl(brandIcon, selectedLogoColor)
    const nextState = applyLogoPresetSelection(
      draftingStudioState,
      brandIcon,
      nextValue,
      selectedLogoColor,
    )

    commitActiveQrStudioState(nextState)
  }

  async function handleDraftingLogoColorChange(value: string) {
    ensureLogoColorItemExpanded("solid")

    const iconstackSelectionId = parseIconstackSelectionId(selectedLogoPresetId)
      ? selectedLogoPresetId
      : undefined

    if (iconstackSelectionId) {
      const svg = await resolveIconstackSvgMarkup(iconstackSelectionId)
      if (!svg) {
        return
      }

      const nextState = applyLogoPresetColor(
        draftingStudioState,
        createIconstackIconDataUrl(svg, value),
        value,
      )

      commitActiveQrStudioState(nextState)
      return
    }

    const selectedIcon = findBrandIconById(selectedLogoPresetId)

    if (!selectedIcon) {
      return
    }

    const nextState = applyLogoPresetColor(
      draftingStudioState,
      createBrandIconDataUrl(selectedIcon, value),
      value,
    )

    commitActiveQrStudioState(nextState)
  }

  async function handleDraftingLogoGradientChange(value: StudioGradient) {
    const nextGradient = {
      ...structuredClone(value),
      enabled: true,
    }

    ensureLogoColorItemExpanded("gradient")

    const iconstackSelectionId = parseIconstackSelectionId(selectedLogoPresetId)
      ? selectedLogoPresetId
      : undefined

    if (iconstackSelectionId) {
      const svg = await resolveIconstackSvgMarkup(iconstackSelectionId)
      if (!svg) {
        return
      }

      const nextState = applyLogoPresetGradient(
        draftingStudioState,
        createIconstackIconGradientDataUrl(svg, nextGradient),
        nextGradient,
      )

      commitActiveQrStudioState(nextState)
      return
    }

    const selectedIcon = findBrandIconById(selectedLogoPresetId)

    if (!selectedIcon) {
      return
    }

    const nextState = applyLogoPresetGradient(
      draftingStudioState,
      createBrandIconGradientDataUrl(selectedIcon, nextGradient),
      nextGradient,
    )

    commitActiveQrStudioState(nextState)
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

  function applyDraftingQrStateToControls(nextState: QrStudioState) {
    setSelectedQrMargin(nextState.margin)
    setSelectedQrRadius(clampQrBackgroundRound(nextState.backgroundOptions.round))
    setSelectedRasterExportQualityPercent(nextState.rasterExportQualityPercent)
    setSelectedQrSize(nextState.width)
    setSelectedDotType(nextState.dataModulesSettings.type)
    setSelectedDotsColorMode(nextState.dotsColorMode)
    setSelectedDotsPalette([...nextState.dotsPalette])
    setSelectedDotColor(nextState.dataModulesSettings.color)
    setSelectedDotsGradient(structuredClone(nextState.dataModulesGradient))
    setSelectedDotMatrixAnimation({ ...nextState.dotMatrixAnimation })
    openDotsColorItemsRef.current = new Set([nextState.dotsColorMode])
    setSelectedQrFinderPatternOuterStyle(nextState.finderPatternOuterSettings.type)
    setSelectedCornerSquareColorMode(
      nextState.finderPatternOuterGradient.enabled ? "gradient" : "solid",
    )
    setSelectedCornerSquareColor(nextState.finderPatternOuterSettings.color)
    setSelectedCornerSquareGradient(structuredClone(nextState.finderPatternOuterGradient))
    openCornerSquareColorItemsRef.current = new Set([
      nextState.finderPatternOuterGradient.enabled ? "gradient" : "solid",
    ])
    setSelectedQrFinderPatternInnerStyle(nextState.finderPatternInnerSettings.type)
    setSelectedCornerDotColorMode(nextState.finderPatternInnerGradient.enabled ? "gradient" : "solid")
    setSelectedCornerDotColor(nextState.finderPatternInnerSettings.color)
    setSelectedCornerDotGradient(structuredClone(nextState.finderPatternInnerGradient))
    openCornerDotColorItemsRef.current = new Set([
      nextState.finderPatternInnerGradient.enabled ? "gradient" : "solid",
    ])
    setSelectedBackgroundColorMode(
      nextState.backgroundGradient.enabled ? "gradient" : "solid",
    )
    setSelectedBackgroundColor(nextState.backgroundOptions.color)
    setSelectedBackgroundTransparent(nextState.backgroundOptions.transparent)
    setSelectedBackgroundGradient(structuredClone(nextState.backgroundGradient))
    setSelectedBackgroundShapeId(nextState.backgroundShapeId)
    setSelectedBackgroundShapeOptions({
      ...DEFAULT_DRAFTING_STUDIO_STATE.backgroundShapeOptions,
      ...nextState.backgroundShapeOptions,
    })
    openBackgroundColorItemsRef.current = new Set([
      nextState.backgroundGradient.enabled ? "gradient" : "solid",
    ])
    setSelectedBackgroundAssetSourceMode(
      nextState.backgroundImage.source === "url" ? "url" : "upload",
    )
    setSelectedBackgroundRemoteUrl(
      nextState.backgroundImage.source === "url" ? (nextState.backgroundImage.value ?? "") : "",
    )
    openBackgroundUploadItemsRef.current = new Set([
      nextState.backgroundImage.source === "url" ? "url" : "upload",
    ])
    setSelectedLogoColorMode(nextState.logoGradient.enabled ? "gradient" : "solid")
    setSelectedLogoSourceMode(nextState.logo.source)
    setSelectedLogoColor(nextState.logo.presetColor ?? DEFAULT_BRAND_ICON_COLOR)
    setSelectedLogoGradient(structuredClone(nextState.logoGradient))
    openLogoColorItemsRef.current = new Set([
      nextState.logoGradient.enabled ? "gradient" : "solid",
    ])
    setSelectedLogoPresetId(nextState.logo.presetId)
    setSelectedLogoPresetValue(nextState.logo.source === "preset" ? nextState.logo.value : undefined)
    setSelectedLogoAssetSourceMode(nextState.logo.source === "url" ? "url" : "upload")
    setSelectedLogoRemoteUrl(
      nextState.logo.source === "url" ? (nextState.logo.value ?? "") : "",
    )
    setSelectedLogoUploadValue(
      nextState.logo.source === "upload" ? (nextState.logo.value ?? "") : "",
    )
    openLogoUploadItemsRef.current = new Set([
      nextState.logo.source === "url" ? "url" : "upload",
    ])
    setSelectedLogoSize(Math.round(nextState.imageOptions.imageSize * 100))
    setSelectedLogoMargin(nextState.imageOptions.margin)
    setSelectedHideBackgroundDots(nextState.imageOptions.hideBackgroundDots)
    setSelectedQrTypeNumber(nextState.qrOptions.typeNumber)
    setSelectedQrErrorCorrectionLevel(nextState.qrOptions.errorCorrectionLevel)
    setSelectedBoostLevel(nextState.qrOptions.boostLevel)
    setSelectedQrMode(nextState.qrOptions.mode)
    setSelectedValueSegmentsText(formatValueSegmentsText(nextState.valueSegments))
    setSelectedAriaLabel(nextState.ariaLabel ?? "")
    setSelectedModuleRoundSize(nextState.dataModulesSettings.roundSize)
    setSelectedModuleSize(nextState.dataModulesSettings.moduleSize)
    setSelectedModuleLineWidth(nextState.dataModulesSettings.lineWidth)
    setSelectedGradientLinkMode(nextState.gradientLinkMode)
    setSelectedLogoOpacity(nextState.imageOptions.opacity * 100)
    setSelectedLogoSizeMode(nextState.imageOptions.sizeMode)
    setSelectedLogoWidthPx(nextState.imageOptions.widthPx)
    setSelectedLogoHeightPx(nextState.imageOptions.heightPx)
    setSelectedLogoLockAspect(nextState.imageOptions.lockAspect)
    setSelectedLogoPositionMode(nextState.imageOptions.logoPositionMode)
    setSelectedLogoOffsetX(nextState.imageOptions.x ?? 0)
    setSelectedLogoOffsetY(nextState.imageOptions.y ?? 0)
    setSelectedLogoCrossOrigin(nextState.imageOptions.crossOrigin)
  }

  function buildDraftingWorkspaceDocument(): DraftingWorkspaceDocumentV1 {
    return buildDraftingWorkspaceDocumentFromState({
      activeQrLayerId,
      activeQrNodeId,
      cardStateByNodeId,
      contentTypeByLayerId,
      contentTypeByNodeId,
      contentValuesByType,
      draftingStudioState,
      layerStateByNodeId,
      qrStateByLayerId,
      sceneCompositionByNodeId,
      selectedCardState,
      selectedContentType,
    })
  }

  function persistActiveQrLayerState(nextState: QrStudioState = draftingStudioState) {
    setQrStateByLayerId((current) => ({
      ...current,
      [activeQrLayerId]: cloneDraftingQrState(nextState),
    }))
    setContentTypeByLayerId((current) => ({
      ...current,
      [activeQrLayerId]: selectedContentType,
    }))
    setQrStateByNodeId({
      [DASHBOARD_QR_NODE_ID]: cloneDraftingQrState(nextState),
    })
  }

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
    applyDraftingQrStateToControls(nextState)
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
    applyDraftingQrStateToControls(activeState)
    setSelectedCardState(cloneDraftingCardState(activeCardState))
    selectSingleLayer(activeLayerId)
  }

  function selectSingleLayer(layerId: string | null) {
    setSelectedLayerId(layerId)
    setSelectedLayerIds(layerId ? [layerId] : [])
  }

  function applyLayerSelection(nextLayerIds: string[]) {
    setSelectedLayerIds(nextLayerIds)
    setSelectedLayerId(nextLayerIds.at(-1) ?? null)
  }

  function setDraftingHistoryStack(nextStack: DraftingWorkspaceDocumentV1[], nextIndex: number) {
    draftingWorkspaceHistoryRef.current = nextStack
    draftingWorkspaceHistoryIndexRef.current = nextIndex
    setDraftingHistoryRevision((current) => current + 1)
  }

  function restoreDraftingHistorySnapshot(nextIndex: number) {
    const snapshot = draftingWorkspaceHistoryRef.current[nextIndex]

    if (!snapshot) {
      return
    }

    isApplyingDraftingWorkspaceHistoryRef.current = true
    setDraftingHistoryStack(draftingWorkspaceHistoryRef.current, nextIndex)
    applyDraftingWorkspaceDocumentToControls(snapshot)
    window.setTimeout(() => {
      isApplyingDraftingWorkspaceHistoryRef.current = false
    }, 0)
  }

  function handleUndoDraftingWorkspace() {
    restoreDraftingHistorySnapshot(
      Math.max(0, draftingWorkspaceHistoryIndexRef.current - 1),
    )
  }

  function handleRedoDraftingWorkspace() {
    restoreDraftingHistorySnapshot(
      Math.min(
        draftingWorkspaceHistoryRef.current.length - 1,
        draftingWorkspaceHistoryIndexRef.current + 1,
      ),
    )
  }

  function handleSaveDraftingWorkspace() {
    if (draftingWorkspaceAutosaveTimerRef.current !== null) {
      window.clearTimeout(draftingWorkspaceAutosaveTimerRef.current)
      draftingWorkspaceAutosaveTimerRef.current = null
    }

    void writeDraftingWorkspaceDraft(draftingWorkspaceDocument)
  }

  function handlePaneSelection(_paneId: string) {
    draftingSurfaceRef.current?.focus({ preventScroll: true })
  }

  function handlePaneQrClick(paneId: string) {
    if (paneId !== activeQrNodeId) {
      handlePaneSelection(paneId)
    }
  }

  function resetDraftingWorkspace() {
    const nextState = createDefaultDraftingWorkspaceQrState()

    setDesktopRailTool("content")
    applyDraftingQrStateToControls(nextState)
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
    setSelectedDownloadTarget("current")
    setSelectedRasterExportPresetId(DEFAULT_DRAFTING_RASTER_EXPORT_PRESET_ID)
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
    let cancelled = false

    void resolveWorkspaceBootstrapDocument().then(({ document: nextDocument }) => {
      if (cancelled) {
        return
      }

      isApplyingDraftingWorkspaceHistoryRef.current = true
      applyDraftingWorkspaceDocumentToControls(nextDocument)
      setDraftingHistoryStack([cloneDraftingWorkspaceDocument(nextDocument)], 0)
      setIsDraftingWorkspaceReady(true)
      window.setTimeout(() => {
        isApplyingDraftingWorkspaceHistoryRef.current = false
      }, 0)
    })

    return () => {
      cancelled = true
    }
    // Initial draft hydration must run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isDraftingWorkspaceReady) {
      return
    }

    if (draftingWorkspaceHistoryTimerRef.current !== null) {
      window.clearTimeout(draftingWorkspaceHistoryTimerRef.current)
    }

    draftingWorkspaceHistoryTimerRef.current = window.setTimeout(() => {
      const snapshot = cloneDraftingWorkspaceDocument(draftingWorkspaceDocument)
      const serializedSnapshot = serializeDraftingWorkspaceDocument(snapshot)
      const currentIndex = draftingWorkspaceHistoryIndexRef.current
      const currentSnapshot = draftingWorkspaceHistoryRef.current[currentIndex]

      if (
        currentSnapshot &&
        serializeDraftingWorkspaceDocument(currentSnapshot) === serializedSnapshot
      ) {
        return
      }

      if (isApplyingDraftingWorkspaceHistoryRef.current) {
        return
      }

      if (shouldReplaceCurrentDraftingHistoryEntryRef.current) {
        const nextStack = [...draftingWorkspaceHistoryRef.current]
        nextStack[currentIndex] = snapshot
        shouldReplaceCurrentDraftingHistoryEntryRef.current = false
        setDraftingHistoryStack(nextStack, currentIndex)
        return
      }

      const nextStack = draftingWorkspaceHistoryRef.current.slice(0, currentIndex + 1)
      nextStack.push(snapshot)

      if (nextStack.length > 80) {
        nextStack.shift()
      }

      setDraftingHistoryStack(nextStack, nextStack.length - 1)
    }, 160)

    return () => {
      if (draftingWorkspaceHistoryTimerRef.current !== null) {
        window.clearTimeout(draftingWorkspaceHistoryTimerRef.current)
      }
    }
  }, [draftingWorkspaceDocument, isDraftingWorkspaceReady])

  useEffect(() => {
    keyboardStateRef.current = {
      activeQrLayerId,
      activeQrNodeId,
      draftingStudioState,
      layerStateByNodeId,
      qrLayerCount: qrCanvasLayers.length,
      selectedCardState,
      selectedLayerIds,
    }
  }, [
    activeQrLayerId,
    activeQrNodeId,
    draftingStudioState,
    layerStateByNodeId,
    qrCanvasLayers.length,
    selectedCardState,
    selectedLayerIds,
  ])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      const isBodyOrDocumentTarget =
        target === document.body || target === document.documentElement || target === document
      const targetInSurface =
        target instanceof Node && draftingSurfaceRef.current?.contains(target)

      if (
        !draftingSurfaceRef.current ||
        (!targetInSurface && !isBodyOrDocumentTarget) ||
        isEditableShortcutTarget(target)
      ) {
        return
      }

      const key = event.key.toLowerCase()
      const usesModifier = event.metaKey || event.ctrlKey

      if (!usesModifier) {
        if (
          key === "arrowleft" ||
          key === "arrowright" ||
          key === "arrowup" ||
          key === "arrowdown"
        ) {
          const delta = event.shiftKey ? 10 : 1
          const x = key === "arrowleft" ? -delta : key === "arrowright" ? delta : 0
          const y = key === "arrowup" ? -delta : key === "arrowdown" ? delta : 0
          const {
            activeQrNodeId: currentActiveQrNodeId,
            layerStateByNodeId: currentLayerStateByNodeId,
            selectedLayerIds: currentSelectedLayerIds,
          } = keyboardStateRef.current
          const activeLayers = currentLayerStateByNodeId[currentActiveQrNodeId] ?? []

          const activeLayerById = new Map(activeLayers.map((item) => [item.id, item]))

          if (currentSelectedLayerIds.length > 0) {
            event.preventDefault()
            for (const layerId of currentSelectedLayerIds) {
              const layer = activeLayerById.get(layerId)

              if (layer) {
                handleLayerChange(currentActiveQrNodeId, layerId, {
                  x: layer.x + x,
                  y: layer.y + y,
                })
              }
            }
          }
          return
        }

        if (key === "delete" || key === "backspace") {
          event.preventDefault()
          deleteSelectedLayersOrPane()
          return
        }

        if (key === "escape") {
          event.preventDefault()
          clearDraftingLayerSelection()
        }

        return
      }

      if (key === "z" && event.shiftKey) {
        event.preventDefault()
        handleRedoDraftingWorkspace()
        return
      }

      if (key === "z") {
        event.preventDefault()
        handleUndoDraftingWorkspace()
        return
      }

      if (key === "y") {
        event.preventDefault()
        handleRedoDraftingWorkspace()
        return
      }

      if (key === "d") {
        event.preventDefault()
        duplicateSelectedLayers()
        return
      }

      if (key === "a") {
        event.preventDefault()
        selectAllActiveDraftingLayers()
        return
      }

      if (key === "c" && keyboardStateRef.current.selectedLayerIds.length > 0) {
        event.preventDefault()
        void copySelectedDraftingLayers(keyboardStateRef.current.selectedLayerIds)
        return
      }

      if (key === "v") {
        event.preventDefault()
        void pasteDraftingLayers()
        return
      }

      if (key === "[" && keyboardStateRef.current.selectedLayerIds.length > 0) {
        event.preventDefault()
        handleLayerAction(
          keyboardStateRef.current.activeQrNodeId,
          keyboardStateRef.current.selectedLayerIds,
          event.shiftKey ? "back" : "backward",
        )
        return
      }

      if (key === "]" && keyboardStateRef.current.selectedLayerIds.length > 0) {
        event.preventDefault()
        handleLayerAction(
          keyboardStateRef.current.activeQrNodeId,
          keyboardStateRef.current.selectedLayerIds,
          event.shiftKey ? "front" : "forward",
        )
        return
      }

      if (key === "g" && keyboardStateRef.current.selectedLayerIds.length > 0) {
        event.preventDefault()
        handleLayerAction(
          keyboardStateRef.current.activeQrNodeId,
          keyboardStateRef.current.selectedLayerIds,
          event.shiftKey ? "ungroup" : "group",
        )
      }
    }

    window.addEventListener("keydown", handleKeyDown, true)
    return () => window.removeEventListener("keydown", handleKeyDown, true)
    // Keyboard listener is stable; current workspace values are read from keyboardStateRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const shouldUseDraftingClipboardEvent = (event: ClipboardEvent) => {
      const target = event.target
      const isBodyOrDocumentTarget =
        target === document.body || target === document.documentElement || target === document
      const targetInSurface =
        target instanceof Node && draftingSurfaceRef.current?.contains(target)

      return Boolean(
        draftingSurfaceRef.current &&
          (targetInSurface || isBodyOrDocumentTarget) &&
          !isEditableShortcutTarget(target),
      )
    }

    const handleCopy = (event: ClipboardEvent) => {
      if (!shouldUseDraftingClipboardEvent(event)) {
        return
      }

      const {
        activeQrNodeId: currentActiveQrNodeId,
        draftingStudioState: currentDraftingStudioState,
        layerStateByNodeId: currentLayerStateByNodeId,
        selectedCardState: currentSelectedCardState,
        selectedLayerIds: currentSelectedLayerIds,
      } = keyboardStateRef.current
      const payload = getDraftingLayerClipboardPayload({
        layerIds: currentSelectedLayerIds,
        layers:
          currentLayerStateByNodeId[currentActiveQrNodeId] ??
          createDefaultDraftingLayers(
            currentActiveQrNodeId,
            currentDraftingStudioState,
            currentSelectedCardState,
          ),
        paneId: currentActiveQrNodeId,
      })

      if (!payload) {
        return
      }

      event.preventDefault()
      draftingLayerClipboardRef.current = payload
      event.clipboardData?.setData("text/plain", payload)
    }

    const handlePaste = (event: ClipboardEvent) => {
      if (!shouldUseDraftingClipboardEvent(event)) {
        return
      }

      const rawPayload = event.clipboardData?.getData("text/plain") ?? ""

      if (!parseDraftingLayerClipboardPayload(rawPayload)) {
        return
      }

      event.preventDefault()
      void pasteDraftingLayers(undefined, rawPayload)
    }

    window.addEventListener("copy", handleCopy, true)
    window.addEventListener("paste", handlePaste, true)
    return () => {
      window.removeEventListener("copy", handleCopy, true)
      window.removeEventListener("paste", handlePaste, true)
    }
    // eslint-disable-next-line react-doctor/exhaustive-deps -- clipboard handlers read latest state via refs
  }, [])

  useEffect(() => {
    if (!isDraftingWorkspaceReady) {
      return
    }

    if (draftingWorkspaceAutosaveTimerRef.current !== null) {
      window.clearTimeout(draftingWorkspaceAutosaveTimerRef.current)
    }

    draftingWorkspaceAutosaveTimerRef.current = window.setTimeout(() => {
      void writeDraftingWorkspaceDraft(draftingWorkspaceDocument)
    }, 240)

    return () => {
      if (draftingWorkspaceAutosaveTimerRef.current !== null) {
        window.clearTimeout(draftingWorkspaceAutosaveTimerRef.current)
      }
    }
  }, [draftingWorkspaceDocument, isDraftingWorkspaceReady])

  useEffect(() => {
    return () => {
      if (draftingWorkspaceAutosaveTimerRef.current !== null) {
        window.clearTimeout(draftingWorkspaceAutosaveTimerRef.current)
      }
      if (draftingWorkspaceHistoryTimerRef.current !== null) {
        window.clearTimeout(draftingWorkspaceHistoryTimerRef.current)
      }
    }
  }, [])


  async function handleAddQrCode() {
    if (qrCanvasLayers.length >= 10) return

    persistActiveQrLayerState()

    const freshState = createDefaultDraftingWorkspaceQrState()
    const layers =
      layerStateByNodeId[activeQrNodeId] ??
      createDefaultDraftingLayers(activeQrNodeId, draftingStudioState, selectedCardState)
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
    applyDraftingQrStateToControls(freshState)
    setSelectedContentType(DEFAULT_QR_INPUT_TYPE)
    selectSingleLayer(nextLayer.id)
  }

  function duplicateSelectedLayers(layerIds = selectedLayerIds) {
    if (layerIds.length === 0) {
      return
    }

    persistActiveQrLayerState()

    const layers =
      layerStateByNodeId[activeQrNodeId] ??
      createDefaultDraftingLayers(activeQrNodeId, draftingStudioState, selectedCardState)
    const selectedIdSet = new Set(layerIds)
    const selectedLayers = layers.filter((layer) => selectedIdSet.has(layer.id))

    if (selectedLayers.length === 0) {
      return
    }

    const maxZIndex = layers.reduce((max, layer) => Math.max(max, layer.zIndex), -1)
    const duplicatedLayers: DraftingCanvasLayer[] = []
    const nextQrStateByLayerId: Record<string, QrStudioState> = {}
    const nextContentTypeByLayerId: Record<string, QrInputType> = {}

    selectedLayers.forEach((layer, index) => {
      const duplicatedLayer = patchDraftingCanvasLayer(
        {
          ...cloneDraftingCanvasLayer(layer),
          id: `${activeQrNodeId}:${layer.kind}:${Date.now()}-${index}`,
          x: layer.x + DRAFTING_LAYER_PASTE_OFFSET,
          y: layer.y + DRAFTING_LAYER_PASTE_OFFSET,
          zIndex: maxZIndex + index + 1,
        },
        {},
      )
      duplicatedLayers.push(duplicatedLayer)

      if (layer.kind === "qr") {
        const sourceState =
          layer.id === activeQrLayerId
            ? draftingStudioState
            : (qrStateByLayerId[layer.id] ?? draftingStudioState)
        nextQrStateByLayerId[duplicatedLayer.id] = cloneDraftingQrState(sourceState)
        nextContentTypeByLayerId[duplicatedLayer.id] =
          contentTypeByLayerId[layer.id] ?? selectedContentType
      }
    })

    if (Object.keys(nextQrStateByLayerId).length > 0) {
      setQrStateByLayerId((current) => ({
        ...current,
        ...nextQrStateByLayerId,
      }))
      setContentTypeByLayerId((current) => ({
        ...current,
        ...nextContentTypeByLayerId,
      }))
    }

    setLayerStateByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: [
        ...(current[activeQrNodeId] ?? layers).map(cloneDraftingCanvasLayer),
        ...duplicatedLayers,
      ],
    }))

    const nextActiveLayerId = duplicatedLayers.at(-1)?.id ?? activeQrLayerId
    const nextActiveState =
      nextQrStateByLayerId[nextActiveLayerId] ??
      qrStateByLayerId[nextActiveLayerId] ??
      draftingStudioState

    if (nextActiveLayerId !== activeQrLayerId) {
      setActiveQrLayerId(nextActiveLayerId)
      applyDraftingQrStateToControls(nextActiveState)
      setSelectedContentType(
        nextContentTypeByLayerId[nextActiveLayerId] ??
          contentTypeByLayerId[nextActiveLayerId] ??
          selectedContentType,
      )
    }

    applyLayerSelection(duplicatedLayers.map((layer) => layer.id))
    draftingSurfaceRef.current?.focus({ preventScroll: true })
  }

  function handleRemoveQrCode(layerId: string) {
    const layers =
      layerStateByNodeId[activeQrNodeId] ??
      createDefaultDraftingLayers(activeQrNodeId, draftingStudioState, selectedCardState)

    if (!isLayerDeletable(layerId, layers)) {
      return
    }

    const fallbackLayerId =
      getQrCanvasLayers(layers).find((layer) => layer.id !== layerId)?.id ??
      getDraftingQrLayerId(activeQrNodeId)

    setLayerStateByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: (current[activeQrNodeId] ?? layers).filter(
        (layer) => layer.id !== layerId,
      ),
    }))
    setQrStateByLayerId((current) => {
      const next = { ...current }
      delete next[layerId]
      return next
    })
    setContentTypeByLayerId((current) => {
      const next = { ...current }
      delete next[layerId]
      return next
    })

    if (layerId === activeQrLayerId) {
      const fallbackState =
        qrStateByLayerId[fallbackLayerId] ?? createDefaultDraftingWorkspaceQrState()
      setActiveQrLayerId(fallbackLayerId)
      applyDraftingQrStateToControls(fallbackState)
      setSelectedContentType(contentTypeByLayerId[fallbackLayerId] ?? DEFAULT_QR_INPUT_TYPE)
      selectSingleLayer(fallbackLayerId)
      return
    }

    selectSingleLayer(fallbackLayerId)
  }

  function handleBrowseStockPhotos() {
    setComposeSidebarPanel("stock-photos")
    selectSingleLayer(null)
  }

  function handleInsertLayer(layer: DraftingCanvasLayer) {
    const layers =
      layerStateByNodeId[activeQrNodeId] ??
      createDefaultDraftingLayers(activeQrNodeId, draftingStudioState, selectedCardState)
    const maxZIndex = layers.reduce((max, currentLayer) => Math.max(max, currentLayer.zIndex), -1)
    const nextLayer = patchDraftingCanvasLayer(
      {
        ...cloneDraftingCanvasLayer(layer),
        id: `${activeQrNodeId}:${layer.kind}:${Date.now()}`,
        nodeId: activeQrNodeId,
        zIndex: maxZIndex + 1,
      },
      {},
    )

    setLayerStateByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: [...layers.map(cloneDraftingCanvasLayer), nextLayer],
    }))
    selectSingleLayer(nextLayer.id)
    draftingSurfaceRef.current?.focus({ preventScroll: true })
  }

  function handleAddTextLayer() {
    handleInsertLayer(createDraftingTextLayer(activeQrNodeId))
  }

  function handleAddTextLayerAt(paneId: string, point: { x: number; y: number }) {
    const targetQrState =
      paneId === activeQrNodeId
        ? draftingStudioState
        : (qrStateByNodeId[paneId] ?? createDefaultDraftingWorkspaceQrState())
    const targetCardState =
      paneId === activeQrNodeId
        ? selectedCardState
        : (cardStateByNodeId[paneId] ?? createDefaultDraftingCardState())
    const layers =
      layerStateByNodeId[paneId] ??
      createDefaultDraftingLayers(paneId, targetQrState, targetCardState)
    const maxZIndex = layers.reduce((max, layer) => Math.max(max, layer.zIndex), -1)
    const draftPosition = clampLayerGeometryToCanvas(
      {
        height: 48,
        width: 240,
        x: Math.round(point.x - 120),
        y: Math.round(point.y - 24),
      },
      targetCardState,
    )
    const textLayer = createDraftingTextLayer(paneId, {
      id: `${paneId}:text:${Date.now()}`,
      x: draftPosition.x,
      y: draftPosition.y,
      zIndex: maxZIndex + 1,
    })

    if (paneId !== activeQrNodeId) {
      shouldReplaceCurrentDraftingHistoryEntryRef.current = true
      setQrStateByNodeId((current) => ({
        ...current,
        [activeQrNodeId]: cloneDraftingQrState(draftingStudioState),
        [paneId]: cloneDraftingQrState(targetQrState),
      }))
      setCardStateByNodeId((current) => ({
        ...current,
        [activeQrNodeId]: cloneDraftingCardState(selectedCardState),
        [paneId]: cloneDraftingCardState(targetCardState),
      }))
      setActiveQrNodeId(paneId)
      applyDraftingQrStateToControls(targetQrState)
      setSelectedCardState(cloneDraftingCardState(targetCardState))
    }

    setLayerStateByNodeId((current) => ({
      ...current,
      [paneId]: [...layers.map(cloneDraftingCanvasLayer), textLayer],
    }))
    selectSingleLayer(textLayer.id)
    draftingSurfaceRef.current?.focus({ preventScroll: true })
  }

  function handleAddFrameCardLayer() {
    const cardLayerId = getDraftingCardLayerId(activeQrNodeId)
    const layers =
      layerStateByNodeId[activeQrNodeId] ??
      createDefaultDraftingLayers(activeQrNodeId, draftingStudioState, selectedCardState)

    setSelectedCardState((current) => ({
      ...current,
      enabled: true,
    }))
    setLayerStateByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: layers.map((layer) =>
        layer.id === cardLayerId
          ? patchDraftingCanvasLayer(layer, {
              isVisible: true,
              shadow: selectedCardState.shadow,
            })
          : cloneDraftingCanvasLayer(layer),
      ),
    }))
    selectSingleLayer(cardLayerId)
    setDesktopRailTool("shape")
    draftingSurfaceRef.current?.focus({ preventScroll: true })
  }

  function handleLayerSelect(
    paneId: string,
    layerId: string | null,
    options?: { additive?: boolean; preserveActiveTool?: boolean },
  ) {
    draftingSurfaceRef.current?.focus({ preventScroll: true })

    if (layerId && isDraftingQrLayerId(layerId) && !options?.additive) {
      activateQrLayer(layerId)
    }

    if (options?.additive && paneId === activeQrNodeId && layerId !== null) {
      const next = selectedLayerIds.includes(layerId)
        ? selectedLayerIds.filter((id) => id !== layerId)
        : [...selectedLayerIds, layerId]

      applyLayerSelection(next)
    } else {
      selectSingleLayer(layerId)
    }

    if (layerId === null) {
      setDesktopRailTool("content")
      return
    }

    if (options?.preserveActiveTool) {
      return
    }

    const selectedLayer = findDraftingLayerById(
      layerStateByNodeId[paneId] ??
        createDefaultDraftingLayers(paneId, draftingStudioState, selectedCardState),
      layerId,
    )

    if (
      selectedLayer?.kind === "text" ||
      selectedLayer?.kind === "image" ||
      selectedLayer?.kind === "shape" ||
      selectedLayer?.kind === "shader"
    ) {
      setDesktopRailTool(null)
      return
    }

    if (selectedLayer?.kind === "group") {
      setDesktopRailTool("layers")
      return
    }

    if (isDraftingCardLayerId(layerId)) {
      setDesktopRailTool("shape")
      return
    }

    setDesktopRailTool("content")
  }

  function handleLayerSelectionChange(
    paneId: string,
    layerIds: string[],
    options?: { additive?: boolean },
  ) {
    if (paneId !== activeQrNodeId) {
      handlePaneSelection(paneId)
    }

    const next = options?.additive
      ? Array.from(new Set([...selectedLayerIds, ...layerIds]))
      : layerIds

    applyLayerSelection(next)
  }

  function getActiveSelectableLayers() {
    const {
      activeQrNodeId: currentActiveQrNodeId,
      draftingStudioState: currentDraftingStudioState,
      layerStateByNodeId: currentLayerStateByNodeId,
      selectedCardState: currentSelectedCardState,
    } = keyboardStateRef.current
    const layers =
      currentLayerStateByNodeId[currentActiveQrNodeId] ??
      createDefaultDraftingLayers(
        currentActiveQrNodeId,
        currentDraftingStudioState,
        currentSelectedCardState,
      )

    return layers.filter((layer) => layer.isVisible)
  }

  function getSelectedActiveLayers() {
    const {
      activeQrNodeId: currentActiveQrNodeId,
      draftingStudioState: currentDraftingStudioState,
      layerStateByNodeId: currentLayerStateByNodeId,
      selectedCardState: currentSelectedCardState,
      selectedLayerIds: currentSelectedLayerIds,
    } = keyboardStateRef.current
    const selectedLayerIdSet = new Set(currentSelectedLayerIds)
    const layers =
      currentLayerStateByNodeId[currentActiveQrNodeId] ??
      createDefaultDraftingLayers(
        currentActiveQrNodeId,
        currentDraftingStudioState,
        currentSelectedCardState,
      )

    return layers.filter((layer) => selectedLayerIdSet.has(layer.id))
  }

  function selectAllActiveDraftingLayers() {
    const layerIds = getActiveSelectableLayers().map((layer) => layer.id)

    applyLayerSelection(layerIds)
  }

  function clearDraftingLayerSelection() {
    applyLayerSelection([])
  }

  function deleteSelectedLayersOrPane() {
    const {
      activeQrNodeId: currentActiveQrNodeId,
      draftingStudioState: currentDraftingStudioState,
      layerStateByNodeId: currentLayerStateByNodeId,
      selectedCardState: currentSelectedCardState,
      selectedLayerIds: currentSelectedLayerIds,
    } = keyboardStateRef.current
    const layers =
      currentLayerStateByNodeId[currentActiveQrNodeId] ??
      createDefaultDraftingLayers(
        currentActiveQrNodeId,
        currentDraftingStudioState,
        currentSelectedCardState,
      )
    const selectedLayerIdSet = new Set(currentSelectedLayerIds)
    const removableLayerIds = layers.flatMap((layer) =>
      selectedLayerIdSet.has(layer.id) && isLayerDeletable(layer.id, layers) ? [layer.id] : [],
    )

    if (removableLayerIds.length === 0) {
      return
    }

    const removableLayerIdSet = new Set(removableLayerIds)

    setQrStateByLayerId((current) => {
      const next = { ...current }
      for (const layerId of removableLayerIds) {
        if (isDraftingQrLayerId(layerId)) {
          delete next[layerId]
        }
      }
      return next
    })
    setContentTypeByLayerId((current) => {
      const next = { ...current }
      for (const layerId of removableLayerIds) {
        if (isDraftingQrLayerId(layerId)) {
          delete next[layerId]
        }
      }
      return next
    })
    setLayerStateByNodeId((current) => {
      const currentLayers =
        current[currentActiveQrNodeId] ??
        createDefaultDraftingLayers(
          currentActiveQrNodeId,
          currentDraftingStudioState,
          currentSelectedCardState,
        )

      return {
        ...current,
        [currentActiveQrNodeId]: currentLayers.flatMap((layer) =>
          removableLayerIdSet.has(layer.id) ? [] : [cloneDraftingCanvasLayer(layer)],
        ),
      }
    })

    const nextSelection = currentSelectedLayerIds.filter(
      (layerId) => !removableLayerIdSet.has(layerId),
    )
    const fallbackLayerId =
      getQrCanvasLayers(
        layers.filter((layer) => !removableLayerIdSet.has(layer.id)),
      ).at(-1)?.id ?? getDraftingQrLayerId(currentActiveQrNodeId)

    if (removableLayerIdSet.has(activeQrLayerId)) {
      const fallbackState =
        qrStateByLayerId[fallbackLayerId] ?? createDefaultDraftingWorkspaceQrState()
      setActiveQrLayerId(fallbackLayerId)
      applyDraftingQrStateToControls(fallbackState)
      setSelectedContentType(contentTypeByLayerId[fallbackLayerId] ?? DEFAULT_QR_INPUT_TYPE)
    }

    applyLayerSelection(
      nextSelection.length > 0 ? nextSelection : [fallbackLayerId],
    )
  }

  function handleLayerChange(
    paneId: string,
    layerId: string,
    patch: Partial<DraftingCanvasLayer>,
  ) {
    const layers =
      layerStateByNodeId[paneId] ??
      createDefaultDraftingLayers(paneId, draftingStudioState, selectedCardState)

    if (isProtectedDraftingLayerId(layerId, layers)) {
      const { isVisible: _isVisible, ...safePatch } = patch
      if (Object.keys(safePatch).length === 0) {
        return
      }
      patch = safePatch
    } else {
      const { isVisible: _isVisible, ...patchWithoutVisibility } = patch
      patch = patchWithoutVisibility
    }

    setLayerStateByNodeId((current) => {
      const currentLayers =
        current[paneId] ??
        createDefaultDraftingLayers(paneId, draftingStudioState, selectedCardState)

      return {
        ...current,
        [paneId]: currentLayers.map((layer) => patchDraftingLayerById(layer, layerId, patch)),
      }
    })
  }

  function handleLayerReorder(orderedIds: string[]) {
    setLayerStateByNodeId((current) => {
      const currentLayers =
        current[activeQrNodeId] ??
        createDefaultDraftingLayers(activeQrNodeId, draftingStudioState, selectedCardState)
      const layerById = new Map(currentLayers.map((layer) => [layer.id, layer]))
      const cardLayerId = currentLayers.find((layer) => layer.kind === "card")?.id
      const orderedIdSet = new Set(orderedIds)
      const reorderableIds = orderedIds.filter(
        (layerId) => layerId !== cardLayerId && layerById.has(layerId),
      )
      const nextOrder = [
        ...reorderableIds,
        ...(cardLayerId ? [cardLayerId] : []),
        ...currentLayers.flatMap((layer) =>
          orderedIdSet.has(layer.id) || layer.id === cardLayerId ? [] : [layer.id],
        ),
      ]
      const zIndexByLayerId = new Map(
        nextOrder.map((layerId, index) => [layerId, nextOrder.length - index]),
      )

      return {
        ...current,
        [activeQrNodeId]: currentLayers.map((layer) =>
          patchDraftingCanvasLayer(layer, {
            zIndex: zIndexByLayerId.get(layer.id) ?? layer.zIndex,
          }),
        ),
      }
    })
  }

  async function copySelectedDraftingLayers(
    layerIds = selectedLayerIds,
    paneId = keyboardStateRef.current.activeQrNodeId,
  ) {
    const {
      draftingStudioState: currentDraftingStudioState,
      layerStateByNodeId: currentLayerStateByNodeId,
      selectedCardState: currentSelectedCardState,
    } = keyboardStateRef.current
    const layers =
      currentLayerStateByNodeId[paneId] ??
      createDefaultDraftingLayers(paneId, currentDraftingStudioState, currentSelectedCardState)
    const payload = getDraftingLayerClipboardPayload({
      layerIds,
      layers,
      paneId,
    })

    if (!payload) {
      return
    }

    draftingLayerClipboardRef.current = payload
    await navigator.clipboard?.writeText(payload).catch(() => undefined)
  }

  async function pasteDraftingLayers(
    point?: { x: number; y: number },
    payloadText?: string,
    paneId = keyboardStateRef.current.activeQrNodeId,
  ) {
    const rawPayload =
      payloadText ??
      (await navigator.clipboard?.readText().catch(() => draftingLayerClipboardRef.current)) ??
      draftingLayerClipboardRef.current
    const payload = parseDraftingLayerClipboardPayload(rawPayload)

    if (!payload) {
      return
    }

    const {
      draftingStudioState: currentDraftingStudioState,
      selectedCardState: currentSelectedCardState,
    } = keyboardStateRef.current
    const layers =
      layerStateByNodeId[paneId] ??
      createDefaultDraftingLayers(paneId, currentDraftingStudioState, currentSelectedCardState)
    const maxZIndex = layers.reduce((max, layer) => Math.max(max, layer.zIndex), -1)
    const offset = point
      ? {
          x: point.x - payload.bounds.x,
          y: point.y - payload.bounds.y,
        }
      : { x: DRAFTING_LAYER_PASTE_OFFSET, y: DRAFTING_LAYER_PASTE_OFFSET }
    const pastedLayers = cloneDraftingCanvasLayersForPaste({
      layers: payload.layers,
      nodeId: paneId,
      offset,
      startingZIndex: maxZIndex + 1,
    })

    applyLayerSelection(pastedLayers.map((layer) => layer.id))

    setLayerStateByNodeId((current) => {
      const currentLayers =
        current[paneId] ??
        createDefaultDraftingLayers(paneId, currentDraftingStudioState, currentSelectedCardState)

      return {
        ...current,
        [paneId]: [...currentLayers.map(cloneDraftingCanvasLayer), ...pastedLayers],
      }
    })
  }

  function handleLayerAction(
    paneId: string,
    layerIds: string[],
    action: DraftingLayerMenuAction,
  ) {
    if (layerIds.length === 0) {
      return
    }

    const currentLayers =
      layerStateByNodeId[paneId] ??
      createDefaultDraftingLayers(paneId, draftingStudioState, selectedCardState)

    if (action === "delete") {
      const removableLayerIds = new Set(
        layerIds.filter((layerId) => isLayerDeletable(layerId, currentLayers)),
      )

      if (removableLayerIds.size > 0) {
        setQrStateByLayerId((current) => {
          const next = { ...current }
          for (const layerId of removableLayerIds) {
            if (isDraftingQrLayerId(layerId)) {
              delete next[layerId]
            }
          }
          return next
        })
        setContentTypeByLayerId((current) => {
          const next = { ...current }
          for (const layerId of removableLayerIds) {
            if (isDraftingQrLayerId(layerId)) {
              delete next[layerId]
            }
          }
          return next
        })
        applyLayerSelection(
          selectedLayerIds.filter((layerId) => !removableLayerIds.has(layerId)),
        )
      }
    }

    setLayerStateByNodeId((current) => {
      const layers =
        current[paneId] ??
        createDefaultDraftingLayers(paneId, draftingStudioState, selectedCardState)
      const reorderActions: DraftingLayerReorderAction[] = [
        "back",
        "backward",
        "forward",
        "front",
      ]
      const alignActions: DraftingLayerAlignAction[] = [
        "bottom",
        "center-x",
        "center-y",
        "left",
        "right",
        "top",
      ]
      const distributeActions: DraftingLayerDistributeAction[] = [
        "horizontal",
        "vertical",
      ]

      let nextLayers = layers

      if (reorderActions.includes(action as DraftingLayerReorderAction)) {
        for (const layerId of layerIds.filter(
          (id) => !isProtectedDraftingLayerId(id, layers),
        )) {
          nextLayers = reorderDraftingCanvasLayer(
            nextLayers,
            layerId,
            action as DraftingLayerReorderAction,
          )
        }
      } else if (alignActions.includes(action as DraftingLayerAlignAction)) {
        nextLayers = alignDraftingCanvasLayers(
          nextLayers,
          layerIds,
          action as DraftingLayerAlignAction,
        )
      } else if (action === "group") {
        nextLayers = groupDraftingCanvasLayers(nextLayers, layerIds, {
          groupId: `${paneId}:group:${Date.now()}`,
          name: "Group",
        })
      } else if (action === "ungroup") {
        for (const layerId of layerIds) {
          nextLayers = ungroupDraftingCanvasLayer(nextLayers, layerId)
        }
      } else if (distributeActions.includes(action as DraftingLayerDistributeAction)) {
        nextLayers = distributeDraftingCanvasLayers(
          nextLayers,
          layerIds,
          action as DraftingLayerDistributeAction,
        )
      } else if (action === "delete") {
        const removableLayerIds = new Set(
          layerIds.filter((layerId) => isLayerDeletable(layerId, layers)),
        )

        if (removableLayerIds.size > 0) {
          nextLayers = nextLayers.flatMap((layer) =>
            removableLayerIds.has(layer.id) ? [] : [cloneDraftingCanvasLayer(layer)],
          )
        }
      } else if (action === "reset-rotation") {
        const actionableLayerIdSet = new Set(
          layerIds.filter((layerId) => !isProtectedDraftingLayerId(layerId, layers)),
        )

        if (actionableLayerIdSet.size === 0) {
          return current
        }

        nextLayers = nextLayers.map((layer) => {
          if (!actionableLayerIdSet.has(layer.id)) {
            return cloneDraftingCanvasLayer(layer)
          }

          return patchDraftingCanvasLayer(layer, { rotation: 0 })
        })
      }

      return {
        ...current,
        [paneId]: nextLayers,
      }
    })
  }

  async function handleDownload() {
    try {
      setExportDownloadError(null)
      if (selectedDownloadTarget === "all-qr") {
        const exportLayers =
          layerStateByNodeId[activeQrNodeId] ??
          createDefaultDraftingLayers(activeQrNodeId, draftingStudioState, selectedCardState)
        const nodes = await Promise.all(
          qrCanvasLayers.map(async (layer) => {
            const layerState =
              layer.id === activeQrLayerId
                ? draftingStudioState
                : (qrStateByLayerId[layer.id] ?? draftingStudioState)
            const isolatedLayers = exportLayers.map((entry) =>
              cloneDraftingCanvasLayer({
                ...entry,
                isVisible:
                  entry.kind === "card" || entry.id === layer.id ? entry.isVisible : false,
              }),
            )

            return await buildDraftingLayeredNodePayload({
              cardState: selectedCardState,
              layers: isolatedLayers,
              name: qrPaneNamesById.get(layer.id) ?? "QR Code",
              nodeId: activeQrNodeId,
              sceneComposition: activeSceneComposition,
              state: layerState,
            })
          }),
        )

        if (nodes.length === 0) {
          throw new Error("No QR codes are available for export.")
        }

        await downloadDashboardQrBatchZipExport({
          extension: selectedDownloadExtension,
          name: DEFAULT_DOWNLOAD_NAME,
          nodes,
          qualityPercent: draftingStudioState.rasterExportQualityPercent,
          targetDimensions: selectedPlatformExportDimensions,
          targetSizePx: selectedPlatformExportDimensions
            ? undefined
            : selectedRasterExportTargetSizePx,
        })
      } else if (
        selectedDownloadTarget === "current" ||
        selectedDownloadTarget.startsWith("qr:")
      ) {
        const layerId =
          selectedDownloadTarget === "current"
            ? activeQrLayerId
            : selectedDownloadTarget.slice("qr:".length)
        const state =
          layerId === activeQrLayerId
            ? draftingStudioState
            : qrStateByLayerId[layerId]

        if (!state) {
          throw new Error("The selected QR code is unavailable for export.")
        }

        const activeLayers =
          layerStateByNodeId[activeQrNodeId] ??
          createDefaultDraftingLayers(activeQrNodeId, state, selectedCardState)
        const isolatedLayers = activeLayers.map((entry) =>
          cloneDraftingCanvasLayer({
            ...entry,
            isVisible:
              entry.kind === "card" || entry.id === layerId ? entry.isVisible : false,
          }),
        )
        const payload = await buildDraftingLayeredNodePayload({
          cardState: selectedCardState,
          layers: isolatedLayers,
          name: qrPaneNamesById.get(layerId) ?? "QR Code",
          nodeId: activeQrNodeId,
          sceneComposition: activeSceneComposition,
          state,
        })

        await downloadDashboardQrNodeExport({
          extension: selectedDownloadExtension,
          name: qrPaneNamesById.get(layerId) ?? "QR Code",
          node: payload,
          qualityPercent: draftingStudioState.rasterExportQualityPercent,
          targetDimensions: selectedPlatformExportDimensions,
          targetSizePx: selectedPlatformExportDimensions
            ? undefined
            : selectedRasterExportTargetSizePx,
        })
      } else if (selectedDownloadTarget === "surface") {
        const activeCardState = selectedCardState
        const activeLayers =
          layerStateByNodeId[activeQrNodeId] ??
          createDefaultDraftingLayers(activeQrNodeId, draftingStudioState, activeCardState)
        const payload = await buildDraftingLayeredNodePayload({
          cardState: activeCardState,
          layers: activeLayers,
          name: DEFAULT_DOWNLOAD_NAME,
          nodeId: activeQrNodeId,
          sceneComposition: activeSceneComposition,
          state: draftingStudioState,
        })

        await downloadDashboardQrNodeExport({
          extension: selectedDownloadExtension,
          name: DEFAULT_DOWNLOAD_NAME,
          node: payload,
          qualityPercent: draftingStudioState.rasterExportQualityPercent,
          targetDimensions: selectedPlatformExportDimensions,
          targetSizePx: selectedPlatformExportDimensions
            ? undefined
            : selectedRasterExportTargetSizePx,
        })
      }
    } catch (error) {
      setExportDownloadError(error instanceof Error ? error.message : "Export failed.")
    }
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
      draftingStudioState,
      selectedLayerId,
    })

    return [
      {
        cardState: selectedCardState,
        id: activeQrNodeId,
        layers: activeCanvasLayers,
        name: "QR Code",
        qrStateByLayerId: mergedQrStateByLayerId,
        sceneComposition: activeSceneComposition,
        state: draftingStudioState,
      },
    ]
  }, [
    activeCanvasLayers,
    activeQrLayerId,
    activeQrNodeId,
    activeSceneComposition,
    draftingStudioState,
    qrStateByLayerId,
    selectedCardState,
    selectedLayerId,
  ])

  const desktopActiveTool = desktopRailTool
  const fallbackAppearanceLayer =
    activeCanvasLayers.find((layer) => layer.kind === "card") ?? null
  const appearanceTargetLayer = selectedTransformLayer ?? fallbackAppearanceLayer
  const desktopAppearanceSnapshot = appearanceTargetLayer
    ? getDesktopAppearanceSnapshot(appearanceTargetLayer, {
        cardCornerRadius:
          appearanceTargetLayer.kind === "card" ? selectedCardState.cornerRadius : undefined,
        cardCornerRadii:
          appearanceTargetLayer.kind === "card" ? selectedCardState.cornerRadii : undefined,
        qrBackgroundShapeOptions:
          appearanceTargetLayer.kind === "qr"
            ? draftingStudioState.backgroundShapeOptions
            : undefined,
      })
    : null

  function handleDesktopAppearancePatch(patch: Partial<DraftingCanvasLayer>) {
    if (!appearanceTargetLayer) {
      return
    }

    const result = buildDesktopAppearancePatch(appearanceTargetLayer, patch, {
      qrBackgroundShapeOptions:
        appearanceTargetLayer.kind === "qr"
          ? draftingStudioState.backgroundShapeOptions
          : undefined,
    })

    if (Object.keys(result.layerPatch).length > 0) {
      handleLayerChange(activeQrNodeId, appearanceTargetLayer.id, result.layerPatch)
    }

    if (
      appearanceTargetLayer.kind === "card" &&
      (result.cardCornerRadius !== undefined ||
        result.cardCornerRadii !== undefined ||
        result.cardShadow)
    ) {
      setSelectedCardState((current) => ({
        ...current,
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
      draftingStudioState,
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
      selectedExportPresetId,
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
      selectedRasterExportPresetId,
      selectedTextLayer,
      selectedUsePlatformExportPreset,
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

  function updateDesktopPatternSettings(patch: DesktopPatternSettingsPatch) {
    if (patch.uploadedModuleFillFile) {
      ensureDotsColorItemExpanded("image")
      const uploadValue = replaceTrackedObjectUrl(
        moduleFillUploadObjectUrlRef,
        patch.uploadedModuleFillFile,
        setModuleFillUploadObjectUrl,
      )
      setSelectedDotsColorMode("image")
      setSelectedModuleFillImageSourceMode("upload")
      setSelectedModuleFillImageUrl(uploadValue)
    }
    if (patch.qrDotType) setSelectedDotType(patch.qrDotType)
    if (patch.moduleRoundSize !== undefined) setSelectedModuleRoundSize(patch.moduleRoundSize)
    if (patch.moduleSize !== undefined) setSelectedModuleSize(patch.moduleSize)
    if (patch.moduleLineWidth !== undefined) setSelectedModuleLineWidth(patch.moduleLineWidth)
    if (patch.gradientLinkMode) setSelectedGradientLinkMode(patch.gradientLinkMode)
    if (patch.dotsColorMode) {
      ensureDotsColorItemExpanded(patch.dotsColorMode)
      setSelectedDotsColorMode(patch.dotsColorMode)
    }
    if (patch.dotsSolidColor) {
      ensureDotsColorItemExpanded("solid")
      setSelectedDotsColorMode("solid")
      setSelectedDotColor(patch.dotsSolidColor)
    }
    if (patch.dataModulesGradient) {
      ensureDotsColorItemExpanded("gradient")
      setSelectedDotsColorMode("gradient")
      setSelectedDotsGradient({ ...patch.dataModulesGradient, enabled: true })
    }
    if (patch.dotsPalette) {
      ensureDotsColorItemExpanded("palette")
      setSelectedDotsColorMode("palette")
      setSelectedDotsPalette([...patch.dotsPalette])
    }
    if (patch.dotsPalettePreset !== undefined) {
      ensureDotsColorItemExpanded("palette")
      setSelectedDotsColorMode("palette")
      setSelectedDotsPalettePreset(patch.dotsPalettePreset)
    }
    if (patch.moduleFillImageUrl !== undefined) {
      ensureDotsColorItemExpanded("image")
      setSelectedDotsColorMode("image")
      const sourceMode = patch.moduleFillImageSourceMode ?? selectedModuleFillImageSourceMode
      setSelectedModuleFillImageSourceMode(sourceMode)
      if (sourceMode === "url") {
        setSelectedModuleFillRemoteUrl(patch.moduleFillImageUrl)
      } else {
        setSelectedModuleFillImageUrl(patch.moduleFillImageUrl)
      }
    }
    if (patch.moduleFillImageSourceMode && patch.moduleFillImageUrl === undefined) {
      ensureDotsColorItemExpanded("image")
      setSelectedDotsColorMode("image")
      setSelectedModuleFillImageSourceMode(patch.moduleFillImageSourceMode)
    }
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
      ensureLogoUploadItemExpanded("upload")
      const uploadValue = replaceTrackedObjectUrl(
        logoUploadObjectUrlRef,
        patch.uploadedFile,
        setLogoUploadObjectUrl,
      )
      const nextState = applyAssetUploadValue(draftingStudioState, "logo", uploadValue)
      commitActiveQrStudioState(nextState)
    }
    if (patch.sourceMode) {
      if (patch.sourceMode === "none") {
        commitActiveQrStudioState(applyAssetNoneSelection(draftingStudioState, "logo"))
      } else if (patch.sourceMode === "brand") {
        setSelectedLogoSourceMode("preset")
      } else if (patch.sourceMode === "url") {
        ensureLogoUploadItemExpanded("url")
        const nextState = applyAssetUrlValue(
          draftingStudioState,
          "logo",
          selectedLogoRemoteUrl,
        )
        commitActiveQrStudioState(nextState)
      } else {
        ensureLogoUploadItemExpanded("upload")
        clearDraftingLogoPreset("upload")
      }
    }
    if (patch.uploadMode) {
      ensureLogoUploadItemExpanded(patch.uploadMode)
      if (patch.uploadMode === "url") {
        const nextState = applyAssetUrlValue(
          draftingStudioState,
          "logo",
          selectedLogoRemoteUrl,
        )
        commitActiveQrStudioState(nextState)
      } else {
        clearDraftingLogoPreset("upload")
      }
    }
    if (patch.remoteUrl !== undefined) {
      ensureLogoUploadItemExpanded("url")
      const nextState = applyAssetUrlValue(draftingStudioState, "logo", patch.remoteUrl)
      commitActiveQrStudioState(nextState)
    }
    if (patch.selectedBrandIconId) {
      if (parseIconstackSelectionId(patch.selectedBrandIconId)) {
        void handleDraftingIconstackIconSelection(patch.selectedBrandIconId)
      } else {
        const brandIcon = findBrandIconById(patch.selectedBrandIconId)
        if (brandIcon) handleDraftingBrandIconSelection(brandIcon)
      }
    }
    if (patch.colorMode) setSelectedLogoColorMode(patch.colorMode)
    if (patch.solidColor) void handleDraftingLogoColorChange(patch.solidColor)
    if (patch.gradient) void handleDraftingLogoGradientChange({ ...patch.gradient, enabled: true })
    patchActiveQrLogoImageOptions(patch)
  }

  function resetDesktopLogoSettings() {
    applyDraftingQrStateToControls(createDefaultDraftingWorkspaceQrState())
  }

  function updateDesktopCornersSettings(patch: Partial<DesktopCornersSettings>) {
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
    const shapeOptionsPatch: Partial<BackgroundShapeOptions> = {}
    if (patch.shapePadding !== undefined) shapeOptionsPatch.paddingPx = patch.shapePadding
    if (Object.keys(shapeOptionsPatch).length > 0) {
      setSelectedBackgroundShapeOptions((current) => ({ ...current, ...shapeOptionsPatch }))
    }

    const qrShadowPatch =
      patch.shapeShadowBlur !== undefined ||
      patch.shapeShadowColor !== undefined ||
      patch.shapeShadowOffsetX !== undefined ||
      patch.shapeShadowOffsetY !== undefined ||
      patch.shapeShadowOpacity !== undefined
        ? {
            blur: patch.shapeShadowBlur,
            color: patch.shapeShadowColor,
            offsetX: patch.shapeShadowOffsetX,
            offsetY: patch.shapeShadowOffsetY,
            opacity: patch.shapeShadowOpacity,
          }
        : null

    if (qrShadowPatch) {
      const qrLayerId = getDraftingQrLayerId(activeQrNodeId)
      const currentQrLayer = findDraftingLayerById(activeCanvasLayers, qrLayerId)
      if (currentQrLayer) {
        handleLayerChange(activeQrNodeId, qrLayerId, {
          shadow: {
            ...currentQrLayer.shadow,
            ...Object.fromEntries(
              Object.entries(qrShadowPatch).filter(([, value]) => value !== undefined),
            ),
          },
        })
      }
    }
    const nextCornerRadius = patch.cardRadius ?? selectedCardState.cornerRadius
    const nextCardState = {
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
      shadow: {
        ...selectedCardState.shadow,
        blur: patch.shadowBlur ?? selectedCardState.shadow.blur,
        color: patch.shadowColor ?? selectedCardState.shadow.color,
        offsetX: patch.shadowOffsetX ?? selectedCardState.shadow.offsetX,
        offsetY: patch.shadowOffsetY ?? selectedCardState.shadow.offsetY,
        opacity: patch.shadowOpacity ?? selectedCardState.shadow.opacity,
      },
      sizeMode: patch.sizeMode ?? selectedCardState.sizeMode,
      sizePresetId:
        patch.sizePresetId !== undefined ? patch.sizePresetId : selectedCardState.sizePresetId,
      styleMode:
        patch.cardFill !== undefined
          ? "solid"
          : selectedCardState.styleMode,
      width: patch.cardWidth ?? selectedCardState.width,
    }

    const shouldRelayoutCardInset =
      patch.bottomSpace !== undefined ||
      patch.cardHeight !== undefined ||
      patch.cardWidth !== undefined ||
      patch.sizeMode !== undefined ||
      patch.sizePresetId !== undefined

    const normalizedCardState = normalizeDraftingCardState(nextCardState)
    setSelectedCardState(normalizedCardState)

    if (shouldRelayoutCardInset) {
      const fittedQr = fitQrSizeInCard(draftingStudioState, normalizedCardState)
      const nextQrState = {
        ...draftingStudioState,
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
    if (patch.shadowBlur !== undefined || patch.shadowColor !== undefined || patch.shadowOffsetX !== undefined || patch.shadowOffsetY !== undefined || patch.shadowOpacity !== undefined) {
      handleLayerChange(activeQrNodeId, getDraftingCardLayerId(activeQrNodeId), {
        shadow: {
          ...selectedCardState.shadow,
          blur: patch.shadowBlur ?? selectedCardState.shadow.blur,
          color: patch.shadowColor ?? selectedCardState.shadow.color,
          offsetX: patch.shadowOffsetX ?? selectedCardState.shadow.offsetX,
          offsetY: patch.shadowOffsetY ?? selectedCardState.shadow.offsetY,
          opacity: patch.shadowOpacity ?? selectedCardState.shadow.opacity,
        },
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
      createDefaultDraftingLayers(activeQrNodeId, draftingStudioState, selectedCardState)
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
    if (patch.qualityPresetId) setSelectedRasterExportPresetId(patch.qualityPresetId)
    if (patch.target) setSelectedDownloadTarget(getDraftingDownloadTarget(patch.target))
    if (patch.exportPresetId !== undefined) setSelectedExportPresetId(patch.exportPresetId)
    if (patch.usePlatformPreset !== undefined) setSelectedUsePlatformExportPreset(patch.usePlatformPreset)
  }

  const scanSafetyResult = useQrScanSafety(draftingStudioState, {
    cardFill: selectedCardState.fill,
    contentIsValid: selectedContentValidation.isValid,
  })

  const canRemoveQrCode =
    paneToolbarVariant === "desktop-zoom" &&
    qrCanvasLayers.length > 1 &&
    Boolean(selectedLayerId?.includes(":qr"))

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
    selectedTransformLayer,
    selectedAppearanceLayer: selectedTransformLayer,
    appearanceSnapshot: desktopAppearanceSnapshot,
    scanSafetyResult,
    canvasTool: paneToolbarVariant === "desktop-zoom" ? desktopCanvasTool : undefined,
    onCanvasToolChange:
      paneToolbarVariant === "desktop-zoom" ? setDesktopCanvasTool : undefined,
    snapEnabled: paneToolbarVariant === "desktop-zoom" ? desktopSnapEnabled : undefined,
    onSnapEnabledChange:
      paneToolbarVariant === "desktop-zoom" ? setDesktopSnapEnabled : undefined,
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
    onSelectStockPhoto: (imageUrl) => {
      updateDesktopImageSettings({ remoteUrl: imageUrl, sourceMode: "url" })
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
      if (selectedTransformLayer) {
        handleLayerChange(activeQrNodeId, selectedTransformLayer.id, patch)
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
    onCornersReset: () => applyDraftingQrStateToControls(createDefaultDraftingWorkspaceQrState()),
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
    exportDownloadError,
    onExportReset: () => {
      setExportDownloadError(null)
      setSelectedDownloadExtension("png")
      setSelectedDownloadTarget("current")
      setSelectedRasterExportPresetId(DEFAULT_DRAFTING_RASTER_EXPORT_PRESET_ID)
    },
    onExportSettingsChange: updateDesktopExportSettings,
    onImageReset: resetDesktopShapeSettings,
    onImageSettingsChange: updateDesktopImageSettings,
    onLayersReset: () =>
      setLayerStateByNodeId((current) => ({
        ...current,
        [activeQrNodeId]: createDefaultDraftingLayers(activeQrNodeId, draftingStudioState, selectedCardState),
      })),
    onLayersSettingsChange: updateDesktopLayersSettings,
    onLayersReorder: handleLayerReorder,
    onLayerDelete: (layerId: string) => {
      handleLayerAction(activeQrNodeId, [layerId], "delete")
    },
    canDeleteLayer: (layerId: string) => isLayerDeletable(layerId, activeCanvasLayers),
    onLogoReset: resetDesktopLogoSettings,
    onLogoSettingsChange: updateDesktopLogoSettings,
    onMotionReset: () => setSelectedDotMatrixAnimation({ ...DEFAULT_DRAFTING_STUDIO_STATE.dotMatrixAnimation }),
    onMotionSettingsChange: updateDesktopMotionSettings,
    onPatternReset: resetDesktopPatternSettings,
    onPatternSettingsChange: updateDesktopPatternSettings,
    onShapeReset: resetDesktopShapeSettings,
    onShapeSettingsChange: updateDesktopShapeSettings,
    onTextReset: () => updateDesktopTextSettings({ ...DEFAULT_DRAFTING_TEXT_LAYER }),
    onTextSettingsChange: updateDesktopTextSettings,
  }

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
        "relative grid h-dvh w-full overflow-hidden overscroll-none bg-[var(--ws-surface-bg)] sm:h-dvh lg:shadow-[var(--ws-shadow-shell)]",
        "grid-rows-1 sm:h-dvh",
      )}
      data-compose-edit-mode="false"
      data-compose-selected-node-id={activeQrNodeId ?? ""}
    >

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
              history={{
                canRedo: canRedoDraftingWorkspace,
                canUndo: canUndoDraftingWorkspace,
                onRedo: handleRedoDraftingWorkspace,
                onUndo: handleUndoDraftingWorkspace,
              }}
              qr={{
                canAdd: qrCanvasLayers.length < 10,
                onAdd: () => {
                  void handleAddQrCode()
                },
              }}
              qrLayerCount={qrCanvasLayers.length}
              insertNodeId={activeQrNodeId}
              onBrowseStockPhotos={handleBrowseStockPhotos}
              onInsertLayer={handleInsertLayer}
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
              onRemoveQrCode={handleRemoveQrCode}
              panes={panes}
              fitCanvasToViewport
              snapEnabled={paneToolbarVariant === "desktop-zoom" ? desktopSnapEnabled : undefined}
              onSnapEnabledChange={
                paneToolbarVariant === "desktop-zoom" ? setDesktopSnapEnabled : undefined
              }
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
