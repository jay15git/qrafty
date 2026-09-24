import type { SettingsModel } from "@/features/shell/hooks/use-toolbar-settings-model";
import type { LockedFillPickerMode } from "@/features/shell/inspector/FillPicker";
import {
  isPatternModuleImageFill,
  readPatternModuleFillCss,
} from "@/features/shell/inspector/settings-bridge";
import type { SettingsSectionId } from "@/features/shell/inspector/settings-panel-meta";
import {
  SETTINGS_FILL_LINEAR_PRESETS,
  SETTINGS_FILL_RADIAL_PRESETS,
  SETTINGS_FILL_SOLID_PRESETS,
} from "@/features/shell/inspector/settings-fill-presets";
import type { PatternSettings } from "@/features/shell/model/toolbar-types";

export const QR_COLOR_FILL_MODES = [
  { id: "solid", label: "Solid" },
  { id: "linear", label: "Linear" },
  { id: "radial", label: "Radial" },
  { id: "image", label: "Image" },
  { id: "pattern", label: "Pattern" },
] as const;

export const SCENE_FILL_MODES = [
  { id: "solid", label: "Solid" },
  { id: "linear", label: "Linear" },
  { id: "radial", label: "Radial" },
  { id: "image", label: "Image" },
  { id: "shader", label: "Shader" },
] as const;

/**
 * Shape family's two views. The browsed fill sub-mode is folded into the mode
 * string (`fill:<mode>`) so the row and footer share one mode context.
 */
export const SHAPE_VIEW_MODES = [
  { id: "shape", label: "Shape" },
  { id: "fill", label: "Fill" },
] as const;

export const SHAPE_FILL_MODES = [
  { id: "solid", label: "Solid" },
  { id: "linear", label: "Linear" },
  { id: "radial", label: "Radial" },
] as const;

export function shapeFillSubMode(mode: string): string {
  return mode.startsWith("fill:") ? mode.slice("fill:".length) : "solid";
}

export function qrFillModeFromPattern(settings: PatternSettings): string {
  if (isPatternModuleImageFill(settings)) {
    return "image";
  }
  if (settings.dotsColorMode === "palette") {
    return "pattern";
  }
  if (settings.dotsColorMode === "gradient") {
    return readPatternModuleFillCss(settings).startsWith("radial-gradient") ? "radial" : "linear";
  }
  return "solid";
}

export function sceneFillModeFromModel(model: SettingsModel): string {
  const styleMode = model.actualBackgroundSettings.styleMode;
  if (styleMode === "image" || styleMode === "image-filter") {
    return "image";
  }
  if (styleMode === "paper-shader") {
    return "shader";
  }
  const css = model.actualShapeSettings.cardFill;
  if (css.startsWith("radial-gradient")) {
    return "radial";
  }
  if (css.startsWith("linear-gradient")) {
    return "linear";
  }
  return "solid";
}

/** The mode a family's pills should light up before anything is browsed. */
export function defaultFamilyMode(
  family: SettingsSectionId,
  model: SettingsModel,
): string | undefined {
  if (family === "Color") {
    return qrFillModeFromPattern(model.actualPatternSettings);
  }
  if (family === "Background") {
    return sceneFillModeFromModel(model);
  }
  if (family === "Shape") {
    return "shape";
  }
  return undefined;
}

export function fillPresetsForMode(mode: string): readonly string[] {
  if (mode === "linear") {
    return SETTINGS_FILL_LINEAR_PRESETS;
  }
  if (mode === "radial") {
    return SETTINGS_FILL_RADIAL_PRESETS;
  }
  return SETTINGS_FILL_SOLID_PRESETS;
}

/** The rail already picked a fill mode — the detail picker locks to it instead
 *  of re-showing Solid/Gradient tabs. */
export function lockedFillModeForRailMode(mode: string): LockedFillPickerMode | undefined {
  if (mode === "solid") {
    return "solid";
  }
  if (mode === "linear" || mode === "radial") {
    return "gradient";
  }
  return undefined;
}
