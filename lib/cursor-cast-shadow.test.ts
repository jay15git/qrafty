import { describe, expect, it } from "vitest"

import { buildCursorCastShadowFilter } from "@/lib/cursor-cast-shadow"

describe("buildCursorCastShadowFilter", () => {
  it("casts shadow down-right when light is above-left of element", () => {
    const filter = buildCursorCastShadowFilter(0, 0, 100, 100, 1)

    expect(filter).toMatch(/drop-shadow\(\d+\.\d+px \d+\.\d+px/)
    const mainShadow = filter.split("drop-shadow(")[1]?.split(")")[0] ?? ""
    const [offsetX, offsetY] = mainShadow.split(" ").map((part) =>
      Number.parseFloat(part.replace("px", "")),
    )

    expect(offsetX).toBeGreaterThan(0)
    expect(offsetY).toBeGreaterThan(0)
  })

  it("casts shadow up-left when light is below-right of element", () => {
    const filter = buildCursorCastShadowFilter(200, 200, 100, 100, 1)
    const mainShadow = filter.split("drop-shadow(")[1]?.split(")")[0] ?? ""
    const [offsetX, offsetY] = mainShadow.split(" ").map((part) =>
      Number.parseFloat(part.replace("px", "")),
    )

    expect(offsetX).toBeLessThan(0)
    expect(offsetY).toBeLessThan(0)
  })

  it("increases blur and opacity with depth", () => {
    const shallow = buildCursorCastShadowFilter(0, 0, 100, 100, 0.5)
    const deep = buildCursorCastShadowFilter(0, 0, 100, 100, 4)

    const shallowBlur = Number.parseFloat(
      shallow.split("drop-shadow(")[1]?.split("px")[2]?.trim() ?? "0",
    )
    const deepBlur = Number.parseFloat(
      deep.split("drop-shadow(")[1]?.split("px")[2]?.trim() ?? "0",
    )
    const shallowOpacity = Number.parseFloat(
      shallow.match(/rgba\(0, 0, 0, ([\d.]+)\)/)?.[1] ?? "0",
    )
    const deepOpacity = Number.parseFloat(
      deep.match(/rgba\(0, 0, 0, ([\d.]+)\)/)?.[1] ?? "0",
    )

    expect(deepBlur).toBeGreaterThan(shallowBlur)
    expect(deepOpacity).toBeGreaterThan(shallowOpacity)
  })

  it("uses fallback direction when light and element share the same point", () => {
    const filter = buildCursorCastShadowFilter(50, 50, 50, 50, 1)

    expect(filter).toContain("drop-shadow(20.00px 32.00px")
  })
})
