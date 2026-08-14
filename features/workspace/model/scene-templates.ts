import type { DraftingCardPatternColorOverrides, DraftingCardPatternId } from "@/features/workspace/model/card-patterns"
import type { DraftingCardBorderState, DraftingCardShadowState, DraftingCardState } from "@/features/workspace/model/card-state"
import { createUniformPerSideBorder } from "@/features/workspace/model/effects"
import type { ExportPresetId } from "@/features/workspace/model/export-presets"
import type { PaperShaderId, PaperShaderParams } from "@/features/workspace/rendering/paper-shaders"

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

export type MockupStylePreviewSpec = {
  accentBackground?: string
  backdropBlur?: number
  background?: string
  stackLayers?: Array<{ offsetX: number; offsetY: number; opacity?: number }>
}

export type MockupStylePreset = {
  cardState: Partial<DraftingCardState>
  id: string
  label: string
  layerShadows?: DraftingCardShadowState[]
  preview?: MockupStylePreviewSpec
}

function mockupBorder(color: string, width: number, opacity = 100): DraftingCardBorderState {
  return {
    color,
    opacity,
    sides: createUniformPerSideBorder({ color, opacity, style: "solid", width }),
    style: "solid",
    width,
  }
}

function mockupShadow(
  values: Partial<DraftingCardShadowState> & Pick<DraftingCardShadowState, "color">,
): DraftingCardShadowState {
  return {
    blur: values.blur ?? 0,
    color: values.color,
    inset: values.inset ?? false,
    kind: "drop",
    offsetX: values.offsetX ?? 0,
    offsetY: values.offsetY ?? 0,
    opacity: values.opacity ?? 100,
    spread: values.spread ?? 0,
    visible: values.visible ?? (values.opacity ?? 100) > 0,
  }
}

