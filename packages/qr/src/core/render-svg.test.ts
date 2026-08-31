// @vitest-environment jsdom

import { describe, expect, it } from "vitest"

import { getFinderCornerRegions } from "./finder-gradient-overlays"
import { renderQraftyQrSvg } from "./render-svg"

describe("@qrafty/qr core renderer", () => {
  it("renders svg from portable props", () => {
    const markup = renderQraftyQrSvg({
      value: "https://example.com",
      module: "diamond",
      finderInner: "rounded",
      finderOuter: "rounded-lg",
      foreground: "#111827",
      background: "#ffffff",
    })

    expect(markup).toContain("<svg")
    expect(markup).toContain('data-testid="data-modules"')
    expect(markup).toContain('data-testid="finder-patterns-outer"')
  })

  it("renders localized finder outer gradients from portable props", () => {
    const markup = renderQraftyQrSvg({
      value: "https://example.com",
      finderOuter: "rounded-lg",
      finderOuterColor: "#111827",
      finderOuterGradient: {
        type: "linear",
        rotation: Math.PI / 4,
        stops: [
          { offset: 0, color: "#ff0000" },
          { offset: 1, color: "#0000ff" },
        ],
      },
      foreground: "#111827",
      background: "#ffffff",
      margin: 12,
    })

    const resultDoc = new DOMParser().parseFromString(markup, "image/svg+xml")
    const frameFillSizes = Array.from(
      resultDoc.querySelectorAll('[data-qr-layer="corner-frame-gradient-fill"]'),
    ).map((element) => Number.parseFloat(element.getAttribute("width") ?? "0"))

    expect(markup).toContain('data-qr-layer="corner-frame-gradient"')
    expect(frameFillSizes).toHaveLength(3)
    expect(frameFillSizes.every((width) => width === 7)).toBe(true)
  })

  it("renders localized finder inner gradients from portable props", () => {
    const markup = renderQraftyQrSvg({
      value: "https://example.com",
      finderInner: "circle",
      finderInnerColor: "#111827",
      finderInnerGradient: {
        type: "linear",
        rotation: Math.PI / 2,
        stops: [
          { offset: 0, color: "#00ff00" },
          { offset: 1, color: "#ffff00" },
        ],
      },
      foreground: "#111827",
      background: "#ffffff",
      margin: 12,
    })

    const resultDoc = new DOMParser().parseFromString(markup, "image/svg+xml")
    const dotFillSizes = Array.from(
      resultDoc.querySelectorAll('[data-qr-layer="corner-dot-gradient-fill"]'),
    ).map((element) => Number.parseFloat(element.getAttribute("width") ?? "0"))

    expect(markup).toContain('data-qr-layer="corner-dot-gradient"')
    expect(dotFillSizes).toHaveLength(3)
    expect(dotFillSizes.every((width) => width === 4.5)).toBe(true)
  })

  it("renders unified module gradients on both finder layers", () => {
    const moduleGradient = {
      type: "linear" as const,
      rotation: Math.PI / 4,
      stops: [
        { offset: 0, color: "#101010" },
        { offset: 1, color: "#fafafa" },
      ],
    }

    const markup = renderQraftyQrSvg({
      value: "https://example.com",
      colorMode: "gradient",
      gradient: moduleGradient,
      gradientMode: "unified",
      foreground: "#111827",
      background: "#ffffff",
      margin: 12,
    })

    const resultDoc = new DOMParser().parseFromString(markup, "image/svg+xml")
    const unifiedFills = resultDoc.querySelectorAll('[data-qr-layer="unified-gradient-fill"]')
    const finderOuter = resultDoc.querySelectorAll('[data-testid="finder-patterns-outer"]')
    const finderInner = resultDoc.querySelectorAll('[data-testid="finder-patterns-inner"]')

    expect(markup).toContain('id="qrafty-dots-gradient"')
    expect(markup).toContain('fill="url(#qrafty-dots-gradient)"')
    expect(markup).not.toContain('data-qr-layer="corner-frame-gradient"')
    expect(markup).not.toContain('data-qr-layer="corner-dot-gradient"')
    expect(unifiedFills.length).toBeGreaterThan(0)
    expect(finderOuter.length).toBeGreaterThan(0)
    expect(finderInner.length).toBeGreaterThan(0)
  })

  it("leaves logo images untouched when unified module gradients are active", () => {
    const moduleGradient = {
      type: "linear" as const,
      rotation: Math.PI / 4,
      stops: [
        { offset: 0, color: "#101010" },
        { offset: 1, color: "#fafafa" },
      ],
    }

    const markup = renderQraftyQrSvg({
      value: "https://example.com",
      colorMode: "gradient",
      gradient: moduleGradient,
      gradientMode: "unified",
      foreground: "#111827",
      background: "#ffffff",
      margin: 12,
      logo: {
        src: "https://example.com/logo.png",
        size: 0.2,
      },
    })

    const resultDoc = new DOMParser().parseFromString(markup, "image/svg+xml")

    expect(resultDoc.querySelector("image")).not.toBeNull()
    expect(markup).not.toContain('data-qr-layer="logo-unified-gradient"')
    expect(markup).not.toContain('data-qr-layer="logo-unified-gradient-fill"')
  })

  it("renders localized finder regions for portable rendering", () => {
    expect(getFinderCornerRegions(12, 49, "outer")[0]).toEqual({
      height: 7,
      width: 7,
      x: 12,
      y: 12,
    })
  })
})
