import type {
  AccessibilitySettings,
  BackgroundSettings,
  CornersSettings,
  EffectsSettings,
  EncodingSettings,
  ExportSettings,
  ImageSettings,
  LayersSettings,
  LogoSettings,
  PatternSettings,
  ShapeSettings,
  TextSettings,
} from "@/features/shell/model/toolbar-types";
import type { QraftyState } from "@/features/qr/model/state";
import type { DraftingCardState } from "@/features/canvas/model/card-state";
import type { DraftingCanvasLayer } from "@/features/canvas/model/layers/shared";
import { createDefaultDraftingLayers } from "@/features/canvas/model/layers/card-qr";
import type { SceneCompositionState } from "@/features/canvas/model/scene-templates";
import {
  getAssetSourceMode,
  getExportTarget,
  getLogoSourceMode,
  getLayerTextSettings,
  toLayerRow,
  type DraftingDownloadTarget,
} from "@/features/canvas/components/drafting-canvas-operations";

export type ToolbarSettingsSnapshots = {
  patternSettings: PatternSettings;
  logoSettings: LogoSettings;
  cornersSettings: CornersSettings;
  shapeSettings: ShapeSettings;
  encodingSettings: EncodingSettings;
  accessibilitySettings: AccessibilitySettings;
  imageSettings: ImageSettings;
  backgroundSettings: BackgroundSettings;
  effectsSettings: EffectsSettings;
  layersSettings: LayersSettings;
  exportSettings: ExportSettings;
  sceneTemplateSettings: {
    sizeSettings: {
      cardHeight: number;
      cardWidth: number;
      lockAspectRatio: boolean;
      sizeMode: DraftingCardState["sizeMode"];
      sizePresetId?: string;
    };
  };
  layoutSettings: {
    layout: SceneCompositionState["layout"];
  };
  textSettings: TextSettings;
};

export type BuildToolbarSettingsSnapshotsInput = {
  activeQrNodeId: string;
  activeCanvasLayers: DraftingCanvasLayer[];
  activeCanvasLayerRows: DraftingCanvasLayer[];
  activeSceneComposition: SceneCompositionState;
  draftingQraftyState: QraftyState;
  selectedAriaLabel: string;
  selectedBackgroundColor: string;
  selectedBackgroundColorMode: "solid" | "gradient";
  selectedBackgroundGradient: QraftyState["backgroundGradient"];
  selectedBackgroundShapeId: QraftyState["backgroundShapeId"];
  selectedBackgroundShapeOptions: QraftyState["backgroundShapeOptions"];
  selectedBoostLevel: boolean;
  selectedCardState: DraftingCardState;
  selectedCornerDotColor: string;
  selectedCornerDotColorMode: "solid" | "gradient";
  selectedCornerDotGradient: QraftyState["finderPatternInnerGradient"];
  selectedCornerSquareColor: string;
  selectedCornerSquareColorMode: "solid" | "gradient";
  selectedCornerSquareGradient: QraftyState["finderPatternOuterGradient"];
  selectedDotColor: string;
  selectedDotType: QraftyState["dataModulesSettings"]["type"];
  selectedDotsColorMode: QraftyState["dotsColorMode"];
  selectedDotsGradient: QraftyState["dataModulesGradient"];
  selectedDotsPalette: string[];
  selectedDotsPalettePreset: string | "custom";
  selectedModuleFillImageUrl: string;
  selectedModuleFillImageSourceMode: "upload" | "url";
  selectedModuleFillRemoteUrl: string;
  selectedDownloadExtension: string;
  selectedDownloadTarget: DraftingDownloadTarget;
  selectedExportMediaKind: ExportSettings["mediaKind"];
  selectedVideoDurationSeconds: ExportSettings["videoDurationSeconds"];
  selectedVideoFormat: ExportSettings["videoFormat"];
  selectedVideoFrameRate: ExportSettings["videoFrameRate"];
  selectedVideoLongEdge: ExportSettings["videoLongEdge"];
  selectedGradientLinkMode: QraftyState["gradientLinkMode"];
  selectedHideBackgroundDots: boolean;
  selectedLayerId: string | null;
  selectedLogoAssetSourceMode: "upload" | "url";
  selectedLogoColor: string;
  selectedLogoColorMode: "solid" | "gradient";
  selectedLogoCrossOrigin: QraftyState["imageOptions"]["crossOrigin"];
  selectedLogoGradient: QraftyState["logoGradient"];
  selectedLogoHeightPx?: number;
  selectedLogoLockAspect: boolean;
  selectedLogoMargin: number;
  selectedLogoOffsetX: number;
  selectedLogoOffsetY: number;
  selectedLogoOpacity: number;
  selectedLogoPositionMode: QraftyState["imageOptions"]["logoPositionMode"];
  selectedLogoPresetId: string | null;
  selectedLogoRemoteUrl: string;
  selectedLogoSize: number;
  selectedLogoSizeMode: QraftyState["imageOptions"]["sizeMode"];
  selectedLogoSourceMode: QraftyState["logo"]["source"];
  selectedLogoWidthPx?: number;
  selectedModuleLineWidth?: number;
  selectedModuleRoundSize: boolean;
  selectedModuleSize?: number;
  selectedQrErrorCorrectionLevel: QraftyState["qrOptions"]["errorCorrectionLevel"];
  selectedQrFinderPatternInnerStyle: QraftyState["finderPatternInnerSettings"]["type"];
  selectedQrFinderPatternOuterStyle: QraftyState["finderPatternOuterSettings"]["type"];
  selectedQrTypeNumber: QraftyState["qrOptions"]["typeNumber"];
  selectedPhotoLongEdge: ExportSettings["photoLongEdge"];
  selectedTextLayer: DraftingCanvasLayer | null;
  selectedValueSegmentsText: string;
};

