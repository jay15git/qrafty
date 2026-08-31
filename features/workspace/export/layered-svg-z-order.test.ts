import { describe, expect, it } from "vitest"

import { createDefaultQraftyState } from "@/features/qr-code/model/state"
import {
  createDefaultDraftingCardState,
  type DraftingCardState,
} from "@/features/workspace/model/card-state"
import {
  createDefaultDraftingLayers,
  createDraftingShaderLayer,
} from "@/features/workspace/model/layers"
import { buildLayeredSvgParts } from "@/features/workspace/export/layered-svg-parts"
import { qraftyGradientToFillCss } from "@/features/desktop-shell/inspector/desktopnew-settings-bridge"
import { degreesToRadians } from "@/features/qr-code/styles/gradient-controls"

describe("layered svg z-order", () => {
  it("renders overlay shader markup after the qr layer", async () => {
    const state = createDefaultQraftyState()
    const cardState = createDefaultDraftingCardState()
    const layers = createDefaultDraftingLayers("node", state, cardState)
    const qrLayer = layers.find((layer) => layer.kind === "qr")

    if (!qrLayer) {
      throw new Error("Expected default qr layer.")
    }

    const overlayShader = createDraftingShaderLayer({
      height: 120,
      id: "node:shader-overlay",
      width: 120,
      x: 40,
      y: 40,
      zIndex: qrLayer.zIndex + 1,
    })

    const parts = await buildLayeredSvgParts({
      cardState,
      layers: [...layers, overlayShader],
      qrMarkup: '<svg data-testid="qr"><rect width="10" height="10"/></svg>',
      shaderSnapshots: {
        [overlayShader.id]: "data:image/png;base64,overlay",
      },
      state,
    })

    const qrIndex = parts.body.indexOf('data-testid="qr"')
    const overlayIndex = parts.body.indexOf("data:image/png;base64,overlay")

    expect(qrIndex).toBeGreaterThanOrEqual(0)
    expect(overlayIndex).toBeGreaterThan(qrIndex)
  })

  it("places card shader clip paths in defs", async () => {
    const state = createDefaultQraftyState()
    const cardState: DraftingCardState = {
      ...createDefaultDraftingCardState(),
      styleMode: "paper-shader",
    }
    const layers = createDefaultDraftingLayers("node", state, cardState)
    const cardLayer = layers.find((layer) => layer.kind === "card")

    if (!cardLayer) {
      throw new Error("Expected default card layer.")
    }

    const parts = await buildLayeredSvgParts({
      cardState,
      layers,
      qrMarkup: '<svg data-testid="qr"><rect width="10" height="10"/></svg>',
      shaderSnapshots: {
        [cardLayer.id]: "data:image/png;base64,card-shader",
      },
      state,
    })

    expect(parts.defs).toContain("<clipPath")
    expect(parts.body).not.toContain("<clipPath")
    expect(parts.body).toContain("clip-path=")
    expect(parts.body).toContain("data:image/png;base64,card-shader")
  })

  it("omits shader layers when requested for compositor svg", async () => {
    const state = createDefaultQraftyState()
    const cardState = createDefaultDraftingCardState()
    const layers = createDefaultDraftingLayers("node", state, cardState)
    const qrLayer = layers.find((layer) => layer.kind === "qr")

    if (!qrLayer) {
      throw new Error("Expected default qr layer.")
    }

    const overlayShader = createDraftingShaderLayer({
      height: 120,
      id: "node:shader-overlay",
      width: 120,
      x: 40,
      y: 40,
      zIndex: qrLayer.zIndex + 1,
    })

    const parts = await buildLayeredSvgParts({
      cardState,
      layers: [...layers, overlayShader],
      omitShaderLayers: true,
      qrMarkup: '<svg data-testid="qr"><rect width="10" height="10"/></svg>',
      shaderSnapshots: {
        [overlayShader.id]: "data:image/png;base64,overlay",
      },
      state,
    })

    expect(parts.body).not.toContain("data:image/png;base64,overlay")
    expect(parts.body).not.toContain('fill="#111827"')
  })

  it("omits nested card image hrefs when compositor rasterizes svg", async () => {
    const state = createDefaultQraftyState()
    const cardState: DraftingCardState = {
      ...createDefaultDraftingCardState(),
      styleMode: "image",
      cardImage: {
        fit: "cover",
        opacity: 100,
        source: "url",
        value: "https://example.com/card-bg.png",
      },
    }
    const layers = createDefaultDraftingLayers("node", state, cardState)

    const parts = await buildLayeredSvgParts({
      cardState,
      layers,
      omitShaderLayers: true,
      qrMarkup: '<svg data-testid="qr"><rect width="10" height="10"/></svg>',
      state,
    })

    expect(parts.body).not.toContain("https://example.com/card-bg.png")
    expect(parts.body).toContain('fill="#ffd80a"')
  })

  it("keeps nested card image hrefs in svg document exports", async () => {
    const state = createDefaultQraftyState()
    const cardState: DraftingCardState = {
      ...createDefaultDraftingCardState(),
      styleMode: "image",
      cardImage: {
        fit: "cover",
        opacity: 100,
        source: "url",
        value: "https://example.com/card-bg.png",
      },
    }
    const layers = createDefaultDraftingLayers("node", state, cardState)

    const parts = await buildLayeredSvgParts({
      cardState,
      layers,
      qrMarkup: '<svg data-testid="qr"><rect width="10" height="10"/></svg>',
      state,
    })

    expect(parts.body).toContain("https://example.com/card-bg.png")
  })

  it("puts card css gradient fills in defs as svg paint servers", async () => {
    const state = createDefaultQraftyState()
    const cardState: DraftingCardState = {
      ...createDefaultDraftingCardState(),
      styleMode: "solid",
      fill: qraftyGradientToFillCss({
        enabled: true,
        type: "linear",
        rotation: degreesToRadians(45),
        colorStops: [
          { offset: 0, color: "#ff0000" },
          { offset: 1, color: "#0000ff" },
        ],
      }),
    }
    const layers = createDefaultDraftingLayers("node", state, cardState)
    const cardLayer = layers.find((layer) => layer.kind === "card")

    if (!cardLayer) {
      throw new Error("Expected default card layer.")
    }

    const parts = await buildLayeredSvgParts({
      cardState,
      layers,
      qrMarkup: '<svg data-testid="qr"><rect width="10" height="10"/></svg>',
      state,
    })

    expect(parts.defs).toContain("<linearGradient")
    expect(parts.body).toContain("fill=\"url(#")
    expect(parts.body).not.toContain("linear-gradient(")
  })
})
