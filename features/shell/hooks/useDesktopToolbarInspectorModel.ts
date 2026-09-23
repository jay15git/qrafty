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
  DEFAULT_DESKTOP_LAYERS_SETTINGS,
  DEFAULT_DESKTOP_LAYOUT_SETTINGS,
  DEFAULT_DESKTOP_LOGO_SETTINGS,
  DEFAULT_DESKTOP_MOTION_SETTINGS,
  DEFAULT_DESKTOP_PATTERN_SETTINGS,
  DEFAULT_DESKTOP_SCENE_TEMPLATE_SETTINGS,
  DEFAULT_DESKTOP_SHAPE_SETTINGS,
  DEFAULT_DESKTOP_TEXT_SETTINGS,
} from "@/features/shell/model/desktop-toolbar-defaults"
import { DESKTOP_TOOLBAR_TOOLS } from "@/features/shell/model/desktop-toolbar-tools"
import type {
  DesktopAccessibilitySettings,
  DesktopBackgroundInspectorTab,
  DesktopBackgroundSettings,
  DesktopCornersSettings,
  DesktopEffectsSettings,
  DesktopEncodingSettings,
  DesktopExportSettings,
  DesktopImageSettings,
  DesktopLayerRow,
  DesktopLayersSettings,
  DesktopLayoutSettings,
  DesktopLogoSettings,
  DesktopLogoSettingsPatch,
  DesktopMotionSettings,
  DesktopPatternSettings,
  DesktopPatternSettingsPatch,
  DesktopSceneTemplateSettings,
  DesktopShapeSettings,
  DesktopTextSettings,
  DesktopThemeMode,
  DesktopToolbarController,
  DesktopToolbarTool,
  DesktopToolbarToolId,
} from "@/features/shell/model/desktop-toolbar-types"
import { getVisibleToolbarToolIds } from "@/features/canvas/model/workspace-editing-mode"
import type { SceneLayoutPreset } from "@/features/canvas/model/scene-templates"

export type DesktopInspectorModel = {
  controller?: DesktopToolbarController
  actualActiveTool: DesktopToolbarToolId | null
  actualDesktopTheme: DesktopThemeMode
  activeToolConfig: DesktopToolbarTool | undefined
  visibleToolbarTools: DesktopToolbarTool[]
  actualContentType: QrInputType
  actualContentValues: StaticQrContentValues
  actualEncodedContentValue: string
  actualContentValidation: ReturnType<typeof validateStaticQrContent>
  actualPatternSettings: DesktopPatternSettings
  actualLogoSettings: DesktopLogoSettings
  actualCornersSettings: DesktopCornersSettings
  actualShapeSettings: DesktopShapeSettings
  actualMotionSettings: DesktopMotionSettings
  actualEncodingSettings: DesktopEncodingSettings
  actualAccessibilitySettings: DesktopAccessibilitySettings
  actualImageSettings: DesktopImageSettings
  actualBackgroundSettings: DesktopBackgroundSettings
  actualBackgroundInspectorTab: DesktopBackgroundInspectorTab
  actualEffectsSettings: DesktopEffectsSettings
  actualLayersSettings: DesktopLayersSettings
  actualExportSettings: DesktopExportSettings
  actualLayoutSettings: DesktopLayoutSettings
  actualSceneTemplateSettings: DesktopSceneTemplateSettings
  actualTextSettings: DesktopTextSettings
  onActiveToolChange: (toolId: DesktopToolbarToolId) => void
  onDesktopThemeChange: (theme: DesktopThemeMode) => void
  onContentTypeChange: (type: QrInputType) => void
  onContentPasteApply: (type: QrInputType, values: StaticQrContentValues) => void
  onContentValueChange: (field: string, value: StaticQrContentValue) => void
  onPatternSettingsChange: (patch: DesktopPatternSettingsPatch) => void
  onUnifiedQrFillSettingsChange?: (
    patches: import("@/features/shell/inspector/settings-bridge").UnifiedQrFillPatches,
  ) => void
  onLogoSettingsChange: (patch: DesktopLogoSettingsPatch) => void
  onCornersSettingsChange: (patch: Partial<DesktopCornersSettings>) => void
  onShapeSettingsChange: (patch: Partial<DesktopShapeSettings>) => void
  onMotionSettingsChange: (patch: QrDotMatrixAnimationPatch) => void
  onEncodingSettingsChange: (patch: Partial<DesktopEncodingSettings>) => void
  onAccessibilitySettingsChange: (patch: Partial<DesktopAccessibilitySettings>) => void
  onImageSettingsChange: (patch: Partial<DesktopImageSettings>) => void
  onBackgroundSettingsChange: (settings: Partial<DesktopBackgroundSettings>) => void
  onBackgroundInspectorTabChange: (tab: DesktopBackgroundInspectorTab) => void
  onEffectsSettingsChange: (patch: Partial<DesktopEffectsSettings>) => void
  onLayersSettingsChange: (patch: Partial<DesktopLayersSettings>) => void
  onLayersReorder: (orderedIds: string[]) => void
  onExportSettingsChange: (patch: Partial<DesktopExportSettings>) => void
  onLayoutSettingsChange: (patch: Partial<SceneLayoutPreset>) => void
  onSceneTemplateSizeChange: (patch: Partial<DesktopSceneTemplateSettings["sizeSettings"]>) => void
  onTextSettingsChange: (patch: Partial<DesktopTextSettings>) => void
}

