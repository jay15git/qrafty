import type { CSSProperties } from "react"

import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import {
  buildCssFilterString,
  getDraftingLayerBoxShadowStyle,
  getDraftingLayerDropShadowFilter,
  getDraftingOutlineStyle,
  getDraftingPerSideBorderStyle,
  mergeCssFilterStrings,
} from "@/features/workspace/rendering/layer-appearance"

export type PreviewLayerEffectOptions = {
  preferBoxShadow?: boolean
  previewScale?: number
}

function scaleShadowNumber(value: number, previewScale: number) {
  if (!Number.isFinite(previewScale) || previewScale <= 0 || previewScale === 1) {
    return value
  }

  return value * previewScale
}

function getPreviewScaledBoxShadowStyle(
  layer: DraftingCanvasLayer,
  previewScale: number,
): string | undefined {
  const shadows =
    layer.shadows && layer.shadows.length > 0
      ? layer.shadows
      : layer.shadow
        ? [layer.shadow]
        : []

  if (shadows.length === 0) {
    return undefined
  }

  const scaledShadows = shadows.map((shadow) => ({
    ...shadow,
    blur: scaleShadowNumber(shadow.blur, previewScale),
    offsetX: scaleShadowNumber(shadow.offsetX, previewScale),
    offsetY: scaleShadowNumber(shadow.offsetY, previewScale),
    spread: scaleShadowNumber(shadow.spread ?? 0, previewScale),
  }))

  return getDraftingLayerBoxShadowStyle(scaledShadows)
}

export function getPreviewLayerEffectStyle(
  layer: DraftingCanvasLayer,
  options: PreviewLayerEffectOptions = {},
): CSSProperties {
  const previewScale = options.previewScale ?? 1
  const preferBoxShadow = options.preferBoxShadow ?? true
  const shadows =
    layer.shadows && layer.shadows.length > 0
      ? layer.shadows
      : layer.shadow
        ? [layer.shadow]
        : []
  const usesComplexShadow = shadows.some(
    (shadow) => shadow.inset || (shadow.spread ?? 0) !== 0 || shadows.length > 1,
  )
  const layerFilters = buildCssFilterString(layer.layerFilters ?? [])
  const borderStyle = layer.borderSides ? getDraftingPerSideBorderStyle(layer.borderSides) : {}
  const boxShadow =
    preferBoxShadow || usesComplexShadow
      ? getPreviewScaledBoxShadowStyle(layer, previewScale)
      : undefined
  const filter =
    usesComplexShadow || !preferBoxShadow
      ? layerFilters || undefined
      : mergeCssFilterStrings(layerFilters, getDraftingLayerDropShadowFilter(shadows)) || undefined

  return {
    ...borderStyle,
    ...getDraftingOutlineStyle(layer.outline),
    ...(boxShadow ? { boxShadow } : {}),
    ...(filter ? { filter } : {}),
  }
}
