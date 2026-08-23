import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"

export const COMPACT_TEXT_FONT_SIZES = [
  12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96, 120,
] as const

const EMOJI_LAYER_TEXT_PATTERN =
  /^(?:\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)+$/u

export function isDraftingEmojiLayer(layer: DraftingCanvasLayer) {
  if (layer.kind !== "text") {
    return false
  }

  const text = layer.text?.trim()
  if (!text) {
    return false
  }

  return EMOJI_LAYER_TEXT_PATTERN.test(text)
}

export function isDraftingIllustrationLayer(layer: DraftingCanvasLayer) {
  return layer.kind === "image" && Boolean(layer.imageValue?.startsWith("/illustrations/"))
}
