import type { CanvasLayer } from "@/features/canvas/model/layers/shared";
import { createDraftingTextLayer } from "@/features/canvas/model/layers/factories";

const EMOJI_LAYER_TEXT_PATTERN =
  /^(?:\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)+$/u;

const DEFAULT_DRAFTING_EMOJI_LAYER = {
  fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif",
  fontSize: 52,
  height: 60,
  lineHeight: 1,
  textAlign: "center",
  width: 60,
} as const;

const DRAFTING_EMOJI_FRAME_PADDING = 8;

export function getDraftingEmojiLayerFrame(fontSize: number) {
  const frameSize = Math.max(32, Math.round(fontSize + DRAFTING_EMOJI_FRAME_PADDING));
  const half = frameSize / 2;

  return {
    height: frameSize,
    width: frameSize,
    x: -half,
    y: -half,
  };
}

export function getDraftingEmojiLayerSizePatch(
  layer: Pick<CanvasLayer, "height" | "width" | "x" | "y">,
  fontSize: number,
): Pick<CanvasLayer, "fontSize" | "height" | "width" | "x" | "y"> {
  const frame = getDraftingEmojiLayerFrame(fontSize);
  const deltaWidth = frame.width - layer.width;
  const deltaHeight = frame.height - layer.height;

  return {
    fontSize,
    height: frame.height,
    width: frame.width,
    x: layer.x - deltaWidth / 2,
    y: layer.y - deltaHeight / 2,
  };
}

export function isDraftingEmojiLayer(layer: CanvasLayer) {
  if (layer.kind !== "text") {
    return false;
  }

  const text = layer.text?.trim();
  if (!text) {
    return false;
  }

  return EMOJI_LAYER_TEXT_PATTERN.test(text);
}

export function createDraftingEmojiLayer(
  nodeId: string,
  emoji: string,
  options: Partial<CanvasLayer> = {},
) {
  const fontSize = options.fontSize ?? DEFAULT_DRAFTING_EMOJI_LAYER.fontSize;
  const frame = getDraftingEmojiLayerFrame(fontSize);

  return createDraftingTextLayer(nodeId, {
    ...DEFAULT_DRAFTING_EMOJI_LAYER,
    ...frame,
    ...options,
    fontId: undefined,
    fontSize,
    text: emoji,
    textRuns: undefined,
  });
}

export function isDraftingIllustrationLayer(layer: CanvasLayer) {
  return layer.kind === "image" && Boolean(layer.imageValue?.startsWith("/illustrations/"));
}
