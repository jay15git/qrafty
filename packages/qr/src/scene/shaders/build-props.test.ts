import { describe, expect, it } from "vitest"

import { buildPaperShaderRenderProps } from "./build-props"
import { LIVE_PAPER_SHADER_RENDER_OPTIONS } from "./live-render-options"

describe("buildPaperShaderRenderProps", () => {
  const shader = {
    shaderId: "waves",
    params: { colorBack: "#000000", colorFront: "#ffbb00" },
    frame: 0,
    speed: 1,
    paused: false,
    renderOptions: { maxPixelCount: 6016 * 3384 },
  }

  it("applies live resolution caps by default", () => {
    expect(buildPaperShaderRenderProps(shader)).toMatchObject({
      minPixelRatio: LIVE_PAPER_SHADER_RENDER_OPTIONS.minPixelRatio,
      maxPixelCount: LIVE_PAPER_SHADER_RENDER_OPTIONS.maxPixelCount,
      speed: 1,
      frame: 0,
    })
    expect(buildPaperShaderRenderProps(shader).webGlContextAttributes).toEqual(
      LIVE_PAPER_SHADER_RENDER_OPTIONS.webGlContextAttributes,
    )
  })

  it("preserves export render options when quality is export", () => {
    const exported = buildPaperShaderRenderProps(shader, { quality: "export" })
    expect(exported).toMatchObject({
      maxPixelCount: 6016 * 3384,
      speed: 1,
    })
    expect(exported).not.toHaveProperty("minPixelRatio")
    expect(exported).not.toHaveProperty("webGlContextAttributes")
  })

  it("zeros speed when paused", () => {
    expect(
      buildPaperShaderRenderProps({
        ...shader,
        paused: true,
      }).speed,
    ).toBe(0)
  })

  it("pins world size from layout bounds over params", () => {
    expect(
      buildPaperShaderRenderProps({
        ...shader,
        params: {
          ...shader.params,
          worldWidth: 10,
          worldHeight: 10,
        },
        worldWidth: 420,
        worldHeight: 560,
      }),
    ).toMatchObject({
      worldWidth: 420,
      worldHeight: 560,
    })
  })

  it("ignores invalid world size", () => {
    expect(
      buildPaperShaderRenderProps({
        ...shader,
        worldWidth: 0,
        worldHeight: 560,
      }),
    ).not.toHaveProperty("worldWidth")
  })
})
