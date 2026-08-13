import { describe, expect, it } from "vitest"

import {
  buildQrInputAutocompleteItems,
  filterQrInputAutocompleteItems,
} from "./qr-input-autocomplete"
import { QR_CATEGORIES } from "./input-options"

describe("qr input autocomplete", () => {
  it("builds one item per category entry", () => {
    const expectedCount = QR_CATEGORIES.reduce((total, category) => total + category.items.length, 0)

    expect(buildQrInputAutocompleteItems()).toHaveLength(expectedCount)
  })

  it("preserves category metadata on flattened items", () => {
    const items = buildQrInputAutocompleteItems()
    const wifi = items.find((item) => item.value === "wifi")

    expect(wifi).toMatchObject({
      label: "Wi-Fi",
      category: "Essentials",
    })
  })

  it('filters by label slug and category name', () => {
    const items = buildQrInputAutocompleteItems()

    expect(filterQrInputAutocompleteItems(items, "wi").some((item) => item.value === "wifi")).toBe(
      true,
    )
    expect(filterQrInputAutocompleteItems(items, "essentials").length).toBeGreaterThan(0)
    expect(filterQrInputAutocompleteItems(items, "nope")).toHaveLength(0)
  })
})
