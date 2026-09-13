import type { BackgroundShapeOptions } from "@/features/qr-code/model/state"
import {
  normalizeDraftingCardBorder,
  type DraftingCardBorderState,
  type DraftingCardShadowState,
} from "@/features/workspace/model/card-state"
import type {
  DraftingBorderSideValue,
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
  createUniformPerSideBorder,
  legacyShadowToShadowLayer,
} from "@/features/workspace/model/effects"

export type DesktopAppearanceBorderSnapshot = DraftingBorderSideValue

export type DesktopAppearancePatch = Partial<DraftingCanvasLayer> & {
  border?: DesktopAppearanceBorderSnapshot
}

export type DesktopAppearanceSnapshot = {
  blur: number
  border: DesktopAppearanceBorderSnapshot
  cornerRadius?: number
  cornerRadii?: DraftingCornerRadiiState
  layerFilters: DraftingFilterEffect[]
  opacity: number
  shadow: DraftingCardShadowState
  shadows: DraftingShadowLayerState[]
  supportsBorder: boolean
  supportsBorderStyle: boolean
  supportsCornerRadius: boolean
}

const DEFAULT_APPEARANCE_BORDER: DesktopAppearanceBorderSnapshot = {
  color: "#111827",
  opacity: 100,
  style: "solid",
  width: 0,
}

function qrHasBorderableBackdrop(options?: {
  qrBackgroundShapeId?: string
  qrBackgroundSurfaceVisible?: boolean
}) {
  return Boolean(
    (options?.qrBackgroundShapeId && options.qrBackgroundShapeId !== "none") ||
      options?.qrBackgroundSurfaceVisible,
  )
}

function getLayerBorderSnapshot(
  layer: DraftingCanvasLayer,
  options?: {
    cardBorder?: DraftingCardBorderState
    qrBackgroundShapeId?: string
    qrBackgroundSurfaceVisible?: boolean
    qrBackgroundShapeOptions?: BackgroundShapeOptions
  },
): DesktopAppearanceBorderSnapshot {
  if (layer.kind === "qr" && qrHasBorderableBackdrop(options) && options?.qrBackgroundShapeOptions) {
    return {
      color: options.qrBackgroundShapeOptions.strokeColor,
      opacity: options.qrBackgroundShapeOptions.strokeOpacity,
      style: "solid",
      width: options.qrBackgroundShapeOptions.strokeWidth,
    }
  }

  if (layer.kind === "card") {
    const border = normalizeDraftingCardBorder(options?.cardBorder)
    return {
      color: border.color,
      opacity: border.opacity,
      style: border.style,
      width: border.width,
    }
  }

  if (layer.kind === "shape") {
    return {
      color: layer.stroke ?? DEFAULT_DRAFTING_SHAPE_LAYER.stroke ?? "#171717",
      opacity: layer.strokeOpacity ?? DEFAULT_DRAFTING_SHAPE_LAYER.strokeOpacity ?? 100,
      style: layer.strokeStyle ?? DEFAULT_DRAFTING_SHAPE_LAYER.strokeStyle ?? "solid",
      width: layer.strokeWidth ?? DEFAULT_DRAFTING_SHAPE_LAYER.strokeWidth ?? 0,
    }
  }

  return { ...DEFAULT_APPEARANCE_BORDER, ...layer.borderSides?.top }
}

