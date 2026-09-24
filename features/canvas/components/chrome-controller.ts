import { createDefaultCanvasCardState } from "@/features/canvas/model/card-state";
import { createDefaultCanvasLayers } from "@/features/canvas/model/layers/card-qr";
import { createDefaultCanvasWorkspaceQrState } from "@/features/canvas/model/document";
import { applySceneCompositionPatch } from "@/features/canvas/model/apply-scene-template";
import { getCanvasSizeFromTemplate } from "@/features/canvas/model/size-templates";
import type { CanvasLayer } from "@/features/canvas/model/layers/shared";
import { isLayerDeletable } from "@/features/canvas/model/layers/shared";
import type {
  SceneCompositionState,
  SceneLayoutPreset,
} from "@/features/canvas/model/scene-templates";
import type {
  CanvasBoardTool,
  CanvasBoardToolbarVariant,
} from "@/features/canvas/components/Canvas";
import { DEFAULT_DRAFTING_STUDIO_STATE } from "@/features/canvas/components/canvas.constants";
import { DEFAULT_DRAFTING_TEXT_LAYER } from "@/features/canvas/model/layers/shared";
import type {
  CanvasSurfaceSetters,
  CanvasSurfaceState,
} from "@/features/canvas/components/canvas-reducer";
import {
  buildToolbarSettingsSnapshots,
  pickToolbarSettingsSnapshots,
} from "@/features/canvas/components/chrome-settings-snapshots";
import type { CanvasBoards } from "@/features/canvas/components/use-canvas-boards";
import type { CanvasPersistence } from "@/features/canvas/components/use-canvas-persistence";
import type { CanvasWorkspaceActions } from "@/features/canvas/components/use-canvas-actions";
import type { QrControlsApi } from "@/features/canvas/canvas/qr-controls";
import type { CanvasLayerMenuAction } from "@/features/canvas/components/canvas-layer-chrome.constants";
import type { AppearanceSnapshot } from "@/features/shell/model/appearance";
import type {
  ComposeSidebarPanel,
  AccessibilitySettings,
  BackgroundSettingsTab,
  BackgroundSettings,
  CornersSettings,
  EffectsSettings,
  EncodingSettings,
  ExportSettings,
  ImageSettings,
  LayersSettings,
  LayoutSettings,
  LogoSettings,
  MotionSettings,
  PatternSettings,
  SceneTemplateSettings,
  ShapeSettings,
  TextSettings,
  ToolbarController,
  ToolbarToolId,
} from "@/features/shell/model/toolbar-types";
import { DEFAULT_DESKTOP_EXPORT_SETTINGS } from "@/features/shell/model/toolbar-defaults";
import type { ScanSafetyResult } from "@/features/qr/scan-safety/types";
import type {
  StaticQrContentValue,
  StaticQrContentValues,
  StaticQrValidationResult,
} from "@/features/qr/content/static-payload";
import type { QrInputType } from "@/features/qr/content/input-options";

/**
 * Assembles the `ToolbarController` the settings and toolbars consume.
 *
 * The controller is the workspace's public interface, so it is built in
 * concern-sized groups rather than one 200-line literal. Groups that only
 * forward values are spread directly; groups that derive handlers get a named
 * builder. The result is typed, so a dropped field is a compile error.
 */

type CoreControllerParams = {
  activeTool: ToolbarToolId | null;
  appearanceSnapshot: AppearanceSnapshot | null;
  canRedo: boolean;
  canUndo: boolean;
  composeSidebarPanel: ComposeSidebarPanel | null;
  contentValidation: StaticQrValidationResult;
  contentValues: StaticQrContentValues;
  contentType: QrInputType;
  encodedContentValue: string;
  insertNodeId: string;
  onActiveToolChange: (toolId: ToolbarToolId) => void;
  onContentPasteApply: (type: QrInputType, values: StaticQrContentValues) => void;
  onContentReset: () => void;
  onContentTypeChange: (type: QrInputType) => void;
  onContentValueChange: (field: string, value: StaticQrContentValue) => void;
  onRedo: () => void;
  onResetDefaults: () => void;
  onSave: () => void;
  onUndo: () => void;
  scanSafetyResult: ScanSafetyResult | undefined;
  selectedAppearanceLayer: CanvasLayer | null;
  selectedElementLayer: CanvasLayer | null;
  selectedLayerIds: string[];
  selectedTransformLayer: CanvasLayer | null;
};

