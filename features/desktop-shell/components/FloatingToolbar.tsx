"use client"

import {
  CircleLock01Icon,
  CircleUnlock02Icon,
  Download02Icon,
  EyeIcon,
  FilterMailIcon,
  Image02Icon,
  SaveIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useId, useMemo, useState, type CSSProperties, type ReactNode } from "react"
import type {
  QrFinderPatternOuterStyle,
  QrErrorCorrectionLevel,
  QrFileExtension,
  QrTypeNumber,
} from "@/features/qr-code/model/types"
import type { StudioCornerDotStyle } from "@/features/qr-code/model/state"
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  ChevronDownIcon,
  ItalicIcon,
  ShapesIcon,
  Sparkles,
  LayoutGrid,
  TypeIcon,
  UnderlineIcon,
} from "lucide-react"

import { BlocksIcon } from "@/components/vendor/animate-ui/icons/blocks"
import {
  DesktopLayoutInspector,
  type DesktopLayoutSettings,
} from "@/features/desktop-shell/components/DesktopLayoutInspector"
import {
  DesktopSceneTemplateInspector,
  type DesktopSceneTemplateSettings,
} from "@/features/desktop-shell/components/DesktopSceneTemplateInspector"
import { DEFAULT_BRAND_ICON_COLOR } from "@/features/qr-code/assets/brand-icon-svg"
import {
  getBrandIconById,
  POPULAR_BRAND_ICON_IDS,
  type BrandIconEntry,
} from "@/features/qr-code/assets/brand-icons"
import {
  filterCuratedIconstackIcons,
} from "@/features/qr-code/assets/iconstack-curated"
import {
  ICONSTACK_LIBRARIES,
  toIconstackSelectionId,
  type IconstackLibraryId,
  type IconstackSearchResult,
} from "@/features/qr-code/assets/iconstack-api"
import { useIconstackCuratedIcons } from "@/features/qr-code/hooks/useIconstackCuratedIcons"
import { useIconstackIconSearch } from "@/features/qr-code/hooks/useIconstackIconSearch"
import {
  DRAFTING_CARD_PATTERN_NONE_ID,
  DRAFTING_CARD_PATTERNS,
  getDraftingCardPatternById,
  getDraftingCardPatternStyle,
  type DraftingCardPatternColorOverrides,
  type DraftingCardPatternId,
  type DraftingCardPatternSelectionId,
} from "@/features/workspace/model/card-patterns"
import { DEFAULT_DRAFTING_CARD_STATE, type DraftingCardSizeMode } from "@/features/workspace/model/card-state"
import {
  getCardGeneratedShaderDefinitions,
  getCardImageFilterDefinitions,
  getPaperShaderDefinition,
  type PaperShaderId,
} from "@/features/workspace/rendering/paper-shaders"
import {
  DEFAULT_DRAFTING_TEXT_LAYER,
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
import { DesktopElementInspector, DesktopTransformSection } from "@/features/desktop-shell/components/DesktopElementInspector"
import type { DesktopAppearanceSnapshot } from "@/features/desktop-shell/model/appearance"
import {
  DRAFTING_FONT_REGISTRY,
  getDraftingFontCssFamily,
  loadDraftingFont,
  resolveDraftingFont,
} from "@/features/workspace/model/fonts"
import {
  buildStaticQrPayload,
  getDefaultStaticQrValues,
  STATIC_QR_CONTENT_META,
  validateStaticQrContent,
  type StaticQrContentValue,
  type StaticQrContentValues,
} from "@/features/qr-code/content/static-payload"
import {
  QR_BACKGROUND_SHAPES,
  type QrBackgroundShapeId,
} from "@/features/qr-code/styles/background-shapes"
import {
  CORNER_DOT_STYLE_OPTIONS,
  CORNER_SQUARE_STYLE_OPTIONS,
  DOT_STYLE_OPTIONS,
} from "@/features/qr-code/styles/style-options"
import {
  supportsModuleLineWidth,
  supportsModuleRoundSize,
  supportsModuleSize,
} from "@/features/qr-code/styles/module-tuning"
import { StylePreview, type StylePreviewKind } from "@/features/qr-code/components/StylePreview"
import { GradientOffsetRangeField } from "@/features/qr-code/components/GradientOffsetRangeField"
import {
  DEFAULT_DOT_MATRIX_ANIMATION,
  DEFAULT_BACKGROUND_SHAPE_OPTIONS,
  MOTION_COLOR_SWATCHES,
  QR_DOT_MATRIX_ANIMATION_SPEED_MAX,
  QR_DOT_MATRIX_ANIMATION_SPEED_MIN,
  QR_DOT_MATRIX_COLOR_PRESET_OPTIONS,
  QR_DOT_MATRIX_OPACITY_MAX,
  QR_DOT_MATRIX_OPACITY_MIN,
  QR_MOTION_AUTO_ANIMATE_INTERVAL_MAX,
  QR_MOTION_AUTO_ANIMATE_INTERVAL_MIN,
  QR_MOTION_AUTO_ANIMATE_INTERVAL_STEP,
  QR_MOTION_DOT_MATRIX_PRESET_OPTIONS,
  QR_MOTION_HOVER_COLOR_MODE_OPTIONS,
  QR_MOTION_HOVER_EFFECT_OPTIONS,
  QR_MOTION_INTENSITY_OPTIONS,
  QR_MOTION_STANDARD_PRESET_OPTIONS,
  createDefaultQrStudioState,
  QR_MODULE_LINE_WIDTH_MAX,
  QR_MODULE_LINE_WIDTH_MIN,
  QR_MODULE_SIZE_MAX,
  QR_MODULE_SIZE_MIN,
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
import type { CodeExportTarget } from "@new-qr/qr-internal/codegen"
import {
  degreesToRadians,
  normalizeGradientOffsetRange,
  radiansToDegrees,
} from "@/features/qr-code/styles/gradient-controls"
import {
  ERROR_CORRECTION_LEVEL_OPTIONS,
  TYPE_NUMBER_MAX,
  TYPE_NUMBER_MIN,
  formatQrTypeNumberLabel,
} from "@/features/qr-code/styles/encoding-options"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DesktopInspectorOptionGridScrollArea,
  DesktopInspectorScrollArea,
} from "@/features/desktop-shell/components/DesktopInspectorShell"
import { SurfaceProvider } from "@/lib/surface-context"
import {
  DesktopColorInputRow,
  DesktopColorSwatchPicker,
} from "@/features/desktop-shell/components/DesktopColorControls"
import {
  DESKTOP_INSPECTOR_CONTROL_CLASS,
  DESKTOP_INSPECTOR_DROPDOWN_ITEM_CLASS,
  DESKTOP_INSPECTOR_DROPDOWN_MENU_CLASS,
  DESKTOP_INSPECTOR_DROPDOWN_TRIGGER_CLASS,
  DESKTOP_INSPECTOR_FG_MUTED,
  DESKTOP_INSPECTOR_CAPTION_CLASS,
  DESKTOP_INSPECTOR_FG_PRIMARY,
  DESKTOP_INSPECTOR_FG_SECONDARY,
  DESKTOP_INSPECTOR_FG_TERTIARY,
  DESKTOP_INSPECTOR_FIELD_ROW_CLASS,
  DESKTOP_INSPECTOR_FOCUS_CLASS,
  DESKTOP_INSPECTOR_FOOTER_CLASS,
  DESKTOP_INSPECTOR_HEADER_CLASS,
  DESKTOP_INSPECTOR_INPUT_CLASS,
  DESKTOP_INSPECTOR_LABEL_CLASS,
  DESKTOP_INSPECTOR_MAJOR_GAP_CLASS,
  DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
  DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
  DESKTOP_INSPECTOR_PANEL_TITLE_CLASS,
  DESKTOP_INSPECTOR_TYPE_LABEL_CLASS,
  DESKTOP_INSPECTOR_VALUE_CLASS,
  DESKTOP_INSPECTOR_RESET_CLASS,
  DESKTOP_INSPECTOR_ROW_CLASS,
  DESKTOP_INSPECTOR_ROW_GAP_CLASS,
  DESKTOP_INSPECTOR_SECTION_GAP_CLASS,
  DESKTOP_INSPECTOR_SECTION_HEADING_CLASS,
  DESKTOP_INSPECTOR_SELECTED_CLASS,
  DesktopInspectorAnimatedOptionGrid,
  DesktopInspectorMorphFilterMenu,
  DesktopInspectorImageFileUpload,
  DesktopInspectorLabel,
  DesktopInspectorNativeSelect,
  DesktopInspectorSearchInput,
  DesktopInspectorSection,
  DesktopInspectorSegmentedControl,
  DesktopInspectorTextarea,
  DesktopInspectorTextInput,
  DesktopInspectorScrubbableNumberInput,
  desktopInspectorOptionGridClass,
  desktopInspectorOptionGridItemClass,
  desktopInspectorOptionStackClass,
} from "@/features/desktop-shell/components/InspectorControls"
import { DesktopTooltip } from "@/features/desktop-shell/components/DesktopTooltip"
import {
  DEFAULT_QR_INPUT_TYPE,
  QR_INPUT_OPTIONS,
  type QrInputType,
} from "@/features/qr-code/content/input-options"
import { DesktopCodeExportInspector } from "@/features/desktop-shell/components/DesktopCodeExportInspector"
import { DesktopPexelsPhotoInspector } from "@/features/desktop-shell/components/DesktopPexelsPhotoInspector"
import { DesktopSizeTemplateInspector } from "@/features/desktop-shell/components/DesktopSizeTemplateInspector"
import { getCanvasSizeFromTemplate } from "@/features/workspace/model/size-templates"
import { DownloadIcon as AnimatedDownloadIcon } from "@/components/ui/download"
import {
  DraggableList,
  DraggableListHandle,
  DraggableListItem,
} from "@/components/ui/draggable-list"
import {
  EXPORT_PRESETS,
  formatExportPresetLabel,
  type ExportPresetId,
} from "@/features/workspace/model/export-presets"
import type { MockupStylePreset, SceneLayoutPreset, SceneTemplate } from "@/features/workspace/model/scene-templates"
import { ElasticSlider } from "@/components/ui/elastic-slider"
import { FluidSwitch } from "@/components/ui/fluid-switch"
import { GalleryVerticalEndIcon } from "@/components/ui/gallery-vertical-end"
import { GripIcon } from "@/components/ui/grip"
import { LayersIcon } from "@/components/ui/layers"
import LetterTIcon from "@/components/ui/letter-t-icon"
import { MessageCircleIcon } from "@/components/ui/message-circle"
import { PlayIcon } from "@/components/ui/play"
import { ReceiptTextIcon } from "@/components/ui/receipt-text"
import { cn } from "@/lib/utils"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import type { ScanSafetyResult } from "@/features/qr-code/scan-safety/types"

type DesktopToolbarGroup = "QR" | "Add" | "Manage"
export type ComposeSidebarPanel = "stock-photos" | null
export type DesktopToolbarToolId =
  | "templates"
  | "layout"
  | "content"
  | "pattern"
  | "corners"
  | "logo"
  | "shape"
  | "motion"
  | "card-pattern"
  | "text"
  | "image"
  | "decorations"
  | "effects"
  | "layers"
  | "export"

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
    id: "templates",
    title: "Templates",
    renderIcon: () => <LayoutGrid size={18} />,
  },
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
    title: "Frame",
    renderIcon: () => (
      <HugeiconsIcon icon={Image02Icon} size={18} color="currentColor" strokeWidth={1.8} />
    ),
  },
  {
    group: "QR",
    id: "motion",
    title: "Motion",
    renderIcon: () => <PlayIcon size={18} />,
  },
  {
    group: "Add",
    id: "card-pattern",
    title: "Pattern",
    renderIcon: () => <GalleryVerticalEndIcon size={18} />,
  },
  {
    group: "Manage",
    id: "decorations",
    title: "Decorations",
    renderIcon: () => <ShapesIcon size={18} />,
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

const DESKTOP_CONTENT_PRESET_TYPES: QrInputType[] = [
  "auto",
  "link",
  "text",
  "email",
  "phone",
  "sms",
  "wifi",
  "vcard",
]

const DESKTOP_ELASTIC_SLIDER_CLASS =
  "desktop-elastic-slider [--elastic-slider-height:--spacing(8)] [--elastic-slider-radius:9999px] [--elastic-slider-bg:rgba(255,255,255,0.095)] [--elastic-slider-fill:rgba(255,255,255,0.13)] [--elastic-slider-fill-active:rgba(255,255,255,0.2)] [--elastic-slider-hash:rgba(255,255,255,0.24)] [--elastic-slider-handle:rgba(255,255,255,0.7)] [--elastic-slider-label:rgba(255,255,255,0.58)] [--elastic-slider-focus:rgba(255,255,255,0.82)]"

type DesktopContentCollectionId = "all" | "popular" | "contact" | "social" | "business" | "files"

const DESKTOP_CONTENT_COLLECTIONS: Array<{
  id: DesktopContentCollectionId
  label: string
  types: QrInputType[]
}> = [
  {
    id: "popular",
    label: "Popular",
    types: ["auto", "link", "text", "email", "phone", "sms", "wifi", "vcard"],
  },
  {
    id: "contact",
    label: "Contact",
    types: ["phone", "email", "sms", "vcard", "whatsapp-chat", "telegram-username", "map-location"],
  },
  {
    id: "social",
    label: "Social",
    types: ["instagram", "x", "tiktok", "youtube", "linkedin", "telegram", "snapchat", "threads", "pinterest", "facebook", "discord"],
  },
  {
    id: "business",
    label: "Business",
    types: ["website", "google-review", "booking-link", "payment-link", "menu", "app-download", "event", "coupon"],
  },
  {
    id: "files",
    label: "Files",
    types: ["pdf", "image", "video", "document", "form"],
  },
]

const DESKTOP_CONTENT_FILTER_OPTIONS: Array<{
  id: DesktopContentCollectionId
  label: string
}> = [{ id: "all", label: "All" }, ...DESKTOP_CONTENT_COLLECTIONS]

const DESKTOP_ALL_CONTENT_TYPES = Array.from(
  new Set<QrInputType>([
    ...DESKTOP_CONTENT_PRESET_TYPES,
    ...DESKTOP_CONTENT_COLLECTIONS.flatMap((collection) => collection.types),
  ]),
)

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

export type DesktopDecorationsSettings = {
  fill: string
  kind: "badge" | "frame" | "label" | "sticker"
  patternId: DraftingCardPatternSelectionId
  radius: number
}

export type DesktopEffectsSettings = {
  filterId: PaperShaderId
  filterPresetName: string
  generatedShaderId: PaperShaderId
  generatedShaderPresetName: string
  paused: boolean
  speed: number
  frame: number
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
  decorationsSettings: DesktopDecorationsSettings
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
  onDecorationsReset: () => void
  onDecorationsSettingsChange: (patch: Partial<DesktopDecorationsSettings>) => void
  onEffectsReset: () => void
  onEffectsSettingsChange: (patch: Partial<DesktopEffectsSettings>) => void
  onLayersReset: () => void
  onLayersSettingsChange: (patch: Partial<DesktopLayersSettings>) => void
  onLayersReorder?: (orderedIds: string[]) => void
  onExportReset: () => void
  onExportSettingsChange: (patch: Partial<DesktopExportSettings>) => void
  onExportDownload: () => void
  onApplyMockupStyle?: (preset: MockupStylePreset) => void
  onLayoutPresetSelect?: (preset: SceneLayoutPreset) => void
  onLayoutSettingsChange?: (patch: Partial<SceneLayoutPreset>) => void
  onSceneTemplateSelect?: (template: SceneTemplate) => void
  onSceneTemplateSizeChange?: (patch: Partial<DesktopSceneTemplateSettings["sizeSettings"]>) => void
  onSceneTemplateSizeTemplateSelect?: (template: import("@/features/workspace/model/size-templates").SizeTemplate) => void
  buildCodegenExport?: (target: CodeExportTarget) => Promise<{ code: string; installCommand?: string }>
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

const DESKTOP_DECORATION_OPTIONS: Array<{ label: string; value: DesktopDecorationsSettings["kind"] }> = [
  { label: "Frame", value: "frame" },
  { label: "Badge", value: "badge" },
  { label: "Label", value: "label" },
  { label: "Sticker", value: "sticker" },
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

const DEFAULT_DESKTOP_DECORATIONS_SETTINGS: DesktopDecorationsSettings = {
  fill: DEFAULT_DRAFTING_CARD_STATE.fill,
  kind: "frame",
  patternId: DRAFTING_CARD_PATTERN_NONE_ID,
  radius: DEFAULT_DRAFTING_CARD_STATE.cornerRadius,
}

const DEFAULT_DESKTOP_EFFECTS_SETTINGS: DesktopEffectsSettings = {
  filterId: getCardImageFilterDefinitions()[0]?.id ?? "paper-texture",
  filterPresetName: getCardImageFilterDefinitions()[0]?.presets[0]?.name ?? "",
  frame: 0,
  generatedShaderId: getCardGeneratedShaderDefinitions()[0]?.id ?? "mesh-gradient",
  generatedShaderPresetName: getCardGeneratedShaderDefinitions()[0]?.presets[0]?.name ?? "",
  paused: false,
  speed: 1,
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
  actualDecorationsSettings: DesktopDecorationsSettings
  actualEffectsSettings: DesktopEffectsSettings
  actualLayersSettings: DesktopLayersSettings
  actualExportSettings: DesktopExportSettings
  actualLayoutSettings: DesktopLayoutSettings
  actualSceneTemplateSettings: DesktopSceneTemplateSettings
  actualTextSettings: DesktopTextSettings
  onActiveToolChange: (toolId: DesktopToolbarToolId) => void
  onDesktopThemeChange: (theme: DesktopThemeMode) => void
  onContentTypeChange: (type: QrInputType) => void
  onContentValueChange: (field: string, value: StaticQrContentValue) => void
  onPatternSettingsChange: (patch: Partial<DesktopPatternSettings>) => void
  onLogoSettingsChange: (patch: DesktopLogoSettingsPatch) => void
  onCornersSettingsChange: (patch: Partial<DesktopCornersSettings>) => void
  onShapeSettingsChange: (patch: Partial<DesktopShapeSettings>) => void
  onMotionSettingsChange: (patch: QrDotMatrixAnimationPatch) => void
  onEncodingSettingsChange: (patch: Partial<DesktopEncodingSettings>) => void
  onAccessibilitySettingsChange: (patch: Partial<DesktopAccessibilitySettings>) => void
  onImageSettingsChange: (patch: Partial<DesktopImageSettings>) => void
  onDecorationsSettingsChange: (patch: Partial<DesktopDecorationsSettings>) => void
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
  const [activeTool, setActiveTool] = useState<DesktopToolbarToolId | null>(null)
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
  const [decorationsSettings, setDecorationsSettings] = useState<DesktopDecorationsSettings>(
    DEFAULT_DESKTOP_DECORATIONS_SETTINGS,
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
      if (current[type]) {
        return current
      }

      return {
        ...current,
        [type]: getDefaultStaticQrValues(type),
      }
    })
  }

  function handleContentValueChange(field: string, value: StaticQrContentValue) {
    setContentValuesByType((current) => ({
      ...current,
      [selectedContentType]: {
        ...(current[selectedContentType] ?? getDefaultStaticQrValues(selectedContentType)),
        [field]: value,
      },
    }))
  }

  const actualActiveTool = controller?.activeTool ?? activeTool
  const actualDesktopTheme = theme ?? desktopTheme
  const activeToolConfig = DESKTOP_TOOLBAR_TOOLS.find((tool) => tool.id === actualActiveTool)

  return {
    controller,
    actualActiveTool,
    actualDesktopTheme,
    activeToolConfig,
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
    actualDecorationsSettings: controller?.decorationsSettings ?? decorationsSettings,
    actualEffectsSettings: controller?.effectsSettings ?? effectsSettings,
    actualLayersSettings: controller?.layersSettings ?? layersSettings,
    actualExportSettings: controller?.exportSettings ?? exportSettings,
    actualLayoutSettings: controller?.layoutSettings ?? { layout: { id: "flat", label: "Flat", rotation: 0, tiltX: 0, tiltY: 0, zoom: 1 } },
    actualSceneTemplateSettings: controller?.sceneTemplateSettings ?? {
      sizeSettings: {
        cardHeight: 1080,
        cardWidth: 1080,
        lockAspectRatio: true,
        sizeMode: "auto",
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
    onDecorationsSettingsChange:
      controller?.onDecorationsSettingsChange ??
      ((patch: Partial<DesktopDecorationsSettings>) =>
        setDecorationsSettings((current) => ({ ...current, ...patch }))),
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
        <DesktopThemeStyles />
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
              layerLabel={
                controller?.selectedAppearanceLayer
                  ? `${controller.selectedAppearanceLayer.kind.charAt(0).toUpperCase()}${controller.selectedAppearanceLayer.kind.slice(1)}`
                  : null
              }
              onPatch={controller?.onAppearancePatch}
              onRedo={controller?.onRedo}
              onResetDefaults={controller?.onResetDefaults}
              onThemeChange={model.onDesktopThemeChange}
              onUndo={controller?.onUndo}
              scanSafetyResult={controller?.scanSafetyResult}
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
          model={model}
          showInspector={Boolean(
            activeToolConfig || controller?.selectedElementLayer || controller?.composeSidebarPanel,
          )}
          inspector={
            <DesktopFloatingInspector activeTool={actualActiveTool} model={model} />
          }
        />
      </section>
  )
}

export function DesktopThemeStyles() {
  return (
    <style>{`
      body:has([data-slot="desktop-floating-toolbar-root"]) {
        --desktop-glass-bg: rgba(0, 0, 0, 0.95);
        --desktop-glass-border: rgba(255, 255, 255, 0.06);
        --desktop-glass-fg: rgba(255, 255, 255, 0.72);
        --desktop-glass-shadow: 0 24px 64px rgba(0, 0, 0, 0.34);
        --desktop-glass-panel-border: rgba(255, 255, 255, 0.06);
        --desktop-glass-panel-shadow: var(--desktop-glass-shadow);
        --desktop-glass-button-hover-bg: rgba(255, 255, 255, 0.11);
        --desktop-glass-button-hover-fg: rgba(255, 255, 255, 1);
        --desktop-glass-button-focus-ring: rgba(255, 255, 255, 0.45);
        --desktop-appearance-popover-bg: rgba(10, 10, 10, 0.96);
        --desktop-appearance-popover-border: rgba(255, 255, 255, 0.06);
        --desktop-appearance-popover-shadow: var(--desktop-glass-shadow);
        --desktop-inspector-fg-primary: rgba(255, 255, 255, 0.94);
        --desktop-inspector-fg-secondary: rgba(255, 255, 255, 0.76);
        --desktop-inspector-fg-tertiary: rgba(255, 255, 255, 0.50);
        --desktop-inspector-fg-muted: rgba(255, 255, 255, 0.42);
        --desktop-inspector-fg-label: var(--desktop-inspector-fg-secondary);
        --desktop-inspector-dropdown-bg: rgba(0, 0, 0, 0.9);
        --desktop-inspector-morph-filter-bg: var(--workspace-shell, #1f1f1f);
        --desktop-inspector-dropdown-border: rgba(255, 255, 255, 0.06);
        --desktop-inspector-control-hover-bg: rgba(255, 255, 255, 0.09);
        --desktop-inspector-option-selected-bg: rgba(255, 255, 255, 0.14);
      }

      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) {
        --desktop-glass-bg: rgba(255, 255, 255, 0.78);
        --desktop-glass-border: rgba(15, 23, 42, 0.12);
        --desktop-glass-fg: rgba(15, 23, 42, 0.68);
        --desktop-glass-shadow: 0 24px 64px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.86);
        --desktop-glass-panel-border: rgba(15, 23, 42, 0.12);
        --desktop-glass-panel-shadow: var(--desktop-glass-shadow);
        --desktop-glass-button-hover-bg: rgba(15, 23, 42, 0.08);
        --desktop-glass-button-hover-fg: rgba(15, 23, 42, 0.95);
        --desktop-glass-button-focus-ring: rgba(15, 23, 42, 0.36);
        --desktop-appearance-popover-bg: rgba(255, 255, 255, 0.96);
        --desktop-appearance-popover-border: rgba(15, 23, 42, 0.12);
        --desktop-appearance-popover-shadow: 0 24px 64px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.9);
        --desktop-inspector-fg-primary: rgba(15, 23, 42, 0.90);
        --desktop-inspector-fg-secondary: rgba(15, 23, 42, 0.66);
        --desktop-inspector-fg-tertiary: rgba(15, 23, 42, 0.44);
        --desktop-inspector-fg-muted: rgba(15, 23, 42, 0.38);
        --desktop-inspector-fg-label: rgba(15, 23, 42, 0.85);
        --desktop-inspector-dropdown-bg: rgba(255, 255, 255, 0.84);
        --desktop-inspector-morph-filter-bg: rgb(255, 255, 255);
        --desktop-inspector-dropdown-border: rgba(15, 23, 42, 0.09);
        --desktop-inspector-control-hover-bg: rgba(15, 23, 42, 0.06);
        --desktop-inspector-option-selected-bg: rgba(15, 23, 42, 0.08);
      }

      [data-slot="desktop-inspector-filter-trigger"] {
        color: var(--desktop-inspector-fg-tertiary) !important;
      }

      [data-slot="desktop-inspector-filter-trigger"]:hover,
      [data-slot="desktop-inspector-filter-trigger"][data-state="open"] {
        color: var(--desktop-inspector-fg-secondary) !important;
      }

      [data-slot="desktop-inspector-filter-trigger"] span {
        color: inherit !important;
      }

      [data-slot~="desktop-inspector-filter-menu"] {
        background-color: var(--desktop-inspector-dropdown-bg) !important;
        border-color: var(--desktop-inspector-dropdown-border) !important;
        color: var(--desktop-inspector-fg-secondary) !important;
        box-shadow: var(--desktop-glass-shadow) !important;
        --tw-ring-color: transparent !important;
      }

      [data-slot~="desktop-inspector-filter-menu"] [data-slot="dropdown-menu-radio-item"] {
        color: var(--desktop-inspector-fg-tertiary) !important;
      }

      [data-slot~="desktop-inspector-filter-menu"] [data-slot="dropdown-menu-radio-item"]:is(:focus, [data-highlighted]) {
        background-color: var(--desktop-inspector-control-hover-bg) !important;
        color: var(--desktop-inspector-fg-secondary) !important;
      }

      [data-slot~="desktop-inspector-filter-menu"] [data-slot="dropdown-menu-radio-item"][data-state="checked"] {
        background-color: var(--desktop-inspector-option-selected-bg) !important;
        color: var(--desktop-inspector-fg-secondary) !important;
      }

      [data-slot~="desktop-inspector-filter-menu"] [data-slot="dropdown-menu-radio-item"][data-state="checked"]:is(:focus, [data-highlighted]) {
        background-color: var(--desktop-inspector-option-selected-bg) !important;
        color: var(--desktop-inspector-fg-secondary) !important;
      }

      [data-slot~="desktop-inspector-filter-menu"] .bg-hover {
        left: 0 !important;
        width: 100% !important;
        background-color: var(--desktop-inspector-control-hover-bg) !important;
      }

      [data-slot~="desktop-inspector-filter-menu"] .bg-active {
        left: 0 !important;
        width: 100% !important;
        background-color: var(--desktop-inspector-option-selected-bg) !important;
      }

      [data-slot~="desktop-inspector-filter-menu"] .text-muted-foreground {
        color: var(--desktop-inspector-fg-tertiary) !important;
      }

      [data-slot~="desktop-inspector-filter-menu"] .text-foreground,
      [data-slot~="desktop-inspector-filter-menu"] [role="menuitemradio"]:hover .text-muted-foreground {
        color: var(--desktop-inspector-fg-primary) !important;
      }

      [data-slot~="desktop-inspector-filter-menu"] [role="menu"] {
        background-color: transparent !important;
        box-shadow: none !important;
      }

      [data-slot="desktop-floating-inspector"] .desktop-inspector-morph-filter[data-open="true"] [data-slot~="desktop-inspector-filter-menu"] {
        --foreground: var(--desktop-inspector-fg-primary);
        --muted-foreground: var(--desktop-inspector-fg-tertiary);
        --background: var(--desktop-inspector-morph-filter-bg);
        background-color: var(--desktop-inspector-morph-filter-bg) !important;
        border-color: transparent !important;
        box-shadow: none !important;
        color: var(--desktop-inspector-fg-secondary) !important;
      }

      [data-desktop-theme="light"] [data-slot="desktop-floating-inspector"] .desktop-inspector-morph-filter[data-open="true"] [data-slot~="desktop-inspector-filter-menu"] {
        --desktop-inspector-control-hover-bg: rgba(15, 23, 42, 0.06);
        --desktop-inspector-option-selected-bg: rgba(15, 23, 42, 0.08);
      }

      [data-desktop-theme="light"] .desktop-inspector-morph-filter[data-open="true"] {
        --scroll-edge-fade-color: rgba(255, 255, 255, 0.88);
      }

      [data-desktop-theme="dark"] .desktop-inspector-morph-filter[data-open="true"] {
        --scroll-edge-fade-color: var(--desktop-inspector-morph-filter-bg);
      }

      [data-desktop-theme="light"] {
        color-scheme: light;
      }

      [data-desktop-theme="dark"] {
        color-scheme: dark;
      }

      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) .desktop-tooltip-content,
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) .desktop-tooltip-content {
        border-radius: 9999px !important;
        background: rgba(15, 15, 15, 0.94) !important;
        color: rgba(255, 255, 255, 0.96) !important;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18) !important;
      }

      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="dark"]) .desktop-tooltip-content,
      body:has([data-slot="desktop-workspace"][data-desktop-theme="dark"]) .desktop-tooltip-content {
        border-radius: 9999px !important;
        background: rgba(255, 255, 255, 0.96) !important;
        color: rgba(15, 15, 15, 0.94) !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28) !important;
      }

      [data-desktop-theme="dark"] [data-slot="desktop-left-toolbar-shell"],
      [data-desktop-theme="dark"] [data-slot="desktop-document-toolbar"],
      [data-desktop-theme="dark"] [data-slot="desktop-utility-toolbar"],
      [data-desktop-theme="dark"] [data-slot="desktop-dynamic-island"],
      [data-desktop-theme="dark"] [data-slot="desktop-action-toolbar"] {
        box-shadow: var(--desktop-glass-shadow) !important;
      }

      [data-desktop-theme="dark"] [data-slot="desktop-left-toolbar-shell"] {
        box-shadow: var(--desktop-glass-panel-shadow) !important;
      }

      [data-desktop-theme="light"] [data-slot="desktop-left-toolbar-shell"],
      [data-desktop-theme="light"] [data-slot="desktop-document-toolbar"],
      [data-desktop-theme="light"] [data-slot="desktop-utility-toolbar"],
      [data-desktop-theme="light"] [data-slot="desktop-dynamic-island"],
      [data-desktop-theme="light"] [data-slot="desktop-action-toolbar"] {
        background: var(--desktop-glass-bg) !important;
        border-color: rgba(15, 23, 42, 0.12) !important;
        color: rgba(15, 23, 42, 0.68) !important;
        box-shadow: 0 24px 64px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.86) !important;
      }

      [data-desktop-theme="light"] [data-slot="desktop-floating-toolbar"] button:not([data-proximity-index]):hover,
      [data-desktop-theme="light"] [data-slot="desktop-document-toolbar"] button:hover,
      [data-desktop-theme="light"] [data-slot="desktop-utility-toolbar"] button:hover,
      [data-desktop-theme="light"] [data-slot="desktop-dynamic-island"] button:hover,
      [data-desktop-theme="light"] [data-slot="desktop-action-toolbar"] button:hover {
        background: rgba(15, 23, 42, 0.08) !important;
        color: var(--desktop-toolbar-fg-hover) !important;
      }

      [data-desktop-theme="light"] [data-slot="desktop-floating-toolbar"] {
        --desktop-toolbar-fg: rgba(15, 23, 42, 0.48);
        --desktop-toolbar-fg-hover: rgba(15, 23, 42, 0.62);
        --desktop-toolbar-fg-active: rgba(15, 23, 42, 0.90);
        --desktop-toolbar-pill-selected: rgba(15, 23, 42, 0.11);
        --desktop-toolbar-pill-hover: rgba(15, 23, 42, 0.08);
        color: var(--desktop-toolbar-fg) !important;
      }

      [data-desktop-theme="light"] [data-slot="desktop-floating-toolbar"] button:not([data-proximity-index])[aria-pressed="true"] {
        background: rgba(15, 23, 42, 0.11) !important;
        color: var(--desktop-toolbar-fg-active) !important;
      }

      [data-desktop-theme="light"] [data-slot="desktop-floating-toolbar"] button[data-proximity-index]:hover,
      [data-desktop-theme="light"] [data-slot="desktop-floating-toolbar"] button[data-proximity-index][aria-pressed="true"] {
        background: transparent !important;
        color: inherit !important;
      }

      [data-desktop-theme="light"] [data-slot="desktop-floating-toolbar"] [data-slot="tabs-subtle-icon-rail-separator"] {
        background-color: rgba(15, 23, 42, 0.11) !important;
      }

      [data-desktop-theme="light"] [data-slot="desktop-floating-toolbar"] [class*="border-white"] {
        border-color: rgba(15, 23, 42, 0.11) !important;
      }

      [data-slot="desktop-keyboard-shortcuts-popover"] {
        --scroll-edge-fade-color: #0a0a0a;
        --scroll-edge-chevron-color: rgba(255, 255, 255, 0.45);
      }

      [data-slot^="desktop-appearance-"][data-slot$="-popover"] {
        --scroll-edge-fade-color: var(--desktop-appearance-popover-bg, #0a0a0a);
        --scroll-edge-chevron-color: rgba(255, 255, 255, 0.45);
      }

      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) [data-slot^="desktop-appearance-"][data-slot$="-popover"],
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot^="desktop-appearance-"][data-slot$="-popover"] {
        --scroll-edge-fade-color: rgba(255, 255, 255, 0.88);
        --scroll-edge-chevron-color: rgba(15, 23, 42, 0.42);
      }

      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) [data-slot="desktop-keyboard-shortcuts-popover"] {
        --scroll-edge-fade-color: rgba(255, 255, 255, 0.88);
        --scroll-edge-chevron-color: rgba(15, 23, 42, 0.42);
        background: #ffffff !important;
        border-color: #dedede !important;
        color: rgba(23, 23, 23, 0.92) !important;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.14) !important;
      }

      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) [data-slot="desktop-keyboard-shortcuts-popover"] div,
      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) [data-slot="desktop-keyboard-shortcuts-popover"] section,
      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) [data-slot="desktop-keyboard-shortcuts-popover"] kbd {
        border-color: #dddddd !important;
      }

      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) [data-slot="desktop-keyboard-shortcuts-popover"] section {
        background: #f4f4f4 !important;
      }

      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) [data-slot="desktop-keyboard-shortcuts-popover"] [data-slot="desktop-shortcut-platform-toggle"] {
        background: transparent !important;
        border-color: transparent !important;
      }

      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) [data-slot="desktop-keyboard-shortcuts-popover"] [data-slot="desktop-shortcut-platform-button"] {
        color: rgba(23, 23, 23, 0.52) !important;
      }

      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) [data-slot="desktop-keyboard-shortcuts-popover"] [data-slot="desktop-shortcut-platform-button"]:hover {
        background: #eeeeee !important;
        color: rgba(23, 23, 23, 0.86) !important;
      }

      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) [data-slot="desktop-keyboard-shortcuts-popover"] [data-slot="desktop-shortcut-platform-button"][aria-pressed="true"] {
        background: #e5e5e5 !important;
        color: rgba(23, 23, 23, 0.94) !important;
        box-shadow: none !important;
      }

      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) [data-slot="desktop-keyboard-shortcuts-popover"] kbd {
        background: #ffffff !important;
        color: rgba(23, 23, 23, 0.86) !important;
      }

      [data-slot="desktop-keyboard-shortcuts-scrollbar"][data-state="hidden"],
      [data-slot="desktop-shape-preset-shelf-scrollbar"][data-state="hidden"],
      [data-slot="desktop-corner-frame-preset-shelf-scrollbar"][data-state="hidden"],
      [data-slot="desktop-corner-dot-preset-shelf-scrollbar"][data-state="hidden"] {
        opacity: 0;
      }

      [data-slot="desktop-keyboard-shortcuts-scrollbar"],
      [data-slot="desktop-shape-preset-shelf-scrollbar"],
      [data-slot="desktop-corner-frame-preset-shelf-scrollbar"],
      [data-slot="desktop-corner-dot-preset-shelf-scrollbar"] {
        transition: opacity 150ms ease;
      }

      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) [data-slot="desktop-keyboard-shortcuts-scroll-thumb"] {
        background: rgba(23, 23, 23, 0.24) !important;
      }

      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) [data-slot="desktop-keyboard-shortcuts-scroll-thumb"]:hover {
        background: rgba(23, 23, 23, 0.38) !important;
      }

      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) [data-slot="desktop-keyboard-shortcuts-popover"] p,
      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) [data-slot="desktop-keyboard-shortcuts-popover"] h3,
      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) [data-slot="desktop-keyboard-shortcuts-popover"] span {
        color: rgba(23, 23, 23, 0.6) !important;
      }

      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) [data-slot="desktop-keyboard-shortcuts-popover"] h2 {
        color: rgba(23, 23, 23, 0.92) !important;
      }

      [data-slot="desktop-style-preview-surface"] {
        background: rgba(255, 255, 255, 0.045) !important;
        border-color: rgba(255, 255, 255, 0.1) !important;
        box-shadow: none !important;
      }

      [data-slot="desktop-floating-inspector"] [data-desktop-shape-option-preview="true"] {
        background: rgba(0, 0, 0, 0.88) !important;
        border-color: rgba(255, 255, 255, 0.18) !important;
        color: #f8fafc !important;
      }

      [data-desktop-theme="light"] [data-slot="desktop-style-preview-surface"] {
        background: rgba(255, 255, 255, 0.48) !important;
        border-color: rgba(15, 23, 42, 0.11) !important;
      }

      [data-desktop-theme="light"] [data-slot="desktop-floating-inspector"] [data-desktop-shape-option-preview="true"] {
        background: rgba(255, 255, 255, 0.86) !important;
        border-color: rgba(15, 23, 42, 0.14) !important;
        color: #18181b !important;
      }

      [data-desktop-theme="light"] [data-slot="desktop-style-preview-surface"] svg {
        color: rgba(15, 23, 42, 0.9) !important;
      }

      [data-slot="desktop-floating-toolbar"] {
        --desktop-toolbar-fg: rgba(255, 255, 255, 0.56);
        --desktop-toolbar-fg-hover: rgba(255, 255, 255, 0.72);
        --desktop-toolbar-fg-active: rgba(255, 255, 255, 0.94);
        --desktop-toolbar-pill-selected: rgba(255, 255, 255, 0.18);
        --desktop-toolbar-pill-hover: rgba(255, 255, 255, 0.11);
        color: var(--desktop-toolbar-fg);
      }

      [data-slot="desktop-floating-toolbar"] [data-proximity-index] [data-slot="tabs-subtle-icon-rail-icon"] {
        color: var(--desktop-toolbar-fg);
        transition: color 80ms;
      }

      [data-slot="desktop-floating-toolbar"] [data-proximity-index] [data-slot="tabs-subtle-icon-rail-icon"] svg,
      [data-slot="desktop-floating-toolbar"] [data-proximity-index] [data-slot="tabs-subtle-icon-rail-icon"] svg * {
        transition: color 80ms, stroke-width 80ms;
      }

      [data-slot="desktop-floating-toolbar"] [data-proximity-index]:not([data-active]) [data-slot="tabs-subtle-icon-rail-icon"] svg {
        stroke-width: 1.5;
      }

      [data-slot="desktop-floating-toolbar"] [data-proximity-index][data-active] [data-slot="tabs-subtle-icon-rail-icon"] {
        color: var(--desktop-toolbar-fg-hover);
      }

      [data-slot="desktop-floating-toolbar"] [data-proximity-index][data-active] [data-slot="tabs-subtle-icon-rail-icon"] svg {
        stroke-width: 2;
      }

      [data-slot="desktop-floating-toolbar"] [data-proximity-index][data-selected] [data-slot="tabs-subtle-icon-rail-icon"] {
        color: var(--desktop-toolbar-fg-active);
      }

      [data-slot="desktop-floating-toolbar"] button:not([data-proximity-index]):hover {
        color: var(--desktop-toolbar-fg-hover);
      }

      [data-slot="desktop-floating-toolbar"] button:not([data-proximity-index])[aria-pressed="true"] {
        color: var(--desktop-toolbar-fg-active);
      }

      [data-slot="desktop-floating-inspector"] {
        --surface-1: var(--desktop-glass-bg);
        --surface-2: var(--desktop-inspector-section-bg);
        --scroll-edge-fade-color: #0a0a0a;
        --scroll-edge-chevron-color: rgba(255, 255, 255, 0.45);
        --desktop-inspector-fg-primary: rgba(255, 255, 255, 0.94);
        --desktop-inspector-fg-secondary: rgba(255, 255, 255, 0.76);
        --desktop-inspector-fg-tertiary: rgba(255, 255, 255, 0.50);
        --desktop-inspector-fg-muted: rgba(255, 255, 255, 0.42);
        --desktop-inspector-fg-label: var(--desktop-inspector-fg-secondary);
        --desktop-inspector-type-panel: 0.9375rem;
        --desktop-inspector-type-value: 0.8125rem;
        --desktop-inspector-type-label: 0.6875rem;
        --desktop-inspector-type-caption: 0.625rem;
        --desktop-inspector-section-bg: rgba(255, 255, 255, 0.055);
        --desktop-inspector-header-bg: rgba(255, 255, 255, 0.025);
        --desktop-inspector-footer-bg: rgba(0, 0, 0, 0.18);
        --desktop-inspector-control-bg: transparent;
        --desktop-inspector-control-hover-bg: rgba(255, 255, 255, 0.09);
        --desktop-inspector-control-active-bg: rgba(255, 255, 255, 0.13);
        --desktop-inspector-control-border-hover: rgba(255, 255, 255, 0.12);
        --desktop-inspector-layer-selected-bg: rgba(255, 255, 255, 0.10);
        --desktop-inspector-option-selected-bg: rgba(255, 255, 255, 0.14);
        --desktop-inspector-option-selected-border: rgba(255, 255, 255, 0.24);
        --desktop-inspector-option-selected-fg: rgba(255, 255, 255, 0.96);
        --desktop-inspector-field-bg: rgba(0, 0, 0, 0.22);
        --desktop-inspector-focus: rgba(255, 255, 255, 0.36);
        --desktop-inspector-swatch-ring: rgba(255, 255, 255, 0.88);
        --desktop-inspector-morph-filter-bg: var(--workspace-shell, #1f1f1f);
        color: var(--desktop-inspector-fg-secondary);
      }

      [data-desktop-theme="dark"] [data-slot="desktop-floating-inspector"] {
        --scroll-edge-fade-color: #0a0a0a;
        --scroll-edge-chevron-color: rgba(255, 255, 255, 0.45);
      }

      [data-desktop-theme="light"] [data-slot="desktop-floating-inspector"] {
        --surface-1: var(--desktop-glass-bg);
        --surface-2: var(--desktop-inspector-section-bg);
        --scroll-edge-fade-color: rgba(255, 255, 255, 0.88);
        --scroll-edge-chevron-color: rgba(15, 23, 42, 0.42);
        --desktop-inspector-fg-primary: rgba(15, 23, 42, 0.90);
        --desktop-inspector-fg-secondary: rgba(15, 23, 42, 0.66);
        --desktop-inspector-fg-tertiary: rgba(15, 23, 42, 0.44);
        --desktop-inspector-fg-muted: rgba(15, 23, 42, 0.38);
        --desktop-inspector-fg-label: rgba(15, 23, 42, 0.85);
        --desktop-inspector-type-panel: 0.9375rem;
        --desktop-inspector-type-value: 0.8125rem;
        --desktop-inspector-type-label: 0.6875rem;
        --desktop-inspector-type-caption: 0.625rem;
        --desktop-inspector-section-bg: rgba(15, 23, 42, 0.032);
        --desktop-inspector-header-bg: rgba(15, 23, 42, 0.025);
        --desktop-inspector-footer-bg: rgba(15, 23, 42, 0.045);
        --desktop-inspector-control-bg: transparent;
        --desktop-inspector-control-hover-bg: rgba(15, 23, 42, 0.1);
        --desktop-inspector-control-active-bg: rgba(15, 23, 42, 0.14);
        --desktop-inspector-control-border-hover: rgba(15, 23, 42, 0.16);
        --desktop-inspector-layer-selected-bg: rgba(255, 255, 255, 0.96);
        --desktop-inspector-option-selected-bg: rgba(255, 255, 255, 0.96);
        --desktop-inspector-option-selected-border: rgba(15, 23, 42, 0.22);
        --desktop-inspector-option-selected-fg: rgba(15, 23, 42, 0.94);
        --desktop-inspector-field-bg: rgba(255, 255, 255, 0.62);
        --desktop-inspector-focus: rgba(15, 23, 42, 0.36);
        --desktop-inspector-swatch-ring: rgba(15, 23, 42, 0.88);
        --desktop-inspector-morph-filter-bg: #ffffff;
        color: var(--desktop-inspector-fg-secondary);
      }

      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) [data-slot^="desktop-appearance-"][data-slot$="-popover"] [data-slot="desktop-floating-inspector"] {
        --surface-1: var(--desktop-glass-bg);
        --surface-2: var(--desktop-inspector-section-bg);
        --scroll-edge-fade-color: rgba(255, 255, 255, 0.88);
        --scroll-edge-chevron-color: rgba(15, 23, 42, 0.42);
        --desktop-inspector-fg-primary: rgba(15, 23, 42, 0.90);
        --desktop-inspector-fg-secondary: rgba(15, 23, 42, 0.66);
        --desktop-inspector-fg-tertiary: rgba(15, 23, 42, 0.44);
        --desktop-inspector-fg-muted: rgba(15, 23, 42, 0.38);
        --desktop-inspector-fg-label: rgba(15, 23, 42, 0.85);
        --desktop-inspector-type-panel: 0.9375rem;
        --desktop-inspector-type-value: 0.8125rem;
        --desktop-inspector-type-label: 0.6875rem;
        --desktop-inspector-type-caption: 0.625rem;
        --desktop-inspector-section-bg: rgba(15, 23, 42, 0.032);
        --desktop-inspector-header-bg: rgba(15, 23, 42, 0.025);
        --desktop-inspector-footer-bg: rgba(15, 23, 42, 0.045);
        --desktop-inspector-control-bg: transparent;
        --desktop-inspector-control-hover-bg: rgba(15, 23, 42, 0.1);
        --desktop-inspector-control-active-bg: rgba(15, 23, 42, 0.14);
        --desktop-inspector-control-border-hover: rgba(15, 23, 42, 0.16);
        --desktop-inspector-layer-selected-bg: rgba(255, 255, 255, 0.96);
        --desktop-inspector-option-selected-bg: rgba(255, 255, 255, 0.96);
        --desktop-inspector-option-selected-border: rgba(15, 23, 42, 0.22);
        --desktop-inspector-option-selected-fg: rgba(15, 23, 42, 0.94);
        --desktop-inspector-field-bg: rgba(255, 255, 255, 0.62);
        --desktop-inspector-focus: rgba(15, 23, 42, 0.36);
        --desktop-inspector-swatch-ring: rgba(15, 23, 42, 0.88);
        color: var(--desktop-inspector-fg-secondary);
      }

      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) [data-slot^="desktop-appearance-"][data-slot$="-popover"] [data-slot="elastic-slider"] {
        --elastic-slider-bg: rgba(15, 23, 42, 0.035);
        --elastic-slider-fill: rgba(15, 23, 42, 0.052);
        --elastic-slider-fill-active: rgba(15, 23, 42, 0.085);
        --elastic-slider-hash: rgba(15, 23, 42, 0.13);
        --elastic-slider-handle: rgba(15, 23, 42, 0.46);
      }

      [data-slot^="desktop-appearance-"][data-slot$="-popover"] [data-slot="desktop-appearance-filter-select-trigger"] {
        min-width: 0 !important;
        border-color: var(--desktop-inspector-control-border-hover) !important;
        background-color: var(--desktop-inspector-field-bg) !important;
        color: var(--desktop-inspector-fg-primary) !important;
      }

      [data-slot^="desktop-appearance-"][data-slot$="-popover"] [data-slot="desktop-appearance-filter-select-trigger"]:hover {
        background-color: var(--desktop-inspector-control-hover-bg) !important;
        border-color: var(--desktop-inspector-control-border-hover) !important;
      }

      [data-slot^="desktop-appearance-"][data-slot$="-popover"] [data-slot="desktop-appearance-filter-select-trigger"]:focus-visible {
        ring-color: var(--desktop-inspector-focus) !important;
      }

      [data-slot^="desktop-appearance-"][data-slot$="-popover"] [data-slot="desktop-appearance-filter-select-trigger"] svg {
        color: var(--desktop-inspector-fg-tertiary) !important;
      }

      body:has([data-slot^="desktop-appearance-"][data-slot$="-popover"]) [data-slot="desktop-appearance-filter-select-menu"] {
        --foreground: rgba(255, 255, 255, 0.94);
        --muted-foreground: rgba(255, 255, 255, 0.5);
        --background: var(--desktop-appearance-popover-bg);
        --border: var(--desktop-appearance-popover-border);
        --color-hover: var(--desktop-inspector-control-hover-bg);
        --color-active: var(--desktop-inspector-option-selected-bg);
        --surface-1: var(--desktop-appearance-popover-bg);
        --surface-2: rgba(255, 255, 255, 0.055);
        --surface-3: rgba(255, 255, 255, 0.14);
        background-color: var(--desktop-appearance-popover-bg) !important;
        border: 1px solid var(--desktop-appearance-popover-border) !important;
        box-shadow: var(--desktop-appearance-popover-shadow) !important;
        color: var(--desktop-inspector-fg-secondary) !important;
      }

      body:has([data-slot^="desktop-appearance-"][data-slot$="-popover"]) [data-slot="desktop-appearance-filter-select-menu"] .desktop-appearance-filter-select-item {
        color: var(--desktop-inspector-fg-tertiary) !important;
      }

      body:has([data-slot^="desktop-appearance-"][data-slot$="-popover"]) [data-slot="desktop-appearance-filter-select-menu"] .desktop-appearance-filter-select-item.text-foreground {
        color: var(--desktop-inspector-fg-primary) !important;
      }

      body:has([data-slot^="desktop-appearance-"][data-slot$="-popover"]) [data-slot="desktop-appearance-filter-select-menu"] .desktop-appearance-filter-select-item svg {
        color: var(--desktop-inspector-fg-primary) !important;
      }

      body:has([data-slot^="desktop-appearance-"][data-slot$="-popover"]) [data-slot="desktop-appearance-filter-select-menu"] .bg-hover {
        background-color: var(--desktop-inspector-control-hover-bg) !important;
      }

      body:has([data-slot^="desktop-appearance-"][data-slot$="-popover"]) [data-slot="desktop-appearance-filter-select-menu"] .bg-active {
        background-color: var(--desktop-inspector-option-selected-bg) !important;
      }

      [data-slot^="desktop-appearance-"][data-slot$="-popover"] [data-slot="desktop-appearance-filter-select-trigger"] [data-placeholder] {
        color: var(--desktop-inspector-fg-tertiary) !important;
      }

      [data-slot^="desktop-appearance-"][data-slot$="-popover"] [data-slot="desktop-appearance-filter-select-trigger"] .text-muted-foreground {
        color: var(--desktop-inspector-fg-tertiary) !important;
      }

      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) [data-slot^="desktop-appearance-"][data-slot$="-popover"] [data-slot="desktop-appearance-filter-select-trigger"],
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot^="desktop-appearance-"][data-slot$="-popover"] [data-slot="desktop-appearance-filter-select-trigger"] {
        border-color: var(--desktop-inspector-control-border-hover) !important;
        background-color: var(--desktop-inspector-field-bg) !important;
        color: var(--desktop-inspector-fg-primary) !important;
      }

      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) [data-slot^="desktop-appearance-"][data-slot$="-popover"] [data-slot="desktop-appearance-filter-select-trigger"]:hover,
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot^="desktop-appearance-"][data-slot$="-popover"] [data-slot="desktop-appearance-filter-select-trigger"]:hover {
        background-color: var(--desktop-inspector-control-hover-bg) !important;
      }

      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) [data-slot^="desktop-appearance-"][data-slot$="-popover"] [data-slot="desktop-appearance-filter-select-menu"],
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot^="desktop-appearance-"][data-slot$="-popover"] [data-slot="desktop-appearance-filter-select-menu"] {
        --foreground: rgba(15, 23, 42, 0.9);
        --muted-foreground: rgba(15, 23, 42, 0.44);
        --background: var(--desktop-appearance-popover-bg);
        --border: var(--desktop-appearance-popover-border);
        --color-hover: var(--desktop-inspector-control-hover-bg);
        --color-active: var(--desktop-inspector-option-selected-bg);
        --surface-1: var(--desktop-appearance-popover-bg);
        --surface-2: rgba(15, 23, 42, 0.032);
        --surface-3: rgba(255, 255, 255, 0.96);
        background-color: var(--desktop-appearance-popover-bg) !important;
        border-color: var(--desktop-appearance-popover-border) !important;
        color: var(--desktop-inspector-fg-secondary) !important;
      }

      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) [data-slot^="desktop-appearance-"][data-slot$="-popover"] [data-slot="desktop-appearance-filter-select-menu"] .desktop-appearance-filter-select-item,
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot^="desktop-appearance-"][data-slot$="-popover"] [data-slot="desktop-appearance-filter-select-menu"] .desktop-appearance-filter-select-item {
        color: var(--desktop-inspector-fg-tertiary) !important;
      }

      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) [data-slot^="desktop-appearance-"][data-slot$="-popover"] [data-slot="desktop-appearance-filter-select-menu"] .desktop-appearance-filter-select-item.text-foreground,
      body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot^="desktop-appearance-"][data-slot$="-popover"] [data-slot="desktop-appearance-filter-select-menu"] .desktop-appearance-filter-select-item.text-foreground {
        color: var(--desktop-inspector-fg-primary) !important;
      }

      [data-slot="desktop-color-picker-popover"] {
        --color-picker-bg: rgba(23, 24, 29, 0.95);
        --color-picker-border: rgba(255, 255, 255, 0.1);
        --color-picker-fg: #ffffff;
        --color-picker-muted-fg: rgba(255, 255, 255, 0.64);
        --color-picker-control-bg: rgba(0, 0, 0, 0.22);
        --color-picker-control-hover-bg: rgba(255, 255, 255, 0.08);
        --color-picker-control-border: rgba(255, 255, 255, 0.12);
        --color-picker-focus: rgba(255, 255, 255, 0.38);
        --color-picker-highlight: rgba(255, 255, 255, 0.1);
        --color-picker-swatch-inner: rgba(255, 255, 255, 0.18);
        --desktop-color-picker-popover-bg: rgba(23, 24, 29, 0.95);
        --desktop-color-picker-popover-border: rgba(255, 255, 255, 0.1);
        --desktop-color-picker-popover-fg: #ffffff;
        --checker-a: #6b6b6b;
        --checker-b: #9a9a9a;
        --foreground: var(--desktop-color-picker-popover-fg);
        --muted-foreground: var(--color-picker-muted-fg);
        --background: var(--desktop-color-picker-popover-bg);
        --border: var(--color-picker-control-border);
      }

      [data-slot="desktop-color-picker-popover"] [data-slot="color-picker"] {
        background-color: var(--desktop-color-picker-popover-bg) !important;
        color: var(--desktop-color-picker-popover-fg);
        box-shadow: none !important;
      }

      [data-slot="desktop-color-picker-popover"] [data-slot="color-picker"] :is(button, input) {
        color: var(--desktop-color-picker-popover-fg);
      }

      [data-slot="desktop-color-picker-popover"] [data-slot="color-picker"] button:hover,
      [data-slot="desktop-color-picker-popover"] [data-slot="color-picker"] button:focus-visible,
      [data-slot="desktop-color-picker-popover"] [data-slot="color-picker"] .bg-active,
      [data-slot="desktop-color-picker-popover"] [data-slot="color-picker"] div:has(> input):hover,
      [data-slot="desktop-color-picker-popover"] [data-slot="color-picker"] div:has(> input):focus-within {
        background-color: var(--color-picker-control-hover-bg) !important;
        color: var(--desktop-color-picker-popover-fg) !important;
      }

      [data-slot="desktop-color-picker-popover"] [data-slot="color-picker"] .text-muted-foreground {
        color: var(--color-picker-muted-fg) !important;
      }

      [data-slot="desktop-color-picker-popover"] [data-slot="color-picker"] .text-foreground,
      [data-slot="desktop-color-picker-popover"] [data-slot="color-picker"] .hover\:text-foreground:hover {
        color: var(--desktop-color-picker-popover-fg) !important;
      }

      body:has([data-slot="desktop-floating-toolbar-root"][data-desktop-theme="light"]) [data-slot="desktop-color-picker-popover"] {
        --color-picker-bg: rgba(255, 255, 255, 0.96);
        --color-picker-border: rgba(15, 23, 42, 0.12);
        --color-picker-fg: #18181b;
        --color-picker-muted-fg: rgba(15, 23, 42, 0.58);
        --color-picker-control-bg: rgba(15, 23, 42, 0.04);
        --color-picker-control-hover-bg: rgba(15, 23, 42, 0.08);
        --color-picker-control-border: rgba(15, 23, 42, 0.12);
        --color-picker-focus: rgba(15, 23, 42, 0.34);
        --color-picker-highlight: rgba(255, 255, 255, 0.9);
        --color-picker-swatch-inner: rgba(15, 23, 42, 0.16);
        --desktop-color-picker-popover-bg: rgba(255, 255, 255, 0.96);
        --desktop-color-picker-popover-border: rgba(15, 23, 42, 0.12);
        --desktop-color-picker-popover-fg: #18181b;
        --checker-a: #b8b8b8;
        --checker-b: #e0e0e0;
        --foreground: var(--desktop-color-picker-popover-fg);
        --muted-foreground: var(--color-picker-muted-fg);
        --background: var(--desktop-color-picker-popover-bg);
        --border: var(--color-picker-control-border);
      }

      [data-slot="desktop-color-picker-popover"] [data-slot="color-picker-alpha"] .border-border {
        border-color: var(--color-picker-control-border) !important;
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-picker-control-border) 65%, transparent);
      }

      [data-slot="desktop-floating-inspector"] :is(input, textarea, select) {
        background-color: var(--desktop-inspector-field-bg) !important;
        border-color: transparent !important;
        color: currentColor !important;
        box-shadow: none !important;
      }

      [data-slot="desktop-floating-inspector"] [data-slot="elastic-slider-label"] {
        color: var(--desktop-inspector-fg-label) !important;
        font-size: var(--desktop-inspector-type-label) !important;
        font-weight: 500 !important;
      }

      [data-desktop-theme="light"] [data-slot="desktop-floating-inspector"] [data-slot="elastic-slider"] {
        --elastic-slider-bg: rgba(15, 23, 42, 0.035);
        --elastic-slider-fill: rgba(15, 23, 42, 0.052);
        --elastic-slider-fill-active: rgba(15, 23, 42, 0.085);
        --elastic-slider-hash: rgba(15, 23, 42, 0.13);
        --elastic-slider-handle: rgba(15, 23, 42, 0.46);
      }

      [data-slot="desktop-floating-inspector"] :is(input, textarea, select):focus,
      [data-slot="desktop-floating-inspector"] :is(input, textarea, select):focus-visible {
        border-color: transparent !important;
        box-shadow: inset 0 0 0 1px var(--desktop-inspector-focus) !important;
      }

      [data-desktop-theme="light"] [data-slot="desktop-floating-inspector"] input::placeholder,
      [data-desktop-theme="light"] [data-slot="desktop-floating-inspector"] textarea::placeholder {
        color: var(--desktop-inspector-fg-muted) !important;
      }

      [data-slot="desktop-floating-inspector"] button {
        border-color: transparent !important;
      }

      [data-slot="desktop-floating-inspector"] button[aria-pressed="true"]:not([data-desktop-tool-button="true"]):not([data-desktop-preview-option="true"]):not([data-desktop-content-type-option="true"]):not([data-desktop-motion-loader-option="true"]):not([data-desktop-option-tile="true"]):not([data-slot="desktop-layer-stack-icon-toggle"]):not([data-slot="desktop-layer-row"]) {
        background-color: var(--desktop-inspector-option-selected-bg) !important;
        border-color: transparent !important;
        color: var(--desktop-inspector-option-selected-fg) !important;
        box-shadow: none !important;
      }

      [data-slot="desktop-floating-inspector"] button[aria-pressed="true"]:not([data-desktop-tool-button="true"]):not([data-desktop-preview-option="true"]):not([data-desktop-content-type-option="true"]):not([data-desktop-motion-loader-option="true"]):not([data-desktop-option-tile="true"]):not([data-slot="desktop-layer-stack-icon-toggle"]):not([data-slot="desktop-layer-row"]):hover {
        background-color: var(--desktop-inspector-option-selected-bg) !important;
        border-color: transparent !important;
        color: var(--desktop-inspector-option-selected-fg) !important;
        filter: none !important;
      }

      [data-slot="desktop-floating-inspector"] button:is([data-desktop-preview-option="true"], [data-desktop-content-type-option="true"], [data-desktop-motion-loader-option="true"], [data-desktop-option-tile="true"])[aria-pressed="true"]:not([data-desktop-animated-option-selection="true"]) {
        background-color: var(--desktop-inspector-option-selected-bg) !important;
        border-color: var(--desktop-inspector-option-selected-border) !important;
      }

      [data-slot="desktop-floating-inspector"] [data-slot="desktop-inspector-option-selection-indicator"] {
        background-color: var(--desktop-inspector-option-selected-bg) !important;
        border-color: var(--desktop-inspector-option-selected-border) !important;
      }

      [data-slot="desktop-floating-inspector"] button[aria-pressed="true"]:not([data-desktop-tool-button="true"]):not([data-slot="desktop-layer-stack-icon-toggle"]):not([data-slot="desktop-layer-row"]) :is(span, svg):not([data-desktop-adaptive-option-preview="true"]) {
        color: var(--desktop-inspector-option-selected-fg) !important;
      }

      [data-slot="desktop-floating-inspector"] button[data-slot="desktop-layer-row"] {
        background-color: transparent !important;
        border-color: transparent !important;
        box-shadow: none !important;
        color: inherit !important;
      }

      [data-slot="desktop-floating-inspector"] button[data-slot="desktop-layer-row"]:hover,
      [data-slot="desktop-floating-inspector"] button[data-slot="desktop-layer-row"]:active,
      [data-slot="desktop-floating-inspector"] button[data-slot="desktop-layer-row"][aria-current="true"] {
        background-color: transparent !important;
        border-color: transparent !important;
        box-shadow: none !important;
        color: inherit !important;
      }

      [data-slot="desktop-floating-inspector"] [data-slot="desktop-layer-row-shell"] {
        background-color: transparent !important;
        border-color: transparent !important;
      }

      [data-slot="desktop-floating-inspector"] [data-slot="desktop-layer-row-shell"]:hover {
        background-color: var(--desktop-inspector-control-hover-bg) !important;
      }

      [data-slot="desktop-floating-inspector"] [data-slot="desktop-layer-row-shell"]:active {
        background-color: var(--desktop-inspector-control-active-bg) !important;
      }

      [data-slot="desktop-floating-inspector"] [data-slot="desktop-layer-row-shell"][data-selected="true"] {
        background-color: var(--desktop-inspector-layer-selected-bg) !important;
        border-color: transparent !important;
      }

      [data-slot="desktop-floating-inspector"] [data-slot="desktop-layer-row-shell"][data-selected="true"]:hover {
        background-color: var(--desktop-inspector-control-hover-bg) !important;
      }

      [data-slot="desktop-floating-inspector"] [data-slot="desktop-layer-row-shell"][data-selected="true"]:active {
        background-color: var(--desktop-inspector-control-active-bg) !important;
      }

      [data-desktop-theme="light"] [data-slot="desktop-floating-inspector"] [data-slot="desktop-layer-row-shell"][data-selected="true"]:hover,
      [data-desktop-theme="light"] [data-slot="desktop-floating-inspector"] [data-slot="desktop-layer-row-shell"][data-selected="true"]:active {
        background-color: var(--desktop-inspector-layer-selected-bg) !important;
      }

      [data-slot="desktop-floating-inspector"] [data-slot="draggable-list-item"] {
        background-color: transparent !important;
        box-shadow: none !important;
      }

      [data-slot="desktop-floating-inspector"] [data-slot="draggable-list-item"] [data-slot="desktop-layer-row-shell"] {
        box-shadow: none !important;
      }

      [data-slot="desktop-floating-inspector"] button[data-slot="desktop-layer-stack-icon-toggle"] {
        background-color: transparent !important;
        border-color: transparent !important;
        box-shadow: none !important;
      }

      [data-slot="desktop-floating-inspector"] button[data-slot="desktop-layer-stack-icon-toggle"]:hover,
      [data-slot="desktop-floating-inspector"] button[data-slot="desktop-layer-stack-icon-toggle"]:active,
      [data-slot="desktop-floating-inspector"] button[data-slot="desktop-layer-stack-icon-toggle"][aria-pressed="true"],
      [data-slot="desktop-floating-inspector"] button[data-slot="desktop-layer-stack-icon-toggle"][aria-pressed="true"]:hover {
        background-color: transparent !important;
        border-color: transparent !important;
        box-shadow: none !important;
      }

      [data-slot="desktop-floating-inspector"] button[data-slot="desktop-layer-stack-icon-toggle"][aria-pressed="true"],
      [data-slot="desktop-floating-inspector"] button[data-slot="desktop-layer-stack-icon-toggle"][aria-pressed="false"] {
        color: var(--desktop-inspector-fg-primary) !important;
      }

      [data-slot="desktop-floating-inspector"] button[data-slot="desktop-layer-stack-icon-toggle"] svg {
        color: currentColor !important;
      }

      [data-slot="desktop-floating-inspector"] button[data-desktop-preview-option="true"][aria-pressed="true"]:hover [data-desktop-adaptive-option-preview="true"] {
        filter: none !important;
      }

      [data-desktop-theme="light"] [data-slot="desktop-floating-inspector"] button:is([data-desktop-preview-option="true"], [data-desktop-content-type-option="true"], [data-desktop-motion-loader-option="true"], [data-desktop-option-tile="true"]) {
        border-color: transparent !important;
        color: var(--desktop-inspector-fg-tertiary) !important;
      }

      [data-desktop-theme="light"] [data-slot="desktop-floating-inspector"] button:is([data-desktop-preview-option="true"], [data-desktop-content-type-option="true"], [data-desktop-motion-loader-option="true"], [data-desktop-option-tile="true"]):hover:not([aria-pressed="true"]) {
        background-color: rgba(15, 23, 42, 0.06) !important;
        color: var(--desktop-inspector-fg-secondary) !important;
      }

      [data-desktop-theme="light"] [data-slot="desktop-floating-inspector"] button:is([data-desktop-preview-option="true"], [data-desktop-content-type-option="true"], [data-desktop-motion-loader-option="true"], [data-desktop-option-tile="true"])[aria-pressed="true"]:not([data-desktop-animated-option-selection="true"]) {
        background-color: var(--desktop-inspector-option-selected-bg) !important;
        border-color: var(--desktop-inspector-option-selected-border) !important;
      }

      [data-desktop-theme="light"] [data-slot="desktop-floating-inspector"] button[aria-pressed="true"]:not([data-desktop-tool-button="true"]):not([data-desktop-preview-option="true"]):not([data-desktop-content-type-option="true"]):not([data-desktop-motion-loader-option="true"]):not([data-desktop-option-tile="true"]):not([data-slot="desktop-layer-stack-icon-toggle"]):not([data-slot="desktop-layer-row"]) {
        background-color: var(--desktop-inspector-option-selected-bg) !important;
        border-color: transparent !important;
        color: var(--desktop-inspector-option-selected-fg) !important;
      }

      [data-desktop-theme="light"] [data-slot="desktop-export-download"] {
        background-color: #111827 !important;
        color: #ffffff !important;
      }

      [data-desktop-theme="light"] [data-slot="desktop-toolbar-separator"] {
        background-color: rgba(15, 23, 42, 0.11) !important;
      }

      [data-slot="desktop-left-toolbar-shell"] {
        background: var(--desktop-glass-bg) !important;
        border-color: rgba(255, 255, 255, 0.06) !important;
        border-radius: var(--desktop-settings-toolbar-corner-radius, 36px) !important;
        box-shadow: var(--desktop-glass-panel-shadow) !important;
        backdrop-filter: blur(40px) !important;
      }

      [data-slot="desktop-left-toolbar-shell"] [data-slot="desktop-floating-toolbar"],
      [data-slot="desktop-left-toolbar-shell"] [data-slot="desktop-floating-inspector"] {
        background: transparent !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
      }

      [data-desktop-theme="light"] [data-slot="desktop-left-toolbar-shell"] {
        background: var(--desktop-glass-bg) !important;
        border-color: rgba(15, 23, 42, 0.12) !important;
        box-shadow: 0 24px 64px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.86) !important;
      }

      [data-desktop-theme="light"] [data-slot="desktop-floating-inspector"] [data-desktop-shape-option-preview="true"] {
        background: rgba(255, 255, 255, 0.86) !important;
        border-color: rgba(15, 23, 42, 0.14) !important;
        color: #18181b !important;
      }

      [data-desktop-theme="light"] [data-slot="desktop-floating-inspector"] [data-desktop-shape-option-preview="true"] svg {
        color: #18181b !important;
      }

      [data-slot="desktop-floating-inspector"] [data-desktop-adaptive-option-preview="true"] {
        background: transparent !important;
        border-color: transparent !important;
        color: #f8fafc !important;
      }

      [data-slot="desktop-floating-inspector"] [data-desktop-adaptive-option-preview="true"] svg {
        color: #f8fafc !important;
      }

      [data-desktop-theme="light"] [data-slot="desktop-floating-inspector"] [data-desktop-adaptive-option-preview="true"] {
        background: transparent !important;
        border-color: transparent !important;
        color: #18181b !important;
      }

      [data-desktop-theme="light"] [data-slot="desktop-floating-inspector"] [data-desktop-adaptive-option-preview="true"] svg {
        color: #18181b !important;
      }

      [data-slot="desktop-floating-inspector"] button[aria-pressed="true"]:not([data-desktop-tool-button="true"]):not([data-desktop-preview-option="true"]):not([data-desktop-content-type-option="true"]):not([data-desktop-motion-loader-option="true"]):not([data-desktop-option-tile="true"]):not([data-slot="desktop-layer-stack-icon-toggle"]):not([data-slot="desktop-layer-row"]) {
        background-color: var(--desktop-inspector-option-selected-bg) !important;
        border-color: transparent !important;
        color: var(--desktop-inspector-option-selected-fg) !important;
      }

      [data-slot="desktop-floating-inspector"] [role="tablist"] > .bg-active {
        background-color: var(--desktop-inspector-option-selected-bg) !important;
      }

      [data-slot="desktop-floating-inspector"] [role="tablist"] [role="tab"][aria-selected="true"] .text-foreground,
      [data-slot="desktop-floating-inspector"] [role="tablist"] [role="tab"][aria-selected="true"] .text-muted-foreground {
        color: var(--desktop-inspector-option-selected-fg) !important;
      }

      [data-slot="desktop-floating-inspector"] [role="tablist"] [role="tab"] .text-muted-foreground {
        color: var(--desktop-inspector-fg-tertiary) !important;
      }

      [data-slot="desktop-floating-inspector"] [role="tablist"] [role="tab"][aria-selected="false"] .text-foreground,
      [data-slot="desktop-floating-inspector"] [role="tablist"] [role="tab"][aria-selected="false"]:hover .text-muted-foreground {
        color: var(--desktop-inspector-fg-primary) !important;
      }

      [data-slot="desktop-floating-inspector"] button[aria-pressed="true"]:not([data-desktop-tool-button="true"]):not([data-desktop-preview-option="true"]):not([data-desktop-content-type-option="true"]):not([data-desktop-motion-loader-option="true"]):not([data-desktop-option-tile="true"]):not([data-slot="desktop-layer-stack-icon-toggle"]):not([data-slot="desktop-layer-row"]):hover {
        background-color: var(--desktop-inspector-option-selected-bg) !important;
        border-color: transparent !important;
        color: var(--desktop-inspector-option-selected-fg) !important;
        filter: none !important;
      }

      [data-slot="desktop-floating-inspector"] button[data-desktop-preview-option="true"][aria-pressed="true"]:hover [data-desktop-adaptive-option-preview="true"] {
        filter: none !important;
      }

      [data-slot="desktop-floating-inspector"] [data-slot="desktop-color-picker"] {
        background-color: transparent !important;
        border: none !important;
        box-shadow: none !important;
      }

      [data-slot="desktop-floating-inspector"] [data-slot="desktop-color-swatch-fill"] {
        border-color: var(--desktop-inspector-swatch-ring) !important;
      }

      [data-slot="desktop-color-swatch-ring"].desktop-inspector-color-swatch,
      input.desktop-inspector-color-swatch[data-slot="desktop-color-swatch-ring"] {
        appearance: none;
        -webkit-appearance: none;
        border: none;
        padding: 0;
        background: transparent;
        box-shadow: inset 0 0 0 2px var(--desktop-inspector-swatch-ring);
      }

      input.desktop-inspector-color-swatch[data-slot="desktop-color-swatch-ring"]::-webkit-color-swatch-wrapper {
        padding: 4px;
      }

      input.desktop-inspector-color-swatch[data-slot="desktop-color-swatch-ring"]::-webkit-color-swatch {
        border: none;
        border-radius: 9999px;
      }

      input.desktop-inspector-color-swatch[data-slot="desktop-color-swatch-ring"]::-moz-color-swatch {
        border: none;
        border-radius: 9999px;
      }

      [data-desktop-theme="light"] [data-slot="desktop-floating-inspector"] [data-slot="desktop-color-picker"] {
        border: none !important;
      }
    `}</style>
  )
}

function DesktopInspectorHeader({ title }: { title: string }) {
  return (
    <div className={DESKTOP_INSPECTOR_HEADER_CLASS}>
      <h2 className={DESKTOP_INSPECTOR_PANEL_TITLE_CLASS}>{title}</h2>
    </div>
  )
}

function getDesktopAdaptiveOptionPreviewStyle(
  desktopTheme: DesktopThemeMode,
): CSSProperties {
  return {
    backgroundColor: "transparent",
    color: desktopTheme === "light" ? "#18181b" : "#f8fafc",
  }
}

function DesktopLogoInspector({
  desktopTheme,
  onLogoSettingsChange,
  settings,
}: {
  desktopTheme: DesktopThemeMode
  onLogoSettingsChange: (patch: DesktopLogoSettingsPatch) => void
  settings: DesktopLogoSettings
}) {
  const [library, setLibrary] = useState<IconstackLibraryId | "all">("all")
  const [query, setQuery] = useState("")
  const isLibraryFilterActive = library !== "all"
  const popularBrandIcons = useMemo(
    () => POPULAR_BRAND_ICON_IDS.map((id) => getBrandIconById(id)),
    [],
  )
  const curatedIconSlots = useMemo(() => filterCuratedIconstackIcons(library), [library])
  const { canSearch, error, isLoading, previewSvgs, results, total } = useIconstackIconSearch({
    enabled: settings.sourceMode === "brand",
    library,
    query,
  })
  const {
    error: curatedError,
    icons: curatedIcons,
    isLoading: isCuratedLoading,
    previewSvgs: curatedPreviewSvgs,
  } = useIconstackCuratedIcons({
    enabled: settings.sourceMode === "brand" && !canSearch,
    library,
  })

  return (
    <div data-slot="desktop-logo-inspector" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <DesktopInspectorHeader title="Logo" />

      <DesktopInspectorScrollArea>
        <DesktopInspectorSection>
          <DesktopInspectorLabel>Source</DesktopInspectorLabel>
          <DesktopInspectorSegmentedControl
            columns={3}
            dataSlot="desktop-logo-source-mode"
            itemAriaLabel={(option) => `Use ${option.label} logo source`}
            itemClassName="px-1.5"
            items={DESKTOP_LOGO_SOURCE_OPTIONS}
            value={settings.sourceMode}
            onValueChange={(sourceMode) => onLogoSettingsChange({ sourceMode })}
          />
        </DesktopInspectorSection>

        {settings.sourceMode === "brand" ? (
          <DesktopInspectorSection className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}>
            <div className="flex min-w-0 items-center gap-2">
              <DesktopInspectorSearchInput
                aria-label="Search logo icons"
                className="h-8 min-w-0 w-full flex-1"
                iconClassName="left-3"
                inputClassName="rounded-full pl-8 pr-3"
                placeholder="Search"
                value={query}
                onValueChange={setQuery}
              />
              <DesktopInspectorMorphFilterMenu
                ariaLabel="Filter logo icon libraries"
                data-slot="desktop-logo-library-morph"
                icon={
                  <HugeiconsIcon
                    icon={FilterMailIcon}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.8}
                  />
                }
                isActive={isLibraryFilterActive}
                menuDataSlot="desktop-inspector-filter-menu desktop-logo-library-filter-menu"
                options={DESKTOP_ICONSTACK_LIBRARY_OPTIONS}
                triggerDataSlot="desktop-inspector-filter-trigger desktop-logo-library-filter-trigger"
                value={library}
                onValueChange={setLibrary}
              />
            </div>

            <DesktopInspectorOptionGridScrollArea
              ariaLabel="Brand icons"
              className="mt-2"
              columns={4}
              dataSlot="desktop-logo-brand-icons-scroll-area"
              shelfDataSlot="desktop-logo-brand-icons"
              variant="compact"
            >
              <DesktopInspectorAnimatedOptionGrid
                columns={4}
                selectedKey={settings.selectedBrandIconId}
              >
                {!canSearch ? (
                  <>
                    {popularBrandIcons.map((brandIcon) => (
                      <DesktopBrandIconButton
                        brandIcon={brandIcon}
                        key={brandIcon.id}
                        selected={settings.selectedBrandIconId === brandIcon.id}
                        onClick={() =>
                          onLogoSettingsChange({
                            selectedBrandIconId: brandIcon.id,
                          })
                        }
                      />
                    ))}
                    {isCuratedLoading
                      ? curatedIconSlots.map((icon) => (
                          <DesktopIconstackIconSkeleton key={`${icon.library}-${icon.id}`} />
                        ))
                      : curatedIcons.map((result) => (
                          <DesktopIconstackIconButton
                            key={result.id}
                            previewSvg={curatedPreviewSvgs[result.id]}
                            result={result}
                            selected={
                              settings.selectedBrandIconId === toIconstackSelectionId(result)
                            }
                            onClick={() =>
                              onLogoSettingsChange({
                                selectedBrandIconId: toIconstackSelectionId(result),
                              })
                            }
                          />
                        ))}
                    {curatedError ? (
                      <p
                        className={cn(
                          "col-span-4 px-1 py-2 text-center",
                          DESKTOP_INSPECTOR_CAPTION_CLASS,
                          DESKTOP_INSPECTOR_FG_MUTED,
                        )}
                      >
                        {curatedError}
                      </p>
                    ) : null}
                  </>
                ) : isLoading ? (
                  <p
                    className={cn(
                      "col-span-4 px-1 py-6 text-center",
                      DESKTOP_INSPECTOR_CAPTION_CLASS,
                      DESKTOP_INSPECTOR_FG_MUTED,
                    )}
                  >
                    Searching icons…
                  </p>
                ) : error ? (
                  <p
                    className={cn(
                      "col-span-4 px-1 py-6 text-center",
                      DESKTOP_INSPECTOR_CAPTION_CLASS,
                      DESKTOP_INSPECTOR_FG_MUTED,
                    )}
                  >
                    {error}
                  </p>
                ) : results.length === 0 ? (
                  <p
                    className={cn(
                      "col-span-4 px-1 py-6 text-center",
                      DESKTOP_INSPECTOR_CAPTION_CLASS,
                      DESKTOP_INSPECTOR_FG_MUTED,
                    )}
                  >
                    No matches
                  </p>
                ) : (
                  results.map((result) => (
                    <DesktopIconstackIconButton
                      key={result.id}
                      previewSvg={previewSvgs[result.id]}
                      result={result}
                      selected={
                        settings.selectedBrandIconId === toIconstackSelectionId(result)
                      }
                      onClick={() =>
                        onLogoSettingsChange({
                          selectedBrandIconId: toIconstackSelectionId(result),
                        })
                      }
                    />
                  ))
                )}
              </DesktopInspectorAnimatedOptionGrid>
              {canSearch && !isLoading && !error && results.length > 0 ? (
                <p className={cn("mt-2 px-1 text-center", DESKTOP_INSPECTOR_CAPTION_CLASS)}>
                  {results.length} SVG {results.length === 1 ? "icon" : "icons"}
                </p>
              ) : null}
            </DesktopInspectorOptionGridScrollArea>
          </DesktopInspectorSection>
        ) : null}

        {settings.sourceMode === "upload" ? (
          <DesktopInspectorSection className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}>
            <DesktopInspectorLabel>Upload</DesktopInspectorLabel>
            <DesktopInspectorSegmentedControl
              dataSlot="desktop-logo-upload-mode"
              itemAriaLabel={(option) => `Use ${option.label} logo asset`}
              items={DESKTOP_ASSET_SOURCE_OPTIONS}
              value={settings.uploadMode}
              onValueChange={(uploadMode) => onLogoSettingsChange({ uploadMode })}
            />
            {settings.uploadMode === "upload" ? (
              <DesktopInspectorImageFileUpload
                className="mt-2"
                data-slot="desktop-logo-file-upload"
                label="Logo file upload"
                onFileAccept={(file) => onLogoSettingsChange({ uploadedFile: file })}
              />
            ) : (
              <DesktopInspectorTextInput
                aria-label="Remote logo URL"
                className="mt-2"
                placeholder="https://example.com/logo.png"
                value={settings.remoteUrl}
                onChange={(event) => onLogoSettingsChange({ remoteUrl: event.currentTarget.value })}
              />
            )}
          </DesktopInspectorSection>
        ) : null}

        {settings.sourceMode === "brand" ? (
          <DesktopInspectorSection className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS} dataSlot="desktop-logo-color" resize>
            <DesktopInspectorLabel className="mb-3">
              Icon Color
            </DesktopInspectorLabel>
            <DesktopInspectorSegmentedControl
              dataSlot="desktop-logo-color-mode"
              itemAriaLabel={(option) => `Use ${option.value} logo color`}
              items={DESKTOP_CORNER_COLOR_MODES}
              value={settings.colorMode}
              onValueChange={(colorMode) => onLogoSettingsChange({ colorMode })}
            />
            {settings.colorMode === "solid" ? (
              <div className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}>
                <DesktopColorInputRow
                  label="Solid color"
                  value={settings.solidColor}
                  onChange={(solidColor) => onLogoSettingsChange({ solidColor })}
                />
              </div>
            ) : (
              <div className="mt-2.5 grid gap-2">
                <DesktopColorInputRow
                  label="Start color"
                  value={settings.gradient.colorStops[0].color}
                  onChange={(color) =>
                    onLogoSettingsChange({
                      gradient: updateDesktopGradientColor(settings.gradient, 0, color),
                    })
                  }
                />
                <DesktopColorInputRow
                  label="End color"
                  value={settings.gradient.colorStops[1].color}
                  onChange={(color) =>
                    onLogoSettingsChange({
                      gradient: updateDesktopGradientColor(settings.gradient, 1, color),
                    })
                  }
                />
                <DesktopGradientOffsetSlider
                  dataSlot="desktop-logo-gradient"
                  gradient={settings.gradient}
                  label="Logo color stop range"
                  onGradientChange={(gradient) => onLogoSettingsChange({ gradient })}
                />
                <DesktopGradientRotationSlider
                  gradient={settings.gradient}
                  onGradientChange={(gradient) => onLogoSettingsChange({ gradient })}
                />
              </div>
            )}
          </DesktopInspectorSection>
        ) : null}

        {settings.sourceMode !== "none" ? (
          <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
            <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Size</p>
            <DesktopInspectorSegmentedControl
              columns={2}
              dataSlot="desktop-logo-size-mode"
              itemAriaLabel={(option) => `Use ${option.label.toLowerCase()} logo sizing`}
              items={DESKTOP_LOGO_SIZE_MODE_OPTIONS}
              value={settings.sizeMode}
              onValueChange={(sizeMode) => onLogoSettingsChange({ sizeMode })}
            />
            {settings.sizeMode === "ratio" ? (
              <DesktopMotionSliderRow
                label="Logo size"
                max={100}
                min={0}
                value={settings.size}
                valueLabel={`${Math.round(settings.size)}%`}
                onChange={(size) => onLogoSettingsChange({ size })}
              />
            ) : (
              <div className="mt-2.5 grid gap-2">
                <DesktopMotionSliderRow
                  label="Logo width"
                  max={320}
                  min={8}
                  step={1}
                  value={settings.widthPx ?? 64}
                  valueLabel={`${Math.round(settings.widthPx ?? 64)} px`}
                  onChange={(widthPx) => {
                    const patch: DesktopLogoSettingsPatch = { widthPx }
                    if (settings.lockAspect) {
                      patch.heightPx = widthPx
                    }
                    onLogoSettingsChange(patch)
                  }}
                />
                <DesktopMotionSliderRow
                  label="Logo height"
                  max={320}
                  min={8}
                  step={1}
                  value={settings.heightPx ?? settings.widthPx ?? 64}
                  valueLabel={`${Math.round(settings.heightPx ?? settings.widthPx ?? 64)} px`}
                  onChange={(heightPx) => onLogoSettingsChange({ heightPx })}
                />
                <DesktopMotionToggleRow
                  checked={settings.lockAspect}
                  label="Lock aspect ratio"
                  onChange={(lockAspect) => onLogoSettingsChange({ lockAspect })}
                />
              </div>
            )}
            <DesktopMotionSliderRow
              label="Logo opacity"
              max={100}
              min={0}
              step={5}
              value={settings.opacity}
              valueLabel={`${Math.round(settings.opacity)}%`}
              onChange={(opacity) => onLogoSettingsChange({ opacity })}
            />
            <p className={cn("mt-2.5", DESKTOP_INSPECTOR_SECTION_HEADING_CLASS)}>Position</p>
            <DesktopInspectorSegmentedControl
              columns={2}
              dataSlot="desktop-logo-position-mode"
              itemAriaLabel={(option) => `Use ${option.label.toLowerCase()} logo position`}
              items={DESKTOP_LOGO_POSITION_OPTIONS}
              value={settings.positionMode}
              onValueChange={(positionMode) => onLogoSettingsChange({ positionMode })}
            />
            {settings.positionMode === "custom" ? (
              <div className="mt-2.5 grid gap-2">
                <DesktopMotionSliderRow
                  label="Logo X offset"
                  max={160}
                  min={-160}
                  step={1}
                  value={settings.offsetX}
                  valueLabel={`${Math.round(settings.offsetX)} px`}
                  onChange={(offsetX) => onLogoSettingsChange({ offsetX })}
                />
                <DesktopMotionSliderRow
                  label="Logo Y offset"
                  max={160}
                  min={-160}
                  step={1}
                  value={settings.offsetY}
                  valueLabel={`${Math.round(settings.offsetY)} px`}
                  onChange={(offsetY) => onLogoSettingsChange({ offsetY })}
                />
              </div>
            ) : null}
            <p className={cn("mt-2.5", DESKTOP_INSPECTOR_SECTION_HEADING_CLASS)}>Cross-origin</p>
            <DesktopInspectorSegmentedControl
              columns={3}
              dataSlot="desktop-logo-cross-origin"
              itemAriaLabel={(option) => `Use ${option.label.toLowerCase()} cross-origin`}
              items={DESKTOP_CROSS_ORIGIN_OPTIONS}
              value={settings.crossOrigin}
              onValueChange={(crossOrigin) => onLogoSettingsChange({ crossOrigin })}
            />
            <div className="mt-2.5 grid gap-2">
              <DesktopNumberRow
                label="Logo margin"
                max={40}
                min={0}
                value={settings.margin}
                onChange={(margin) => onLogoSettingsChange({ margin })}
              />
              <DesktopMotionToggleRow
                checked={settings.hideBackgroundDots}
                label="Hide background dots"
                onChange={(hideBackgroundDots) => onLogoSettingsChange({ hideBackgroundDots })}
              />
            </div>
          </DesktopInspectorSection>
        ) : null}
      </DesktopInspectorScrollArea>

    </div>
  )
}

