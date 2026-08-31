import type {
  DesktopAccessibilitySettings,
  DesktopBackgroundSettings,
  DesktopCornersSettings,
  DesktopEffectsSettings,
  DesktopEncodingSettings,
  DesktopExportSettings,
  DesktopImageSettings,
  DesktopLayersSettings,
  DesktopLogoSettings,
  DesktopPatternSettings,
  DesktopShapeSettings,
  DesktopTextSettings,
} from "@/features/desktop-shell/model/desktop-toolbar-types"
import type { QraftyState } from "@/features/qr-code/model/state"
import type { DraftingCardState } from "@/features/workspace/model/card-state"
import {
  createDefaultDraftingLayers,
  type DraftingCanvasLayer,
} from "@/features/workspace/model/layers"
import type { SceneCompositionState } from "@/features/workspace/model/scene-templates"
import {
  getDesktopAssetSourceMode,
  getDesktopExportTarget,
  getDesktopLogoSourceMode,
  getDesktopTextSettings,
  toDesktopLayerRow,
  type DraftingDownloadTarget,
} from "@/features/workspace/components/workspace-surface-helpers"

export type DesktopToolbarSettingsSnapshots = {
  patternSettings: DesktopPatternSettings
  logoSettings: DesktopLogoSettings
  cornersSettings: DesktopCornersSettings
  shapeSettings: DesktopShapeSettings
  encodingSettings: DesktopEncodingSettings
  accessibilitySettings: DesktopAccessibilitySettings
  imageSettings: DesktopImageSettings
  backgroundSettings: DesktopBackgroundSettings
  effectsSettings: DesktopEffectsSettings
  layersSettings: DesktopLayersSettings
  exportSettings: DesktopExportSettings
  sceneTemplateSettings: {
    sizeSettings: {
      cardHeight: number
      cardWidth: number
      lockAspectRatio: boolean
      sizeMode: DraftingCardState["sizeMode"]
      sizePresetId?: string
    }
  }
  layoutSettings: {
    layout: SceneCompositionState["layout"]
  }
  textSettings: DesktopTextSettings
}

export type BuildDesktopToolbarSettingsSnapshotsInput = {
  activeQrNodeId: string
  activeCanvasLayers: DraftingCanvasLayer[]
  activeCanvasLayerRows: DraftingCanvasLayer[]
  activeSceneComposition: SceneCompositionState
  draftingQraftyState: QraftyState
  selectedAriaLabel: string
  selectedBackgroundColor: string
  selectedBackgroundColorMode: "solid" | "gradient"
  selectedBackgroundGradient: QraftyState["backgroundGradient"]
  selectedBackgroundShapeId: QraftyState["backgroundShapeId"]
  selectedBackgroundShapeOptions: QraftyState["backgroundShapeOptions"]
  selectedBoostLevel: boolean
  selectedCardState: DraftingCardState
  selectedCornerDotColor: string
  selectedCornerDotColorMode: "solid" | "gradient"
  selectedCornerDotGradient: QraftyState["cornerDotGradient"]
  selectedCornerSquareColor: string
  selectedCornerSquareColorMode: "solid" | "gradient"
  selectedCornerSquareGradient: QraftyState["cornerSquareGradient"]
  selectedDotColor: string
  selectedDotType: QraftyState["dataModulesSettings"]["type"]
  selectedDotsColorMode: QraftyState["dotsColorMode"]
  selectedDotsGradient: QraftyState["dataModulesGradient"]
  selectedDotsPalette: string[]
  selectedDotsPalettePreset: string | "custom"
  selectedModuleFillImageUrl: string
  selectedModuleFillImageSourceMode: "upload" | "url"
  selectedModuleFillRemoteUrl: string
  selectedDownloadExtension: string
  selectedDownloadTarget: DraftingDownloadTarget
  selectedExportMediaKind: DesktopExportSettings["mediaKind"]
  selectedVideoDurationSeconds: DesktopExportSettings["videoDurationSeconds"]
  selectedVideoFormat: DesktopExportSettings["videoFormat"]
  selectedVideoFrameRate: DesktopExportSettings["videoFrameRate"]
  selectedVideoLongEdge: DesktopExportSettings["videoLongEdge"]
  selectedGradientLinkMode: QraftyState["gradientLinkMode"]
  selectedHideBackgroundDots: boolean
  selectedLayerId: string | null
  selectedLogoAssetSourceMode: "upload" | "url"
  selectedLogoColor: string
  selectedLogoColorMode: "solid" | "gradient"
  selectedLogoCrossOrigin: QraftyState["imageOptions"]["crossOrigin"]
  selectedLogoGradient: QraftyState["logoGradient"]
  selectedLogoHeightPx?: number
  selectedLogoLockAspect: boolean
  selectedLogoMargin: number
  selectedLogoOffsetX: number
  selectedLogoOffsetY: number
  selectedLogoOpacity: number
  selectedLogoPositionMode: QraftyState["imageOptions"]["logoPositionMode"]
  selectedLogoPresetId: string | null
  selectedLogoRemoteUrl: string
  selectedLogoSize: number
  selectedLogoSizeMode: QraftyState["imageOptions"]["sizeMode"]
  selectedLogoSourceMode: QraftyState["logo"]["source"]
  selectedLogoWidthPx?: number
  selectedModuleLineWidth?: number
  selectedModuleRoundSize: boolean
  selectedModuleSize?: number
  selectedQrErrorCorrectionLevel: QraftyState["qrOptions"]["errorCorrectionLevel"]
  selectedQrFinderPatternInnerStyle: QraftyState["cornerDotStyle"]
  selectedQrFinderPatternOuterStyle: QraftyState["cornerSquareStyle"]
  selectedQrTypeNumber: QraftyState["qrOptions"]["typeNumber"]
  selectedExportScale: ExportScale
  selectedTextLayer: DraftingCanvasLayer | null
  selectedValueSegmentsText: string
}

