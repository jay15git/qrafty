"use client"

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react"

import type {
  QrErrorCorrectionLevel,
  QrFileExtension,
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
  DEFAULT_DRAFTING_TEXT_LAYER,
  distributeDraftingCanvasLayers,
  fitQrSizeInCard,
  getDraftingCardLayerId,
  getDraftingQrLayerId,
  groupDraftingCanvasLayers,
  isDraftingCardLayerId,
  isProtectedDraftingLayerId,
  isDraftingQrLayerId,
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
import {
  readWorkspaceEditingMode,
  writeWorkspaceEditingMode,
  type WorkspaceEditingMode,
} from "@/features/workspace/model/workspace-editing-mode"
import { writeDraftingWorkspaceDraft } from "@/features/workspace/model/storage"
import { resolveWorkspaceBootstrapDocument } from "@/features/workspace/model/workspace-bootstrap"
import {
  buildDraftingLayeredNodePayload,
} from "@/features/workspace/export/layered-export"
import {
  DRAFTING_CARD_PATTERN_NONE_ID,
} from "@/features/workspace/model/card-patterns"
import {
  Canvas,
  type DraftingPaneCanvasTool,
  type DraftingPaneToolbarVariant,
} from "@/features/workspace/components/Canvas"
import type {
  DesktopAssetSourceMode,
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
  filterBrandIcons,
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
  createDefaultQrStudioState,
  type AssetSourceMode,
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

type DraftingBinaryColorMode = "solid" | "gradient"
type DraftingAssetSourceMode = Extract<AssetSourceMode, "upload" | "url">
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

const DEFAULT_DRAFTING_STUDIO_STATE = createDefaultQrStudioState()

function parseValueSegmentsText(text: string) {
  const segments = text
    .split("\n")
    .map((segment) => segment.trim())
    .filter(Boolean)

  return segments.length > 0 ? segments : undefined
}

function formatValueSegmentsText(segments: string[] | undefined) {
  return segments?.join("\n") ?? ""
}

const DEFAULT_DRAFTING_PANE_QR_SIZE = 240
const DRAFTING_LAYER_CLIPBOARD_TYPE = "new-qr/drafting-layers"
const DRAFTING_LAYER_CLIPBOARD_VERSION = 1
const DRAFTING_LAYER_PASTE_OFFSET = 24
const IGNORE_DRAFTING_UPLOAD_ERROR: (message: string) => void = () => undefined
const DEFAULT_DOWNLOAD_NAME = "new-qr-studio"
const DRAFTING_DOWNLOAD_EXTENSIONS = ["svg", "png", "webp", "jpeg"] as const satisfies ReadonlyArray<
  QrFileExtension
>
const DRAFTING_RASTER_EXPORT_PRESETS = [
  {
    id: "quick-share",
    label: "Quick share",
    primaryUse: "chat, email, docs, previews",
    sizePx: 512,
  },
  {
    id: "web-social",
    label: "Web & social",
    primaryUse: "websites, social posts, menus",
    sizePx: 1024,
  },
  {
    id: "small-print",
    label: "Small print",
    primaryUse: "stickers, cards, table tents",
    sizePx: 1600,
  },
  {
    id: "flyer-poster",
    label: "Flyer / poster",
    primaryUse: "flyers, posters, nearby signage",
    sizePx: 2400,
  },
  {
    id: "large-format",
    label: "Large format",
    primaryUse: "banners, wall signs, storefronts",
    sizePx: 3200,
  },
  {
    id: "max-quality",
    label: "Max quality",
    primaryUse: "designer handoff, archive, safest PNG",
    sizePx: 4096,
  },
] as const
type DraftingRasterExportPresetId = (typeof DRAFTING_RASTER_EXPORT_PRESETS)[number]["id"]
const DEFAULT_DRAFTING_RASTER_EXPORT_PRESET_ID: DraftingRasterExportPresetId = "web-social"

function swapDraftingQrNodeOrder(
  current: DraftingQrStateByNodeId,
  sourceNodeId: string,
  targetNodeId: string,
  activeNodeId: string,
  activeState: QrStudioState,
) {
  if (sourceNodeId === targetNodeId) {
    return current
  }

  const entries = Object.entries(current).map(([nodeId, state]) => [
    nodeId,
    nodeId === activeNodeId ? activeState : state,
  ] as const)
  const sourceIndex = entries.findIndex(([nodeId]) => nodeId === sourceNodeId)
  const targetIndex = entries.findIndex(([nodeId]) => nodeId === targetNodeId)

  if (sourceIndex === -1 || targetIndex === -1) {
    return current
  }

  const nextEntries = [...entries]
  const sourceEntry = nextEntries[sourceIndex]
  nextEntries[sourceIndex] = nextEntries[targetIndex]
  nextEntries[targetIndex] = sourceEntry

  return Object.fromEntries(nextEntries)
}

type DraftingDownloadExtension = (typeof DRAFTING_DOWNLOAD_EXTENSIONS)[number]
type DraftingDownloadTarget = "all-qr" | "current" | "surface" | `qr:${string}`

export function WorkspaceSurface({
  desktopTheme = "light",
  fontClassName,
  initialActiveTool,
  onDesktopThemeChange,
  paneToolbarVariant = "default",
  renderOverlay,
}: WorkspaceSurfaceProps = {}) {
  const [desktopRailTool, setDesktopRailTool] = useState<DesktopToolbarToolId | null>(
    () => initialActiveTool ?? "content",
  )
  const [backgroundInspectorTab, setBackgroundInspectorTab] =
    useState<DesktopBackgroundInspectorTab>("paper")
  const [composeSidebarPanel, setComposeSidebarPanel] = useState<ComposeSidebarPanel>(null)
  const [selectedContentType, setSelectedContentType] = useState<QrInputType>(
    DEFAULT_QR_INPUT_TYPE,
  )
  const [contentValuesByType, setContentValuesByType] =
    useState<DraftingContentValuesByType>(() => ({
      [DEFAULT_QR_INPUT_TYPE]: {
        ...getDefaultStaticQrValues(DEFAULT_QR_INPUT_TYPE),
        url: DEFAULT_DRAFTING_STUDIO_STATE.data,
      },
    }))
  const [contentTypeByNodeId, setContentTypeByNodeId] = useState<Record<string, QrInputType>>(
    () => ({
      [DASHBOARD_QR_NODE_ID]: DEFAULT_QR_INPUT_TYPE,
    }),
  )
  const [selectedQrMargin, setSelectedQrMargin] = useState(
    DEFAULT_DRAFTING_STUDIO_STATE.margin,
  )
  const [selectedQrRadius, setSelectedQrRadius] = useState(
    DEFAULT_DRAFTING_STUDIO_STATE.backgroundOptions.round,
  )
  const [selectedRasterExportQualityPercent, setSelectedRasterExportQualityPercent] =
    useState(DEFAULT_DRAFTING_STUDIO_STATE.rasterExportQualityPercent)
  const [selectedQrSize, setSelectedQrSize] = useState(
    DEFAULT_DRAFTING_PANE_QR_SIZE,
  )
  const [selectedDotType, setSelectedDotType] = useState<StudioDataModulesStyle>("rounded")
  const [selectedDotsColorMode, setSelectedDotsColorMode] = useState<DotsColorMode>(
    DEFAULT_DRAFTING_STUDIO_STATE.dotsColorMode,
  )
  const [selectedDotColor, setSelectedDotColor] = useState(
    DEFAULT_DRAFTING_STUDIO_STATE.dataModulesSettings.color,
  )
  const [selectedDotsGradient, setSelectedDotsGradient] = useState<StudioGradient>(
    structuredClone(DEFAULT_DRAFTING_STUDIO_STATE.dataModulesGradient),
  )
  const [selectedDotsPalette, setSelectedDotsPalette] = useState<string[]>([
    ...DEFAULT_DRAFTING_STUDIO_STATE.dotsPalette,
  ])
  const [selectedDotsPalettePreset, setSelectedDotsPalettePreset] = useState<string | "custom">("Signal")
  const [selectedDotMatrixAnimation, setSelectedDotMatrixAnimation] =
    useState<QrDotMatrixAnimationOptions>({
      ...DEFAULT_DRAFTING_STUDIO_STATE.dotMatrixAnimation,
    })
  const [openDotsColorItems, setOpenDotsColorItems] = useState<string[]>(["solid"])
  const [selectedQrFinderPatternOuterStyle, setSelectedQrFinderPatternOuterStyle] =
    useState<QrFinderPatternOuterStyle>("rounded-lg")
  const [selectedCornerSquareColorMode, setSelectedCornerSquareColorMode] =
    useState<DraftingBinaryColorMode>(
      DEFAULT_DRAFTING_STUDIO_STATE.finderPatternOuterGradient.enabled ? "gradient" : "solid",
    )
  const [selectedCornerSquareColor, setSelectedCornerSquareColor] = useState(
    DEFAULT_DRAFTING_STUDIO_STATE.finderPatternOuterSettings.color,
  )
  const [selectedCornerSquareGradient, setSelectedCornerSquareGradient] =
    useState<StudioGradient>(
      structuredClone(DEFAULT_DRAFTING_STUDIO_STATE.finderPatternOuterGradient),
    )
  const [openCornerSquareColorItems, setOpenCornerSquareColorItems] = useState<string[]>([
    "solid",
  ])
  const [selectedQrFinderPatternInnerStyle, setSelectedQrFinderPatternInnerStyle] =
    useState<StudioCornerDotStyle>("circle")
  const [selectedCornerDotColorMode, setSelectedCornerDotColorMode] =
    useState<DraftingBinaryColorMode>(
      DEFAULT_DRAFTING_STUDIO_STATE.finderPatternInnerGradient.enabled ? "gradient" : "solid",
    )
  const [selectedCornerDotColor, setSelectedCornerDotColor] = useState(
    DEFAULT_DRAFTING_STUDIO_STATE.finderPatternInnerSettings.color,
  )
  const [selectedCornerDotGradient, setSelectedCornerDotGradient] =
    useState<StudioGradient>(
      structuredClone(DEFAULT_DRAFTING_STUDIO_STATE.finderPatternInnerGradient),
    )
  const [openCornerDotColorItems, setOpenCornerDotColorItems] = useState<string[]>([
    "solid",
  ])
  const [selectedBackgroundColorMode, setSelectedBackgroundColorMode] =
    useState<DraftingBinaryColorMode>(
      DEFAULT_DRAFTING_STUDIO_STATE.backgroundGradient.enabled ? "gradient" : "solid",
    )
  const [selectedBackgroundColor, setSelectedBackgroundColor] = useState(
    DEFAULT_DRAFTING_STUDIO_STATE.backgroundOptions.color,
  )
  const [selectedBackgroundTransparent, setSelectedBackgroundTransparent] =
    useState(false)
  const [selectedBackgroundGradient, setSelectedBackgroundGradient] =
    useState<StudioGradient>(
      structuredClone(DEFAULT_DRAFTING_STUDIO_STATE.backgroundGradient),
    )
  const [selectedBackgroundShapeId, setSelectedBackgroundShapeId] =
    useState<QrBackgroundShapeId>(DEFAULT_DRAFTING_STUDIO_STATE.backgroundShapeId)
  const [selectedBackgroundShapeOptions, setSelectedBackgroundShapeOptions] =
    useState<BackgroundShapeOptions>(() => ({
      ...DEFAULT_DRAFTING_STUDIO_STATE.backgroundShapeOptions,
    }))
  const [openBackgroundColorItems, setOpenBackgroundColorItems] = useState<string[]>([
    "solid",
  ])
  const [selectedBackgroundAssetSourceMode, setSelectedBackgroundAssetSourceMode] =
    useState<DraftingAssetSourceMode>(
      DEFAULT_DRAFTING_STUDIO_STATE.backgroundImage.source === "url" ? "url" : "upload",
    )
  const [selectedBackgroundRemoteUrl, setSelectedBackgroundRemoteUrl] = useState(
    DEFAULT_DRAFTING_STUDIO_STATE.backgroundImage.source === "url"
      ? (DEFAULT_DRAFTING_STUDIO_STATE.backgroundImage.value ?? "")
      : "",
  )
  const [openBackgroundUploadItems, setOpenBackgroundUploadItems] = useState<string[]>([
    "upload",
  ])
  const [selectedLogoColorMode, setSelectedLogoColorMode] = useState<DraftingBinaryColorMode>(
    DEFAULT_DRAFTING_STUDIO_STATE.logoGradient.enabled ? "gradient" : "solid",
  )
  const [selectedLogoSourceMode, setSelectedLogoSourceMode] = useState<AssetSourceMode>(
    DEFAULT_DRAFTING_STUDIO_STATE.logo.source,
  )
  const [selectedLogoColor, setSelectedLogoColor] = useState(
    DEFAULT_DRAFTING_STUDIO_STATE.logo.presetColor ?? DEFAULT_BRAND_ICON_COLOR,
  )
  const [selectedLogoGradient, setSelectedLogoGradient] = useState<StudioGradient>(
    structuredClone(DEFAULT_DRAFTING_STUDIO_STATE.logoGradient),
  )
  const [openLogoColorItems, setOpenLogoColorItems] = useState<string[]>(["solid"])
  const [brandIconQuery, setBrandIconQuery] = useState("")
  const [brandIconCategory, setBrandIconCategory] =
    useState<DraftingBrandIconCategoryFilter>("all")
  const [selectedLogoPresetId, setSelectedLogoPresetId] = useState<string | undefined>(
    DEFAULT_DRAFTING_STUDIO_STATE.logo.presetId,
  )
  const [selectedLogoPresetValue, setSelectedLogoPresetValue] = useState<string | undefined>(
    DEFAULT_DRAFTING_STUDIO_STATE.logo.value,
  )
  const [selectedLogoAssetSourceMode, setSelectedLogoAssetSourceMode] =
    useState<DraftingAssetSourceMode>(
      DEFAULT_DRAFTING_STUDIO_STATE.logo.source === "url" ? "url" : "upload",
    )
  const [selectedLogoRemoteUrl, setSelectedLogoRemoteUrl] = useState(
    DEFAULT_DRAFTING_STUDIO_STATE.logo.source === "url"
      ? (DEFAULT_DRAFTING_STUDIO_STATE.logo.value ?? "")
      : "",
  )
  const [selectedLogoUploadValue, setSelectedLogoUploadValue] = useState(
    DEFAULT_DRAFTING_STUDIO_STATE.logo.source === "upload"
      ? (DEFAULT_DRAFTING_STUDIO_STATE.logo.value ?? "")
      : "",
  )
  const [openLogoUploadItems, setOpenLogoUploadItems] = useState<string[]>(["upload"])
  const [selectedLogoSize, setSelectedLogoSize] = useState(
    DEFAULT_DRAFTING_STUDIO_STATE.imageOptions.imageSize * 100,
  )
  const [selectedLogoMargin, setSelectedLogoMargin] = useState(
    DEFAULT_DRAFTING_STUDIO_STATE.imageOptions.margin,
  )
  const [selectedHideBackgroundDots, setSelectedHideBackgroundDots] = useState(
    DEFAULT_DRAFTING_STUDIO_STATE.imageOptions.hideBackgroundDots,
  )
  const [selectedQrTypeNumber, setSelectedQrTypeNumber] = useState<QrTypeNumber>(
    DEFAULT_DRAFTING_STUDIO_STATE.qrOptions.typeNumber,
  )
  const [selectedQrErrorCorrectionLevel, setSelectedQrErrorCorrectionLevel] =
    useState<QrErrorCorrectionLevel>(
      DEFAULT_DRAFTING_STUDIO_STATE.qrOptions.errorCorrectionLevel,
    )
  const [selectedBoostLevel, setSelectedBoostLevel] = useState(
    DEFAULT_DRAFTING_STUDIO_STATE.qrOptions.boostLevel,
  )
  const [selectedQrMode, setSelectedQrMode] = useState<QrMode>(
    DEFAULT_DRAFTING_STUDIO_STATE.qrOptions.mode,
  )
  const [selectedValueSegmentsText, setSelectedValueSegmentsText] = useState("")
  const [selectedAriaLabel, setSelectedAriaLabel] = useState("")
  const [selectedModuleRoundSize, setSelectedModuleRoundSize] = useState(
    DEFAULT_DRAFTING_STUDIO_STATE.dataModulesSettings.roundSize,
  )
  const [selectedModuleSize, setSelectedModuleSize] = useState<number | undefined>(undefined)
  const [selectedModuleLineWidth, setSelectedModuleLineWidth] = useState<number | undefined>(
    undefined,
  )
  const [selectedGradientLinkMode, setSelectedGradientLinkMode] = useState<QrGradientLinkMode>(
    DEFAULT_DRAFTING_STUDIO_STATE.gradientLinkMode,
  )
  const [selectedLogoOpacity, setSelectedLogoOpacity] = useState(
    DEFAULT_DRAFTING_STUDIO_STATE.imageOptions.opacity * 100,
  )
  const [selectedLogoSizeMode, setSelectedLogoSizeMode] = useState<QrLogoSizeMode>(
    DEFAULT_DRAFTING_STUDIO_STATE.imageOptions.sizeMode,
  )
  const [selectedLogoWidthPx, setSelectedLogoWidthPx] = useState<number | undefined>(undefined)
  const [selectedLogoHeightPx, setSelectedLogoHeightPx] = useState<number | undefined>(undefined)
  const [selectedLogoLockAspect, setSelectedLogoLockAspect] = useState(
    DEFAULT_DRAFTING_STUDIO_STATE.imageOptions.lockAspect,
  )
  const [selectedLogoPositionMode, setSelectedLogoPositionMode] = useState<QrLogoPositionMode>(
    DEFAULT_DRAFTING_STUDIO_STATE.imageOptions.logoPositionMode,
  )
  const [selectedLogoOffsetX, setSelectedLogoOffsetX] = useState(0)
  const [selectedLogoOffsetY, setSelectedLogoOffsetY] = useState(0)
  const [selectedLogoCrossOrigin, setSelectedLogoCrossOrigin] = useState<QrCrossOrigin>(
    DEFAULT_DRAFTING_STUDIO_STATE.imageOptions.crossOrigin,
  )
  const [activeQrNodeId, setActiveQrNodeId] = useState(DASHBOARD_QR_NODE_ID)
  const [qrStateByNodeId, setQrStateByNodeId] = useState<DraftingQrStateByNodeId>(() => ({
    [DASHBOARD_QR_NODE_ID]: createDefaultDraftingWorkspaceQrState(),
  }))
  const [selectedCardState, setSelectedCardState] = useState<DraftingCardState>(() =>
    createDefaultDraftingCardState(),
  )
  const [cardStateByNodeId, setCardStateByNodeId] = useState<DraftingCardStateByNodeId>(() => ({
    [DASHBOARD_QR_NODE_ID]: createDefaultDraftingCardState(),
  }))
  const [sceneCompositionByNodeId, setSceneCompositionByNodeId] =
    useState<SceneCompositionByNodeId>(() => ({
      [DASHBOARD_QR_NODE_ID]: createDefaultSceneComposition(),
    }))
  const [layerStateByNodeId, setLayerStateByNodeId] = useState<DraftingLayerStateByNodeId>(() => {
    const qrState = createDefaultDraftingWorkspaceQrState()
    const cardState = createDefaultDraftingCardState()

    return {
      [DASHBOARD_QR_NODE_ID]: createDefaultDraftingLayers(
        DASHBOARD_QR_NODE_ID,
        qrState,
        cardState,
      ),
    }
  })
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(() =>
    getDraftingQrLayerId(DASHBOARD_QR_NODE_ID),
  )
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>(() => [
    getDraftingQrLayerId(DASHBOARD_QR_NODE_ID),
  ])
  const [editingMode, setEditingMode] = useState<WorkspaceEditingMode>(() =>
    readWorkspaceEditingMode(),
  )
  const [desktopCanvasTool, setDesktopCanvasTool] = useState<DraftingPaneCanvasTool | null>(null)
  const [showDesktopCanvasGrid, setShowDesktopCanvasGrid] = useState(true)
  const [selectedDownloadExtension, setSelectedDownloadExtension] =
    useState<DraftingDownloadExtension>("png")
  const [selectedDownloadTarget, setSelectedDownloadTarget] =
    useState<DraftingDownloadTarget>("current")
  const [exportDownloadError, setExportDownloadError] = useState<string | null>(null)
  const [selectedRasterExportPresetId, setSelectedRasterExportPresetId] =
    useState<DraftingRasterExportPresetId>(DEFAULT_DRAFTING_RASTER_EXPORT_PRESET_ID)
  const [selectedExportPresetId, setSelectedExportPresetId] = useState<ExportPresetId | undefined>(
    undefined,
  )
  const [selectedUsePlatformExportPreset, setSelectedUsePlatformExportPreset] = useState(false)
  const [isDraftingWorkspaceReady, setIsDraftingWorkspaceReady] = useState(false)
  const [draftingHistoryRevision, setDraftingHistoryRevision] = useState(0)
  const draftingWorkspaceAutosaveTimerRef = useRef<number | null>(null)
  const draftingWorkspaceHistoryTimerRef = useRef<number | null>(null)
  const draftingWorkspaceHistoryRef = useRef<DraftingWorkspaceDocumentV1[]>([])
  const draftingWorkspaceHistoryIndexRef = useRef(-1)
  const isApplyingDraftingWorkspaceHistoryRef = useRef(false)
  const shouldReplaceCurrentDraftingHistoryEntryRef = useRef(false)
  const draftingSurfaceRef = useRef<HTMLElement | null>(null)
  const iconstackSvgCacheRef = useRef<Map<string, string>>(new Map())
  const draftingLayerClipboardRef = useRef<string>("")
  const filteredBrandIcons = filterBrandIcons(brandIconQuery, brandIconCategory)
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
  const isFreeEditing = editingMode === "free"
  const keyboardStateRef = useRef({
    activeQrNodeId,
    draftingStudioState,
    isFreeEditing,
    layerStateByNodeId,
    qrNodeCount: Object.keys(qrStateByNodeId).length,
    selectedCardState,
    selectedLayerIds,
  })
  const ensureDotsColorItemExpanded = (itemId: DotsColorMode) =>
    setOpenDotsColorItems((current) =>
      current.includes(itemId) ? current : [...current, itemId],
    )
  const ensureCornerSquareColorItemExpanded = (itemId: DraftingBinaryColorMode) =>
    setOpenCornerSquareColorItems((current) =>
      current.includes(itemId) ? current : [...current, itemId],
    )
  const ensureCornerDotColorItemExpanded = (itemId: DraftingBinaryColorMode) =>
    setOpenCornerDotColorItems((current) =>
      current.includes(itemId) ? current : [...current, itemId],
    )
  const ensureBackgroundColorItemExpanded = (itemId: DraftingBinaryColorMode) =>
    setOpenBackgroundColorItems((current) =>
      current.includes(itemId) ? current : [...current, itemId],
    )
  const ensureLogoColorItemExpanded = (itemId: DraftingBinaryColorMode) =>
    setOpenLogoColorItems((current) =>
      current.includes(itemId) ? current : [...current, itemId],
    )
  const ensureBackgroundUploadItemExpanded = (itemId: DraftingAssetSourceMode) =>
    setOpenBackgroundUploadItems((current) =>
      current.includes(itemId) ? current : [...current, itemId],
    )
  const ensureLogoUploadItemExpanded = (itemId: DraftingAssetSourceMode) =>
    setOpenLogoUploadItems((current) =>
      current.includes(itemId) ? current : [...current, itemId],
    )
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

  const qrNodeIds = useMemo(() => Object.keys(qrStateByNodeId), [qrStateByNodeId])
  const qrPaneNamesById = useMemo(() => {
    const next = new Map<string, string>()

    qrNodeIds.forEach((nodeId, index) => {
      next.set(nodeId, index === 0 ? "QR Code" : `QR Code ${index + 1}`)
    })

    return next
  }, [qrNodeIds])
  const activeQrDownloadTarget = getDraftingQrNodeDownloadTarget(activeQrNodeId)
  const shouldMeasureActiveQrExport =
    selectedDownloadTarget === "current" ||
    selectedDownloadTarget === activeQrDownloadTarget

  const draftingWorkspaceDocument = useMemo(
    () => buildDraftingWorkspaceDocument(),
    // buildDraftingWorkspaceDocument reads exactly the state listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      activeQrNodeId,
      cardStateByNodeId,
      contentTypeByNodeId,
      contentValuesByType,
      draftingStudioState,
      layerStateByNodeId,
      qrStateByNodeId,
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

  function buildDraftingLogoStateSnapshot({
    logoColor = selectedLogoColor,
    logoColorMode = selectedLogoColorMode,
    logoGradient = selectedLogoGradient,
    logoPresetId = selectedLogoPresetId,
    logoPresetValue = selectedLogoPresetValue,
    logoRemoteUrl = selectedLogoRemoteUrl,
    logoSourceMode = selectedLogoSourceMode,
    logoUploadValue = selectedLogoUploadValue,
  }: {
    logoColor?: string
    logoColorMode?: DraftingBinaryColorMode
    logoGradient?: StudioGradient
    logoPresetId?: string
    logoPresetValue?: string
    logoRemoteUrl?: string
    logoSourceMode?: AssetSourceMode
    logoUploadValue?: string
  } = {}): QrStudioState {
    return {
      ...DEFAULT_DRAFTING_STUDIO_STATE,
      logo: {
        presetColor: logoColor,
        presetId: logoPresetId,
        source: logoSourceMode,
        value:
          logoSourceMode === "preset"
            ? logoPresetValue
            : logoSourceMode === "url"
              ? logoRemoteUrl
              : logoSourceMode === "upload"
                ? logoUploadValue
                : undefined,
      },
      logoGradient: {
        ...structuredClone(logoGradient),
        enabled: logoColorMode === "gradient",
      },
    }
  }

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

  function clearDraftingLogoPreset(nextSourceMode: DraftingAssetSourceMode) {
    const clearedState = applyAssetNoneSelection(buildDraftingLogoStateSnapshot(), "logo")

    setSelectedLogoPresetId(clearedState.logo.presetId)
    setSelectedLogoPresetValue(undefined)
    setSelectedLogoSourceMode(nextSourceMode)
    setSelectedLogoAssetSourceMode(nextSourceMode)

    if (nextSourceMode === "upload") {
      setSelectedLogoRemoteUrl("")
      setSelectedLogoUploadValue("")
    }
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
      buildDraftingLogoStateSnapshot({
        logoColorMode: selectedLogoColorMode,
      }),
      selectionId,
      nextValue,
      selectedLogoColor,
    )

    setSelectedLogoPresetId(selectionId)
    syncDraftingLogoAsset(nextState)
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
      buildDraftingLogoStateSnapshot({
        logoColorMode: selectedLogoColorMode,
      }),
      brandIcon,
      nextValue,
      selectedLogoColor,
    )

    syncDraftingLogoAsset(nextState)
  }

  async function handleDraftingLogoColorChange(value: string) {
    ensureLogoColorItemExpanded("solid")
    setSelectedLogoColorMode("solid")
    setSelectedLogoColor(value)

    const iconstackSelectionId = parseIconstackSelectionId(selectedLogoPresetId)
      ? selectedLogoPresetId
      : undefined

    if (iconstackSelectionId) {
      const svg = await resolveIconstackSvgMarkup(iconstackSelectionId)
      if (!svg) {
        return
      }

      const nextState = applyLogoPresetColor(
        buildDraftingLogoStateSnapshot({
          logoColor: value,
          logoColorMode: "solid",
        }),
        createIconstackIconDataUrl(svg, value),
        value,
      )

      syncDraftingLogoAsset(nextState)
      return
    }

    const selectedIcon = findBrandIconById(selectedLogoPresetId)

    if (!selectedIcon) {
      return
    }

    const nextState = applyLogoPresetColor(
      buildDraftingLogoStateSnapshot({
        logoColor: value,
        logoColorMode: "solid",
      }),
      createBrandIconDataUrl(selectedIcon, value),
      value,
    )

    syncDraftingLogoAsset(nextState)
  }

  async function handleDraftingLogoGradientChange(value: StudioGradient) {
    const nextGradient = {
      ...structuredClone(value),
      enabled: true,
    }

    ensureLogoColorItemExpanded("gradient")
    setSelectedLogoColorMode("gradient")
    setSelectedLogoGradient(nextGradient)

    const iconstackSelectionId = parseIconstackSelectionId(selectedLogoPresetId)
      ? selectedLogoPresetId
      : undefined

    if (iconstackSelectionId) {
      const svg = await resolveIconstackSvgMarkup(iconstackSelectionId)
      if (!svg) {
        return
      }

      const nextState = applyLogoPresetGradient(
        buildDraftingLogoStateSnapshot({
          logoColorMode: "gradient",
          logoGradient: nextGradient,
        }),
        createIconstackIconGradientDataUrl(svg, nextGradient),
        nextGradient,
      )

      syncDraftingLogoAsset(nextState)
      return
    }

    const selectedIcon = findBrandIconById(selectedLogoPresetId)

    if (!selectedIcon) {
      return
    }

    const nextState = applyLogoPresetGradient(
      buildDraftingLogoStateSnapshot({
        logoColorMode: "gradient",
        logoGradient: nextGradient,
      }),
      createBrandIconGradientDataUrl(selectedIcon, nextGradient),
      nextGradient,
    )

    syncDraftingLogoAsset(nextState)
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
    setOpenDotsColorItems([nextState.dotsColorMode])
    setSelectedQrFinderPatternOuterStyle(nextState.finderPatternOuterSettings.type)
    setSelectedCornerSquareColorMode(
      nextState.finderPatternOuterGradient.enabled ? "gradient" : "solid",
    )
    setSelectedCornerSquareColor(nextState.finderPatternOuterSettings.color)
    setSelectedCornerSquareGradient(structuredClone(nextState.finderPatternOuterGradient))
    setOpenCornerSquareColorItems([
      nextState.finderPatternOuterGradient.enabled ? "gradient" : "solid",
    ])
    setSelectedQrFinderPatternInnerStyle(nextState.finderPatternInnerSettings.type)
    setSelectedCornerDotColorMode(nextState.finderPatternInnerGradient.enabled ? "gradient" : "solid")
    setSelectedCornerDotColor(nextState.finderPatternInnerSettings.color)
    setSelectedCornerDotGradient(structuredClone(nextState.finderPatternInnerGradient))
    setOpenCornerDotColorItems([nextState.finderPatternInnerGradient.enabled ? "gradient" : "solid"])
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
    setOpenBackgroundColorItems([nextState.backgroundGradient.enabled ? "gradient" : "solid"])
    setSelectedBackgroundAssetSourceMode(
      nextState.backgroundImage.source === "url" ? "url" : "upload",
    )
    setSelectedBackgroundRemoteUrl(
      nextState.backgroundImage.source === "url" ? (nextState.backgroundImage.value ?? "") : "",
    )
    setOpenBackgroundUploadItems([
      nextState.backgroundImage.source === "url" ? "url" : "upload",
    ])
    setSelectedLogoColorMode(nextState.logoGradient.enabled ? "gradient" : "solid")
    setSelectedLogoSourceMode(nextState.logo.source)
    setSelectedLogoColor(nextState.logo.presetColor ?? DEFAULT_BRAND_ICON_COLOR)
    setSelectedLogoGradient(structuredClone(nextState.logoGradient))
    setOpenLogoColorItems([nextState.logoGradient.enabled ? "gradient" : "solid"])
    setSelectedLogoPresetId(nextState.logo.presetId)
    setSelectedLogoPresetValue(nextState.logo.source === "preset" ? nextState.logo.value : undefined)
    setSelectedLogoAssetSourceMode(nextState.logo.source === "url" ? "url" : "upload")
    setSelectedLogoRemoteUrl(
      nextState.logo.source === "url" ? (nextState.logo.value ?? "") : "",
    )
    setSelectedLogoUploadValue(
      nextState.logo.source === "upload" ? (nextState.logo.value ?? "") : "",
    )
    setOpenLogoUploadItems([nextState.logo.source === "url" ? "url" : "upload"])
    setSelectedLogoSize(nextState.imageOptions.imageSize * 100)
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
    const qrStateEntries = Object.entries(qrStateByNodeId)
    const nextQrStateByNodeId: DraftingQrStateByNodeId = {}
    const nextCardStateByNodeId: DraftingCardStateByNodeId = {}
    const nextLayerStateByNodeId: DraftingLayerStateByNodeId = {}
    const qrOrder = qrStateEntries.length > 0
      ? qrStateEntries.map(([nodeId]) => nodeId)
      : [activeQrNodeId]

    for (const nodeId of qrOrder) {
      nextQrStateByNodeId[nodeId] =
        nodeId === activeQrNodeId
          ? cloneDraftingQrState(draftingStudioState)
          : cloneDraftingQrState(qrStateByNodeId[nodeId] ?? draftingStudioState)
      nextCardStateByNodeId[nodeId] =
        nodeId === activeQrNodeId
          ? cloneDraftingCardState(selectedCardState)
          : cloneDraftingCardState(cardStateByNodeId[nodeId] ?? selectedCardState)
      nextLayerStateByNodeId[nodeId] = (
        layerStateByNodeId[nodeId] ??
        createDefaultDraftingLayers(
          nodeId,
          nextQrStateByNodeId[nodeId],
          nextCardStateByNodeId[nodeId],
        )
      ).map(cloneDraftingCanvasLayer)
    }

    if (!nextQrStateByNodeId[activeQrNodeId]) {
      qrOrder.push(activeQrNodeId)
      nextQrStateByNodeId[activeQrNodeId] = cloneDraftingQrState(draftingStudioState)
      nextCardStateByNodeId[activeQrNodeId] = cloneDraftingCardState(selectedCardState)
      nextLayerStateByNodeId[activeQrNodeId] = createDefaultDraftingLayers(
        activeQrNodeId,
        draftingStudioState,
        selectedCardState,
      )
    }

    const nextContentTypeByNodeId: Record<string, QrInputType> = {
      ...contentTypeByNodeId,
      [activeQrNodeId]: selectedContentType,
    }
    for (const nodeId of qrOrder) {
      if (!nextContentTypeByNodeId[nodeId]) {
        nextContentTypeByNodeId[nodeId] = DEFAULT_QR_INPUT_TYPE
      }
    }

    return {
      activeQrNodeId,
      cardStateByNodeId: nextCardStateByNodeId,
      contentTypeByNodeId: nextContentTypeByNodeId,
      contentValuesByType: structuredClone(contentValuesByType),
      layerStateByNodeId: nextLayerStateByNodeId,
      qrOrder,
      qrStateByNodeId: nextQrStateByNodeId,
      sceneCompositionByNodeId: cloneSceneCompositionByNodeId(sceneCompositionByNodeId),
      selectedContentType,
      version: 1,
    }
  }

  function applyDraftingWorkspaceDocumentToControls(
    nextDocument: DraftingWorkspaceDocumentV1,
  ) {
    const nextQrOrder = nextDocument.qrOrder.filter(
      (nodeId) => nextDocument.qrStateByNodeId[nodeId],
    )
    const activeNodeId = nextDocument.qrStateByNodeId[nextDocument.activeQrNodeId]
      ? nextDocument.activeQrNodeId
      : (nextQrOrder[0] ?? DASHBOARD_QR_NODE_ID)
    const activeState =
      nextDocument.qrStateByNodeId[activeNodeId] ?? createDefaultDraftingWorkspaceQrState()
    const activeCardState =
      nextDocument.cardStateByNodeId[activeNodeId] ?? createDefaultDraftingCardState()
    const nextQrStateByNodeId: DraftingQrStateByNodeId = {}
    const nextCardStateByNodeId: DraftingCardStateByNodeId = {}
    const nextLayerStateByNodeId: DraftingLayerStateByNodeId = {}

    for (const nodeId of nextQrOrder.length > 0 ? nextQrOrder : [activeNodeId]) {
      nextQrStateByNodeId[nodeId] = cloneDraftingQrState(
        nextDocument.qrStateByNodeId[nodeId] ?? activeState,
      )
      nextCardStateByNodeId[nodeId] = cloneDraftingCardState(
        nextDocument.cardStateByNodeId[nodeId] ?? activeCardState,
      )
      nextLayerStateByNodeId[nodeId] = (
        nextDocument.layerStateByNodeId[nodeId] ??
        createDefaultDraftingLayers(
          nodeId,
          nextQrStateByNodeId[nodeId],
          nextCardStateByNodeId[nodeId],
        )
      ).map(cloneDraftingCanvasLayer)
    }

    setActiveQrNodeId(activeNodeId)
    setQrStateByNodeId(nextQrStateByNodeId)
    setCardStateByNodeId(nextCardStateByNodeId)
    setLayerStateByNodeId(nextLayerStateByNodeId)
    setSceneCompositionByNodeId(
      cloneSceneCompositionByNodeId(
        nextDocument.sceneCompositionByNodeId ??
          createDefaultSceneCompositionByNodeId(nextDocument),
      ),
    )
    setContentTypeByNodeId(structuredClone(nextDocument.contentTypeByNodeId))
    setSelectedContentType(nextDocument.selectedContentType)
    setContentValuesByType(structuredClone(nextDocument.contentValuesByType))
    applyDraftingQrStateToControls(activeState)
    setSelectedCardState(cloneDraftingCardState(activeCardState))
    selectSingleLayer(getDraftingQrLayerId(activeNodeId))
  }

  function handleEditingModeChange(mode: WorkspaceEditingMode) {
    setEditingMode(mode)
    writeWorkspaceEditingMode(mode)

    if (mode === "template") {
      selectSingleLayer(null)
      setDesktopCanvasTool(null)
      setComposeSidebarPanel(null)

      const normalizedCardState = normalizeDraftingCardState({
        ...selectedCardState,
        lockAspectRatio: true,
        sizeMode: "fixed",
      })
      const fittedQr = fitQrSizeInCard(draftingStudioState, normalizedCardState)
      const nextQrState = {
        ...draftingStudioState,
        height: fittedQr.height,
        width: fittedQr.width,
      }

      setSelectedCardState(normalizedCardState)
      setSelectedQrSize(fittedQr.width)
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

      setDesktopRailTool("layout")
    }
  }

  function selectSingleLayer(layerId: string | null) {
    setSelectedLayerId(layerId)
    setSelectedLayerIds(layerId ? [layerId] : [])
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

  function handlePaneSelection(paneId: string) {
    draftingSurfaceRef.current?.focus({ preventScroll: true })

    if (paneId === activeQrNodeId) {
      return
    }

    shouldReplaceCurrentDraftingHistoryEntryRef.current = true

    // Save current controls state to the old active pane
    setContentTypeByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: selectedContentType,
    }))
    setQrStateByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: cloneDraftingQrState(draftingStudioState),
    }))
    setCardStateByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: cloneDraftingCardState(selectedCardState),
    }))

    // Load the new pane's state into controls
    const nextState = qrStateByNodeId[paneId] ?? draftingStudioState
    const nextCardState = cardStateByNodeId[paneId] ?? selectedCardState
    const nextContentType = contentTypeByNodeId[paneId] ?? DEFAULT_QR_INPUT_TYPE
    setActiveQrNodeId(paneId)
    applyDraftingQrStateToControls(nextState)
    setSelectedContentType(nextContentType)
    setSelectedCardState(cloneDraftingCardState(nextCardState))
    selectSingleLayer(getDraftingQrLayerId(paneId))
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
    setBrandIconQuery("")
    setBrandIconCategory("all")
    setActiveQrNodeId(DASHBOARD_QR_NODE_ID)
    setContentTypeByNodeId({
      [DASHBOARD_QR_NODE_ID]: DEFAULT_QR_INPUT_TYPE,
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
      activeQrNodeId,
      draftingStudioState,
      isFreeEditing,
      layerStateByNodeId,
      qrNodeCount: qrNodeIds.length,
      selectedCardState,
      selectedLayerIds,
    }
  }, [
    activeQrNodeId,
    draftingStudioState,
    isFreeEditing,
    layerStateByNodeId,
    qrNodeIds.length,
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
        if (!keyboardStateRef.current.isFreeEditing) {
          return
        }

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

          if (currentSelectedLayerIds.length > 0) {
            event.preventDefault()
            for (const layerId of currentSelectedLayerIds) {
              const layer = activeLayers.find((item) => item.id === layerId)

              if (layer && !layer.isLocked) {
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
        void handleAddQrCode()
        return
      }

      if (!keyboardStateRef.current.isFreeEditing) {
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
        return
      }

      if (key === "l" && event.shiftKey) {
        event.preventDefault()
        toggleSelectedLayerLock()
        return
      }

      if (key === "h" && event.shiftKey) {
        event.preventDefault()
        toggleSelectedLayerVisibility()
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

      if (!keyboardStateRef.current.isFreeEditing) {
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

      if (!keyboardStateRef.current.isFreeEditing) {
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
    if (qrNodeIds.length >= 10) return

    const sourceState = draftingStudioState
    const nextNodeId = `${DASHBOARD_QR_NODE_ID}-${crypto.randomUUID()}`

    // Save current controls to active pane first
    setQrStateByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: cloneDraftingQrState(draftingStudioState),
      [nextNodeId]: cloneDraftingQrState(sourceState),
    }))
    setCardStateByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: cloneDraftingCardState(selectedCardState),
      [nextNodeId]: cloneDraftingCardState(selectedCardState),
    }))
    setContentTypeByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: selectedContentType,
      [nextNodeId]: selectedContentType,
    }))
    setLayerStateByNodeId((current) => ({
      ...current,
      [nextNodeId]: createDefaultDraftingLayers(
        nextNodeId,
        sourceState,
        selectedCardState,
      ),
    }))
    setSceneCompositionByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: normalizeSceneComposition(
        current[activeQrNodeId] ?? createDefaultSceneComposition(),
      ),
      [nextNodeId]: normalizeSceneComposition(
        current[activeQrNodeId] ?? createDefaultSceneComposition(),
      ),
    }))

    setActiveQrNodeId(nextNodeId)
    applyDraftingQrStateToControls(sourceState)
    setSelectedCardState(cloneDraftingCardState(selectedCardState))
    selectSingleLayer(getDraftingQrLayerId(nextNodeId))
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

  function handleRemoveQrCode(paneId: string) {
    setQrStateByNodeId((current) => {
      const next = { ...current }
      delete next[paneId]
      return next
    })
    setCardStateByNodeId((current) => {
      const next = { ...current }
      delete next[paneId]
      return next
    })
    setLayerStateByNodeId((current) => {
      const next = { ...current }
      delete next[paneId]
      return next
    })

    if (activeQrNodeId === paneId) {
      // Find fallback pane
      const fallbackId = Object.keys(qrStateByNodeId).find(
        (id) => id !== paneId,
      ) ?? DASHBOARD_QR_NODE_ID
      setActiveQrNodeId(fallbackId)
      const fallbackState =
        qrStateByNodeId[fallbackId] ?? createDefaultDraftingWorkspaceQrState()
      const fallbackCardState = cardStateByNodeId[fallbackId] ?? createDefaultDraftingCardState()
      applyDraftingQrStateToControls(fallbackState)
      setSelectedCardState(cloneDraftingCardState(fallbackCardState))
      selectSingleLayer(getDraftingQrLayerId(fallbackId))
    }
  }

  function handleLayerSelect(
    paneId: string,
    layerId: string | null,
    options?: { additive?: boolean; preserveActiveTool?: boolean },
  ) {
    draftingSurfaceRef.current?.focus({ preventScroll: true })

    if (paneId !== activeQrNodeId) {
      handlePaneSelection(paneId)
    }

    if (options?.additive && paneId === activeQrNodeId && layerId !== null) {
      setSelectedLayerIds((current) => {
        const next = current.includes(layerId)
          ? current.filter((id) => id !== layerId)
          : [...current, layerId]

        setSelectedLayerId(next.at(-1) ?? null)
        return next
      })
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

    setSelectedLayerIds((current) => {
      const next = options?.additive
        ? Array.from(new Set([...current, ...layerIds]))
        : layerIds

      setSelectedLayerId(next.at(-1) ?? null)
      return next
    })
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

    return layers.filter((layer) => layer.isVisible && !layer.isLocked)
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

    setSelectedLayerIds(layerIds)
    setSelectedLayerId(layerIds.at(-1) ?? null)
  }

  function clearDraftingLayerSelection() {
    setSelectedLayerIds([])
    setSelectedLayerId(null)
  }

  function toggleSelectedLayerLock() {
    const selectedLayers = getSelectedActiveLayers()

    if (selectedLayers.length === 0) {
      return
    }

    handleLayerAction(
      keyboardStateRef.current.activeQrNodeId,
      selectedLayers.map((layer) => layer.id),
      selectedLayers.some((layer) => !layer.isLocked) ? "lock" : "unlock",
    )
  }

  function toggleSelectedLayerVisibility() {
    const selectedLayers = getSelectedActiveLayers()

    if (selectedLayers.length === 0) {
      return
    }

    handleLayerAction(
      keyboardStateRef.current.activeQrNodeId,
      selectedLayers.map((layer) => layer.id),
      selectedLayers.some((layer) => layer.isVisible) ? "hide" : "show",
    )
  }

  function deleteSelectedLayersOrPane() {
    const {
      activeQrNodeId: currentActiveQrNodeId,
      draftingStudioState: currentDraftingStudioState,
      layerStateByNodeId: currentLayerStateByNodeId,
      qrNodeCount: currentQrNodeCount,
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
    const removableLayerIds = layers
      .filter((layer) => selectedLayerIdSet.has(layer.id))
      .filter((layer) => !isDraftingQrLayerId(layer.id))
      .map((layer) => layer.id)

    if (removableLayerIds.length > 0) {
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
          [currentActiveQrNodeId]: currentLayers
            .filter((layer) => !removableLayerIds.includes(layer.id))
            .map(cloneDraftingCanvasLayer),
        }
      })

      setSelectedLayerIds((current) => {
        const next = current.filter((layerId) => !removableLayerIds.includes(layerId))

        setSelectedLayerId(next.at(-1) ?? null)
        return next
      })
      return
    }

    if (currentSelectedLayerIds.length === 0 && currentQrNodeCount > 1) {
      handleRemoveQrCode(currentActiveQrNodeId)
    }
  }

  function handleLayerChange(
    paneId: string,
    layerId: string,
    patch: Partial<DraftingCanvasLayer>,
  ) {
    if (isProtectedDraftingLayerId(layerId)) {
      const { isLocked: _isLocked, isVisible: _isVisible, ...safePatch } = patch
      if (Object.keys(safePatch).length === 0) {
        return
      }
      patch = safePatch
    }

    setLayerStateByNodeId((current) => {
      const currentQrState =
        paneId === activeQrNodeId
          ? draftingStudioState
          : (qrStateByNodeId[paneId] ?? createDefaultDraftingWorkspaceQrState())
      const currentCardState =
        paneId === activeQrNodeId
          ? selectedCardState
          : (cardStateByNodeId[paneId] ?? createDefaultDraftingCardState())
      const layers =
        current[paneId] ??
        createDefaultDraftingLayers(paneId, currentQrState, currentCardState)

      return {
        ...current,
        [paneId]: layers.map((layer) => patchDraftingLayerById(layer, layerId, patch)),
      }
    })
  }

  function handleLayerReorder(orderedIds: string[]) {
    setLayerStateByNodeId((current) => {
      const currentLayers =
        current[activeQrNodeId] ??
        createDefaultDraftingLayers(activeQrNodeId, draftingStudioState, selectedCardState)
      const layerById = new Map(currentLayers.map((layer) => [layer.id, layer]))
      const nextOrder = [
        ...orderedIds.filter((layerId) => layerById.has(layerId)),
        ...currentLayers
          .map((layer) => layer.id)
          .filter((layerId) => !orderedIds.includes(layerId)),
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

    setLayerStateByNodeId((current) => {
      const {
        draftingStudioState: currentDraftingStudioState,
        selectedCardState: currentSelectedCardState,
      } = keyboardStateRef.current
      const layers =
        current[paneId] ??
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

      setSelectedLayerIds(pastedLayers.map((layer) => layer.id))
      setSelectedLayerId(pastedLayers.at(-1)?.id ?? null)

      return {
        ...current,
        [paneId]: [...layers.map(cloneDraftingCanvasLayer), ...pastedLayers],
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

    setLayerStateByNodeId((current) => {
      const currentQrState =
        paneId === activeQrNodeId
          ? draftingStudioState
          : (qrStateByNodeId[paneId] ?? createDefaultDraftingWorkspaceQrState())
      const currentCardState =
        paneId === activeQrNodeId
          ? selectedCardState
          : (cardStateByNodeId[paneId] ?? createDefaultDraftingCardState())
      const layers =
        current[paneId] ??
        createDefaultDraftingLayers(paneId, currentQrState, currentCardState)
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
        for (const layerId of layerIds.filter((id) => !isProtectedDraftingLayerId(id))) {
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
          layerIds.filter((layerId) => !isProtectedDraftingLayerId(layerId)),
        )

        if (removableLayerIds.size > 0) {
          nextLayers = nextLayers
            .filter((layer) => !removableLayerIds.has(layer.id))
            .map(cloneDraftingCanvasLayer)
          setSelectedLayerIds((currentSelectedLayerIds) => {
            const nextSelectedLayerIds = currentSelectedLayerIds.filter(
              (layerId) => !removableLayerIds.has(layerId),
            )

            setSelectedLayerId(nextSelectedLayerIds.at(-1) ?? null)
            return nextSelectedLayerIds
          })
        }
      } else {
        const actionableLayerIds = layerIds.filter(
          (layerId) => !isProtectedDraftingLayerId(layerId),
        )

        if (actionableLayerIds.length === 0) {
          return current
        }

        nextLayers = nextLayers.map((layer) => {
          if (!actionableLayerIds.includes(layer.id)) {
            return cloneDraftingCanvasLayer(layer)
          }

          const patch =
            action === "hide"
              ? { isVisible: false }
              : action === "show"
                ? { isVisible: true }
                : action === "lock"
                  ? { isLocked: true }
                  : action === "unlock"
                    ? { isLocked: false }
                    : { rotation: 0 }

          return patchDraftingCanvasLayer(layer, patch)
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
        const nodes = await Promise.all(
          Object.entries(qrStateByNodeId).map(async ([nodeId, state]) => {
            const activeState = nodeId === activeQrNodeId ? draftingStudioState : state
            const activeCardState =
              nodeId === activeQrNodeId
                ? selectedCardState
                : (cardStateByNodeId[nodeId] ?? selectedCardState)
            const activeLayers =
              layerStateByNodeId[nodeId] ??
              createDefaultDraftingLayers(nodeId, activeState, activeCardState)

            return await buildDraftingLayeredNodePayload({
              cardState: activeCardState,
              layers: activeLayers,
              name: qrPaneNamesById.get(nodeId) ?? "QR Code",
              nodeId,
              sceneComposition: normalizeSceneComposition(
                sceneCompositionByNodeId[nodeId] ?? createDefaultSceneComposition(),
              ),
              state: activeState,
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
        const nodeId =
          selectedDownloadTarget === "current"
            ? activeQrNodeId
            : selectedDownloadTarget.slice("qr:".length)
        const state = nodeId === activeQrNodeId ? draftingStudioState : qrStateByNodeId[nodeId]

        if (!state) {
          throw new Error("The selected QR code is unavailable for export.")
        }

        const activeCardState =
          nodeId === activeQrNodeId
            ? selectedCardState
            : (cardStateByNodeId[nodeId] ?? selectedCardState)
        const activeLayers =
          layerStateByNodeId[nodeId] ??
          createDefaultDraftingLayers(nodeId, state, activeCardState)
        const payload = await buildDraftingLayeredNodePayload({
          cardState: activeCardState,
          layers: activeLayers,
          name: qrPaneNamesById.get(nodeId) ?? "QR Code",
          nodeId,
          sceneComposition: normalizeSceneComposition(
            sceneCompositionByNodeId[nodeId] ?? createDefaultSceneComposition(),
          ),
          state,
        })

        await downloadDashboardQrNodeExport({
          extension: selectedDownloadExtension,
          name: qrPaneNamesById.get(nodeId) ?? "QR Code",
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

  const activeCanvasLayers =
    layerStateByNodeId[activeQrNodeId] ??
    createDefaultDraftingLayers(activeQrNodeId, draftingStudioState, selectedCardState)
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


  const panes = useMemo(
    () =>
      qrNodeIds.map((id) => {
        const paneQrState = qrStateByNodeId[id] ?? draftingStudioState
        const paneCardState =
          id === activeQrNodeId
            ? selectedCardState
            : (cardStateByNodeId[id] ?? selectedCardState)

        return {
          cardState: paneCardState,
          id,
          layers:
            layerStateByNodeId[id] ??
            createDefaultDraftingLayers(id, paneQrState, paneCardState),
          name: qrPaneNamesById.get(id) ?? "QR Code",
          sceneComposition: normalizeSceneComposition(
            sceneCompositionByNodeId[id] ?? createDefaultSceneComposition(),
          ),
          state: id === activeQrNodeId ? draftingStudioState : paneQrState,
        }
      }),
    [
      qrNodeIds,
      qrPaneNamesById,
      qrStateByNodeId,
      cardStateByNodeId,
      layerStateByNodeId,
      activeQrNodeId,
      draftingStudioState,
      selectedCardState,
      sceneCompositionByNodeId,
    ],
  )

  const desktopActiveTool = desktopRailTool
  const gatedSelectedElementLayer = isFreeEditing ? selectedElementLayer : null
  const gatedSelectedTransformLayer = isFreeEditing ? selectedTransformLayer : null
  const gatedSelectedAppearanceLayer = isFreeEditing ? selectedTransformLayer : null
  const fallbackAppearanceLayer =
    activeCanvasLayers.find((layer) => layer.kind === "card") ?? null
  const appearanceTargetLayer = gatedSelectedAppearanceLayer ?? fallbackAppearanceLayer
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

  const desktopPatternSettings: DesktopPatternSettings = {
    dotsColorMode: selectedDotsColorMode,
    dataModulesGradient: selectedDotsGradient,
    dotsPalette: selectedDotsPalette,
    dotsPalettePreset: selectedDotsPalettePreset,
    dotsSolidColor: selectedDotColor,
    qrDotType: selectedDotType,
    moduleRoundSize: selectedModuleRoundSize,
    moduleSize: selectedModuleSize,
    moduleLineWidth: selectedModuleLineWidth,
    gradientLinkMode: selectedGradientLinkMode,
  }
  const desktopLogoSettings: DesktopLogoSettings = {
    colorMode: selectedLogoColorMode,
    gradient: selectedLogoGradient,
    hideBackgroundDots: selectedHideBackgroundDots,
    margin: selectedLogoMargin,
    remoteUrl: selectedLogoRemoteUrl,
    selectedBrandIconId: selectedLogoPresetId ?? "",
    size: selectedLogoSize,
    solidColor: selectedLogoColor,
    sourceMode: getDesktopLogoSourceMode(selectedLogoSourceMode),
    uploadMode: selectedLogoAssetSourceMode,
    opacity: selectedLogoOpacity,
    sizeMode: selectedLogoSizeMode,
    widthPx: selectedLogoWidthPx,
    heightPx: selectedLogoHeightPx,
    lockAspect: selectedLogoLockAspect,
    positionMode: selectedLogoPositionMode,
    offsetX: selectedLogoOffsetX,
    offsetY: selectedLogoOffsetY,
    crossOrigin: selectedLogoCrossOrigin,
  }
  const desktopCornersSettings: DesktopCornersSettings = {
    cornerDotColorMode: selectedCornerDotColorMode,
    cornerDotGradient: selectedCornerDotGradient,
    cornerDotSolidColor: selectedCornerDotColor,
    cornerDotType: selectedQrFinderPatternInnerStyle,
    cornerSquareColorMode: selectedCornerSquareColorMode,
    cornerSquareGradient: selectedCornerSquareGradient,
    cornerSquareSolidColor: selectedCornerSquareColor,
    cornerSquareType: selectedQrFinderPatternOuterStyle,
  }
  const activeQrLayer =
    activeCanvasLayers.find((layer) => layer.kind === "qr") ??
    createDefaultDraftingLayers(activeQrNodeId, draftingStudioState, selectedCardState).find(
      (layer) => layer.kind === "qr",
    )
  const desktopShapeSettings: DesktopShapeSettings = {
    backgroundShapeId: selectedBackgroundShapeId,
    bottomSpace: selectedCardState.bottomSpace,
    cardFill: selectedCardState.fill,
    cardHeight: selectedCardState.height,
    cardPatternColors: selectedCardState.patternColors,
    cardPatternId: selectedCardState.patternId,
    cardRadius: selectedCardState.cornerRadius,
    cardWidth: selectedCardState.width,
    lockAspectRatio: selectedCardState.lockAspectRatio,
    shapeColorMode: selectedBackgroundColorMode,
    shapeGradient: selectedBackgroundGradient,
    shapePadding: selectedBackgroundShapeOptions.paddingPx,
    shapeShadowBlur: activeQrLayer?.shadow.blur ?? 0,
    shapeShadowColor: activeQrLayer?.shadow.color ?? "#111827",
    shapeShadowOffsetX: activeQrLayer?.shadow.offsetX ?? 0,
    shapeShadowOffsetY: activeQrLayer?.shadow.offsetY ?? 0,
    shapeShadowOpacity: activeQrLayer?.shadow.opacity ?? 0,
    shapeSolidColor: selectedBackgroundColor,
    shadowBlur: selectedCardState.shadow.blur,
    shadowColor: selectedCardState.shadow.color,
    shadowOffsetX: selectedCardState.shadow.offsetX,
    shadowOffsetY: selectedCardState.shadow.offsetY,
    shadowOpacity: selectedCardState.shadow.opacity,
    sizeMode: selectedCardState.sizeMode,
    sizePresetId: selectedCardState.sizePresetId,
  }
  const desktopEncodingSettings: DesktopEncodingSettings = {
    errorCorrectionLevel: selectedQrErrorCorrectionLevel,
    typeNumber: selectedQrTypeNumber,
    boostLevel: selectedBoostLevel,
    valueSegmentsText: selectedValueSegmentsText,
  }
  const desktopAccessibilitySettings: DesktopAccessibilitySettings = {
    ariaLabel: selectedAriaLabel,
  }
  const desktopImageSettings: DesktopImageSettings = {
    fit: selectedCardState.cardImage.fit,
    intent: "shape-fill",
    opacity: selectedCardState.cardImage.opacity,
    remoteUrl: selectedCardState.cardImage.value ?? "",
    sourceMode: getDesktopAssetSourceMode(selectedCardState.cardImage.source),
  }
  const desktopBackgroundSettings: DesktopBackgroundSettings = {
    paperShader: selectedCardState.paperShader,
    styleMode: selectedCardState.styleMode,
  }
  const desktopEffectsSettings: DesktopEffectsSettings = {
    filterId: selectedCardState.imageFilter.shaderId,
    filterPresetName: selectedCardState.imageFilter.presetName,
  }
  const desktopLayersSettings: DesktopLayersSettings = {
    layers: activeCanvasLayerRows
      .filter((layer) => layer.kind !== "card")
      .map(toDesktopLayerRow),
    selectedLayerId: selectedLayerId ?? activeCanvasLayerRows[0]?.id ?? "",
  }
  const desktopExportSettings: DesktopExportSettings = {
    exportPresetId: selectedExportPresetId,
    extension: selectedDownloadExtension,
    qualityPresetId: selectedRasterExportPresetId,
    target: getDesktopExportTarget(selectedDownloadTarget),
    usePlatformPreset: selectedUsePlatformExportPreset,
  }
  const desktopSceneTemplateSettings = {
    sizeSettings: {
      cardHeight: selectedCardState.height,
      cardWidth: selectedCardState.width,
      lockAspectRatio: selectedCardState.lockAspectRatio,
      sizeMode: selectedCardState.sizeMode,
      sizePresetId: selectedCardState.sizePresetId,
    },
  }
  const desktopLayoutSettings = {
    layout: activeSceneComposition.layout,
  }
  const desktopTextSettings: DesktopTextSettings = getDesktopTextSettings(selectedTextLayer)

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

  function updateDesktopPatternSettings(patch: Partial<DesktopPatternSettings>) {
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
  }

  function resetDesktopPatternSettings() {
    setSelectedDotType(DEFAULT_DRAFTING_STUDIO_STATE.dataModulesSettings.type)
    setSelectedDotsColorMode(DEFAULT_DRAFTING_STUDIO_STATE.dotsColorMode)
    setSelectedDotColor(DEFAULT_DRAFTING_STUDIO_STATE.dataModulesSettings.color)
    setSelectedDotsGradient(structuredClone(DEFAULT_DRAFTING_STUDIO_STATE.dataModulesGradient))
    setSelectedDotsPalette([...DEFAULT_DRAFTING_STUDIO_STATE.dotsPalette])
    setSelectedDotsPalettePreset("Signal")
    setSelectedModuleRoundSize(DEFAULT_DRAFTING_STUDIO_STATE.dataModulesSettings.roundSize)
    setSelectedModuleSize(undefined)
    setSelectedModuleLineWidth(undefined)
    setSelectedGradientLinkMode(DEFAULT_DRAFTING_STUDIO_STATE.gradientLinkMode)
  }

  function updateDesktopLogoSettings(patch: DesktopLogoSettingsPatch) {
    if (patch.uploadedFile) {
      ensureLogoUploadItemExpanded("upload")
      const uploadValue = URL.createObjectURL(patch.uploadedFile)
      const nextState = applyAssetUploadValue(
        buildDraftingLogoStateSnapshot({
          logoSourceMode: "upload",
          logoUploadValue: uploadValue,
        }),
        "logo",
        uploadValue,
      )
      syncDraftingLogoAsset(nextState)
    }
    if (patch.sourceMode) {
      if (patch.sourceMode === "none") {
        const nextState = applyAssetNoneSelection(buildDraftingLogoStateSnapshot({ logoSourceMode: "none" }), "logo")
        syncDraftingLogoAsset(nextState)
      } else if (patch.sourceMode === "brand") {
        setSelectedLogoSourceMode("preset")
      } else if (patch.sourceMode === "url") {
        ensureLogoUploadItemExpanded("url")
        const nextState = applyAssetUrlValue(
          buildDraftingLogoStateSnapshot({
            logoRemoteUrl: selectedLogoRemoteUrl,
            logoSourceMode: "url",
          }),
          "logo",
          selectedLogoRemoteUrl,
        )
        syncDraftingLogoAsset(nextState)
      } else {
        ensureLogoUploadItemExpanded("upload")
        clearDraftingLogoPreset("upload")
      }
    }
    if (patch.uploadMode) {
      ensureLogoUploadItemExpanded(patch.uploadMode)
      if (patch.uploadMode === "url") {
        const nextState = applyAssetUrlValue(
          buildDraftingLogoStateSnapshot({
            logoRemoteUrl: selectedLogoRemoteUrl,
            logoSourceMode: "url",
          }),
          "logo",
          selectedLogoRemoteUrl,
        )
        syncDraftingLogoAsset(nextState)
      } else {
        clearDraftingLogoPreset("upload")
      }
    }
    if (patch.remoteUrl !== undefined) {
      ensureLogoUploadItemExpanded("url")
      const nextState = applyAssetUrlValue(
        buildDraftingLogoStateSnapshot({
          logoRemoteUrl: patch.remoteUrl,
          logoSourceMode: "url",
        }),
        "logo",
        patch.remoteUrl,
      )
      syncDraftingLogoAsset(nextState)
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
    if (patch.solidColor) handleDraftingLogoColorChange(patch.solidColor)
    if (patch.gradient) handleDraftingLogoGradientChange({ ...patch.gradient, enabled: true })
    if (patch.size !== undefined) setSelectedLogoSize(patch.size)
    if (patch.margin !== undefined) setSelectedLogoMargin(patch.margin)
    if (patch.hideBackgroundDots !== undefined) setSelectedHideBackgroundDots(patch.hideBackgroundDots)
    if (patch.opacity !== undefined) setSelectedLogoOpacity(patch.opacity)
    if (patch.sizeMode) setSelectedLogoSizeMode(patch.sizeMode)
    if (patch.widthPx !== undefined) setSelectedLogoWidthPx(patch.widthPx)
    if (patch.heightPx !== undefined) setSelectedLogoHeightPx(patch.heightPx)
    if (patch.lockAspect !== undefined) setSelectedLogoLockAspect(patch.lockAspect)
    if (patch.positionMode) setSelectedLogoPositionMode(patch.positionMode)
    if (patch.offsetX !== undefined) setSelectedLogoOffsetX(patch.offsetX)
    if (patch.offsetY !== undefined) setSelectedLogoOffsetY(patch.offsetY)
    if (patch.crossOrigin !== undefined) setSelectedLogoCrossOrigin(patch.crossOrigin)
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
      patternColors: patch.cardPatternColors ?? selectedCardState.patternColors,
      patternId:
        patch.cardFill !== undefined
          ? DRAFTING_CARD_PATTERN_NONE_ID
          : (patch.cardPatternId ?? selectedCardState.patternId),
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
          ? "pattern"
          : patch.cardPatternId
            ? "pattern"
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
      const currentLayersById = new Map(activeCanvasLayers.map((layer) => [layer.id, layer]))
      const nextLayers = patch.layers.map((row) => {
        const layer = currentLayersById.get(row.id) ?? createDraftingTextLayer(activeQrNodeId, { id: row.id })

        return patchDraftingCanvasLayer(layer, {
          blur: row.blur,
          height: row.height,
          isLocked: row.isLocked,
          isVisible: row.isVisible,
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
    editingMode,
    exportSettings: desktopExportSettings,
    imageSettings: desktopImageSettings,
    isFreeEditingEnabled: isFreeEditing,
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
    selectedElementLayer: gatedSelectedElementLayer,
    selectedTransformLayer: gatedSelectedTransformLayer,
    selectedAppearanceLayer: gatedSelectedAppearanceLayer,
    appearanceSnapshot: desktopAppearanceSnapshot,
    scanSafetyResult,
    onInsertLayer: isFreeEditing ? handleInsertLayer : undefined,
    onOpenComposeSidebar: (panel) => {
      setComposeSidebarPanel(panel)
      selectSingleLayer(null)
    },
    onOpenCardPatternSettings: () => {
      setSelectedCardState((current) => ({
        ...current,
        enabled: true,
        styleMode: "pattern",
      }))
      selectSingleLayer(getDraftingCardLayerId(activeQrNodeId))
      setBackgroundInspectorTab("patterns")
      setDesktopRailTool("background")
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
          patternId: DRAFTING_CARD_PATTERN_NONE_ID,
          styleMode: "pattern",
        }
      })
    },
    onElementLayerPatch: (patch) => {
      if (gatedSelectedElementLayer) {
        handleLayerChange(activeQrNodeId, gatedSelectedElementLayer.id, patch)
      }
    },
    onAppearancePatch: handleDesktopAppearancePatch,
    onTransformLayerPatch: (patch) => {
      if (gatedSelectedTransformLayer) {
        handleLayerChange(activeQrNodeId, gatedSelectedTransformLayer.id, patch)
      }
    },
    onEditingModeChange: handleEditingModeChange,
    onActiveToolChange: (toolId) => {
      setComposeSidebarPanel(null)
      setDesktopCanvasTool(null)
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
      data-editing-mode={editingMode}
      tabIndex={-1}
      className={cn(
        "relative grid h-dvh w-full overflow-visible bg-[var(--ws-surface-bg)] sm:h-dvh lg:shadow-[var(--ws-shadow-shell)] [--new-header-height:3.875rem] [--new-left-rail-width:clamp(6.25rem,10vw,7.5rem)] [--new-middle-rail-width:clamp(15rem,24vw,18.5rem)] [--new-mobile-rail-height:5.75rem]",
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
              canRedo={canRedoDraftingWorkspace}
              canAddQrCode={qrNodeIds.length < 10}
              canUndo={canUndoDraftingWorkspace}
              insertNodeId={activeQrNodeId}
              onBrowseStockPhotos={handleBrowseStockPhotos}
              onOpenCardPatternSettings={() => {
                setSelectedCardState((current) => ({
                  ...current,
                  enabled: true,
                  styleMode: "pattern",
                }))
                selectSingleLayer(getDraftingCardLayerId(activeQrNodeId))
                setBackgroundInspectorTab("patterns")
                setDesktopRailTool("background")
              }}
              onAddQrCode={() => {
                void handleAddQrCode()
              }}
              onInsertLayer={isFreeEditing ? handleInsertLayer : undefined}
              layerEditingEnabled={isFreeEditing}
              onLayerChange={isFreeEditing ? handleLayerChange : undefined}
              onLayerAction={isFreeEditing ? handleLayerAction : undefined}
              onLayerCopy={(_paneId, layerIds) => {
                void copySelectedDraftingLayers(layerIds, _paneId)
              }}
              activeCanvasTool={isFreeEditing ? desktopCanvasTool : null}
              onAddTextLayerAt={isFreeEditing ? handleAddTextLayerAt : undefined}
              onCanvasGridChange={setShowDesktopCanvasGrid}
              onCanvasToolChange={setDesktopCanvasTool}
              onLayerPaste={(_paneId, point) => {
                void pasteDraftingLayers(point, undefined, _paneId)
              }}
              onLayerSelect={handleLayerSelect}
              onLayerSelectionChange={handleLayerSelectionChange}
              onPaneQrClick={handlePaneQrClick}
              onPaneSelect={handlePaneSelection}
              onRedo={handleRedoDraftingWorkspace}
              onRemoveQrCode={handleRemoveQrCode}
              onSwapPanes={(sourcePaneId, targetPaneId) => {
                const activeState = cloneDraftingQrState(draftingStudioState)

                setQrStateByNodeId((current) =>
                  swapDraftingQrNodeOrder(
                    current,
                    sourcePaneId,
                    targetPaneId,
                    activeQrNodeId,
                    activeState,
                  ),
                )
              }}
              onUndo={handleUndoDraftingWorkspace}
              panes={panes}
              previewLocked={!isFreeEditing}
              fitCanvasToViewport
              showCanvasGrid={paneToolbarVariant === "desktop-zoom" ? showDesktopCanvasGrid : true}
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


function getDesktopLogoSourceMode(source: AssetSourceMode): DesktopLogoSourceMode {
  if (source === "preset") return "brand"
  if (source === "url" || source === "upload") return "upload"
  return "none"
}

function getDesktopAssetSourceMode(source: "none" | "upload" | "url"): DesktopAssetSourceMode {
  return source === "url" ? "url" : "upload"
}

function getDesktopExportTarget(target: DraftingDownloadTarget): DesktopExportTarget {
  if (target === "all-qr") return "all-qr"
  if (target === "surface") return "surface"
  return "current"
}

function getDraftingDownloadTarget(target: DesktopExportTarget): DraftingDownloadTarget {
  if (target === "all-qr") return "all-qr"
  if (target === "surface") return "surface"
  return "current"
}

function toDesktopLayerRow(layer: DraftingCanvasLayer): DesktopLayerRow {
  return {
    blur: layer.blur,
    height: Math.round(layer.height),
    id: layer.id,
    isLocked: layer.isLocked,
    isVisible: layer.isVisible,
    kind:
      layer.kind === "text"
        ? "text"
        : layer.kind === "card"
          ? "card"
          : layer.kind === "image"
            ? "image"
            : layer.kind === "shape"
              ? "shape"
              : layer.kind === "shader"
                ? "shader"
                : "qr",
    name: layer.name,
    opacity: Math.round(layer.opacity * 100),
    shadowBlur: layer.shadow.blur,
    shadowColor: layer.shadow.color,
    shadowOffsetX: layer.shadow.offsetX,
    shadowOffsetY: layer.shadow.offsetY,
    shadowOpacity: layer.shadow.opacity,
    tiltX: layer.tiltX ?? 0,
    tiltY: layer.tiltY ?? 0,
    width: Math.round(layer.width),
    x: Math.round(layer.x),
    y: Math.round(layer.y),
  }
}

function getDesktopTextSettings(layer: DraftingCanvasLayer | null): DesktopTextSettings {
  const textLayer = layer?.kind === "text" ? layer : null
  return {
    fill: textLayer?.fill ?? DEFAULT_DRAFTING_TEXT_LAYER.fill,
    fontFamily: textLayer?.fontFamily ?? DEFAULT_DRAFTING_TEXT_LAYER.fontFamily,
    fontId: textLayer?.fontId ?? DEFAULT_DRAFTING_TEXT_LAYER.fontId,
    fontSize: textLayer?.fontSize ?? DEFAULT_DRAFTING_TEXT_LAYER.fontSize,
    fontStyle: textLayer?.fontStyle ?? DEFAULT_DRAFTING_TEXT_LAYER.fontStyle,
    fontWeight: textLayer?.fontWeight ?? DEFAULT_DRAFTING_TEXT_LAYER.fontWeight,
    letterSpacing: textLayer?.letterSpacing ?? DEFAULT_DRAFTING_TEXT_LAYER.letterSpacing,
    lineHeight: textLayer?.lineHeight ?? DEFAULT_DRAFTING_TEXT_LAYER.lineHeight,
    text: textLayer?.text ?? DEFAULT_DRAFTING_TEXT_LAYER.text,
    textAlign: textLayer?.textAlign ?? DEFAULT_DRAFTING_TEXT_LAYER.textAlign,
    underline: textLayer?.underline ?? DEFAULT_DRAFTING_TEXT_LAYER.underline,
  }
}

function getDraftingQrNodeDownloadTarget(nodeId: string): DraftingDownloadTarget {
  return `qr:${nodeId}`
}

function patchDraftingLayerById(
  layer: DraftingCanvasLayer,
  layerId: string,
  patch: Partial<DraftingCanvasLayer>,
): DraftingCanvasLayer {
  if (layer.id === layerId) {
    return patchDraftingCanvasLayer(layer, patch)
  }

  if (!layer.children?.length) {
    return cloneDraftingCanvasLayer(layer)
  }

  return patchDraftingCanvasLayer(
    {
      ...cloneDraftingCanvasLayer(layer),
      children: layer.children.map((child) => patchDraftingLayerById(child, layerId, patch)),
    },
    {},
  )
}

function findDraftingLayerById(
  layers: DraftingCanvasLayer[],
  layerId: string,
): DraftingCanvasLayer | null {
  for (const layer of layers) {
    if (layer.id === layerId) {
      return layer
    }

    const child = layer.children ? findDraftingLayerById(layer.children, layerId) : null

    if (child) {
      return child
    }
  }

  return null
}

function isEditableShortcutTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [contenteditable=""], [role="textbox"]',
    ),
  )
}

function getDraftingClipboardBounds(layers: DraftingCanvasLayer[]) {
  const left = Math.min(...layers.map((layer) => layer.x))
  const top = Math.min(...layers.map((layer) => layer.y))
  const right = Math.max(...layers.map((layer) => layer.x + layer.width))
  const bottom = Math.max(...layers.map((layer) => layer.y + layer.height))

  return {
    height: bottom - top,
    width: right - left,
    x: left,
    y: top,
  }
}

function getDraftingLayerClipboardPayload({
  layerIds,
  layers,
  paneId,
}: {
  layerIds: string[]
  layers: DraftingCanvasLayer[]
  paneId: string
}) {
  const selectedIdSet = new Set(layerIds)
  const selectedLayers = layers.filter((layer) => selectedIdSet.has(layer.id))

  if (selectedLayers.length === 0) {
    return null
  }

  return JSON.stringify({
    bounds: getDraftingClipboardBounds(selectedLayers),
    layers: selectedLayers.map(cloneDraftingCanvasLayer),
    sourceNodeId: paneId,
    type: DRAFTING_LAYER_CLIPBOARD_TYPE,
    version: DRAFTING_LAYER_CLIPBOARD_VERSION,
  })
}

function parseDraftingLayerClipboardPayload(value: string) {
  try {
    const payload = JSON.parse(value) as unknown

    if (!isRecord(payload) || payload.type !== DRAFTING_LAYER_CLIPBOARD_TYPE) {
      return null
    }

    if (payload.version !== DRAFTING_LAYER_CLIPBOARD_VERSION || !Array.isArray(payload.layers)) {
      return null
    }

    const bounds = isRecord(payload.bounds)
      ? {
          height: readClipboardNumber(payload.bounds.height, 1),
          width: readClipboardNumber(payload.bounds.width, 1),
          x: readClipboardNumber(payload.bounds.x, 0),
          y: readClipboardNumber(payload.bounds.y, 0),
        }
      : { height: 1, width: 1, x: 0, y: 0 }

    return {
      bounds,
      layers: payload.layers as DraftingCanvasLayer[],
      sourceNodeId: typeof payload.sourceNodeId === "string" ? payload.sourceNodeId : null,
    }
  } catch {
    return null
  }
}

function readClipboardNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}