function DesktopIconstackIconSkeleton() {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "h-12 min-w-0 animate-pulse rounded-[7px] bg-[var(--desktop-inspector-control-hover-bg)]",
        desktopInspectorOptionGridItemClass(),
      )}
    />
  )
}

function DesktopBrandIconButton({
  brandIcon,
  onClick,
  selected,
}: {
  brandIcon: BrandIconEntry
  onClick: () => void
  selected: boolean
}) {
  const Icon = brandIcon.icon

  return (
    <button
      aria-label={`Use ${brandIcon.label} brand icon`}
      aria-pressed={selected}
      data-desktop-animated-option-selection="true"
      data-desktop-option-tile="true"
      className={cn(
        "relative grid h-12 min-w-0 place-items-center rounded-[7px] border-2 border-transparent bg-transparent text-[var(--desktop-inspector-fg-tertiary)] transition hover:border-[var(--desktop-inspector-control-border-hover)] hover:bg-[var(--desktop-inspector-control-hover-bg)] hover:text-[var(--desktop-inspector-fg-primary)]",
        desktopInspectorOptionGridItemClass(),
        DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
        selected && "text-[var(--desktop-inspector-option-selected-fg)]",
      )}
      type="button"
      onClick={onClick}
    >
      <span className="relative z-10 flex size-4 items-center justify-center">
        <Icon className="size-4" />
      </span>
    </button>
  )
}

