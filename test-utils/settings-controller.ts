import { useState } from "react";
import { vi } from "vitest";

import {
  DEFAULT_DESKTOP_BACKGROUND_SETTINGS,
  DEFAULT_DESKTOP_CORNERS_SETTINGS,
  DEFAULT_DESKTOP_ENCODING_SETTINGS,
  DEFAULT_DESKTOP_EXPORT_SETTINGS,
  DEFAULT_DESKTOP_IMAGE_SETTINGS,
  DEFAULT_LAYERS_SETTINGS,
  DEFAULT_DESKTOP_LOGO_SETTINGS,
  DEFAULT_DESKTOP_MOTION_SETTINGS,
  DEFAULT_DESKTOP_PATTERN_SETTINGS,
  DEFAULT_DESKTOP_SCENE_TEMPLATE_SETTINGS,
  DEFAULT_DESKTOP_SHAPE_SETTINGS,
} from "@/features/shell/model/settings-defaults";
import type { SettingsController } from "@/features/shell/model/settings-model";
import { createCanvasTextLayer } from "@/features/canvas/model/layers/factories";

/**
 * Builds a complete `SettingsController` for tests. Every field is filled
 * with the same default the settings falls back to, so a test only has to
 * supply the parts it exercises.
 */
export function createSettingsController(
  overrides: Partial<SettingsController> = {},
  nodeId = "preview",
): SettingsController {
  const layer = createCanvasTextLayer(nodeId, { text: "Hello" });
  return {
    activeTool: "content",
    contentType: "link",
    contentValues: {},
    contentValidation: { fieldErrors: {}, isValid: true },
    patternSettings: DEFAULT_DESKTOP_PATTERN_SETTINGS,
    logoSettings: DEFAULT_DESKTOP_LOGO_SETTINGS,
    cornersSettings: DEFAULT_DESKTOP_CORNERS_SETTINGS,
    shapeSettings: DEFAULT_DESKTOP_SHAPE_SETTINGS,
    motionSettings: DEFAULT_DESKTOP_MOTION_SETTINGS,
    encodingSettings: DEFAULT_DESKTOP_ENCODING_SETTINGS,
    imageSettings: DEFAULT_DESKTOP_IMAGE_SETTINGS,
    backgroundSettings: DEFAULT_DESKTOP_BACKGROUND_SETTINGS,
    layersSettings: DEFAULT_LAYERS_SETTINGS,
    exportSettings: DEFAULT_DESKTOP_EXPORT_SETTINGS,
    canvasSizeSettings: DEFAULT_DESKTOP_SCENE_TEMPLATE_SETTINGS,
    selectedElementLayer: layer,
    selectedLayerIds: [layer.id],
    onActiveToolChange: vi.fn(),
    onContentTypeChange: vi.fn(),
    onContentPasteApply: vi.fn(),
    onContentValueChange: vi.fn(),
    onPatternSettingsChange: vi.fn(),
    onLogoSettingsChange: vi.fn(),
    onCornersSettingsChange: vi.fn(),
    onShapeSettingsChange: vi.fn(),
    onMotionSettingsChange: vi.fn(),
    onEncodingSettingsChange: vi.fn(),
    onImageSettingsChange: vi.fn(),
    onBackgroundSettingsChange: vi.fn(),
    onLayersSettingsChange: vi.fn(),
    onExportSettingsChange: vi.fn(),
    onExportDownload: vi.fn(),
    onElementLayerPatch: vi.fn(),
    canCopyLayers: true,
    onLayerCopy: vi.fn(),
    onLayerMenuAction: vi.fn(),
    canDeleteLayer: () => true,
    ...overrides,
  };
}

/** Settings keys whose `on*Change` handler applies a partial patch. */
const PATCHED_KEYS = {
  onPatternSettingsChange: "patternSettings",
  onLogoSettingsChange: "logoSettings",
  onCornersSettingsChange: "cornersSettings",
  onShapeSettingsChange: "shapeSettings",
  onMotionSettingsChange: "motionSettings",
  onEncodingSettingsChange: "encodingSettings",
  onImageSettingsChange: "imageSettings",
  onBackgroundSettingsChange: "backgroundSettings",
  onLayersSettingsChange: "layersSettings",
  onExportSettingsChange: "exportSettings",
} as const;

type ControllerStateKey = keyof Omit<
  SettingsController,
  | `on${string}`
  | "canRedo"
  | "canUndo"
  | "canAddQrCode"
  | "canCopyLayers"
  | "canDeleteLayer"
  | "canExportDownload"
  | "canExportVideo"
  | "contentValidation"
  | "exportInProgress"
  | "exportProgressLabel"
  | "exportProgressRatio"
  | "exportDownloadError"
  | "scanSafetyResult"
  | "insertNodeId"
  | "composeSidebarPanel"
  | "selectedElementLayer"
  | "selectedLayerIds"
  | "selectedTransformLayer"
  | "selectedAppearanceLayer"
  | "appearanceSnapshot"
>;

/**
 * Stateful variant of `createSettingsController` for mounted-component tests:
 * `on*Change` handlers merge their patch into live state so pressed/selected
 * UI reflects the applied value. Non-function overrides stay controlled — if
 * the caller passes `activeTool`, that value wins every render.
 */
export function useStatefulSettingsController(
  overrides: Partial<SettingsController> = {},
): SettingsController {
  // `internal` seeds from the initial overrides once; afterwards it only
  // changes through the wrapped `on*` handlers.
  const [internal, setInternal] = useState<Partial<SettingsController>>(() =>
    createSettingsController(overrides),
  );
  // Non-function overrides are controlled props: their current-render value
  // wins over internal state.
  const controlled = Object.fromEntries(
    Object.entries(overrides).filter(([, value]) => typeof value !== "function"),
  ) as Partial<SettingsController>;
  const controller = { ...internal, ...controlled } as SettingsController;

  const sync = (key: ControllerStateKey, value: unknown) => {
    setInternal((current) => ({
      ...current,
      [key]: PATCHED_VALUE_KEYS.has(key)
        ? { ...((controlled[key] ?? current[key]) as object), ...(value as object) }
        : value,
    }));
  };

  for (const [handler, key] of Object.entries(PATCHED_KEYS)) {
    const name = handler as keyof typeof PATCHED_KEYS;
    controller[name] = ((patch: unknown) => {
      (overrides[name] as ((p: unknown) => void) | undefined)?.(patch);
      sync(key as ControllerStateKey, patch);
    }) as never;
  }

  controller.onActiveToolChange = (toolId) => {
    overrides.onActiveToolChange?.(toolId);
    sync("activeTool", toolId);
  };
  controller.onContentTypeChange = (type) => {
    overrides.onContentTypeChange?.(type);
    sync("contentType", type);
  };
  controller.onContentValueChange = (field, value) => {
    overrides.onContentValueChange?.(field, value);
    setInternal((current) => ({
      ...current,
      contentValues: { ...(current.contentValues ?? {}), [field]: value },
    }));
  };
  controller.onContentPasteApply = (type, values) => {
    overrides.onContentPasteApply?.(type, values);
    setInternal((current) => ({ ...current, contentType: type, contentValues: values }));
  };
  controller.onUnifiedQrFillSettingsChange = (patches) => {
    overrides.onUnifiedQrFillSettingsChange?.(patches);
    sync("patternSettings", patches.pattern);
    sync("cornersSettings", patches.corners);
    sync("logoSettings", patches.logo);
  };

  return controller;
}

const PATCHED_VALUE_KEYS = new Set<string>(Object.values(PATCHED_KEYS));
