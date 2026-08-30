import { describe, expect, it } from "vitest"

import {
  addPaperShaderColor,
  removePaperShaderColor,
} from "@/features/workspace/rendering/paper-shader-colors"
import { paperShaderHasPlayback } from "@/features/workspace/rendering/paper-shaders"

describe("paperShaderHasPlayback", () => {
  const staticShaderIds = [
    "static-mesh-gradient",
    "static-radial-gradient",
    "waves",
    "dot-grid",
    "paper-texture",
    "fluted-glass",
    "image-dithering",
    "halftone-dots",
    "halftone-cmyk",
  ] as const

  it.each(staticShaderIds)("returns false for static shader %s", (shaderId) => {
    expect(paperShaderHasPlayback(shaderId)).toBe(false)
  })

  it("returns true for time-varying shaders", () => {
    expect(paperShaderHasPlayback("mesh-gradient")).toBe(true)
    expect(paperShaderHasPlayback("warp")).toBe(true)
  })
})

describe("paper shader color list helpers", () => {
  it("adds colors until maxColorCount", () => {
    const base = ["#111111", "#222222", "#333333", "#444444"]

    expect(addPaperShaderColor(base, 5, "#555555")).toEqual([
      "#111111",
      "#222222",
      "#333333",
      "#444444",
      "#555555",
    ])
    expect(
      addPaperShaderColor(
        ["#111111", "#222222", "#333333", "#444444", "#555555"],
        5,
        "#666666",
      ),
    ).toBeNull()
    expect(addPaperShaderColor(base, 10, "#ffffff")).toHaveLength(5)
    expect(addPaperShaderColor(Array.from({ length: 10 }, () => "#ffffff"), 10)).toBeNull()
  })

  it("removes colors but keeps at least one", () => {
    const base = ["#111111", "#222222", "#333333"]

    expect(removePaperShaderColor(base, 1)).toEqual(["#111111", "#333333"])
    expect(removePaperShaderColor(["#111111"], 0)).toBeNull()
    expect(removePaperShaderColor(base, 5)).toBeNull()
  })
})
