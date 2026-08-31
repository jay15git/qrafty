import { describe, expect, it } from "vitest"

import {
  applyAssetNoneSelection,
  applyAssetUploadValue,
  applyAssetUrlValue,
  applyBackgroundGradient,
  applyBackgroundSolidColor,
  applyBackgroundTransparentSelection,
  applyCornerGradient,
  applyCornerSolidColor,
  applyDotsGradient,
  applyDotsPaletteSelection,
  applyDotsSolidColor,
  applyLogoPresetColor,
  applyLogoPresetGradient,
  applyLogoPresetSelection,
  createDashboardAccordionOpenItemIds,
  ensureDashboardAccordionItemExpanded,
} from "@/features/qr-code/model/actions"
import { getBrandIconById } from "@/features/qr-code/assets/brand-icons"
import {
  createBrandIconDataUrl,
  createBrandIconGradientDataUrl,
} from "@/features/qr-code/assets/brand-icon-svg"
import { createDefaultQraftyState } from "@/features/qr-code/model/state"

describe("dashboard settings state helpers", () => {
  it("initializes dashboard accordions with the selected item expanded", () => {
    expect(createDashboardAccordionOpenItemIds("solid")).toEqual(["solid"])
  })

  it("ensures newly selected items are expanded without closing siblings", () => {
    expect(
      ensureDashboardAccordionItemExpanded(["solid"], "gradient"),
    ).toEqual(["solid", "gradient"])
  })

  it("applies solid dots editing without changing other fields", () => {
    const state = createDefaultQraftyState()
    state.dotsColorMode = "gradient"

    const nextState = applyDotsSolidColor(state, "#ff0000")

    expect(nextState.dotsColorMode).toBe("solid")
    expect(nextState.dataModulesSettings.color).toBe("#ff0000")
    expect(nextState.dataModulesGradient).toEqual(state.dataModulesGradient)
  })

  it("applies gradient dots editing without selecting on panel open alone", () => {
    const state = createDefaultQraftyState()

    const nextState = applyDotsGradient(state, {
      ...state.dataModulesGradient,
      colorStops: [
        { offset: 0, color: "#111111" },
        { offset: 1, color: "#eeeeee" },
      ],
    })

    expect(state.dotsColorMode).toBe("solid")
    expect(nextState.dotsColorMode).toBe("gradient")
    expect(nextState.dataModulesGradient.colorStops[0].color).toBe("#111111")
  })

  it("applies explicit palette selection without mutating the palette", () => {
    const state = createDefaultQraftyState()

    const nextState = applyDotsPaletteSelection(state)

    expect(nextState.dotsColorMode).toBe("palette")
    expect(nextState.dotsPalette).toEqual(state.dotsPalette)
  })

  it("applies solid corner edits by disabling the matching gradient", () => {
    const state = createDefaultQraftyState()
    state.finderPatternOuterGradient.enabled = true

    const nextState = applyCornerSolidColor(state, "cornersSquare", "#00ff00")

    expect(nextState.finderPatternOuterSettings.color).toBe("#00ff00")
    expect(nextState.finderPatternOuterGradient.enabled).toBe(false)
  })

  it("applies gradient corner edits by enabling the matching gradient", () => {
    const state = createDefaultQraftyState()

    const nextState = applyCornerGradient(state, "cornersDot", {
      ...state.finderPatternInnerGradient,
      enabled: false,
      colorStops: [
        { offset: 0, color: "#222222" },
        { offset: 1, color: "#dddddd" },
      ],
    })

    expect(nextState.finderPatternInnerGradient.enabled).toBe(true)
    expect(nextState.finderPatternInnerGradient.colorStops[1].color).toBe("#dddddd")
  })

  it("applies solid background edits by clearing transparency and gradient mode", () => {
    const state = createDefaultQraftyState()
    state.backgroundOptions.transparent = true
    state.backgroundGradient.enabled = true

    const nextState = applyBackgroundSolidColor(state, "#fafafa")

    expect(nextState.backgroundOptions.color).toBe("#fafafa")
    expect(nextState.backgroundOptions.transparent).toBe(false)
    expect(nextState.backgroundGradient.enabled).toBe(false)
  })

  it("applies background gradient edits by clearing transparency", () => {
    const state = createDefaultQraftyState()
    state.backgroundOptions.transparent = true

    const nextState = applyBackgroundGradient(state, {
      ...state.backgroundGradient,
      enabled: false,
    })

    expect(nextState.backgroundGradient.enabled).toBe(true)
    expect(nextState.backgroundOptions.transparent).toBe(false)
  })

  it("applies transparent background selection immediately", () => {
    const state = createDefaultQraftyState()
    state.backgroundGradient.enabled = true

    const nextState = applyBackgroundTransparentSelection(state)

    expect(nextState.backgroundOptions.transparent).toBe(true)
    expect(nextState.backgroundGradient.enabled).toBe(false)
  })

  it("applies remote asset URL editing as the selected source", () => {
    const state = createDefaultQraftyState()

    const nextState = applyAssetUrlValue(
      state,
      "backgroundImage",
      "https://example.com/background.png",
    )

    expect(nextState.backgroundImage.source).toBe("url")
    expect(nextState.backgroundImage.value).toBe(
      "https://example.com/background.png",
    )
  })

  it("applies upload asset value for logo", () => {
    const state = createDefaultQraftyState()

    const nextState = applyAssetUploadValue(
      state,
      "logo",
      "blob:https://qrafty.local/logo.png",
    )

    expect(nextState.logo).toEqual({
      source: "upload",
      value: "blob:https://qrafty.local/logo.png",
      presetId: undefined,
      presetColor: undefined,
    })
  })

  it("applies none selection immediately for empty asset items", () => {
    const state = createDefaultQraftyState()
    state.logo = {
      source: "url",
      value: "https://example.com/logo.png",
    }

    const nextState = applyAssetNoneSelection(state, "logo")

    expect(nextState.logo).toEqual({
      source: "none",
      value: undefined,
      presetId: undefined,
      presetColor: undefined,
    })
  })

  it("applies preset logo selection with serialized svg data", () => {
    const state = createDefaultQraftyState()
    const brandIcon = getBrandIconById("whatsapp")

    const nextState = applyLogoPresetSelection(
      state,
      brandIcon,
      createBrandIconDataUrl(brandIcon, "#111827"),
      "#111827",
    )

    expect(nextState.logo.source).toBe("preset")
    expect(nextState.logo.presetId).toBe("whatsapp")
    expect(nextState.logo.presetColor).toBe("#111827")
    expect(nextState.logo.value).toContain("data:image/svg+xml")
  })

  it("updates preset logo color while preserving the selected brand", () => {
    const state = createDefaultQraftyState()
    const brandIcon = getBrandIconById("github")
    const selectedState = applyLogoPresetSelection(
      state,
      brandIcon,
      createBrandIconDataUrl(brandIcon, "#111827"),
      "#111827",
    )

    const nextState = applyLogoPresetColor(
      selectedState,
      createBrandIconDataUrl(brandIcon, "#ff4f00"),
      "#ff4f00",
    )

    expect(nextState.logo.source).toBe("preset")
    expect(nextState.logo.presetId).toBe("github")
    expect(nextState.logo.presetColor).toBe("#ff4f00")
    expect(nextState.logo.value).toContain("ff4f00")
    expect(nextState.logoGradient.enabled).toBe(false)
  })

  it("applies preset logo gradient editing without replacing the saved solid color", () => {
    const state = createDefaultQraftyState()
    const brandIcon = getBrandIconById("github")
    const selectedState = applyLogoPresetSelection(
      state,
      brandIcon,
      createBrandIconDataUrl(brandIcon, "#111827"),
      "#111827",
    )

    const nextState = applyLogoPresetGradient(
      selectedState,
      createBrandIconGradientDataUrl(brandIcon, {
        ...state.logoGradient,
        enabled: true,
        type: "linear",
        rotation: Math.PI / 2,
        colorStops: [
          { offset: 0, color: "#ff4f00" },
          { offset: 1, color: "#facc15" },
        ],
      }),
      {
        ...state.logoGradient,
        enabled: true,
        type: "linear",
        rotation: Math.PI / 2,
        colorStops: [
          { offset: 0, color: "#ff4f00" },
          { offset: 1, color: "#facc15" },
        ],
      },
    )

    expect(nextState.logo.source).toBe("preset")
    expect(nextState.logo.presetId).toBe("github")
    expect(nextState.logo.presetColor).toBe("#111827")
    expect(nextState.logoGradient.enabled).toBe(true)
    expect(nextState.logoGradient.type).toBe("linear")
    expect(nextState.logo.value).toContain("brand-icon-gradient")
  })
})
