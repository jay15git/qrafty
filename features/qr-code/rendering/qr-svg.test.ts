// @vitest-environment jsdom

import { describe, expect, it } from "vitest"

import {
  buildDashboardQrNodePayload,
  createDashboardSurfaceQrState,
  renderDashboardQrSvgMarkup,
  stripXmlDeclaration,
} from "@/features/qr-code/rendering/qr-svg"
import {
  createBrandIconDataUrl,
} from "@/features/qr-code/assets/brand-icon-svg"
import { getBrandIconById } from "@/features/qr-code/assets/brand-icons"
import {
  createDefaultQrStudioState,
  setSquareQrSize,
  type StudioGradient,
} from "@/features/qr-code/model/state"
import {
  CORNER_DOT_STYLE_OPTIONS,
  CORNER_SQUARE_STYLE_OPTIONS,
} from "@/features/qr-code/styles/style-options"

const TEST_FRAME_GRADIENT = {
  enabled: true,
  type: "linear" as const,
  rotation: Math.PI / 4,
  colorStops: [
    { offset: 0, color: "#ff0000" },
    { offset: 1, color: "#0000ff" },
  ],
} satisfies StudioGradient

const TEST_DOT_GRADIENT = {
  enabled: true,
  type: "linear" as const,
  rotation: Math.PI / 2,
  colorStops: [
    { offset: 0, color: "#00ff00" },
    { offset: 1, color: "#ffff00" },
  ],
} satisfies StudioGradient

function getLocalizedFinderGradientRegionSizes(markup: string, gradientIdPrefix: string) {
  const document = new DOMParser().parseFromString(markup, "image/svg+xml")

  return Array.from(document.querySelectorAll(`linearGradient[id^="${gradientIdPrefix}"]`)).map(
    (gradient) => {
      const id = gradient.getAttribute("id") ?? ""
      const match = id.match(/(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)-1$/)

      return {
        height: Number.parseFloat(match?.[2] ?? "0"),
        width: Number.parseFloat(match?.[1] ?? "0"),
      }
    },
  )
}

function getSvgNumCells(markup: string) {
  const document = new DOMParser().parseFromString(markup, "image/svg+xml")
  const svg = document.documentElement
  const viewBox = svg.getAttribute("viewBox")

  if (!viewBox) {
    return null
  }

  const parts = viewBox.trim().split(/[\s,]+/).map(Number.parseFloat)
  return parts[2] ?? null
}

