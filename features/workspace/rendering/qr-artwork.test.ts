// @vitest-environment jsdom

import { describe, expect, it } from "vitest"

import { toReactQrCodeProps } from "@/features/qr-code/adapters/react-qr-adapter"
import { createDefaultQraftyState } from "@/features/qr-code/model/state"
import { buildDraftingLayeredNodePayload } from "@/features/workspace/export/layered-export"
import { DEFAULT_DRAFTING_CARD_STATE } from "@/features/workspace/model/card-state"
import { createDefaultDraftingLayers } from "@/features/workspace/model/layers"
import {
  getDraftingQrLayerLayout,
  getQrRenderedDimensions,
} from "@/features/qr-code/rendering/svg-extension"
import {
  createDraftingQrArtworkState,
  sanitizeDraftingQrArtworkMarkup,
  scaleNestedSvgMarkup,
  snapLayeredRasterDimensionsToQrModuleGrid,
} from "@/features/workspace/rendering/qr-artwork"

describe("drafting qr artwork helpers", () => {
  it("scales nested svg markup to the exact target layer dimensions", () => {
    expect(
      scaleNestedSvgMarkup('<svg width="320" height="320" viewBox="0 0 57 57"></svg>', 240, 240),
    ).toBe(
      '<svg viewBox="0 0 57 57" width="240" height="240" preserveAspectRatio="xMidYMid meet" shape-rendering="geometricPrecision"></svg>',
    )
  })

  it("snaps layered raster dimensions so the embedded qr lands on an integer module grid", () => {
    expect(
      snapLayeredRasterDimensionsToQrModuleGrid({
        exportHeight: 1024,
        exportWidth: 709,
        naturalHeight: 416,
        naturalWidth: 288,
        qrMetrics: {
          displayHeight: 240,
          displayWidth: 240,
          moduleUnits: 57,
        },
      }),
    ).toEqual({
      height: 988,
      width: 684,
    })
  })

  it("derives resized qr layout metrics from the layer width", () => {
    const state = createDefaultQraftyState()
    state.backgroundShapeId = "ghost"
    state.backgroundShapeOptions = {
      ...state.backgroundShapeOptions,
      paddingPx: 16,
      strokeWidth: 4,
    }

    const naturalOuter = getQrRenderedDimensions(state)
    const layout = getDraftingQrLayerLayout(naturalOuter.width * 0.75, state)

    expect(layout.metrics.outerWidth).toBeCloseTo(naturalOuter.width * 0.75, 4)
    expect(layout.metrics.translateX).toBeGreaterThan(0)
    expect(layout.metrics.backingRegion.width).toBeGreaterThanOrEqual(layout.innerWidth)
  })

  it("preserves palette module paint after svg id prefixing in layered export", async () => {
    const state = createDefaultQraftyState()
    state.width = 240
    state.height = 240
    state.dotsColorMode = "palette"
    state.dotsPalette = ["#04879c", "#0c3c78", "#f30a49"]
    state.dataModulesSettings.type = "circle"

    const layers = createDefaultDraftingLayers("node-1", state, DEFAULT_DRAFTING_CARD_STATE)
    const payload = await buildDraftingLayeredNodePayload({
      cardState: DEFAULT_DRAFTING_CARD_STATE,
      layers,
      name: "QR Code",
      nodeId: "node-1",
      state,
    })
    const document = new DOMParser().parseFromString(payload.originalSvgMarkup, "image/svg+xml")

    expect(payload.originalSvgMarkup).toContain('data-qr-layer="dot-palette-fill"')
    expect(payload.originalSvgMarkup).toContain('fill="#04879c"')
    expect(payload.originalSvgMarkup).toContain('fill="#0c3c78"')
    expect(payload.originalSvgMarkup).toContain('fill="#f30a49"')
    expect(payload.originalSvgMarkup).not.toContain("qr-dot-palette-clip")

    const paletteFills = document.querySelectorAll('[data-qr-layer="dot-palette-fill"]')
    expect(paletteFills.length).toBeGreaterThan(0)
  })

  it("preserves qr foreground geometry in layered svg export", async () => {
    const state = createDefaultQraftyState()
    state.dataModulesSettings.type = "square"
    state.finderPatternOuterSettings.type = "square"
    state.finderPatternInnerSettings.type = "square"

    const layers = createDefaultDraftingLayers("node-1", state, DEFAULT_DRAFTING_CARD_STATE)
    const payload = await buildDraftingLayeredNodePayload({
      cardState: DEFAULT_DRAFTING_CARD_STATE,
      layers,
      name: "QR Code",
      nodeId: "node-1",
      state,
    })

    const document = new DOMParser().parseFromString(payload.originalSvgMarkup, "image/svg+xml")

    expect(document.querySelector("parsererror")).toBeNull()
    const dataModules = document.querySelector('[data-testid="data-modules"]')
    expect(dataModules?.tagName.toLowerCase()).toBe("path")
    expect(dataModules?.getAttribute("fill")).toBe("#111827")
    expect((dataModules?.getAttribute("d") ?? "").length).toBeGreaterThan(1000)
    expect(payload.originalSvgMarkup).toContain('data-testid="finder-patterns-outer"')
    expect(payload.originalSvgMarkup).toContain('data-testid="finder-patterns-inner"')
  })
})

