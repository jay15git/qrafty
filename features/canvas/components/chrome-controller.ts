import { getCanvasSizeFromTemplate } from "@/features/canvas/model/size-templates";
import { DASHBOARD_QR_NODE_ID } from "@/features/qr/rendering/compose-scene";
import type { CanvasLayer } from "@/features/canvas/model/layers/shared";
import { isLayerDeletable } from "@/features/canvas/model/layers/shared";
import type {
  CanvasSurfaceSetters,
  CanvasSurfaceState,
} from "@/features/canvas/components/canvas-reducer";
import { buildToolbarSettingsSnapshots } from "@/features/canvas/components/chrome-settings-snapshots";
import type { CanvasBoards } from "@/features/canvas/components/use-canvas-boards";
import type { ActiveQrApi } from "@/features/canvas/components/use-active-qr";
import type { CanvasWorkspaceActions } from "@/features/canvas/components/use-canvas-actions";
import type { CanvasLayerMenuAction } from "@/features/canvas/components/canvas-layer-chrome.constants";
import type { AppearanceSnapshot } from "@/features/shell/model/appearance";
import type {
  ComposeSidebarPanel,
  BackgroundSettings,
  CornersSettings,
  EncodingSettings,
  ExportSettings,
  ImageSettings,
  LayersSettings,
  LogoSettings,
  MotionSettings,
  PatternSettings,
  CanvasSizeSettings,
  ShapeSettings,
  SettingsController,
  SettingsToolId,
} from "@/features/shell/model/settings-model";
import type { ScanSafetyResult } from "@/features/qr/scan-safety/types";
import type {
  StaticQrContentValue,
  StaticQrContentValues,
  StaticQrValidationResult,
} from "@/features/qr/content/static-payload";
import type { QrInputType } from "@/features/qr/content/input-options";

/**
 * Assembles the `SettingsController` the settings and toolbars consume.
 *
 * The controller is the workspace's public interface, so it is built in
 * concern-sized groups rather than one 200-line literal. Groups that only
 * forward values are spread directly; groups that derive handlers get a named
 * builder. The result is typed, so a dropped field is a compile error.
 */

type CoreControllerParams = {
  activeTool: SettingsToolId | null;
  appearanceSnapshot: AppearanceSnapshot | null;
  canRedo: boolean;
  canUndo: boolean;
  composeSidebarPanel: ComposeSidebarPanel | null;
  contentValidation: StaticQrValidationResult;
  contentValues: StaticQrContentValues;
  contentType: QrInputType;
  insertNodeId: string;
  onActiveToolChange: (toolId: SettingsToolId) => void;
  onContentPasteApply: (type: QrInputType, values: StaticQrContentValues) => void;
  onContentTypeChange: (type: QrInputType) => void;
  onContentValueChange: (field: string, value: StaticQrContentValue) => void;
  onRedo: () => void;
  onUndo: () => void;
  scanSafetyResult: ScanSafetyResult | undefined;
  selectedAppearanceLayer: CanvasLayer | null;
  selectedElementLayer: CanvasLayer | null;
  selectedLayerIds: string[];
  selectedTransformLayer: CanvasLayer | null;
};

type QrSettingsControllerParams = {
  backgroundSettings: BackgroundSettings;
  cornersSettings: CornersSettings;
  encodingSettings: EncodingSettings;
  imageSettings: ImageSettings;
  logoSettings: LogoSettings;
  motionSettings: MotionSettings;
  onBackgroundSettingsChange: SettingsController["onBackgroundSettingsChange"];
  onCornersSettingsChange: SettingsController["onCornersSettingsChange"];
  onEncodingSettingsChange: SettingsController["onEncodingSettingsChange"];
  onImageSettingsChange: SettingsController["onImageSettingsChange"];
  onLogoSettingsChange: SettingsController["onLogoSettingsChange"];
  onMotionSettingsChange: SettingsController["onMotionSettingsChange"];
  onPatternSettingsChange: SettingsController["onPatternSettingsChange"];
  onShapeSettingsChange: SettingsController["onShapeSettingsChange"];
  onUnifiedQrFillSettingsChange: SettingsController["onUnifiedQrFillSettingsChange"];
  patternSettings: PatternSettings;
  shapeSettings: ShapeSettings;
};

