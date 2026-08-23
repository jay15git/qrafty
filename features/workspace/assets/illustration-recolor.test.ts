import { describe, expect, it } from "vitest"

import {
  extractSvgPaintColors,
  getIllustrationDisplaySrc,
  illustrationColorMapIsIdentity,
  illustrationStopsToReplacementMap,
  remapSvgPaintColors,
  resolveIllustrationDisplayColors,
} from "@/features/workspace/assets/illustration-recolor"

const MONO_SVG = `<svg viewBox="0 0 10 10"><path d="M0 0h10v10H0z" fill="black"/></svg>`
const MULTI_SVG = `<svg viewBox="0 0 10 10"><rect fill="#191919" width="10" height="10"/><circle fill="#FB4AB5" cx="5" cy="5" r="2"/><path fill="black" d="M1 1h1v1H1z"/></svg>`

describe("illustration-recolor", () => {
  it("extracts a single fill from monochrome markup", () => {
    expect(extractSvgPaintColors(MONO_SVG)).toEqual(["#000000"])
  })

  it("extracts unique fills from multi-color markup", () => {
    expect(extractSvgPaintColors(MULTI_SVG)).toEqual(["#191919", "#fb4ab5", "#000000"])
  })

  it("skips none and url paints", () => {
    expect(
      extractSvgPaintColors(
        `<svg fill="none"><path fill="none" stroke="url(#g)" d="M0 0"/><path fill="#4329b5" d="M1 1"/></svg>`,
      ),
    ).toEqual(["#4329b5"])
  })

  it("skips paints inside defs and clipPath", () => {
    expect(
      extractSvgPaintColors(
        `<svg><path fill="#4f5332" d="M0 0"/><defs><clipPath><rect fill="white" width="10" height="10"/></clipPath></defs></svg>`,
      ),
    ).toEqual(["#4f5332"])
  })

  it("recolors a single fill including named black", () => {
    expect(remapSvgPaintColors(MONO_SVG, { "#000000": "#ff4f00" })).toContain('fill="#ff4f00"')
  })

  it("recolors only mapped stops in a multi-color svg", () => {
    const next = remapSvgPaintColors(MULTI_SVG, {
      "#191919": "#111111",
      "#fb4ab5": "#00ffaa",
    })

    expect(next).toContain('fill="#111111"')
    expect(next).toContain('fill="#00ffaa"')
    expect(next).toContain('fill="black"')
  })

  it("resolves stored stops onto source colors", () => {
    expect(
      resolveIllustrationDisplayColors(["#000000", "#fb4ab5"], [
        { from: "#000000", to: "#ffffff" },
      ]),
    ).toEqual(["#ffffff", "#fb4ab5"])
  })

  it("builds an identity map when no stops are stored", () => {
    const map = illustrationStopsToReplacementMap(["#000000", "#fb4ab5"], undefined)
    expect(illustrationColorMapIsIdentity(map)).toBe(true)
  })

  it("returns a data url only when a stop actually changes", () => {
    expect(getIllustrationDisplaySrc("/illustrations/x.svg", MONO_SVG, undefined)).toBe(
      "/illustrations/x.svg",
    )
    expect(
      getIllustrationDisplaySrc("/illustrations/x.svg", MONO_SVG, [
        { from: "#000000", to: "#ff4f00" },
      ]),
    ).toMatch(/^data:image\/svg\+xml/)
  })
})
