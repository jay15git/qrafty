import { vi } from "vitest"

import {
  DEFAULT_DESKTOP_EXPORT_SETTINGS,
  DEFAULT_DESKTOP_LAYERS_SETTINGS,
  DEFAULT_DESKTOP_PATTERN_SETTINGS,
} from "@/features/shell/model/desktop-toolbar-defaults"
import type { DesktopToolbarController } from "@/features/shell/model/desktop-toolbar-types"
import { createDraftingTextLayer } from "@/features/canvas/model/layers"

/**
 * Builds a complete `DesktopToolbarController` for tests. Every field is filled
 * with a harmless default so a test only has to supply the parts it exercises.
 */
export function createDesktopToolbarController(
  overrides: Partial<DesktopToolbarController> = {},
  nodeId = "preview",
): DesktopToolbarController {
  const layer = createDraftingTextLayer(nodeId, { text: "Hello" })
  return {
    activeTool: "content",
    contentType: "link",
    contentValues: {},
    contentValidation: { fieldErrors: {}, isValid: true },
    encodedContentValue: "",
    patternSettings: DEFAULT_DESKTOP_PATTERN_SETTINGS,
    logoSettings: {} as DesktopToolbarController["logoSettings"],
    cornersSettings: {} as DesktopToolbarController["cornersSettings"],
    shapeSettings: {} as DesktopToolbarController["shapeSettings"],
    motionSettings: {} as DesktopToolbarController["motionSettings"],
    encodingSettings: {} as DesktopToolbarController["encodingSettings"],
    accessibilitySettings: {} as DesktopToolbarController["accessibilitySettings"],
    imageSettings: {} as DesktopToolbarController["imageSettings"],
    backgroundSettings: {} as DesktopToolbarController["backgroundSettings"],
    effectsSettings: {} as DesktopToolbarController["effectsSettings"],
    layersSettings: DEFAULT_DESKTOP_LAYERS_SETTINGS,
    exportSettings: DEFAULT_DESKTOP_EXPORT_SETTINGS,
    layoutSettings: {} as DesktopToolbarController["layoutSettings"],
    sceneTemplateSettings: {} as DesktopToolbarController["sceneTemplateSettings"],
    textSettings: {} as DesktopToolbarController["textSettings"],
    selectedElementLayer: layer,
    selectedLayerIds: [layer.id],
    onActiveToolChange: vi.fn(),
    onContentReset: vi.fn(),
    onContentTypeChange: vi.fn(),
    onContentPasteApply: vi.fn(),
    onContentValueChange: vi.fn(),
    onPatternReset: vi.fn(),
    onPatternSettingsChange: vi.fn(),
    onLogoReset: vi.fn(),
    onLogoSettingsChange: vi.fn(),
    onCornersReset: vi.fn(),
    onCornersSettingsChange: vi.fn(),
    onShapeReset: vi.fn(),
    onShapeSettingsChange: vi.fn(),
    onMotionReset: vi.fn(),
    onMotionSettingsChange: vi.fn(),
    onEncodingReset: vi.fn(),
    onEncodingSettingsChange: vi.fn(),
    onAccessibilityReset: vi.fn(),
    onAccessibilitySettingsChange: vi.fn(),
    onImageReset: vi.fn(),
    onImageSettingsChange: vi.fn(),
    onBackgroundReset: vi.fn(),
    onBackgroundSettingsChange: vi.fn(),
    onEffectsReset: vi.fn(),
    onEffectsSettingsChange: vi.fn(),
    onLayersReset: vi.fn(),
    onLayersSettingsChange: vi.fn(),
    onExportReset: vi.fn(),
    onExportSettingsChange: vi.fn(),
    onExportDownload: vi.fn(),
    onTextReset: vi.fn(),
    onTextSettingsChange: vi.fn(),
    onElementLayerPatch: vi.fn(),
    canCopyLayers: true,
    onLayerCopy: vi.fn(),
    onLayerMenuAction: vi.fn(),
    canDeleteLayer: () => true,
    ...overrides,
  }
}