type SceneControllerParams = {
  onCanvasBackgroundTabChange: (tab: "shader" | "image" | "color") => void;
  onCloseComposeSidebar: () => void;
  onOpenComposeSidebar: (panel: "wallpapers") => void;
  onCanvasSizeChange: SettingsController["onCanvasSizeChange"];
  onCanvasSizeTemplateSelect: SettingsController["onCanvasSizeTemplateSelect"];
  onSelectWallpaper: (imagePath: string) => void;
  canvasSizeSettings: CanvasSizeSettings;
};

type CanvasControllerParams = {
  onAddQrCode: () => void;
  onInsertLayer: (layer: CanvasLayer) => void;
  qrLayerCount: number;
};

type ElementControllerParams = {
  onAppearancePatch: SettingsController["onAppearancePatch"];
  onLayerChange: (layerId: string, patch: Partial<CanvasLayer>) => void;
  propertiesTransformLayer: CanvasLayer | null;
  selectedElementLayer: CanvasLayer | null;
  selectedTransformLayer: CanvasLayer | null;
};

type ExportControllerParams = {
  canExportDownload: boolean;
  canExportVideo: boolean;
  exportDownloadError: string | null;
  exportInProgress: boolean;
  exportProgressLabel: string | null;
  exportProgressRatio: number | null;
  exportSettings: ExportSettings;
  onExportCancel: () => void;
  onExportDownload: () => void;
  onExportSettingsChange: SettingsController["onExportSettingsChange"];
};

type LayersControllerParams = {
  activeCanvasLayers: CanvasLayer[];
  layersSettings: LayersSettings;
  onLayerAction: (layerIds: string[], action: CanvasLayerMenuAction) => void;
  onLayerCopy: () => void;
  onLayersReorder: (orderedIds: string[]) => void;
  onLayersSettingsChange: SettingsController["onLayersSettingsChange"];
  selectedLayerIds: string[];
};

type SettingsControllerParams = {
  canvas: CanvasControllerParams;
  core: CoreControllerParams;
  element: ElementControllerParams;
  export: ExportControllerParams;
  layers: LayersControllerParams;
  qrSettings: QrSettingsControllerParams;
  scene: SceneControllerParams;
};

function buildCanvasController({
  onAddQrCode,
  onInsertLayer,
  qrLayerCount,
}: CanvasControllerParams) {
  return {
    canAddQrCode: qrLayerCount < 10,
    onAddQrCode,
    onInsertLayer,
  };
}

function buildElementController({
  onAppearancePatch,
  onLayerChange,
  propertiesTransformLayer,
  selectedElementLayer,
  selectedTransformLayer,
}: ElementControllerParams) {
  return {
    onAppearancePatch,
    onElementLayerPatch: (patch: Partial<CanvasLayer>) => {
      if (selectedElementLayer) {
        onLayerChange(selectedElementLayer.id, patch);
      }
    },
    onTransformLayerPatch: (patch: Partial<CanvasLayer>) => {
      const target = selectedTransformLayer ?? propertiesTransformLayer;
      if (target) {
        onLayerChange(target.id, patch);
      }
    },
  };
}

function buildLayersController({
  activeCanvasLayers,
  layersSettings,
  onLayerAction,
  onLayerCopy,
  onLayersReorder,
  onLayersSettingsChange,
  selectedLayerIds,
}: LayersControllerParams) {
  return {
    layersSettings,
    onLayersSettingsChange,
    onLayersReorder,
    onLayerDelete: (layerId: string) => {
      onLayerAction([layerId], "delete");
    },
    onLayerMenuAction: (action: CanvasLayerMenuAction) => {
      onLayerAction(selectedLayerIds, action);
    },
    onLayerCopy,
    canCopyLayers: selectedLayerIds.length > 0,
    canDeleteLayer: (layerId: string) => isLayerDeletable(layerId, activeCanvasLayers),
  };
}

function buildSettingsController({
  canvas,
  core,
  element,
  export: exportParams,
  layers,
  qrSettings,
  scene,
}: SettingsControllerParams): SettingsController {
  return {
    ...core,
    ...qrSettings,
    ...scene,
    ...buildCanvasController(canvas),
    ...buildElementController(element),
    ...exportParams,
    ...buildLayersController(layers),
  };
}