describe("dashboard qr svg helpers", () => {
  it("forces svg rendering for the dashboard surface without mutating the original state", () => {
    const state = createDefaultQrStudioState()
    state.type = "canvas"

    const dashboardState = createDashboardSurfaceQrState(state)

    expect(dashboardState.type).toBe("svg")
    expect(state.type).toBe("canvas")
    expect(dashboardState.width).toBe(state.width)
    expect(dashboardState.height).toBe(state.height)
  })

  it("removes xml declarations before the svg markup is inlined on the composer surface", () => {
    const markup =
      '<?xml version="1.0" standalone="no"?>\n<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" /></svg>'

    expect(stripXmlDeclaration(markup)).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" /></svg>',
    )
  })

  it("uses the canonical qr size when building the dashboard payload", async () => {
    const state = setSquareQrSize(createDefaultQrStudioState(), 512)

    const payload = await buildDashboardQrNodePayload(state)

    expect(payload.naturalWidth).toBe(512)
    expect(payload.naturalHeight).toBe(512)
    expect(payload.markup).toContain("<svg")
    expect(payload.markup).toContain('width="512"')
    expect(payload.markup).not.toContain("width:100%")
  })

  it("renders ReactQRCode finder pattern styles into the dashboard payload", async () => {
    const state = createDefaultQrStudioState()
    state.finderPatternInnerSettings.type = "heart"
    state.finderPatternOuterSettings.type = "rounded-lg"

    const payload = await buildDashboardQrNodePayload(state)

    expect(payload.naturalWidth).toBe(state.width)
    expect(payload.naturalHeight).toBe(state.height)
    expect(payload.markup).toContain('data-testid="finder-patterns-inner"')
    expect(payload.markup).toContain('data-testid="finder-patterns-outer"')
  })

  it("applies palette module colors to the rendered dashboard qr payload", async () => {
    const state = createDefaultQrStudioState()
    state.dotsColorMode = "palette"
    state.dotsPalette = ["#04879c", "#0c3c78", "#f30a49"]

    const payload = await buildDashboardQrNodePayload(state)

    expect(payload.markup).toContain('data-qr-layer="dot-palette-fill"')
    expect(payload.markup).toContain('fill="#04879c"')
    expect(payload.markup).toContain('fill="#0c3c78"')
    expect(payload.markup).toContain('fill="#f30a49"')
    expect(payload.markup).not.toContain('qr-dot-palette-clip')
  })

  it("applies palette module colors to direct qr svg markup", () => {
    const state = createDefaultQrStudioState()
    state.dotsColorMode = "palette"
    state.dotsPalette = ["#04879c", "#0c3c78", "#f30a49"]

    const markup = renderDashboardQrSvgMarkup(state)

    expect(markup).toContain('data-qr-layer="dot-palette-fill"')
    expect(markup).toContain('fill="#04879c"')
    expect(markup).toContain('fill="#0c3c78"')
    expect(markup).toContain('fill="#f30a49"')
  })

  it.each(["circle", "diamond", "circuit-board"] as const)(
    "keeps all palette colors visible for %s data module shapes",
    (style) => {
      const state = createDefaultQrStudioState()
      state.dotsColorMode = "palette"
      state.dotsPalette = ["#111111", "#222222", "#333333", "#444444"]
      state.dataModulesSettings.type = style

      const markup = renderDashboardQrSvgMarkup(state)

      expect(markup).toContain('data-qr-layer="dot-palette-fill"')
      for (const color of state.dotsPalette) {
        expect(markup).toContain(`fill="${color}"`)
      }
    },
  )

  it("applies corner frame gradients to finder outer patterns", () => {
    const state = createDefaultQrStudioState()
    state.finderPatternOuterGradient = TEST_FRAME_GRADIENT

    const markup = renderDashboardQrSvgMarkup(state)
    const frameFillSizes = getLocalizedFinderGradientRegionSizes(markup, "corners-square-color-")
    const numCells = getSvgNumCells(markup)
    const document = new DOMParser().parseFromString(markup, "image/svg+xml")
    const frameFills = document.querySelectorAll('[data-qr-layer="corner-frame-gradient-fill"]')

    expect(markup).toContain('data-qr-layer="corner-frame-gradient"')
    expect(markup).toContain('id="corners-square-color-')
    expect(markup).toContain('fill="url(\'#corners-square-color-')
    expect(frameFills).toHaveLength(3)
    expect(frameFills[0]?.tagName.toLowerCase()).toBe("path")
    expect(frameFillSizes).toHaveLength(3)
    expect(numCells).not.toBeNull()
    expect(frameFillSizes.some((size) => size.width === numCells)).toBe(false)
    expect(markup).not.toContain('data-qr-layer="corner-frame-gradient-clip"')
  })

  it("renders custom corner dot shapes into the dashboard payload", async () => {
    const state = createDefaultQrStudioState()
    state.finderPatternInnerSettings.type = "orbit-weave"

    const markup = renderDashboardQrSvgMarkup(state)

    expect(markup).toContain('data-testid="finder-patterns-inner"')
    expect(markup).toContain('data-qr-layer="custom-corner-dot"')
    expect(markup).toContain("M 228 0")
    expect(markup).not.toMatch(
      /<rect[^>]+data-testid="finder-patterns-inner"/,
    )
  })

  it("applies corner dot gradients to custom inner patterns", () => {
    const state = createDefaultQrStudioState()
    state.finderPatternInnerSettings.type = "rounded-plus"
    state.finderPatternInnerGradient = TEST_DOT_GRADIENT

    const markup = renderDashboardQrSvgMarkup(state)
    const document = new DOMParser().parseFromString(markup, "image/svg+xml")
    const dotFills = document.querySelectorAll('[data-qr-layer="custom-corner-dot"]')

    expect(markup).toContain('data-qr-layer="corner-dot-gradient"')
    expect(markup).toContain('data-qr-layer="custom-corner-dot"')
    expect(dotFills).toHaveLength(3)
    expect(dotFills[0]?.getAttribute("fill")).toContain("corners-dot-color-")
    expect(markup).not.toContain('data-qr-layer="corner-dot-gradient-clip"')
  })

  it("applies corner dot gradients to finder inner patterns", () => {
    const state = createDefaultQrStudioState()
    state.finderPatternInnerGradient = TEST_DOT_GRADIENT

    const markup = renderDashboardQrSvgMarkup(state)
    const document = new DOMParser().parseFromString(markup, "image/svg+xml")
    const dotFills = document.querySelectorAll('[data-qr-layer="corner-dot-gradient-fill"]')

    expect(markup).toContain('data-qr-layer="corner-dot-gradient"')
    expect(markup).toContain('id="corners-dot-color-')
    expect(markup).toContain('fill="url(\'#corners-dot-color-')
    expect(dotFills).toHaveLength(3)
    expect(markup).not.toContain('data-qr-layer="corner-dot-gradient-clip"')
  })

  it.each(CORNER_SQUARE_STYLE_OPTIONS.map((option) => option.value))(
    "localizes corner frame gradients for %s outer styles",
    (style) => {
      const state = createDefaultQrStudioState()
      state.finderPatternOuterSettings.type = style
      state.finderPatternOuterGradient = TEST_FRAME_GRADIENT

      const markup = renderDashboardQrSvgMarkup(state)
      const hasOuterPattern = markup.includes('data-testid="finder-patterns-outer"')

      if (!hasOuterPattern) {
        expect(markup).not.toContain('data-qr-layer="corner-frame-gradient"')
        return
      }

      const frameFillSizes = getLocalizedFinderGradientRegionSizes(markup, "corners-square-color-")
      const document = new DOMParser().parseFromString(markup, "image/svg+xml")
      const frameFills = document.querySelectorAll('[data-qr-layer="corner-frame-gradient-fill"]')

      expect(frameFills).toHaveLength(3)
      expect(frameFillSizes).toHaveLength(3)
      expect(markup).toContain('fill="url(\'#corners-square-color-')
      expect(markup).not.toContain('data-qr-layer="corner-frame-gradient-clip"')
    },
  )

  it.each(CORNER_DOT_STYLE_OPTIONS.map((option) => option.value))(
    "localizes corner dot gradients for %s inner styles",
    (style) => {
      const state = createDefaultQrStudioState()
      state.finderPatternInnerSettings.type = style
      state.finderPatternInnerGradient = TEST_DOT_GRADIENT

      const markup = renderDashboardQrSvgMarkup(state)
      const hasInnerPattern = markup.includes('data-testid="finder-patterns-inner"')

      if (!hasInnerPattern) {
        expect(markup).not.toContain('data-qr-layer="corner-dot-gradient"')
        return
      }

      const document = new DOMParser().parseFromString(markup, "image/svg+xml")
      const dotFills = document.querySelectorAll(
        '[data-qr-layer="corner-dot-gradient-fill"], [data-qr-layer="custom-corner-dot"]',
      )

      expect(dotFills).toHaveLength(3)
      expect(markup).toContain('fill="url(\'#corners-dot-color-')
      expect(markup).not.toContain('data-qr-layer="corner-dot-gradient-clip"')
    },
  )

  it("keeps module gradients isolated when corner frame gradients are enabled", () => {
    const state = createDefaultQrStudioState()
    state.dotsColorMode = "gradient"
    state.dataModulesGradient = {
      enabled: true,
      type: "linear",
      rotation: Math.PI / 2,
      colorStops: [
        { offset: 0, color: "#101010" },
        { offset: 1, color: "#fafafa" },
      ],
    }
    state.finderPatternOuterGradient = {
      enabled: true,
      type: "linear",
      rotation: 0,
      colorStops: [
        { offset: 0, color: "#ff0000" },
        { offset: 1, color: "#0000ff" },
      ],
    }

    const markup = renderDashboardQrSvgMarkup(state)

    expect(markup).toContain('data-qr-layer="dot-gradient-definition"')
    expect(markup).toContain('data-qr-layer="corner-frame-gradient"')
    expect(markup).toContain('fill="url(\'#dot-gradient-definition\')"')
    expect(markup).toContain('fill="url(\'#corners-square-color-')
    expect(markup).not.toContain('data-qr-layer="dot-gradient-clip"')
  })

  it("applies unified module gradients to corner frames and corner dots", () => {
    const state = createDefaultQrStudioState()
    state.dotsColorMode = "gradient"
    state.gradientLinkMode = "unified"
    state.dataModulesGradient = {
      enabled: true,
      type: "linear",
      rotation: Math.PI / 2,
      colorStops: [
        { offset: 0, color: "#101010" },
        { offset: 1, color: "#fafafa" },
      ],
    }

    const markup = renderDashboardQrSvgMarkup(state)
    const document = new DOMParser().parseFromString(markup, "image/svg+xml")
    const unifiedFills = document.querySelectorAll('[data-qr-layer="unified-gradient-fill"]')
    const finderOuter = document.querySelectorAll('[data-testid="finder-patterns-outer"]')
    const finderInner = document.querySelectorAll('[data-testid="finder-patterns-inner"]')

    expect(markup).toContain('data-qr-layer="unified-gradient-definition"')
    expect(markup).toContain('fill="url(#unified-gradient-definition)"')
    expect(markup).not.toContain('data-qr-layer="corner-frame-gradient"')
    expect(markup).not.toContain('data-qr-layer="corner-dot-gradient"')
    expect(markup).not.toContain('corners-square-color-')
    expect(markup).not.toContain('corners-dot-color-')
    expect(unifiedFills.length).toBeGreaterThan(0)
    expect(finderOuter.length).toBeGreaterThan(0)
    expect(finderInner.length).toBeGreaterThan(0)
  })

  it("leaves logo images untouched when unified module gradients are active", () => {
    const state = createDefaultQrStudioState()
    state.dotsColorMode = "gradient"
    state.gradientLinkMode = "unified"
    state.dataModulesGradient = {
      enabled: true,
      type: "linear",
      rotation: Math.PI / 2,
      colorStops: [
        { offset: 0, color: "#101010" },
        { offset: 1, color: "#fafafa" },
      ],
    }
    state.logo = {
      source: "preset",
      presetId: "github",
      value: createBrandIconDataUrl(getBrandIconById("github"), "#111827"),
    }

    const markup = renderDashboardQrSvgMarkup(state)
    const document = new DOMParser().parseFromString(markup, "image/svg+xml")

    expect(document.querySelector("image")).not.toBeNull()
    expect(markup).not.toContain('data-qr-layer="logo-unified-gradient"')
    expect(markup).not.toContain('data-qr-layer="logo-unified-gradient-fill"')
  })

  it("applies module gradients without repainting finder patterns", () => {
    const state = createDefaultQrStudioState()
    state.dotsColorMode = "gradient"
    state.dataModulesGradient = {
      enabled: true,
      type: "linear",
      rotation: Math.PI / 2,
      colorStops: [
        { offset: 0, color: "#101010" },
        { offset: 1, color: "#fafafa" },
      ],
    }

    const markup = renderDashboardQrSvgMarkup(state)

    expect(markup).toContain('data-qr-layer="dot-gradient-definition"')
    expect(markup).toContain('data-qr-layer="dot-gradient-fill"')
    expect(markup).toContain('fill="url(\'#dot-gradient-definition\')"')
    expect(markup).toContain('data-testid="finder-patterns-inner"')
    expect(markup).toContain('data-testid="finder-patterns-outer"')
    expect(markup).toMatch(/<rect[^>]+fill="#111827"[^>]+data-testid="finder-patterns-inner"/)
    expect(markup).toMatch(/<path[^>]+fill="#111827"[^>]+data-testid="finder-patterns-outer"/)
    expect(markup).not.toContain('data-testid="finder-patterns-inner" fill="url(')
    expect(markup).not.toContain('data-testid="finder-patterns-outer" fill="url(')
    expect(markup).not.toContain('data-qr-layer="dot-gradient-clip"')
  })

  it("renders a standalone svg with namespace and visible default qr geometry", () => {
    const state = createDefaultQrStudioState()
    state.dataModulesSettings.type = "square"
    state.finderPatternOuterSettings.type = "square"
    state.finderPatternInnerSettings.type = "square"

    const markup = renderDashboardQrSvgMarkup(state)
    const document = new DOMParser().parseFromString(markup, "image/svg+xml")
    const svg = document.documentElement

    expect(document.querySelector("parsererror")).toBeNull()
    expect(svg.tagName.toLowerCase()).toBe("svg")
    expect(svg.getAttribute("xmlns")).toBe("http://www.w3.org/2000/svg")
    const dataModules = svg.querySelector('[data-testid="data-modules"]')
    expect(dataModules?.tagName.toLowerCase()).toBe("path")
    expect(dataModules?.getAttribute("fill")).toBe("#111827")
    expect((dataModules?.getAttribute("d") ?? "").length).toBeGreaterThan(1000)
    expect(markup).toContain('data-testid="finder-patterns-outer"')
    expect(markup).toContain('data-testid="finder-patterns-inner"')
  })

  it("reports expanded natural size when background effects grow outside the qr", async () => {
    const state = setSquareQrSize(createDefaultQrStudioState(), 320)
    state.backgroundShapeId = "circle"
    state.backgroundShapeOptions = {
      edgeBlur: 8,
      paddingPx: 24,
      shadowColor: "#020617",
      shadowOffsetX: 12,
      shadowOffsetY: -10,
      shadowOpacity: 58,
      strokeColor: "#111827",
      strokeOpacity: 50,
      strokeWidth: 6,
      tiltX: 0,
      tiltY: 0,
    }

    const payload = await buildDashboardQrNodePayload(state)

    expect(payload.naturalWidth).toBe(406)
    expect(payload.naturalHeight).toBe(406)
    expect(payload.markup).toContain('data-qr-layer="background-shape"')
  })
})
