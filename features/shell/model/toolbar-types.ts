import type { ReactNode } from "react"
import type {
  QrFinderPatternOuterStyle,
  QrErrorCorrectionLevel,
  QrFileExtension,
  QrTypeNumber,
} from "@/features/qr/model/types"
import type { QraftyCornerDotStyle } from "@/features/qr/model/state"
import type { VideoExportLongEdge } from "@/features/qr/export/video-export"
import type { CardSizeSettings } from "@/features/shell/model/card-size-settings"
import {
  type DraftingCardPaperShaderState,
  type DraftingCardSizeMode,
  type DraftingCardStyleMode,
} from "@/features/canvas/model/card-state"
import type { PaperShaderId } from "@/features/canvas/rendering/paper-shader-definitions"
import type {
  DraftingCanvasLayer,
  DraftingTextAlign,
  DraftingTextFontStyle,
  DraftingTextFontWeight,
} from "@/features/canvas/model/layers/shared"
import type { DraftingLayerMenuAction } from "@/features/canvas/components/pane-layer-chrome.constants"
import type { AppearanceSnapshot } from "@/features/shell/model/appearance"
import {
  validateStaticQrContent,
  type StaticQrContentValue,
  type StaticQrContentValues,
} from "@/features/qr/content/static-payload"
import { type QrBackgroundShapeId } from "@/features/qr/styles/background-shapes"
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
} from "@/features/qr/model/state"
import { type QrInputType } from "@/features/qr/content/input-options"
import type { SceneLayoutPreset } from "@/features/canvas/model/scene-templates"
import type { ScanSafetyResult } from "@/features/qr/scan-safety/types"
import type { DraftingPaneCanvasTool } from "@/features/canvas/components/DraftingPaneCanvas"

type ToolbarGroup = "QR" | "Add" | "Manage"
export type ComposeSidebarPanel = "wallpapers" | null
export type ToolbarToolId =
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
  | "export"

export type BackgroundInspectorTab = "paper"

export type SceneTemplateSettings = {
  sizeSettings: CardSizeSettings
}

export type LayoutSettings = {
  layout: SceneLayoutPreset
}

export type ToolbarTool = {
  group: ToolbarGroup
  id: ToolbarToolId
  title: string
  renderIcon: () => ReactNode
}

export type ThemeMode = "dark" | "light"

export type PatternSettings = {
  dotsColorMode: DotsColorMode
  dataModulesGradient: QraftyGradient
  dotsPalette: string[]
  dotsPalettePreset: string | "custom"
  dotsSolidColor: string
  moduleFillImageUrl: string
  moduleFillImageSourceMode: ExternalAssetSourceMode
  qrDotType: QraftyDataModulesStyle
  moduleRoundSize: boolean
  moduleSize?: number
  moduleLineWidth?: number
  gradientLinkMode: QrGradientLinkMode
}

export type PatternSettingsPatch = Partial<PatternSettings> & {
  uploadedModuleFillFile?: File
}

export type LogoSourceMode = "brand" | "none" | "upload" | "url"
export type ExternalAssetSourceMode = "upload" | "url"

export type LogoSettings = {
  colorMode: CornerColorMode
  customImageUrl: string
  gradient: QraftyGradient
  hideBackgroundDots: boolean
  margin: number
  remoteUrl: string
  selectedBrandIconId: string
  size: number
  solidColor: string
  sourceMode: LogoSourceMode
  uploadMode: ExternalAssetSourceMode
  opacity: number
  sizeMode: QrLogoSizeMode
  widthPx?: number
  heightPx?: number
  lockAspect: boolean
  positionMode: QrLogoPositionMode
  offsetX: number
  offsetY: number
  crossOrigin: QrCrossOrigin
}

export type LogoSettingsPatch = Partial<LogoSettings> & {
  uploadedFile?: File
  uploadedImageUrl?: string
}

export type CornersSettings = {
  cornerDotColorMode: CornerColorMode
  cornerDotGradient: QraftyGradient
  cornerDotSolidColor: string
  cornerDotType: QraftyCornerDotStyle
  cornerSquareColorMode: CornerColorMode
  cornerSquareGradient: QraftyGradient
  cornerSquareSolidColor: string
  cornerSquareType: QrFinderPatternOuterStyle
}

export type CornerColorMode = "solid" | "gradient"

