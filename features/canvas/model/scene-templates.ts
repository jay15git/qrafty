import type { PaperShaderId, PaperShaderParams } from "@/features/canvas/rendering/paper-shader-definitions"

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
  | { fit: "contain" | "cover"; kind: "image"; src: string }
  | { kind: "paper-shader"; params?: Partial<PaperShaderParams>; shaderId: PaperShaderId }
  | { color: string; kind: "solid" }

export type SceneCompositionState = {
  background: SceneBackground
  layout: SceneLayoutPreset
  templateId?: string
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

function getSceneLayoutPreset(id: string): SceneLayoutPreset | undefined {
  return SCENE_LAYOUT_PRESETS.find((preset) => preset.id === id)
}

export function createDefaultSceneComposition(): SceneCompositionState {
  return {
    background: { kind: "solid", color: "#f4f4f5" },
    layout: { ...DEFAULT_SCENE_LAYOUT },
    templateId: undefined,
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
    layout,
    templateId: value.templateId,
  }
}

function clampSceneNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" && Number.isFinite(value) ? value : fallback
  return Math.min(max, Math.max(min, parsed))
}
