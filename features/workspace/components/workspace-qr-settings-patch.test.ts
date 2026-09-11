import { describe, expect, it } from "vitest"

import { createDefaultQraftyState } from "@/features/qr-code/model/state"
import {
  applyCornersSettingsPatchToQraftyState,
  applyLogoSettingsPatchToQraftyState,
  applyPatternSettingsPatchToQraftyState,
} from "@/features/workspace/components/workspace-qr-settings-patch"
import { getAssetValue } from "@/features/qr-code/model/state"

describe("workspace qr settings patch", () => {
  it("applies module style and color patches to QRafty state", () => {
    const base = createDefaultQraftyState()

    const next = applyPatternSettingsPatchToQraftyState(base, {
      qrDotType: "pinched-square",
      dotsSolidColor: "#51a4b7",
    })

    expect(next.dataModulesSettings.type).toBe("pinched-square")
    expect(next.dataModulesSettings.color).toBe("#51a4b7")
    expect(next.dotsColorMode).toBe("solid")
  })

  it("applies corner style and color patches to QRafty state", () => {
    const base = createDefaultQraftyState()

    const next = applyCornersSettingsPatchToQraftyState(base, {
      cornerDotType: "circle",
      cornerDotSolidColor: "#ff00aa",
      cornerSquareType: "rounded-lg",
      cornerSquareSolidColor: "#00ffaa",
    })

    expect(next.finderPatternInnerSettings.type).toBe("circle")
    expect(next.finderPatternInnerSettings.color).toBe("#ff00aa")
    expect(next.finderPatternOuterSettings.type).toBe("rounded-lg")
    expect(next.finderPatternOuterSettings.color).toBe("#00ffaa")
  })

  it("replaces module fill images without dropping prior corner patches", () => {
    const base = applyPatternSettingsPatchToQraftyState(createDefaultQraftyState(), {
      moduleFillImageUrl: "/backgrounds/studio/aqua-glow.webp",
      moduleFillImageSourceMode: "url",
    })

    const next = applyPatternSettingsPatchToQraftyState(base, {
      moduleFillImageUrl: "/backgrounds/studio/blue-hour.webp",
      moduleFillImageSourceMode: "url",
    })

    expect(getAssetValue(next.moduleFillImage)).toBe("/backgrounds/studio/blue-hour.webp")
    expect(next.dotsColorMode).toBe("image")
  })

  it("clears module fill images and keeps unified logo patches separate", () => {
    const base = applyPatternSettingsPatchToQraftyState(createDefaultQraftyState(), {
      moduleFillImageUrl: "data:image/png;base64,abc",
      moduleFillImageSourceMode: "upload",
    })

    const cleared = applyPatternSettingsPatchToQraftyState(base, {
      moduleFillImageUrl: "",
      moduleFillImageSourceMode: "upload",
    })
    const withLogo = applyLogoSettingsPatchToQraftyState(cleared, {
      colorMode: "solid",
      solidColor: "#112233",
    })

    expect(getAssetValue(withLogo.moduleFillImage)).toBeUndefined()
    expect(withLogo.logo.presetColor).toBe("#112233")
  })
})
