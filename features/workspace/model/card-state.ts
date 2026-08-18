import {
  createUniformPerSideBorder,
  type DraftingBorderStyle,
  type DraftingPerSideBorderState,
  type DraftingShadowKind,
  normalizeBorderStyle,
  normalizePerSideBorderState,
} from "@/features/workspace/model/effects"
import {
  cornerRadiiToLegacyRadius,
  createUniformCornerRadii,
  normalizeCornerRadiiState,
  type DraftingCornerRadiiState,
} from "@/features/workspace/model/corner-radius"
import {
  getCanvasSizeFromTemplate,
  getSizeTemplate,
} from "@/features/workspace/model/size-templates"
import {
  createDefaultPaperShaderParams,
  DEFAULT_PAPER_SHADER_ID,
  getPaperShaderDefinition,
  getPaperShaderPreset,
  type PaperShaderId,
  type PaperShaderParams,
} from "@/features/workspace/rendering/paper-shaders"

type DraftingCardShadowPreset = "none" | "soft" | "medium" | "strong"
export type DraftingCardStyleMode = "solid" | "image" | "image-filter" | "paper-shader"

export type LegacyDraftingCardStyleMode = DraftingCardStyleMode | "pattern"

function normalizeDraftingCardStyleMode(
  value: LegacyDraftingCardStyleMode | undefined,
  fallback: DraftingCardStyleMode,
): DraftingCardStyleMode {
  if (value === "pattern") {
    return "solid"
  }

  return value ?? fallback
}

export type DraftingCardBorderState = {
  color: string
  opacity: number
  sides: DraftingPerSideBorderState
  style: DraftingBorderStyle
  width: number
}

export type DraftingCardShadowState = {
  blur: number
  color: string
  inset: boolean
  kind: DraftingShadowKind
  offsetX: number
  offsetY: number
  opacity: number
  spread: number
  visible: boolean
}

export type DraftingCardImageState = {
  fit: "contain" | "cover"
  opacity: number
  source: "none" | "upload" | "url"
  value?: string
}

export type DraftingCardPaperShaderState = {
  frame: number
  image: {
    source: "none" | "sample" | "upload" | "url"
    value?: string
  }
  params: PaperShaderParams
  paused: boolean
  presetName: string
  shaderId: PaperShaderId
  speed: number
}

export const DEFAULT_DRAFTING_PAPER_SHADER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 900'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%23f8fafc'/%3E%3Cstop offset='.48' stop-color='%2394a3b8'/%3E%3Cstop offset='1' stop-color='%23111827'/%3E%3C/linearGradient%3E%3CradialGradient id='r' cx='.32' cy='.28' r='.55'%3E%3Cstop stop-color='%23f59e0b' stop-opacity='.95'/%3E%3Cstop offset='.58' stop-color='%23ec4899' stop-opacity='.62'/%3E%3Cstop offset='1' stop-color='%230f172a' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='1200' height='900' fill='url(%23g)'/%3E%3Ccircle cx='360' cy='250' r='310' fill='url(%23r)'/%3E%3Crect x='590' y='170' width='390' height='540' rx='48' fill='%23ffffff' fill-opacity='.28'/%3E%3Cpath d='M145 715 C310 575 410 805 590 635 S865 535 1055 680' fill='none' stroke='%23ffffff' stroke-width='46' stroke-linecap='round' opacity='.7'/%3E%3C/svg%3E"

export type DraftingCardSizeMode = "auto" | "fixed"

export const DRAFTING_CARD_SIZE_MIN = 320
export const DRAFTING_CARD_SIZE_MAX = 8192

export type DraftingCardState = {
  border: DraftingCardBorderState
  bottomSpace: number
  cardImage: DraftingCardImageState
  cornerRadius: number
  cornerRadii: DraftingCornerRadiiState
  enabled: boolean
  fill: string
  height: number
  imageFilter: DraftingCardPaperShaderState
  lockAspectRatio: boolean
  padding: number
  paperShader: DraftingCardPaperShaderState
  shadow: DraftingCardShadowState
  sizeMode: DraftingCardSizeMode
  sizePresetId?: string
  styleMode: DraftingCardStyleMode
  width: number
}

