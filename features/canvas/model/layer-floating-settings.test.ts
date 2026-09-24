import { describe, expect, it } from "vitest";

import {
  createCanvasImageLayer,
  createCanvasTextLayer,
} from "@/features/canvas/model/layers/factories";
import {
  createCanvasEmojiLayer,
  getCanvasEmojiLayerFrame,
  getCanvasEmojiLayerSizePatch,
  isCanvasEmojiLayer,
  isCanvasIllustrationLayer,
} from "@/features/canvas/model/layer-floating-settings";

describe("layer-floating-settings", () => {
  it("detects emoji text layers", () => {
    const emojiLayer = createCanvasEmojiLayer("pane", "🎉");

    expect(isCanvasEmojiLayer(emojiLayer)).toBe(true);
    expect(isCanvasEmojiLayer(createCanvasTextLayer("pane", { text: "Hello" }))).toBe(false);
  });

  it("creates emoji layers with a square frame", () => {
    const emojiLayer = createCanvasEmojiLayer("pane", "💋");

    expect(emojiLayer.width).toBe(60);
    expect(emojiLayer.height).toBe(60);
    expect(emojiLayer.fontSize).toBe(52);
    expect(emojiLayer.textAlign).toBe("center");
    expect(emojiLayer.x).toBe(-30);
    expect(emojiLayer.y).toBe(-30);
  });

  it("keeps emoji frames square when resizing", () => {
    const emojiLayer = createCanvasEmojiLayer("pane", "💋", { x: 40, y: 40 });
    const resized = getCanvasEmojiLayerSizePatch(emojiLayer, 64);

    expect(resized.width).toBe(72);
    expect(resized.height).toBe(72);
    expect(resized.x).toBe(34);
    expect(resized.y).toBe(34);
  });

  it("derives square emoji frames from font size", () => {
    expect(getCanvasEmojiLayerFrame(52)).toEqual({
      width: 60,
      height: 60,
      x: -30,
      y: -30,
    });
  });

  it("detects illustration image layers", () => {
    const illustrationLayer = createCanvasImageLayer("pane", {
      imageSource: "url",
      imageValue: "/illustrations/scribbles-doodles/example.svg",
    });

    expect(isCanvasIllustrationLayer(illustrationLayer)).toBe(true);
    expect(
      isCanvasIllustrationLayer(
        createCanvasImageLayer("pane", {
          imageSource: "url",
          imageValue: "https://example.com/photo.png",
        }),
      ),
    ).toBe(false);
  });
});
