import { useMemo, useReducer, type Dispatch } from "react"

import type {
  QrErrorCorrectionLevel,
  QrFinderPatternOuterStyle,
  QrMode,
  QrTypeNumber,
} from "@/features/qr-code/model/types"
import type { StudioCornerDotStyle } from "@/features/qr-code/model/state"
import {
  createDefaultDraftingCardState,
  type DraftingCardState,
} from "@/features/workspace/model/card-state"
import {
  createDefaultDraftingLayers,
  getDraftingQrLayerId,
  type DraftingLayerStateByNodeId,
} from "@/features/workspace/model/layers"
import {
  createDefaultDraftingWorkspaceQrState,
  type DraftingCardStateByNodeId,
  type DraftingContentValuesByType,
  type DraftingQrStateByLayerId,
  type DraftingQrStateByNodeId,
} from "@/features/workspace/model/document"
import type { SceneCompositionByNodeId } from "@/features/workspace/model/apply-scene-template"
import { createDefaultSceneComposition } from "@/features/workspace/model/scene-templates"
import {
  DEFAULT_DRAFTING_PANE_QR_SIZE,
  DEFAULT_DRAFTING_RASTER_EXPORT_PRESET_ID,
  DEFAULT_DRAFTING_STUDIO_STATE,
  type DraftingDownloadExtension,
  type DraftingRasterExportPresetId,
} from "@/features/workspace/components/workspace-surface.constants"
import type { DraftingPaneCanvasTool } from "@/features/workspace/components/Canvas"
import type {
  DesktopBackgroundInspectorTab,
  DesktopToolbarToolId,
  ComposeSidebarPanel,
} from "@/features/desktop-shell/components/FloatingToolbar"
import { DEFAULT_BRAND_ICON_COLOR } from "@/features/qr-code/assets/brand-icon-svg"
import { DASHBOARD_QR_NODE_ID } from "@/features/qr-code/rendering/compose-scene"
import {
  type AssetSourceMode,
  type BackgroundShapeOptions,
  type DotsColorMode,
  type QrCrossOrigin,
  type QrDotMatrixAnimationOptions,
  type QrGradientLinkMode,
  type QrLogoPositionMode,
  type QrLogoSizeMode,
  type StudioDataModulesStyle,
  type StudioGradient,
} from "@/features/qr-code/model/state"
import { type QrBackgroundShapeId } from "@/features/qr-code/styles/background-shapes"
import { getDefaultStaticQrValues } from "@/features/qr-code/content/static-payload"
import {
  DEFAULT_QR_INPUT_TYPE,
  type QrInputType,
} from "@/features/qr-code/content/input-options"
import type { ExportPresetId } from "@/features/workspace/model/export-presets"
import type { DesktopExportMediaKind } from "@/features/desktop-shell/model/desktop-toolbar-types"
import { DEFAULT_DESKTOP_EXPORT_SETTINGS } from "@/features/desktop-shell/model/desktop-toolbar-defaults"
import type { DraftingDownloadTarget } from "@/features/workspace/components/workspace-surface-helpers"

export type DraftingBinaryColorMode = "solid" | "gradient"
export type DraftingAssetSourceMode = Extract<AssetSourceMode, "upload" | "url">

