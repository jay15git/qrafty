import {
  createDefaultDraftingShadowLayer,
  shadowLayerToLegacyShadow,
  type DraftingShadowLayerState,
} from "@/features/workspace/model/effects"
import {
  createDefaultDraftingFilterEffect,
  DRAFTING_FILTER_VISIBLE_DEFAULTS,
  type DraftingFilterEffect,
  type DraftingFilterType,
} from "@/features/workspace/model/filters"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"

export type LayerShadowEffectKind = "drop-shadow" | "inner-shadow"

export type LayerFilterEffectKind =
  | "layer-blur"
  | "brightness"
  | "contrast"
  | "grayscale"
  | "hue-rotate"
  | "invert"
  | "saturation"
  | "sepia"

export type LayerEffectKind = LayerShadowEffectKind | LayerFilterEffectKind

export type LayerShadowEffectItem = {
  enabled: boolean
  id: string
  kind: LayerShadowEffectKind
  shadow: DraftingShadowLayerState
  source: "shadow"
}

export type LayerFilterEffectItem = {
  enabled: boolean
  filter: DraftingFilterEffect
  id: string
  kind: LayerFilterEffectKind
  source: "filter"
}

export type LayerEffectItem = LayerShadowEffectItem | LayerFilterEffectItem

export const LAYER_SHADOW_EFFECT_KINDS: LayerShadowEffectKind[] = [
  "drop-shadow",
  "inner-shadow",
]

export const LAYER_FILTER_EFFECT_KINDS: LayerFilterEffectKind[] = [
  "layer-blur",
  "brightness",
  "contrast",
  "saturation",
  "grayscale",
  "hue-rotate",
  "invert",
  "sepia",
]

export const LAYER_EFFECT_KINDS: LayerEffectKind[] = [
  ...LAYER_SHADOW_EFFECT_KINDS,
  ...LAYER_FILTER_EFFECT_KINDS,
]

const LAYER_EFFECT_KIND_LABELS: Record<LayerEffectKind, string> = {
  "drop-shadow": "Drop shadow",
  "inner-shadow": "Inner shadow",
  "layer-blur": "Layer blur",
  brightness: "Brightness",
  contrast: "Contrast",
  grayscale: "Grayscale",
  "hue-rotate": "Hue",
  invert: "Invert",
  saturation: "Saturation",
  sepia: "Sepia",
}

const FILTER_TYPE_BY_KIND: Record<LayerFilterEffectKind, DraftingFilterType> = {
  "layer-blur": "blur",
  brightness: "brightness",
  contrast: "contrast",
  grayscale: "grayscale",
  "hue-rotate": "hue-rotate",
  invert: "invert",
  saturation: "saturation",
  sepia: "sepia",
}

const DEFAULT_DROP_SHADOW: Partial<DraftingShadowLayerState> = {
  blur: 4,
  color: "#000000",
  inset: false,
  offsetX: 0,
  offsetY: 4,
  opacity: 25,
  spread: 0,
  visible: true,
}

export function getLayerEffectKindLabel(kind: LayerEffectKind) {
  return LAYER_EFFECT_KIND_LABELS[kind]
}

function isLayerShadowEffectKind(kind: LayerEffectKind): kind is LayerShadowEffectKind {
  return kind === "drop-shadow" || kind === "inner-shadow"
}

function isLayerShadowEffectItem(item: LayerEffectItem): item is LayerShadowEffectItem {
  return item.source === "shadow"
}

function isPlaceholderShadowLayer(shadow: DraftingShadowLayerState) {
  return (
    shadow.visible === false &&
    shadow.opacity <= 0 &&
    shadow.blur <= 0 &&
    shadow.offsetX === 0 &&
    shadow.offsetY === 0 &&
    (shadow.spread ?? 0) === 0
  )
}

export function listLayerEffects(
  layer: Pick<DraftingCanvasLayer, "layerFilters" | "shadows">,
): LayerEffectItem[] {
  const shadows = (layer.shadows ?? []).filter((shadow) => !isPlaceholderShadowLayer(shadow))
  const filters = layer.layerFilters ?? []

  return [
    ...shadows.map(shadowToEffectItem),
    ...filters.map(filterToEffectItem),
  ]
}

export function createLayerEffect(kind: LayerEffectKind): LayerEffectItem {
  if (isLayerShadowEffectKind(kind)) {
    return shadowToEffectItem(
      createDefaultDraftingShadowLayer({
        ...DEFAULT_DROP_SHADOW,
        inset: kind === "inner-shadow",
      }),
    )
  }

  const type = FILTER_TYPE_BY_KIND[kind]
  return filterToEffectItem(
    createDefaultDraftingFilterEffect(type, {
      amount: DRAFTING_FILTER_VISIBLE_DEFAULTS[type],
      enabled: true,
    }),
  )
}

