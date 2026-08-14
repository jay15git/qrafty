"use client"

import {
  Download02Icon,
  Image02Icon,
  SaveIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type {
  QrFinderPatternOuterStyle,
  QrErrorCorrectionLevel,
  QrFileExtension,
  QrTypeNumber,
} from "@/features/qr-code/model/types"
import type { StudioCornerDotStyle } from "@/features/qr-code/model/state"
import {
  Sparkles,
  Wallpaper,
} from "lucide-react"

import { BlocksIcon } from "@/components/vendor/animate-ui/icons/blocks"
import type { DesktopCardSizeSettings } from "@/features/desktop-shell/model/card-size-settings"
import "@/features/desktop-shell/components/desktop-chrome.css"
import { DEFAULT_BRAND_ICON_COLOR } from "@/features/qr-code/assets/brand-icon-svg"
import {
  ICONSTACK_LIBRARIES,
  type IconstackLibraryId,
} from "@/features/qr-code/assets/iconstack-api"
import {
  type DraftingCardPatternColorOverrides,
  type DraftingCardPatternId,
  type DraftingCardPatternSelectionId,
} from "@/features/workspace/model/card-patterns"
import {
  createDefaultDraftingCardPaperShader,
  DEFAULT_DRAFTING_CARD_STATE,
  type DraftingCardPaperShaderState,
  type DraftingCardSizeMode,
  type DraftingCardStyleMode,
} from "@/features/workspace/model/card-state"
import {
  getCardImageFilterDefinitions,
  type PaperShaderId,
} from "@/features/workspace/rendering/paper-shaders"
import {
  DEFAULT_DRAFTING_TEXT_LAYER,
  type DraftingCanvasLayer,
  type DraftingTextAlign,
  type DraftingTextFontStyle,
  type DraftingTextFontWeight,
} from "@/features/workspace/model/layers"
import {
  DesktopUtilityToolbar,
  DesktopUtilityToolbarButton,
  DESKTOP_UTILITY_TOOLBAR_SHELL_CLASS,
} from "@/features/desktop-shell/components/DesktopUtilityToolbar"
import { DesktopDynamicIslandChrome } from "@/features/desktop-shell/components/DesktopAppearanceIsland"
import { DesktopSettingsToolbarShell } from "@/features/desktop-shell/components/DesktopSettingsToolbarShell"
import { DesktopNewFloatingInspector } from "@/features/desktop-shell/inspector/DesktopNewFloatingInspector"
import type { DesktopAppearanceSnapshot } from "@/features/desktop-shell/model/appearance"
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
import { type QrBackgroundShapeId } from "@/features/qr-code/styles/background-shapes"
import {
  DEFAULT_DOT_MATRIX_ANIMATION,
  DEFAULT_BACKGROUND_SHAPE_OPTIONS,
  MOTION_COLOR_SWATCHES,
  createDefaultQrStudioState,
  setDotMatrixAnimationOptions,
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
import { ERROR_CORRECTION_LEVEL_OPTIONS } from "@/features/qr-code/styles/encoding-options"
import { DesktopTooltip } from "@/features/desktop-shell/components/DesktopTooltip"
import {
  DEFAULT_QR_INPUT_TYPE,
  type QrInputType,
} from "@/features/qr-code/content/input-options"
import { DownloadIcon as AnimatedDownloadIcon } from "@/components/ui/download"
import { type ExportPresetId } from "@/features/workspace/model/export-presets"
import type { SceneLayoutPreset } from "@/features/workspace/model/scene-templates"
import { GripIcon } from "@/components/ui/grip"
import { LayersIcon } from "@/components/ui/layers"
import { MessageCircleIcon } from "@/components/ui/message-circle"
import { PlayIcon } from "@/components/ui/play"
import { ReceiptTextIcon } from "@/components/ui/receipt-text"
import { cn } from "@/lib/utils"
import type { ScanSafetyResult } from "@/features/qr-code/scan-safety/types"
import {
  getVisibleToolbarToolIds,
  type WorkspaceEditingMode,
} from "@/features/workspace/model/workspace-editing-mode"

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

type DesktopToolbarTool = {
  group: DesktopToolbarGroup
  id: DesktopToolbarToolId
  title: string
  renderIcon: () => ReactNode
}

export type DesktopThemeMode = "dark" | "light"

const DESKTOP_TOOLBAR_TOOLS: DesktopToolbarTool[] = [
  {
    group: "QR",
    id: "layout",
    title: "Layout",
    renderIcon: () => <Sparkles size={18} />,
  },
  {
    group: "QR",
    id: "content",
    title: "Content",
    renderIcon: () => <ReceiptTextIcon size={18} />,
  },
  {
    group: "QR",
    id: "pattern",
    title: "Pattern",
    renderIcon: () => <GripIcon size={18} />,
  },
  {
    group: "QR",
    id: "corners",
    title: "Corners",
    renderIcon: () => <BlocksIcon animateOnHover size={18} />,
  },
  {
    group: "QR",
    id: "logo",
    title: "Logo",
    renderIcon: () => <MessageCircleIcon size={18} />,
  },
  {
    group: "QR",
    id: "shape",
    title: "Card",
    renderIcon: () => (
      <HugeiconsIcon icon={Image02Icon} size={18} color="currentColor" strokeWidth={1.8} />
    ),
  },
  {
    group: "QR",
    id: "background",
    title: "Background",
    renderIcon: () => <Wallpaper size={18} />,
  },
  {
    group: "QR",
    id: "motion",
    title: "Motion",
    renderIcon: () => <PlayIcon size={18} />,
  },
  {
    group: "Manage",
    id: "effects",
    title: "Effects",
    renderIcon: () => <Sparkles size={18} />,
  },
  {
    group: "Manage",
    id: "layers",
    title: "Layers",
    renderIcon: () => <LayersIcon size={18} />,
  },
  {
    group: "Manage",
    id: "export",
    title: "Export",
    renderIcon: () => <AnimatedDownloadIcon size={18} />,
  },
]

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

type DesktopCornerColorMode = "solid" | "gradient"

type DesktopShapeColorMode = "solid" | "gradient"

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

type DesktopImageIntent = "image-object" | "logo" | "shape-fill"

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

type DesktopTextPresetId = "body" | "caption" | "title"

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
  editingMode?: WorkspaceEditingMode
  isFreeEditingEnabled?: boolean
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
  onEditingModeChange?: (mode: WorkspaceEditingMode) => void
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

const DEFAULT_DESKTOP_DOTS_GRADIENT: StudioGradient = {
  enabled: true,
  type: "linear",
  rotation: 0,
  colorStops: [
    { offset: 0, color: "#18181b" },
    { offset: 1, color: "#3f3f46" },
  ],
}

const DEFAULT_DESKTOP_DOTS_PALETTE = ["#04879c", "#0c3c78", "#090030", "#f30a49"]

const DESKTOP_DOTS_PALETTE_PRESETS: Array<{
  colors: string[]
  label: string
}> = [
  { label: "Aurora", colors: ["#67e8f9", "#a78bfa", "#f0abfc", "#f8fafc"] },
  { label: "Fire", colors: ["#f97316", "#ef4444", "#facc15", "#7f1d1d"] },
  { label: "Mint", colors: ["#34d399", "#6ee7b7", "#d9f99d", "#064e3b"] },
  { label: "Neon", colors: ["#22d3ee", "#a855f7", "#f8fafc", "#111827"] },
  { label: "Ocean", colors: ["#38bdf8", "#2563eb", "#0f172a", "#bae6fd"] },
  { label: "Prism", colors: ["#64748b", "#eab308", "#22c55e", "#ec4899"] },
  { label: "Sunset", colors: ["#f59e0b", "#f97316", "#fde047", "#7c2d12"] },
  { label: "Signal", colors: ["#04879c", "#0c3c78", "#090030", "#f30a49"] },
  { label: "Candy", colors: ["#fb7185", "#f0abfc", "#c084fc", "#38bdf8"] },
  { label: "Mono", colors: ["#020617", "#334155", "#94a3b8", "#f8fafc"] },
  { label: "Forest", colors: ["#14532d", "#15803d", "#4ade80", "#bbf7d0"] },
  { label: "Berry", colors: ["#881337", "#be123c", "#f43f5e", "#fecdd3"] },
  { label: "Coral", colors: ["#ff7e5f", "#feb47b", "#ff6b6b", "#fff5ee"] },
  { label: "Sage", colors: ["#3f4f2e", "#5c6b4a", "#9caf88", "#e8ede4"] },
  { label: "Lavender", colors: ["#8b5cf6", "#c4b5fd", "#ede9fe", "#faf5ff"] },
  { label: "Midnight", colors: ["#0f0a1e", "#1a1145", "#2d1b69", "#4c1d95"] },
  { label: "Terracotta", colors: ["#b7410e", "#cd5c2e", "#e8a87c", "#faebd7"] },
  { label: "Ice", colors: ["#a5f3fc", "#e0f7fa", "#f0fdff", "#ffffff"] },
  { label: "Blush", colors: ["#db2777", "#f9a8d4", "#fce7f3", "#fdf2f8"] },
  { label: "Lime", colors: ["#65a30d", "#84cc16", "#d9f99d", "#1a2e05"] },
  { label: "Copper", colors: ["#92400e", "#b45309", "#d97706", "#fde68a"] },
  { label: "Storm", colors: ["#1e3a5f", "#2c5282", "#4a6fa5", "#a0aec0"] },
  { label: "Orchid", colors: ["#86198f", "#c026d3", "#f0abfc", "#fdf4ff"] },
  { label: "Sand", colors: ["#c2a366", "#d4b896", "#ede0c8", "#8b6914"] },
  { label: "Jade", colors: ["#0f766e", "#14b8a6", "#99f6e4", "#042f2e"] },
  { label: "Plum", colors: ["#4c0519", "#831843", "#be185d", "#fbcfe8"] },
  { label: "Sky", colors: ["#7dd3fc", "#bae6fd", "#e0f2fe", "#f0f9ff"] },
  { label: "Ember", colors: ["#ff6b35", "#e85d04", "#3d2314", "#1a1108"] },
  { label: "Frost", colors: ["#b8c5d6", "#d6deeb", "#eef2f7", "#93c5fd"] },
  { label: "Tropical", colors: ["#00c9a7", "#00b4d8", "#48cae4", "#0077b6"] },
]

const DESKTOP_ICONSTACK_LIBRARY_OPTIONS: Array<{
  label: string
  value: IconstackLibraryId | "all"
}> = [
  { label: "All libraries", value: "all" },
  ...ICONSTACK_LIBRARIES.map((library) => ({
    label: library.label,
    value: library.id,
  })),
]

const DESKTOP_DOTS_COLOR_MODES: Array<{ label: string; value: DotsColorMode }> = [
  { label: "Solid", value: "solid" },
  { label: "Gradient", value: "gradient" },
  { label: "Patterns", value: "palette" },
]

const DESKTOP_ERROR_CORRECTION_LEVEL_OPTIONS: Array<{
  label: string
  value: QrErrorCorrectionLevel
}> = ERROR_CORRECTION_LEVEL_OPTIONS.map((option) => ({
  label: option.label,
  value: option.value,
}))

const DESKTOP_CORNER_COLOR_MODES: Array<{ label: string; value: DesktopCornerColorMode }> = [
  { label: "Solid", value: "solid" },
  { label: "Gradient", value: "gradient" },
]

const DESKTOP_SHAPE_COLOR_MODES: Array<{ label: string; value: DesktopShapeColorMode }> = [
  { label: "Solid", value: "solid" },
  { label: "Gradient", value: "gradient" },
]

const DESKTOP_GRADIENT_TYPE_OPTIONS: Array<{ label: string; value: StudioGradient["type"] }> = [
  { label: "Linear", value: "linear" },
  { label: "Radial", value: "radial" },
]

const DESKTOP_LOGO_SOURCE_OPTIONS: Array<{ label: string; value: DesktopLogoSourceMode }> = [
  { label: "None", value: "none" },
  { label: "Brand", value: "brand" },
  { label: "Upload", value: "upload" },
]

const DESKTOP_ASSET_SOURCE_OPTIONS: Array<{ label: string; value: DesktopAssetSourceMode }> = [
  { label: "Upload", value: "upload" },
  { label: "URL", value: "url" },
]

const DESKTOP_IMAGE_INTENT_OPTIONS: Array<{ label: string; value: DesktopImageIntent }> = [
  { label: "Object", value: "image-object" },
  { label: "Shape fill", value: "shape-fill" },
  { label: "Logo", value: "logo" },
]

const DESKTOP_EXPORT_TARGET_OPTIONS: Array<{ label: string; value: DesktopExportTarget }> = [
  { label: "Current QR", value: "current" },
  { label: "All QR codes", value: "all-qr" },
  { label: "Full surface", value: "surface" },
]

const DESKTOP_DOWNLOAD_EXTENSIONS = ["svg", "png", "webp", "jpeg"] as const satisfies ReadonlyArray<
  QrFileExtension
>

const DESKTOP_RASTER_EXPORT_PRESETS = [
  { id: "quick-share", label: "Quick share", primaryUse: "chat, email, docs", sizePx: 512 },
  { id: "web-social", label: "Web & social", primaryUse: "sites, posts, menus", sizePx: 1024 },
  { id: "small-print", label: "Small print", primaryUse: "stickers, cards", sizePx: 1600 },
  { id: "flyer-poster", label: "Flyer / poster", primaryUse: "nearby signage", sizePx: 2400 },
  { id: "large-format", label: "Large format", primaryUse: "banners, walls", sizePx: 3200 },
  { id: "max-quality", label: "Max quality", primaryUse: "handoff, archive", sizePx: 4096 },
] as const

const DESKTOP_CROSS_ORIGIN_OPTIONS: Array<{ label: string; value: QrCrossOrigin }> = [
  { label: "Default", value: "" },
  { label: "Anonymous", value: "anonymous" },
  { label: "Credentials", value: "use-credentials" },
]

const DESKTOP_GRADIENT_LINK_OPTIONS: Array<{ label: string; value: QrGradientLinkMode }> = [
  { label: "Split", value: "split" },
  { label: "Unified", value: "unified" },
]

const DESKTOP_LOGO_SIZE_MODE_OPTIONS: Array<{ label: string; value: QrLogoSizeMode }> = [
  { label: "Ratio", value: "ratio" },
  { label: "Pixels", value: "pixels" },
]

const DESKTOP_LOGO_POSITION_OPTIONS: Array<{ label: string; value: QrLogoPositionMode }> = [
  { label: "Center", value: "center" },
  { label: "Custom", value: "custom" },
]

const DEFAULT_DESKTOP_PATTERN_SETTINGS: DesktopPatternSettings = {
  dotsColorMode: "solid",
  dataModulesGradient: DEFAULT_DESKTOP_DOTS_GRADIENT,
  dotsPalette: DEFAULT_DESKTOP_DOTS_PALETTE,
  dotsPalettePreset: "Signal",
  dotsSolidColor: "#18181b",
  qrDotType: "rounded",
  moduleRoundSize: true,
  gradientLinkMode: "split",
}

const DEFAULT_DESKTOP_LOGO_SETTINGS: DesktopLogoSettings = {
  colorMode: "solid",
  gradient: structuredClone(DEFAULT_DESKTOP_DOTS_GRADIENT),
  hideBackgroundDots: true,
  margin: 12,
  remoteUrl: "",
  selectedBrandIconId: "",
  size: 10,
  solidColor: DEFAULT_BRAND_ICON_COLOR,
  sourceMode: "brand",
  uploadMode: "upload",
  opacity: 100,
  sizeMode: "ratio",
  lockAspect: true,
  positionMode: "center",
  offsetX: 0,
  offsetY: 0,
  crossOrigin: "anonymous",
}

const DEFAULT_DESKTOP_CORNERS_SETTINGS: DesktopCornersSettings = {
  cornerDotColorMode: "solid",
  cornerDotGradient: {
    ...DEFAULT_DESKTOP_DOTS_GRADIENT,
    colorStops: [
      { offset: 0, color: "#18181b" },
      { offset: 1, color: "#52525b" },
    ],
  },
  cornerDotSolidColor: "#18181b",
  cornerDotType: "circle",
  cornerSquareColorMode: "solid",
  cornerSquareGradient: {
    ...DEFAULT_DESKTOP_DOTS_GRADIENT,
    colorStops: [
      { offset: 0, color: "#18181b" },
      { offset: 1, color: "#52525b" },
    ],
  },
  cornerSquareSolidColor: "#18181b",
  cornerSquareType: "rounded-lg",
}

const DEFAULT_DESKTOP_SHAPE_SETTINGS: DesktopShapeSettings = {
  backgroundShapeId: "none",
  bottomSpace: DEFAULT_DRAFTING_CARD_STATE.bottomSpace,
  cardFill: DEFAULT_DRAFTING_CARD_STATE.fill,
  cardHeight: DEFAULT_DRAFTING_CARD_STATE.height,
  cardPatternColors: DEFAULT_DRAFTING_CARD_STATE.patternColors,
  cardPatternId: DEFAULT_DRAFTING_CARD_STATE.patternId,
  cardRadius: DEFAULT_DRAFTING_CARD_STATE.cornerRadius,
  cardWidth: DEFAULT_DRAFTING_CARD_STATE.width,
  lockAspectRatio: DEFAULT_DRAFTING_CARD_STATE.lockAspectRatio,
  shapeColorMode: "solid",
  shapeGradient: {
    enabled: true,
    type: "linear",
    rotation: 0,
    colorStops: [
      { offset: 0, color: "#18181b" },
      { offset: 1, color: "#52525b" },
    ],
  },
  shapePadding: DEFAULT_BACKGROUND_SHAPE_OPTIONS.paddingPx,
  shapeShadowBlur: DEFAULT_BACKGROUND_SHAPE_OPTIONS.edgeBlur,
  shapeShadowColor: DEFAULT_BACKGROUND_SHAPE_OPTIONS.shadowColor,
  shapeShadowOffsetX: DEFAULT_BACKGROUND_SHAPE_OPTIONS.shadowOffsetX,
  shapeShadowOffsetY: DEFAULT_BACKGROUND_SHAPE_OPTIONS.shadowOffsetY,
  shapeShadowOpacity: DEFAULT_BACKGROUND_SHAPE_OPTIONS.shadowOpacity,
  shapeSolidColor: "#18181b",
  shadowBlur: DEFAULT_DRAFTING_CARD_STATE.shadow.blur,
  shadowColor: DEFAULT_DRAFTING_CARD_STATE.shadow.color,
  shadowOffsetX: DEFAULT_DRAFTING_CARD_STATE.shadow.offsetX,
  shadowOffsetY: DEFAULT_DRAFTING_CARD_STATE.shadow.offsetY,
  shadowOpacity: DEFAULT_DRAFTING_CARD_STATE.shadow.opacity,
  sizeMode: DEFAULT_DRAFTING_CARD_STATE.sizeMode,
  sizePresetId: DEFAULT_DRAFTING_CARD_STATE.sizePresetId,
}

const DEFAULT_DESKTOP_MOTION_SETTINGS: DesktopMotionSettings = {
  ...DEFAULT_DOT_MATRIX_ANIMATION,
}

const DEFAULT_DESKTOP_ENCODING_SETTINGS: DesktopEncodingSettings = {
  errorCorrectionLevel: "Q",
  typeNumber: 0,
  boostLevel: true,
  valueSegmentsText: "",
}

const DEFAULT_DESKTOP_ACCESSIBILITY_SETTINGS: DesktopAccessibilitySettings = {
  ariaLabel: "",
}

const DEFAULT_DESKTOP_IMAGE_SETTINGS: DesktopImageSettings = {
  fit: "cover",
  intent: "image-object",
  opacity: 100,
  remoteUrl: "",
  sourceMode: "upload",
}

const DEFAULT_DESKTOP_BACKGROUND_SETTINGS: DesktopBackgroundSettings = {
  paperShader: createDefaultDraftingCardPaperShader(
    DEFAULT_DRAFTING_CARD_STATE.paperShader.shaderId,
  ),
  styleMode: DEFAULT_DRAFTING_CARD_STATE.styleMode,
}

const DEFAULT_DESKTOP_EFFECTS_SETTINGS: DesktopEffectsSettings = {
  filterId: getCardImageFilterDefinitions()[0]?.id ?? "paper-texture",
  filterPresetName: getCardImageFilterDefinitions()[0]?.presets[0]?.name ?? "",
}

const DEFAULT_DESKTOP_LAYERS: DesktopLayerRow[] = [
  {
    blur: 0,
    height: 448,
    id: "desktop-layer-card",
    isLocked: false,
    isVisible: true,
    kind: "card",
    name: "QR Shape",
    opacity: 100,
    shadowBlur: DEFAULT_DRAFTING_CARD_STATE.shadow.blur,
    shadowColor: DEFAULT_DRAFTING_CARD_STATE.shadow.color,
    shadowOffsetX: DEFAULT_DRAFTING_CARD_STATE.shadow.offsetX,
    shadowOffsetY: DEFAULT_DRAFTING_CARD_STATE.shadow.offsetY,
    shadowOpacity: DEFAULT_DRAFTING_CARD_STATE.shadow.opacity,
    tiltX: 0,
    tiltY: 0,
    width: 384,
    x: -192,
    y: -224,
  },
  {
    blur: 0,
    height: 300,
    id: "desktop-layer-qr",
    isLocked: false,
    isVisible: true,
    kind: "qr",
    name: "QR Code",
    opacity: 100,
    shadowBlur: 0,
    shadowColor: "#111827",
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowOpacity: 0,
    tiltX: 0,
    tiltY: 0,
    width: 300,
    x: -150,
    y: -180,
  },
  {
    blur: 0,
    height: 48,
    id: "desktop-layer-text",
    isLocked: false,
    isVisible: true,
    kind: "text",
    name: "Text: Add text",
    opacity: 100,
    shadowBlur: 0,
    shadowColor: "#111827",
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowOpacity: 0,
    tiltX: 0,
    tiltY: 0,
    width: 240,
    x: -120,
    y: 150,
  },
]

const DEFAULT_DESKTOP_LAYERS_SETTINGS: DesktopLayersSettings = {
  layers: DEFAULT_DESKTOP_LAYERS.map((layer) => ({ ...layer })),
  selectedLayerId: DEFAULT_DESKTOP_LAYERS[1]?.id ?? "",
}

const DEFAULT_DESKTOP_EXPORT_SETTINGS: DesktopExportSettings = {
  extension: "png",
  qualityPresetId: "web-social",
  target: "current",
}

const DEFAULT_DESKTOP_TEXT_SETTINGS: DesktopTextSettings = {
  fill: DEFAULT_DRAFTING_TEXT_LAYER.fill,
  fontFamily: DEFAULT_DRAFTING_TEXT_LAYER.fontFamily,
  fontId: DEFAULT_DRAFTING_TEXT_LAYER.fontId,
  fontSize: DEFAULT_DRAFTING_TEXT_LAYER.fontSize,
  fontStyle: DEFAULT_DRAFTING_TEXT_LAYER.fontStyle,
  fontWeight: DEFAULT_DRAFTING_TEXT_LAYER.fontWeight,
  letterSpacing: DEFAULT_DRAFTING_TEXT_LAYER.letterSpacing,
  lineHeight: DEFAULT_DRAFTING_TEXT_LAYER.lineHeight,
  text: DEFAULT_DRAFTING_TEXT_LAYER.text,
  textAlign: DEFAULT_DRAFTING_TEXT_LAYER.textAlign,
  underline: DEFAULT_DRAFTING_TEXT_LAYER.underline,
}

const DESKTOP_TEXT_PRESETS: Array<{
  fontSize: number
  fontWeight: DraftingTextFontWeight
  id: DesktopTextPresetId
  label: string
  lineHeight: number
}> = [
  { fontSize: 32, fontWeight: "normal", id: "body", label: "Body", lineHeight: 1.22 },
  { fontSize: 52, fontWeight: 700, id: "title", label: "Title", lineHeight: 1.05 },
  { fontSize: 18, fontWeight: 500, id: "caption", label: "Caption", lineHeight: 1.35 },
]

const DESKTOP_TEXT_ALIGN_OPTIONS: Array<{ label: string; value: DraftingTextAlign }> = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
]

const DESKTOP_MOTION_COLOR_SWATCHES: Record<DesktopMotionSettings["colorPreset"], string[]> =
  MOTION_COLOR_SWATCHES

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
  const [desktopTheme, setDesktopTheme] = useState<DesktopThemeMode>("light")
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
  const editingMode = controller?.editingMode ?? "free"
  const visibleToolbarToolIds = getVisibleToolbarToolIds(editingMode)
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
      ((settings: DesktopBackgroundSettings) => setBackgroundSettings(settings)),
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

export function FloatingToolbar({
  controller,
  theme,
  onThemeChange,
}: {
  controller?: DesktopToolbarController
  theme?: DesktopThemeMode
  onThemeChange?: (theme: DesktopThemeMode) => void
} = {}) {
  const model = useDesktopToolbarInspectorModel({ controller, theme, onThemeChange })
  const {
    actualActiveTool,
    actualDesktopTheme,
    activeToolConfig,
  } = model

  return (
      <section
        aria-label="Desktop workspace prototype"
        data-desktop-theme={actualDesktopTheme}
        data-slot="desktop-floating-toolbar-root"
        className={cn(
          "relative min-h-dvh overflow-hidden transition-colors duration-200",
          actualDesktopTheme === "light" ? "bg-[#f4f6f9]" : "bg-[#07080a]",
        )}
      >
        <div
          data-slot="desktop-dynamic-island-anchor"
        >
          <div
            className={cn(
              DESKTOP_UTILITY_TOOLBAR_SHELL_CLASS,
              "pointer-events-auto",
            )}
            data-slot="desktop-dynamic-island"
            data-toolbar-appearance="desktop-glass"
          >
            <DesktopDynamicIslandChrome
              appearance={controller?.appearanceSnapshot}
              canRedo={controller?.canRedo}
              canUndo={controller?.canUndo}
              isFreeEditingEnabled={controller?.isFreeEditingEnabled ?? true}
              onFreeEditingChange={(enabled) =>
                controller?.onEditingModeChange?.(enabled ? "free" : "template")
              }
              onPatch={controller?.onAppearancePatch}
              onRedo={controller?.onRedo}
              onSelectSizeTemplate={controller?.onSceneTemplateSizeTemplateSelect}
              onThemeChange={model.onDesktopThemeChange}
              onUndo={controller?.onUndo}
              sizePresetId={controller?.sceneTemplateSettings?.sizeSettings?.sizePresetId}
              theme={actualDesktopTheme}
            />
          </div>
        </div>
        <div data-slot="desktop-utility-toolbar-anchor">
          <DesktopUtilityToolbar
            data-slot="desktop-utility-toolbar"
            className="pointer-events-auto"
          >
            <DesktopTooltip content="Save" side="left" sideOffset={10}>
              <DesktopUtilityToolbarButton
                aria-label="Save"
                data-slot="desktop-save-trigger"
                onClick={() => controller?.onSave?.()}
              >
                <HugeiconsIcon
                  icon={SaveIcon}
                  size={16}
                  color="currentColor"
                  strokeWidth={1.8}
                />
              </DesktopUtilityToolbarButton>
            </DesktopTooltip>
            <DesktopTooltip content="Download" side="left" sideOffset={10}>
              <DesktopUtilityToolbarButton
                aria-label="Download"
                data-slot="desktop-download-trigger"
                onClick={() => controller?.onExportDownload?.()}
              >
                <HugeiconsIcon
                  icon={Download02Icon}
                  size={16}
                  color="currentColor"
                  strokeWidth={1.8}
                />
              </DesktopUtilityToolbarButton>
            </DesktopTooltip>
          </DesktopUtilityToolbar>
        </div>
        <DesktopSettingsToolbarShell
          showInspector={Boolean(
            activeToolConfig || controller?.selectedElementLayer || controller?.composeSidebarPanel,
          )}
          inspector={
            <DesktopNewFloatingInspector activeTool={actualActiveTool} model={model} />
          }
        />
      </section>
  )
}

export { DESKTOP_TOOLBAR_TOOLS }