export type WorkspaceSurfaceState = {
  desktopRailTool: DesktopToolbarToolId | null
  backgroundInspectorTab: DesktopBackgroundInspectorTab
  composeSidebarPanel: ComposeSidebarPanel
  selectedContentType: QrInputType
  contentValuesByType: DraftingContentValuesByType
  contentTypeByNodeId: Record<string, QrInputType>
  contentTypeByLayerId: Record<string, QrInputType>
  selectedQrMargin: number
  selectedQrRadius: number
  selectedRasterExportQualityPercent: number
  selectedQrSize: number
  selectedDotType: StudioDataModulesStyle
  selectedDotsColorMode: DotsColorMode
  selectedDotColor: string
  selectedDotsGradient: StudioGradient
  selectedDotsPalette: string[]
  selectedDotsPalettePreset: string | "custom"
  selectedModuleFillImageUrl: string
  selectedModuleFillImageSourceMode: DraftingAssetSourceMode
  selectedModuleFillRemoteUrl: string
  selectedDotMatrixAnimation: QrDotMatrixAnimationOptions
  selectedQrFinderPatternOuterStyle: QrFinderPatternOuterStyle
  selectedCornerSquareColorMode: DraftingBinaryColorMode
  selectedCornerSquareColor: string
  selectedCornerSquareGradient: StudioGradient
  selectedQrFinderPatternInnerStyle: StudioCornerDotStyle
  selectedCornerDotColorMode: DraftingBinaryColorMode
  selectedCornerDotColor: string
  selectedCornerDotGradient: StudioGradient
  selectedBackgroundColorMode: DraftingBinaryColorMode
  selectedBackgroundColor: string
  selectedBackgroundTransparent: boolean
  selectedBackgroundGradient: StudioGradient
  selectedBackgroundShapeId: QrBackgroundShapeId
  selectedBackgroundShapeOptions: BackgroundShapeOptions
  selectedBackgroundAssetSourceMode: DraftingAssetSourceMode
  selectedBackgroundRemoteUrl: string
  selectedLogoColorMode: DraftingBinaryColorMode
  selectedLogoSourceMode: AssetSourceMode
  selectedLogoColor: string
  selectedLogoGradient: StudioGradient
  selectedLogoPresetId: string | undefined
  selectedLogoPresetValue: string | undefined
  selectedLogoAssetSourceMode: DraftingAssetSourceMode
  selectedLogoRemoteUrl: string
  selectedLogoUploadValue: string
  selectedLogoSize: number
  selectedLogoMargin: number
  selectedHideBackgroundDots: boolean
  selectedQrTypeNumber: QrTypeNumber
  selectedQrErrorCorrectionLevel: QrErrorCorrectionLevel
  selectedBoostLevel: boolean
  selectedQrMode: QrMode
  selectedValueSegmentsText: string
  selectedAriaLabel: string
  selectedModuleRoundSize: boolean
  selectedModuleSize: number | undefined
  selectedModuleLineWidth: number | undefined
  selectedGradientLinkMode: QrGradientLinkMode
  selectedLogoOpacity: number
  selectedLogoSizeMode: QrLogoSizeMode
  selectedLogoWidthPx: number | undefined
  selectedLogoHeightPx: number | undefined
  selectedLogoLockAspect: boolean
  selectedLogoPositionMode: QrLogoPositionMode
  selectedLogoOffsetX: number
  selectedLogoOffsetY: number
  selectedLogoCrossOrigin: QrCrossOrigin
  activeQrLayerId: string
  activeQrNodeId: string
  qrStateByLayerId: DraftingQrStateByLayerId
  qrStateByNodeId: DraftingQrStateByNodeId
  selectedCardState: DraftingCardState
  cardStateByNodeId: DraftingCardStateByNodeId
  sceneCompositionByNodeId: SceneCompositionByNodeId
  layerStateByNodeId: DraftingLayerStateByNodeId
  selectedLayerId: string | null
  selectedLayerIds: string[]
  desktopCanvasTool: DraftingPaneCanvasTool | null
  desktopSnapEnabled: boolean
  selectedDownloadExtension: DraftingDownloadExtension
  selectedDownloadTarget: DraftingDownloadTarget
  exportDownloadError: string | null
  selectedRasterExportPresetId: DraftingRasterExportPresetId
  selectedExportPresetId: ExportPresetId | undefined
  selectedUsePlatformExportPreset: boolean
  selectedExportMediaKind: DesktopExportMediaKind
  selectedVideoDurationSeconds: 5 | 10
  selectedVideoFormat: "mp4" | "webm"
  selectedVideoFrameRate: 30 | 60
  selectedVideoLongEdge: 1080 | 2160
  isDraftingWorkspaceReady: boolean
  draftingHistoryRevision: number
  logoUploadObjectUrl: string | null
  moduleFillUploadObjectUrl: string | null
}

type WorkspaceSurfaceStateField = keyof WorkspaceSurfaceState

type FieldValue<K extends WorkspaceSurfaceStateField> = WorkspaceSurfaceState[K]
type FieldUpdater<K extends WorkspaceSurfaceStateField> =
  | FieldValue<K>
  | ((prev: FieldValue<K>) => FieldValue<K>)

export type SetWorkspaceSurfaceFieldAction<K extends WorkspaceSurfaceStateField = WorkspaceSurfaceStateField> =
  {
    type: "SET_FIELD"
    field: K
    value: FieldUpdater<K>
  }