function DesktopIconstackIconButton({
  onClick,
  previewSvg,
  result,
  selected,
}: {
  onClick: () => void
  previewSvg?: string
  result: IconstackSearchResult
  selected: boolean
}) {
  return (
    <button
      aria-label={`Use ${result.name} icon from ${result.libraryName}`}
      aria-pressed={selected}
      data-desktop-animated-option-selection="true"
      data-desktop-option-tile="true"
      className={cn(
        "relative grid h-12 min-w-0 place-items-center rounded-[7px] border-2 border-transparent bg-transparent text-[var(--desktop-inspector-fg-tertiary)] transition hover:border-[var(--desktop-inspector-control-border-hover)] hover:bg-[var(--desktop-inspector-control-hover-bg)] hover:text-[var(--desktop-inspector-fg-primary)]",
        desktopInspectorOptionGridItemClass(),
        DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
        selected && "text-[var(--desktop-inspector-option-selected-fg)]",
      )}
      type="button"
      onClick={onClick}
    >
      {previewSvg ? (
        <span
          className="relative z-10 flex size-4 items-center justify-center [&_svg]:size-4"
          dangerouslySetInnerHTML={{ __html: previewSvg }}
        />
      ) : (
        <span className={cn("relative z-10 text-[9px] font-semibold", DESKTOP_INSPECTOR_FG_MUTED)}>
          …
        </span>
      )}
    </button>
  )
}