export type ShapeColorMode = "solid" | "gradient"

export type ShapeSettings = {
  backgroundShapeId: QrBackgroundShapeId
  bottomSpace: number
  cardFill: string
  cardHeight: number
  cardRadius: number
  cardWidth: number
  lockAspectRatio: boolean
  shapeColorMode: ShapeColorMode
  shapeGradient: QraftyGradient
  shapePadding: number
  shapeShadowBlur: number
  shapeShadowColor: string
  shapeShadowOffsetX: number
  shapeShadowOffsetY: number
  shapeShadowOpacity: number
  shapeSolidColor: string
  shadowBlur: number
  shadowColor: string
  shadowOffsetX: number
  shadowOffsetY: number
  shadowOpacity: number
  sizeMode: DraftingCardSizeMode
  sizePresetId?: string
}

export type MotionSettings = QrDotMatrixAnimationOptions

export type EncodingSettings = {
  errorCorrectionLevel: QrErrorCorrectionLevel
  typeNumber: QrTypeNumber
  boostLevel: boolean
  valueSegmentsText: string
}

export type AccessibilitySettings = {
  ariaLabel: string
}

export type ImageIntent = "image-object" | "logo" | "shape-fill"

export type ImageSettings = {
  fit: "contain" | "cover"
  intent: ImageIntent
  opacity: number
  remoteUrl: string
  sourceMode: ExternalAssetSourceMode
}

export type BackgroundSettings = {
  paperShader: DraftingCardPaperShaderState
  styleMode: DraftingCardStyleMode
}

export type EffectsSettings = {
  filterId: PaperShaderId
  filterPresetName: string
}

export type LayerKind = "card" | "image" | "qr" | "shader" | "shape" | "text"

export const LAYER_KIND_LABELS: Record<LayerKind, string> = {
  card: "Card",
  image: "Image",
  qr: "QR code",
  shader: "Shader",
  shape: "Shape",
  text: "Text",
}

export type LayerRow = {
  blur: number
  height: number
  id: string
  isVisible: boolean
  kind: LayerKind
  name: string
  opacity: number
  shadowBlur: number
  shadowColor: string
  shadowOffsetX: number
  shadowOffsetY: number
  shadowOpacity: number
  tiltX: number
  tiltY: number
  width: number
  x: number
  y: number
}

export type LayersSettings = {
  layers: LayerRow[]
  selectedLayerId: string
}

export type ExportTarget = "all-qr" | "current" | "surface"
export type ExportMediaKind = "photo" | "video"

export type ExportSettings = {
  extension: QrFileExtension
  photoLongEdge: VideoExportLongEdge
  mediaKind: ExportMediaKind
  target: ExportTarget
  videoDurationSeconds: number
  videoFormat: "mp4" | "webm"
  videoFrameRate: 30 | 60
  videoLongEdge: VideoExportLongEdge
}

export type TextSettings = {
  fill: string
  fontFamily: string
  fontId: string
  fontSize: number
  fontStyle: DraftingTextFontStyle
  fontWeight: DraftingTextFontWeight
  letterSpacing: number
  lineHeight: number
  text: string
  textAlign: DraftingTextAlign
  underline: boolean
}

