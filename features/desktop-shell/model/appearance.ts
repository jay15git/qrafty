import type { BackgroundShapeOptions } from "@/features/qr-code/model/state"
import type { DraftingCardShadowState } from "@/features/workspace/model/card-state"
import type {
  DraftingOutlineState,
  DraftingShadowLayerState,
} from "@/features/workspace/model/effects"
import type { DraftingFilterEffect } from "@/features/workspace/model/filters"
import {
  DEFAULT_DRAFTING_SHAPE_LAYER,
  type DraftingCanvasLayer,
} from "@/features/workspace/model/layers"
import {
  layerSupportsCornerRadius,
  resolveCornerRadii,
  type DraftingCornerRadiiState,
} from "@/features/workspace/model/corner-radius"
import {
  DEFAULT_DRAFTING_OUTLINE,
  legacyShadowToShadowLayer,
} from "@/features/workspace/model/effects"

export type DesktopAppearanceSnapshot = {
  blur: number
  cornerRadius?: number
  cornerRadii?: DraftingCornerRadiiState
  layerFilters: DraftingFilterEffect[]
  opacity: number
  outline: DraftingOutlineState
  shadow: DraftingCardShadowState
  shadows: DraftingShadowLayerState[]
  supportsCornerRadius: boolean
  supportsOutline: boolean
}

export function getDesktopAppearanceSnapshot(
  layer: DraftingCanvasLayer,
  options?: {
    cardCornerRadius?: number
    cardCornerRadii?: DraftingCornerRadiiState
    qrBackgroundShapeOptions?: BackgroundShapeOptions
  },
): DesktopAppearanceSnapshot {
  const layerFilters = layer.layerFilters ?? []
  const outline = layer.outline ?? DEFAULT_DRAFTING_OUTLINE
  const shadows = layer.shadows ?? [legacyShadowToShadowLayer(layer.shadow)]

  if (layer.kind === "card" && options?.cardCornerRadius !== undefined) {
    const cornerRadii = resolveCornerRadii(options.cardCornerRadii, options.cardCornerRadius)
    return {
      blur: layer.blur,
      cornerRadius: cornerRadii.topLeft,
      cornerRadii,
      layerFilters,
      opacity: layer.opacity,
      outline,
      shadow: layer.shadow,
      shadows,
      supportsCornerRadius: true,
      supportsOutline: true,
    }
  }

  if (layer.kind === "qr" && options?.qrBackgroundShapeOptions) {
    return {
      blur: layer.blur,
      layerFilters,
      opacity: layer.opacity,
      outline,
      shadow: layer.shadow,
      shadows,
      supportsCornerRadius: false,
      supportsOutline: false,
    }
  }

  const isRectShape =
    layer.kind === "shape" && (layer.shapeId ?? DEFAULT_DRAFTING_SHAPE_LAYER.shapeId) === "rect"
  const cornerRadii = resolveCornerRadii(
    layer.cornerRadii,
    layer.cornerRadius ??
      (layer.kind === "image"
        ? 0
        : isRectShape
          ? DEFAULT_DRAFTING_SHAPE_LAYER.cornerRadius
          : 0),
  )

  return {
    blur: layer.blur,
    cornerRadius: cornerRadii.topLeft,
    cornerRadii,
    layerFilters,
    opacity: layer.opacity,
    outline,
    shadow: layer.shadow,
    shadows,
    supportsCornerRadius: layerSupportsCornerRadius(layer),
    supportsOutline: layer.kind === "card" || layer.kind === "image" || layer.kind === "text" || isRectShape,
  }
}

export type DesktopAppearancePatchResult = {
  cardCornerRadius?: number
  cardCornerRadii?: DraftingCornerRadiiState
  cardShadow?: Partial<DraftingCardShadowState>
  layerPatch: Partial<DraftingCanvasLayer>
  qrBackgroundShapeOptions?: Partial<BackgroundShapeOptions>
}

export function buildDesktopAppearancePatch(
  layer: DraftingCanvasLayer,
  patch: Partial<DraftingCanvasLayer>,
  _options?: {
    cardBorder?: unknown
    qrBackgroundShapeOptions?: BackgroundShapeOptions
  },
): DesktopAppearancePatchResult {
  const layerPatch: Partial<DraftingCanvasLayer> = {}

  if (patch.blur !== undefined) {
    layerPatch.blur = patch.blur
  }

  if (patch.layerFilters !== undefined) {
    layerPatch.layerFilters = patch.layerFilters
  }

  if (patch.opacity !== undefined) {
    layerPatch.opacity = patch.opacity
  }

  if (patch.cornerRadius !== undefined) {
    layerPatch.cornerRadius = patch.cornerRadius
  }

  if (patch.cornerRadii !== undefined) {
    layerPatch.cornerRadii = patch.cornerRadii
  }

  if (patch.outline !== undefined) {
    layerPatch.outline = patch.outline
  }

  if (patch.shadows !== undefined) {
    layerPatch.shadows = patch.shadows
  }

  if (patch.shadow) {
    layerPatch.shadow = {
      ...layer.shadow,
      ...patch.shadow,
    }
  }

  if (layer.kind === "card") {
    const primaryShadow = patch.shadows?.[0] ?? (patch.shadow ? { ...layer.shadow, ...patch.shadow } : undefined)

    return {
      cardCornerRadius: patch.cornerRadius,
      cardCornerRadii: patch.cornerRadii,
      cardShadow: primaryShadow,
      layerPatch,
    }
  }

  if (layer.kind === "qr") {
    return { layerPatch }
  }

  return { layerPatch }
}