function DesktopCornersInspector({
  desktopTheme,
  onCornersSettingsChange,
  settings,
}: {
  desktopTheme: DesktopThemeMode
  onCornersSettingsChange: (patch: Partial<DesktopCornersSettings>) => void
  settings: DesktopCornersSettings
}) {
  return (
    <div data-slot="desktop-corners-inspector" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <DesktopInspectorHeader title="Corners" />

      <div data-impeccable-variants="a34b4748" data-impeccable-variant-count="3" style={{ display: "contents" }}>
        {/* impeccable-variants-start a34b4748 */}
        {/* Original */}
        <div data-impeccable-variant="original" className="flex min-h-0 flex-1 flex-col">
          <DesktopInspectorScrollArea>
            <DesktopInspectorSection>
              <div className="mb-2 min-w-0">
                <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Corner Frame</p>
              </div>
              <DesktopInspectorOptionGridScrollArea
                ariaLabel="Corner frame presets"
                columns={3}
                dataSlot="desktop-corner-frame-preset-shelf-scroll-area"
                variant="preset"
              >
                <DesktopInspectorAnimatedOptionGrid
                  columns={3}
                  selectedKey={settings.cornerSquareType}
                >
                  {CORNER_SQUARE_STYLE_OPTIONS.map((option) => (
                    <DesktopCornerStyleButton
                      desktopTheme={desktopTheme}
                      key={option.value}
                      label={option.label}
                      previewKind="corner-square"
                      selected={settings.cornerSquareType === option.value}
                      target="corner frame"
                      value={option.value}
                      onClick={() => onCornersSettingsChange({ cornerSquareType: option.value })}
                    />
                  ))}
                </DesktopInspectorAnimatedOptionGrid>
              </DesktopInspectorOptionGridScrollArea>
            </DesktopInspectorSection>

            <DesktopCornerColorSection
              dataSlot="desktop-corner-frame-color"
              gradient={settings.cornerSquareGradient}
              mode={settings.cornerSquareColorMode}
              solidColor={settings.cornerSquareSolidColor}
              target="corner frame"
              title="Frame Color"
              onGradientChange={(cornerSquareGradient) =>
                onCornersSettingsChange({ cornerSquareColorMode: "gradient", cornerSquareGradient })
              }
              onModeChange={(cornerSquareColorMode) =>
                onCornersSettingsChange({ cornerSquareColorMode })
              }
              onSolidColorChange={(cornerSquareSolidColor) =>
                onCornersSettingsChange({ cornerSquareColorMode: "solid", cornerSquareSolidColor })
              }
            />

            <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_MAJOR_GAP_CLASS)}>
              <div className="mb-2 min-w-0">
                <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Corner Dot</p>
              </div>
              <DesktopInspectorOptionGridScrollArea
                ariaLabel="Corner dot presets"
                columns={3}
                dataSlot="desktop-corner-dot-preset-shelf-scroll-area"
                variant="preset"
              >
                <DesktopInspectorAnimatedOptionGrid
                  columns={3}
                  selectedKey={settings.cornerDotType}
                >
                  {CORNER_DOT_STYLE_OPTIONS.map((option) => (
                    <DesktopCornerStyleButton
                      desktopTheme={desktopTheme}
                      key={option.value}
                      label={option.label}
                      previewKind="corner-dot"
                      selected={settings.cornerDotType === option.value}
                      target="corner dot"
                      value={option.value}
                      onClick={() => onCornersSettingsChange({ cornerDotType: option.value })}
                    />
                  ))}
                </DesktopInspectorAnimatedOptionGrid>
              </DesktopInspectorOptionGridScrollArea>
            </DesktopInspectorSection>

            <DesktopCornerColorSection
              dataSlot="desktop-corner-dot-color"
              gradient={settings.cornerDotGradient}
              mode={settings.cornerDotColorMode}
              solidColor={settings.cornerDotSolidColor}
              target="corner dot"
              title="Dot Color"
              onGradientChange={(cornerDotGradient) =>
                onCornersSettingsChange({ cornerDotColorMode: "gradient", cornerDotGradient })
              }
              onModeChange={(cornerDotColorMode) =>
                onCornersSettingsChange({ cornerDotColorMode })
              }
              onSolidColorChange={(cornerDotSolidColor) =>
                onCornersSettingsChange({ cornerDotColorMode: "solid", cornerDotSolidColor })
              }
            />

          </DesktopInspectorScrollArea>
        </div>
        {/* Variants: insert below this line */}
        {/* impeccable-variants-end a34b4748 */}
      </div>

    </div>
  )
}

function DesktopCornerColorSection({
  dataSlot,
  gradient,
  mode,
  onGradientChange,
  onModeChange,
  onSolidColorChange,
  solidColor,
  target,
  title,
}: {
  dataSlot: string
  gradient: StudioGradient
  mode: DesktopCornerColorMode
  onGradientChange: (gradient: StudioGradient) => void
  onModeChange: (mode: DesktopCornerColorMode) => void
  onSolidColorChange: (color: string) => void
  solidColor: string
  target: "corner dot" | "corner frame"
  title: string
}) {
  const colorLabelPrefix = target === "corner frame" ? "Frame" : "Dot"

  return (
    <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)} data-slot={dataSlot} resize>
      <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>{title}</p>

      <DesktopInspectorSegmentedControl
        itemAriaLabel={(option) => `Use ${option.value} ${target} color`}
        items={DESKTOP_CORNER_COLOR_MODES}
        value={mode}
        onValueChange={onModeChange}
      />

      {mode === "solid" ? (
        <div className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}>
          <DesktopColorInputRow
            ariaLabel={`${colorLabelPrefix} solid color`}
            label="Solid color"
            value={solidColor}
            onChange={onSolidColorChange}
          />
        </div>
      ) : null}

      {mode === "gradient" ? (
        <div className="mt-2.5 grid gap-2">
          <DesktopColorInputRow
            ariaLabel={`${colorLabelPrefix} start color`}
            label="Start color"
            value={gradient.colorStops[0].color}
            onChange={(color) => onGradientChange(updateDesktopGradientColor(gradient, 0, color))}
          />
          <DesktopColorInputRow
            ariaLabel={`${colorLabelPrefix} end color`}
            label="End color"
            value={gradient.colorStops[1].color}
            onChange={(color) => onGradientChange(updateDesktopGradientColor(gradient, 1, color))}
          />
          <DesktopGradientOffsetSlider
            dataSlot={dataSlot}
            gradient={gradient}
            label={`${colorLabelPrefix} color stop range`}
            onGradientChange={onGradientChange}
          />
          <DesktopSegmentedRow
            hideLabel
            label="Type"
            options={DESKTOP_GRADIENT_TYPE_OPTIONS}
            value={gradient.type}
            onChange={(type) => onGradientChange({ ...gradient, enabled: true, type })}
          />
          <DesktopGradientRotationSlider gradient={gradient} onGradientChange={onGradientChange} />
        </div>
      ) : null}
    </DesktopInspectorSection>
  )
}

function DesktopCornerStyleButton({
  color,
  desktopTheme,
  frameColor,
  frameStyle,
  label,
  onClick,
  previewKind,
  selected,
  target,
  value,
}: {
  color?: string
  desktopTheme: DesktopThemeMode
  frameColor?: string
  frameStyle?: QrFinderPatternOuterStyle
  label: string
  onClick: () => void
  previewKind: Extract<StylePreviewKind, "corner-dot" | "corner-square">
  selected: boolean
  target: "corner dot" | "corner frame"
  value: StudioCornerDotStyle | QrFinderPatternOuterStyle
}) {
  return (
    <button
      aria-label={`Use ${label} ${target}`}
      aria-pressed={selected}
      data-desktop-animated-option-selection="true"
      data-desktop-preview-option="true"
      className={cn(
        "group relative aspect-square w-full min-w-0 p-0 text-center transition",
        desktopInspectorOptionGridItemClass("loose"),
        DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
        DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
        selected && "text-[var(--desktop-inspector-option-selected-fg)]",
      )}
      type="button"
      onClick={onClick}
    >
      <span
        aria-hidden="true"
        data-desktop-adaptive-option-preview="true"
        data-slot="desktop-style-preview-surface"
        className={cn(
          "relative z-10 grid size-full place-items-center overflow-hidden rounded-[6px] border-2 border-transparent bg-[#15161a] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition",
        )}
        style={getDesktopAdaptiveOptionPreviewStyle(desktopTheme)}
      >
        <span className="grid size-[68%] place-items-center [&_svg]:size-full [&_svg]:text-current">
          <StylePreview
            color={color}
            frameColor={frameColor}
            frameStyle={frameStyle}
            previewKind={previewKind}
            value={value}
          />
        </span>
      </span>
    </button>
  )
}

