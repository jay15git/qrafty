import { describe, expect, it } from "vitest"

import {
  applyDraftingCardPaperShaderPreset,
  cloneDraftingCardState,
  createDefaultDraftingCardPaperShader,
  createDefaultDraftingCardState,
  normalizeDraftingCardState,
} from "@/features/workspace/model/card-state"

describe("drafting card state", () => {
  it("starts with a paper shader state beside existing card styles", () => {
    const state = createDefaultDraftingCardState()

    expect(state.styleMode).toBe("pattern")
    expect(state.cardImage).toEqual({
      fit: "cover",
      opacity: 100,
      source: "none",
      value: undefined,
    })
    expect(state.border).toEqual({
      color: "#111827",
      opacity: 100,
      width: 0,
    })
    expect(state.shadow).toEqual({
      blur: 44,
      color: "#1d1606",
      offsetX: 0,
      offsetY: 20,
      opacity: 52,
    })
    expect(state.imageFilter.shaderId).toBe("image-dithering")
    expect(state.imageFilter.image.source).toBe("sample")
    expect(state.paperShader.shaderId).toBe("mesh-gradient")
    expect(state.paperShader.presetName).toBe("Default")
    expect(state.paperShader.params.colors).toEqual([
      "#e0eaff",
      "#241d9a",
      "#f75092",
      "#9f50d3",
    ])
    expect(state.paperShader.speed).toBe(1)
    expect(state.paperShader.frame).toBe(0)
    expect(state.paperShader.paused).toBe(false)
  })

  it("deep clones paper shader params with the rest of the card state", () => {
    const state = createDefaultDraftingCardState()
    const clone = cloneDraftingCardState(state)

    expect(clone).toEqual(state)
    expect(clone).not.toBe(state)
    expect(clone.paperShader).not.toBe(state.paperShader)
    expect(clone.paperShader.params).not.toBe(state.paperShader.params)
    expect(clone.imageFilter).not.toBe(state.imageFilter)
    expect(clone.imageFilter.params).not.toBe(state.imageFilter.params)
    expect(clone.cardImage).not.toBe(state.cardImage)
    expect(clone.border).not.toBe(state.border)
    expect(clone.shadow).not.toBe(state.shadow)

    const cloneColors = clone.paperShader.params.colors as string[]
    cloneColors[0] = "#000000"
    clone.cardImage.value = "https://example.com/card.png"
    clone.border.width = 12
    clone.shadow.blur = 10

    expect((state.paperShader.params.colors as string[])[0]).toBe("#e0eaff")
    expect(state.cardImage.value).toBeUndefined()
    expect(state.border.width).toBe(0)
    expect(state.shadow.blur).toBe(44)
  })

  it("normalizes legacy card shadow presets when cloning saved state", () => {
    const state = {
      ...createDefaultDraftingCardState(),
      shadow: "strong",
    }

    const clone = cloneDraftingCardState(
      state as unknown as ReturnType<typeof createDefaultDraftingCardState>,
    )

    expect(clone.shadow).toEqual({
      blur: 54,
      color: "#1d1606",
      offsetX: 0,
      offsetY: 26,
      opacity: 55,
    })
  })

  it("creates defaults for another shader and applies presets", () => {
    const paperShader = createDefaultDraftingCardPaperShader("warp")

    expect(paperShader.shaderId).toBe("warp")
    expect(paperShader.presetName).toBe("Default")

    const liveInk = applyDraftingCardPaperShaderPreset(paperShader, "Live Ink")

    expect(liveInk.shaderId).toBe("warp")
    expect(liveInk.presetName).toBe("Live Ink")
    expect(liveInk.params).not.toBe(paperShader.params)
    expect(liveInk.speed).toBe(Number(liveInk.params.speed ?? 0))
  })

  it("starts image-filter shaders with a sample image source", () => {
    const paperShader = createDefaultDraftingCardPaperShader("image-dithering")

    expect(paperShader.shaderId).toBe("image-dithering")
    expect(paperShader.image.source).toBe("sample")
    expect(paperShader.image.value).toContain("data:image/svg+xml")
  })

  it("resolves canvas dimensions from size presets using the max-edge baseline", () => {
    const state = normalizeDraftingCardState({
      ...createDefaultDraftingCardState(),
      height: 7200,
      sizeMode: "fixed",
      sizePresetId: "print-poster-18x24",
      width: 5400,
    })

    expect(state).toMatchObject({
      height: 1080,
      sizePresetId: "print-poster-18x24",
      width: 810,
    })
  })
})