/**
 * Workspace-level wrapper around `buildSettingsController`: takes the view
 * model's reducer state, setters, and composed sub-hook results, derives the
 * settings snapshots, and wires every `on*` callback to the matching action.
 * Keeps `useCanvasViewModel` free of controller assembly.
 */
export function buildCanvasWorkspaceController({
  actions,
  boards,
  activeQr,
  scanSafetyResult,
  setters,
  state,
}: {
  actions: CanvasWorkspaceActions;
  boards: CanvasBoards;
  activeQr: ActiveQrApi;
  scanSafetyResult: ScanSafetyResult | undefined;
  setters: CanvasSurfaceSetters;
  state: CanvasSurfaceState;
}): SettingsController {
  const {
    composeSidebarPanel,
    desktopRailTool,
    exportDownloadError,
    selectedBackgroundColor,
    selectedBackgroundColorMode,
    selectedBackgroundGradient,
    selectedBackgroundShapeId,
    selectedBackgroundShapeOptions,
    selectedBoostLevel,
    selectedCardState,
    selectedContentType,
    selectedCornerDotColor,
    selectedCornerDotColorMode,
    selectedCornerDotGradient,
    selectedCornerSquareColor,
    selectedCornerSquareColorMode,
    selectedCornerSquareGradient,
    selectedDotColor,
    selectedDotMatrixAnimation,
    selectedDotType,
    selectedDotsColorMode,
    selectedDotsGradient,
    selectedDotsPalette,
    selectedDotsPalettePreset,
    selectedDownloadExtension,
    selectedDownloadTarget,
    selectedExportMediaKind,
    selectedGradientLinkMode,
    selectedHideBackgroundDots,
    selectedLayerId,
    selectedLayerIds,
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
    selectedLogoPresetId,
    selectedLogoRemoteUrl,
    selectedLogoSize,
    selectedLogoSizeMode,
    selectedLogoSourceMode,
    selectedLogoWidthPx,
    selectedModuleFillImageSourceMode,
    selectedModuleFillImageUrl,
    selectedModuleFillRemoteUrl,
    selectedModuleLineWidth,
    selectedModuleRoundSize,
    selectedModuleSize,
    selectedPhotoLongEdge,
    selectedQrErrorCorrectionLevel,
    selectedQrFinderPatternInnerStyle,
    selectedQrFinderPatternOuterStyle,
    selectedQrTypeNumber,
    selectedValueSegmentsText,
    selectedVideoDurationSeconds,
    selectedVideoFormat,
    selectedVideoFrameRate,
    selectedVideoLongEdge,
  } = state;
  const { setComposeSidebarPanel, setDesktopRailTool, setSelectedCardState } = setters;
  const { canvasQraftyState, selectedContentValidation, selectedContentValues } = activeQr;
  const {
    activeCanvasLayerRows,
    activeCanvasLayers,
    appearanceTargetLayer,
    canExportVideo,
    desktopAppearanceSnapshot,
    propertiesTransformLayer,
    qrCanvasLayers,
    selectedElementLayer,
    selectedTransformLayer,
  } = boards;
  const {
    canDownload,
    canRedoCanvasWorkspace,
    canUndoCanvasWorkspace,
    cancelWorkspaceExport,
    copySelectedCanvasLayers,
    exportInProgress,
    exportProgressLabel,
    exportProgressRatio,
    handleAddQrCode,
    handleCanvasContentPasteApply,
    handleCanvasContentTypeChange,
    handleCanvasContentValueChange,
    handleDesktopAppearancePatch,
    handleDownload,
    handleInsertLayer,
    handleLayerAction,
    handleLayerChange,
    handleLayerReorder,
    handleRedoCanvasWorkspace,
    handleUndoCanvasWorkspace,
    selectSingleLayer,
    updateDesktopCornersSettings,
    updateDesktopEncodingSettings,
    updateDesktopExportSettings,
    updateDesktopImageSettings,
    updateDesktopLayersSettings,
    updateDesktopLogoSettings,
    updateDesktopMotionSettings,
    updateDesktopPatternSettings,
    updateDesktopShapeSettings,
    updateDesktopUnifiedQrFillSettings,
  } = actions;

  const {
    patternSettings: desktopPatternSettings,
    logoSettings: desktopLogoSettings,
    cornersSettings: desktopCornersSettings,
    shapeSettings: desktopShapeSettings,
    encodingSettings: desktopEncodingSettings,
    imageSettings: desktopImageSettings,
    backgroundSettings: desktopBackgroundSettings,
    layersSettings: desktopLayersSettings,
    exportSettings: desktopExportSettings,
    canvasSizeSettings: desktopCanvasSizeSettings,
  } = buildToolbarSettingsSnapshots({
    activeCanvasLayers,
    activeCanvasLayerRows,
    canvasQraftyState,
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
    selectedValueSegmentsText,
  });

  return buildSettingsController({
    core: {
      activeTool: desktopRailTool,
      appearanceSnapshot: desktopAppearanceSnapshot,
      canRedo: canRedoCanvasWorkspace,
      canUndo: canUndoCanvasWorkspace,
      composeSidebarPanel,
      contentValidation: selectedContentValidation,
      contentValues: selectedContentValues,
      contentType: selectedContentType,
      insertNodeId: DASHBOARD_QR_NODE_ID,
      onActiveToolChange: (toolId) => {
        setComposeSidebarPanel(null);
        setDesktopRailTool(toolId);
      },
      onContentPasteApply: handleCanvasContentPasteApply,
      onContentTypeChange: handleCanvasContentTypeChange,
      onContentValueChange: handleCanvasContentValueChange,
      onRedo: handleRedoCanvasWorkspace,
      onUndo: handleUndoCanvasWorkspace,
      scanSafetyResult,
      selectedAppearanceLayer: appearanceTargetLayer,
      selectedElementLayer,
      selectedLayerIds,
      selectedTransformLayer: propertiesTransformLayer,
    },
    qrSettings: {
      backgroundSettings: desktopBackgroundSettings,
      cornersSettings: desktopCornersSettings,
      encodingSettings: desktopEncodingSettings,
      imageSettings: desktopImageSettings,
      logoSettings: desktopLogoSettings,
      motionSettings: selectedDotMatrixAnimation as MotionSettings,
      onBackgroundSettingsChange: (settings) =>
        setSelectedCardState((current) => ({
          ...current,
          paperShader: settings.paperShader ?? current.paperShader,
          styleMode:
            settings.styleMode ??
            (settings.paperShader !== undefined ? "paper-shader" : current.styleMode),
        })),
      onCornersSettingsChange: updateDesktopCornersSettings,
      onEncodingSettingsChange: updateDesktopEncodingSettings,
      onImageSettingsChange: updateDesktopImageSettings,
      onLogoSettingsChange: updateDesktopLogoSettings,
      onMotionSettingsChange: updateDesktopMotionSettings,
      onPatternSettingsChange: updateDesktopPatternSettings,
      onShapeSettingsChange: updateDesktopShapeSettings,
      onUnifiedQrFillSettingsChange: updateDesktopUnifiedQrFillSettings,
      patternSettings: desktopPatternSettings,
      shapeSettings: desktopShapeSettings,
    },
    scene: {
      onCanvasBackgroundTabChange: (tab) => {
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
      onOpenComposeSidebar: (panel) => {
        setComposeSidebarPanel(panel);
        selectSingleLayer(null);
      },
      onCanvasSizeChange: (patch) => {
        updateDesktopShapeSettings({
          cardHeight: patch.cardHeight,
          cardWidth: patch.cardWidth,
          lockAspectRatio: patch.lockAspectRatio,
          sizeMode: patch.sizeMode,
          sizePresetId: patch.sizePresetId,
        });
      },
      onCanvasSizeTemplateSelect: (template) => {
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
      canvasSizeSettings: desktopCanvasSizeSettings,
    },
    canvas: {
      onAddQrCode: () => {
        void handleAddQrCode();
      },
      onInsertLayer: handleInsertLayer,
      qrLayerCount: qrCanvasLayers.length,
    },
    element: {
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
      onExportSettingsChange: updateDesktopExportSettings,
    },
    layers: {
      activeCanvasLayers,
      layersSettings: desktopLayersSettings,
      onLayerAction: handleLayerAction,
      onLayerCopy: () => {
        void copySelectedCanvasLayers(selectedLayerIds);
      },
      onLayersReorder: handleLayerReorder,
      onLayersSettingsChange: updateDesktopLayersSettings,
      selectedLayerIds,
    },
  });
}
