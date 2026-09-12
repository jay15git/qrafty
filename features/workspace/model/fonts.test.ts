// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest"

import {
  DEFAULT_DRAFTING_FONT_ID,
  DRAFTING_FONT_REGISTRY,
  getDraftingFontByFamily,
  getDraftingFontCssFamily,
  getDraftingFontById,
  groupDraftingFonts,
  isDraftingFontLoaded,
  loadDraftingFont,
  loadDraftingFontPreview,
  resolveDraftingFont,
} from "@/features/workspace/model/fonts"

describe("drafting font registry", () => {
  beforeEach(() => {
    document.head.innerHTML = ""
  })

  it("resolves local, Fontshare, and system fonts", () => {
    expect(resolveDraftingFont({ fontId: DEFAULT_DRAFTING_FONT_ID })).toMatchObject({
      family: "Satoshi",
      source: "local",
    })
    expect(resolveDraftingFont({ fontFamily: "General Sans" })).toMatchObject({
      id: "fontshare:general-sans",
      source: "fontshare",
    })
    expect(resolveDraftingFont({ fontFamily: "Arial" })).toMatchObject({
      id: "system:arial",
      source: "system",
    })
    expect(getDraftingFontById("fontshare:satoshi")).toBeUndefined()
  })

  it("resolves Google font entries by family and generated id", () => {
    expect(resolveDraftingFont({ fontFamily: "Playfair Display" })).toMatchObject({
      family: "Playfair Display",
      id: "google:playfair-display",
      source: "google",
    })
    expect(getDraftingFontById("google:inter")).toMatchObject({
      family: "Inter",
      source: "google",
    })
    // Legacy documents stored `system:inter` — family fallback still resolves.
    expect(getDraftingFontByFamily("Inter")).toMatchObject({ id: "google:inter" })
  })

  it("builds valid Google Fonts css2 URLs for variable and static fonts", () => {
    const inter = getDraftingFontById("google:inter")
    expect(inter?.cssUrl).toBe(
      "https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&display=swap",
    )

    const bebas = getDraftingFontById("google:bebas-neue")
    expect(bebas?.cssUrl).toBe(
      "https://fonts.googleapis.com/css2?family=Bebas+Neue:wght@400&display=swap",
    )

    const lato = getDraftingFontById("google:lato")
    expect(lato?.cssUrl).toBe(
      "https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap",
    )
  })

  it("keeps unknown legacy font families in CSS output", () => {
    expect(getDraftingFontCssFamily({ fontFamily: "Legacy Brand Font" })).toBe(
      '"Legacy Brand Font", system-ui, Arial, sans-serif',
    )
  })

  it("uses a category-matched fallback for Google fonts", () => {
    expect(getDraftingFontCssFamily({ fontId: "google:playfair-display" })).toBe(
      '"Playfair Display", Georgia, \'Times New Roman\', serif',
    )
    expect(getDraftingFontCssFamily({ fontId: "google:jetbrains-mono" })).toBe(
      '"JetBrains Mono", ui-monospace, \'Courier New\', monospace',
    )
  })

  it("injects local Satoshi font-face CSS once", async () => {
    await loadDraftingFont(DEFAULT_DRAFTING_FONT_ID)
    await loadDraftingFont(DEFAULT_DRAFTING_FONT_ID)

    const styles = document.head.querySelectorAll("style#drafting-font-local-satoshi")

    expect(styles).toHaveLength(1)
    expect(styles[0]?.textContent).toContain("font-family: 'Satoshi'")
    expect(isDraftingFontLoaded(DEFAULT_DRAFTING_FONT_ID)).toBe(true)
  })

  it("injects one Fontshare stylesheet and reuses in-flight loading", async () => {
    const firstLoad = loadDraftingFont("fontshare:general-sans")
    const secondLoad = loadDraftingFont("fontshare:general-sans")
    const link = document.head.querySelector<HTMLLinkElement>(
      "link#drafting-font-fontshare-general-sans",
    )

    expect(link?.href).toBe(
      "https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap",
    )
    expect(document.head.querySelectorAll("link#drafting-font-fontshare-general-sans")).toHaveLength(1)

    link?.dispatchEvent(new Event("load"))
    await Promise.all([firstLoad, secondLoad])

    expect(isDraftingFontLoaded("fontshare:general-sans")).toBe(true)
  })

  it("injects a Google Fonts stylesheet through the shared cssUrl path", async () => {
    const load = loadDraftingFont("google:inter")
    const link = document.head.querySelector<HTMLLinkElement>("link#drafting-font-google-inter")

    expect(link?.href).toContain("https://fonts.googleapis.com/css2?family=Inter")

    link?.dispatchEvent(new Event("load"))
    await load

    expect(isDraftingFontLoaded("google:inter")).toBe(true)
  })

  it("injects a glyph-subset preview stylesheet without a full font load", () => {
    loadDraftingFontPreview("google:playfair-display")
    loadDraftingFontPreview("google:playfair-display")

    const previews = document.head.querySelectorAll<HTMLLinkElement>(
      "link#drafting-font-google-playfair-display-preview",
    )

    expect(previews).toHaveLength(1)
    expect(previews[0]?.href).toContain("family=Playfair+Display:wght@400")
    expect(previews[0]?.href).toContain("text=Playfair%20Display")
    // Preview injection must not mark the font fully loaded.
    expect(isDraftingFontLoaded("google:playfair-display")).toBe(false)
    expect(
      document.head.querySelector("link#drafting-font-google-playfair-display"),
    ).toBeNull()
  })

  it("falls back to a full load for fonts without a preview URL", () => {
    loadDraftingFontPreview("fontshare:general-sans")

    expect(
      document.head.querySelector("link#drafting-font-fontshare-general-sans"),
    ).not.toBeNull()
  })

  it("groups fonts by category and filters by query", () => {
    const all = groupDraftingFonts()
    const categories = all.map((group) => group.category)

    expect(categories[0]).toBe("sans")
    expect(categories).toContain("handwriting")
    expect(categories).toContain("mono")
    expect(all.find((group) => group.category === "sans")?.fonts.length).toBeGreaterThan(30)

    const filtered = groupDraftingFonts("plex")
    const families = filtered.flatMap((group) => group.fonts.map((font) => font.family))

    expect(families).toContain("IBM Plex Sans")
    expect(families).toContain("IBM Plex Serif")
    expect(families).toContain("IBM Plex Mono")
    expect(families).not.toContain("Inter")

    expect(groupDraftingFonts("zzzz-no-match")).toHaveLength(0)
  })

  it("keeps registry entries unique by id and family", () => {
    const ids = DRAFTING_FONT_REGISTRY.map((font) => font.id)
    const families = DRAFTING_FONT_REGISTRY.map((font) => font.family.toLowerCase())

    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(families).size).toBe(families.length)
    expect(DRAFTING_FONT_REGISTRY.length).toBeGreaterThan(150)
  })
})
