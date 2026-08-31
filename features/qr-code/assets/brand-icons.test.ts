import { describe, expect, it } from "vitest"

import {
  BRAND_ICON_CATALOG,
  POPULAR_BRAND_ICON_IDS,
  filterBrandIcons,
  getBrandIconById,
} from "@/features/qr-code/assets/brand-icons"
import {
  createBrandIconDataUrl,
  createBrandIconGradientDataUrl,
} from "@/features/qr-code/assets/brand-icon-svg"
import { createDefaultQraftyState } from "@/features/qr-code/model/state"

describe("brand icon catalog", () => {
  it("ships the curated brand icon catalog without unavailable brands", () => {
    expect(BRAND_ICON_CATALOG).toHaveLength(87)
    expect(BRAND_ICON_CATALOG.map((entry) => entry.id)).toContain("whatsapp")
    expect(BRAND_ICON_CATALOG.map((entry) => entry.id)).toContain("google-pay")
    expect(BRAND_ICON_CATALOG.map((entry) => entry.id)).not.toContain("linkedin")
  })

  it("keeps the available popular brand row ordered for the search-first picker", () => {
    expect(POPULAR_BRAND_ICON_IDS).toEqual([
      "whatsapp",
      "instagram",
      "facebook",
      "youtube",
      "tiktok",
      "telegram",
      "spotify",
      "paypal",
      "google-maps",
      "shopify",
      "github",
    ])
  })

  it("matches search queries by label, id, and curated aliases", () => {
    expect(filterBrandIcons("twitter").map((entry) => entry.id)).toContain("x")
    expect(filterBrandIcons("wa.me").map((entry) => entry.id)).toContain("whatsapp")
    expect(filterBrandIcons("gpay").map((entry) => entry.id)).toContain("google-pay")
    expect(filterBrandIcons("google maps").map((entry) => entry.id)).toContain(
      "google-maps",
    )
  })

  it("narrows brand icon search results to the selected category", () => {
    expect(filterBrandIcons("", "social").map((entry) => entry.id)).toContain("whatsapp")
    expect(filterBrandIcons("", "social").map((entry) => entry.id)).not.toContain(
      "github",
    )
    expect(filterBrandIcons("google", "travel").map((entry) => entry.id)).toEqual([
      "google-maps",
    ])
  })

  it("serializes selected brand icons to svg data urls", () => {
    const icon = getBrandIconById("whatsapp")
    const neutralDataUrl = createBrandIconDataUrl(icon, "#111827")
    const accentDataUrl = createBrandIconDataUrl(icon, "#ff4f00")
    const gradientDataUrl = createBrandIconGradientDataUrl(icon, {
      ...createDefaultQraftyState().logoGradient,
      enabled: true,
      colorStops: [
        { offset: 0, color: "#ff4f00" },
        { offset: 1, color: "#facc15" },
      ],
    })

    expect(neutralDataUrl).toContain("data:image/svg+xml")
    expect(neutralDataUrl).toContain("111827")
    expect(accentDataUrl).toContain("ff4f00")
    expect(accentDataUrl).not.toBe(neutralDataUrl)
    expect(gradientDataUrl).toContain("brand-icon-gradient")
    expect(gradientDataUrl).toContain("linearGradient")
  })
})
