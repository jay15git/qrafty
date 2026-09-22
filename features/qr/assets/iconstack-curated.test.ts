import { describe, expect, it } from "vitest"

import {
  ICONSTACK_CURATED_ICONS,
  filterCuratedIconstackIcons,
  toCuratedSearchResult,
} from "@/features/qr/assets/iconstack-curated"
import { ICONSTACK_LIBRARIES } from "@/features/qr/assets/iconstack-api"

describe("iconstack-curated", () => {
  it("defines a curated list with unique selection ids", () => {
    expect(ICONSTACK_CURATED_ICONS.length).toBeGreaterThanOrEqual(16)

    const selectionIds = ICONSTACK_CURATED_ICONS.map(
      (icon) => `${icon.library}:${icon.id}`,
    )

    expect(new Set(selectionIds).size).toBe(selectionIds.length)
  })

  it("uses valid iconstack library ids", () => {
    const libraryIds = new Set(ICONSTACK_LIBRARIES.map((library) => library.id))

    for (const icon of ICONSTACK_CURATED_ICONS) {
      expect(libraryIds.has(icon.library)).toBe(true)
    }
  })

  it("filters curated icons by library", () => {
    const lucideIcons = filterCuratedIconstackIcons("lucide")

    expect(lucideIcons.length).toBeGreaterThan(0)
    expect(lucideIcons.every((icon) => icon.library === "lucide")).toBe(true)
    expect(filterCuratedIconstackIcons("all")).toEqual(ICONSTACK_CURATED_ICONS)
  })

  it("builds synthetic search results for desktop buttons", () => {
    const result = toCuratedSearchResult({
      id: "qr-code",
      label: "QR Code",
      library: "lucide",
    })

    expect(result).toEqual({
      category: null,
      id: "lucide-qr-code",
      library: "lucide",
      libraryName: "Lucide",
      name: "QR Code",
      style: "outline",
      tags: [],
      url: "https://iconstack.io/icon/lucide/qr-code",
    })
  })
})
