import { describe, expect, it } from "vitest"

import { createDefaultDraftingShadowLayer } from "@/features/canvas/model/effects"
import { createDefaultDraftingFilterEffect } from "@/features/canvas/model/filters"
import {
  createLayerEffect,
  getLayerFilterAmount,
  getLayerShadowOpacity,
  listLayerEffects,
  patchLayerShadowEffect,
  serializeLayerEffects,
  setLayerFilterAmount,
  setLayerShadowOpacity,
} from "@/features/canvas/model/layer-effects"

describe("layer effects stack", () => {
  it("hides placeholder shadows from the inspector list", () => {
    const effects = listLayerEffects({
      layerFilters: [],
      shadows: [
        createDefaultDraftingShadowLayer({
          blur: 0,
          opacity: 0,
          visible: false,
        }),
      ],
    })

    expect(effects).toEqual([])
  })

  it("lists shadows then filters as a single stack", () => {
    const shadow = createDefaultDraftingShadowLayer({
      blur: 8,
      opacity: 40,
      offsetY: 4,
      visible: true,
    })
    const blur = createDefaultDraftingFilterEffect("blur", { amount: 12 })
    const effects = listLayerEffects({
      layerFilters: [blur],
      shadows: [shadow],
    })

    expect(effects.map((item) => item.kind)).toEqual(["drop-shadow", "layer-blur"])
    expect(effects[0]?.id).toBe(shadow.id)
    expect(effects[1]?.id).toBe(blur.id)
  })

  it("adds a visible drop shadow with Figma-like defaults", () => {
    const created = createLayerEffect("drop-shadow")

    expect(created.kind).toBe("drop-shadow")
    if (created.source !== "shadow") {
      throw new Error("expected shadow effect")
    }

    expect(created.shadow).toMatchObject({
      blur: 4,
      inset: false,
      offsetY: 4,
      opacity: 25,
      visible: true,
    })
  })






  it("patches shadow geometry onto the matching id", () => {
    const first = createDefaultDraftingShadowLayer({
      blur: 4,
      opacity: 25,
      visible: true,
    })
    const second = createDefaultDraftingShadowLayer({
      blur: 12,
      opacity: 40,
      visible: true,
    })
    const patch = patchLayerShadowEffect(
      {
        layerFilters: [],
        shadows: [first, second],
      },
      second.id,
      { offsetX: 6 },
    )

    expect(patch.shadows?.[0]?.offsetX).toBe(0)
    expect(patch.shadows?.[1]?.offsetX).toBe(6)
    expect(patch.shadows?.[1]?.id).toBe(second.id)
  })

  it("round-trips serialize then list for mixed stacks", () => {
    const created = [createLayerEffect("drop-shadow"), createLayerEffect("contrast")]
    const serialized = serializeLayerEffects(created)
    const listed = listLayerEffects({
      layerFilters: serialized.layerFilters ?? [],
      shadows: serialized.shadows ?? [],
    })

    expect(listed.map((item) => item.kind)).toEqual(["drop-shadow", "contrast"])
  })

  it("sets and clears filter amounts by kind", () => {
    const layer = { layerFilters: [], shadows: [] }
    const withBrightness = setLayerFilterAmount(layer, "brightness", 140)

    expect(getLayerFilterAmount(withBrightness, "brightness")).toBe(140)
    expect(withBrightness.layerFilters).toHaveLength(1)

    const cleared = setLayerFilterAmount(withBrightness, "brightness", 100)
    expect(getLayerFilterAmount(cleared, "brightness")).toBe(100)
    expect(cleared.layerFilters).toEqual([])
  })

  it("sets and clears shadow opacity by kind", () => {
    const layer = { layerFilters: [], shadows: [] }
    const withShadow = setLayerShadowOpacity(layer, "drop-shadow", 35)

    expect(getLayerShadowOpacity(withShadow, "drop-shadow")).toBe(35)
    expect(withShadow.shadows?.[0]?.inset).toBe(false)

    const cleared = setLayerShadowOpacity(withShadow, "drop-shadow", 0)
    expect(getLayerShadowOpacity(cleared, "drop-shadow")).toBe(0)
    expect(listLayerEffects(cleared)).toEqual([])
  })
})
