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
} from "@/features/qr-code/content/static-payload"
import {
  getPlatformDefaultValuesForIntent,
  isPlatformType,
} from "@/features/qr-code/content/platform-intents"
import {
  createDefaultQrStudioState,
  setDotMatrixAnimationOptions,
  type QrDotMatrixAnimationPatch,
} from "@/features/qr-code/model/state"
import { DEFAULT_QR_INPUT_TYPE, type QrInputType } from "@/features/qr-code/content/input-options"
import {
  DEFAULT_DESKTOP_ACCESSIBILITY_SETTINGS,
  DEFAULT_DESKTOP_BACKGROUND_SETTINGS,
  DEFAULT_DESKTOP_CORNERS_SETTINGS,
  DEFAULT_DESKTOP_EFFECTS_SETTINGS,
  DEFAULT_DESKTOP_ENCODING_SETTINGS,
  DEFAULT_DESKTOP_EXPORT_SETTINGS,
  DEFAULT_DESKTOP_IMAGE_SETTINGS,
  DEFAULT_DESKTOP_LAYERS_SETTINGS,
  DEFAULT_DESKTOP_LOGO_SETTINGS,
  DEFAULT_DESKTOP_MOTION_SETTINGS,
  DEFAULT_DESKTOP_PATTERN_SETTINGS,
  DEFAULT_DESKTOP_SHAPE_SETTINGS,
  DEFAULT_DESKTOP_TEXT_SETTINGS,
} from "@/features/desktop-shell/model/desktop-toolbar-defaults"
import { DESKTOP_TOOLBAR_TOOLS } from "@/features/desktop-shell/model/desktop-toolbar-tools"
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
  DesktopSceneTemplateSettings,
  DesktopShapeSettings,
  DesktopTextSettings,
  DesktopThemeMode,
  DesktopToolbarController,
  DesktopToolbarTool,
  DesktopToolbarToolId,
} from "@/features/desktop-shell/model/desktop-toolbar-types"
import { getVisibleToolbarToolIds } from "@/features/workspace/model/workspace-editing-mode"
import type { SceneLayoutPreset } from "@/features/workspace/model/scene-templates"

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
  onPatternSettingsChange: (patch: Partial<DesktopPatternSettings>) => void
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
  const [patternSettings, setPatternSettings] = useState<DesktopPatternSettings>(
    DEFAULT_DESKTOP_PATTERN_SETTINGS,
  )
  const [logoSettings, setLogoSettings] = useState<DesktopLogoSettings>(
    DEFAULT_DESKTOP_LOGO_SETTINGS,
  )
  const [cornersSettings, setCornersSettings] = useState<DesktopCornersSettings>(
    DEFAULT_DESKTOP_CORNERS_SETTINGS,
  )
  const [shapeSettings, setShapeSettings] = useState<DesktopShapeSettings>(
    DEFAULT_DESKTOP_SHAPE_SETTINGS,
  )
  const [motionSettings, setMotionSettings] = useState<DesktopMotionSettings>(
    DEFAULT_DESKTOP_MOTION_SETTINGS,
  )
  const [encodingSettings, setEncodingSettings] = useState<DesktopEncodingSettings>(
    DEFAULT_DESKTOP_ENCODING_SETTINGS,
  )
  const [accessibilitySettings, setAccessibilitySettings] = useState<DesktopAccessibilitySettings>(
    DEFAULT_DESKTOP_ACCESSIBILITY_SETTINGS,
  )
  const [imageSettings, setImageSettings] = useState<DesktopImageSettings>(
    DEFAULT_DESKTOP_IMAGE_SETTINGS,
  )
  const [backgroundInspectorTab, setBackgroundInspectorTab] =
    useState<DesktopBackgroundInspectorTab>("paper")
  const [backgroundSettings, setBackgroundSettings] = useState<DesktopBackgroundSettings>(
    DEFAULT_DESKTOP_BACKGROUND_SETTINGS,
  )
  const [effectsSettings, setEffectsSettings] = useState<DesktopEffectsSettings>(
    DEFAULT_DESKTOP_EFFECTS_SETTINGS,
  )
  const [layersSettings, setLayersSettings] = useState<DesktopLayersSettings>(
    DEFAULT_DESKTOP_LAYERS_SETTINGS,
  )
  const [exportSettings, setExportSettings] = useState<DesktopExportSettings>(
    DEFAULT_DESKTOP_EXPORT_SETTINGS,
  )
  const [textSettings, setTextSettings] = useState<DesktopTextSettings>(
    DEFAULT_DESKTOP_TEXT_SETTINGS,
  )
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

  const actualActiveTool =
    controller && "activeTool" in controller ? controller.activeTool : activeTool
  const actualDesktopTheme = theme ?? desktopTheme
  const visibleToolbarToolIds = getVisibleToolbarToolIds()
  const visibleToolbarTools = DESKTOP_TOOLBAR_TOOLS.filter((tool) =>
    visibleToolbarToolIds.includes(tool.id),
  )
  const activeToolConfig = visibleToolbarTools.find((tool) => tool.id === actualActiveTool)

  return {
    controller,
    actualActiveTool,
    actualDesktopTheme,
    activeToolConfig,
    visibleToolbarTools,
    actualContentType: controller?.contentType ?? selectedContentType,
    actualContentValues: controller?.contentValues ?? selectedContentValues,
    actualEncodedContentValue: controller?.encodedContentValue ?? selectedContentValue,
    actualContentValidation: controller?.contentValidation ?? selectedContentValidation,
    actualPatternSettings: controller?.patternSettings ?? patternSettings,
    actualLogoSettings: controller?.logoSettings ?? logoSettings,
    actualCornersSettings: controller?.cornersSettings ?? cornersSettings,
    actualShapeSettings: controller?.shapeSettings ?? shapeSettings,
    actualMotionSettings: controller?.motionSettings ?? motionSettings,
    actualEncodingSettings: controller?.encodingSettings ?? encodingSettings,
    actualAccessibilitySettings: controller?.accessibilitySettings ?? accessibilitySettings,
    actualImageSettings: controller?.imageSettings ?? imageSettings,
    actualBackgroundSettings: controller?.backgroundSettings ?? backgroundSettings,
    actualBackgroundInspectorTab: controller?.backgroundInspectorTab ?? backgroundInspectorTab,
    actualEffectsSettings: controller?.effectsSettings ?? effectsSettings,
    actualLayersSettings: controller?.layersSettings ?? layersSettings,
    actualExportSettings: controller?.exportSettings ?? exportSettings,
    actualLayoutSettings: controller?.layoutSettings ?? { layout: { id: "flat", label: "Flat", rotation: 0, tiltX: 0, tiltY: 0, zoom: 1 } },
    actualSceneTemplateSettings: controller?.sceneTemplateSettings ?? {
      sizeSettings: {
        cardHeight: 810,
        cardWidth: 1080,
        lockAspectRatio: true,
        sizeMode: "fixed",
        sizePresetId: "ratio-4-3",
      },
    },
    actualTextSettings: controller?.textSettings ?? textSettings,
    onActiveToolChange: controller?.onActiveToolChange ?? setActiveTool,
    onDesktopThemeChange:
      onThemeChange ??
      ((nextTheme: DesktopThemeMode) => {
        setDesktopTheme(nextTheme)
      }),
    onContentTypeChange: controller?.onContentTypeChange ?? handleContentTypeChange,
    onContentPasteApply: controller?.onContentPasteApply ?? handleContentPasteApply,
    onContentValueChange: controller?.onContentValueChange ?? handleContentValueChange,
    onPatternSettingsChange:
      controller?.onPatternSettingsChange ??
      ((patch: Partial<DesktopPatternSettings>) =>
        setPatternSettings((current) => ({ ...current, ...patch }))),
    onLogoSettingsChange:
      controller?.onLogoSettingsChange ??
      ((patch: DesktopLogoSettingsPatch) =>
        setLogoSettings((current) => ({ ...current, ...patch }))),
    onCornersSettingsChange:
      controller?.onCornersSettingsChange ??
      ((patch: Partial<DesktopCornersSettings>) =>
        setCornersSettings((current) => ({ ...current, ...patch }))),
    onShapeSettingsChange:
      controller?.onShapeSettingsChange ??
      ((patch: Partial<DesktopShapeSettings>) =>
        setShapeSettings((current) => ({ ...current, ...patch }))),
    onMotionSettingsChange:
      controller?.onMotionSettingsChange ??
      ((patch: QrDotMatrixAnimationPatch) =>
        setMotionSettings((current) =>
          setDotMatrixAnimationOptions(
            { ...createDefaultQrStudioState(), dotMatrixAnimation: current },
            patch,
          ).dotMatrixAnimation,
        )),
    onEncodingSettingsChange:
      controller?.onEncodingSettingsChange ??
      ((patch: Partial<DesktopEncodingSettings>) =>
        setEncodingSettings((current) => ({ ...current, ...patch }))),
    onAccessibilitySettingsChange:
      controller?.onAccessibilitySettingsChange ??
      ((patch: Partial<DesktopAccessibilitySettings>) =>
        setAccessibilitySettings((current) => ({ ...current, ...patch }))),
    onImageSettingsChange:
      controller?.onImageSettingsChange ??
      ((patch: Partial<DesktopImageSettings>) =>
        setImageSettings((current) => ({ ...current, ...patch }))),
    onBackgroundSettingsChange:
      controller?.onBackgroundSettingsChange ??
      ((settings: Partial<DesktopBackgroundSettings>) =>
        setBackgroundSettings((current) => ({ ...current, ...settings }))),
    onBackgroundInspectorTabChange:
      controller?.onBackgroundInspectorTabChange ?? setBackgroundInspectorTab,
    onEffectsSettingsChange:
      controller?.onEffectsSettingsChange ??
      ((patch: Partial<DesktopEffectsSettings>) =>
        setEffectsSettings((current) => ({ ...current, ...patch }))),
    onLayersSettingsChange:
      controller?.onLayersSettingsChange ??
      ((patch: Partial<DesktopLayersSettings>) =>
        setLayersSettings((current) => ({ ...current, ...patch }))),
    onLayersReorder:
      controller?.onLayersReorder ??
      ((orderedIds: string[]) =>
        setLayersSettings((current) => {
          const layerById = new Map(current.layers.map((layer) => [layer.id, layer]))

          return {
            ...current,
            layers: orderedIds
              .map((layerId) => layerById.get(layerId))
              .filter((layer): layer is DesktopLayerRow => layer != null),
          }
        })),
    onExportSettingsChange:
      controller?.onExportSettingsChange ??
      ((patch: Partial<DesktopExportSettings>) =>
        setExportSettings((current) => ({ ...current, ...patch }))),
    onLayoutSettingsChange:
      controller?.onLayoutSettingsChange ?? (() => undefined),
    onSceneTemplateSizeChange:
      controller?.onSceneTemplateSizeChange ?? (() => undefined),
    onTextSettingsChange:
      controller?.onTextSettingsChange ??
      ((patch: Partial<DesktopTextSettings>) =>
        setTextSettings((current) => ({ ...current, ...patch }))),
  }
}
