import { describe, expect, it } from "vitest"

import {
  computeLetterboxFit,
  makeEvenDimension,
  resolveRasterTargetDimensions,
  resolveVideoOutputDimensions,
} from "@/features/workspace/export/pipeline/bounds"

describe("export bounds", () => {
  it("letterboxes landscape art into portrait preset", () => {
    const fit = computeLetterboxFit(400, 300, 1200, 630)

    expect(fit.width).toBe(840)
    expect(fit.height).toBe(630)
    expect(fit.offsetX).toBe(180)
    expect(fit.offsetY).toBe(0)
  })

  it("scales raster exports by long edge", () => {
    expect(resolveRasterTargetDimensions(400, 800, 1080)).toEqual({
      width: 540,
      height: 1080,
    })
  })

  it("returns even video dimensions", () => {
    expect(resolveVideoOutputDimensions(400, 801, 1080)).toEqual({
      width: 540,
      height: 1080,
    })
    expect(makeEvenDimension(539)).toBe(540)
  })
})
