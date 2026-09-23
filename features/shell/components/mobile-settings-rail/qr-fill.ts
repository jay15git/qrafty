import type { Fill } from "@/components/ui/fill-picker/public-api"
import type { InspectorModel } from "@/features/shell/hooks/use-toolbar-inspector-model"
import {
  applyPatternModuleFill,
  applyPatternModuleImageUrl,
  applyUnifiedQrFill,
  applyUnifiedQrModuleImageUrl,
  applyUnifiedQrModulePatternPatch,
  type UnifiedQrFillPatches,
  type UnifiedQrFillSettings,
} from "@/features/shell/inspector/settings-bridge"
import type { PatternSettings } from "@/features/shell/model/toolbar-types"

function unifiedQrSettings(model: InspectorModel): UnifiedQrFillSettings {
  return {
    pattern: model.actualPatternSettings,
    corners: model.actualCornersSettings,
    logo: model.actualLogoSettings,
  }
}

function applyUnifiedPatches(model: InspectorModel, patches: UnifiedQrFillPatches) {
  if (model.onUnifiedQrFillSettingsChange) {
    model.onUnifiedQrFillSettingsChange(patches)
    return
  }
  model.onPatternSettingsChange(patches.pattern)
  model.onCornersSettingsChange(patches.corners)
  model.onLogoSettingsChange(patches.logo)
}

/** Applies a fill to module dots — fans out to eye/frame/logo when unified. */
export function applyQrFill(model: InspectorModel, fill: Fill) {
  if (model.actualPatternSettings.gradientLinkMode === "unified") {
    applyUnifiedPatches(model, applyUnifiedQrFill(fill, unifiedQrSettings(model)))
    return
  }
  model.onPatternSettingsChange(applyPatternModuleFill(fill, model.actualPatternSettings))
}

/** Dots-palette fills are module-only, but unified mode still syncs the rest. */
export function applyQrPalette(
  model: InspectorModel,
  preset: { label: string; colors: string[] },
) {
  applyQrPalettePatch(model, {
    dotsColorMode: "palette",
    dotsPalette: [...preset.colors],
    dotsPalettePreset: preset.label,
  })
}

export function applyQrImageFill(
  model: InspectorModel,
  imageUrl: string,
  sourceMode: PatternSettings["moduleFillImageSourceMode"],
) {
  if (model.actualPatternSettings.gradientLinkMode === "unified") {
    applyUnifiedPatches(
      model,
      applyUnifiedQrModuleImageUrl(imageUrl, sourceMode, unifiedQrSettings(model)),
    )
    return
  }
  model.onPatternSettingsChange(applyPatternModuleImageUrl(imageUrl, sourceMode))
}

/** Palette-mode patches are module-only, but unified mode still syncs the rest. */
export function applyQrPalettePatch(
  model: InspectorModel,
  patch: Partial<PatternSettings>,
) {
  if (model.actualPatternSettings.gradientLinkMode === "unified") {
    applyUnifiedPatches(
      model,
      applyUnifiedQrModulePatternPatch(patch, unifiedQrSettings(model)),
    )
    return
  }
  model.onPatternSettingsChange(patch)
}
