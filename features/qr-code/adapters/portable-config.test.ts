import { describe, expect, it } from "vitest"

import { toPortableQrConfig } from "@/features/qr-code/adapters/portable-config"
import { createDefaultQrStudioState } from "@/features/qr-code/model/state"

describe("toPortableQrConfig", () => {
  it("maps default studio state to readable portable props", () => {
    const state = createDefaultQrStudioState()

    expect(toPortableQrConfig(state)).toEqual({
      background: "#f8fafc",
      backgroundGradient: "none",
      boostLevel: true,
      colorMode: "solid",
      finderInner: "circle",
      finderOuter: "rounded-lg",
      finderInnerColor: "#111827",
      finderOuterColor: "#111827",
      finderInnerGradient: "none",
      finderOuterGradient: "none",
      foreground: "#111827",
      gradient: "none",
      level: "Q",
      margin: 12,
      minVersion: 1,
      module: "rounded",
      moduleRoundSize: true,
      motion: "none",
      palette: ["#04879c", "#0c3c78", "#090030", "#f30a49"],
      size: 320,
      value: "https://new-qr-studio.local/launch",
    })
  })

  it("maps separate finder colors and module round size", () => {
    const state = createDefaultQrStudioState()
    state.dataModulesSettings.color = "#ff0000"
    state.finderPatternInnerSettings.color = "#00ff00"
    state.finderPatternOuterSettings.color = "#0000ff"
    state.dataModulesSettings.roundSize = false

    const config = toPortableQrConfig(state)

    expect(config.foreground).toBe("#ff0000")
    expect(config.finderInnerColor).toBe("#00ff00")
    expect(config.finderOuterColor).toBe("#0000ff")
    expect(config.moduleRoundSize).toBe(false)
  })

  it("uses a transparent qr background when a decorative shape is active", () => {
    const state = createDefaultQrStudioState()
    state.backgroundShapeId = "flower"

    expect(toPortableQrConfig(state).background).toBe("transparent")
  })

  it("maps diamond module and rounded finder styles", () => {
    const state = createDefaultQrStudioState()
    state.dataModulesSettings.type = "diamond"
    state.finderPatternInnerSettings.type = "rounded"
    state.finderPatternOuterSettings.type = "rounded-lg"

    const config = toPortableQrConfig(state)

    expect(config.module).toBe("diamond")
    expect(config.finderInner).toBe("rounded")
    expect(config.finderOuter).toBe("rounded-lg")
  })

  it("maps gradient and motion presets", () => {
    const state = createDefaultQrStudioState()
    state.dotsColorMode = "gradient"
    state.dataModulesGradient.enabled = true
    state.dataModulesGradient.type = "linear"
    state.dataModulesGradient.rotation = 45
    state.dataModulesGradient.colorStops = [
      { offset: 0, color: "#111111" },
      { offset: 1, color: "#999999" },
    ]
    state.dotMatrixAnimation.enabled = true
    state.dotMatrixAnimation.animated = true
    state.dotMatrixAnimation.presetCategory = "standard"
    state.dotMatrixAnimation.preset = "FadeInTopDown"

    const config = toPortableQrConfig(state)

    expect(config.colorMode).toBe("gradient")
    expect(config.gradient).toEqual({
      rotation: 45,
      stops: [
        { color: "#111111", offset: 0 },
        { color: "#999999", offset: 1 },
      ],
      type: "linear",
    })
    expect(config.motion).toBe("bitjson")
    expect(config.motionPreset).toBe("FadeInTopDown")
  })

  it("maps boostLevel, module tuning, logo advanced fields, and ariaLabel", () => {
    const state = createDefaultQrStudioState()
    state.qrOptions.boostLevel = false
    state.dataModulesSettings.moduleSize = 0.9
    state.dataModulesSettings.lineWidth = 0.75
    state.ariaLabel = "Scan to pay"
    state.imageOptions.opacity = 0.8
    state.imageOptions.sizeMode = "pixels"
    state.imageOptions.widthPx = 48
    state.imageOptions.heightPx = 32
    state.imageOptions.logoPositionMode = "custom"
    state.imageOptions.x = 10
    state.imageOptions.y = 12
    state.logo = { source: "url", value: "https://example.com/logo.png" }

    expect(toPortableQrConfig(state)).toMatchObject({
      ariaLabel: "Scan to pay",
      boostLevel: false,
      logo: {
        height: 32,
        opacity: 0.8,
        src: "https://example.com/logo.png",
        width: 48,
        x: 10,
        y: 12,
      },
      moduleLineWidth: 0.75,
      moduleSize: 0.9,
    })
  })
})
