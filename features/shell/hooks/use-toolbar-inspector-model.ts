"use client"

import { useMemo, useState } from "react"
import {
  buildStaticQrPayload,
  getContentValuesForTypeChange,
  getDefaultStaticQrValues,
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
  createDefaultQraftyState,
  setDotMatrixAnimationOptions,
  type QrDotMatrixAnimationPatch,
} from "@/features/qr/model/state"
import { DEFAULT_QR_INPUT_TYPE, type QrInputType } from "@/features/qr/content/input-options"
import {
  DEFAULT_DESKTOP_ACCESSIBILITY_SETTINGS,
  DEFAULT_DESKTOP_BACKGROUND_SETTINGS,
  DEFAULT_DESKTOP_CORNERS_SETTINGS,
  DEFAULT_DESKTOP_EFFECTS_SETTINGS,
  DEFAULT_DESKTOP_ENCODING_SETTINGS,
  DEFAULT_DESKTOP_EXPORT_SETTINGS,
  DEFAULT_DESKTOP_IMAGE_SETTINGS,
  DEFAULT_LAYERS_SETTINGS,
  DEFAULT_DESKTOP_LAYOUT_SETTINGS,
  DEFAULT_DESKTOP_LOGO_SETTINGS,
  DEFAULT_DESKTOP_MOTION_SETTINGS,
  DEFAULT_DESKTOP_PATTERN_SETTINGS,
  DEFAULT_DESKTOP_SCENE_TEMPLATE_SETTINGS,
  DEFAULT_DESKTOP_SHAPE_SETTINGS,
  DEFAULT_DESKTOP_TEXT_SETTINGS,
} from "@/features/shell/model/toolbar-defaults"
import { TOOLBAR_TOOLS } from "@/features/shell/model/toolbar-tools"
import type {
  AccessibilitySettings,
  BackgroundInspectorTab,
  BackgroundSettings,
  CornersSettings,
  EffectsSettings,
  EncodingSettings,
  ExportSettings,
  ImageSettings,
  LayerRow,
  LayersSettings,
  LayoutSettings,
  LogoSettings,
  LogoSettingsPatch,
  MotionSettings,
  PatternSettings,
  PatternSettingsPatch,
  SceneTemplateSettings,
  ShapeSettings,
  TextSettings,
  ThemeMode,
  ToolbarController,
  ToolbarTool,
  ToolbarToolId,
} from "@/features/shell/model/toolbar-types"
import { getVisibleToolbarToolIds } from "@/features/canvas/model/workspace-editing-mode"
import type { SceneLayoutPreset } from "@/features/canvas/model/scene-templates"