const DEFAULT_SCENE_LAYOUT: SceneLayoutPreset = {
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
    id: "default",
    label: "Default",
    preview: {
      background: "linear-gradient(145deg, #71717a 0%, #3f3f46 100%)",
    },
    cardState: {
      border: mockupBorder("#000000", 0, 0),
      cornerRadius: 20,
      fill: "#ffffff",
      patternId: "none",
      shadow: mockupShadow({ blur: 24, color: "#0f172a", offsetY: 12, opacity: 22 }),
      styleMode: "pattern",
    },
  },
  {
    id: "glass-light",
    label: "Glass Light",
    preview: {
      accentBackground:
        "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.04) 55%, rgba(255,255,255,0.18) 100%)",
      backdropBlur: 12,
      background: "linear-gradient(145deg, #a1a1aa 0%, #52525b 100%)",
    },
    cardState: {
      border: mockupBorder("#ffffff", 1, 35),
      cornerRadius: 20,
      fill: "rgba(255, 255, 255, 0.58)",
      patternId: "none",
      shadow: mockupShadow({ blur: 20, color: "#0f172a", offsetY: 10, opacity: 18 }),
      styleMode: "pattern",
    },
  },
  {
    id: "glass-dark",
    label: "Glass Dark",
    preview: {
      accentBackground:
        "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(15,23,42,0.2) 55%, rgba(255,255,255,0.05) 100%)",
      backdropBlur: 12,
      background: "linear-gradient(145deg, #27272a 0%, #09090b 100%)",
    },
    cardState: {
      border: mockupBorder("#ffffff", 1, 12),
      cornerRadius: 20,
      fill: "rgba(24, 24, 27, 0.72)",
      patternId: "none",
      shadow: mockupShadow({ blur: 28, color: "#000000", offsetY: 14, opacity: 42 }),
      styleMode: "pattern",
    },
  },
  {
    id: "liquid",
    label: "Liquid",
    preview: {
      accentBackground:
        "repeating-linear-gradient(135deg, rgba(249,115,22,0.95) 0 10px, rgba(234,88,12,0.95) 10px 20px)",
      background: "linear-gradient(145deg, #fb923c 0%, #ea580c 100%)",
    },
    cardState: {
      border: mockupBorder("#ffffff", 0, 0),
      cornerRadius: 28,
      fill: "#ffffff",
      patternId: "none",
      shadow: mockupShadow({ blur: 48, color: "#ea580c", offsetY: 20, opacity: 35, spread: -6 }),
      styleMode: "pattern",
    },
  },
  {
    id: "inset-light",
    label: "Inset Light",
    preview: {
      background: "linear-gradient(145deg, #e4e4e7 0%, #d4d4d8 100%)",
    },
    cardState: {
      border: mockupBorder("#e2e8f0", 1),
      cornerRadius: 16,
      fill: "#f8fafc",
      patternId: "none",
      shadow: mockupShadow({ blur: 0, color: "#94a3b8", inset: true, offsetY: 2, opacity: 40, spread: 4 }),
      styleMode: "pattern",
    },
  },
  {
    id: "inset-dark",
    label: "Inset Dark",
    preview: {
      background: "linear-gradient(145deg, #3f3f46 0%, #18181b 100%)",
    },
    cardState: {
      border: mockupBorder("#334155", 1, 80),
      cornerRadius: 16,
      fill: "#1e293b",
      patternId: "none",
      shadow: mockupShadow({ blur: 0, color: "#000000", inset: true, offsetY: 2, opacity: 55, spread: 6 }),
      styleMode: "pattern",
    },
  },
  {
    id: "outline",
    label: "Outline",
    preview: {
      background: "linear-gradient(145deg, #52525b 0%, #27272a 100%)",
    },
    cardState: {
      border: mockupBorder("#d4d4d8", 1),
      cornerRadius: 18,
      fill: "#ffffff",
      patternId: "none",
      shadow: mockupShadow({ color: "#000000", opacity: 0, visible: false }),
      styleMode: "pattern",
    },
  },
  {
    id: "border",
    label: "Border",
    preview: {
      background: "linear-gradient(145deg, #52525b 0%, #27272a 100%)",
    },
    cardState: {
      border: mockupBorder("#a1a1aa", 3),
      cornerRadius: 18,
      fill: "#ffffff",
      patternId: "none",
      shadow: mockupShadow({ color: "#000000", opacity: 0, visible: false }),
      styleMode: "pattern",
    },
  },
  {
    id: "retro",
    label: "Retro",
    preview: {
      background: "linear-gradient(145deg, #52525b 0%, #27272a 100%)",
    },
    cardState: {
      border: mockupBorder("#09090b", 4),
      cornerRadius: 0,
      fill: "#ffffff",
      patternId: "none",
      shadow: mockupShadow({ color: "#000000", opacity: 0, visible: false }),
      styleMode: "pattern",
    },
  },
  {
    id: "card",
    label: "Card",
    preview: {
      background: "linear-gradient(145deg, #52525b 0%, #27272a 100%)",
      stackLayers: [{ offsetX: 0, offsetY: 6, opacity: 0.45 }],
    },
    cardState: {
      border: mockupBorder("#000000", 0, 0),
      cornerRadius: 16,
      fill: "#ffffff",
      patternId: "none",
      shadow: mockupShadow({ blur: 0, color: "#e4e4e7", offsetY: 6, opacity: 100 }),
      styleMode: "pattern",
    },
    layerShadows: [
      mockupShadow({ blur: 0, color: "#e4e4e7", offsetY: 6, opacity: 100 }),
      mockupShadow({ blur: 0, color: "#d4d4d8", offsetY: 12, opacity: 70 }),
    ],
  },
  {
    id: "stack",
    label: "Stack",
    preview: {
      background: "linear-gradient(145deg, #52525b 0%, #27272a 100%)",
      stackLayers: [
        { offsetX: 6, offsetY: 6, opacity: 0.28 },
        { offsetX: 3, offsetY: 3, opacity: 0.42 },
      ],
    },
    cardState: {
      border: mockupBorder("#000000", 0, 0),
      cornerRadius: 14,
      fill: "#ffffff",
      patternId: "none",
      shadow: mockupShadow({ blur: 0, color: "#d4d4d8", offsetX: 6, offsetY: 6, opacity: 100 }),
      styleMode: "pattern",
    },
    layerShadows: [
      mockupShadow({ blur: 0, color: "#d4d4d8", offsetX: 6, offsetY: 6, opacity: 100 }),
      mockupShadow({ blur: 0, color: "#e4e4e7", offsetX: 3, offsetY: 3, opacity: 100 }),
      mockupShadow({ blur: 0, color: "#f4f4f5", offsetX: 0, offsetY: 0, opacity: 100 }),
    ],
  },
  {
    id: "stack-2",
    label: "Stack 2",
    preview: {
      background: "linear-gradient(145deg, #52525b 0%, #27272a 100%)",
      stackLayers: [
        { offsetX: 4, offsetY: 5, opacity: 0.24 },
        { offsetX: 2, offsetY: 2, opacity: 0.36 },
        { offsetX: 1, offsetY: 1, opacity: 0.48 },
      ],
    },
    cardState: {
      border: mockupBorder("#000000", 0, 0),
      cornerRadius: 12,
      fill: "#ffffff",
      patternId: "none",
      shadow: mockupShadow({ blur: 0, color: "#d4d4d8", offsetX: 4, offsetY: 5, opacity: 100 }),
      styleMode: "pattern",
    },
    layerShadows: [
      mockupShadow({ blur: 0, color: "#d4d4d8", offsetX: 4, offsetY: 5, opacity: 100 }),
      mockupShadow({ blur: 0, color: "#e4e4e7", offsetX: 2, offsetY: 2, opacity: 100 }),
      mockupShadow({ blur: 0, color: "#f4f4f5", offsetX: 1, offsetY: 1, opacity: 100 }),
      mockupShadow({ blur: 0, color: "#ffffff", offsetX: 0, offsetY: 0, opacity: 100 }),
    ],
  },
] as const