export type ReplaceWorkspaceSurfaceStateAction = {
  type: "REPLACE_STATE"
  state: WorkspaceSurfaceState
}

export type WorkspaceSurfaceAction =
  | SetWorkspaceSurfaceFieldAction
  | ReplaceWorkspaceSurfaceStateAction

export type WorkspaceSurfaceSetter<K extends WorkspaceSurfaceStateField> = (
  value: FieldUpdater<K>,
) => void

export type WorkspaceSurfaceSetters = {
  [K in WorkspaceSurfaceStateField as `set${Capitalize<string & K>}`]: WorkspaceSurfaceSetter<K>
}

export function createInitialWorkspaceSurfaceState(
  initialActiveTool?: DesktopToolbarToolId,
): WorkspaceSurfaceState {
  const defaultQrState = createDefaultDraftingWorkspaceQrState()
  const defaultCardState = createDefaultDraftingCardState()
  const primaryQrLayerId = getDraftingQrLayerId(DASHBOARD_QR_NODE_ID)

  return {
    desktopRailTool: initialActiveTool ?? "content",
    backgroundInspectorTab: "paper",
    composeSidebarPanel: null,
    selectedContentType: DEFAULT_QR_INPUT_TYPE,
    contentValuesByType: {
      [DEFAULT_QR_INPUT_TYPE]: {
        ...getDefaultStaticQrValues(DEFAULT_QR_INPUT_TYPE),
        url: DEFAULT_DRAFTING_STUDIO_STATE.data,
      },
    },
    contentTypeByNodeId: {
      [DASHBOARD_QR_NODE_ID]: DEFAULT_QR_INPUT_TYPE,
    },
    contentTypeByLayerId: {
      [primaryQrLayerId]: DEFAULT_QR_INPUT_TYPE,
    },
    selectedQrMargin: DEFAULT_DRAFTING_STUDIO_STATE.margin,
    selectedQrRadius: DEFAULT_DRAFTING_STUDIO_STATE.backgroundOptions.round,
    selectedRasterExportQualityPercent: DEFAULT_DRAFTING_STUDIO_STATE.rasterExportQualityPercent,
    selectedQrSize: DEFAULT_DRAFTING_PANE_QR_SIZE,
    selectedDotType: "rounded",
    selectedDotsColorMode: DEFAULT_DRAFTING_STUDIO_STATE.dotsColorMode,
    selectedDotColor: DEFAULT_DRAFTING_STUDIO_STATE.dataModulesSettings.color,
    selectedDotsGradient: structuredClone(DEFAULT_DRAFTING_STUDIO_STATE.dataModulesGradient),
    selectedDotsPalette: [...DEFAULT_DRAFTING_STUDIO_STATE.dotsPalette],
    selectedDotsPalettePreset: "Signal",
    selectedModuleFillImageUrl: "",
    selectedModuleFillImageSourceMode: "upload",
    selectedModuleFillRemoteUrl: "",
    selectedDotMatrixAnimation: {
      ...DEFAULT_DRAFTING_STUDIO_STATE.dotMatrixAnimation,
    },
    selectedQrFinderPatternOuterStyle: "rounded-lg",
    selectedCornerSquareColorMode:
      DEFAULT_DRAFTING_STUDIO_STATE.finderPatternOuterGradient.enabled ? "gradient" : "solid",
    selectedCornerSquareColor: DEFAULT_DRAFTING_STUDIO_STATE.finderPatternOuterSettings.color,
    selectedCornerSquareGradient: structuredClone(
      DEFAULT_DRAFTING_STUDIO_STATE.finderPatternOuterGradient,
    ),
    selectedQrFinderPatternInnerStyle: "circle",
    selectedCornerDotColorMode:
      DEFAULT_DRAFTING_STUDIO_STATE.finderPatternInnerGradient.enabled ? "gradient" : "solid",
    selectedCornerDotColor: DEFAULT_DRAFTING_STUDIO_STATE.finderPatternInnerSettings.color,
    selectedCornerDotGradient: structuredClone(
      DEFAULT_DRAFTING_STUDIO_STATE.finderPatternInnerGradient,
    ),
    selectedBackgroundColorMode:
      DEFAULT_DRAFTING_STUDIO_STATE.backgroundGradient.enabled ? "gradient" : "solid",
    selectedBackgroundColor: DEFAULT_DRAFTING_STUDIO_STATE.backgroundOptions.color,
    selectedBackgroundTransparent: false,
    selectedBackgroundGradient: structuredClone(DEFAULT_DRAFTING_STUDIO_STATE.backgroundGradient),
    selectedBackgroundShapeId: DEFAULT_DRAFTING_STUDIO_STATE.backgroundShapeId,
    selectedBackgroundShapeOptions: {
      ...DEFAULT_DRAFTING_STUDIO_STATE.backgroundShapeOptions,
    },
    selectedBackgroundAssetSourceMode:
      DEFAULT_DRAFTING_STUDIO_STATE.backgroundImage.source === "url" ? "url" : "upload",
    selectedBackgroundRemoteUrl:
      DEFAULT_DRAFTING_STUDIO_STATE.backgroundImage.source === "url"
        ? (DEFAULT_DRAFTING_STUDIO_STATE.backgroundImage.value ?? "")
        : "",
    selectedLogoColorMode:
      DEFAULT_DRAFTING_STUDIO_STATE.logoGradient.enabled ? "gradient" : "solid",
    selectedLogoSourceMode: DEFAULT_DRAFTING_STUDIO_STATE.logo.source,
    selectedLogoColor: DEFAULT_DRAFTING_STUDIO_STATE.logo.presetColor ?? DEFAULT_BRAND_ICON_COLOR,
    selectedLogoGradient: structuredClone(DEFAULT_DRAFTING_STUDIO_STATE.logoGradient),
    selectedLogoPresetId: DEFAULT_DRAFTING_STUDIO_STATE.logo.presetId,
    selectedLogoPresetValue: DEFAULT_DRAFTING_STUDIO_STATE.logo.value,
    selectedLogoAssetSourceMode:
      DEFAULT_DRAFTING_STUDIO_STATE.logo.source === "url" ? "url" : "upload",
    selectedLogoRemoteUrl:
      DEFAULT_DRAFTING_STUDIO_STATE.logo.source === "url"
        ? (DEFAULT_DRAFTING_STUDIO_STATE.logo.value ?? "")
        : "",
    selectedLogoUploadValue:
      DEFAULT_DRAFTING_STUDIO_STATE.logo.source === "upload"
        ? (DEFAULT_DRAFTING_STUDIO_STATE.logo.value ?? "")
        : "",
    selectedLogoSize: Math.round(DEFAULT_DRAFTING_STUDIO_STATE.imageOptions.imageSize * 100),
    selectedLogoMargin: DEFAULT_DRAFTING_STUDIO_STATE.imageOptions.margin,
    selectedHideBackgroundDots: DEFAULT_DRAFTING_STUDIO_STATE.imageOptions.hideBackgroundDots,
    selectedQrTypeNumber: DEFAULT_DRAFTING_STUDIO_STATE.qrOptions.typeNumber,
    selectedQrErrorCorrectionLevel: DEFAULT_DRAFTING_STUDIO_STATE.qrOptions.errorCorrectionLevel,
    selectedBoostLevel: DEFAULT_DRAFTING_STUDIO_STATE.qrOptions.boostLevel,
    selectedQrMode: DEFAULT_DRAFTING_STUDIO_STATE.qrOptions.mode,
    selectedValueSegmentsText: "",
    selectedAriaLabel: "",
    selectedModuleRoundSize: DEFAULT_DRAFTING_STUDIO_STATE.dataModulesSettings.roundSize,
    selectedModuleSize: undefined,
    selectedModuleLineWidth: undefined,
    selectedGradientLinkMode: DEFAULT_DRAFTING_STUDIO_STATE.gradientLinkMode,
    selectedLogoOpacity: DEFAULT_DRAFTING_STUDIO_STATE.imageOptions.opacity * 100,
    selectedLogoSizeMode: DEFAULT_DRAFTING_STUDIO_STATE.imageOptions.sizeMode,
    selectedLogoWidthPx: undefined,
    selectedLogoHeightPx: undefined,
    selectedLogoLockAspect: DEFAULT_DRAFTING_STUDIO_STATE.imageOptions.lockAspect,
    selectedLogoPositionMode: DEFAULT_DRAFTING_STUDIO_STATE.imageOptions.logoPositionMode,
    selectedLogoOffsetX: 0,
    selectedLogoOffsetY: 0,
    selectedLogoCrossOrigin: DEFAULT_DRAFTING_STUDIO_STATE.imageOptions.crossOrigin,
    activeQrLayerId: primaryQrLayerId,
    activeQrNodeId: DASHBOARD_QR_NODE_ID,
    qrStateByLayerId: {
      [primaryQrLayerId]: defaultQrState,
    },
    qrStateByNodeId: {
      [DASHBOARD_QR_NODE_ID]: defaultQrState,
    },
    selectedCardState: defaultCardState,
    cardStateByNodeId: {
      [DASHBOARD_QR_NODE_ID]: defaultCardState,
    },
    sceneCompositionByNodeId: {
      [DASHBOARD_QR_NODE_ID]: createDefaultSceneComposition(),
    },
    layerStateByNodeId: {
      [DASHBOARD_QR_NODE_ID]: createDefaultDraftingLayers(
        DASHBOARD_QR_NODE_ID,
        defaultQrState,
        defaultCardState,
      ),
    },
    selectedLayerId: getDraftingQrLayerId(DASHBOARD_QR_NODE_ID),
    selectedLayerIds: [getDraftingQrLayerId(DASHBOARD_QR_NODE_ID)],
    desktopCanvasTool: "select",
    desktopSnapEnabled: true,
    selectedDownloadExtension: "png",
    selectedDownloadTarget: "current",
    exportDownloadError: null,
    selectedRasterExportPresetId: DEFAULT_DRAFTING_RASTER_EXPORT_PRESET_ID,
    selectedExportPresetId: undefined,
    selectedUsePlatformExportPreset: false,
    selectedExportMediaKind: DEFAULT_DESKTOP_EXPORT_SETTINGS.mediaKind,
    selectedVideoDurationSeconds: DEFAULT_DESKTOP_EXPORT_SETTINGS.videoDurationSeconds,
    selectedVideoFormat: DEFAULT_DESKTOP_EXPORT_SETTINGS.videoFormat,
    selectedVideoFrameRate: DEFAULT_DESKTOP_EXPORT_SETTINGS.videoFrameRate,
    selectedVideoLongEdge: DEFAULT_DESKTOP_EXPORT_SETTINGS.videoLongEdge,
    isDraftingWorkspaceReady: false,
    draftingHistoryRevision: 0,
    logoUploadObjectUrl: null,
    moduleFillUploadObjectUrl: null,
  }
}

