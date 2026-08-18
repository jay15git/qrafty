import { DEFAULT_BRAND_ICON_COLOR } from "@/features/qr-code/assets/brand-icon-svg"
import {
  ICONSTACK_LIBRARIES,
  type IconstackLibraryId,
} from "@/features/qr-code/assets/iconstack-api"
import {
  DEFAULT_DRAFTING_TEXT_LAYER,
  type DraftingTextAlign,
  type DraftingTextFontWeight,
} from "@/features/workspace/model/layers"
import {
  createDefaultDraftingCardPaperShader,
  DEFAULT_DRAFTING_CARD_STATE,
} from "@/features/workspace/model/card-state"
import { getCardImageFilterDefinitions } from "@/features/workspace/rendering/paper-shaders"
import { ERROR_CORRECTION_LEVEL_OPTIONS } from "@/features/qr-code/styles/encoding-options"
import {
  DEFAULT_DOT_MATRIX_ANIMATION,
  DEFAULT_BACKGROUND_SHAPE_OPTIONS,
  MOTION_COLOR_SWATCHES,
  type DotsColorMode,
  type QrCrossOrigin,
  type QrGradientLinkMode,
  type QrLogoPositionMode,
  type QrLogoSizeMode,
  type StudioGradient,
} from "@/features/qr-code/model/state"
import { type QrErrorCorrectionLevel, type QrFileExtension } from "@/features/qr-code/model/types"
import type {
  DesktopAccessibilitySettings,
  DesktopAssetSourceMode,
  DesktopBackgroundSettings,
  DesktopCornerColorMode,
  DesktopCornersSettings,
  DesktopEffectsSettings,
  DesktopEncodingSettings,
  DesktopExportSettings,
  DesktopExportTarget,
  DesktopImageIntent,
  DesktopImageSettings,
  DesktopLayerRow,
  DesktopLayersSettings,
  DesktopLogoSettings,
  DesktopLogoSourceMode,
  DesktopMotionSettings,
  DesktopPatternSettings,
  DesktopRasterExportPresetId,
  DesktopShapeColorMode,
  DesktopShapeSettings,
  DesktopTextPresetId,
  DesktopTextSettings,
} from "@/features/desktop-shell/model/desktop-toolbar-types"

export const DEFAULT_DESKTOP_DOTS_GRADIENT: StudioGradient = {
  enabled: true,
  type: "linear",
  rotation: 0,
  colorStops: [
    { offset: 0, color: "#18181b" },
    { offset: 1, color: "#3f3f46" },
  ],
}

export const DEFAULT_DESKTOP_DOTS_PALETTE = ["#04879c", "#0c3c78", "#090030", "#f30a49"]