function getSceneLayoutPreset(id: string): SceneLayoutPreset | undefined {
  return SCENE_LAYOUT_PRESETS.find((preset) => preset.id === id)
}

function getMockupStylePreset(id: string): MockupStylePreset | undefined {
  return MOCKUP_STYLE_PRESETS.find((preset) => preset.id === id)
}

function resolveMockupStyleId(cardState: DraftingCardState): string | undefined {
  return MOCKUP_STYLE_PRESETS.find((preset) => mockupStyleMatches(cardState, preset))?.id
}

function mockupStyleMatches(cardState: DraftingCardState, preset: MockupStylePreset) {
  const presetCard = preset.cardState
  const border = presetCard.border
  const shadow = presetCard.shadow

  if (presetCard.fill !== undefined && presetCard.fill !== cardState.fill) {
    return false
  }

  if (presetCard.cornerRadius !== undefined && presetCard.cornerRadius !== cardState.cornerRadius) {
    return false
  }

  if (border !== undefined) {
    if (cardState.border.width !== border.width || cardState.border.color !== border.color) {
      return false
    }
  }

  if (shadow !== undefined) {
    if (
      cardState.shadow.blur !== shadow.blur ||
      cardState.shadow.color !== shadow.color ||
      cardState.shadow.inset !== shadow.inset ||
      cardState.shadow.offsetX !== shadow.offsetX ||
      cardState.shadow.offsetY !== shadow.offsetY ||
      cardState.shadow.opacity !== shadow.opacity ||
      cardState.shadow.spread !== shadow.spread
    ) {
      return false
    }
  }

  return true
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

function shadowOffsetFromLightAngle(angleDegrees: number, distance: number) {
  const radians = (angleDegrees * Math.PI) / 180
  return {
    offsetX: Math.round(Math.cos(radians) * distance),
    offsetY: Math.round(Math.sin(radians) * distance),
  }
}