function DesktopShapeInspector({
  desktopTheme,
  onShapeSettingsChange,
  settings,
}: {
  desktopTheme: DesktopThemeMode
  onShapeSettingsChange: (patch: Partial<DesktopShapeSettings>) => void
  settings: DesktopShapeSettings
}) {
  return (
    <div data-slot="desktop-shape-inspector" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <DesktopInspectorHeader title="Shape" />

      <DesktopInspectorScrollArea>
        <DesktopSizeTemplateInspector
          settings={{
            cardHeight: settings.cardHeight,
            cardWidth: settings.cardWidth,
            lockAspectRatio: settings.lockAspectRatio,
            sizeMode: settings.sizeMode,
            sizePresetId: settings.sizePresetId,
          }}
          onChange={(patch) => onShapeSettingsChange(patch)}
          onSelectTemplate={(template) => {
            const canvasSize = getCanvasSizeFromTemplate(template)
            onShapeSettingsChange({
              cardHeight: canvasSize.height,
              cardWidth: canvasSize.width,
              lockAspectRatio: true,
              sizeMode: "fixed",
              sizePresetId: template.id,
            })
          }}
        />

        <DesktopInspectorSection>
          <div className="mb-2 min-w-0">
            <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Shape Options</p>
          </div>
          <DesktopInspectorOptionGridScrollArea
            ariaLabel="Shape options"
            columns={3}
            dataSlot="desktop-shape-preset-shelf-scroll-area"
            variant="preset"
          >
            <DesktopInspectorAnimatedOptionGrid
              columns={3}
              selectedKey={settings.backgroundShapeId}
            >
              <DesktopShapePresetButton
                desktopTheme={desktopTheme}
                label="None"
                selected={settings.backgroundShapeId === "none"}
                settings={settings}
                shapeId="none"
                onClick={() => onShapeSettingsChange({ backgroundShapeId: "none" })}
              />
              {QR_BACKGROUND_SHAPES.map((shape) => (
                <DesktopShapePresetButton
                  desktopTheme={desktopTheme}
                  key={shape.id}
                  label={shape.label}
                  selected={settings.backgroundShapeId === shape.id}
                  settings={settings}
                  shapeId={shape.id}
                  onClick={() => onShapeSettingsChange({ backgroundShapeId: shape.id })}
                />
              ))}
            </DesktopInspectorAnimatedOptionGrid>
          </DesktopInspectorOptionGridScrollArea>
        </DesktopInspectorSection>

        <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)} data-slot="desktop-shape-color" resize>
          <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Shape Color</p>

          <DesktopInspectorSegmentedControl
            dataSlot="desktop-shape-color-mode"
            itemAriaLabel={(option) => `Use ${option.value} shape color`}
            items={DESKTOP_SHAPE_COLOR_MODES}
            value={settings.shapeColorMode}
            onValueChange={(shapeColorMode) => onShapeSettingsChange({ shapeColorMode })}
          />

          {settings.shapeColorMode === "solid" ? (
            <div className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}>
              <DesktopColorInputRow
                ariaLabel="Shape solid color"
                label="Solid color"
                value={settings.shapeSolidColor}
                onChange={(shapeSolidColor) => onShapeSettingsChange({ shapeSolidColor })}
              />
            </div>
          ) : null}

          {settings.shapeColorMode === "gradient" ? (
            <div className={cn("mt-2.5 grid", DESKTOP_INSPECTOR_ROW_GAP_CLASS)}>
              <DesktopColorInputRow
                ariaLabel="Shape start color"
                label="Start color"
                value={settings.shapeGradient.colorStops[0].color}
                onChange={(color) =>
                  onShapeSettingsChange({
                    shapeGradient: updateDesktopGradientColor(settings.shapeGradient, 0, color),
                  })
                }
              />
              <DesktopColorInputRow
                ariaLabel="Shape end color"
                label="End color"
                value={settings.shapeGradient.colorStops[1].color}
                onChange={(color) =>
                  onShapeSettingsChange({
                    shapeGradient: updateDesktopGradientColor(settings.shapeGradient, 1, color),
                  })
                }
              />
              <DesktopGradientOffsetSlider
                dataSlot="desktop-shape-gradient"
                gradient={settings.shapeGradient}
                label="Shape color stop range"
                onGradientChange={(shapeGradient) => onShapeSettingsChange({ shapeGradient })}
              />
              <DesktopSegmentedRow
                hideLabel
                label="Type"
                options={DESKTOP_GRADIENT_TYPE_OPTIONS}
                value={settings.shapeGradient.type}
                onChange={(type) =>
                  onShapeSettingsChange({ shapeGradient: { ...settings.shapeGradient, type } })
                }
              />
              <DesktopGradientRotationSlider
                gradient={settings.shapeGradient}
                onGradientChange={(shapeGradient) => onShapeSettingsChange({ shapeGradient })}
              />
            </div>
          ) : null}
        </DesktopInspectorSection>

        <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
          <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Frame</p>
          <div className="grid gap-2">
            <DesktopElasticSliderRow
              label="Corner radius"
              max={64}
              min={0}
              value={settings.cardRadius}
              valueLabel={`${Math.round(settings.cardRadius)}`}
              onChange={(cardRadius) => onShapeSettingsChange({ cardRadius })}
            />
            <DesktopElasticSliderRow
              label="Padding"
              max={192}
              min={0}
              value={settings.shapePadding}
              valueLabel={`${Math.round(settings.shapePadding)}`}
              onChange={(shapePadding) => onShapeSettingsChange({ shapePadding })}
            />
            <DesktopElasticSliderRow
              label="Bottom space"
              max={240}
              min={0}
              value={settings.bottomSpace}
              valueLabel={`${Math.round(settings.bottomSpace)}`}
              onChange={(bottomSpace) => onShapeSettingsChange({ bottomSpace })}
            />
          </div>
        </DesktopInspectorSection>

      </DesktopInspectorScrollArea>

    </div>
  )
}

function DesktopCardFillPatternInspector({
  onShapeSettingsChange,
  settings,
}: {
  onShapeSettingsChange: (patch: Partial<DesktopShapeSettings>) => void
  settings: DesktopShapeSettings
}) {
  return (
    <div data-slot="desktop-card-pattern-inspector" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <DesktopInspectorHeader title="Pattern" />
      <DesktopInspectorScrollArea>
        <DesktopCardFillPatternSection
          cardFill={settings.cardFill}
          cardPatternColors={settings.cardPatternColors}
          cardPatternId={settings.cardPatternId}
          onShapeSettingsChange={onShapeSettingsChange}
        />
      </DesktopInspectorScrollArea>
    </div>
  )
}

function DesktopCardFillPatternSection({
  cardFill,
  cardPatternColors,
  cardPatternId,
  onShapeSettingsChange,
}: {
  cardFill: string
  cardPatternColors: Partial<Record<DraftingCardPatternId, DraftingCardPatternColorOverrides>>
  cardPatternId: DraftingCardPatternSelectionId
  onShapeSettingsChange: (patch: Partial<DesktopShapeSettings>) => void
}) {
  const selectedPattern = getDraftingCardPatternById(cardPatternId)
  const selectedPatternId = selectedPattern?.id as DraftingCardPatternId | undefined
  const patternColorOverrides =
    selectedPatternId !== undefined ? (cardPatternColors[selectedPatternId] ?? {}) : {}

  return (
    <>
      <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
        <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Pattern</p>
        <DesktopInspectorOptionGridScrollArea
          ariaLabel="Shape fill patterns"
          columns={3}
          dataSlot="desktop-card-pattern-scroll-area"
          rowKind="square"
          shelfDataSlot="desktop-card-patterns"
          variant="compact"
        >
          <DesktopInspectorAnimatedOptionGrid
            columns={3}
            data-slot="desktop-card-patterns"
            selectedKey={cardPatternId}
          >
            {DRAFTING_CARD_PATTERNS.map((pattern) => (
              <DesktopPatternSwatchButton
                key={pattern.id}
                hideLabel
                label={pattern.label}
                selected={cardPatternId === pattern.id}
                style={pattern.style}
                onClick={() => onShapeSettingsChange({ cardPatternId: pattern.id })}
              />
            ))}
          </DesktopInspectorAnimatedOptionGrid>
        </DesktopInspectorOptionGridScrollArea>
      </DesktopInspectorSection>

      <DesktopInspectorSection
        className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS, "mt-2.5")}
        dataSlot="desktop-card-pattern-colors"
      >
        <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Color</p>
        {selectedPattern ? (
          selectedPattern.colorSlots.map((slot, index) => {
            const colorLabel = `Color ${index + 1}`

            return (
              <DesktopColorInputRow
                key={slot.id}
                label={colorLabel}
                value={patternColorOverrides[slot.id] ?? slot.defaultValue}
                onChange={(value) =>
                  onShapeSettingsChange({
                    cardPatternColors: {
                      ...cardPatternColors,
                      [selectedPatternId!]: {
                        ...(cardPatternColors[selectedPatternId!] ?? {}),
                        [slot.id]: value,
                      },
                    },
                  })
                }
              />
            )
          })
        ) : (
          <DesktopColorInputRow
            label="Color 1"
            value={cardFill}
            onChange={(nextFill) => onShapeSettingsChange({ cardFill: nextFill })}
          />
        )}
      </DesktopInspectorSection>
    </>
  )
}

function DesktopShapePresetButton({
  desktopTheme,
  label,
  onClick,
  selected,
  settings,
  shapeId,
}: {
  desktopTheme: DesktopThemeMode
  label: string
  onClick: () => void
  selected: boolean
  settings: DesktopShapeSettings
  shapeId: QrBackgroundShapeId
}) {
  return (
    <button
      aria-label={`Use ${label} shape`}
      aria-pressed={selected}
      data-desktop-animated-option-selection="true"
      data-desktop-option-tile="true"
      className={cn(
        "group flex w-full min-w-0 items-center justify-center transition",
        desktopInspectorOptionGridItemClass("loose"),
        DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
        DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
        selected && "text-[var(--desktop-inspector-option-selected-fg)]",
      )}
      type="button"
      onClick={onClick}
    >
      <span className="relative z-10 aspect-square w-full min-w-0 overflow-hidden rounded-[6px]">
        <DesktopShapePreview
          fillOverride="currentColor"
          label={label}
          previewStyle={getDesktopAdaptiveOptionPreviewStyle(desktopTheme)}
          settings={settings}
          shapeId={shapeId}
          className="size-full rounded-[6px] transition"
        />
      </span>
    </button>
  )
}

function DesktopShapePreview({
  className,
  fillOverride,
  label,
  previewStyle,
  settings,
  shapeId,
}: {
  className?: string
  fillOverride?: string
  label: string
  previewStyle?: CSSProperties
  settings: DesktopShapeSettings
  shapeId: QrBackgroundShapeId
}) {
  const previewId = useId().replace(/:/g, "")
  const shape = shapeId === "none" ? null : QR_BACKGROUND_SHAPES.find((item) => item.id === shapeId)
  const gradientId = shape ? `desktop-shape-preview-${shape.id}-${previewId}` : undefined
  const gradientFill = gradientId ? `url(#${gradientId})` : undefined
  const shapeFill = fillOverride ?? (settings.shapeColorMode === "gradient" ? gradientFill : settings.shapeSolidColor)

  return (
    <span
      aria-hidden="true"
      data-desktop-adaptive-option-preview={fillOverride ? "true" : undefined}
      data-slot="desktop-style-preview-surface"
      className={cn(
        "grid place-items-center overflow-hidden border-2 border-transparent bg-[#15161a] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
        className,
      )}
      style={previewStyle}
    >
      {shape ? (
        <svg
          className="size-[62%]"
          fill="none"
          viewBox={`0 0 ${shape.viewBox.width} ${shape.viewBox.height}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          {settings.shapeColorMode === "gradient" ? (
            <defs>
              {settings.shapeGradient.type === "radial" ? (
                <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
                  {settings.shapeGradient.colorStops.map((stop) => (
                    <stop key={`${shape.id}-${stop.offset}`} offset={stop.offset} stopColor={stop.color} />
                  ))}
                </radialGradient>
              ) : (
                <linearGradient
                  id={gradientId}
                  x1="0%"
                  x2="100%"
                  y1="0%"
                  y2="100%"
                  gradientTransform={`rotate(${(settings.shapeGradient.rotation * 180) / Math.PI} .5 .5)`}
                >
                  {settings.shapeGradient.colorStops.map((stop) => (
                    <stop key={`${shape.id}-${stop.offset}`} offset={stop.offset} stopColor={stop.color} />
                  ))}
                </linearGradient>
              )}
            </defs>
          ) : null}
          <path d={shape.path} fill={shapeFill} />
        </svg>
      ) : (
        <span className={cn("flex size-[96%] items-center justify-center rounded-[7px]", DESKTOP_INSPECTOR_CAPTION_CLASS)}>
          {label}
        </span>
      )}
    </span>
  )
}

function DesktopMotionInspector({
  onMotionSettingsChange,
  settings,
}: {
  onMotionSettingsChange: (patch: QrDotMatrixAnimationPatch) => void
  settings: DesktopMotionSettings
}) {
  const autoAnimateOptions = [
    { label: "Off", value: "" },
    ...QR_MOTION_STANDARD_PRESET_OPTIONS.map((option) => ({
      label: `Auto: ${option.label}`,
      value: option.value,
    })),
    ...QR_MOTION_DOT_MATRIX_PRESET_OPTIONS.map((option) => ({
      label: `Auto: ${option.label}`,
      value: option.value,
    })),
  ]

  return (
    <div data-slot="desktop-motion-inspector" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <DesktopInspectorHeader title="Motion" />

      <DesktopInspectorScrollArea>
        <DesktopInspectorSection>
          <DesktopMotionToggleRow
            checked={settings.enabled}
            label="Motion"
            onChange={(enabled) => onMotionSettingsChange({ enabled })}
          />
        </DesktopInspectorSection>

        <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
          <div className="mb-2 min-w-0">
            <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>QR Animations</p>
          </div>
          <DesktopInspectorOptionGridScrollArea
            ariaLabel="Standard motion presets"
            columns={3}
            dataSlot="desktop-motion-standard-shelf-scroll-area"
            shelfDataSlot="desktop-motion-standard-shelf"
            variant="content"
          >
            <DesktopInspectorAnimatedOptionGrid
              columns={3}
              data-slot="desktop-motion-standard-shelf"
              selectedKey={
                settings.presetCategory === "standard" && typeof settings.preset === "string"
                  ? settings.preset
                  : null
              }
            >
              {QR_MOTION_STANDARD_PRESET_OPTIONS.map((preset) => {
                const isSelected =
                  settings.presetCategory === "standard" && settings.preset === preset.value

                return (
                  <DesktopMotionPresetTileButton
                    key={preset.value}
                    label={preset.label}
                    selected={isSelected}
                    onClick={() =>
                      onMotionSettingsChange({
                        preset: preset.value,
                        presetCategory: "standard",
                      })
                    }
                  />
                )
              })}
            </DesktopInspectorAnimatedOptionGrid>
          </DesktopInspectorOptionGridScrollArea>
        </DesktopInspectorSection>

        <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
          <div className="mb-2 min-w-0">
            <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Dot Matrix Animations</p>
          </div>
          <DesktopInspectorOptionGridScrollArea
            ariaLabel="Dot matrix motion presets"
            columns={3}
            dataSlot="desktop-motion-loader-shelf-scroll-area"
            shelfDataSlot="desktop-motion-loader-shelf"
            variant="content"
          >
            <DesktopInspectorAnimatedOptionGrid
              columns={3}
              data-slot="desktop-motion-dot-matrix-shelf"
              selectedKey={
                settings.presetCategory === "dotMatrix"
                  ? typeof settings.preset === "string" && settings.preset
                    ? settings.preset
                    : settings.loader
                  : null
              }
            >
              {QR_MOTION_DOT_MATRIX_PRESET_OPTIONS.map((loader) => {
                const isSelected =
                  settings.presetCategory === "dotMatrix" &&
                  (settings.preset === loader.value || settings.loader === loader.value)

                return (
                  <DesktopMotionPresetTileButton
                    key={loader.value}
                    label={loader.label}
                    selected={isSelected}
                    onClick={() =>
                      onMotionSettingsChange({
                        loader: loader.value,
                        preset: loader.value,
                        presetCategory: "dotMatrix",
                      })
                    }
                  />
                )
              })}
            </DesktopInspectorAnimatedOptionGrid>
          </DesktopInspectorOptionGridScrollArea>
        </DesktopInspectorSection>

        <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
          <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Playback</p>
          <div className="grid gap-3">
            <DesktopMotionSelectRow
              label="Auto animate"
              value={settings.autoAnimate}
              options={autoAnimateOptions}
              onChange={(autoAnimate) => onMotionSettingsChange({ autoAnimate })}
            />
            <DesktopMotionSliderRow
              label="Auto interval"
              max={QR_MOTION_AUTO_ANIMATE_INTERVAL_MAX}
              min={QR_MOTION_AUTO_ANIMATE_INTERVAL_MIN}
              step={QR_MOTION_AUTO_ANIMATE_INTERVAL_STEP}
              value={settings.autoAnimateInterval}
              valueLabel={`${Math.round(settings.autoAnimateInterval)}ms`}
              onChange={(autoAnimateInterval) => onMotionSettingsChange({ autoAnimateInterval })}
            />
            <DesktopMotionSelectRow
              label="Hover effect"
              value={settings.hoverEffect}
              options={QR_MOTION_HOVER_EFFECT_OPTIONS.map((option) => ({
                label: option.label,
                value: option.value,
              }))}
              onChange={(hoverEffect) => onMotionSettingsChange({ hoverEffect })}
            />
            <DesktopMotionSelectRow
              label="Hover color"
              value={settings.hoverColorMode}
              options={QR_MOTION_HOVER_COLOR_MODE_OPTIONS.map((option) => ({
                label: option.label,
                value: option.value,
              }))}
              onChange={(hoverColorMode) => onMotionSettingsChange({ hoverColorMode })}
            />
            <DesktopMotionSelectRow
              label="Intensity"
              value={settings.motionIntensity}
              options={QR_MOTION_INTENSITY_OPTIONS.map((option) => ({
                label: option.label,
                value: option.value,
              }))}
              onChange={(motionIntensity) => onMotionSettingsChange({ motionIntensity })}
            />
            <DesktopMotionSliderRow
              label="Speed"
              max={QR_DOT_MATRIX_ANIMATION_SPEED_MAX}
              min={QR_DOT_MATRIX_ANIMATION_SPEED_MIN}
              value={settings.speed}
              valueLabel={`${Math.round(settings.speed)}x`}
              onChange={(speed) => onMotionSettingsChange({ speed })}
            />
            <DesktopMotionSliderRow
              label="Opacity base"
              max={QR_DOT_MATRIX_OPACITY_MAX}
              min={QR_DOT_MATRIX_OPACITY_MIN}
              step={0.01}
              value={settings.opacityBase}
              valueLabel={settings.opacityBase.toFixed(2)}
              onChange={(opacityBase) => onMotionSettingsChange({ opacityBase })}
            />
            <DesktopMotionSliderRow
              label="Opacity mid"
              max={QR_DOT_MATRIX_OPACITY_MAX}
              min={QR_DOT_MATRIX_OPACITY_MIN}
              step={0.01}
              value={settings.opacityMid}
              valueLabel={settings.opacityMid.toFixed(2)}
              onChange={(opacityMid) => onMotionSettingsChange({ opacityMid })}
            />
            <DesktopMotionSliderRow
              label="Opacity peak"
              max={QR_DOT_MATRIX_OPACITY_MAX}
              min={QR_DOT_MATRIX_OPACITY_MIN}
              step={0.01}
              value={settings.opacityPeak}
              valueLabel={settings.opacityPeak.toFixed(2)}
              onChange={(opacityPeak) => onMotionSettingsChange({ opacityPeak })}
            />
          </div>
        </DesktopInspectorSection>

        <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
          <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Loader Color</p>
          <div className={desktopInspectorOptionGridClass(2)} data-slot="desktop-motion-color-presets">
            {QR_DOT_MATRIX_COLOR_PRESET_OPTIONS.map((preset) => (
              <DesktopMotionColorPresetButton
                key={preset.value}
                colors={
                  preset.value === "theme"
                    ? [settings.customColorBase, settings.customColorMid, settings.customColorPeak]
                    : DESKTOP_MOTION_COLOR_SWATCHES[preset.value]
                }
                label={preset.label}
                selected={settings.colorPreset === preset.value}
                onClick={() => onMotionSettingsChange({ colorPreset: preset.value })}
              />
            ))}
          </div>

          {settings.colorPreset === "theme" ? (
            <div className="mt-2.5 grid gap-2">
              <DesktopColorInputRow
                label="Motion base color"
                value={settings.customColorBase}
                onChange={(customColorBase) =>
                  onMotionSettingsChange({ customColor: customColorBase, customColorBase })
                }
              />
              <DesktopColorInputRow
                label="Motion mid color"
                value={settings.customColorMid}
                onChange={(customColorMid) => onMotionSettingsChange({ customColorMid })}
              />
              <DesktopColorInputRow
                label="Motion peak color"
                value={settings.customColorPeak}
                onChange={(customColorPeak) => onMotionSettingsChange({ customColorPeak })}
              />
            </div>
          ) : null}
        </DesktopInspectorSection>

        <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
          <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Output</p>
          <div className="grid gap-2">
            <DesktopMotionToggleRow
              checked={settings.animated}
              label="Animated preview"
              onChange={(animated) => onMotionSettingsChange({ animated })}
            />
            <DesktopMotionToggleRow
              checked={settings.exportAnimatedSvg}
              label="Preview-only animated SVG export"
              onChange={(exportAnimatedSvg) => onMotionSettingsChange({ exportAnimatedSvg })}
            />
            <p className={DESKTOP_INSPECTOR_CAPTION_CLASS}>
              File export stays static today. This toggle is reserved for a future animated SVG path.
            </p>
            <DesktopMotionToggleRow
              checked={settings.respectReducedMotion}
              label="Respect reduced motion"
              onChange={(respectReducedMotion) => onMotionSettingsChange({ respectReducedMotion })}
            />
          </div>
        </DesktopInspectorSection>
      </DesktopInspectorScrollArea>

    </div>
  )
}

function DesktopMotionSelectRow<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: T) => void
  options: Array<{ label: string; value: T }>
  value: T
}) {
  return (
    <label className={cn("grid gap-1.5", DESKTOP_INSPECTOR_ROW_CLASS)}>
      <span className={DESKTOP_INSPECTOR_LABEL_CLASS}>{label}</span>
      <select
        className={cn(
          "h-9 w-full rounded-[6px] px-2.5",
          DESKTOP_INSPECTOR_INPUT_CLASS,
        )}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={`${option.value}-${option.label}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function DesktopMotionToggleRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <FluidSwitch
      checked={checked}
      data-slot="desktop-motion-toggle-row"
      label={label}
      onToggle={() => onChange(!checked)}
      className={cn(
        DESKTOP_INSPECTOR_ROW_CLASS,
        "w-full flex-row-reverse justify-between px-0 touch-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--desktop-inspector-focus)]",
        "[&>span:last-child]:min-w-0 [&>span:last-child]:truncate [&>span:last-child]:text-[length:var(--desktop-inspector-type-label)] [&>span:last-child]:font-medium",
        checked
          ? "[&>span:last-child]:text-[var(--desktop-inspector-fg-primary)]"
          : "[&>span:last-child]:text-[var(--desktop-inspector-fg-label)]",
      )}
    />
  )
}

function DesktopMotionSliderRow({
  label,
  max,
  min,
  onChange,
  step = 1,
  value,
  valueLabel,
}: {
  label: string
  max: number
  min: number
  onChange: (value: number) => void
  step?: number
  value: number
  valueLabel: string
}) {
  return (
    <DesktopElasticSliderRow
      ariaLabel={`Motion ${label.toLowerCase()}`}
      label={label}
      max={max}
      min={min}
      step={step}
      value={value}
      valueLabel={valueLabel}
      onChange={onChange}
    />
  )
}

function DesktopElasticSliderRow({
  ariaLabel,
  label,
  max,
  min,
  onChange,
  step = 1,
  value,
  valueLabel,
}: {
  ariaLabel?: string
  label: string
  max: number
  min: number
  onChange: (value: number) => void
  step?: number
  value: number
  valueLabel: string
}) {
  return (
    <div
      data-slot="desktop-elastic-slider-row"
      className="grid min-w-0 py-1.5"
    >
      <div data-slot="desktop-elastic-slider">
        <ElasticSlider
          aria-label={ariaLabel ?? label}
          className={DESKTOP_ELASTIC_SLIDER_CLASS}
          formatValue={() => valueLabel}
          label={label}
          max={max}
          min={min}
          scrubSound
          step={step}
          value={value}
          onValueChange={onChange}
        />
      </div>
    </div>
  )
}

function DesktopMotionPresetTileButton({
  label,
  onClick,
  selected,
}: {
  label: string
  onClick: () => void
  selected: boolean
}) {
  return (
    <button
      aria-label={`Use ${label} motion loader`}
      aria-pressed={selected}
      className={cn(
        "relative flex h-[54px] min-w-0 flex-col items-center justify-center gap-1 px-1",
        desktopInspectorOptionGridItemClass(),
        DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
        DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
        selected && "text-[var(--desktop-inspector-option-selected-fg)]",
      )}
      data-desktop-animated-option-selection="true"
      data-desktop-motion-loader-option="true"
      data-desktop-option-tile="true"
      type="button"
      onClick={onClick}
    >
      <LayoutGrid className="relative z-10 size-4 shrink-0" />
      <span className="relative z-10 max-w-full truncate">{label}</span>
    </button>
  )
}

function DesktopMotionColorPresetButton({
  colors,
  label,
  onClick,
  selected,
}: {
  colors: string[]
  label: string
  onClick: () => void
  selected: boolean
}) {
  return (
      <button
        aria-label={`Use ${label} motion colors`}
        aria-pressed={selected}
      className={cn(
        "relative flex h-9 min-w-0 items-center gap-2 px-2 text-left",
        desktopInspectorOptionGridItemClass(),
        DESKTOP_INSPECTOR_CONTROL_CLASS,
        selected && DESKTOP_INSPECTOR_SELECTED_CLASS,
      )}
      type="button"
      onClick={onClick}
    >
      <span className="flex shrink-0 -space-x-1">
        {colors.map((color, index) => (
          <span
            key={`${label}-${color}-${index}`}
            aria-hidden="true"
            className="size-4 rounded-full border border-black/35"
            style={{ backgroundColor: color }}
          />
        ))}
      </span>
      <span className={cn("mb-0 min-w-0 flex-1 truncate", DESKTOP_INSPECTOR_VALUE_CLASS)}>
        {label}
      </span>
    </button>
  )
}

function DesktopPatternPaletteCustomButton({
  onClick,
  selected,
}: {
  onClick: () => void
  selected: boolean
}) {
  return (
    <button
      aria-label="Use custom pattern palette"
      aria-pressed={selected}
      data-desktop-animated-option-selection="true"
      data-desktop-option-tile="true"
      className={cn(
        "group relative flex aspect-square w-full min-w-0 items-center justify-center p-0 text-center transition",
        desktopInspectorOptionGridItemClass("loose"),
        DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
        DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
        selected && "text-[var(--desktop-inspector-option-selected-fg)]",
      )}
      type="button"
      onClick={onClick}
    >
      <span className={cn("relative z-10 text-[10px] font-medium leading-none", DESKTOP_INSPECTOR_VALUE_CLASS)}>
        Custom
      </span>
    </button>
  )
}

function DesktopPatternPalettePresetButton({
  colors,
  label,
  onClick,
  selected,
}: {
  colors: string[]
  label: string
  onClick: () => void
  selected: boolean
}) {
  return (
    <button
      aria-label={`Use ${label} pattern palette`}
      aria-pressed={selected}
      data-desktop-animated-option-selection="true"
      data-desktop-option-tile="true"
      className={cn(
        "group relative flex aspect-square w-full min-w-0 items-center justify-center p-0 text-center transition",
        desktopInspectorOptionGridItemClass("loose"),
        DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
        DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
        selected && "text-[var(--desktop-inspector-option-selected-fg)]",
      )}
      type="button"
      onClick={onClick}
    >
      <span aria-hidden="true" className="relative z-10 flex shrink-0 -space-x-2">
        {colors.map((color, index) => (
          <span
            key={`${label}-${color}-${index}`}
            className="size-5 rounded-full"
            style={{ backgroundColor: color }}
          />
        ))}
      </span>
    </button>
  )
}

function DesktopContentInspector({
  accessibilitySettings,
  contentType,
  contentValues,
  desktopTheme,
  encodedValue,
  onAccessibilitySettingsChange,
  onContentTypeChange,
  onContentValueChange,
  validation,
}: {
  accessibilitySettings: DesktopAccessibilitySettings
  contentType: QrInputType
  contentValues: StaticQrContentValues
  desktopTheme: DesktopThemeMode
  encodedValue: string
  onAccessibilitySettingsChange: (patch: Partial<DesktopAccessibilitySettings>) => void
  onContentTypeChange: (type: QrInputType) => void
  onContentValueChange: (field: string, value: StaticQrContentValue) => void
  validation: ReturnType<typeof validateStaticQrContent>
}) {
  const [collectionId, setCollectionId] = useState<DesktopContentCollectionId>("popular")
  const [query, setQuery] = useState("")
  const contentFilterOptions = useMemo(
    () =>
      DESKTOP_CONTENT_FILTER_OPTIONS.map((option) => ({
        label: option.label,
        value: option.id,
      })),
    [],
  )
  const isCollectionFilterActive = collectionId !== "all"
  const visibleTypes = useMemo(() => {
    const collectionTypes =
      collectionId === "all"
        ? DESKTOP_ALL_CONTENT_TYPES
        : (DESKTOP_CONTENT_COLLECTIONS.find((collection) => collection.id === collectionId)?.types ??
          DESKTOP_CONTENT_PRESET_TYPES)
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return collectionTypes
    }

    return collectionTypes.filter((type) => {
      const option = QR_INPUT_OPTIONS[type]
      const meta = STATIC_QR_CONTENT_META[type]

      return `${option.label} ${meta.title} ${meta.description}`
        .toLowerCase()
        .includes(normalizedQuery)
    })
  }, [collectionId, query])

  return (
    <div data-slot="desktop-content-inspector" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <DesktopInspectorHeader title="Content" />

      <DesktopInspectorScrollArea>
        <DesktopInspectorSection dataSlot="desktop-content-type-section">
          <div
            className="flex min-w-0 items-center gap-2"
            data-slot="desktop-content-filter-search-row"
          >
            <DesktopInspectorSearchInput
              aria-label="Search QR types"
              className="h-8 min-w-0 w-full flex-1"
              iconClassName="left-3"
              inputClassName="rounded-full pl-8 pr-3"
              placeholder="Search"
              value={query}
              onValueChange={setQuery}
            />
            <DesktopInspectorMorphFilterMenu
              ariaLabel="Filter QR types"
              data-slot="desktop-content-type-morph"
              icon={
                <HugeiconsIcon
                  icon={FilterMailIcon}
                  size={16}
                  color="currentColor"
                  strokeWidth={1.8}
                />
              }
              isActive={isCollectionFilterActive}
              menuDataSlot="desktop-inspector-filter-menu desktop-content-type-filter-menu"
              morphClassName="desktop-inspector-morph-filter--compact"
              options={contentFilterOptions}
              triggerDataSlot="desktop-inspector-filter-trigger desktop-content-type-filter-trigger"
              value={collectionId}
              onValueChange={setCollectionId}
            />
          </div>

          <DesktopInspectorOptionGridScrollArea
            ariaLabel="QR content types"
            className="mt-3"
            columns={3}
            dataSlot="desktop-content-type-collection-scroll-area"
            shelfDataSlot="desktop-content-type-collection-scroll"
            variant="content"
          >
            <DesktopInspectorAnimatedOptionGrid
              columns={3}
              data-slot="desktop-content-type-collection"
              selectedKey={contentType}
            >
              {visibleTypes.map((type) => {
              const option = QR_INPUT_OPTIONS[type]
              const Icon = option.icon
              const isSelected = contentType === type

              return (
                <button
                  key={type}
                  aria-label={`Use ${option.label} content`}
                  aria-pressed={isSelected}
                  className={cn(
                    "group relative mx-auto flex aspect-square size-[3.375rem] min-w-0 flex-col items-center justify-center gap-1 p-1.5 text-center transition",
                    desktopInspectorOptionGridItemClass("tight"),
                    DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
                    DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
                    isSelected && "text-[var(--desktop-inspector-option-selected-fg)]",
                  )}
                  data-desktop-animated-option-selection="true"
                  data-desktop-content-type-option="true"
                  type="button"
                  onClick={() => onContentTypeChange(type)}
                >
                  <Icon className="relative z-10 size-5 shrink-0" strokeWidth={1.75} />
                  <span
                    className={cn(
                      "relative z-10 max-w-full truncate leading-none",
                      DESKTOP_INSPECTOR_TYPE_LABEL_CLASS,
                    )}
                  >
                    {option.label}
                  </span>
                </button>
              )
            })}
              {visibleTypes.length === 0 ? (
                <p className={cn("col-span-3 px-1 py-3 text-center", DESKTOP_INSPECTOR_CAPTION_CLASS)}>
                  No QR types found
                </p>
              ) : null}
            </DesktopInspectorAnimatedOptionGrid>
          </DesktopInspectorOptionGridScrollArea>
        </DesktopInspectorSection>

        <DesktopInspectorSection as="div" className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
          <DesktopContentFields
            contentType={contentType}
            contentValues={contentValues}
            validation={validation}
            onContentValueChange={onContentValueChange}
          />
        </DesktopInspectorSection>

        <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
          <label className={cn("mb-1.5 block", DESKTOP_INSPECTOR_LABEL_CLASS)} htmlFor="desktop-qr-aria-label">
            Accessibility label
          </label>
          <DesktopInspectorTextInput
            aria-label="QR code accessibility label"
            data-slot="desktop-qr-aria-label"
            id="desktop-qr-aria-label"
            placeholder="QR Code"
            value={accessibilitySettings.ariaLabel}
            onChange={(event) =>
              onAccessibilitySettingsChange({ ariaLabel: event.currentTarget.value })
            }
          />
          <p className={cn("mt-2", DESKTOP_INSPECTOR_CAPTION_CLASS, DESKTOP_INSPECTOR_FG_TERTIARY)}>
            Sets the SVG aria-label for screen readers. Leave empty for the renderer default.
          </p>
        </DesktopInspectorSection>

        <DesktopInspectorSection as="details" className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS, "px-3 py-2.5")}>
          <summary className={cn("cursor-pointer select-none", DESKTOP_INSPECTOR_LABEL_CLASS)}>
            Encoded value
          </summary>
          <pre className={cn("mt-2 max-h-36 overflow-auto whitespace-pre-wrap break-words rounded-[6px] bg-black/24 p-2.5 leading-4", DESKTOP_INSPECTOR_CAPTION_CLASS, DESKTOP_INSPECTOR_FG_TERTIARY)}>
            {encodedValue || "No payload yet"}
          </pre>
        </DesktopInspectorSection>
      </DesktopInspectorScrollArea>

    </div>
  )
}

