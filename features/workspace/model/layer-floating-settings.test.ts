import { describe, expect, it } from "vitest"

import { createDraftingImageLayer, createDraftingTextLayer } from "@/features/workspace/model/layers"
import {
  createDraftingEmojiLayer,
  getDraftingEmojiLayerFrame,
  getDraftingEmojiLayerSizePatch,
  isDraftingEmojiLayer,
  isDraftingIllustrationLayer,
} from "@/features/workspace/model/layer-floating-settings"

describe("layer-floating-settings", () => {
  it("detects emoji text layers", () => {
    const emojiLayer = createDraftingEmojiLayer("pane", "🎉")

    expect(isDraftingEmojiLayer(emojiLayer)).toBe(true)
    expect(isDraftingEmojiLayer(createDraftingTextLayer("pane", { text: "Hello" }))).toBe(false)
  })

  it("creates emoji layers with a square frame", () => {
    const emojiLayer = createDraftingEmojiLayer("pane", "💋")

    expect(emojiLayer.width).toBe(60)
    expect(emojiLayer.height).toBe(60)
    expect(emojiLayer.fontSize).toBe(52)
    expect(emojiLayer.textAlign).toBe("center")
    expect(emojiLayer.x).toBe(-30)
    expect(emojiLayer.y).toBe(-30)
  })

  it("keeps emoji frames square when resizing", () => {
    const emojiLayer = createDraftingEmojiLayer("pane", "💋", { x: 40, y: 40 })
    const resized = getDraftingEmojiLayerSizePatch(emojiLayer, 64)

    expect(resized.width).toBe(72)
    expect(resized.height).toBe(72)
    expect(resized.x).toBe(34)
    expect(resized.y).toBe(34)
  })

  it("derives square emoji frames from font size", () => {
    expect(getDraftingEmojiLayerFrame(52)).toEqual({
      width: 60,
      height: 60,
      x: -30,
      y: -30,
    })
  })

  it("detects illustration image layers", () => {
    const illustrationLayer = createDraftingImageLayer("pane", {
      imageSource: "url",
      imageValue: "/illustrations/scribbles-doodles/example.svg",
    })

    expect(isDraftingIllustrationLayer(illustrationLayer)).toBe(true)
    expect(
      isDraftingIllustrationLayer(
        createDraftingImageLayer("pane", {
          imageSource: "url",
          imageValue: "https://example.com/photo.png",
        }),
      ),
    ).toBe(false)
  })
})