export type InspectorModel = {
  controller?: ToolbarController
  actualActiveTool: ToolbarToolId | null
  actualTheme: ThemeMode
  activeToolConfig: ToolbarTool | undefined
  visibleToolbarTools: ToolbarTool[]
  actualContentType: QrInputType
  actualContentValues: StaticQrContentValues
  actualEncodedContentValue: string
  actualContentValidation: ReturnType<typeof validateStaticQrContent>
  actualPatternSettings: PatternSettings
  actualLogoSettings: LogoSettings
  actualCornersSettings: CornersSettings
  actualShapeSettings: ShapeSettings
  actualMotionSettings: MotionSettings
  actualEncodingSettings: EncodingSettings
  actualAccessibilitySettings: AccessibilitySettings
  actualImageSettings: ImageSettings
  actualBackgroundSettings: BackgroundSettings
  actualBackgroundInspectorTab: BackgroundInspectorTab
  actualEffectsSettings: EffectsSettings
  actualLayersSettings: LayersSettings
  actualExportSettings: ExportSettings
  actualLayoutSettings: LayoutSettings
  actualSceneTemplateSettings: SceneTemplateSettings
  actualTextSettings: TextSettings
  onActiveToolChange: (toolId: ToolbarToolId) => void
  onThemeChange: (theme: ThemeMode) => void
  onContentTypeChange: (type: QrInputType) => void
  onContentPasteApply: (type: QrInputType, values: StaticQrContentValues) => void
  onContentValueChange: (field: string, value: StaticQrContentValue) => void
  onPatternSettingsChange: (patch: PatternSettingsPatch) => void
  onUnifiedQrFillSettingsChange?: (
    patches: import("@/features/shell/inspector/settings-bridge").UnifiedQrFillPatches,
  ) => void
  onLogoSettingsChange: (patch: LogoSettingsPatch) => void
  onCornersSettingsChange: (patch: Partial<CornersSettings>) => void
  onShapeSettingsChange: (patch: Partial<ShapeSettings>) => void
  onMotionSettingsChange: (patch: QrDotMatrixAnimationPatch) => void
  onEncodingSettingsChange: (patch: Partial<EncodingSettings>) => void
  onAccessibilitySettingsChange: (patch: Partial<AccessibilitySettings>) => void
  onImageSettingsChange: (patch: Partial<ImageSettings>) => void
  onBackgroundSettingsChange: (settings: Partial<BackgroundSettings>) => void
  onBackgroundInspectorTabChange: (tab: BackgroundInspectorTab) => void
  onEffectsSettingsChange: (patch: Partial<EffectsSettings>) => void
  onLayersSettingsChange: (patch: Partial<LayersSettings>) => void
  onLayersReorder: (orderedIds: string[]) => void
  onExportSettingsChange: (patch: Partial<ExportSettings>) => void
  onLayoutSettingsChange: (patch: Partial<SceneLayoutPreset>) => void
  onSceneTemplateSizeChange: (patch: Partial<SceneTemplateSettings["sizeSettings"]>) => void
  onTextSettingsChange: (patch: Partial<TextSettings>) => void
}

/** `useState` + a merge-patch handler — the shared pattern for every
 * `*Settings` slice that has no controller override. */
function useSettingsSlice<T extends object>(defaults: T) {
  const [value, setValue] = useState<T>(defaults)
  const onChange = (patch: Partial<T>) =>
    setValue((current) => ({ ...current, ...patch }))
  return [value, onChange] as const
}

function useInspectorSettingsSlices() {
  const [patternSettings, onPatternPatch] = useSettingsSlice(DEFAULT_DESKTOP_PATTERN_SETTINGS)
  const [logoSettings, onLogoPatch] = useSettingsSlice(DEFAULT_DESKTOP_LOGO_SETTINGS)
  const [cornersSettings, onCornersPatch] = useSettingsSlice(DEFAULT_DESKTOP_CORNERS_SETTINGS)
  const [shapeSettings, onShapePatch] = useSettingsSlice(DEFAULT_DESKTOP_SHAPE_SETTINGS)
  const [motionSettings, setMotionSettings] = useState<MotionSettings>(
    DEFAULT_DESKTOP_MOTION_SETTINGS,
  )
  const [encodingSettings, onEncodingPatch] = useSettingsSlice(DEFAULT_DESKTOP_ENCODING_SETTINGS)
  const [accessibilitySettings, onAccessibilityPatch] = useSettingsSlice(DEFAULT_DESKTOP_ACCESSIBILITY_SETTINGS)
  const [imageSettings, onImagePatch] = useSettingsSlice(DEFAULT_DESKTOP_IMAGE_SETTINGS)
  const [backgroundInspectorTab, setBackgroundInspectorTab] =
    useState<BackgroundInspectorTab>("paper")
  const [backgroundSettings, onBackgroundPatch] = useSettingsSlice(DEFAULT_DESKTOP_BACKGROUND_SETTINGS)
  const [effectsSettings, onEffectsPatch] = useSettingsSlice(DEFAULT_DESKTOP_EFFECTS_SETTINGS)
  const [layersSettings, setLayersSettings] = useState<LayersSettings>(
    DEFAULT_LAYERS_SETTINGS,
  )
  const onLayersPatch = (patch: Partial<LayersSettings>) =>
    setLayersSettings((current) => ({ ...current, ...patch }))
  const handleLayersReorder = (orderedIds: string[]) =>
    setLayersSettings((current) => {
      const layerById = new Map(current.layers.map((layer) => [layer.id, layer]))

      return {
        ...current,
        layers: orderedIds
          .map((layerId) => layerById.get(layerId))
          .filter((layer): layer is LayerRow => layer != null),
      }
    })
  const [exportSettings, onExportPatch] = useSettingsSlice(DEFAULT_DESKTOP_EXPORT_SETTINGS)
  const [textSettings, onTextPatch] = useSettingsSlice(DEFAULT_DESKTOP_TEXT_SETTINGS)
  const onMotionPatch = (patch: QrDotMatrixAnimationPatch) =>
    setMotionSettings((current) =>
      setDotMatrixAnimationOptions(
        { ...createDefaultQraftyState(), dotMatrixAnimation: current },
        patch,
      ).dotMatrixAnimation,
    )

  return {
    accessibilitySettings,
    backgroundInspectorTab,
    backgroundSettings,
    cornersSettings,
    effectsSettings,
    encodingSettings,
    exportSettings,
    imageSettings,
    layersSettings,
    logoSettings,
    motionSettings,
    onAccessibilityPatch,
    onBackgroundPatch,
    onCornersPatch,
    onEffectsPatch,
    onEncodingPatch,
    onExportPatch,
    onImagePatch,
    onLayersPatch,
    handleLayersReorder,
    onLogoPatch,
    onMotionPatch,
    onPatternPatch,
    onShapePatch,
    onTextPatch,
    patternSettings,
    setBackgroundInspectorTab,
    shapeSettings,
    textSettings,
  }
}