function DesktopPatternInspector({
  desktopTheme,
  encodingSettings,
  errorCorrectionLevel,
  onEncodingSettingsChange,
  onErrorCorrectionLevelChange,
  onPatternSettingsChange,
  settings,
}: {
  desktopTheme: DesktopThemeMode
  encodingSettings: DesktopEncodingSettings
  errorCorrectionLevel: QrErrorCorrectionLevel
  onEncodingSettingsChange: (patch: Partial<DesktopEncodingSettings>) => void
  onErrorCorrectionLevelChange: (errorCorrectionLevel: QrErrorCorrectionLevel) => void
  onPatternSettingsChange: (patch: Partial<DesktopPatternSettings>) => void
  settings: DesktopPatternSettings
}) {
  return (
    <div data-slot="desktop-pattern-inspector" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <DesktopInspectorHeader title="Pattern" />

      <DesktopInspectorScrollArea>
        <DesktopInspectorSection>
          <div className="mb-2 min-w-0">
            <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Module Pattern</p>
          </div>
          <DesktopInspectorOptionGridScrollArea
            ariaLabel="Module pattern presets"
            columns={3}
            dataSlot="desktop-pattern-preset-shelf-scroll-area"
            shelfDataSlot="desktop-pattern-preset-shelf"
            variant="preset"
          >
            <DesktopInspectorAnimatedOptionGrid
              columns={3}
              selectedKey={settings.qrDotType}
            >
              {DOT_STYLE_OPTIONS.map((option) => (
                <DesktopModulePatternButton
                  desktopTheme={desktopTheme}
                  key={option.value}
                  label={option.label}
                  selected={settings.qrDotType === option.value}
                  value={option.value}
                  onClick={() => onPatternSettingsChange({ qrDotType: option.value })}
                />
              ))}
            </DesktopInspectorAnimatedOptionGrid>
          </DesktopInspectorOptionGridScrollArea>
        </DesktopInspectorSection>

        <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)} data-slot="desktop-module-color" resize>
          <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Module Color</p>

          <DesktopInspectorSegmentedControl
            columns={3}
            dataSlot="desktop-pattern-color-mode"
            itemAriaLabel={(option) => `Use ${option.label} module color`}
            items={DESKTOP_DOTS_COLOR_MODES}
            value={settings.dotsColorMode}
            onValueChange={(dotsColorMode) => onPatternSettingsChange({ dotsColorMode })}
          />

          {settings.dotsColorMode === "solid" ? (
            <div className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}>
              <DesktopColorInputRow
                label="Solid color"
                value={settings.dotsSolidColor}
                onChange={(dotsSolidColor) => onPatternSettingsChange({ dotsSolidColor })}
              />
            </div>
          ) : null}

          {settings.dotsColorMode === "gradient" ? (
            <div className="mt-2.5 grid gap-2">
              <DesktopColorInputRow
                ariaLabel="Start color"
                label="Start color"
                value={settings.dataModulesGradient.colorStops[0].color}
                onChange={(color) =>
                  onPatternSettingsChange({
                    dataModulesGradient: updateDesktopGradientColor(settings.dataModulesGradient, 0, color),
                  })
                }
              />
              <DesktopColorInputRow
                ariaLabel="End color"
                label="End color"
                value={settings.dataModulesGradient.colorStops[1].color}
                onChange={(color) =>
                  onPatternSettingsChange({
                    dataModulesGradient: updateDesktopGradientColor(settings.dataModulesGradient, 1, color),
                  })
                }
              />
              <DesktopGradientOffsetSlider
                dataSlot="desktop-pattern-gradient"
                gradient={settings.dataModulesGradient}
                label="Pattern color stop range"
                onGradientChange={(dataModulesGradient) =>
                  onPatternSettingsChange({ dataModulesGradient })
                }
              />
              <DesktopSegmentedRow
                hideLabel
                label="Type"
                options={DESKTOP_GRADIENT_TYPE_OPTIONS}
                value={settings.dataModulesGradient.type}
                onChange={(type) =>
                  onPatternSettingsChange({ dataModulesGradient: { ...settings.dataModulesGradient, type } })
                }
              />
              <DesktopGradientRotationSlider
                gradient={settings.dataModulesGradient}
                onGradientChange={(dataModulesGradient) =>
                  onPatternSettingsChange({ dataModulesGradient })
                }
              />
            </div>
          ) : null}

          {settings.dotsColorMode === "palette" ? (
            <div className="mt-2.5 grid gap-2">
              <DesktopInspectorOptionGridScrollArea
                ariaLabel="Pattern palette presets"
                columns={3}
                dataSlot="desktop-pattern-palette-presets-scroll-area"
                shelfDataSlot="desktop-pattern-palette-presets"
                variant="preset"
              >
                <DesktopInspectorAnimatedOptionGrid
                  columns={3}
                  data-slot="desktop-pattern-palette-presets"
                  selectedKey={resolveDesktopDotsPalettePresetKey(
                    settings.dotsPalette,
                    settings.dotsPalettePreset,
                  )}
                >
                  <DesktopPatternPaletteCustomButton
                    key="custom"
                    selected={isDesktopDotsPaletteCustomSelected(settings)}
                    onClick={() => onPatternSettingsChange({ dotsPalettePreset: "custom" })}
                  />
                  {DESKTOP_DOTS_PALETTE_PRESETS.map((preset) => (
                    <DesktopPatternPalettePresetButton
                      colors={preset.colors}
                      key={preset.label}
                      label={preset.label}
                      selected={
                        resolveDesktopDotsPalettePresetKey(
                          settings.dotsPalette,
                          settings.dotsPalettePreset,
                        ) === preset.label
                      }
                      onClick={() =>
                        onPatternSettingsChange({
                          dotsPalette: [...preset.colors],
                          dotsPalettePreset: preset.label,
                        })
                      }
                    />
                  ))}
                </DesktopInspectorAnimatedOptionGrid>
              </DesktopInspectorOptionGridScrollArea>

              {isDesktopDotsPaletteCustomSelected(settings) ? (
                <div className={DESKTOP_INSPECTOR_ROW_CLASS}>
                  <span className={DESKTOP_INSPECTOR_LABEL_CLASS}>Pattern</span>
                  <span className="flex min-w-0 flex-wrap justify-end gap-2">
                    {settings.dotsPalette.map((color, index) => (
                      <DesktopColorSwatchPicker
                        ariaLabel={`Pattern color ${index + 1}`}
                        key={`${color}-${index}`}
                        value={color}
                        onChange={(nextColor) =>
                          onPatternSettingsChange({
                            dotsPalette: settings.dotsPalette.map((currentColor, currentIndex) =>
                              currentIndex === index ? nextColor : currentColor,
                            ),
                            dotsPalettePreset: "custom",
                          })
                        }
                      />
                    ))}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}
        </DesktopInspectorSection>

        {supportsModuleSize(settings.qrDotType) ? (
          <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)} data-slot="desktop-module-size">
            <DesktopMotionSliderRow
              label="Module size"
              max={QR_MODULE_SIZE_MAX}
              min={QR_MODULE_SIZE_MIN}
              step={0.05}
              value={settings.moduleSize ?? 1}
              valueLabel={`${Math.round((settings.moduleSize ?? 1) * 100)}%`}
              onChange={(moduleSize) => onPatternSettingsChange({ moduleSize })}
            />
          </DesktopInspectorSection>
        ) : null}

        {supportsModuleLineWidth(settings.qrDotType) ? (
          <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)} data-slot="desktop-module-line-width">
            <DesktopMotionSliderRow
              label="Module line width"
              max={QR_MODULE_LINE_WIDTH_MAX}
              min={QR_MODULE_LINE_WIDTH_MIN}
              step={0.05}
              value={settings.moduleLineWidth ?? 1}
              valueLabel={`${Math.round((settings.moduleLineWidth ?? 1) * 100)}%`}
              onChange={(moduleLineWidth) => onPatternSettingsChange({ moduleLineWidth })}
            />
          </DesktopInspectorSection>
        ) : null}

        {supportsModuleRoundSize(settings.qrDotType) ? (
          <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
            <DesktopMotionToggleRow
              checked={settings.moduleRoundSize}
              data-slot="desktop-module-round-size"
              label="Uniform random module size"
              onChange={(moduleRoundSize) => onPatternSettingsChange({ moduleRoundSize })}
            />
          </DesktopInspectorSection>
        ) : null}

        {settings.dotsColorMode === "gradient" ? (
          <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
            <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Gradient scope</p>
            <DesktopInspectorSegmentedControl
              columns={2}
              dataSlot="desktop-gradient-link-mode"
              itemAriaLabel={(option) =>
                `Use ${option.label.toLowerCase()} module and finder gradients`
              }
              items={DESKTOP_GRADIENT_LINK_OPTIONS}
              value={settings.gradientLinkMode}
              onValueChange={(gradientLinkMode) =>
                onPatternSettingsChange({ gradientLinkMode })
              }
            />
          </DesktopInspectorSection>
        ) : null}

        <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
          <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Error correction</p>
          <DesktopInspectorSegmentedControl
            columns={4}
            dataSlot="desktop-pattern-error-correction"
            itemAriaLabel={(option) => `Use ${option.label} error correction`}
            items={DESKTOP_ERROR_CORRECTION_LEVEL_OPTIONS}
            value={errorCorrectionLevel}
            onValueChange={onErrorCorrectionLevelChange}
          />
          <p className={cn("mt-2", DESKTOP_INSPECTOR_CAPTION_CLASS, DESKTOP_INSPECTOR_FG_TERTIARY)}>
            {
              ERROR_CORRECTION_LEVEL_OPTIONS.find((option) => option.value === errorCorrectionLevel)
                ?.summary
            }
          </p>
        </DesktopInspectorSection>

        <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)} data-slot="desktop-pattern-type-number">
          <DesktopMotionSliderRow
            label="Type number"
            max={TYPE_NUMBER_MAX}
            min={TYPE_NUMBER_MIN}
            value={encodingSettings.typeNumber}
            valueLabel={formatQrTypeNumberLabel(encodingSettings.typeNumber)}
            onChange={(typeNumber) =>
              onEncodingSettingsChange({ typeNumber: typeNumber as QrTypeNumber })
            }
          />
        </DesktopInspectorSection>

        <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)} data-slot="desktop-pattern-boost-ecc">
          <DesktopMotionToggleRow
            checked={encodingSettings.boostLevel}
            label="Boost error correction"
            onChange={(boostLevel) => onEncodingSettingsChange({ boostLevel })}
          />
          <p className={cn("mt-2", DESKTOP_INSPECTOR_CAPTION_CLASS, DESKTOP_INSPECTOR_FG_TERTIARY)}>
            Raise ECC without increasing QR version when possible.
          </p>
        </DesktopInspectorSection>

        <DesktopInspectorSection as="details" className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS, "px-3 py-2.5")}>
          <summary className={cn("cursor-pointer select-none", DESKTOP_INSPECTOR_LABEL_CLASS)}>
            Advanced segments
          </summary>
          <textarea
            aria-label="QR encoding segments"
            className={cn(
              "mt-2 min-h-24 w-full resize-y rounded-[6px] border border-[var(--desktop-inspector-control-border)] bg-[var(--desktop-inspector-control-bg)] px-2.5 py-2",
              DESKTOP_INSPECTOR_CAPTION_CLASS,
            )}
            data-slot="desktop-encoding-segments"
            placeholder={"One segment per line\nhttps://example.com\nextra-data"}
            value={encodingSettings.valueSegmentsText}
            onChange={(event) =>
              onEncodingSettingsChange({ valueSegmentsText: event.currentTarget.value })
            }
          />
          <p className={cn("mt-2", DESKTOP_INSPECTOR_CAPTION_CLASS, DESKTOP_INSPECTOR_FG_TERTIARY)}>
            Optional multi-segment encoding. Overrides the main content value when non-empty.
          </p>
        </DesktopInspectorSection>
      </DesktopInspectorScrollArea>

    </div>
  )
}

function DesktopModulePatternButton({
  desktopTheme,
  label,
  onClick,
  selected,
  value,
}: {
  desktopTheme: DesktopThemeMode
  label: string
  onClick: () => void
  selected: boolean
  value: StudioDataModulesStyle
}) {
  return (
    <button
      aria-label={`Use ${label} pattern`}
      aria-pressed={selected}
      data-desktop-animated-option-selection="true"
      data-desktop-preview-option="true"
      className={cn(
        "group relative aspect-square w-full min-w-0 p-0 text-center transition",
        desktopInspectorOptionGridItemClass("loose"),
        DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
        DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
        selected && "text-[var(--desktop-inspector-option-selected-fg)]",
      )}
      type="button"
      onClick={onClick}
    >
      <DesktopQrDotPreview
        value={value}
        className="relative z-10 size-full rounded-[6px] transition"
        style={getDesktopAdaptiveOptionPreviewStyle(desktopTheme)}
      />
    </button>
  )
}

function DesktopQrDotPreview({
  className,
  style,
  value,
}: {
  className?: string
  style?: CSSProperties
  value: StudioDataModulesStyle
}) {
  return (
    <span
      aria-hidden="true"
      data-desktop-adaptive-option-preview="true"
      data-slot="desktop-style-preview-surface"
      className={cn(
        "grid place-items-center overflow-hidden border-2 border-transparent bg-[#15161a] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
        className,
      )}
      style={style}
    >
      <span className="grid size-[78%] place-items-center [&_svg]:size-full [&_svg]:text-current">
        <StylePreview previewKind="dots" value={value} />
      </span>
    </span>
  )
}

function DesktopNumberRow({
  label,
  max,
  min,
  onChange,
  step = 1,
  value,
}: {
  label: string
  max?: number
  min?: number
  onChange: (value: number) => void
  step?: number
  value: number
}) {
  return (
    <div className={DESKTOP_INSPECTOR_ROW_CLASS} role="group">
      <span className={DESKTOP_INSPECTOR_LABEL_CLASS}>{label}</span>
      <DesktopInspectorScrubbableNumberInput
        aria-label={label}
        className="h-7 w-20 rounded-[5px] px-2"
        max={max}
        min={min}
        step={step}
        value={value}
        onValueChange={onChange}
      />
    </div>
  )
}

function DesktopPatternSwatchButton({
  hideLabel = false,
  label,
  onClick,
  selected,
  style,
}: {
  hideLabel?: boolean
  label: string
  onClick: () => void
  selected: boolean
  style: CSSProperties
}) {
  return (
    <button
      aria-label={`Use ${label} decoration pattern`}
      aria-pressed={selected}
      data-desktop-animated-option-selection="true"
      data-desktop-option-tile="true"
      className={cn(
        "group flex w-full min-w-0 flex-col items-center text-center transition",
        hideLabel ? "gap-0 p-2" : cn("gap-1", desktopInspectorOptionGridItemClass()),
        DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
        DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
        selected && "text-[var(--desktop-inspector-option-selected-fg)]",
      )}
      type="button"
      onClick={onClick}
    >
      <span className="relative z-10 aspect-square w-full min-w-0 overflow-hidden rounded-[6px]">
        <span
          aria-hidden="true"
          className="block size-full rounded-[6px] transition"
          style={style}
        />
      </span>
      {hideLabel ? null : (
        <span
          data-desktop-preview-caption="true"
          className="relative z-10 block w-full truncate px-0.5 text-center text-inherit"
        >
          {label}
        </span>
      )}
    </button>
  )
}

function DesktopTextPresetButton({
  label,
  onClick,
  selected,
}: {
  label: string
  onClick: () => void
  selected: boolean
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={selected}
      className={cn(
        "flex h-9 min-w-0 items-center justify-between gap-2 px-2.5 text-left",
        desktopInspectorOptionGridItemClass(),
        DESKTOP_INSPECTOR_CONTROL_CLASS,
        selected && DESKTOP_INSPECTOR_SELECTED_CLASS,
      )}
      type="button"
      onClick={onClick}
    >
      <span className={cn("mb-0 min-w-0 flex-1 truncate", DESKTOP_INSPECTOR_VALUE_CLASS)}>
        {label}
      </span>
    </button>
  )
}

function DesktopSegmentedRow<TValue extends string>({
  hideLabel = false,
  label,
  onChange,
  options,
  value,
}: {
  hideLabel?: boolean
  label: string
  onChange: (value: TValue) => void
  options: Array<{ label: string; value: TValue }>
  value: TValue
}) {
  return (
    <div className={cn("min-w-0", hideLabel ? "py-0" : "py-2.5")}>
      {hideLabel ? null : <DesktopInspectorLabel>{label}</DesktopInspectorLabel>}
      <DesktopInspectorSegmentedControl
        items={options}
        value={value}
        onValueChange={onChange}
      />
    </div>
  )
}

function updateDesktopGradientColor(
  gradient: StudioGradient,
  index: 0 | 1,
  color: string,
): StudioGradient {
  return {
    ...gradient,
    enabled: true,
    colorStops: gradient.colorStops.map((stop, stopIndex) =>
      stopIndex === index ? { ...stop, color } : stop,
    ) as StudioGradient["colorStops"],
  }
}

function updateDesktopGradientOffsetRange(
  gradient: StudioGradient,
  values: [number, number],
): StudioGradient {
  const [startOffset, endOffset] = normalizeGradientOffsetRange(values)

  return {
    ...gradient,
    enabled: true,
    colorStops: [
      { ...gradient.colorStops[0], offset: startOffset },
      { ...gradient.colorStops[1], offset: endOffset },
    ],
  }
}

function DesktopGradientOffsetSlider({
  dataSlot,
  gradient,
  label,
  onGradientChange,
}: {
  dataSlot: string
  gradient: StudioGradient
  label: string
  onGradientChange: (gradient: StudioGradient) => void
}) {
  const gradientOffsetRange = normalizeGradientOffsetRange([
    gradient.colorStops[0].offset,
    gradient.colorStops[1].offset,
  ])

  return (
    <GradientOffsetRangeField
      hideHeader
      id={`${dataSlot}-offset-range`}
      endColor={gradient.colorStops[1].color}
      endValue={gradientOffsetRange[1]}
      label={label}
      max={1}
      min={0}
      onValueChange={(values) => onGradientChange(updateDesktopGradientOffsetRange(gradient, values))}
      startColor={gradient.colorStops[0].color}
      startValue={gradientOffsetRange[0]}
      step={0.01}
      valueFormatter={(value) => value.toFixed(2)}
    />
  )
}

