import type {
  QrFinderPatternOuterStyle,
  QrErrorCorrectionLevel,
  QrFileExtension,
  QrTypeNumber,
} from "@/features/qr/model/types";
import type { QraftyCornerDotStyle } from "@/features/qr/model/state";
import type { VideoExportLongEdge } from "@/features/qr/export/video-export";
import type { CardSizeSettings } from "@/features/shell/model/card-size-settings";
import {
  type CanvasCardPaperShaderState,
  type CanvasCardSizeMode,
  type CanvasCardStyleMode,
} from "@/features/canvas/model/card-state";
import type { CanvasLayer } from "@/features/canvas/model/layers/shared";
import type { CanvasLayerMenuAction } from "@/features/canvas/components/canvas-layer-chrome.constants";
import type { AppearanceSnapshot } from "@/features/shell/model/appearance";
import {
  validateStaticQrContent,
  type StaticQrContentValue,
  type StaticQrContentValues,
} from "@/features/qr/content/static-payload";
import { type QrBackgroundShapeId } from "@/features/qr/styles/background-shapes";
import {
  type DotsColorMode,
  type QrCrossOrigin,
  type QrGradientLinkMode,
  type QrLogoPositionMode,
  type QrLogoSizeMode,
  type QrDotMatrixAnimationOptions,
  type QrDotMatrixAnimationPatch,
  type QraftyGradient,
  type QraftyDataModulesStyle,
} from "@/features/qr/model/state";
import { type QrInputType } from "@/features/qr/content/input-options";
import type { ScanSafetyResult } from "@/features/qr/scan-safety/types";
import type { Paint } from "@/features/canvas/model/paint";
export type ComposeSidebarPanel = "wallpapers" | null;
export type SettingsToolId =
  | "layout"
  | "content"
  | "pattern"
  | "corners"
  | "logo"
  | "shape"
  | "background"
  | "motion"
  | "text"
  | "image"
  | "effects"
  | "layers"
  | "export";

export type CanvasSizeSettings = {
  sizeSettings: CardSizeSettings;
};

export type ThemeMode = "dark" | "light";

export type PatternSettings = {
  dotsColorMode: DotsColorMode;
  dataModulesGradient: QraftyGradient;
  dotsPalette: string[];
  dotsPalettePreset: string | "custom";
  dotsSolidColor: string;
  moduleFillImageUrl: string;
  moduleFillImageSourceMode: ExternalAssetSourceMode;
  qrDotType: QraftyDataModulesStyle;
  moduleRoundSize: boolean;
  moduleSize?: number;
  moduleLineWidth?: number;
  gradientLinkMode: QrGradientLinkMode;
};

export type PatternSettingsPatch = Partial<PatternSettings> & {
  uploadedModuleFillFile?: File;
};

export type LogoSourceMode = "brand" | "none" | "upload" | "url";
export type ExternalAssetSourceMode = "upload" | "url";

export type LogoSettings = {
  colorMode: CornerColorMode;
  customImageUrl: string;
  gradient: QraftyGradient;
  hideBackgroundDots: boolean;
  margin: number;
  remoteUrl: string;
  selectedBrandIconId: string;
  size: number;
  solidColor: string;
  sourceMode: LogoSourceMode;
  uploadMode: ExternalAssetSourceMode;
  opacity: number;
  sizeMode: QrLogoSizeMode;
  widthPx?: number;
  heightPx?: number;
  lockAspect: boolean;
  positionMode: QrLogoPositionMode;
  offsetX: number;
  offsetY: number;
  crossOrigin: QrCrossOrigin;
};

export type LogoSettingsPatch = Partial<LogoSettings> & {
  uploadedFile?: File;
  uploadedImageUrl?: string;
};

export type CornersSettings = {
  cornerDotColorMode: CornerColorMode;
  cornerDotGradient: QraftyGradient;
  cornerDotSolidColor: string;
  cornerDotType: QraftyCornerDotStyle;
  cornerSquareColorMode: CornerColorMode;
  cornerSquareGradient: QraftyGradient;
  cornerSquareSolidColor: string;
  cornerSquareType: QrFinderPatternOuterStyle;
};

export type CornerColorMode = "solid" | "gradient";

export type ShapeColorMode = "solid" | "gradient";

export type ShapeSettings = {
  backgroundShapeId: QrBackgroundShapeId;
  bottomSpace: number;
  cardFill: Paint;
  cardHeight: number;
  cardRadius: number;
  cardWidth: number;
  lockAspectRatio: boolean;
  shapeColorMode: ShapeColorMode;
  shapeGradient: QraftyGradient;
  shapePadding: number;
  shapeShadowBlur: number;
  shapeShadowColor: string;
  shapeShadowOffsetX: number;
  shapeShadowOffsetY: number;
  shapeShadowOpacity: number;
  shapeSolidColor: string;
  shadowBlur: number;
  shadowColor: string;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number;
  sizeMode: CanvasCardSizeMode;
  sizePresetId?: string;
};