function useContentState() {
  const [selectedContentType, setSelectedContentType] =
    useState<QrInputType>(DEFAULT_QR_INPUT_TYPE)
  const [contentValuesByType, setContentValuesByType] = useState<
    Partial<Record<QrInputType, StaticQrContentValues>>
  >(() => ({
    [DEFAULT_QR_INPUT_TYPE]: getDefaultStaticQrValues(DEFAULT_QR_INPUT_TYPE),
  }))
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

  function handleContentTypeChange(type: QrInputType) {
    setSelectedContentType(type)
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

  function handleContentPasteApply(type: QrInputType, values: StaticQrContentValues) {
    setSelectedContentType(type)
    setContentValuesByType((current) => ({
      ...current,
      [type]: values,
    }))
  }

  function handleContentValueChange(field: string, value: StaticQrContentValue) {
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

  return {
    handleContentPasteApply,
    handleContentTypeChange,
    handleContentValueChange,
    selectedContentType,
    selectedContentValidation,
    selectedContentValue,
    selectedContentValues,
  }
}

export function useToolbarInspectorModel({
  controller,
  theme,
  onThemeChange,
}: {
  controller?: ToolbarController
  theme?: ThemeMode
  onThemeChange?: (theme: ThemeMode) => void
} = {}): InspectorModel {
  const [activeTool, setActiveTool] = useState<ToolbarToolId | null>("content")
  const [internalTheme, setInternalTheme] = useState<ThemeMode>("dark")
  const slices = useInspectorSettingsSlices()
  const {
    handleContentPasteApply,
    handleContentTypeChange,
    handleContentValueChange,
    selectedContentType,
    selectedContentValidation,
    selectedContentValue,
    selectedContentValues,
  } = useContentState()

  const actualActiveTool =
    controller && "activeTool" in controller ? controller.activeTool : activeTool
  const actualTheme = theme ?? internalTheme
  const visibleToolbarToolIds = getVisibleToolbarToolIds()
  const visibleToolbarTools = TOOLBAR_TOOLS.filter((tool) =>
    visibleToolbarToolIds.includes(tool.id),
  )
  const activeToolConfig = visibleToolbarTools.find((tool) => tool.id === actualActiveTool)

  const valueFields = [
    ["actualContentType", "contentType", selectedContentType],
    ["actualContentValues", "contentValues", selectedContentValues],
    ["actualEncodedContentValue", "encodedContentValue", selectedContentValue],
    ["actualContentValidation", "contentValidation", selectedContentValidation],
    ["actualPatternSettings", "patternSettings", slices.patternSettings],
    ["actualLogoSettings", "logoSettings", slices.logoSettings],
    ["actualCornersSettings", "cornersSettings", slices.cornersSettings],
    ["actualShapeSettings", "shapeSettings", slices.shapeSettings],
    ["actualMotionSettings", "motionSettings", slices.motionSettings],
    ["actualEncodingSettings", "encodingSettings", slices.encodingSettings],
    ["actualAccessibilitySettings", "accessibilitySettings", slices.accessibilitySettings],
    ["actualImageSettings", "imageSettings", slices.imageSettings],
    ["actualBackgroundSettings", "backgroundSettings", slices.backgroundSettings],
    ["actualBackgroundInspectorTab", "backgroundInspectorTab", slices.backgroundInspectorTab],
    ["actualEffectsSettings", "effectsSettings", slices.effectsSettings],
    ["actualLayersSettings", "layersSettings", slices.layersSettings],
    ["actualExportSettings", "exportSettings", slices.exportSettings],
    ["actualLayoutSettings", "layoutSettings", DEFAULT_DESKTOP_LAYOUT_SETTINGS],
    ["actualSceneTemplateSettings", "sceneTemplateSettings", DEFAULT_DESKTOP_SCENE_TEMPLATE_SETTINGS],
    ["actualTextSettings", "textSettings", slices.textSettings],
  ] as const
  const handlerFields = [
    ["onActiveToolChange", "onActiveToolChange", setActiveTool],
    ["onContentTypeChange", "onContentTypeChange", handleContentTypeChange],
    ["onContentPasteApply", "onContentPasteApply", handleContentPasteApply],
    ["onContentValueChange", "onContentValueChange", handleContentValueChange],
    ["onPatternSettingsChange", "onPatternSettingsChange", slices.onPatternPatch],
    ["onLogoSettingsChange", "onLogoSettingsChange", slices.onLogoPatch],
    ["onCornersSettingsChange", "onCornersSettingsChange", slices.onCornersPatch],
    ["onShapeSettingsChange", "onShapeSettingsChange", slices.onShapePatch],
    ["onMotionSettingsChange", "onMotionSettingsChange", slices.onMotionPatch],
    ["onEncodingSettingsChange", "onEncodingSettingsChange", slices.onEncodingPatch],
    ["onAccessibilitySettingsChange", "onAccessibilitySettingsChange", slices.onAccessibilityPatch],
    ["onImageSettingsChange", "onImageSettingsChange", slices.onImagePatch],
    ["onBackgroundSettingsChange", "onBackgroundSettingsChange", slices.onBackgroundPatch],
    ["onBackgroundInspectorTabChange", "onBackgroundInspectorTabChange", slices.setBackgroundInspectorTab],
    ["onEffectsSettingsChange", "onEffectsSettingsChange", slices.onEffectsPatch],
    ["onLayersSettingsChange", "onLayersSettingsChange", slices.onLayersPatch],
    ["onLayersReorder", "onLayersReorder", slices.handleLayersReorder],
    ["onExportSettingsChange", "onExportSettingsChange", slices.onExportPatch],
    ["onLayoutSettingsChange", "onLayoutSettingsChange", () => undefined],
    ["onSceneTemplateSizeChange", "onSceneTemplateSizeChange", () => undefined],
    ["onTextSettingsChange", "onTextSettingsChange", slices.onTextPatch],
  ] as const

  const overrideFields = <Entries extends readonly (readonly [string, keyof ToolbarController, unknown])[]>(
    entries: Entries,
  ) =>
    Object.fromEntries(
      entries.map(([modelKey, controllerKey, fallback]) => [
        modelKey,
        controller?.[controllerKey] ?? fallback,
      ]),
    ) as {
      [K in Entries[number][0] & keyof InspectorModel]: InspectorModel[K]
    }

  return {
    controller,
    actualActiveTool,
    actualTheme,
    activeToolConfig,
    visibleToolbarTools,
    ...overrideFields(valueFields),
    onThemeChange: onThemeChange ?? setInternalTheme,
    onUnifiedQrFillSettingsChange: controller?.onUnifiedQrFillSettingsChange,
    ...overrideFields(handlerFields),
  }
}