/** `useState` + a merge-patch handler — the shared pattern for every
 * `Desktop*Settings` slice that has no controller override. */
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
  const [motionSettings, setMotionSettings] = useState<DesktopMotionSettings>(
    DEFAULT_DESKTOP_MOTION_SETTINGS,
  )
  const [encodingSettings, onEncodingPatch] = useSettingsSlice(DEFAULT_DESKTOP_ENCODING_SETTINGS)
  const [accessibilitySettings, onAccessibilityPatch] = useSettingsSlice(DEFAULT_DESKTOP_ACCESSIBILITY_SETTINGS)
  const [imageSettings, onImagePatch] = useSettingsSlice(DEFAULT_DESKTOP_IMAGE_SETTINGS)
  const [backgroundInspectorTab, setBackgroundInspectorTab] =
    useState<DesktopBackgroundInspectorTab>("paper")
  const [backgroundSettings, onBackgroundPatch] = useSettingsSlice(DEFAULT_DESKTOP_BACKGROUND_SETTINGS)
  const [effectsSettings, onEffectsPatch] = useSettingsSlice(DEFAULT_DESKTOP_EFFECTS_SETTINGS)
  const [layersSettings, setLayersSettings] = useState<DesktopLayersSettings>(
    DEFAULT_DESKTOP_LAYERS_SETTINGS,
  )
  const onLayersPatch = (patch: Partial<DesktopLayersSettings>) =>
    setLayersSettings((current) => ({ ...current, ...patch }))
  const handleLayersReorder = (orderedIds: string[]) =>
    setLayersSettings((current) => {
      const layerById = new Map(current.layers.map((layer) => [layer.id, layer]))

      return {
        ...current,
        layers: orderedIds
          .map((layerId) => layerById.get(layerId))
          .filter((layer): layer is DesktopLayerRow => layer != null),
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

export function useDesktopToolbarInspectorModel({
  controller,
  theme,
  onThemeChange,
}: {
  controller?: DesktopToolbarController
  theme?: DesktopThemeMode
  onThemeChange?: (theme: DesktopThemeMode) => void
} = {}): DesktopInspectorModel {
  const [activeTool, setActiveTool] = useState<DesktopToolbarToolId | null>("content")
  const [desktopTheme, setDesktopTheme] = useState<DesktopThemeMode>("dark")
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
  const actualDesktopTheme = theme ?? desktopTheme
  const visibleToolbarToolIds = getVisibleToolbarToolIds()
  const visibleToolbarTools = DESKTOP_TOOLBAR_TOOLS.filter((tool) =>
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

  const overrideFields = <Entries extends readonly (readonly [string, keyof DesktopToolbarController, unknown])[]>(
    entries: Entries,
  ) =>
    Object.fromEntries(
      entries.map(([modelKey, controllerKey, fallback]) => [
        modelKey,
        controller?.[controllerKey] ?? fallback,
      ]),
    ) as {
      [K in Entries[number][0] & keyof DesktopInspectorModel]: DesktopInspectorModel[K]
    }

  return {
    controller,
    actualActiveTool,
    actualDesktopTheme,
    activeToolConfig,
    visibleToolbarTools,
    ...overrideFields(valueFields),
    onDesktopThemeChange: onThemeChange ?? setDesktopTheme,
    onUnifiedQrFillSettingsChange: controller?.onUnifiedQrFillSettingsChange,
    ...overrideFields(handlerFields),
  }
}