function buildDefaultDraftingCardState(): DraftingCardState {
  return {
    border: {
      color: "#111827",
      opacity: 100,
      sides: createUniformPerSideBorder({ color: "#111827", opacity: 100, style: "solid", width: 0 }),
      style: "solid",
      width: 0,
    },
    bottomSpace: 0,
    cardImage: {
      fit: "cover",
      opacity: 100,
      source: "none",
      value: undefined,
    },
    cornerRadius: 28,
    cornerRadii: createUniformCornerRadii(28),
    enabled: true,
    fill: "#ffd80a",
    height: 1080,
    imageFilter: createDefaultDraftingCardPaperShader("image-dithering"),
    lockAspectRatio: true,
    padding: 24,
    paperShader: {
      ...createDefaultDraftingCardPaperShader("static-mesh-gradient"),
      paused: true,
      speed: 0,
    },
    shadow: {
      blur: 44,
      color: "#1d1606",
      inset: false,
      kind: "drop",
      offsetX: 0,
      offsetY: 20,
      opacity: 52,
      spread: 0,
      visible: true,
    },
    sizeMode: "fixed",
    sizePresetId: "ratio-4-3",
    styleMode: "paper-shader",
    width: 1080,
  }
}

let cachedDefaultDraftingCardState: DraftingCardState | undefined

function resolveDefaultDraftingCardState() {
  cachedDefaultDraftingCardState ??= buildDefaultDraftingCardState()
  return cachedDefaultDraftingCardState
}

export const DEFAULT_DRAFTING_CARD_STATE = new Proxy({} as DraftingCardState, {
  get(_target, prop, receiver) {
    return Reflect.get(resolveDefaultDraftingCardState(), prop, receiver)
  },
  ownKeys() {
    return Reflect.ownKeys(resolveDefaultDraftingCardState())
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(resolveDefaultDraftingCardState(), prop)
  },
})

export function cloneDraftingCardState(state: DraftingCardState): DraftingCardState {
  return normalizeDraftingCardState(state)
}

export function normalizeDraftingCardState(
  state: Partial<DraftingCardState> | DraftingCardState,
): DraftingCardState {
  const fallback = DEFAULT_DRAFTING_CARD_STATE
  const sizePresetId =
    typeof state.sizePresetId === "string" && state.sizePresetId.length > 0
      ? state.sizePresetId
      : undefined
  const presetTemplate = sizePresetId ? getSizeTemplate(sizePresetId) : undefined
  const presetCanvasSize = presetTemplate ? getCanvasSizeFromTemplate(presetTemplate) : null
  const resolvedWidth = presetCanvasSize?.width ?? state.width
  const resolvedHeight = presetCanvasSize?.height ?? state.height
  const legacyCornerRadius = clampCardNumber(state.cornerRadius, fallback.cornerRadius, 0, 256)
  const cornerRadii = normalizeCornerRadiiState(
    state.cornerRadii,
    fallback.cornerRadii,
    legacyCornerRadius,
  )

  return {
    border: normalizeDraftingCardBorder(state.border),
    bottomSpace: clampCardNumber(state.bottomSpace, fallback.bottomSpace, 0, 640),
    cardImage: {
      fit: state.cardImage?.fit ?? fallback.cardImage.fit,
      opacity: clampCardNumber(state.cardImage?.opacity, fallback.cardImage.opacity, 0, 100),
      source: state.cardImage?.source ?? fallback.cardImage.source,
      value: state.cardImage?.value,
    },
    cornerRadius: cornerRadiiToLegacyRadius(cornerRadii),
    cornerRadii,
    enabled: state.enabled ?? fallback.enabled,
    fill: state.fill ?? fallback.fill,
    height: clampCardSize(resolvedHeight, fallback.height),
    imageFilter: state.imageFilter
      ? cloneDraftingCardPaperShaderState(state.imageFilter)
      : cloneDraftingCardPaperShaderState(fallback.imageFilter),
    lockAspectRatio: state.lockAspectRatio ?? fallback.lockAspectRatio,
    padding: clampCardNumber(state.padding, fallback.padding, 0, 256),
    paperShader: state.paperShader
      ? cloneDraftingCardPaperShaderState(state.paperShader)
      : cloneDraftingCardPaperShaderState(fallback.paperShader),
    shadow: normalizeDraftingCardShadow(state.shadow ?? fallback.shadow),
    sizeMode: state.sizeMode === "fixed" ? "fixed" : "auto",
    sizePresetId,
    styleMode: normalizeDraftingCardStyleMode(state.styleMode, fallback.styleMode),
    width: clampCardSize(resolvedWidth, fallback.width),
  }
}

function clampCardSize(value: unknown, fallback: number) {
  const parsed = typeof value === "number" && Number.isFinite(value) ? value : fallback
  return Math.min(DRAFTING_CARD_SIZE_MAX, Math.max(DRAFTING_CARD_SIZE_MIN, Math.round(parsed)))
}

function clampCardNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" && Number.isFinite(value) ? value : fallback
  return Math.min(max, Math.max(min, Math.round(parsed)))
}

export function normalizeDraftingCardBorder(
  border: Partial<DraftingCardBorderState> | undefined,
): DraftingCardBorderState {
  const fallback = DEFAULT_DRAFTING_CARD_STATE.border
  const width = Math.max(0, border?.width ?? fallback.width)
  const color = border?.color ?? fallback.color
  const opacity = border?.opacity ?? fallback.opacity
  const style = normalizeBorderStyle(border?.style, fallback.style)

  return {
    color,
    opacity,
    sides: normalizePerSideBorderState(border?.sides, { color, opacity, style, width }),
    style,
    width,
  }
}

export function normalizeDraftingCardShadow(
  shadow: DraftingCardShadowState | DraftingCardShadowPreset,
): DraftingCardShadowState {
  if (typeof shadow === "string") {
    return getLegacyDraftingCardShadow(shadow)
  }

  const fallback = DEFAULT_DRAFTING_CARD_STATE.shadow

  return {
    blur: clampShadowNumber(shadow.blur, fallback.blur, 0, 128),
    color: shadow.color ?? fallback.color,
    inset: shadow.inset ?? fallback.inset,
    kind: "drop",
    offsetX: clampShadowNumber(shadow.offsetX, fallback.offsetX, -256, 256),
    offsetY: clampShadowNumber(shadow.offsetY, fallback.offsetY, -256, 256),
    opacity: clampShadowNumber(shadow.opacity, fallback.opacity, 0, 100),
    spread: clampShadowNumber(shadow.spread, fallback.spread, -128, 128),
    visible:
      typeof shadow.visible === "boolean"
        ? shadow.visible
        : (shadow.opacity ?? fallback.opacity) > 0,
  }
}

function clampShadowNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" && Number.isFinite(value) ? value : fallback
  return Math.min(max, Math.max(min, parsed))
}

function getLegacyDraftingCardShadow(shadow: DraftingCardShadowPreset): DraftingCardShadowState {
  switch (shadow) {
    case "none":
      return {
        ...DEFAULT_DRAFTING_CARD_STATE.shadow,
        blur: 0,
        offsetX: 0,
        offsetY: 0,
        opacity: 0,
        visible: false,
      }
    case "soft":
      return {
        ...DEFAULT_DRAFTING_CARD_STATE.shadow,
        blur: 30,
        color: "#1d1606",
        offsetX: 0,
        offsetY: 14,
        opacity: 45,
        visible: true,
      }
    case "strong":
      return {
        ...DEFAULT_DRAFTING_CARD_STATE.shadow,
        blur: 54,
        color: "#1d1606",
        offsetX: 0,
        offsetY: 26,
        opacity: 55,
        visible: true,
      }
    case "medium":
    default:
      return { ...DEFAULT_DRAFTING_CARD_STATE.shadow, visible: true }
  }
}

export function createDefaultDraftingCardState() {
  return cloneDraftingCardState(DEFAULT_DRAFTING_CARD_STATE)
}

export function cloneDraftingCardPaperShaderState(
  paperShader: DraftingCardPaperShaderState,
): DraftingCardPaperShaderState {
  return {
    ...paperShader,
    image: { ...paperShader.image },
    params: structuredClone(paperShader.params),
  }
}

export function createDefaultDraftingCardPaperShader(
  shaderId: PaperShaderId = DEFAULT_PAPER_SHADER_ID,
): DraftingCardPaperShaderState {
  const definition = getPaperShaderDefinition(shaderId)
  const preset = getPaperShaderPreset(shaderId)

  return {
    frame: Number(preset.params.frame ?? 0),
    image: definition.requiresImage
      ? {
          source: "sample",
          value: DEFAULT_DRAFTING_PAPER_SHADER_IMAGE,
        }
      : {
          source: "none",
          value: undefined,
        },
    params: createDefaultPaperShaderParams(shaderId),
    paused: false,
    presetName: preset.name,
    shaderId,
    speed: Number(preset.params.speed ?? 0),
  }
}

export function applyDraftingCardPaperShaderPreset(
  state: DraftingCardPaperShaderState,
  presetName: string,
): DraftingCardPaperShaderState {
  const preset = getPaperShaderPreset(state.shaderId, presetName)

  return {
    ...state,
    frame: Number(preset.params.frame ?? state.frame),
    params: structuredClone(preset.params),
    presetName: preset.name,
    speed: Number(preset.params.speed ?? state.speed),
  }
}
