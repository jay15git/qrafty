import { describe, expect, it } from "vitest"

import { formatFill, parseFill, type Fill } from "@/components/ui/fill-picker-base/public-api"
import { fillFromHex } from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"
import { degreesToRadians } from "@/features/qr-code/styles/gradient-controls"
import type { StudioGradient } from "@/features/qr-code/model/state"
import {
  applyCardFill,
  applyPatternModuleFill,
  fillCssToStudioGradient,
  studioGradientToFillCss,
} from "@/features/desktop-shell/inspector/desktopnew-settings-bridge"
import { cssFillToBackgroundStyle } from "@/features/workspace/model/css-fill-style"

const SAMPLE_GRADIENT: StudioGradient = {
  enabled: true,
  type: "linear",
  rotation: degreesToRadians(45),
  colorStops: [
    { offset: 0, color: "#111111" },
    { offset: 1, color: "#eeeeee" },
  ],
}

const WHITE = { l: 1, c: 0, h: 0, alpha: 1 }
const BLACK = { l: 0, c: 0, h: 0, alpha: 1 }

describe("desktopnew fill bridge", () => {
  it("round-trips studio gradients through parseFill", () => {
    const css = studioGradientToFillCss(SAMPLE_GRADIENT)
    const parsed = parseFill(css)

    expect(parsed?.kind).toBe("gradient")
    if (parsed?.kind !== "gradient") {
      return
    }

    expect(parsed.gradient.type).toBe("linear")
    if (parsed.gradient.type !== "linear") {
      return
    }

    expect(parsed.gradient.angle).toBeCloseTo(135)

    const back = fillCssToStudioGradient(css, SAMPLE_GRADIENT)
    expect(back.enabled).toBe(true)
    expect(back.type).toBe("linear")
    expect(back.rotation).toBeCloseTo(SAMPLE_GRADIENT.rotation)
    expect(back.colorStops[0].color.toLowerCase()).toBe("#111111")
    expect(back.colorStops[1].color.toLowerCase()).toBe("#eeeeee")
  })

  it("maps picker fill onto module fill mode", () => {
    const fill = parseFill(studioGradientToFillCss(SAMPLE_GRADIENT))
    expect(fill).not.toBeNull()
    const patch = applyPatternModuleFill(fill as Fill, {
      dotsColorMode: "solid",
      dotsSolidColor: "#000000",
      dataModulesGradient: {
        ...SAMPLE_GRADIENT,
        enabled: false,
      },
    } as never)

    expect(patch.dotsColorMode).toBe("gradient")
    expect(patch.dataModulesGradient?.enabled).toBe(true)
  })

  it("maps CSS 90deg to horizontal studio rotation", () => {
    const fill: Fill = {
      kind: "gradient",
      gradient: {
        type: "linear",
        angle: 90,
        interp: "oklch",
        stops: [
          { color: WHITE, position: 0 },
          { color: BLACK, position: 1 },
        ],
      },
    }

    const studio = fillCssToStudioGradient(formatFill(fill), SAMPLE_GRADIENT)
    expect(studio.rotation).toBeCloseTo(0)
  })

  it("coerces conic gradients to radial for studio storage", () => {
    const fill: Fill = {
      kind: "gradient",
      gradient: {
        type: "conic",
        startAngle: 45,
        center: { x: 0.5, y: 0.5 },
        interp: "oklch",
        stops: [
          { color: WHITE, position: 0 },
          { color: BLACK, position: 1 },
        ],
      },
    }

    const studio = fillCssToStudioGradient(formatFill(fill), SAMPLE_GRADIENT)
    expect(studio.type).toBe("radial")
  })

  it("keeps authored stop offsets when the area has start/end", () => {
    const fill: Fill = {
      kind: "gradient",
      gradient: {
        type: "linear",
        angle: 90,
        interp: "oklch",
        start: { x: 0.2, y: 0.5 },
        end: { x: 0.8, y: 0.5 },
        stops: [
          { color: WHITE, position: 0 },
          { color: BLACK, position: 1 },
        ],
      },
    }

    const css = formatFill(fill)
    const fromCss = parseFill(css)
    expect(fromCss?.kind).toBe("gradient")
    if (fromCss?.kind === "gradient") {
      const cssStops = [...fromCss.gradient.stops].sort((a, b) => a.position - b.position)
      expect(cssStops[0]?.position).not.toBe(0)
      expect(cssStops[cssStops.length - 1]?.position).not.toBe(1)
    }

    const patch = applyPatternModuleFill(fill, {
      dotsColorMode: "solid",
      dotsSolidColor: "#000000",
      dataModulesGradient: SAMPLE_GRADIENT,
    } as never)

    expect(patch.dataModulesGradient?.colorStops[0].offset).toBe(0)
    expect(patch.dataModulesGradient?.colorStops[1].offset).toBe(1)
  })

  it("round-trips radial center through the studio bridge", () => {
    const fill: Fill = {
      kind: "gradient",
      gradient: {
        type: "radial",
        shape: "circle",
        center: { x: 0.35, y: 0.65 },
        size: "farthest-corner",
        interp: "oklch",
        stops: [
          { color: WHITE, position: 0 },
          { color: BLACK, position: 1 },
        ],
      },
    }

    const studio = fillCssToStudioGradient(formatFill(fill), SAMPLE_GRADIENT)
    expect(studio.type).toBe("radial")
    expect(studio.center?.x).toBeCloseTo(0.35)
    expect(studio.center?.y).toBeCloseTo(0.65)

    const css = studioGradientToFillCss(studio)
    const parsed = parseFill(css)
    expect(parsed?.kind).toBe("gradient")
    if (parsed?.kind === "gradient" && parsed.gradient.type === "radial") {
      expect(parsed.gradient.center.x).toBeCloseTo(0.35)
      expect(parsed.gradient.center.y).toBeCloseTo(0.65)
    }
  })

  it("keeps card fill CSS for gradients", () => {
    const fill = parseFill(studioGradientToFillCss(SAMPLE_GRADIENT))
    expect(fill).not.toBeNull()
    expect(applyCardFill(fill as Fill)).toEqual({ cardFill: formatFill(fill as Fill) })
    expect(applyCardFill(fillFromHex("#ff0000")).cardFill.toLowerCase()).toBe("#ff0000")
  })

  it("paints gradient card fills as background-image", () => {
    const css = studioGradientToFillCss(SAMPLE_GRADIENT)
    expect(cssFillToBackgroundStyle(css)).toEqual({
      backgroundColor: "transparent",
      backgroundImage: css,
    })
    expect(cssFillToBackgroundStyle("#ffffff")).toEqual({
      backgroundColor: "#ffffff",
    })
  })
})