describe("drafting qr artwork helpers (legacy)", () => {
  it("creates foreground-only ReactQRCode state for drafting artwork", () => {
    const state = createDefaultQraftyState()
    state.backgroundImage = {
      source: "url",
      value: "https://example.com/background.png",
    }
    state.backgroundShapeId = "flower"
    state.backgroundShapeOptions = {
      edgeBlur: 14,
      paddingPx: 28,
      shadowColor: "#22c55e",
      shadowOffsetX: 10,
      shadowOffsetY: -8,
      shadowOpacity: 65,
      strokeColor: "#0f172a",
      strokeOpacity: 42,
      strokeWidth: 6,
      tiltX: 0,
      tiltY: 0,
    }
    state.backgroundGradient = {
      enabled: true,
      type: "linear",
      rotation: 45,
      colorStops: [
        { offset: 0, color: "#ff0000" },
        { offset: 1, color: "#0000ff" },
      ],
    }
    state.backgroundOptions.transparent = false
    state.backgroundOptions.color = "#facc15"

    const artworkState = createDraftingQrArtworkState(state)
    const props = toReactQrCodeProps(artworkState)

    expect(props.background).toBe("transparent")
    expect(artworkState.backgroundImage).toEqual({
      source: "none",
      value: undefined,
      presetId: undefined,
      presetColor: undefined,
    })
    expect(artworkState.backgroundShapeId).toBe("none")
    expect(artworkState.backgroundShapeOptions).toEqual({
      edgeBlur: 0,
      paddingPx: 0,
      shadowColor: "#111827",
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowOpacity: 72,
      strokeColor: "#f8fafc",
      strokeOpacity: 100,
      strokeWidth: 0,
      tiltX: 0,
      tiltY: 0,
    })
    expect(artworkState.backgroundGradient.enabled).toBe(false)
    expect(artworkState.backgroundOptions.transparent).toBe(true)
  })

  it("strips qr-library-owned background artifacts from drafting artwork markup", () => {
    const markup = sanitizeDraftingQrArtworkMarkup(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">
        <defs>
          <filter data-qr-layer="background-shape-blur-filter" id="background-shape-blur-filter" />
          <filter data-qr-layer="background-surface-blur-filter" id="background-surface-blur-filter" />
          <clipPath id="clip-path-background-color-0"><rect width="320" height="320" /></clipPath>
          <clipPath id="clip-path-dot-color-0"><path d="M20 20h40v40H20z" /></clipPath>
        </defs>
        <image data-qr-layer="background-image" href="https://example.com/bg.png" />
        <clipPath data-qr-layer="background-image-clip"><rect width="320" height="320" /></clipPath>
        <path data-qr-layer="background-shape-blur" d="M0 0h320v320H0z" />
        <path data-qr-layer="background-shape" d="M0 0h320v320H0z" />
        <rect data-qr-layer="background-surface-blur" width="320" height="320" />
        <rect width="320" height="320" clip-path="url('#clip-path-background-color-0')" fill="#fff" />
        <rect data-qr-layer="dot" clip-path="url('#clip-path-dot-color-0')" fill="#111" />
      </svg>`,
    )

    expect(markup).not.toContain("background-image")
    expect(markup).not.toContain("background-shape")
    expect(markup).not.toContain("background-surface")
    expect(markup).not.toContain("clip-path-background-color")
    expect(markup).toContain("clip-path-dot-color")
    expect(markup).toContain('data-qr-layer="dot"')
  })
})
