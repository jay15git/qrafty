import { describe, expect, it } from "vitest"

import { formatFill } from "@/components/ui/fill-picker-base/public-api"
import { studioGradientToFillCss } from "@/features/desktop-shell/inspector/desktopnew-settings-bridge"
import { degreesToRadians } from "@/features/qr-code/styles/gradient-controls"
import {
  cssFillToCanvasColor,
  cssFillToSvgPaint,
  isConicCssFill,
} from "@/features/workspace/export/svg-css-fill"

const WHITE = { l: 1, c: 0, h: 0, alpha: 1 }
const BLACK = { l: 0, c: 0, h: 0, alpha: 1 }

function conicFillCss() {
  return formatFill({
    kind: "gradient",
    gradient: {
      type: "conic",
      startAngle: 45,
      center: { x: 0.5, y: 0.5 },
      interp: "oklch",
      stops: [
        { position: 0, color: WHITE },
        { position: 1, color: BLACK },
      ],
    },
  })
}

describe("svg css fill", () => {
  it("keeps solid colors as paint", () => {
    expect(cssFillToSvgPaint("#ffd80a", "card-fill")).toEqual({
      def: "",
      fill: "#ffd80a",
    })
    expect(cssFillToCanvasColor("#ffd80a")).toBe("#FFD80A")
  })

  it("emits svg linearGradient defs for css background fills", () => {
    const css = studioGradientToFillCss({
      enabled: true,
      type: "linear",
      rotation: degreesToRadians(45),
      colorStops: [
        { offset: 0, color: "#ff0000" },
        { offset: 1, color: "#0000ff" },
      ],
    })
    const paint = cssFillToSvgPaint(css, "card-fill")

    expect(paint.fill).toBe("url(#card-fill)")
    expect(paint.def).toContain('<linearGradient id="card-fill"')
    expect(paint.def).toContain("gradientTransform=")
    expect(paint.def).toContain("stop-color=")
    expect(cssFillToCanvasColor(css).toLowerCase()).toBe("#ff0000")
  })

  it("emits svg radialGradient defs for radial css fills", () => {
    const css = studioGradientToFillCss({
      enabled: true,
      type: "radial",
      rotation: 0,
      colorStops: [
        { offset: 0, color: "#ffffff" },
        { offset: 1, color: "#111111" },
      ],
      center: { x: 0.25, y: 0.75 },
    })
    const paint = cssFillToSvgPaint(css, "card-radial")

    expect(paint.fill).toBe("url(#card-radial)")
    expect(paint.def).toContain('<radialGradient id="card-radial"')
    expect(paint.def).toContain('cx="0.25"')
    expect(paint.def).toContain('cy="0.75"')
  })

  it("keeps conic fills as canvas paint, not fake radial svg", () => {
    const css = conicFillCss()

    expect(isConicCssFill(css)).toBe(true)
    expect(cssFillToSvgPaint(css, "card-conic")).toEqual({
      def: "",
      fill: "#FFFFFF",
    })
    expect(cssFillToCanvasColor(css)).toBe("#FFFFFF")
  })
})
