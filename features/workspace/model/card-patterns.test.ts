import { describe, expect, it } from "vitest"

import {
  DRAFTING_CARD_PATTERN_NONE_ID,
  DRAFTING_CARD_PATTERNS,
  getDraftingCardPatternById,
  getDraftingCardPatternStyle,
} from "@/features/workspace/model/card-patterns"

describe("drafting card patterns", () => {
  it("ships the full Afif CSS-Pattern catalog", () => {
    expect(DRAFTING_CARD_PATTERNS.length).toBe(145)
    expect(DRAFTING_CARD_PATTERNS[0]?.id).toBe("g1")
    expect(DRAFTING_CARD_PATTERNS.at(-1)?.id).toBe("g145")
  })

  it("uses sequential Pattern 001 labels", () => {
    for (const [index, pattern] of DRAFTING_CARD_PATTERNS.entries()) {
      const number = String(index + 1).padStart(3, "0")
      expect(pattern.label).toBe(`Pattern ${number}`)
      expect(pattern.sourceId).toBe(pattern.id)
    }
  })

  it("resolves every pattern id and background style", () => {
    for (const pattern of DRAFTING_CARD_PATTERNS) {
      expect(getDraftingCardPatternById(pattern.id)).toEqual(pattern)

      const style = getDraftingCardPatternStyle(pattern.id)
      expect(style).not.toBeNull()
      expect(style?.background).toBeTruthy()
    }

    expect(getDraftingCardPatternById(DRAFTING_CARD_PATTERN_NONE_ID)).toBeNull()
    expect(getDraftingCardPatternStyle(DRAFTING_CARD_PATTERN_NONE_ID)).toBeNull()
  })
})
