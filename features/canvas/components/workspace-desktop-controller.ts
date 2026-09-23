import type { DraftingCanvasLayer } from "@/features/canvas/model/layers"
import { isLayerDeletable } from "@/features/canvas/model/layers"
import type {
  SceneCompositionState,
  SceneLayoutPreset,
} from "@/features/canvas/model/scene-templates"
import type { DraftingPaneCanvasTool } from "@/features/canvas/components/Canvas"
import type { DraftingLayerMenuAction } from "@/features/canvas/components/pane-layer-chrome.constants"
import type { DesktopAppearanceSnapshot } from "@/features/shell/model/appearance"
import type {
  ComposeSidebarPanel,
  DesktopAccessibilitySettings,
  DesktopBackgroundInspectorTab,
  DesktopBackgroundSettings,
  DesktopCornersSettings,
  DesktopEffectsSettings,
  DesktopEncodingSettings,
  DesktopExportSettings,
  DesktopImageSettings,
  DesktopLayersSettings,
  DesktopLayoutSettings,
  DesktopLogoSettings,
  DesktopMotionSettings,
  DesktopPatternSettings,
  DesktopSceneTemplateSettings,
  DesktopShapeSettings,
  DesktopTextSettings,
  DesktopToolbarController,
  DesktopToolbarToolId,
} from "@/features/shell/model/desktop-toolbar-types"
import type { ScanSafetyResult } from "@/features/qr/scan-safety/types"
import type {
  StaticQrContentValue,
  StaticQrContentValues,
  StaticQrValidationResult,
} from "@/features/qr/content/static-payload"
import type { QrInputType } from "@/features/qr/content/input-options"

/**
 * Assembles the `DesktopToolbarController` the inspector and toolbars consume.
 *
 * The controller is the workspace's public interface, so it is built in
 * concern-sized groups rather than one 200-line literal. Groups that only
 * forward values are spread directly; groups that derive handlers get a named
 * builder. The result is typed, so a dropped field is a compile error.
 */

export type CoreControllerParams = {
  activeTool: DesktopToolbarToolId | null
  appearanceSnapshot: DesktopAppearanceSnapshot | null
  canRedo: boolean
  canUndo: boolean
  composeSidebarPanel: ComposeSidebarPanel | null
  contentValidation: StaticQrValidationResult
  contentValues: StaticQrContentValues
  contentType: QrInputType
  encodedContentValue: string
  insertNodeId: string
  onActiveToolChange: (toolId: DesktopToolbarToolId) => void
  onContentPasteApply: (type: QrInputType, values: StaticQrContentValues) => void
  onContentReset: () => void
  onContentTypeChange: (type: QrInputType) => void
  onContentValueChange: (field: string, value: StaticQrContentValue) => void
  onRedo: () => void
  onResetDefaults: () => void
  onSave: () => void
  onUndo: () => void
  scanSafetyResult: ScanSafetyResult | undefined
  selectedAppearanceLayer: DraftingCanvasLayer | null
  selectedElementLayer: DraftingCanvasLayer | null
  selectedLayerIds: string[]
  selectedTransformLayer: DraftingCanvasLayer | null
}

export type QrSettingsControllerParams = {
  accessibilitySettings: DesktopAccessibilitySettings
  backgroundInspectorTab: DesktopBackgroundInspectorTab
  backgroundSettings: DesktopBackgroundSettings
  cornersSettings: DesktopCornersSettings
  effectsSettings: DesktopEffectsSettings
  encodingSettings: DesktopEncodingSettings
  imageSettings: DesktopImageSettings
  logoSettings: DesktopLogoSettings
  motionSettings: DesktopMotionSettings
  onAccessibilityReset: () => void
  onAccessibilitySettingsChange: DesktopToolbarController["onAccessibilitySettingsChange"]
  onBackgroundInspectorTabChange: (tab: DesktopBackgroundInspectorTab) => void
  onBackgroundReset: () => void
  onBackgroundSettingsChange: DesktopToolbarController["onBackgroundSettingsChange"]
  onCornersReset: () => void
  onCornersSettingsChange: DesktopToolbarController["onCornersSettingsChange"]
  onEffectsReset: () => void
  onEffectsSettingsChange: DesktopToolbarController["onEffectsSettingsChange"]
  onEncodingReset: () => void
  onEncodingSettingsChange: DesktopToolbarController["onEncodingSettingsChange"]
  onImageReset: () => void
  onImageSettingsChange: DesktopToolbarController["onImageSettingsChange"]
  onLogoReset: () => void
  onLogoSettingsChange: DesktopToolbarController["onLogoSettingsChange"]
  onMotionReset: () => void
  onMotionSettingsChange: DesktopToolbarController["onMotionSettingsChange"]
  onPatternReset: () => void
  onPatternSettingsChange: DesktopToolbarController["onPatternSettingsChange"]
  onShapeReset: () => void
  onShapeSettingsChange: DesktopToolbarController["onShapeSettingsChange"]
  onTextReset: () => void
  onTextSettingsChange: DesktopToolbarController["onTextSettingsChange"]
  onUnifiedQrFillSettingsChange: DesktopToolbarController["onUnifiedQrFillSettingsChange"]
  patternSettings: DesktopPatternSettings
  shapeSettings: DesktopShapeSettings
  textSettings: DesktopTextSettings
}