export function getDesktopAppearanceSnapshot(
  layer: DraftingCanvasLayer,
  options?: {
    cardBorder?: DraftingCardBorderState
    cardCornerRadius?: number
    cardCornerRadii?: DraftingCornerRadiiState
    qrBackgroundShapeId?: string
    qrBackgroundSurfaceVisible?: boolean
    qrBackgroundShapeOptions?: BackgroundShapeOptions
  },
): DesktopAppearanceSnapshot {
  const layerFilters = layer.layerFilters ?? []
  const border = getLayerBorderSnapshot(layer, options)
  const shadows = layer.shadows ?? [legacyShadowToShadowLayer(layer.shadow)]
  const supportsBorderStyle = !(layer.kind === "qr" && qrHasBorderableBackdrop(options))
  const supportsBorder =
    layer.kind === "card" ||
    layer.kind === "shape" ||
    (layer.kind === "qr" && qrHasBorderableBackdrop(options))

  if (layer.kind === "card" && options?.cardCornerRadius !== undefined) {
    const cornerRadii = resolveCornerRadii(options.cardCornerRadii, options.cardCornerRadius)
    return {
      blur: layer.blur,
      border,
      cornerRadius: cornerRadii.topLeft,
      cornerRadii,
      layerFilters,
      opacity: layer.opacity,
      shadow: layer.shadow,
      shadows,
      supportsBorder,
      supportsBorderStyle,
      supportsCornerRadius: true,
    }
  }

  if (layer.kind === "qr" && options?.qrBackgroundShapeOptions) {
    return {
      blur: layer.blur,
      border,
      layerFilters,
      opacity: layer.opacity,
      shadow: layer.shadow,
      shadows,
      supportsBorder,
      supportsBorderStyle,
      supportsCornerRadius: false,
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
    border,
    cornerRadius: cornerRadii.topLeft,
    cornerRadii,
    layerFilters,
    opacity: layer.opacity,
    shadow: layer.shadow,
    shadows,
    supportsBorder,
    supportsBorderStyle,
    supportsCornerRadius: layerSupportsCornerRadius(layer),
  }
}

export type DesktopAppearancePatchResult = {
  cardBorder?: DraftingCardBorderState
  cardCornerRadius?: number
  cardCornerRadii?: DraftingCornerRadiiState
  cardShadow?: Partial<DraftingCardShadowState>
  layerPatch: Partial<DraftingCanvasLayer>
  qrBackgroundShapeOptions?: Partial<BackgroundShapeOptions>
}

export function buildDesktopAppearancePatch(
  layer: DraftingCanvasLayer,
  patch: DesktopAppearancePatch,
  options?: {
    cardBorder?: unknown
    qrBackgroundShapeId?: string
    qrBackgroundSurfaceVisible?: boolean
    qrBackgroundShapeOptions?: BackgroundShapeOptions
  },
): DesktopAppearancePatchResult {
  const layerPatch: Partial<DraftingCanvasLayer> = {}
  let cardBorder: DraftingCardBorderState | undefined
  let qrBackgroundShapeOptions: Partial<BackgroundShapeOptions> | undefined

  if (patch.border !== undefined) {
    if (layer.kind === "card") {
      cardBorder = normalizeDraftingCardBorder({
        ...patch.border,
        sides: createUniformPerSideBorder(patch.border),
      })
      layerPatch.borderSides = createUniformPerSideBorder({ width: 0 })
    } else if (layer.kind === "shape") {
      layerPatch.stroke = patch.border.color
      layerPatch.strokeWidth = patch.border.width
      layerPatch.strokeOpacity = patch.border.opacity
      layerPatch.strokeStyle = patch.border.style
      layerPatch.borderSides = createUniformPerSideBorder({ width: 0 })
    } else if (layer.kind === "qr" && qrHasBorderableBackdrop(options)) {
      qrBackgroundShapeOptions = {
        strokeColor: patch.border.color,
        strokeOpacity: patch.border.opacity,
        strokeWidth: patch.border.width,
      }
      layerPatch.borderSides = createUniformPerSideBorder({ width: 0 })
    } else {
      layerPatch.borderSides = createUniformPerSideBorder(patch.border)
    }
  }

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
      cardBorder,
      cardCornerRadius: patch.cornerRadius,
      cardCornerRadii: patch.cornerRadii,
      cardShadow: primaryShadow,
      layerPatch,
    }
  }

  if (layer.kind === "qr") {
    return { layerPatch, qrBackgroundShapeOptions }
  }

  return { layerPatch }
}
