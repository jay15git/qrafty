import { describe, expect, it } from "vitest"

import {
  createDraftingTextLayer,
  patchDraftingCanvasLayer,
} from "@/features/workspace/model/layers"
import { getTextLayerStyle } from "@/features/workspace/rendering/layer-dom-styles"

const gradient = {
  enabled: true,
  type: "linear" as const,
  rotation: 0,
  colorStops: [
    { offset: 0, color: "#ff0000" },
    { offset: 1, color: "#0000ff" },
  ],
}

describe("getTextLayerStyle", () => {
  it("uses flat color for solid text", () => {
    const layer = createDraftingTextLayer("preview", { fill: "#123456" })
    const style = getTextLayerStyle(layer)

    expect(style.color).toBe("#123456")
    expect(style.backgroundImage).toBeUndefined()
  })

  it("clips gradient fills to the text glyphs", () => {
    const layer = patchDraftingCanvasLayer(createDraftingTextLayer("preview"), {
      fillGradient: gradient,
      fillMode: "gradient",
    })
    const style = getTextLayerStyle(layer)

    expect(style.backgroundImage).toContain("gradient")
    expect(style.backgroundClip).toBe("text")
    expect(style.color).toBe("transparent")
    expect(style.caretColor).toBe(layer.fill)
  })

  it("ignores disabled gradients", () => {
    const layer = patchDraftingCanvasLayer(createDraftingTextLayer("preview"), {
      fillGradient: { ...gradient, enabled: false },
      fillMode: "gradient",
    })
    const style = getTextLayerStyle(layer)

    expect(style.color).toBe(layer.fill)
    expect(style.backgroundImage).toBeUndefined()
  })
})
