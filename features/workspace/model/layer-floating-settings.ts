import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import { createDraftingTextLayer } from "@/features/workspace/model/layers"

export const COMPACT_TEXT_FONT_SIZES = [
  12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96, 120,
] as const

const EMOJI_LAYER_TEXT_PATTERN =
  /^(?:\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)+$/u

export const DEFAULT_DRAFTING_EMOJI_LAYER = {
  fontFamily:
    "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif",
  fontSize: 52,
  height: 60,
  lineHeight: 1,
  textAlign: "center",
  width: 60,
} as const

const DRAFTING_EMOJI_FRAME_PADDING = 8

export function getDraftingEmojiLayerFrame(fontSize: number) {
  const frameSize = Math.max(32, Math.round(fontSize + DRAFTING_EMOJI_FRAME_PADDING))
  const half = frameSize / 2

  return {
    height: frameSize,
    width: frameSize,
    x: -half,
    y: -half,
  }
}

export function getDraftingEmojiLayerSizePatch(
  layer: Pick<DraftingCanvasLayer, "height" | "width" | "x" | "y">,
  fontSize: number,
): Pick<DraftingCanvasLayer, "fontSize" | "height" | "width" | "x" | "y"> {
  const frame = getDraftingEmojiLayerFrame(fontSize)
  const deltaWidth = frame.width - layer.width
  const deltaHeight = frame.height - layer.height

  return {
    fontSize,
    height: frame.height,
    width: frame.width,
    x: layer.x - deltaWidth / 2,
    y: layer.y - deltaHeight / 2,
  }
}

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

export function createDraftingEmojiLayer(
  nodeId: string,
  emoji: string,
  options: Partial<DraftingCanvasLayer> = {},
) {
  const fontSize = options.fontSize ?? DEFAULT_DRAFTING_EMOJI_LAYER.fontSize
  const frame = getDraftingEmojiLayerFrame(fontSize)

  return createDraftingTextLayer(nodeId, {
    ...DEFAULT_DRAFTING_EMOJI_LAYER,
    ...frame,
    ...options,
    fontId: undefined,
    fontSize,
    text: emoji,
    textRuns: undefined,
  })
}

export function isDraftingIllustrationLayer(layer: DraftingCanvasLayer) {
  return layer.kind === "image" && Boolean(layer.imageValue?.startsWith("/illustrations/"))
}