export function buildDesktopToolbarSettingsSnapshots(
  input: BuildDesktopToolbarSettingsSnapshotsInput,
): DesktopToolbarSettingsSnapshots {
  const {
    activeQrNodeId,
    activeCanvasLayers,
    activeCanvasLayerRows,
    activeSceneComposition,
    draftingQraftyState,
    selectedCardState,
    selectedTextLayer,
  } = input

  const patternSettings: DesktopPatternSettings = {
    dotsColorMode: input.selectedDotsColorMode,
    dataModulesGradient: input.selectedDotsGradient,
    dotsPalette: input.selectedDotsPalette,
    dotsPalettePreset: input.selectedDotsPalettePreset,
    dotsSolidColor: input.selectedDotColor,
    moduleFillImageUrl:
      input.selectedModuleFillImageSourceMode === "url"
        ? input.selectedModuleFillRemoteUrl
        : input.selectedModuleFillImageUrl,
    moduleFillImageSourceMode: input.selectedModuleFillImageSourceMode,
    qrDotType: input.selectedDotType,
    moduleRoundSize: input.selectedModuleRoundSize,
    moduleSize: input.selectedModuleSize,
    moduleLineWidth: input.selectedModuleLineWidth,
    gradientLinkMode: input.selectedGradientLinkMode,
  }

  const logoSettings: DesktopLogoSettings = {
    colorMode: input.selectedLogoColorMode,
    gradient: input.selectedLogoGradient,
    hideBackgroundDots: input.selectedHideBackgroundDots,
    margin: input.selectedLogoMargin,
    remoteUrl: input.selectedLogoRemoteUrl,
    selectedBrandIconId: input.selectedLogoPresetId ?? "",
    size: input.selectedLogoSize,
    solidColor: input.selectedLogoColor,
    sourceMode: getDesktopLogoSourceMode(input.selectedLogoSourceMode),
    uploadMode: input.selectedLogoAssetSourceMode,
    opacity: input.selectedLogoOpacity,
    sizeMode: input.selectedLogoSizeMode,
    widthPx: input.selectedLogoWidthPx,
    heightPx: input.selectedLogoHeightPx,
    lockAspect: input.selectedLogoLockAspect,
    positionMode: input.selectedLogoPositionMode,
    offsetX: input.selectedLogoOffsetX,
    offsetY: input.selectedLogoOffsetY,
    crossOrigin: input.selectedLogoCrossOrigin,
  }

  const cornersSettings: DesktopCornersSettings = {
    cornerDotColorMode: input.selectedCornerDotColorMode,
    cornerDotGradient: input.selectedCornerDotGradient,
    cornerDotSolidColor: input.selectedCornerDotColor,
    cornerDotType: input.selectedQrFinderPatternInnerStyle,
    cornerSquareColorMode: input.selectedCornerSquareColorMode,
    cornerSquareGradient: input.selectedCornerSquareGradient,
    cornerSquareSolidColor: input.selectedCornerSquareColor,
    cornerSquareType: input.selectedQrFinderPatternOuterStyle,
  }

  const activeQrLayer =
    activeCanvasLayers.find((layer) => layer.kind === "qr") ??
    createDefaultDraftingLayers(activeQrNodeId, draftingQraftyState, selectedCardState).find(
      (layer) => layer.kind === "qr",
    )

  const shapeSettings: DesktopShapeSettings = {
    backgroundShapeId: input.selectedBackgroundShapeId,
    bottomSpace: selectedCardState.bottomSpace,
    cardFill: selectedCardState.fill,
    cardHeight: selectedCardState.height,
    cardRadius: selectedCardState.cornerRadius,
    cardWidth: selectedCardState.width,
    lockAspectRatio: selectedCardState.lockAspectRatio,
    shapeColorMode: input.selectedBackgroundColorMode,
    shapeGradient: input.selectedBackgroundGradient,
    shapePadding: input.selectedBackgroundShapeOptions.paddingPx,
    shapeShadowBlur: activeQrLayer?.shadow.blur ?? 0,
    shapeShadowColor: activeQrLayer?.shadow.color ?? "#111827",
    shapeShadowOffsetX: activeQrLayer?.shadow.offsetX ?? 0,
    shapeShadowOffsetY: activeQrLayer?.shadow.offsetY ?? 0,
    shapeShadowOpacity: activeQrLayer?.shadow.opacity ?? 0,
    shapeSolidColor: input.selectedBackgroundColor,
    shadowBlur: selectedCardState.shadow.blur,
    shadowColor: selectedCardState.shadow.color,
    shadowOffsetX: selectedCardState.shadow.offsetX,
    shadowOffsetY: selectedCardState.shadow.offsetY,
    shadowOpacity: selectedCardState.shadow.opacity,
    sizeMode: selectedCardState.sizeMode,
    sizePresetId: selectedCardState.sizePresetId,
  }

  const encodingSettings: DesktopEncodingSettings = {
    errorCorrectionLevel: input.selectedQrErrorCorrectionLevel,
    typeNumber: input.selectedQrTypeNumber,
    boostLevel: input.selectedBoostLevel,
    valueSegmentsText: input.selectedValueSegmentsText,
  }

  const accessibilitySettings: DesktopAccessibilitySettings = {
    ariaLabel: input.selectedAriaLabel,
  }

  const imageSettings: DesktopImageSettings = {
    fit: selectedCardState.cardImage.fit,
    intent: "shape-fill",
    opacity: selectedCardState.cardImage.opacity,
    remoteUrl: selectedCardState.cardImage.value ?? "",
    sourceMode: getDesktopAssetSourceMode(selectedCardState.cardImage.source),
  }

  const backgroundSettings: DesktopBackgroundSettings = {
    paperShader: selectedCardState.paperShader,
    styleMode: selectedCardState.styleMode,
  }

  const effectsSettings: DesktopEffectsSettings = {
    filterId: selectedCardState.imageFilter.shaderId,
    filterPresetName: selectedCardState.imageFilter.presetName,
  }

  const layersSettings: DesktopLayersSettings = {
    layers: activeCanvasLayerRows.map((layer) => toDesktopLayerRow(layer)),
    selectedLayerId: input.selectedLayerId ?? activeCanvasLayerRows[0]?.id ?? "",
  }

  const exportSettings: DesktopExportSettings = {
    extension: input.selectedDownloadExtension as DesktopExportSettings["extension"],
    exportScale: input.selectedExportScale,
    mediaKind: input.selectedExportMediaKind,
    target: getDesktopExportTarget(input.selectedDownloadTarget),
    videoDurationSeconds: input.selectedVideoDurationSeconds,
    videoFormat: input.selectedVideoFormat,
    videoFrameRate: input.selectedVideoFrameRate,
    videoLongEdge: input.selectedVideoLongEdge,
  }

  return {
    patternSettings,
    logoSettings,
    cornersSettings,
    shapeSettings,
    encodingSettings,
    accessibilitySettings,
    imageSettings,
    backgroundSettings,
    effectsSettings,
    layersSettings,
    exportSettings,
    sceneTemplateSettings: {
      sizeSettings: {
        cardHeight: selectedCardState.height,
        cardWidth: selectedCardState.width,
        lockAspectRatio: selectedCardState.lockAspectRatio,
        sizeMode: selectedCardState.sizeMode,
        sizePresetId: selectedCardState.sizePresetId,
      },
    },
    layoutSettings: {
      layout: activeSceneComposition.layout,
    },
    textSettings: getDesktopTextSettings(selectedTextLayer),
  }
}

export function pickDesktopToolbarSettingsSnapshots(snapshots: DesktopToolbarSettingsSnapshots) {
  return {
    desktopPatternSettings: snapshots.patternSettings,
    desktopLogoSettings: snapshots.logoSettings,
    desktopCornersSettings: snapshots.cornersSettings,
    desktopShapeSettings: snapshots.shapeSettings,
    desktopEncodingSettings: snapshots.encodingSettings,
    desktopAccessibilitySettings: snapshots.accessibilitySettings,
    desktopImageSettings: snapshots.imageSettings,
    desktopBackgroundSettings: snapshots.backgroundSettings,
    desktopEffectsSettings: snapshots.effectsSettings,
    desktopLayersSettings: snapshots.layersSettings,
    desktopExportSettings: snapshots.exportSettings,
    desktopSceneTemplateSettings: snapshots.sceneTemplateSettings,
    desktopLayoutSettings: snapshots.layoutSettings,
    desktopTextSettings: snapshots.textSettings,
  }
}
