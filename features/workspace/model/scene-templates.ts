import type { BackgroundShapeOptions } from "@/features/qr-code/model/state"
import type { DraftingCardPatternColorOverrides, DraftingCardPatternId } from "@/features/workspace/model/card-patterns"
import type { DraftingCardState } from "@/features/workspace/model/card-state"
import type { ExportPresetId } from "@/features/workspace/model/export-presets"
import type { PaperShaderId, PaperShaderParams } from "@/features/workspace/rendering/paper-shaders"

export type SceneTemplateCategory =
  | "solid"
  | "gradient"
  | "glass"
  | "texture"
  | "cosmic"
  | "minimal"
  | "bold"

export const SCENE_TEMPLATE_CATEGORY_LABELS: Record<SceneTemplateCategory, string> = {
  solid: "Solid",
  gradient: "Gradient",
  glass: "Glass",
  texture: "Texture",
  cosmic: "Cosmic",
  minimal: "Minimal",
  bold: "Bold",
}

export const SCENE_TEMPLATE_CATEGORIES: readonly SceneTemplateCategory[] = [
  "solid",
  "gradient",
  "glass",
  "texture",
  "cosmic",
  "minimal",
  "bold",
] as const

export type SceneLayoutPreset = {
  id: string
  label: string
  rotation: number
  tiltX: number
  tiltY: number
  zoom: number
}

export type SceneGradientStop = { color: string; offset: number }

export type SceneBackground =
  | { angle: number; kind: "gradient"; stops: [SceneGradientStop, SceneGradientStop] }
  | { colors?: Partial<Record<DraftingCardPatternId, DraftingCardPatternColorOverrides>>; kind: "pattern"; patternId: DraftingCardPatternId }
  | { fit: "contain" | "cover"; kind: "image"; src: string }
  | { kind: "paper-shader"; params?: Partial<PaperShaderParams>; shaderId: PaperShaderId }
  | { color: string; kind: "solid" }

export type SceneCompositionState = {
  background: SceneBackground
  exportPresetId?: ExportPresetId
  layout: SceneLayoutPreset
  templateId?: string
}

export type SceneTemplate = {
  cardState: Partial<DraftingCardState>
  category: SceneTemplateCategory
  exportPresetId?: ExportPresetId
  featured?: boolean
  id: string
  layout: SceneLayoutPreset
  qrFrame?: Partial<BackgroundShapeOptions>
  sceneBackground: SceneBackground
  sizePresetId: string
  thumbnailUrl: string
  title: string
}

export type MockupStylePreset = {
  cardState: Partial<DraftingCardState>
  id: string
  label: string
}

export const DEFAULT_SCENE_LAYOUT: SceneLayoutPreset = {
  id: "flat",
  label: "Flat",
  rotation: 0,
  tiltX: 0,
  tiltY: 0,
  zoom: 1,
}

export const SCENE_LAYOUT_PRESETS: readonly SceneLayoutPreset[] = [
  DEFAULT_SCENE_LAYOUT,
  { id: "tilt-left", label: "Tilt left", zoom: 0.95, tiltX: 4, tiltY: -12, rotation: 0 },
  { id: "tilt-right", label: "Tilt right", zoom: 0.95, tiltX: 4, tiltY: 12, rotation: 0 },
  { id: "top-down", label: "Top down", zoom: 0.9, tiltX: 18, tiltY: 0, rotation: 0 },
  { id: "hero-zoom", label: "Hero zoom", zoom: 1.1, tiltX: 2, tiltY: -4, rotation: 0 },
  { id: "dramatic-left", label: "Dramatic left", zoom: 0.88, tiltX: 8, tiltY: -18, rotation: -2 },
  { id: "dramatic-right", label: "Dramatic right", zoom: 0.88, tiltX: 8, tiltY: 18, rotation: 2 },
  { id: "floating", label: "Floating", zoom: 0.92, tiltX: -6, tiltY: 0, rotation: 0 },
  { id: "angled", label: "Angled", zoom: 1, tiltX: 0, tiltY: 0, rotation: 6 },
] as const

