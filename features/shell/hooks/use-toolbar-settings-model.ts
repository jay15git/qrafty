import type {
  validateStaticQrContent,
  StaticQrContentValue,
  StaticQrContentValues,
} from "@/features/qr/content/static-payload";
import type { QrDotMatrixAnimationPatch } from "@/features/qr/model/state";
import type { QrInputType } from "@/features/qr/content/input-options";
import type {
  BackgroundSettings,
  CornersSettings,
  EncodingSettings,
  ExportSettings,
  ImageSettings,
  LayersSettings,
  LogoSettings,
  LogoSettingsPatch,
  MotionSettings,
  PatternSettings,
  PatternSettingsPatch,
  ShapeSettings,
  ThemeMode,
  SettingsController,
  SettingsToolId,
} from "@/features/shell/model/settings-model";

const noop = () => undefined;

export type SettingsModel = {
  controller: SettingsController;
  actualActiveTool: SettingsToolId | null;
  actualTheme: ThemeMode;
  actualContentType: QrInputType;
  actualContentValues: StaticQrContentValues;
  actualContentValidation: ReturnType<typeof validateStaticQrContent>;
  actualPatternSettings: PatternSettings;
  actualLogoSettings: LogoSettings;
  actualCornersSettings: CornersSettings;
  actualShapeSettings: ShapeSettings;
  actualMotionSettings: MotionSettings;
  actualEncodingSettings: EncodingSettings;
  actualImageSettings: ImageSettings;
  actualBackgroundSettings: BackgroundSettings;
  actualLayersSettings: LayersSettings;
  actualExportSettings: ExportSettings;
  onActiveToolChange: (toolId: SettingsToolId) => void;
  onThemeChange: (theme: ThemeMode) => void;
  onContentTypeChange: (type: QrInputType) => void;
  onContentPasteApply: (type: QrInputType, values: StaticQrContentValues) => void;
  onContentValueChange: (field: string, value: StaticQrContentValue) => void;
  onPatternSettingsChange: (patch: PatternSettingsPatch) => void;
  onUnifiedQrFillSettingsChange?: (
    patches: import("@/features/shell/settings/settings-bridge").UnifiedQrFillPatches,
  ) => void;
  onLogoSettingsChange: (patch: LogoSettingsPatch) => void;
  onCornersSettingsChange: (patch: Partial<CornersSettings>) => void;
  onShapeSettingsChange: (patch: Partial<ShapeSettings>) => void;
  onMotionSettingsChange: (patch: QrDotMatrixAnimationPatch) => void;
  onEncodingSettingsChange: (patch: Partial<EncodingSettings>) => void;
  onImageSettingsChange: (patch: Partial<ImageSettings>) => void;
  onBackgroundSettingsChange: (settings: Partial<BackgroundSettings>) => void;
  onLayersSettingsChange: (patch: Partial<LayersSettings>) => void;
  onLayersReorder: (orderedIds: string[]) => void;
  onExportSettingsChange: (patch: Partial<ExportSettings>) => void;
};

/**
 * Thin view-model over the workspace `SettingsController`: renames the
 * controller fields to the `actual*`/handler shape the settings UI expects.
 * No local state — the controller is the single source of truth.
 */
export function useToolbarSettingsModel({
  controller,
  theme = "dark",
  onThemeChange = noop,
}: {
  controller: SettingsController;
  theme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
}): SettingsModel {
  return {
    controller,
    actualActiveTool: controller.activeTool,
    actualTheme: theme,
    actualContentType: controller.contentType,
    actualContentValues: controller.contentValues,
    actualContentValidation: controller.contentValidation,
    actualPatternSettings: controller.patternSettings,
    actualLogoSettings: controller.logoSettings,
    actualCornersSettings: controller.cornersSettings,
    actualShapeSettings: controller.shapeSettings,
    actualMotionSettings: controller.motionSettings,
    actualEncodingSettings: controller.encodingSettings,
    actualImageSettings: controller.imageSettings,
    actualBackgroundSettings: controller.backgroundSettings,
    actualLayersSettings: controller.layersSettings,
    actualExportSettings: controller.exportSettings,
    onActiveToolChange: controller.onActiveToolChange,
    onThemeChange,
    onContentTypeChange: controller.onContentTypeChange,
    onContentPasteApply: controller.onContentPasteApply,
    onContentValueChange: controller.onContentValueChange,
    onPatternSettingsChange: controller.onPatternSettingsChange,
    onUnifiedQrFillSettingsChange: controller.onUnifiedQrFillSettingsChange,
    onLogoSettingsChange: controller.onLogoSettingsChange,
    onCornersSettingsChange: controller.onCornersSettingsChange,
    onShapeSettingsChange: controller.onShapeSettingsChange,
    onMotionSettingsChange: controller.onMotionSettingsChange,
    onEncodingSettingsChange: controller.onEncodingSettingsChange,
    onImageSettingsChange: controller.onImageSettingsChange,
    onBackgroundSettingsChange: controller.onBackgroundSettingsChange,
    onLayersSettingsChange: controller.onLayersSettingsChange,
    onLayersReorder: controller.onLayersReorder ?? noop,
    onExportSettingsChange: controller.onExportSettingsChange,
  };
}
