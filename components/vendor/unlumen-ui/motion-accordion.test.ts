import { describe, expect, it } from "vitest"

import {
  getNextOpenItemId,
  getNextOpenItemIds,
} from "@/components/vendor/unlumen-ui/motion-accordion.utils"

describe("motion accordion helpers", () => {
  it("adds a new item in multi-open mode without closing siblings", () => {
    expect(getNextOpenItemIds(["solid"], "gradient")).toEqual([
      "solid",
      "gradient",
    ])
  })

  it("collapses only the targeted item in multi-open mode", () => {
    expect(getNextOpenItemIds(["solid", "gradient"], "solid")).toEqual([
      "gradient",
    ])
  })

  it("keeps the existing single-open helper behavior intact", () => {
    expect(getNextOpenItemId("solid", "gradient", false)).toBe("gradient")
    expect(getNextOpenItemId("solid", "solid", false)).toBe("solid")
    expect(getNextOpenItemId("solid", "solid", true)).toBeNull()
  })
})