export const MOCKUP_STYLE_PRESETS: readonly MockupStylePreset[] = [
  {
    id: "glass-light",
    label: "Glass light",
    cardState: {
      cornerRadius: 24,
      fill: "#ffffff",
      shadow: { blur: 48, color: "#0f172a", inset: false, kind: "drop", offsetX: 0, offsetY: 24, opacity: 28, spread: 0, visible: true },
      styleMode: "pattern",
      patternId: "none",
    },
  },
  {
    id: "glass-dark",
    label: "Glass dark",
    cardState: {
      cornerRadius: 24,
      fill: "#111827",
      shadow: { blur: 52, color: "#000000", inset: false, kind: "drop", offsetX: 0, offsetY: 28, opacity: 45, spread: 0, visible: true },
      styleMode: "pattern",
      patternId: "none",
    },
  },
  {
    id: "inset-light",
    label: "Inset light",
    cardState: {
      cornerRadius: 16,
      fill: "#f8fafc",
      shadow: { blur: 0, color: "#94a3b8", inset: true, kind: "drop", offsetX: 0, offsetY: 2, opacity: 40, spread: 4, visible: true },
      border: { color: "#e2e8f0", opacity: 100, sides: { bottom: { color: "#e2e8f0", opacity: 100, style: "solid", width: 1 }, left: { color: "#e2e8f0", opacity: 100, style: "solid", width: 1 }, right: { color: "#e2e8f0", opacity: 100, style: "solid", width: 1 }, top: { color: "#e2e8f0", opacity: 100, style: "solid", width: 1 } }, style: "solid", width: 1 },
    },
  },
  {
    id: "inset-dark",
    label: "Inset dark",
    cardState: {
      cornerRadius: 16,
      fill: "#1e293b",
      shadow: { blur: 0, color: "#000000", inset: true, kind: "drop", offsetX: 0, offsetY: 2, opacity: 55, spread: 6, visible: true },
    },
  },
  {
    id: "outline",
    label: "Outline",
    cardState: {
      cornerRadius: 20,
      fill: "#ffffff",
      shadow: { blur: 0, color: "#000000", inset: false, kind: "drop", offsetX: 0, offsetY: 0, opacity: 0, spread: 0, visible: false },
      border: { color: "#18181b", opacity: 100, sides: { bottom: { color: "#18181b", opacity: 100, style: "solid", width: 2 }, left: { color: "#18181b", opacity: 100, style: "solid", width: 2 }, right: { color: "#18181b", opacity: 100, style: "solid", width: 2 }, top: { color: "#18181b", opacity: 100, style: "solid", width: 2 } }, style: "solid", width: 2 },
    },
  },
  {
    id: "liquid",
    label: "Liquid",
    cardState: {
      cornerRadius: 32,
      fill: "#ffffff",
      shadow: { blur: 64, color: "#6366f1", inset: false, kind: "drop", offsetX: 0, offsetY: 32, opacity: 35, spread: -8, visible: true },
      styleMode: "paper-shader",
    },
  },
] as const

