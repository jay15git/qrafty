import type { DraftingCanvasLayer } from "@/features/canvas/model/layers/shared"

export type LayerToolbarCapabilities = {
  maxEffects: number
}

const DEFAULT_CAPABILITIES: LayerToolbarCapabilities = {
  maxEffects: 2,
}

export function getLayerToolbarCapabilities(
  layer: DraftingCanvasLayer | null | undefined,
): LayerToolbarCapabilities {
  if (!layer) {
    return DEFAULT_CAPABILITIES
  }

  switch (layer.kind) {
    case "card":
      return { maxEffects: 1 }
    case "group":
      return { maxEffects: 0 }
    default:
      return DEFAULT_CAPABILITIES
  }
}