export type MotionSettings = QrDotMatrixAnimationOptions;

export type EncodingSettings = {
  errorCorrectionLevel: QrErrorCorrectionLevel;
  typeNumber: QrTypeNumber;
  boostLevel: boolean;
  valueSegmentsText: string;
};

export type ImageIntent = "image-object" | "logo" | "shape-fill";

export type ImageSettings = {
  fit: "contain" | "cover";
  intent: ImageIntent;
  opacity: number;
  remoteUrl: string;
  sourceMode: ExternalAssetSourceMode;
};

export type BackgroundSettings = {
  paperShader: CanvasCardPaperShaderState;
  styleMode: CanvasCardStyleMode;
};

export type LayerKind = "card" | "image" | "qr" | "shader" | "shape" | "text";

export const LAYER_KIND_LABELS: Record<LayerKind, string> = {
  card: "Card",
  image: "Image",
  qr: "QR code",
  shader: "Shader",
  shape: "Shape",
  text: "Text",
};

export type LayerRow = {
  blur: number;
  height: number;
  id: string;
  isVisible: boolean;
  kind: LayerKind;
  name: string;
  opacity: number;
  shadowBlur: number;
  shadowColor: string;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number;
  tiltX: number;
  tiltY: number;
  width: number;
  x: number;
  y: number;
};

export type LayersSettings = {
  layers: LayerRow[];
  selectedLayerId: string;
};

export type ExportTarget = "all-qr" | "current" | "surface";
export type ExportMediaKind = "photo" | "video";

export type ExportSettings = {
  extension: QrFileExtension;
  photoLongEdge: VideoExportLongEdge;
  mediaKind: ExportMediaKind;
  target: ExportTarget;
  videoDurationSeconds: number;
  videoFormat: "mp4" | "webm";
  videoFrameRate: 30 | 60;
  videoLongEdge: VideoExportLongEdge;
};

export type SettingsController = {
  activeTool: SettingsToolId | null;
  canRedo?: boolean;
  canUndo?: boolean;
  contentType: QrInputType;
  contentValues: StaticQrContentValues;
  contentValidation: ReturnType<typeof validateStaticQrContent>;
  patternSettings: PatternSettings;
  logoSettings: LogoSettings;
  cornersSettings: CornersSettings;
  shapeSettings: ShapeSettings;
  motionSettings: MotionSettings;
  encodingSettings: EncodingSettings;
  imageSettings: ImageSettings;
  backgroundSettings: BackgroundSettings;
  layersSettings: LayersSettings;
  exportSettings: ExportSettings;
  canvasSizeSettings: CanvasSizeSettings;
  insertNodeId?: string;
  composeSidebarPanel?: ComposeSidebarPanel;
  selectedElementLayer?: CanvasLayer | null;
  selectedLayerIds?: string[];
  selectedTransformLayer?: CanvasLayer | null;
  selectedAppearanceLayer?: CanvasLayer | null;
  appearanceSnapshot?: AppearanceSnapshot | null;
  onInsertLayer?: (layer: CanvasLayer) => void;
  canAddQrCode?: boolean;
  onAddQrCode?: () => void;
  onOpenComposeSidebar?: (panel: "wallpapers") => void;
  onCloseComposeSidebar?: () => void;
  onSelectWallpaper?: (imagePath: string) => void;
  onCanvasBackgroundTabChange?: (tab: "shader" | "image" | "color") => void;
  onElementLayerPatch?: (patch: Partial<CanvasLayer>) => void;
  onAppearancePatch?: (patch: Partial<CanvasLayer>) => void;
  onTransformLayerPatch?: (patch: Partial<CanvasLayer>) => void;
  onActiveToolChange: (toolId: SettingsToolId) => void;
  onRedo?: () => void;
  onUndo?: () => void;
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
  onLayersReorder?: (orderedIds: string[]) => void;
  onLayerDelete?: (layerId: string) => void;
  onLayerMenuAction?: (action: CanvasLayerMenuAction) => void;
  onLayerCopy?: () => void;
  canCopyLayers?: boolean;
  canDeleteLayer?: (layerId: string) => boolean;
  onExportSettingsChange: (patch: Partial<ExportSettings>) => void;
  onExportDownload: () => void;
  onCanvasSizeChange?: (patch: Partial<CanvasSizeSettings["sizeSettings"]>) => void;
  onCanvasSizeTemplateSelect?: (
    template: import("@/features/canvas/model/size-templates").SizeTemplate,
  ) => void;
  exportDownloadError?: string | null;
  canExportDownload?: boolean;
  canExportVideo?: boolean;
  exportInProgress?: boolean;
  exportProgressLabel?: string | null;
  exportProgressRatio?: number | null;
  onExportCancel?: () => void;
  scanSafetyResult?: ScanSafetyResult;
};
