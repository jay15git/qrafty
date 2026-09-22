import { describe, expect, it } from "vitest"

import {
  buildCustomCornerDotTransform,
  getCustomCornerDotShapeGeometry,
  isCustomCornerDotShape,
} from "./custom-corner-dot-shapes"

describe("custom corner dot shapes", () => {
  it("detects the supported custom shapes", () => {
    expect(isCustomCornerDotShape("orbit-weave")).toBe(true)
    expect(isCustomCornerDotShape("twin-orbit")).toBe(true)
    expect(isCustomCornerDotShape("circle")).toBe(false)
  })

  it("builds a centered placement inside the 3x3 finder cell", () => {
    const geometry = getCustomCornerDotShapeGeometry("soft-cross", 10, 12, 3)

    expect(geometry.d).toContain("M 78 0")
    expect(geometry.translateX).toBeCloseTo(10.12)
    expect(geometry.translateY).toBeCloseTo(12.12)
    expect(geometry.scaleX).toBeCloseTo(0.0108, 3)
    expect(geometry.scaleY).toBeCloseTo(0.0108, 3)
    expect(buildCustomCornerDotTransform(geometry)).toContain("translate(10.12")
  })

  it("marks hole shapes for evenodd fill", () => {
    const geometry = getCustomCornerDotShapeGeometry("rounded-plus", 0, 0, 3)

    expect(geometry.fillRule).toBe("evenodd")
  })
})
