import { describe, expect, it } from "vitest"

import {
  getCardGeneratedShaderDefinitions,
  getCardImageFilterDefinitions,
  getPaperShaderDefinition,
} from "@/features/canvas/rendering/paper-shader-definitions"

function getNumberControl(shaderId: string, key: string) {
  const control = getPaperShaderDefinition(shaderId).controls.find(
    (item) => item.key === key,
  )

  expect(control?.type).toBe("number")
  return control as Extract<typeof control, { type: "number" }>
}

function getEnumControl(shaderId: string, key: string) {
  const control = getPaperShaderDefinition(shaderId).controls.find(
    (item) => item.key === key,
  )

  expect(control?.type).toBe("enum")
  return control as Extract<typeof control, { type: "enum" }>
}

describe("drafting paper shader metadata", () => {
  it("uses upstream numeric ranges for previously mismatched controls", () => {
    expect(getNumberControl("warp", "speed")).toMatchObject({ min: 0, max: 20 })
    expect(getNumberControl("perlin-noise", "speed")).toMatchObject({
      min: 0,
      max: 0.5,
    })
    expect(getNumberControl("color-panels", "angle1")).toMatchObject({
      min: -1,
      max: 1,
    })
    expect(getNumberControl("dot-grid", "gapX")).toMatchObject({ min: 2, max: 500 })
    expect(getNumberControl("dot-grid", "gapY")).toMatchObject({ min: 2, max: 500 })
    expect(getNumberControl("halftone-cmyk", "gainC")).toMatchObject({
      min: -1,
      max: 1,
    })
  })

  it("caps shader color controls at upstream shader limits", () => {
    expect(getPaperShaderDefinition("voronoi").maxColorCount).toBe(5)
    expect(getPaperShaderDefinition("god-rays").maxColorCount).toBe(5)
    expect(getPaperShaderDefinition("pulsing-border").maxColorCount).toBe(5)
    expect(getPaperShaderDefinition("grain-gradient").maxColorCount).toBe(7)
    expect(getPaperShaderDefinition("color-panels").maxColorCount).toBe(7)
    expect(getPaperShaderDefinition("metaballs").maxColorCount).toBe(8)
    expect(getPaperShaderDefinition("mesh-gradient").maxColorCount).toBe(10)
    expect(getPaperShaderDefinition("warp").maxColorCount).toBe(10)
  })

  it("uses upstream enum options instead of preset-derived strings", () => {
    expect(getEnumControl("paper-texture", "fit").options).toEqual([
      "contain",
      "cover",
    ])
    expect(getEnumControl("dithering", "type").options).toEqual([
      "random",
      "2x2",
      "4x4",
      "8x8",
    ])
    expect(getEnumControl("fluted-glass", "shape").options).toEqual([
      "lines",
      "linesIrregular",
      "wave",
      "zigzag",
      "pattern",
    ])
    expect(getEnumControl("halftone-dots", "type").options).toEqual([
      "classic",
      "gooey",
      "holes",
      "soft",
    ])
    expect(getEnumControl("warp", "shape").options).toEqual([
      "checks",
      "stripes",
      "edge",
    ])
  })

  it("enables image filters with image controls and upstream render caps", () => {
    const imageDithering = getPaperShaderDefinition("image-dithering")
    const halftoneCmyk = getPaperShaderDefinition("halftone-cmyk")
    const dotGrid = getPaperShaderDefinition("dot-grid")
    const waves = getPaperShaderDefinition("waves")

    expect(imageDithering.requiresImage).toBe(true)
    expect(imageDithering.controls.some((control) => control.type === "image")).toBe(true)
    expect(halftoneCmyk.requiresImage).toBe(true)
    expect(halftoneCmyk.controls.some((control) => control.type === "image")).toBe(true)
    expect(dotGrid.renderOptions?.maxPixelCount).toBe(6016 * 3384)
    expect(waves.renderOptions?.maxPixelCount).toBe(6016 * 3384)
  })

  it("keeps upstream-hidden origin controls out of image filter panels", () => {
    for (const shaderId of ["halftone-dots", "halftone-cmyk"]) {
      const controlKeys = getPaperShaderDefinition(shaderId).controls.map(
        (control) => control.key,
      )

      expect(controlKeys).not.toContain("originX")
      expect(controlKeys).not.toContain("originY")
      expect(getPaperShaderDefinition(shaderId).hiddenParams).toContain("originX")
      expect(getPaperShaderDefinition(shaderId).hiddenParams).toContain("originY")
    }
  })

  it("uses a fixed card image filter allowlist in reference order", () => {
    expect(getCardImageFilterDefinitions().map((definition) => definition.id)).toEqual([
      "paper-texture",
      "fluted-glass",
      "water",
      "image-dithering",
      "halftone-dots",
      "halftone-cmyk",
    ])
  })

  it("keeps card image filters out of generated shader choices", () => {
    const generatedShaderIds = getCardGeneratedShaderDefinitions().map(
      (definition) => definition.id,
    )

    for (const filterId of getCardImageFilterDefinitions().map((definition) => definition.id)) {
      expect(generatedShaderIds).not.toContain(filterId)
    }
  })

  it("keeps logo-animation image filters out of generated shader choices", () => {
    const generatedShaderIds = getCardGeneratedShaderDefinitions().map(
      (definition) => definition.id,
    )

    expect(generatedShaderIds).not.toContain("heatmap")
    expect(generatedShaderIds).not.toContain("liquid-metal")
    expect(generatedShaderIds).not.toContain("gem-smoke")
    expect(generatedShaderIds.at(-1)).toBe("static-radial-gradient")
  })
})