function DesktopGradientRotationSlider({
  gradient,
  label = "Rotation",
  onGradientChange,
}: {
  gradient: StudioGradient
  label?: string
  onGradientChange: (gradient: StudioGradient) => void
}) {
  if (gradient.type !== "linear") {
    return null
  }

  const rotationDegrees = Math.min(360, Math.max(0, radiansToDegrees(gradient.rotation)))

  return (
    <DesktopElasticSliderRow
      label={label}
      max={360}
      min={0}
      value={rotationDegrees}
      valueLabel={`${Math.round(rotationDegrees)}°`}
      onChange={(value) =>
        onGradientChange({ ...gradient, rotation: degreesToRadians(value) })
      }
    />
  )
}

function areDesktopColorPalettesEqual(currentPalette: string[], presetPalette: string[]): boolean {
  return (
    currentPalette.length === presetPalette.length &&
    currentPalette.every((color, index) => color.toLowerCase() === presetPalette[index]?.toLowerCase())
  )
}

function resolveDesktopDotsPalettePresetKey(
  palette: string[],
  preset: string | "custom" | undefined,
): string | "custom" {
  if (preset === "custom") {
    return "custom"
  }

  if (preset && DESKTOP_DOTS_PALETTE_PRESETS.some((entry) => entry.label === preset)) {
    return preset
  }

  const matchedPreset = DESKTOP_DOTS_PALETTE_PRESETS.find((entry) =>
    areDesktopColorPalettesEqual(palette, entry.colors),
  )

  return matchedPreset?.label ?? "custom"
}

function isDesktopDotsPaletteCustomSelected(
  settings: Pick<DesktopPatternSettings, "dotsPalette" | "dotsPalettePreset">,
): boolean {
  return resolveDesktopDotsPalettePresetKey(settings.dotsPalette, settings.dotsPalettePreset) === "custom"
}

function DesktopContentFields({
  contentType,
  contentValues,
  onContentValueChange,
  validation,
}: {
  contentType: QrInputType
  contentValues: StaticQrContentValues
  onContentValueChange: (field: string, value: StaticQrContentValue) => void
  validation: ReturnType<typeof validateStaticQrContent>
}) {
  const fields = getDesktopContentFields(contentType, contentValues, validation)

  return (
    <div data-slot="desktop-content-fields" className="flex flex-col">
      {fields.map((field) => (
        <DesktopContentFieldRow
          key={field.id}
          field={field}
          onContentValueChange={onContentValueChange}
        />
      ))}
    </div>
  )
}

type DesktopContentField = {
  error?: string
  id: string
  label: string
  options?: Array<{ label: string; value: string }>
  placeholder?: string
  type: "text" | "textarea" | "toggle" | "segmented"
  value: StaticQrContentValue | undefined
}

function DesktopContentFieldRow({
  field,
  onContentValueChange,
}: {
  field: DesktopContentField
  onContentValueChange: (field: string, value: StaticQrContentValue) => void
}) {
  const controlId = `desktop-content-${field.id}`

  return (
    <div className={DESKTOP_INSPECTOR_FIELD_ROW_CLASS}>
      <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
        <label className={DESKTOP_INSPECTOR_LABEL_CLASS} htmlFor={controlId}>
          {field.label}
        </label>
        {field.error ? (
          <span className={cn("shrink-0", DESKTOP_INSPECTOR_CAPTION_CLASS, DESKTOP_INSPECTOR_FG_TERTIARY)}>{field.error}</span>
        ) : null}
      </div>
      {field.type === "textarea" ? (
        <DesktopInspectorTextarea
          id={controlId}
          aria-invalid={field.error ? true : undefined}
          placeholder={field.placeholder}
          value={stringContentValue(field.value)}
          onChange={(event) => onContentValueChange(field.id, event.currentTarget.value)}
        />
      ) : null}
      {field.type === "text" ? (
        <DesktopInspectorTextInput
          id={controlId}
          aria-invalid={field.error ? true : undefined}
          placeholder={field.placeholder}
          value={stringContentValue(field.value)}
          onChange={(event) => onContentValueChange(field.id, event.currentTarget.value)}
        />
      ) : null}
      {field.type === "toggle" ? (
        <button
          id={controlId}
          aria-pressed={Boolean(field.value)}
          className={cn(
            "flex h-8 w-full items-center justify-between px-2.5",
            DESKTOP_INSPECTOR_VALUE_CLASS,
            DESKTOP_INSPECTOR_CONTROL_CLASS,
            field.value && DESKTOP_INSPECTOR_SELECTED_CLASS,
          )}
          type="button"
          onClick={() => onContentValueChange(field.id, !field.value)}
        >
          <span>{field.value ? "On" : "Off"}</span>
          <span className={cn("h-4 w-7 rounded-full bg-white/18 p-0.5", field.value && "bg-white")}>
            <span
              className={cn(
                "block size-3 rounded-full bg-white transition-transform",
                field.value && "translate-x-3",
              )}
            />
          </span>
        </button>
      ) : null}
      {field.type === "segmented" ? (
        <div id={controlId} className={desktopInspectorOptionGridClass(3)}>
          {field.options?.map((option) => {
            const selected = field.value === option.value

            return (
              <button
                key={option.value}
                aria-pressed={selected}
                className={cn(
                  "h-8 px-2 font-medium",
                  DESKTOP_INSPECTOR_TYPE_LABEL_CLASS,
                  desktopInspectorOptionGridItemClass(),
                  DESKTOP_INSPECTOR_CONTROL_CLASS,
                  selected && DESKTOP_INSPECTOR_SELECTED_CLASS,
                )}
                type="button"
                onClick={() => onContentValueChange(field.id, option.value)}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function getDesktopContentFields(
  contentType: QrInputType,
  contentValues: StaticQrContentValues,
  validation: ReturnType<typeof validateStaticQrContent>,
): DesktopContentField[] {
  const text = (id: string, label: string, placeholder: string, error?: string): DesktopContentField => ({
    error,
    id,
    label,
    placeholder,
    type: "text",
    value: contentValues[id],
  })
  const textarea = (id: string, label: string, placeholder: string, error?: string): DesktopContentField => ({
    error,
    id,
    label,
    placeholder,
    type: "textarea",
    value: contentValues[id],
  })

  if (contentType === "auto") {
    return [textarea("text", "Payload", "https://example.com/invite")]
  }

  if (contentType === "text") {
    return [textarea("text", "Text", "Plain text to encode")]
  }

  if (isUrlContentType(contentType)) {
    return [text("url", "URL", "https://example.com", validation.fieldErrors.url)]
  }

  if (contentType === "phone") {
    return [text("phone", "Phone number", "+1 555 010 2000", validation.fieldErrors.phone)]
  }

  if (contentType === "email") {
    return [
      text("email", "Email", "hello@example.com", validation.fieldErrors.email),
      text("subject", "Subject", "Launch"),
      textarea("body", "Body", "Message body"),
    ]
  }

  if (contentType === "sms") {
    return [
      text("phone", "Phone number", "+1 555 010 2000", validation.fieldErrors.phone),
      textarea("message", "Message", "Message text"),
    ]
  }

  if (contentType === "wifi") {
    return [
      text("ssid", "Network", "Cafe Guest", validation.fieldErrors.ssid),
      {
        id: "security",
        label: "Security",
        options: [
          { label: "WPA", value: "WPA" },
          { label: "WEP", value: "WEP" },
          { label: "None", value: "nopass" },
        ],
        type: "segmented",
        value: contentValues.security ?? "WPA",
      },
      text("password", "Password", "Network password"),
      { id: "hidden", label: "Hidden network", type: "toggle", value: contentValues.hidden },
    ]
  }

  if (contentType === "vcard") {
    return [
      text("firstName", "First name", "Jay", validation.fieldErrors.firstName),
      text("lastName", "Last name", "Shah"),
      text("phone", "Phone", "+91 98765 43210"),
      text("email", "Email", "jay@example.com"),
      text("company", "Company", "New QR"),
      text("url", "Website", "https://example.com"),
    ]
  }

  if (contentType === "whatsapp" || contentType === "whatsapp-chat") {
    return [
      text("phone", "Phone number", "+91 98765 43210", validation.fieldErrors.phone),
      textarea("message", "Message", "I would like to book"),
    ]
  }

  if (isUsernameContentType(contentType)) {
    return [text("username", "Username", "@newqr", validation.fieldErrors.username)]
  }

  if (contentType === "map-location") {
    return [
      text("query", "Place", "Mumbai", validation.fieldErrors.query),
      text("latitude", "Latitude", "19.0760", validation.fieldErrors.latitude),
      text("longitude", "Longitude", "72.8777", validation.fieldErrors.longitude),
    ]
  }

  if (contentType === "event") {
    const eventMode = stringContentValue(contentValues.eventMode) || "url"
    const fields: DesktopContentField[] = [
      {
        id: "eventMode",
        label: "Event type",
        options: [
          { label: "URL", value: "url" },
          { label: "Calendar", value: "calendar" },
        ],
        type: "segmented",
        value: eventMode,
      },
    ]

    if (eventMode === "calendar") {
      fields.push(
        text("title", "Title", "Launch Briefing", validation.fieldErrors.title),
        text("start", "Start", "2026-06-01T09:00", validation.fieldErrors.start),
        text("end", "End", "2026-06-01T10:30"),
        text("location", "Location", "Studio 2"),
      )
    } else {
      fields.push(text("url", "URL", "https://example.com/rsvp", validation.fieldErrors.url))
    }

    return fields
  }

  if (contentType === "coupon") {
    return [
      text("code", "Code", "SAVE20", validation.fieldErrors.code),
      textarea("description", "Description", "20% off"),
      text("url", "URL", "https://example.com/save"),
    ]
  }

  return [textarea("text", "Payload", "Paste a value to encode")]
}

function isUrlContentType(type: QrInputType) {
  return [
    "link",
    "website",
    "facebook",
    "youtube",
    "linkedin",
    "discord",
    "google-review",
    "booking-link",
    "payment-link",
    "menu",
    "app-download",
    "pdf",
    "image",
    "video",
    "document",
    "form",
  ].includes(type)
}

function isUsernameContentType(type: QrInputType) {
  return [
    "instagram",
    "x",
    "tiktok",
    "telegram",
    "snapchat",
    "threads",
    "pinterest",
    "telegram-username",
  ].includes(type)
}

function stringContentValue(value: StaticQrContentValue | undefined) {
  return typeof value === "string" ? value : ""
}

function DesktopImageInspector({
  onImageSettingsChange,
  settings,
}: {
  onImageSettingsChange: (patch: Partial<DesktopImageSettings>) => void
  settings: DesktopImageSettings
}) {
  return (
    <div data-slot="desktop-image-inspector" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <DesktopInspectorHeader title="Image" />
      <DesktopInspectorScrollArea>
        <DesktopInspectorSection>
          <DesktopInspectorLabel>Intent</DesktopInspectorLabel>
          <DesktopInspectorSegmentedControl
            columns={3}
            dataSlot="desktop-image-intent"
            itemAriaLabel={(option) => `Use image as ${option.label}`}
            itemClassName="h-9 px-1.5"
            items={DESKTOP_IMAGE_INTENT_OPTIONS}
            value={settings.intent}
            onValueChange={(intent) => onImageSettingsChange({ intent })}
          />
        </DesktopInspectorSection>

        <DesktopInspectorSection className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}>
          <DesktopInspectorLabel>Source</DesktopInspectorLabel>
          <DesktopInspectorSegmentedControl
            dataSlot="desktop-image-source-mode"
            itemAriaLabel={(option) => `Use ${option.label} image source`}
            items={DESKTOP_ASSET_SOURCE_OPTIONS}
            value={settings.sourceMode}
            onValueChange={(sourceMode) => onImageSettingsChange({ sourceMode })}
          />
          <DesktopInspectorTextInput
            aria-label="Shape image URL"
            className="mt-2"
            placeholder="https://example.com/shape.png"
            value={settings.remoteUrl}
            onChange={(event) => onImageSettingsChange({ remoteUrl: event.currentTarget.value })}
          />
        </DesktopInspectorSection>

        <DesktopInspectorSection className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}>
          <DesktopInspectorLabel>Image Fit</DesktopInspectorLabel>
          <DesktopInspectorSegmentedControl
            itemAriaLabel={(option) => `Use ${option.value} image fit`}
            itemClassName="capitalize"
            items={[
              { label: "cover", value: "cover" },
              { label: "contain", value: "contain" },
            ]}
            value={settings.fit}
            onValueChange={(fit) => onImageSettingsChange({ fit })}
          />
          <div className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}>
            <DesktopMotionSliderRow
              label="Opacity"
              max={100}
              min={0}
              value={settings.opacity}
              valueLabel={`${Math.round(settings.opacity)}%`}
              onChange={(opacity) => onImageSettingsChange({ opacity })}
            />
          </div>
        </DesktopInspectorSection>
      </DesktopInspectorScrollArea>
    </div>
  )
}

function DesktopDecorationsInspector({
  onDecorationsSettingsChange,
  settings,
}: {
  onDecorationsSettingsChange: (patch: Partial<DesktopDecorationsSettings>) => void
  settings: DesktopDecorationsSettings
}) {
  return (
    <div data-slot="desktop-decorations-inspector" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <DesktopInspectorHeader title="Decorations" />
      <DesktopInspectorScrollArea>
        <DesktopInspectorSection>
          <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Add</p>
          <DesktopInspectorSegmentedControl
            columns={4}
            dataSlot="desktop-decoration-kind"
            itemAriaLabel={(option) => `Add ${option.label} decoration`}
            itemClassName="h-9 px-1.5"
            items={DESKTOP_DECORATION_OPTIONS}
            value={settings.kind}
            onValueChange={(kind) => onDecorationsSettingsChange({ kind })}
          />
        </DesktopInspectorSection>

        <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
          <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Fill</p>
          <DesktopColorInputRow
            label="Decoration fill color"
            value={settings.fill}
            onChange={(fill) => onDecorationsSettingsChange({ fill })}
          />
          <DesktopInspectorOptionGridScrollArea
            ariaLabel="Decoration fill patterns"
            className="mt-2.5"
            columns={2}
            dataSlot="desktop-decoration-patterns-scroll-area"
            rowKind="labeled"
            shelfDataSlot="desktop-decoration-patterns"
            variant="compact"
          >
            <DesktopInspectorAnimatedOptionGrid
              columns={2}
              selectedKey={settings.patternId}
            >
              <DesktopPatternSwatchButton
                label="None"
                selected={settings.patternId === DRAFTING_CARD_PATTERN_NONE_ID}
                style={{ backgroundColor: settings.fill }}
                onClick={() => onDecorationsSettingsChange({ patternId: DRAFTING_CARD_PATTERN_NONE_ID })}
              />
              {DRAFTING_CARD_PATTERNS.map((pattern) => (
                <DesktopPatternSwatchButton
                  key={pattern.id}
                  label={pattern.label}
                  selected={settings.patternId === pattern.id}
                  style={getDraftingCardPatternStyle(pattern.id, {}) ?? pattern.style}
                  onClick={() => onDecorationsSettingsChange({ patternId: pattern.id })}
                />
              ))}
            </DesktopInspectorAnimatedOptionGrid>
          </DesktopInspectorOptionGridScrollArea>
        </DesktopInspectorSection>

        <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
          <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Frame</p>
          <div className="grid gap-2">
            <DesktopNumberRow
              label="Decoration radius"
              max={96}
              min={0}
              value={settings.radius}
              onChange={(radius) => onDecorationsSettingsChange({ radius })}
            />
          </div>
        </DesktopInspectorSection>
      </DesktopInspectorScrollArea>
    </div>
  )
}

function DesktopEffectsInspector({
  onEffectsSettingsChange,
  settings,
}: {
  onEffectsSettingsChange: (patch: Partial<DesktopEffectsSettings>) => void
  settings: DesktopEffectsSettings
}) {
  const generatedShaders = getCardGeneratedShaderDefinitions()
  const imageFilters = getCardImageFilterDefinitions()
  const generatedDefinition = getPaperShaderDefinition(settings.generatedShaderId)
  const filterDefinition = getPaperShaderDefinition(settings.filterId)

  return (
    <div data-slot="desktop-effects-inspector" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <DesktopInspectorHeader title="Effects" />
      <DesktopInspectorScrollArea>
        <DesktopInspectorSection>
          <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Generated Effects</p>
          <DesktopInspectorOptionGridScrollArea
            ariaLabel="Generated effects"
            columns={2}
            dataSlot="desktop-generated-effects-scroll-area"
            rowKind="h-9"
            shelfDataSlot="desktop-generated-effects"
            variant="compact"
          >
            <div className={desktopInspectorOptionGridClass(2)}>
              {generatedShaders.slice(0, 12).map((shader) => (
                <DesktopTextPresetButton
                  key={shader.id}
                  label={shader.label}
                  selected={settings.generatedShaderId === shader.id}
                  onClick={() =>
                    onEffectsSettingsChange({
                      generatedShaderId: shader.id,
                      generatedShaderPresetName: shader.presets[0]?.name ?? "",
                    })
                  }
                />
              ))}
            </div>
          </DesktopInspectorOptionGridScrollArea>
        </DesktopInspectorSection>

        <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
          <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Preset</p>
          <DesktopInspectorNativeSelect
            aria-label="Generated effect preset"
            className="pr-2.5"
            options={generatedDefinition.presets.map((preset) => ({
              label: preset.name,
              value: preset.name,
            }))}
            showIcon={false}
            value={settings.generatedShaderPresetName}
            onValueChange={(generatedShaderPresetName) =>
              onEffectsSettingsChange({ generatedShaderPresetName })
            }
          />
        </DesktopInspectorSection>

        <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
          <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Motion</p>
          <div className="grid gap-2">
            <DesktopMotionToggleRow
              checked={settings.paused}
              label="Pause"
              onChange={(paused) => onEffectsSettingsChange({ paused })}
            />
            <DesktopMotionSliderRow
              label="Speed"
              max={4}
              min={0}
              value={settings.speed}
              valueLabel={settings.speed.toFixed(2)}
              onChange={(speed) => onEffectsSettingsChange({ speed })}
            />
            <DesktopMotionSliderRow
              label="Frame"
              max={10000}
              min={0}
              value={settings.frame}
              valueLabel={`${Math.round(settings.frame)}`}
              onChange={(frame) => onEffectsSettingsChange({ frame })}
            />
          </div>
        </DesktopInspectorSection>

        <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
          <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Image Filters</p>
          <div className={desktopInspectorOptionGridClass(2)} data-slot="desktop-image-filters">
            {imageFilters.map((filter) => (
              <DesktopTextPresetButton
                key={filter.id}
                label={filter.label}
                selected={settings.filterId === filter.id}
                onClick={() =>
                  onEffectsSettingsChange({
                    filterId: filter.id,
                    filterPresetName: filter.presets[0]?.name ?? "",
                  })
                }
              />
            ))}
          </div>
          <DesktopInspectorNativeSelect
            aria-label="Image filter preset"
            className="pr-2.5"
            options={filterDefinition.presets.map((preset) => ({
              label: preset.name,
              value: preset.name,
            }))}
            rootClassName="mt-2"
            showIcon={false}
            value={settings.filterPresetName}
            onValueChange={(filterPresetName) => onEffectsSettingsChange({ filterPresetName })}
          />
        </DesktopInspectorSection>
      </DesktopInspectorScrollArea>
    </div>
  )
}

function getDesktopLayerKindLabel(kind: DesktopLayerKind) {
  if (kind === "qr") {
    return "QR"
  }

  if (kind === "shader") {
    return "Shader"
  }

  return kind.charAt(0).toUpperCase() + kind.slice(1)
}

function DesktopLayersInspector({
  onLayersReorder,
  onLayersSettingsChange,
  onTransformLayerPatch,
  settings,
  transformLayer,
}: {
  onLayersReorder?: (orderedIds: string[]) => void
  onLayersSettingsChange: (patch: Partial<DesktopLayersSettings>) => void
  onTransformLayerPatch?: (patch: Partial<DraftingCanvasLayer>) => void
  settings: DesktopLayersSettings
  transformLayer?: DraftingCanvasLayer | null
}) {
  const layerItems = useMemo(() => settings.layers, [settings.layers])
  const isSingleLayer = layerItems.length <= 1

  function patchLayer(layerId: string, patch: Partial<DesktopLayerRow>) {
    onLayersSettingsChange({
      layers: settings.layers.map((layer) =>
        layer.id === layerId ? { ...layer, ...patch } : layer,
      ),
    })
  }

  return (
    <div data-slot="desktop-layers-inspector" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <DesktopInspectorHeader title="Layers" />
      <DesktopInspectorScrollArea>
        <DesktopInspectorSection>
          <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
            <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Layer Stack</p>
            <span className={DESKTOP_INSPECTOR_CAPTION_CLASS}>
              {settings.layers.length} total
            </span>
          </div>
          <div data-slot="desktop-layer-list">
            <DraggableList
              className="gap-1.5"
              items={layerItems}
              onReorder={(nextLayers) => onLayersReorder?.(nextLayers.map((layer) => layer.id))}
            >
            {layerItems.map((layer) => {
              const isSelected = settings.selectedLayerId === layer.id

              return (
                <DraggableListItem
                  key={layer.id}
                  className="min-w-0"
                  disabled={isSingleLayer || !onLayersReorder}
                  value={layer}
                  whileDrag={false}
                >
                  <div
                    className={cn(
                      "flex min-w-0 items-center gap-1.5 px-1.5 py-1.5",
                      DESKTOP_INSPECTOR_CONTROL_CLASS,
                      isSelected && "text-[var(--desktop-inspector-fg-primary)]",
                    )}
                    data-selected={isSelected ? "true" : "false"}
                    data-slot="desktop-layer-row-shell"
                  >
                    <DraggableListHandle
                      className={cn(
                        "size-8 shrink-0 cursor-grab rounded-[6px] border-transparent bg-transparent text-[var(--desktop-inspector-fg-muted)] shadow-none hover:border-[var(--desktop-inspector-control-border-hover)] hover:bg-[var(--desktop-inspector-control-hover-bg)] hover:text-[var(--desktop-inspector-fg-secondary)] active:cursor-grabbing",
                      )}
                      label={`Reorder ${layer.name}`}
                    />
                    <button
                      aria-current={isSelected ? "true" : undefined}
                      aria-label={`Select ${layer.name}`}
                      className="flex min-w-0 flex-1 cursor-pointer items-center bg-transparent px-1 text-left shadow-none hover:bg-transparent active:bg-transparent"
                      data-slot="desktop-layer-row"
                      type="button"
                      onClick={() => onLayersSettingsChange({ selectedLayerId: layer.id })}
                    >
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate",
                            isSelected ? DESKTOP_INSPECTOR_VALUE_CLASS : cn(DESKTOP_INSPECTOR_VALUE_CLASS, DESKTOP_INSPECTOR_FG_TERTIARY),
                          )}
                        >
                          {layer.name}
                        </span>
                        <span
                          className={cn(
                            "block truncate",
                            DESKTOP_INSPECTOR_CAPTION_CLASS,
                            isSelected ? DESKTOP_INSPECTOR_FG_SECONDARY : undefined,
                          )}
                        >
                          {getDesktopLayerKindLabel(layer.kind)}
                        </span>
                      </span>
                    </button>
                    <div
                      className="flex shrink-0 items-center gap-0.5"
                      data-slot="desktop-layer-row-actions"
                    >
                      <DesktopLayerStackIconToggle
                        active={layer.isVisible}
                        icon={layer.isVisible ? EyeIcon : ViewOffSlashIcon}
                        label={layer.isVisible ? "Visible" : "Hidden"}
                        onClick={() => patchLayer(layer.id, { isVisible: !layer.isVisible })}
                      />
                      <DesktopLayerStackIconToggle
                        active={layer.isLocked}
                        icon={layer.isLocked ? CircleLock01Icon : CircleUnlock02Icon}
                        label={layer.isLocked ? "Locked" : "Unlocked"}
                        onClick={() => patchLayer(layer.id, { isLocked: !layer.isLocked })}
                      />
                    </div>
                  </div>
                </DraggableListItem>
              )
            })}
            </DraggableList>
          </div>
        </DesktopInspectorSection>

        {transformLayer && onTransformLayerPatch ? (
          <div className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}>
            <DesktopTransformSection layer={transformLayer} onPatch={onTransformLayerPatch} />
          </div>
        ) : null}
      </DesktopInspectorScrollArea>
    </div>
  )
}

function DesktopLayerStackIconToggle({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: typeof EyeIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "grid size-7 cursor-pointer place-items-center rounded-[6px] border border-transparent bg-transparent text-[var(--desktop-inspector-fg-primary)] shadow-none transition-colors outline-none hover:bg-transparent hover:text-[var(--desktop-inspector-fg-primary)] active:bg-transparent focus-visible:ring-2 focus-visible:ring-[var(--desktop-inspector-focus)]",
      )}
      data-slot="desktop-layer-stack-icon-toggle"
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    >
      <HugeiconsIcon icon={icon} size={14} color="currentColor" strokeWidth={1.8} />
    </button>
  )
}