type QrSettingsControllerParams = {
  accessibilitySettings: AccessibilitySettings;
  backgroundSettingsTab: BackgroundSettingsTab;
  backgroundSettings: BackgroundSettings;
  cornersSettings: CornersSettings;
  effectsSettings: EffectsSettings;
  encodingSettings: EncodingSettings;
  imageSettings: ImageSettings;
  logoSettings: LogoSettings;
  motionSettings: MotionSettings;
  onAccessibilityReset: () => void;
  onAccessibilitySettingsChange: ToolbarController["onAccessibilitySettingsChange"];
  onBackgroundSettingsTabChange: (tab: BackgroundSettingsTab) => void;
  onBackgroundReset: () => void;
  onBackgroundSettingsChange: ToolbarController["onBackgroundSettingsChange"];
  onCornersReset: () => void;
  onCornersSettingsChange: ToolbarController["onCornersSettingsChange"];
  onEffectsReset: () => void;
  onEffectsSettingsChange: ToolbarController["onEffectsSettingsChange"];
  onEncodingReset: () => void;
  onEncodingSettingsChange: ToolbarController["onEncodingSettingsChange"];
  onImageReset: () => void;
  onImageSettingsChange: ToolbarController["onImageSettingsChange"];
  onLogoReset: () => void;
  onLogoSettingsChange: ToolbarController["onLogoSettingsChange"];
  onMotionReset: () => void;
  onMotionSettingsChange: ToolbarController["onMotionSettingsChange"];
  onPatternReset: () => void;
  onPatternSettingsChange: ToolbarController["onPatternSettingsChange"];
  onShapeReset: () => void;
  onShapeSettingsChange: ToolbarController["onShapeSettingsChange"];
  onTextReset: () => void;
  onTextSettingsChange: ToolbarController["onTextSettingsChange"];
  onUnifiedQrFillSettingsChange: ToolbarController["onUnifiedQrFillSettingsChange"];
  patternSettings: PatternSettings;
  shapeSettings: ShapeSettings;
  textSettings: TextSettings;
};

type SceneControllerParams = {
  activeQrNodeId: string;
  activeSceneComposition: SceneCompositionState;
  layoutSettings: LayoutSettings;
  onBackgroundTabChange: (tab: "shader" | "image" | "color") => void;
  onCloseComposeSidebar: () => void;
  onLayoutPresetSelect: (preset: SceneLayoutPreset) => void;
  onLayoutSettingsChange: (patch: Partial<SceneLayoutPreset>) => void;
  onOpenComposeSidebar: (panel: "wallpapers") => void;
  onSceneTemplateSizeChange: ToolbarController["onSceneTemplateSizeChange"];
  onSceneTemplateSizeTemplateSelect: ToolbarController["onSceneTemplateSizeTemplateSelect"];
  onSelectWallpaper: (imagePath: string) => void;
  sceneTemplateSettings: SceneTemplateSettings;
};

type CanvasControllerParams = {
  canRemoveQrCode: boolean;
  canvasTool: CanvasBoardTool | null;
  onAddQrCode: () => void;
  onAddTextLayerAt: (boardId: string, point: { x: number; y: number }) => void;
  onCanvasToolChange: (tool: CanvasBoardTool | null) => void;
  onInsertLayer: (layer: CanvasLayer) => void;
  onRemoveQrCode: (() => void) | undefined;
  qrLayerCount: number;
};

type ElementControllerParams = {
  activeQrNodeId: string;
  onAppearancePatch: ToolbarController["onAppearancePatch"];
  onLayerChange: (nodeId: string, layerId: string, patch: Partial<CanvasLayer>) => void;
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
  onExportReset: () => void;
  onExportSettingsChange: ToolbarController["onExportSettingsChange"];
};

type LayersControllerParams = {
  activeCanvasLayers: CanvasLayer[];
  activeQrNodeId: string;
  layersSettings: LayersSettings;
  onLayerAction: (nodeId: string, layerIds: string[], action: CanvasLayerMenuAction) => void;
  onLayerCopy: () => void;
  onLayersReset: () => void;
  onLayersReorder: (orderedIds: string[]) => void;
  onLayersSettingsChange: ToolbarController["onLayersSettingsChange"];
  selectedLayerIds: string[];
};

type ToolbarControllerParams = {
  canvas: CanvasControllerParams;
  core: CoreControllerParams;
  element: ElementControllerParams;
  export: ExportControllerParams;
  layers: LayersControllerParams;
  qrSettings: QrSettingsControllerParams;
  scene: SceneControllerParams;
};

function buildCanvasController({
  canRemoveQrCode,
  canvasTool,
  onAddQrCode,
  onAddTextLayerAt,
  onCanvasToolChange,
  onInsertLayer,
  onRemoveQrCode,
  qrLayerCount,
}: CanvasControllerParams) {
  return {
    canvasTool,
    onCanvasToolChange,
    canAddQrCode: qrLayerCount < 10,
    onAddQrCode,
    onAddTextLayerAt,
    canRemoveQrCode,
    onRemoveQrCode,
    onInsertLayer,
  };
}

