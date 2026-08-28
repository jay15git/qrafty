import { describe, expect, it } from "vitest"

import {
  getHeroIndefiniteArticle,
  HERO_ROTATING_WORDS,
} from "@/components/home/hero-rotating-words"

describe("getHeroIndefiniteArticle", () => {
  it("uses an before vowel-starting words", () => {
    expect(getHeroIndefiniteArticle("event")).toBe("an")
  })

  it("uses a before consonant-starting words", () => {
    for (const word of HERO_ROTATING_WORDS) {
      if (word === "event") continue
      expect(getHeroIndefiniteArticle(word)).toBe("a")
    }
  })
})
