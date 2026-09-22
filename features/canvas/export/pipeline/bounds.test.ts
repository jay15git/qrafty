import { describe, expect, it } from "vitest"

import {
  makeEvenDimension,
  resolveVideoOutputDimensions,
} from "@/features/canvas/export/pipeline/bounds"

describe("export bounds", () => {
  it("returns even video dimensions", () => {
    expect(resolveVideoOutputDimensions(400, 801, 1080)).toEqual({
      width: 540,
      height: 1080,
    })
    expect(makeEvenDimension(539)).toBe(540)
  })
})