export type SceneControllerParams = {
  activeQrNodeId: string
  activeSceneComposition: SceneCompositionState
  layoutSettings: DesktopLayoutSettings
  onBackgroundTabChange: (tab: "shader" | "image" | "color") => void
  onCloseComposeSidebar: () => void
  onLayoutPresetSelect: (preset: SceneLayoutPreset) => void
  onLayoutSettingsChange: (patch: Partial<SceneLayoutPreset>) => void
  onOpenComposeSidebar: (panel: "wallpapers") => void
  onSceneTemplateSizeChange: DesktopToolbarController["onSceneTemplateSizeChange"]
  onSceneTemplateSizeTemplateSelect: DesktopToolbarController["onSceneTemplateSizeTemplateSelect"]
  onSelectWallpaper: (imagePath: string) => void
  sceneTemplateSettings: DesktopSceneTemplateSettings
}

export type CanvasControllerParams = {
  canRemoveQrCode: boolean
  canvasTool: DraftingPaneCanvasTool | null
  onAddQrCode: () => void
  onAddTextLayerAt: (paneId: string, point: { x: number; y: number }) => void
  onCanvasToolChange: (tool: DraftingPaneCanvasTool | null) => void
  onInsertLayer: (layer: DraftingCanvasLayer) => void
  onRemoveQrCode: (() => void) | undefined
  qrLayerCount: number
}

export type ElementControllerParams = {
  activeQrNodeId: string
  onAppearancePatch: DesktopToolbarController["onAppearancePatch"]
  onLayerChange: (
    nodeId: string,
    layerId: string,
    patch: Partial<DraftingCanvasLayer>,
  ) => void
  propertiesTransformLayer: DraftingCanvasLayer | null
  selectedElementLayer: DraftingCanvasLayer | null
  selectedTransformLayer: DraftingCanvasLayer | null
}

export type ExportControllerParams = {
  canExportDownload: boolean
  canExportVideo: boolean
  exportDownloadError: string | null
  exportInProgress: boolean
  exportProgressLabel: string | null
  exportProgressRatio: number | null
  exportSettings: DesktopExportSettings
  onExportCancel: () => void
  onExportDownload: () => void
  onExportReset: () => void
  onExportSettingsChange: DesktopToolbarController["onExportSettingsChange"]
}

export type LayersControllerParams = {
  activeCanvasLayers: DraftingCanvasLayer[]
  activeQrNodeId: string
  layersSettings: DesktopLayersSettings
  onLayerAction: (
    nodeId: string,
    layerIds: string[],
    action: DraftingLayerMenuAction,
  ) => void
  onLayerCopy: () => void
  onLayersReset: () => void
  onLayersReorder: (orderedIds: string[]) => void
  onLayersSettingsChange: DesktopToolbarController["onLayersSettingsChange"]
  selectedLayerIds: string[]
}

export type DesktopControllerParams = {
  canvas: CanvasControllerParams
  core: CoreControllerParams
  element: ElementControllerParams
  export: ExportControllerParams
  layers: LayersControllerParams
  qrSettings: QrSettingsControllerParams
  scene: SceneControllerParams
}

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
  }
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
    onElementLayerPatch: (patch: Partial<DraftingCanvasLayer>) => {
      if (selectedElementLayer) {
        onLayerChange(activeQrNodeId, selectedElementLayer.id, patch)
      }
    },
    onTransformLayerPatch: (patch: Partial<DraftingCanvasLayer>) => {
      const target = selectedTransformLayer ?? propertiesTransformLayer
      if (target) {
        onLayerChange(activeQrNodeId, target.id, patch)
      }
    },
  }
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
      onLayerAction(activeQrNodeId, [layerId], "delete")
    },
    onLayerMenuAction: (action: DraftingLayerMenuAction) => {
      onLayerAction(activeQrNodeId, selectedLayerIds, action)
    },
    onLayerCopy,
    canCopyLayers: selectedLayerIds.length > 0,
    canDeleteLayer: (layerId: string) => isLayerDeletable(layerId, activeCanvasLayers),
  }
}

export function buildDesktopController({
  canvas,
  core,
  element,
  export: exportParams,
  layers,
  qrSettings,
  scene,
}: DesktopControllerParams): DesktopToolbarController {
  return {
    ...core,
    ...qrSettings,
    ...scene,
    ...buildCanvasController(canvas),
    ...buildElementController(element),
    ...exportParams,
    ...buildLayersController(layers),
  }
}