function buildElementController({
  activeQrNodeId,
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
        onLayerChange(activeQrNodeId, selectedElementLayer.id, patch);
      }
    },
    onTransformLayerPatch: (patch: Partial<CanvasLayer>) => {
      const target = selectedTransformLayer ?? propertiesTransformLayer;
      if (target) {
        onLayerChange(activeQrNodeId, target.id, patch);
      }
    },
  };
}

function buildLayersController({
  activeCanvasLayers,
  activeQrNodeId,
  layersSettings,
  onLayerAction,
  onLayerCopy,
  onLayersReset,
  onLayersReorder,
  onLayersSettingsChange,
  selectedLayerIds,
}: LayersControllerParams) {
  return {
    layersSettings,
    onLayersReset,
    onLayersSettingsChange,
    onLayersReorder,
    onLayerDelete: (layerId: string) => {
      onLayerAction(activeQrNodeId, [layerId], "delete");
    },
    onLayerMenuAction: (action: CanvasLayerMenuAction) => {
      onLayerAction(activeQrNodeId, selectedLayerIds, action);
    },
    onLayerCopy,
    canCopyLayers: selectedLayerIds.length > 0,
    canDeleteLayer: (layerId: string) => isLayerDeletable(layerId, activeCanvasLayers),
  };
}

function buildToolbarController({
  canvas,
  core,
  element,
  export: exportParams,
  layers,
  qrSettings,
  scene,
}: ToolbarControllerParams): ToolbarController {
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
 * Workspace-level wrapper around `buildToolbarController`: takes the view
 * model's reducer state, setters, and composed sub-hook results, derives the
 * settings snapshots, and wires every `on*` callback to the matching action.
 * Keeps `useCanvasViewModel` free of controller assembly.
 */
export function buildCanvasWorkspaceController({
  actions,
  boardToolbarVariant,
  boards,
  persistence,
  qrControls,
  scanSafetyResult,
  setters,
  state,
}: {
  actions: CanvasWorkspaceActions;
  boardToolbarVariant: CanvasBoardToolbarVariant;
  boards: CanvasBoards;
  persistence: CanvasPersistence;
  qrControls: QrControlsApi;
  scanSafetyResult: ScanSafetyResult | undefined;
  setters: CanvasSurfaceSetters;
  state: CanvasSurfaceState;
}): ToolbarController {
  const {
    activeQrNodeId,
    backgroundSettingsTab,
    composeSidebarPanel,
    desktopCanvasTool,
    desktopRailTool,
    exportDownloadError,
    selectedAriaLabel,
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
  const {
    setBackgroundSettingsTab,
    setComposeSidebarPanel,
    setDesktopCanvasTool,
    setDesktopRailTool,
    setExportDownloadError,
    setLayerStateByNodeId,
    setSceneCompositionByNodeId,
    setSelectedAriaLabel,
    setSelectedBoostLevel,
    setSelectedCardState,
    setSelectedDotMatrixAnimation,
    setSelectedDownloadExtension,
    setSelectedDownloadTarget,
    setSelectedExportMediaKind,
    setSelectedPhotoLongEdge,
    setSelectedQrErrorCorrectionLevel,
    setSelectedQrMode,
    setSelectedQrTypeNumber,
    setSelectedValueSegmentsText,
    setSelectedVideoDurationSeconds,
    setSelectedVideoFormat,
    setSelectedVideoFrameRate,
    setSelectedVideoLongEdge,
  } = setters;
  const {
    canvasQraftyState,
    selectedContentValidation,
    selectedContentValue,
    selectedContentValues,
  } = persistence;
  const {
    activeCanvasLayerRows,
    activeCanvasLayers,
    activeSceneComposition,
    appearanceTargetLayer,
    canExportVideo,
    canRemoveQrCode,
    desktopAppearanceSnapshot,
    propertiesTransformLayer,
    qrCanvasLayers,
    selectedElementLayer,
    selectedTextLayer,
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
    handleAddTextLayerAt,
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
    handleRemoveQrCode,
    handleSaveCanvasWorkspace,
    handleUndoCanvasWorkspace,
    resetCanvasWorkspace,
    resetDesktopContent,
    resetDesktopLogoSettings,
    resetDesktopPatternSettings,
    resetDesktopShapeSettings,
    selectSingleLayer,
    updateDesktopAccessibilitySettings,
    updateDesktopCornersSettings,
    updateDesktopEncodingSettings,
    updateDesktopExportSettings,
    updateDesktopImageSettings,
    updateDesktopLayersSettings,
    updateDesktopLogoSettings,
    updateDesktopMotionSettings,
    updateDesktopPatternSettings,
    updateDesktopShapeSettings,
    updateDesktopTextSettings,
    updateDesktopUnifiedQrFillSettings,
  } = actions;

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

  return buildToolbarController({
    core: {
      activeTool: desktopRailTool,
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
}
