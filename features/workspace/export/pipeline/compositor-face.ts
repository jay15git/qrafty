import type { DraftingCardState } from "@/features/workspace/model/card-state"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import { isConicCssFill } from "@/features/workspace/export/svg-css-fill"

export function resolveCardShaderMode(cardState: DraftingCardState) {
  return cardState.styleMode === "paper-shader" || cardState.styleMode === "image-filter"
}

export function cardLayerNeedsCanvasFace(
  layer: DraftingCanvasLayer,
  cardState: DraftingCardState,
) {
  if (layer.kind === "shader") {
    return Boolean(layer.paperShader)
  }

  if (layer.kind !== "card") {
    return false
  }

  if (resolveCardShaderMode(cardState)) {
    return true
  }

  if (cardState.styleMode === "image" && Boolean(cardState.cardImage.value)) {
    return true
  }

  return cardState.styleMode === "solid" && isConicCssFill(cardState.fill)
}

export function computeObjectFitRect(
  sourceWidth: number,
  sourceHeight: number,
  destWidth: number,
  destHeight: number,
  fit: "contain" | "cover",
) {
  const scale =
    fit === "contain"
      ? Math.min(destWidth / sourceWidth, destHeight / sourceHeight)
      : Math.max(destWidth / sourceWidth, destHeight / sourceHeight)

  const width = sourceWidth * scale
  const height = sourceHeight * scale

  return {
    height,
    width,
    x: (destWidth - width) / 2,
    y: (destHeight - height) / 2,
  }
}
