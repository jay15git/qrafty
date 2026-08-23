import { describe, expect, it } from "vitest"

import { createDraftingImageLayer, createDraftingTextLayer } from "@/features/workspace/model/layers"
import {
  isDraftingEmojiLayer,
  isDraftingIllustrationLayer,
} from "@/features/workspace/model/layer-floating-settings"

describe("layer-floating-settings", () => {
  it("detects emoji text layers", () => {
    const emojiLayer = createDraftingTextLayer("pane", {
      text: "🎉",
      fontSize: 64,
    })

    expect(isDraftingEmojiLayer(emojiLayer)).toBe(true)
    expect(isDraftingEmojiLayer(createDraftingTextLayer("pane", { text: "Hello" }))).toBe(false)
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