export type ToolbarController = {
  activeTool: ToolbarToolId | null
  canRedo?: boolean
  canUndo?: boolean
  contentType: QrInputType
  contentValues: StaticQrContentValues
  contentValidation: ReturnType<typeof validateStaticQrContent>
  encodedContentValue: string
  patternSettings: PatternSettings
  logoSettings: LogoSettings
  cornersSettings: CornersSettings
  shapeSettings: ShapeSettings
  motionSettings: MotionSettings
  encodingSettings: EncodingSettings
  accessibilitySettings: AccessibilitySettings
  imageSettings: ImageSettings
  backgroundSettings: BackgroundSettings
  backgroundInspectorTab?: BackgroundInspectorTab
  effectsSettings: EffectsSettings
  layersSettings: LayersSettings
  exportSettings: ExportSettings
  layoutSettings: LayoutSettings
  sceneTemplateSettings: SceneTemplateSettings
  textSettings: TextSettings
  insertNodeId?: string
  composeSidebarPanel?: ComposeSidebarPanel
  selectedElementLayer?: DraftingCanvasLayer | null
  selectedLayerIds?: string[]
  selectedTransformLayer?: DraftingCanvasLayer | null
  selectedAppearanceLayer?: DraftingCanvasLayer | null
  appearanceSnapshot?: AppearanceSnapshot | null
  onInsertLayer?: (layer: DraftingCanvasLayer) => void
  canvasTool?: DraftingPaneCanvasTool | null
  onCanvasToolChange?: (tool: DraftingPaneCanvasTool | null) => void
  canAddQrCode?: boolean
  onAddQrCode?: () => void
  onAddTextLayerAt?: (paneId: string, point: { x: number; y: number }) => void
  canRemoveQrCode?: boolean
  onRemoveQrCode?: () => void
  onOpenComposeSidebar?: (panel: "wallpapers") => void
  onCloseComposeSidebar?: () => void
  onSelectWallpaper?: (imagePath: string) => void
  onCanvasBackgroundTabChange?: (tab: "shader" | "image" | "color") => void
  onElementLayerPatch?: (patch: Partial<DraftingCanvasLayer>) => void
  onAppearancePatch?: (patch: Partial<DraftingCanvasLayer>) => void
  onTransformLayerPatch?: (patch: Partial<DraftingCanvasLayer>) => void
  onActiveToolChange: (toolId: ToolbarToolId) => void
  onRedo?: () => void
  onSave?: () => void
  onUndo?: () => void
  onResetDefaults?: () => void
  onContentReset: () => void
  onContentTypeChange: (type: QrInputType) => void
  onContentPasteApply: (type: QrInputType, values: StaticQrContentValues) => void
  onContentValueChange: (field: string, value: StaticQrContentValue) => void
  onPatternReset: () => void
  onPatternSettingsChange: (patch: PatternSettingsPatch) => void
  onUnifiedQrFillSettingsChange?: (
    patches: import("@/features/shell/inspector/settings-bridge").UnifiedQrFillPatches,
  ) => void
  onLogoReset: () => void
  onLogoSettingsChange: (patch: LogoSettingsPatch) => void
  onCornersReset: () => void
  onCornersSettingsChange: (patch: Partial<CornersSettings>) => void
  onShapeReset: () => void
  onShapeSettingsChange: (patch: Partial<ShapeSettings>) => void
  onMotionReset: () => void
  onMotionSettingsChange: (patch: QrDotMatrixAnimationPatch) => void
  onEncodingReset: () => void
  onEncodingSettingsChange: (patch: Partial<EncodingSettings>) => void
  onAccessibilityReset: () => void
  onAccessibilitySettingsChange: (patch: Partial<AccessibilitySettings>) => void
  onImageReset: () => void
  onImageSettingsChange: (patch: Partial<ImageSettings>) => void
  onBackgroundReset: () => void
  onBackgroundSettingsChange: (settings: Partial<BackgroundSettings>) => void
  onBackgroundInspectorTabChange?: (tab: BackgroundInspectorTab) => void
  onEffectsReset: () => void
  onEffectsSettingsChange: (patch: Partial<EffectsSettings>) => void
  onLayersReset: () => void
  onLayersSettingsChange: (patch: Partial<LayersSettings>) => void
  onLayersReorder?: (orderedIds: string[]) => void
  onLayerDelete?: (layerId: string) => void
  onLayerMenuAction?: (action: DraftingLayerMenuAction) => void
  onLayerCopy?: () => void
  canCopyLayers?: boolean
  canDeleteLayer?: (layerId: string) => boolean
  onExportReset: () => void
  onExportSettingsChange: (patch: Partial<ExportSettings>) => void
  onExportDownload: () => void
  onLayoutPresetSelect?: (preset: SceneLayoutPreset) => void
  onLayoutSettingsChange?: (patch: Partial<SceneLayoutPreset>) => void
  onSceneTemplateSizeChange?: (patch: Partial<SceneTemplateSettings["sizeSettings"]>) => void
  onSceneTemplateSizeTemplateSelect?: (template: import("@/features/canvas/model/size-templates").SizeTemplate) => void
  exportDownloadError?: string | null
  canExportDownload?: boolean
  canExportVideo?: boolean
  exportInProgress?: boolean
  exportProgressLabel?: string | null
  exportProgressRatio?: number | null
  onExportCancel?: () => void
  onTextReset: () => void
  onTextSettingsChange: (patch: Partial<TextSettings>) => void
  scanSafetyResult?: ScanSafetyResult
}