function sceneThumbnail(hue: number, accent: string, bg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${bg}"/><stop offset="1" stop-color="hsl(${hue} 40% 45%)"/></linearGradient></defs><rect fill="url(#bg)" width="400" height="300"/><rect x="80" y="50" width="240" height="200" rx="18" fill="${accent}" fill-opacity="0.92" stroke="white" stroke-opacity="0.2" stroke-width="2"/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const SCENE_TEMPLATE_SEEDS: Omit<SceneTemplate, "thumbnailUrl">[] = [
  { id: "solid-white", title: "Clean white", category: "solid", sizePresetId: "ratio-1-1", sceneBackground: { kind: "solid", color: "#f4f4f5" }, cardState: { fill: "#ffffff", cornerRadius: 20, styleMode: "pattern", patternId: "none" }, layout: DEFAULT_SCENE_LAYOUT, featured: true },
  { id: "solid-ink", title: "Ink", category: "solid", sizePresetId: "ratio-1-1", sceneBackground: { kind: "solid", color: "#09090b" }, cardState: { fill: "#18181b", cornerRadius: 16, styleMode: "pattern", patternId: "none" }, layout: DEFAULT_SCENE_LAYOUT },
  { id: "solid-slate", title: "Slate", category: "solid", sizePresetId: "ratio-16-9", sceneBackground: { kind: "solid", color: "#334155" }, cardState: { fill: "#f8fafc", cornerRadius: 24 }, layout: DEFAULT_SCENE_LAYOUT },
  { id: "solid-brand", title: "Brand tint", category: "solid", sizePresetId: "ratio-4-5", sceneBackground: { kind: "solid", color: "#fef3c7" }, cardState: { fill: "#ffd80a", cornerRadius: 28 }, layout: DEFAULT_SCENE_LAYOUT },
  { id: "gradient-sunset", title: "Sunset", category: "gradient", sizePresetId: "ratio-16-9", sceneBackground: { kind: "gradient", angle: 135, stops: [{ offset: 0, color: "#f97316" }, { offset: 1, color: "#ec4899" }] }, cardState: { fill: "#ffffff", cornerRadius: 24 }, layout: SCENE_LAYOUT_PRESETS[4]!, exportPresetId: "landscape-1920", featured: true },
  { id: "gradient-ocean", title: "Ocean", category: "gradient", sizePresetId: "ratio-16-9", sceneBackground: { kind: "gradient", angle: 160, stops: [{ offset: 0, color: "#0ea5e9" }, { offset: 1, color: "#6366f1" }] }, cardState: { fill: "#ffffff", cornerRadius: 28 }, layout: SCENE_LAYOUT_PRESETS[1]!, exportPresetId: "landscape-1920", featured: true },
  { id: "gradient-neon", title: "Neon", category: "gradient", sizePresetId: "ratio-9-16", sceneBackground: { kind: "gradient", angle: 45, stops: [{ offset: 0, color: "#a855f7" }, { offset: 1, color: "#06b6d4" }] }, cardState: { fill: "#0f172a", cornerRadius: 20 }, layout: SCENE_LAYOUT_PRESETS[2]!, exportPresetId: "story-1080" },
  { id: "gradient-pastel", title: "Pastel", category: "gradient", sizePresetId: "ratio-1-1", sceneBackground: { kind: "gradient", angle: 120, stops: [{ offset: 0, color: "#fbcfe8" }, { offset: 1, color: "#bfdbfe" }] }, cardState: { fill: "#ffffff", cornerRadius: 32 }, layout: DEFAULT_SCENE_LAYOUT },
  { id: "gradient-dark-rainbow", title: "Dark rainbow", category: "gradient", sizePresetId: "ratio-16-9", sceneBackground: { kind: "gradient", angle: 90, stops: [{ offset: 0, color: "#1e1b4b" }, { offset: 1, color: "#831843" }] }, cardState: { fill: "#18181b", cornerRadius: 16 }, layout: SCENE_LAYOUT_PRESETS[5]! },
  { id: "gradient-mono", title: "Mono fade", category: "gradient", sizePresetId: "ratio-1-1", sceneBackground: { kind: "gradient", angle: 180, stops: [{ offset: 0, color: "#fafafa" }, { offset: 1, color: "#d4d4d8" }] }, cardState: { fill: "#ffffff", cornerRadius: 12 }, layout: DEFAULT_SCENE_LAYOUT },
  { id: "glass-frost-light", title: "Frost light", category: "glass", sizePresetId: "ratio-4-5", sceneBackground: { kind: "gradient", angle: 135, stops: [{ offset: 0, color: "#e0f2fe" }, { offset: 1, color: "#fae8ff" }] }, cardState: MOCKUP_STYLE_PRESETS[0]!.cardState, layout: SCENE_LAYOUT_PRESETS[3]! },
  { id: "glass-frost-dark", title: "Frost dark", category: "glass", sizePresetId: "ratio-9-16", sceneBackground: { kind: "gradient", angle: 200, stops: [{ offset: 0, color: "#0f172a" }, { offset: 1, color: "#312e81" }] }, cardState: MOCKUP_STYLE_PRESETS[1]!.cardState, layout: SCENE_LAYOUT_PRESETS[6]! },
  { id: "glass-liquid", title: "Liquid glass", category: "glass", sizePresetId: "ratio-1-1", sceneBackground: { kind: "paper-shader", shaderId: "mesh-gradient" }, cardState: MOCKUP_STYLE_PRESETS[5]!.cardState, layout: SCENE_LAYOUT_PRESETS[4]! },
  { id: "glass-inset", title: "Inset panel", category: "glass", sizePresetId: "ratio-16-9", sceneBackground: { kind: "solid", color: "#e2e8f0" }, cardState: MOCKUP_STYLE_PRESETS[2]!.cardState, layout: DEFAULT_SCENE_LAYOUT },
  { id: "texture-grain", title: "Grain", category: "texture", sizePresetId: "ratio-1-1", sceneBackground: { kind: "pattern", patternId: "g1", colors: {} }, cardState: { fill: "#fafafa", cornerRadius: 20 }, layout: DEFAULT_SCENE_LAYOUT },
  { id: "texture-paper", title: "Paper", category: "texture", sizePresetId: "ratio-4-5", sceneBackground: { kind: "pattern", patternId: "g3", colors: {} }, cardState: { fill: "#fffbeb", cornerRadius: 8 }, layout: DEFAULT_SCENE_LAYOUT },
  { id: "texture-mesh", title: "Mesh", category: "texture", sizePresetId: "ratio-16-9", sceneBackground: { kind: "paper-shader", shaderId: "mesh-gradient" }, cardState: { fill: "#ffffff", cornerRadius: 24 }, layout: SCENE_LAYOUT_PRESETS[1]! },
  { id: "texture-dither", title: "Dither", category: "texture", sizePresetId: "ratio-1-1", sceneBackground: { kind: "paper-shader", shaderId: "image-dithering" }, cardState: { fill: "#f4f4f5", cornerRadius: 16 }, layout: DEFAULT_SCENE_LAYOUT },
  { id: "cosmic-radial", title: "Radial glow", category: "cosmic", sizePresetId: "ratio-16-9", sceneBackground: { kind: "gradient", angle: 0, stops: [{ offset: 0, color: "#4c1d95" }, { offset: 1, color: "#0f172a" }] }, cardState: { fill: "#1e1b4b", cornerRadius: 20 }, layout: SCENE_LAYOUT_PRESETS[5]!, featured: true },
  { id: "cosmic-starfield", title: "Starfield", category: "cosmic", sizePresetId: "ratio-9-16", sceneBackground: { kind: "paper-shader", shaderId: "warp" }, cardState: { fill: "#0f172a", cornerRadius: 16 }, layout: SCENE_LAYOUT_PRESETS[2]! },
  { id: "cosmic-aurora", title: "Aurora", category: "cosmic", sizePresetId: "ratio-16-9", sceneBackground: { kind: "gradient", angle: 45, stops: [{ offset: 0, color: "#064e3b" }, { offset: 1, color: "#1e3a8a" }] }, cardState: { fill: "#0f172a", cornerRadius: 24 }, layout: SCENE_LAYOUT_PRESETS[4]! },
  { id: "minimal-flat", title: "Flat card", category: "minimal", sizePresetId: "ratio-1-1", sceneBackground: { kind: "solid", color: "#fafafa" }, cardState: { fill: "#ffffff", cornerRadius: 0, shadow: { blur: 0, color: "#000", inset: false, kind: "drop", offsetX: 0, offsetY: 0, opacity: 0, spread: 0, visible: false } }, layout: DEFAULT_SCENE_LAYOUT },
  { id: "minimal-border", title: "Thin border", category: "minimal", sizePresetId: "ratio-1-1", sceneBackground: { kind: "solid", color: "#f4f4f5" }, cardState: MOCKUP_STYLE_PRESETS[4]!.cardState, layout: DEFAULT_SCENE_LAYOUT },
  { id: "minimal-neutral", title: "Neutral", category: "minimal", sizePresetId: "web-open-graph", sceneBackground: { kind: "solid", color: "#e4e4e7" }, cardState: { fill: "#ffffff", cornerRadius: 12 }, layout: DEFAULT_SCENE_LAYOUT, exportPresetId: "og-1x" },
  { id: "bold-impact", title: "Impact", category: "bold", sizePresetId: "ratio-1-1", sceneBackground: { kind: "solid", color: "#dc2626" }, cardState: { fill: "#ffffff", cornerRadius: 0 }, layout: SCENE_LAYOUT_PRESETS[7]! },
]

const THUMBNAIL_ACCENTS: Record<SceneTemplateCategory, string> = {
  solid: "#ffffff",
  gradient: "#ffffff",
  glass: "#ffffff",
  texture: "#f8fafc",
  cosmic: "#312e81",
  minimal: "#fafafa",
  bold: "#ffffff",
}

const THUMBNAIL_HUES: Record<SceneTemplateCategory, number> = {
  solid: 220,
  gradient: 260,
  glass: 200,
  texture: 40,
  cosmic: 280,
  minimal: 220,
  bold: 0,
}

export const SCENE_TEMPLATES: SceneTemplate[] = SCENE_TEMPLATE_SEEDS.map((seed) => ({
  ...seed,
  thumbnailUrl: sceneThumbnail(THUMBNAIL_HUES[seed.category], THUMBNAIL_ACCENTS[seed.category], seed.sceneBackground.kind === "solid" ? seed.sceneBackground.color : "#64748b"),
}))

export function getSceneTemplate(id: string): SceneTemplate | undefined {
  return SCENE_TEMPLATES.find((template) => template.id === id)
}

export function getSceneTemplatesByCategory(category: SceneTemplateCategory): SceneTemplate[] {
  return SCENE_TEMPLATES.filter((template) => template.category === category)
}

export function getFeaturedSceneTemplates(): SceneTemplate[] {
  return SCENE_TEMPLATES.filter((template) => template.featured)
}

export function getSceneLayoutPreset(id: string): SceneLayoutPreset | undefined {
  return SCENE_LAYOUT_PRESETS.find((preset) => preset.id === id)
}

export function getMockupStylePreset(id: string): MockupStylePreset | undefined {
  return MOCKUP_STYLE_PRESETS.find((preset) => preset.id === id)
}

export function createDefaultSceneComposition(): SceneCompositionState {
  return {
    background: { kind: "solid", color: "#f4f4f5" },
    layout: { ...DEFAULT_SCENE_LAYOUT },
    templateId: undefined,
    exportPresetId: undefined,
  }
}

export function cloneSceneComposition(state: SceneCompositionState): SceneCompositionState {
  return structuredClone(state)
}

export function normalizeSceneComposition(
  value: Partial<SceneCompositionState> | SceneCompositionState | undefined,
): SceneCompositionState {
  const fallback = createDefaultSceneComposition()
  if (!value) return fallback

  const layoutPreset = value.layout?.id ? getSceneLayoutPreset(value.layout.id) : undefined
  const layout: SceneLayoutPreset = layoutPreset
    ? { ...layoutPreset }
    : {
        id: value.layout?.id ?? fallback.layout.id,
        label: value.layout?.label ?? fallback.layout.label,
        zoom: clampSceneNumber(value.layout?.zoom, fallback.layout.zoom, 0.5, 1.5),
        tiltX: clampSceneNumber(value.layout?.tiltX, fallback.layout.tiltX, -45, 45),
        tiltY: clampSceneNumber(value.layout?.tiltY, fallback.layout.tiltY, -45, 45),
        rotation: clampSceneNumber(value.layout?.rotation, fallback.layout.rotation, -180, 180),
      }

  return {
    background: value.background ?? fallback.background,
    exportPresetId: value.exportPresetId ?? fallback.exportPresetId,
    layout,
    templateId: value.templateId,
  }
}

function clampSceneNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" && Number.isFinite(value) ? value : fallback
  return Math.min(max, Math.max(min, parsed))
}

export function shadowOffsetFromLightAngle(angleDegrees: number, distance: number) {
  const radians = (angleDegrees * Math.PI) / 180
  return {
    offsetX: Math.round(Math.cos(radians) * distance),
    offsetY: Math.round(Math.sin(radians) * distance),
  }
}