export function serializeLayerEffects(effects: LayerEffectItem[]): Partial<DraftingCanvasLayer> {
  const shadows = effects.flatMap((item) => (isLayerShadowEffectItem(item) ? [item.shadow] : []))
  const layerFilters = effects.flatMap((item) =>
    item.source === "filter" ? [item.filter] : [],
  )

  if (shadows.length === 0) {
    const placeholder = createDefaultDraftingShadowLayer({
      blur: 0,
      opacity: 0,
      visible: false,
    })

    return {
      layerFilters,
      shadow: shadowLayerToLegacyShadow(placeholder),
      shadows: [placeholder],
    }
  }

  return {
    layerFilters,
    shadow: shadowLayerToLegacyShadow(shadows[0]!),
    shadows,
  }
}

export function addLayerEffect(
  layer: Pick<DraftingCanvasLayer, "layerFilters" | "shadows">,
  kind: LayerEffectKind,
): Partial<DraftingCanvasLayer> {
  return serializeLayerEffects([...listLayerEffects(layer), createLayerEffect(kind)])
}

export function removeLayerEffect(
  layer: Pick<DraftingCanvasLayer, "layerFilters" | "shadows">,
  effectId: string,
): Partial<DraftingCanvasLayer> {
  return serializeLayerEffects(listLayerEffects(layer).filter((item) => item.id !== effectId))
}

export function setLayerEffectEnabled(
  layer: Pick<DraftingCanvasLayer, "layerFilters" | "shadows">,
  effectId: string,
  enabled: boolean,
): Partial<DraftingCanvasLayer> {
  return serializeLayerEffects(
    listLayerEffects(layer).map((item) => {
      if (item.id !== effectId) {
        return item
      }

      if (item.source === "shadow") {
        return shadowToEffectItem({ ...item.shadow, visible: enabled })
      }

      return filterToEffectItem({ ...item.filter, enabled })
    }),
  )
}

export function patchLayerShadowEffect(
  layer: Pick<DraftingCanvasLayer, "layerFilters" | "shadows">,
  effectId: string,
  patch: Partial<DraftingShadowLayerState>,
): Partial<DraftingCanvasLayer> {
  return serializeLayerEffects(
    listLayerEffects(layer).map((item) => {
      if (item.id !== effectId || item.source !== "shadow") {
        return item
      }

      return shadowToEffectItem({ ...item.shadow, ...patch })
    }),
  )
}

export function patchLayerFilterEffect(
  layer: Pick<DraftingCanvasLayer, "layerFilters" | "shadows">,
  effectId: string,
  patch: Partial<DraftingFilterEffect>,
): Partial<DraftingCanvasLayer> {
  return serializeLayerEffects(
    listLayerEffects(layer).map((item) => {
      if (item.id !== effectId || item.source !== "filter") {
        return item
      }

      return filterToEffectItem({ ...item.filter, ...patch })
    }),
  )
}

export function setLayerEffectKind(
  layer: Pick<DraftingCanvasLayer, "layerFilters" | "shadows">,
  effectId: string,
  kind: LayerEffectKind,
): Partial<DraftingCanvasLayer> {
  return serializeLayerEffects(
    listLayerEffects(layer).map((item) => {
      if (item.id !== effectId) {
        return item
      }

      return convertLayerEffect(item, kind)
    }),
  )
}

function convertLayerEffect(item: LayerEffectItem, kind: LayerEffectKind): LayerEffectItem {
  if (isLayerShadowEffectKind(kind) && item.source === "shadow") {
    return shadowToEffectItem({ ...item.shadow, inset: kind === "inner-shadow" })
  }

  if (!isLayerShadowEffectKind(kind) && item.source === "filter") {
    const type = FILTER_TYPE_BY_KIND[kind]
    return filterToEffectItem({
      ...item.filter,
      amount: item.filter.type === type ? item.filter.amount : DRAFTING_FILTER_VISIBLE_DEFAULTS[type],
      type,
    })
  }

  const next = createLayerEffect(kind)
  if (next.source === "shadow" && item.source === "shadow") {
    return shadowToEffectItem({ ...next.shadow, id: item.shadow.id })
  }

  if (next.source === "filter" && item.source === "filter") {
    return filterToEffectItem({ ...next.filter, id: item.filter.id })
  }

  return next
}

function shadowToEffectItem(shadow: DraftingShadowLayerState): LayerShadowEffectItem {
  return {
    enabled: shadow.visible,
    id: shadow.id,
    kind: shadow.inset ? "inner-shadow" : "drop-shadow",
    shadow,
    source: "shadow",
  }
}

function filterToEffectItem(filter: DraftingFilterEffect): LayerFilterEffectItem {
  return {
    enabled: filter.enabled,
    filter,
    id: filter.id,
    kind: filter.type === "blur" ? "layer-blur" : filter.type,
    source: "filter",
  }
}
