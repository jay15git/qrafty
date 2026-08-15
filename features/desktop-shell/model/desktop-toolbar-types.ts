import type { ReactNode } from "react"
import type {
  QrFinderPatternOuterStyle,
  QrErrorCorrectionLevel,
  QrFileExtension,
  QrTypeNumber,
} from "@/features/qr-code/model/types"
import type { StudioCornerDotStyle } from "@/features/qr-code/model/state"
import type { DesktopCardSizeSettings } from "@/features/desktop-shell/model/card-size-settings"
import {
  type DraftingCardPatternColorOverrides,
  type DraftingCardPatternId,
  type DraftingCardPatternSelectionId,
} from "@/features/workspace/model/card-patterns"
import {
  type DraftingCardPaperShaderState,
  type DraftingCardSizeMode,
  type DraftingCardStyleMode,
} from "@/features/workspace/model/card-state"
import type { PaperShaderId } from "@/features/workspace/rendering/paper-shaders"
import {
  type DraftingCanvasLayer,
  type DraftingTextAlign,
  type DraftingTextFontStyle,
  type DraftingTextFontWeight,
} from "@/features/workspace/model/layers"
import type { DesktopAppearanceSnapshot } from "@/features/desktop-shell/model/appearance"
import {
  validateStaticQrContent,
  type StaticQrContentValue,
  type StaticQrContentValues,
} from "@/features/qr-code/content/static-payload"
import { type QrBackgroundShapeId } from "@/features/qr-code/styles/background-shapes"
import {
  type DotsColorMode,
  type QrCrossOrigin,
  type QrGradientLinkMode,
  type QrLogoPositionMode,
  type QrLogoSizeMode,
  type QrDotMatrixAnimationOptions,
  type QrDotMatrixAnimationPatch,
  type StudioGradient,
  type StudioDataModulesStyle,
} from "@/features/qr-code/model/state"
import { type QrInputType } from "@/features/qr-code/content/input-options"
import { type ExportPresetId } from "@/features/workspace/model/export-presets"
import type { SceneLayoutPreset } from "@/features/workspace/model/scene-templates"
import type { ScanSafetyResult } from "@/features/qr-code/scan-safety/types"

type DesktopToolbarGroup = "QR" | "Add" | "Manage"
export type ComposeSidebarPanel = "stock-photos" | null
export type DesktopToolbarToolId =
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

export type DesktopBackgroundInspectorTab = "paper" | "patterns"

export type DesktopSceneTemplateSettings = {
  sizeSettings: DesktopCardSizeSettings
}

export type DesktopLayoutSettings = {
  layout: SceneLayoutPreset
}

export type DesktopToolbarTool = {
  group: DesktopToolbarGroup
  id: DesktopToolbarToolId
  title: string
  renderIcon: () => ReactNode
}

export type DesktopThemeMode = "dark" | "light"

export type DesktopPatternSettings = {
  dotsColorMode: DotsColorMode
  dataModulesGradient: StudioGradient
  dotsPalette: string[]
  dotsPalettePreset: string | "custom"
  dotsSolidColor: string
  qrDotType: StudioDataModulesStyle
  moduleRoundSize: boolean
  moduleSize?: number
  moduleLineWidth?: number
  gradientLinkMode: QrGradientLinkMode
}

export type DesktopLogoSourceMode = "brand" | "none" | "upload" | "url"
export type DesktopAssetSourceMode = "upload" | "url"

