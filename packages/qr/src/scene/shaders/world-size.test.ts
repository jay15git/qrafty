import { describe, expect, it } from "vitest"

import { buildPaperShaderWorldSize } from "./world-size"

describe("buildPaperShaderWorldSize", () => {
  it("returns layout world size for positive dimensions", () => {
    expect(buildPaperShaderWorldSize(420, 560)).toEqual({
      worldWidth: 420,
      worldHeight: 560,
    })
  })

  it("rejects non-positive dimensions", () => {
    expect(buildPaperShaderWorldSize(0, 100)).toBeNull()
    expect(buildPaperShaderWorldSize(100, -1)).toBeNull()
    expect(buildPaperShaderWorldSize(Number.NaN, 100)).toBeNull()
  })
})
