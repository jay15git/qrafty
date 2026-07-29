import { describe, expect, it } from "vitest"

import {
  buildRoundedRectPath,
  cornerRadiiToCss,
  createUniformCornerRadii,
  normalizeCornerRadiiState,
  patchCornerRadii,
  resolveCornerRadii,
  setCornerRadiiLinked,
  syncCornerRadiusFields,
} from "@/features/workspace/model/corner-radius"

describe("corner-radius", () => {
  it("normalizes legacy cornerRadius into linked radii", () => {
    expect(normalizeCornerRadiiState(undefined, undefined, 24)).toEqual(
      createUniformCornerRadii(24),
    )
  })

  it("renders css border radius in clockwise order", () => {
    expect(
      cornerRadiiToCss({
        bottomLeft: 4,
        bottomRight: 8,
        linked: false,
        topLeft: 12,
        topRight: 16,
      }),
    ).toBe("12px 16px 8px 4px")
  })

  it("patches individual corners when unlinked", () => {
    const base = createUniformCornerRadii(16, { linked: false })
    const next = patchCornerRadii(base, 16, "topRight", 32)

    expect(next).toEqual({
      bottomLeft: 16,
      bottomRight: 16,
      linked: false,
      topLeft: 16,
      topRight: 32,
    })
  })

  it("keeps corners linked when patching one corner", () => {
    expect(patchCornerRadii(createUniformCornerRadii(12), 12, "bottomLeft", 20)).toEqual(
      createUniformCornerRadii(20),
    )
  })

  it("re-links corners to a shared value", () => {
    const unlinked = createUniformCornerRadii(12, { linked: false, topRight: 24 })
    expect(setCornerRadiiLinked(unlinked, 12, true)).toEqual(createUniformCornerRadii(24))
  })

  it("builds a rounded rect path with mixed radii", () => {
    const path = buildRoundedRectPath(100, 80, {
      bottomLeft: 8,
      bottomRight: 12,
      topLeft: 16,
      topRight: 20,
    })

    expect(path.startsWith("M 16 0")).toBe(true)
    expect(path.endsWith("Z")).toBe(true)
  })

  it("syncs legacy cornerRadius with cornerRadii", () => {
    expect(
      syncCornerRadiusFields(18, {
        bottomLeft: 18,
        bottomRight: 18,
        linked: true,
        topLeft: 18,
        topRight: 18,
      }),
    ).toEqual({
      cornerRadius: 18,
      cornerRadii: createUniformCornerRadii(18),
    })
  })

  it("prefers cornerRadii when resolving", () => {
    expect(
      resolveCornerRadii(
        {
          bottomLeft: 4,
          bottomRight: 6,
          linked: false,
          topLeft: 8,
          topRight: 10,
        },
        99,
      ).topRight,
    ).toBe(10)
  })
})
