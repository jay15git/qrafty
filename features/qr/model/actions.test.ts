import { describe, expect, it } from "vitest"

import {
  applyAssetNoneSelection,
  applyAssetUploadValue,
  applyAssetUrlValue,
  applyLogoPresetColor,
  applyLogoPresetGradient,
  applyLogoPresetSelection,
} from "@/features/qr/model/actions"
import { getBrandIconById } from "@/features/qr/assets/brand-icons"
import {
  createBrandIconDataUrl,
  createBrandIconGradientDataUrl,
} from "@/features/qr/assets/brand-icon-svg"
import { createDefaultQraftyState } from "@/features/qr/model/state"

describe("dashboard settings state helpers", () => {
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