export function workspaceSurfaceReducer(
  state: WorkspaceSurfaceState,
  action: WorkspaceSurfaceAction,
): WorkspaceSurfaceState {
  switch (action.type) {
    case "SET_FIELD": {
      const { field, value } = action
      const currentValue = state[field]
      const nextValue =
        typeof value === "function"
          ? (value as (prev: typeof currentValue) => typeof currentValue)(currentValue)
          : value

      if (Object.is(nextValue, currentValue)) {
        return state
      }

      return {
        ...state,
        [field]: nextValue,
      }
    }
    case "REPLACE_STATE":
      return action.state
    default:
      return state
  }
}

function createWorkspaceSurfaceSetters(
  dispatch: Dispatch<WorkspaceSurfaceAction>,
): WorkspaceSurfaceSetters {
  const setField = <K extends WorkspaceSurfaceStateField>(
    field: K,
    value: FieldUpdater<K>,
  ) => {
    dispatch({ type: "SET_FIELD", field, value } as WorkspaceSurfaceAction)
  }

  return {
    setDesktopRailTool: (value) => setField("desktopRailTool", value),
    setBackgroundInspectorTab: (value) => setField("backgroundInspectorTab", value),
    setComposeSidebarPanel: (value) => setField("composeSidebarPanel", value),
    setSelectedContentType: (value) => setField("selectedContentType", value),
    setContentValuesByType: (value) => setField("contentValuesByType", value),
    setContentTypeByNodeId: (value) => setField("contentTypeByNodeId", value),
    setContentTypeByLayerId: (value) => setField("contentTypeByLayerId", value),
    setSelectedQrMargin: (value) => setField("selectedQrMargin", value),
    setSelectedQrRadius: (value) => setField("selectedQrRadius", value),
    setSelectedRasterExportQualityPercent: (value) =>
      setField("selectedRasterExportQualityPercent", value),
    setSelectedQrSize: (value) => setField("selectedQrSize", value),
    setSelectedDotType: (value) => setField("selectedDotType", value),
    setSelectedDotsColorMode: (value) => setField("selectedDotsColorMode", value),
    setSelectedDotColor: (value) => setField("selectedDotColor", value),
    setSelectedDotsGradient: (value) => setField("selectedDotsGradient", value),
    setSelectedDotsPalette: (value) => setField("selectedDotsPalette", value),
    setSelectedDotsPalettePreset: (value) => setField("selectedDotsPalettePreset", value),
    setSelectedModuleFillImageUrl: (value) => setField("selectedModuleFillImageUrl", value),
    setSelectedModuleFillImageSourceMode: (value) =>
      setField("selectedModuleFillImageSourceMode", value),
    setSelectedModuleFillRemoteUrl: (value) => setField("selectedModuleFillRemoteUrl", value),
    setSelectedDotMatrixAnimation: (value) => setField("selectedDotMatrixAnimation", value),
    setSelectedQrFinderPatternOuterStyle: (value) =>
      setField("selectedQrFinderPatternOuterStyle", value),
    setSelectedCornerSquareColorMode: (value) =>
      setField("selectedCornerSquareColorMode", value),
    setSelectedCornerSquareColor: (value) => setField("selectedCornerSquareColor", value),
    setSelectedCornerSquareGradient: (value) =>
      setField("selectedCornerSquareGradient", value),
    setSelectedQrFinderPatternInnerStyle: (value) =>
      setField("selectedQrFinderPatternInnerStyle", value),
    setSelectedCornerDotColorMode: (value) => setField("selectedCornerDotColorMode", value),
    setSelectedCornerDotColor: (value) => setField("selectedCornerDotColor", value),
    setSelectedCornerDotGradient: (value) => setField("selectedCornerDotGradient", value),
    setSelectedBackgroundColorMode: (value) => setField("selectedBackgroundColorMode", value),
    setSelectedBackgroundColor: (value) => setField("selectedBackgroundColor", value),
    setSelectedBackgroundTransparent: (value) => setField("selectedBackgroundTransparent", value),
    setSelectedBackgroundGradient: (value) => setField("selectedBackgroundGradient", value),
    setSelectedBackgroundShapeId: (value) => setField("selectedBackgroundShapeId", value),
    setSelectedBackgroundShapeOptions: (value) =>
      setField("selectedBackgroundShapeOptions", value),
    setSelectedBackgroundAssetSourceMode: (value) =>
      setField("selectedBackgroundAssetSourceMode", value),
    setSelectedBackgroundRemoteUrl: (value) => setField("selectedBackgroundRemoteUrl", value),
    setSelectedLogoColorMode: (value) => setField("selectedLogoColorMode", value),
    setSelectedLogoSourceMode: (value) => setField("selectedLogoSourceMode", value),
    setSelectedLogoColor: (value) => setField("selectedLogoColor", value),
    setSelectedLogoGradient: (value) => setField("selectedLogoGradient", value),
    setSelectedLogoPresetId: (value) => setField("selectedLogoPresetId", value),
    setSelectedLogoPresetValue: (value) => setField("selectedLogoPresetValue", value),
    setSelectedLogoAssetSourceMode: (value) => setField("selectedLogoAssetSourceMode", value),
    setSelectedLogoRemoteUrl: (value) => setField("selectedLogoRemoteUrl", value),
    setSelectedLogoUploadValue: (value) => setField("selectedLogoUploadValue", value),
    setSelectedLogoSize: (value) => setField("selectedLogoSize", value),
    setSelectedLogoMargin: (value) => setField("selectedLogoMargin", value),
    setSelectedHideBackgroundDots: (value) => setField("selectedHideBackgroundDots", value),
    setSelectedQrTypeNumber: (value) => setField("selectedQrTypeNumber", value),
    setSelectedQrErrorCorrectionLevel: (value) =>
      setField("selectedQrErrorCorrectionLevel", value),
    setSelectedBoostLevel: (value) => setField("selectedBoostLevel", value),
    setSelectedQrMode: (value) => setField("selectedQrMode", value),
    setSelectedValueSegmentsText: (value) => setField("selectedValueSegmentsText", value),
    setSelectedAriaLabel: (value) => setField("selectedAriaLabel", value),
    setSelectedModuleRoundSize: (value) => setField("selectedModuleRoundSize", value),
    setSelectedModuleSize: (value) => setField("selectedModuleSize", value),
    setSelectedModuleLineWidth: (value) => setField("selectedModuleLineWidth", value),
    setSelectedGradientLinkMode: (value) => setField("selectedGradientLinkMode", value),
    setSelectedLogoOpacity: (value) => setField("selectedLogoOpacity", value),
    setSelectedLogoSizeMode: (value) => setField("selectedLogoSizeMode", value),
    setSelectedLogoWidthPx: (value) => setField("selectedLogoWidthPx", value),
    setSelectedLogoHeightPx: (value) => setField("selectedLogoHeightPx", value),
    setSelectedLogoLockAspect: (value) => setField("selectedLogoLockAspect", value),
    setSelectedLogoPositionMode: (value) => setField("selectedLogoPositionMode", value),
    setSelectedLogoOffsetX: (value) => setField("selectedLogoOffsetX", value),
    setSelectedLogoOffsetY: (value) => setField("selectedLogoOffsetY", value),
    setSelectedLogoCrossOrigin: (value) => setField("selectedLogoCrossOrigin", value),
    setActiveQrLayerId: (value) => setField("activeQrLayerId", value),
    setActiveQrNodeId: (value) => setField("activeQrNodeId", value),
    setQrStateByLayerId: (value) => setField("qrStateByLayerId", value),
    setQrStateByNodeId: (value) => setField("qrStateByNodeId", value),
    setSelectedCardState: (value) => setField("selectedCardState", value),
    setCardStateByNodeId: (value) => setField("cardStateByNodeId", value),
    setSceneCompositionByNodeId: (value) => setField("sceneCompositionByNodeId", value),
    setLayerStateByNodeId: (value) => setField("layerStateByNodeId", value),
    setSelectedLayerId: (value) => setField("selectedLayerId", value),
    setSelectedLayerIds: (value) => setField("selectedLayerIds", value),
    setDesktopCanvasTool: (value) => setField("desktopCanvasTool", value),
    setDesktopSnapEnabled: (value) => setField("desktopSnapEnabled", value),
    setSelectedDownloadExtension: (value) => setField("selectedDownloadExtension", value),
    setSelectedDownloadTarget: (value) => setField("selectedDownloadTarget", value),
    setExportDownloadError: (value) => setField("exportDownloadError", value),
    setSelectedRasterExportPresetId: (value) => setField("selectedRasterExportPresetId", value),
    setSelectedExportPresetId: (value) => setField("selectedExportPresetId", value),
    setSelectedUsePlatformExportPreset: (value) =>
      setField("selectedUsePlatformExportPreset", value),
    setSelectedExportMediaKind: (value) => setField("selectedExportMediaKind", value),
    setSelectedVideoDurationSeconds: (value) => setField("selectedVideoDurationSeconds", value),
    setSelectedVideoFormat: (value) => setField("selectedVideoFormat", value),
    setSelectedVideoFrameRate: (value) => setField("selectedVideoFrameRate", value),
    setSelectedVideoLongEdge: (value) => setField("selectedVideoLongEdge", value),
    setIsDraftingWorkspaceReady: (value) => setField("isDraftingWorkspaceReady", value),
    setDraftingHistoryRevision: (value) => setField("draftingHistoryRevision", value),
    setLogoUploadObjectUrl: (value) => setField("logoUploadObjectUrl", value),
    setModuleFillUploadObjectUrl: (value) => setField("moduleFillUploadObjectUrl", value),
  }
}

export function useWorkspaceSurfaceReducer(
  initialActiveTool?: DesktopToolbarToolId,
): [WorkspaceSurfaceState, Dispatch<WorkspaceSurfaceAction>, WorkspaceSurfaceSetters] {
  const [state, dispatch] = useReducer(
    workspaceSurfaceReducer,
    initialActiveTool,
    createInitialWorkspaceSurfaceState,
  )

  const setters = useMemo(() => createWorkspaceSurfaceSetters(dispatch), [dispatch])

  return [state, dispatch, setters]
}