export const DESKTOP_DOTS_PALETTE_PRESETS: Array<{
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

export const DESKTOP_ICONSTACK_LIBRARY_OPTIONS: Array<{
  label: string
  value: IconstackLibraryId | "all"
}> = [
  { label: "All libraries", value: "all" },
  ...ICONSTACK_LIBRARIES.map((library) => ({
    label: library.label,
    value: library.id,
  })),
]

export const DESKTOP_DOTS_COLOR_MODES: Array<{ label: string; value: DotsColorMode }> = [
  { label: "Solid", value: "solid" },
  { label: "Gradient", value: "gradient" },
  { label: "Patterns", value: "palette" },
]

export const DESKTOP_ERROR_CORRECTION_LEVEL_OPTIONS: Array<{
  label: string
  value: QrErrorCorrectionLevel
}> = ERROR_CORRECTION_LEVEL_OPTIONS.map((option) => ({
  label: option.label,
  value: option.value,
}))

export const DESKTOP_CORNER_COLOR_MODES: Array<{ label: string; value: DesktopCornerColorMode }> = [
  { label: "Solid", value: "solid" },
  { label: "Gradient", value: "gradient" },
]

export const DESKTOP_SHAPE_COLOR_MODES: Array<{ label: string; value: DesktopShapeColorMode }> = [
  { label: "Solid", value: "solid" },
  { label: "Gradient", value: "gradient" },
]

export const DESKTOP_GRADIENT_TYPE_OPTIONS: Array<{ label: string; value: StudioGradient["type"] }> = [
  { label: "Linear", value: "linear" },
  { label: "Radial", value: "radial" },
]

export const DESKTOP_LOGO_SOURCE_OPTIONS: Array<{ label: string; value: DesktopLogoSourceMode }> = [
  { label: "None", value: "none" },
  { label: "Brand", value: "brand" },
  { label: "Upload", value: "upload" },
]

export const DESKTOP_ASSET_SOURCE_OPTIONS: Array<{ label: string; value: DesktopAssetSourceMode }> = [
  { label: "Upload", value: "upload" },
  { label: "URL", value: "url" },
]

export const DESKTOP_IMAGE_INTENT_OPTIONS: Array<{ label: string; value: DesktopImageIntent }> = [
  { label: "Object", value: "image-object" },
  { label: "Shape fill", value: "shape-fill" },
  { label: "Logo", value: "logo" },
]

export const DESKTOP_EXPORT_TARGET_OPTIONS: Array<{ label: string; value: DesktopExportTarget }> = [
  { label: "Current QR", value: "current" },
  { label: "All QR codes", value: "all-qr" },
  { label: "Full surface", value: "surface" },
]

export const DESKTOP_DOWNLOAD_EXTENSIONS = ["svg", "png", "webp", "jpeg"] as const satisfies ReadonlyArray<
  QrFileExtension
>

export const DESKTOP_RASTER_EXPORT_PRESETS = [
  { id: "quick-share", label: "Quick share", primaryUse: "chat, email, docs", sizePx: 512 },
  { id: "web-social", label: "Web & social", primaryUse: "sites, posts, menus", sizePx: 1024 },
  { id: "small-print", label: "Small print", primaryUse: "stickers, cards", sizePx: 1600 },
  { id: "flyer-poster", label: "Flyer / poster", primaryUse: "nearby signage", sizePx: 2400 },
  { id: "large-format", label: "Large format", primaryUse: "banners, walls", sizePx: 3200 },
  { id: "max-quality", label: "Max quality", primaryUse: "handoff, archive", sizePx: 4096 },
] as const

export const DESKTOP_CROSS_ORIGIN_OPTIONS: Array<{ label: string; value: QrCrossOrigin }> = [
  { label: "Default", value: "" },
  { label: "Anonymous", value: "anonymous" },
  { label: "Credentials", value: "use-credentials" },
]

export const DESKTOP_GRADIENT_LINK_OPTIONS: Array<{ label: string; value: QrGradientLinkMode }> = [
  { label: "Split", value: "split" },
  { label: "Unified", value: "unified" },
]

export const DESKTOP_LOGO_SIZE_MODE_OPTIONS: Array<{ label: string; value: QrLogoSizeMode }> = [
  { label: "Ratio", value: "ratio" },
  { label: "Pixels", value: "pixels" },
]

export const DESKTOP_LOGO_POSITION_OPTIONS: Array<{ label: string; value: QrLogoPositionMode }> = [
  { label: "Center", value: "center" },
  { label: "Custom", value: "custom" },
]

export const DEFAULT_DESKTOP_PATTERN_SETTINGS: DesktopPatternSettings = {
  dotsColorMode: "solid",
  dataModulesGradient: DEFAULT_DESKTOP_DOTS_GRADIENT,
  dotsPalette: DEFAULT_DESKTOP_DOTS_PALETTE,
  dotsPalettePreset: "Signal",
  dotsSolidColor: "#18181b",
  qrDotType: "rounded",
  moduleRoundSize: true,
  gradientLinkMode: "split",
}

export const DEFAULT_DESKTOP_LOGO_SETTINGS: DesktopLogoSettings = {
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

export const DEFAULT_DESKTOP_CORNERS_SETTINGS: DesktopCornersSettings = {
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

export const DEFAULT_DESKTOP_SHAPE_SETTINGS: DesktopShapeSettings = {
  backgroundShapeId: "none",
  bottomSpace: DEFAULT_DRAFTING_CARD_STATE.bottomSpace,
  cardFill: DEFAULT_DRAFTING_CARD_STATE.fill,
  cardHeight: DEFAULT_DRAFTING_CARD_STATE.height,
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

export const DEFAULT_DESKTOP_MOTION_SETTINGS: DesktopMotionSettings = {
  ...DEFAULT_DOT_MATRIX_ANIMATION,
}

export const DEFAULT_DESKTOP_ENCODING_SETTINGS: DesktopEncodingSettings = {
  errorCorrectionLevel: "Q",
  typeNumber: 0,
  boostLevel: true,
  valueSegmentsText: "",
}

export const DEFAULT_DESKTOP_ACCESSIBILITY_SETTINGS: DesktopAccessibilitySettings = {
  ariaLabel: "",
}

export const DEFAULT_DESKTOP_IMAGE_SETTINGS: DesktopImageSettings = {
  fit: "cover",
  intent: "image-object",
  opacity: 100,
  remoteUrl: "",
  sourceMode: "upload",
}

export const DEFAULT_DESKTOP_BACKGROUND_SETTINGS: DesktopBackgroundSettings = {
  paperShader: createDefaultDraftingCardPaperShader(
    DEFAULT_DRAFTING_CARD_STATE.paperShader.shaderId,
  ),
  styleMode: DEFAULT_DRAFTING_CARD_STATE.styleMode,
}

export const DEFAULT_DESKTOP_EFFECTS_SETTINGS: DesktopEffectsSettings = {
  filterId: getCardImageFilterDefinitions()[0]?.id ?? "paper-texture",
  filterPresetName: getCardImageFilterDefinitions()[0]?.presets[0]?.name ?? "",
}

export const DEFAULT_DESKTOP_LAYERS: DesktopLayerRow[] = [
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

export const DEFAULT_DESKTOP_LAYERS_SETTINGS: DesktopLayersSettings = {
  layers: DEFAULT_DESKTOP_LAYERS.map((layer) => ({ ...layer })),
  selectedLayerId: DEFAULT_DESKTOP_LAYERS[1]?.id ?? "",
}

export const DEFAULT_DESKTOP_EXPORT_SETTINGS: DesktopExportSettings = {
  extension: "png",
  qualityPresetId: "web-social",
  target: "current",
}

export const DEFAULT_DESKTOP_TEXT_SETTINGS: DesktopTextSettings = {
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

export const DESKTOP_TEXT_PRESETS: Array<{
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

export const DESKTOP_TEXT_ALIGN_OPTIONS: Array<{ label: string; value: DraftingTextAlign }> = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
]

export const DESKTOP_MOTION_COLOR_SWATCHES: Record<DesktopMotionSettings["colorPreset"], string[]> =
  MOTION_COLOR_SWATCHES
