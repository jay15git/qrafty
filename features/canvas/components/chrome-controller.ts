import type { CanvasLayer } from "@/features/canvas/model/layers/shared";
import { isLayerDeletable } from "@/features/canvas/model/layers/shared";
import type {
  SceneCompositionState,
  SceneLayoutPreset,
} from "@/features/canvas/model/scene-templates";
import type { CanvasBoardTool } from "@/features/canvas/components/Canvas";
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

export type CoreControllerParams = {
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

export type QrSettingsControllerParams = {
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

export type SceneControllerParams = {
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

export type CanvasControllerParams = {
  canRemoveQrCode: boolean;
  canvasTool: CanvasBoardTool | null;
  onAddQrCode: () => void;
  onAddTextLayerAt: (boardId: string, point: { x: number; y: number }) => void;
  onCanvasToolChange: (tool: CanvasBoardTool | null) => void;
  onInsertLayer: (layer: CanvasLayer) => void;
  onRemoveQrCode: (() => void) | undefined;
  qrLayerCount: number;
};

export type ElementControllerParams = {
  activeQrNodeId: string;
  onAppearancePatch: ToolbarController["onAppearancePatch"];
  onLayerChange: (nodeId: string, layerId: string, patch: Partial<CanvasLayer>) => void;
  propertiesTransformLayer: CanvasLayer | null;
  selectedElementLayer: CanvasLayer | null;
  selectedTransformLayer: CanvasLayer | null;
};

export type ExportControllerParams = {
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

export type LayersControllerParams = {
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

export type ToolbarControllerParams = {
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

export function buildToolbarController({
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
