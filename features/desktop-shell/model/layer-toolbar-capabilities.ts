import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"

export type LayerToolbarCapabilities = {
  maxEffects: number
}

const DEFAULT_CAPABILITIES: LayerToolbarCapabilities = {
  maxEffects: 2,
}

export function getDesktopLayerToolbarCapabilities(
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
