import { describe, expect, it } from "vitest"

import { createDefaultQrStudioState } from "@/features/qr-code/model/state"
import {
  applyCornersSettingsPatchToStudioState,
  applyPatternSettingsPatchToStudioState,
} from "@/features/workspace/components/workspace-qr-settings-patch"

describe("workspace qr settings patch", () => {
  it("applies module style and color patches to studio state", () => {
    const base = createDefaultQrStudioState()

    const next = applyPatternSettingsPatchToStudioState(base, {
      qrDotType: "pinched-square",
      dotsSolidColor: "#51a4b7",
    })

    expect(next.dataModulesSettings.type).toBe("pinched-square")
    expect(next.dataModulesSettings.color).toBe("#51a4b7")
    expect(next.dotsColorMode).toBe("solid")
  })

  it("applies corner style and color patches to studio state", () => {
    const base = createDefaultQrStudioState()

    const next = applyCornersSettingsPatchToStudioState(base, {
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
})