function DesktopExportInspector({
  buildCodegenExport,
  exportDownloadError,
  onExportDownload,
  onExportSettingsChange,
  settings,
}: {
  buildCodegenExport?: (target: CodeExportTarget) => Promise<{ code: string; installCommand?: string }>
  exportDownloadError?: string | null
  onExportDownload: () => void
  onExportSettingsChange: (patch: Partial<DesktopExportSettings>) => void
  settings: DesktopExportSettings
}) {
  const selectedQuality =
    DESKTOP_RASTER_EXPORT_PRESETS.find((preset) => preset.id === settings.qualityPresetId) ??
    DESKTOP_RASTER_EXPORT_PRESETS[1]
  const isRasterExport = settings.extension !== "svg"

  return (
    <div data-slot="desktop-export-inspector" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <DesktopInspectorHeader title="Export" />
      <DesktopInspectorScrollArea>
        <DesktopInspectorSection>
          <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Target</p>
          <div className={desktopInspectorOptionStackClass()} data-slot="desktop-export-target-list">
            {DESKTOP_EXPORT_TARGET_OPTIONS.map((option) => (
              <DesktopTextPresetButton
                key={option.value}
                label={option.label}
                selected={settings.target === option.value}
                onClick={() => onExportSettingsChange({ target: option.value })}
              />
            ))}
          </div>
        </DesktopInspectorSection>

        <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
          <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Format</p>
          <div className={desktopInspectorOptionGridClass(4)} data-slot="desktop-export-format-grid">
            {DESKTOP_DOWNLOAD_EXTENSIONS.map((extension) => (
              <button
                key={extension}
                aria-label={`Export ${extension.toUpperCase()}`}
                aria-pressed={settings.extension === extension}
                className={cn(
                  "h-9 px-1.5 font-medium",
                  DESKTOP_INSPECTOR_TYPE_LABEL_CLASS,
                  desktopInspectorOptionGridItemClass(),
                  DESKTOP_INSPECTOR_CONTROL_CLASS,
                  settings.extension === extension && DESKTOP_INSPECTOR_SELECTED_CLASS,
                )}
                type="button"
                onClick={() => onExportSettingsChange({ extension })}
              >
                {extension.toUpperCase()}
              </button>
            ))}
          </div>
        </DesktopInspectorSection>

        {isRasterExport ? (
          <>
            <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
              <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Platform size</p>
              <div className={desktopInspectorOptionStackClass()} data-slot="desktop-export-platform-grid">
                {EXPORT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    aria-label={`Use ${preset.label} export size`}
                    aria-pressed={settings.exportPresetId === preset.id && settings.usePlatformPreset}
                    className={cn(
                      "min-w-0 px-3 py-2 text-left",
                      desktopInspectorOptionGridItemClass(),
                      DESKTOP_INSPECTOR_CONTROL_CLASS,
                      settings.exportPresetId === preset.id &&
                        settings.usePlatformPreset &&
                        DESKTOP_INSPECTOR_SELECTED_CLASS,
                    )}
                    type="button"
                    onClick={() =>
                      onExportSettingsChange({
                        exportPresetId: preset.id,
                        extension: preset.format,
                        usePlatformPreset: true,
                      })
                    }
                  >
                    <span className={cn("block truncate", DESKTOP_INSPECTOR_VALUE_CLASS, DESKTOP_INSPECTOR_FG_TERTIARY)}>
                      {preset.label}
                    </span>
                    <span className={cn("mt-0.5 block truncate", DESKTOP_INSPECTOR_CAPTION_CLASS)}>
                      {formatExportPresetLabel(preset)}
                    </span>
                  </button>
                ))}
              </div>
            </DesktopInspectorSection>

            <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
              <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Quality</p>
              <div className={desktopInspectorOptionStackClass()} data-slot="desktop-export-quality-grid">
                {DESKTOP_RASTER_EXPORT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    aria-label={`Use ${preset.label} export quality`}
                    aria-pressed={settings.qualityPresetId === preset.id && !settings.usePlatformPreset}
                    className={cn(
                      "min-w-0 px-3 py-2 text-left",
                      desktopInspectorOptionGridItemClass(),
                      DESKTOP_INSPECTOR_CONTROL_CLASS,
                      settings.qualityPresetId === preset.id &&
                        !settings.usePlatformPreset &&
                        DESKTOP_INSPECTOR_SELECTED_CLASS,
                    )}
                    type="button"
                    onClick={() =>
                      onExportSettingsChange({
                        qualityPresetId: preset.id,
                        usePlatformPreset: false,
                      })
                    }
                >
                  <span className={cn("block truncate", DESKTOP_INSPECTOR_VALUE_CLASS, DESKTOP_INSPECTOR_FG_TERTIARY)}>
                    {preset.label}
                  </span>
                  <span className={cn("mt-0.5 block truncate", DESKTOP_INSPECTOR_CAPTION_CLASS)}>
                    {preset.sizePx} x {preset.sizePx} px · {preset.primaryUse}
                  </span>
                </button>
              ))}
            </div>
          </DesktopInspectorSection>
          </>
        ) : null}

        {buildCodegenExport ? (
          <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
            <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Copy code</p>
            <DesktopCodeExportInspector buildCodegenExport={buildCodegenExport} />
          </DesktopInspectorSection>
        ) : null}
      </DesktopInspectorScrollArea>
      <div className={DESKTOP_INSPECTOR_FOOTER_CLASS}>
        <button
          aria-label={`Download ${settings.extension.toUpperCase()}`}
          className={cn("mb-2", DESKTOP_INSPECTOR_RESET_CLASS, DESKTOP_INSPECTOR_SELECTED_CLASS)}
          data-slot="desktop-export-download"
          type="button"
          onClick={onExportDownload}
        >
          <AnimatedDownloadIcon size={14} />
          Download {settings.extension.toUpperCase()}
        </button>
        {exportDownloadError ? (
          <p className={cn("mt-2 text-center text-xs text-red-500")}>{exportDownloadError}</p>
        ) : null}
        {isRasterExport ? (
          <p className={cn("mt-2 truncate text-center", DESKTOP_INSPECTOR_CAPTION_CLASS)}>
            {selectedQuality.sizePx}px raster preset
          </p>
        ) : null}
      </div>
    </div>
  )
}

function DesktopTextInspector({
  onTextSettingsChange,
  settings,
}: {
  onTextSettingsChange: (patch: Partial<DesktopTextSettings>) => void
  settings: DesktopTextSettings
}) {
  const selectedFont = resolveDraftingFont({
    fontFamily: settings.fontFamily,
    fontId: settings.fontId,
  })
  const supportedWeights = selectedFont.weights
  const fontWeight = getDesktopTextInspectorFontWeight(settings.fontWeight, supportedWeights)
  const selectedPreset = getDesktopTextPresetId(settings)
  const [fontMenuOpen, setFontMenuOpen] = useState(false)

  useEffect(() => {
    void loadDraftingFont(selectedFont.id)
  }, [selectedFont.id])

  return (
    <div data-slot="desktop-text-inspector" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <DesktopInspectorHeader title="Text" />

      <DesktopInspectorScrollArea>
        <DesktopInspectorSection>
          <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Preset</p>
          <div className={desktopInspectorOptionGridClass(3)} data-slot="desktop-text-preset-options">
            {DESKTOP_TEXT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                aria-label={`Use ${preset.label} text preset`}
                aria-pressed={selectedPreset === preset.id}
                className={cn(
                  "h-8 px-2 font-medium",
                  DESKTOP_INSPECTOR_TYPE_LABEL_CLASS,
                  desktopInspectorOptionGridItemClass(),
                  DESKTOP_INSPECTOR_CONTROL_CLASS,
                  selectedPreset === preset.id && DESKTOP_INSPECTOR_SELECTED_CLASS,
                )}
                type="button"
                onClick={() =>
                  onTextSettingsChange({
                    fontSize: preset.fontSize,
                    fontWeight: preset.fontWeight,
                    lineHeight: preset.lineHeight,
                  })
                }
              >
                {preset.label}
              </button>
            ))}
          </div>
        </DesktopInspectorSection>

        <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
          <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Font</p>
          <div className="grid grid-cols-[1fr_4.75rem] gap-1.5">
            <div className="min-w-0" data-slot="desktop-text-font-selector">
              <button
                aria-controls="desktop-text-font-listbox"
                aria-expanded={fontMenuOpen}
                aria-label="Text font"
                aria-haspopup="listbox"
                className={cn(
                  "flex h-8 w-full min-w-0 items-center justify-between gap-2 px-2.5 text-left",
                  DESKTOP_INSPECTOR_VALUE_CLASS,
                  DESKTOP_INSPECTOR_CONTROL_CLASS,
                )}
                style={{ fontFamily: getDraftingFontCssFamily({ fontId: selectedFont.id }) }}
                type="button"
                onClick={() => setFontMenuOpen((open) => !open)}
              >
                <span className="min-w-0 flex-1 truncate">{selectedFont.label}</span>
                <ChevronDownIcon
                  className={cn("size-3.5 shrink-0 text-current transition-transform", fontMenuOpen && "rotate-180")}
                />
              </button>
            </div>
            <DesktopInspectorScrubbableNumberInput
              aria-label="Text font size"
              className={cn("h-8 rounded-[6px] px-2", DESKTOP_INSPECTOR_VALUE_CLASS, DESKTOP_INSPECTOR_CONTROL_CLASS)}
              max={300}
              min={6}
              value={settings.fontSize}
              onValueChange={(fontSize) => onTextSettingsChange({ fontSize })}
            />
          </div>
          {fontMenuOpen ? (
            <DesktopInspectorOptionGridScrollArea
              ariaLabel="Text font options"
              className="mt-2"
              dataSlot="desktop-text-font-listbox-scroll-area"
              role="listbox"
              rowKind="h-8"
              shelfDataSlot="desktop-text-font-listbox"
              shelfId="desktop-text-font-listbox"
              variant="compact"
            >
              <div className={desktopInspectorOptionStackClass()}>
                {DRAFTING_FONT_REGISTRY.map((font) => (
                  <button
                    key={font.id}
                    aria-label={`Use ${font.label} text font`}
                    aria-selected={selectedFont.id === font.id}
                    className={cn(
                      "flex h-8 min-w-0 items-center px-2.5 text-left",
                      DESKTOP_INSPECTOR_VALUE_CLASS,
                      desktopInspectorOptionGridItemClass(),
                      DESKTOP_INSPECTOR_CONTROL_CLASS,
                      selectedFont.id === font.id && DESKTOP_INSPECTOR_SELECTED_CLASS,
                    )}
                    role="option"
                    style={{ fontFamily: getDraftingFontCssFamily({ fontId: font.id }) }}
                    type="button"
                    onClick={() => {
                      void loadDraftingFont(font.id)
                      onTextSettingsChange({ fontFamily: font.family, fontId: font.id })
                      setFontMenuOpen(false)
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate">{font.label}</span>
                  </button>
                ))}
              </div>
            </DesktopInspectorOptionGridScrollArea>
          ) : null}
          <DesktopTextInlineSlider
            label="Size"
            max={300}
            min={6}
            value={settings.fontSize}
            valueLabel={`${Math.round(settings.fontSize)} px`}
            onChange={(fontSize) => onTextSettingsChange({ fontSize })}
          />
          <DesktopTextInlineSlider
            label="Weight"
            max={Math.max(...supportedWeights)}
            min={Math.min(...supportedWeights)}
            step={getDesktopFontWeightSliderStep(supportedWeights)}
            value={fontWeight}
            valueLabel={String(Math.round(fontWeight))}
            onChange={(nextWeight) =>
              onTextSettingsChange({
                fontWeight: getNearestDesktopFontWeight(nextWeight, supportedWeights),
              })
            }
          />
          <div className={cn("mt-2", desktopInspectorOptionGridClass(3))} data-slot="desktop-text-emphasis">
            <DesktopTextToggleButton
              active={fontWeight >= 700}
              icon={<BoldIcon className="size-3.5" />}
              label="Bold"
              onClick={() =>
                onTextSettingsChange({
                  fontWeight:
                    fontWeight >= 700
                      ? getNearestDesktopFontWeight(400, supportedWeights)
                      : getNearestDesktopFontWeight(700, supportedWeights),
                })
              }
            />
            <DesktopTextToggleButton
              active={settings.fontStyle === "italic"}
              icon={<ItalicIcon className="size-3.5" />}
              label="Italic"
              onClick={() =>
                onTextSettingsChange({
                  fontStyle: settings.fontStyle === "italic" ? "normal" : "italic",
                })
              }
            />
            <DesktopTextToggleButton
              active={settings.underline}
              icon={<UnderlineIcon className="size-3.5" />}
              label="Underline"
              onClick={() => onTextSettingsChange({ underline: !settings.underline })}
            />
          </div>
        </DesktopInspectorSection>

        <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
          <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
            <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Text</p>
            <button
              aria-label="Add Text"
              className={cn("grid size-7 shrink-0 place-items-center", DESKTOP_INSPECTOR_CONTROL_CLASS)}
              type="button"
              onClick={() => onTextSettingsChange({ text: DEFAULT_DESKTOP_TEXT_SETTINGS.text })}
            >
              <TypeIcon className="size-3.5" />
            </button>
          </div>
          <DesktopInspectorTextarea
            aria-label="Text layer content"
            className="min-h-16 py-2"
            value={settings.text}
            onChange={(event) => onTextSettingsChange({ text: event.currentTarget.value })}
          />
        </DesktopInspectorSection>

        <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
          <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Color</p>
          <DesktopColorInputRow
            label="Text fill color"
            value={settings.fill}
            onChange={(fill) => onTextSettingsChange({ fill })}
          />
        </DesktopInspectorSection>

        <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
          <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Alignment</p>
          <div className={desktopInspectorOptionGridClass(3)} data-slot="desktop-text-alignment">
            {DESKTOP_TEXT_ALIGN_OPTIONS.map((option) => (
              <button
                key={option.value}
                aria-label={`Align text ${option.value}`}
                aria-pressed={settings.textAlign === option.value}
                className={cn(
                  "h-8 px-2 font-medium",
                  DESKTOP_INSPECTOR_TYPE_LABEL_CLASS,
                  desktopInspectorOptionGridItemClass(),
                  DESKTOP_INSPECTOR_CONTROL_CLASS,
                  settings.textAlign === option.value &&
                    DESKTOP_INSPECTOR_SELECTED_CLASS,
                )}
                type="button"
                onClick={() => onTextSettingsChange({ textAlign: option.value })}
              >
                <DesktopTextAlignIcon value={option.value} />
              </button>
            ))}
          </div>
        </DesktopInspectorSection>

        <DesktopInspectorSection className={cn(DESKTOP_INSPECTOR_SECTION_GAP_CLASS)}>
          <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>Spacing</p>
          <div className="grid gap-2">
            <DesktopTextInlineSlider
              label="Letter spacing"
              max={200}
              min={-50}
              value={settings.letterSpacing}
              valueLabel={`${Math.round(settings.letterSpacing)} px`}
              onChange={(letterSpacing) => onTextSettingsChange({ letterSpacing })}
            />
            <DesktopTextInlineSlider
              label="Line height"
              max={4}
              min={0.6}
              step={0.05}
              value={settings.lineHeight}
              valueLabel={settings.lineHeight.toFixed(2)}
              onChange={(lineHeight) => onTextSettingsChange({ lineHeight })}
            />
          </div>
        </DesktopInspectorSection>
      </DesktopInspectorScrollArea>

    </div>
  )
}

function DesktopTextToggleButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-label={`${label} text`}
      aria-pressed={active}
      className={cn(
        "h-8 px-2 font-medium",
        DESKTOP_INSPECTOR_TYPE_LABEL_CLASS,
        desktopInspectorOptionGridItemClass(),
        DESKTOP_INSPECTOR_CONTROL_CLASS,
        active && DESKTOP_INSPECTOR_SELECTED_CLASS,
      )}
      type="button"
      onClick={onClick}
    >
      <span className="grid place-items-center">{icon}</span>
    </button>
  )
}

function DesktopTextAlignIcon({ value }: { value: DraftingTextAlign }) {
  if (value === "center") {
    return <AlignCenterIcon className="mx-auto size-3.5" />
  }

  if (value === "right") {
    return <AlignRightIcon className="mx-auto size-3.5" />
  }

  return <AlignLeftIcon className="mx-auto size-3.5" />
}

function DesktopTextInlineSlider({
  label,
  max,
  min,
  onChange,
  step = 1,
  value,
  valueLabel,
}: {
  label: string
  max: number
  min: number
  onChange: (value: number) => void
  step?: number
  value: number
  valueLabel: string
}) {
  return (
    <div
      data-slot="desktop-elastic-slider-row"
      className="mt-2 grid min-w-0 py-1.5"
    >
      <div data-slot="desktop-elastic-slider">
        <ElasticSlider
          aria-label={`Text font ${label.toLowerCase()}`}
          className={DESKTOP_ELASTIC_SLIDER_CLASS}
          formatValue={() => valueLabel}
          label={label}
          max={max}
          min={min}
          scrubSound
          step={step}
          value={value}
          onValueChange={onChange}
        />
      </div>
    </div>
  )
}

function getDesktopTextPresetId(settings: DesktopTextSettings) {
  return (
    DESKTOP_TEXT_PRESETS.find(
      (preset) =>
        preset.fontSize === settings.fontSize &&
        preset.fontWeight === settings.fontWeight &&
        preset.lineHeight === settings.lineHeight,
    )?.id ?? "body"
  )
}

function getDesktopTextInspectorFontWeight(
  fontWeight: DraftingTextFontWeight,
  supportedWeights: readonly number[],
) {
  if (fontWeight === "bold") {
    return getNearestDesktopFontWeight(700, supportedWeights)
  }

  if (typeof fontWeight === "number" && Number.isFinite(fontWeight)) {
    return getNearestDesktopFontWeight(fontWeight, supportedWeights)
  }

  return getNearestDesktopFontWeight(400, supportedWeights)
}

function getNearestDesktopFontWeight(value: number, supportedWeights: readonly number[]) {
  return supportedWeights.reduce((nearestWeight, candidateWeight) => {
    const nearestDistance = Math.abs(nearestWeight - value)
    const candidateDistance = Math.abs(candidateWeight - value)

    if (candidateDistance === nearestDistance) {
      return candidateWeight > nearestWeight ? candidateWeight : nearestWeight
    }

    return candidateDistance < nearestDistance ? candidateWeight : nearestWeight
  }, supportedWeights[0] ?? 400)
}

function getDesktopFontWeightSliderStep(supportedWeights: readonly number[]) {
  const sortedWeights = [...new Set(supportedWeights)].sort((a, b) => a - b)

  if (sortedWeights.length < 2) {
    return 1
  }

  return Math.min(
    ...sortedWeights.slice(1).map((fontWeight, index) => fontWeight - sortedWeights[index]),
  )
}

function DesktopPlaceholderInspector({ tool }: { tool: DesktopToolbarTool }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <DesktopInspectorHeader title={tool.title} />
    </div>
  )
}

export function DesktopFloatingInspector({
  activeTool,
  className,
  model,
}: {
  activeTool: DesktopToolbarToolId | null
  className?: string
  model: DesktopInspectorModel
}) {
  const {
    activeToolConfig,
    actualContentType,
    actualContentValidation,
    actualContentValues,
    actualCornersSettings,
    actualDecorationsSettings,
    actualEffectsSettings,
    actualEncodedContentValue,
    actualEncodingSettings,
    actualAccessibilitySettings,
    actualExportSettings,
    actualImageSettings,
    actualLayoutSettings,
    actualLayersSettings,
    actualLogoSettings,
    actualMotionSettings,
    actualPatternSettings,
    actualSceneTemplateSettings,
    actualShapeSettings,
    actualTextSettings,
    controller,
    onContentTypeChange,
    onContentValueChange,
    onCornersSettingsChange,
    onDecorationsSettingsChange,
    onEffectsSettingsChange,
    onEncodingSettingsChange,
    onAccessibilitySettingsChange,
    onExportSettingsChange,
    onImageSettingsChange,
    onLayoutSettingsChange,
    onLayersReorder,
    onLayersSettingsChange,
    onLogoSettingsChange,
    onMotionSettingsChange,
    onPatternSettingsChange,
    onSceneTemplateSizeChange,
    onShapeSettingsChange,
    onTextSettingsChange,
    actualDesktopTheme,
  } = model
  const resolvedToolConfig =
    activeToolConfig ?? DESKTOP_TOOLBAR_TOOLS.find((tool) => tool.id === activeTool)
  const showStockPhotosInspector = controller?.composeSidebarPanel === "stock-photos"
  const showElementInspector =
    Boolean(controller?.selectedElementLayer) &&
    activeTool !== "layers" &&
    !resolvedToolConfig &&
    !showStockPhotosInspector

  if (!resolvedToolConfig && !controller?.selectedElementLayer && !showStockPhotosInspector) {
    return null
  }

  return (
    <SurfaceProvider value={1}>
      <aside
      aria-label={
        showStockPhotosInspector
          ? "Stock photos"
          : showElementInspector
          ? `${controller?.selectedElementLayer?.kind} element settings`
          : resolvedToolConfig
            ? `${resolvedToolConfig.title} settings`
            : "Tool settings"
      }
      data-slot="desktop-floating-inspector"
      className={cn("flex h-full min-h-0 min-w-0 flex-col overflow-hidden", className)}
    >
      {showStockPhotosInspector ? (
        <DesktopPexelsPhotoInspector
          onClose={() => controller?.onCloseComposeSidebar?.()}
          onSelectPhoto={(imageUrl) => controller?.onSelectStockPhoto?.(imageUrl)}
        />
      ) : showElementInspector && controller?.selectedElementLayer ? (
        <DesktopElementInspector
          layer={controller.selectedElementLayer}
          onPatch={(patch) => controller.onElementLayerPatch?.(patch)}
        />
      ) : activeTool === "templates" ? (
        <DesktopSceneTemplateInspector
          onApplyMockupStyle={(preset) => controller?.onApplyMockupStyle?.(preset)}
          onSelectTemplate={(template) => controller?.onSceneTemplateSelect?.(template)}
          onSizeSettingsChange={(patch) => controller?.onSceneTemplateSizeChange?.(patch)}
          onSelectSizeTemplate={(template) => controller?.onSceneTemplateSizeTemplateSelect?.(template)}
          settings={actualSceneTemplateSettings}
        />
      ) : activeTool === "layout" ? (
        <DesktopLayoutInspector
          onLayoutChange={onLayoutSettingsChange}
          onLayoutPresetSelect={(preset) => controller?.onLayoutPresetSelect?.(preset)}
          settings={actualLayoutSettings}
        />
      ) : activeTool === "content" ? (
        <DesktopContentInspector
          accessibilitySettings={actualAccessibilitySettings}
          contentType={actualContentType}
          contentValues={actualContentValues}
          desktopTheme={actualDesktopTheme}
          encodedValue={actualEncodedContentValue}
          validation={actualContentValidation}
          onAccessibilitySettingsChange={onAccessibilitySettingsChange}
          onContentTypeChange={onContentTypeChange}
          onContentValueChange={onContentValueChange}
        />
      ) : activeTool === "pattern" ? (
        <DesktopPatternInspector
          desktopTheme={actualDesktopTheme}
          encodingSettings={actualEncodingSettings}
          errorCorrectionLevel={actualEncodingSettings.errorCorrectionLevel}
          settings={actualPatternSettings}
          onEncodingSettingsChange={onEncodingSettingsChange}
          onErrorCorrectionLevelChange={(errorCorrectionLevel) =>
            onEncodingSettingsChange({ errorCorrectionLevel })
          }
          onPatternSettingsChange={onPatternSettingsChange}
        />
      ) : activeTool === "corners" ? (
        <DesktopCornersInspector
          desktopTheme={actualDesktopTheme}
          settings={actualCornersSettings}
          onCornersSettingsChange={onCornersSettingsChange}
        />
      ) : activeTool === "logo" ? (
        <DesktopLogoInspector
          desktopTheme={actualDesktopTheme}
          settings={actualLogoSettings}
          onLogoSettingsChange={onLogoSettingsChange}
        />
      ) : activeTool === "shape" ? (
        <DesktopShapeInspector
          desktopTheme={actualDesktopTheme}
          settings={actualShapeSettings}
          onShapeSettingsChange={onShapeSettingsChange}
        />
      ) : activeTool === "motion" ? (
        <DesktopMotionInspector
          settings={actualMotionSettings}
          onMotionSettingsChange={onMotionSettingsChange}
        />
      ) : activeTool === "card-pattern" ? (
        <DesktopCardFillPatternInspector
          settings={actualShapeSettings}
          onShapeSettingsChange={onShapeSettingsChange}
        />
      ) : activeTool === "decorations" ? (
        <DesktopDecorationsInspector
          settings={actualDecorationsSettings}
          onDecorationsSettingsChange={onDecorationsSettingsChange}
        />
      ) : activeTool === "effects" ? (
        <DesktopEffectsInspector
          settings={actualEffectsSettings}
          onEffectsSettingsChange={onEffectsSettingsChange}
        />
      ) : activeTool === "layers" ? (
        <DesktopLayersInspector
          onLayersReorder={onLayersReorder}
          onLayersSettingsChange={onLayersSettingsChange}
          onTransformLayerPatch={(patch) => {
            if (controller?.onTransformLayerPatch) {
              controller.onTransformLayerPatch(patch)
              return
            }

            controller?.onElementLayerPatch?.(patch)
          }}
          settings={actualLayersSettings}
          transformLayer={
            controller?.selectedTransformLayer ?? controller?.selectedElementLayer ?? null
          }
        />
      ) : activeTool === "export" ? (
        <DesktopExportInspector
          buildCodegenExport={controller?.buildCodegenExport}
          exportDownloadError={controller?.exportDownloadError}
          settings={actualExportSettings}
          onExportDownload={controller?.onExportDownload ?? (() => undefined)}
          onExportSettingsChange={onExportSettingsChange}
        />
      ) : resolvedToolConfig ? (
        <DesktopPlaceholderInspector tool={resolvedToolConfig} />
      ) : null}
    </aside>
    </SurfaceProvider>
  )
}

export { DESKTOP_TOOLBAR_TOOLS }