export type DesktopLogoSettings = {
  colorMode: DesktopCornerColorMode
  gradient: StudioGradient
  hideBackgroundDots: boolean
  margin: number
  remoteUrl: string
  selectedBrandIconId: string
  size: number
  solidColor: string
  sourceMode: DesktopLogoSourceMode
  uploadMode: DesktopAssetSourceMode
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

export type DesktopLogoSettingsPatch = Partial<DesktopLogoSettings> & {
  uploadedFile?: File
}

export type DesktopCornersSettings = {
  cornerDotColorMode: DesktopCornerColorMode
  cornerDotGradient: StudioGradient
  cornerDotSolidColor: string
  cornerDotType: StudioCornerDotStyle
  cornerSquareColorMode: DesktopCornerColorMode
  cornerSquareGradient: StudioGradient
  cornerSquareSolidColor: string
  cornerSquareType: QrFinderPatternOuterStyle
}

export type DesktopCornerColorMode = "solid" | "gradient"

export type DesktopShapeColorMode = "solid" | "gradient"

export type DesktopShapeSettings = {
  backgroundShapeId: QrBackgroundShapeId
  bottomSpace: number
  cardFill: string
  cardHeight: number
  cardPatternColors: Partial<Record<DraftingCardPatternId, DraftingCardPatternColorOverrides>>
  cardPatternId: DraftingCardPatternSelectionId
  cardRadius: number
  cardWidth: number
  lockAspectRatio: boolean
  shapeColorMode: DesktopShapeColorMode
  shapeGradient: StudioGradient
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

export type DesktopMotionSettings = QrDotMatrixAnimationOptions

export type DesktopEncodingSettings = {
  errorCorrectionLevel: QrErrorCorrectionLevel
  typeNumber: QrTypeNumber
  boostLevel: boolean
  valueSegmentsText: string
}

export type DesktopAccessibilitySettings = {
  ariaLabel: string
}

export type DesktopImageIntent = "image-object" | "logo" | "shape-fill"

export type DesktopImageSettings = {
  fit: "contain" | "cover"
  intent: DesktopImageIntent
  opacity: number
  remoteUrl: string
  sourceMode: DesktopAssetSourceMode
}

export type DesktopBackgroundSettings = {
  paperShader: DraftingCardPaperShaderState
  styleMode: DraftingCardStyleMode
}

export type DesktopEffectsSettings = {
  filterId: PaperShaderId
  filterPresetName: string
}

export type DesktopLayerKind = "card" | "image" | "qr" | "shader" | "shape" | "text"
export type DesktopLayerRow = {
  blur: number
  height: number
  id: string
  isLocked: boolean
  isVisible: boolean
  kind: DesktopLayerKind
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

export type DesktopLayersSettings = {
  layers: DesktopLayerRow[]
  selectedLayerId: string
}

export type DesktopExportTarget = "all-qr" | "current" | "surface"
export type DesktopRasterExportPresetId =
  | "flyer-poster"
  | "large-format"
  | "max-quality"
  | "quick-share"
  | "small-print"
  | "web-social"

export type DesktopExportSettings = {
  exportPresetId?: ExportPresetId
  extension: QrFileExtension
  qualityPresetId: DesktopRasterExportPresetId
  target: DesktopExportTarget
  usePlatformPreset?: boolean
}

export type DesktopTextSettings = {
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

export type DesktopTextPresetId = "body" | "caption" | "title"

export type DesktopToolbarController = {
  activeTool: DesktopToolbarToolId | null
  canRedo?: boolean
  canUndo?: boolean
  contentType: QrInputType
  contentValues: StaticQrContentValues
  contentValidation: ReturnType<typeof validateStaticQrContent>
  encodedContentValue: string
  patternSettings: DesktopPatternSettings
  logoSettings: DesktopLogoSettings
  cornersSettings: DesktopCornersSettings
  shapeSettings: DesktopShapeSettings
  motionSettings: DesktopMotionSettings
  encodingSettings: DesktopEncodingSettings
  accessibilitySettings: DesktopAccessibilitySettings
  imageSettings: DesktopImageSettings
  backgroundSettings: DesktopBackgroundSettings
  backgroundInspectorTab?: DesktopBackgroundInspectorTab
  effectsSettings: DesktopEffectsSettings
  layersSettings: DesktopLayersSettings
  exportSettings: DesktopExportSettings
  layoutSettings: DesktopLayoutSettings
  sceneTemplateSettings: DesktopSceneTemplateSettings
  textSettings: DesktopTextSettings
  insertNodeId?: string
  composeSidebarPanel?: ComposeSidebarPanel
  selectedElementLayer?: DraftingCanvasLayer | null
  selectedTransformLayer?: DraftingCanvasLayer | null
  selectedAppearanceLayer?: DraftingCanvasLayer | null
  appearanceSnapshot?: DesktopAppearanceSnapshot | null
  onInsertLayer?: (layer: DraftingCanvasLayer) => void
  onOpenComposeSidebar?: (panel: "stock-photos") => void
  onOpenCardPatternSettings?: () => void
  onCloseComposeSidebar?: () => void
  onSelectStockPhoto?: (imageUrl: string) => void
  onCanvasBackgroundTabChange?: (tab: "shader" | "image" | "color") => void
  onElementLayerPatch?: (patch: Partial<DraftingCanvasLayer>) => void
  onAppearancePatch?: (patch: Partial<DraftingCanvasLayer>) => void
  onTransformLayerPatch?: (patch: Partial<DraftingCanvasLayer>) => void
  onActiveToolChange: (toolId: DesktopToolbarToolId) => void
  onRedo?: () => void
  onSave?: () => void
  onUndo?: () => void
  onResetDefaults?: () => void
  onContentReset: () => void
  onContentTypeChange: (type: QrInputType) => void
  onContentPasteApply: (type: QrInputType, values: StaticQrContentValues) => void
  onContentValueChange: (field: string, value: StaticQrContentValue) => void
  onPatternReset: () => void
  onPatternSettingsChange: (patch: Partial<DesktopPatternSettings>) => void
  onLogoReset: () => void
  onLogoSettingsChange: (patch: DesktopLogoSettingsPatch) => void
  onCornersReset: () => void
  onCornersSettingsChange: (patch: Partial<DesktopCornersSettings>) => void
  onShapeReset: () => void
  onShapeSettingsChange: (patch: Partial<DesktopShapeSettings>) => void
  onMotionReset: () => void
  onMotionSettingsChange: (patch: QrDotMatrixAnimationPatch) => void
  onEncodingReset: () => void
  onEncodingSettingsChange: (patch: Partial<DesktopEncodingSettings>) => void
  onAccessibilityReset: () => void
  onAccessibilitySettingsChange: (patch: Partial<DesktopAccessibilitySettings>) => void
  onImageReset: () => void
  onImageSettingsChange: (patch: Partial<DesktopImageSettings>) => void
  onBackgroundReset: () => void
  onBackgroundSettingsChange: (settings: Partial<DesktopBackgroundSettings>) => void
  onBackgroundInspectorTabChange?: (tab: DesktopBackgroundInspectorTab) => void
  onEffectsReset: () => void
  onEffectsSettingsChange: (patch: Partial<DesktopEffectsSettings>) => void
  onLayersReset: () => void
  onLayersSettingsChange: (patch: Partial<DesktopLayersSettings>) => void
  onLayersReorder?: (orderedIds: string[]) => void
  onExportReset: () => void
  onExportSettingsChange: (patch: Partial<DesktopExportSettings>) => void
  onExportDownload: () => void
  onLayoutPresetSelect?: (preset: SceneLayoutPreset) => void
  onLayoutSettingsChange?: (patch: Partial<SceneLayoutPreset>) => void
  onSceneTemplateSizeChange?: (patch: Partial<DesktopSceneTemplateSettings["sizeSettings"]>) => void
  onSceneTemplateSizeTemplateSelect?: (template: import("@/features/workspace/model/size-templates").SizeTemplate) => void
  exportDownloadError?: string | null
  onTextReset: () => void
  onTextSettingsChange: (patch: Partial<DesktopTextSettings>) => void
  scanSafetyResult?: ScanSafetyResult
}