export function buildToolbarSettingsSnapshots(
  input: BuildToolbarSettingsSnapshotsInput,
): ToolbarSettingsSnapshots {
  const {
    activeQrNodeId,
    activeCanvasLayers,
    activeCanvasLayerRows,
    activeSceneComposition,
    draftingQraftyState,
    selectedCardState,
    selectedTextLayer,
  } = input;

  const patternSettings: PatternSettings = {
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
  };

  const logoSettings: LogoSettings = {
    colorMode: input.selectedLogoColorMode,
    customImageUrl:
      draftingQraftyState.logo.source === "upload" || draftingQraftyState.logo.source === "url"
        ? (draftingQraftyState.logo.value ?? "")
        : "",
    gradient: input.selectedLogoGradient,
    hideBackgroundDots: input.selectedHideBackgroundDots,
    margin: input.selectedLogoMargin,
    remoteUrl: input.selectedLogoRemoteUrl,
    selectedBrandIconId: input.selectedLogoPresetId ?? "",
    size: input.selectedLogoSize,
    solidColor: input.selectedLogoColor,
    sourceMode: getLogoSourceMode(input.selectedLogoSourceMode),
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
  };

  const cornersSettings: CornersSettings = {
    cornerDotColorMode: input.selectedCornerDotColorMode,
    cornerDotGradient: input.selectedCornerDotGradient,
    cornerDotSolidColor: input.selectedCornerDotColor,
    cornerDotType: input.selectedQrFinderPatternInnerStyle,
    cornerSquareColorMode: input.selectedCornerSquareColorMode,
    cornerSquareGradient: input.selectedCornerSquareGradient,
    cornerSquareSolidColor: input.selectedCornerSquareColor,
    cornerSquareType: input.selectedQrFinderPatternOuterStyle,
  };

  const activeQrLayer =
    activeCanvasLayers.find((layer) => layer.kind === "qr") ??
    createDefaultDraftingLayers(activeQrNodeId, draftingQraftyState, selectedCardState).find(
      (layer) => layer.kind === "qr",
    );

  const shapeSettings: ShapeSettings = {
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
  };

  const encodingSettings: EncodingSettings = {
    errorCorrectionLevel: input.selectedQrErrorCorrectionLevel,
    typeNumber: input.selectedQrTypeNumber,
    boostLevel: input.selectedBoostLevel,
    valueSegmentsText: input.selectedValueSegmentsText,
  };

  const accessibilitySettings: AccessibilitySettings = {
    ariaLabel: input.selectedAriaLabel,
  };

  const imageSettings: ImageSettings = {
    fit: selectedCardState.cardImage.fit,
    intent: "shape-fill",
    opacity: selectedCardState.cardImage.opacity,
    remoteUrl: selectedCardState.cardImage.value ?? "",
    sourceMode: getAssetSourceMode(selectedCardState.cardImage.source),
  };

  const backgroundSettings: BackgroundSettings = {
    paperShader: selectedCardState.paperShader,
    styleMode: selectedCardState.styleMode,
  };

  const effectsSettings: EffectsSettings = {
    filterId: selectedCardState.imageFilter.shaderId,
    filterPresetName: selectedCardState.imageFilter.presetName,
  };

  const layersSettings: LayersSettings = {
    layers: activeCanvasLayerRows.map((layer) => toLayerRow(layer)),
    selectedLayerId: input.selectedLayerId ?? activeCanvasLayerRows[0]?.id ?? "",
  };

  const exportSettings: ExportSettings = {
    extension: input.selectedDownloadExtension as ExportSettings["extension"],
    photoLongEdge: input.selectedPhotoLongEdge,
    mediaKind: input.selectedExportMediaKind,
    target: getExportTarget(input.selectedDownloadTarget),
    videoDurationSeconds: input.selectedVideoDurationSeconds,
    videoFormat: input.selectedVideoFormat,
    videoFrameRate: input.selectedVideoFrameRate,
    videoLongEdge: input.selectedVideoLongEdge,
  };

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
    textSettings: getLayerTextSettings(selectedTextLayer),
  };
}

export function pickToolbarSettingsSnapshots(snapshots: ToolbarSettingsSnapshots) {
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
  };
}
