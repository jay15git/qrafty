// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest"

const buildDashboardQrNodePayloadSpy = vi.fn()

vi.mock("@/features/qr-code/rendering/qr-svg-render", () => ({
  buildDashboardQrNodePayload: (
    ...args: Parameters<typeof buildDashboardQrNodePayloadSpy>
  ) => buildDashboardQrNodePayloadSpy(...args),
}))

import { createDefaultQraftyState } from "@/features/qr-code/model/state"
import { buildDraftingLayeredNodePayload } from "@/features/workspace/export/layered-export"
import { createDefaultDraftingCardState } from "@/features/workspace/model/card-state"
import { createDefaultDraftingLayers } from "@/features/workspace/model/layers"

describe("drafting layered export", () => {
  it("exports app-owned qr background shapes without qr-library backing artifacts", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue({
      markup:
        '<svg width="240" height="240" viewBox="0 0 240 240" data-testid="qrafty-markup"><defs><filter data-qr-layer="background-shape-blur-filter" id="background-shape-blur-filter"/><clipPath id="clip-path-background-color-0"><rect width="240" height="240"/></clipPath><clipPath id="clip-path-dot-color-0"><path d="M20 20h40v40H20z"/></clipPath></defs><path data-qr-layer="background-shape" d="M0 0h240v240H0z"/><rect width="240" height="240" clip-path="url(\'#clip-path-background-color-0\')" fill="#fff"/><path data-qr-layer="dot" clip-path="url(\'#clip-path-dot-color-0\')" d="M20 20h40v40H20z" fill="#111"/></svg>',
      naturalHeight: 240,
      naturalWidth: 240,
    })
    const state = createDefaultQraftyState()
    state.backgroundShapeId = "flower"
    state.backgroundImage = {
      source: "url",
      value: "https://example.com/background.png",
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
    const cardState = createDefaultDraftingCardState()
    const layers = createDefaultDraftingLayers("preview", state, cardState)

    const payload = await buildDraftingLayeredNodePayload({
      cardState,
      layers,
      name: "QR Code",
      nodeId: "preview",
      state,
    })

    expect(buildDashboardQrNodePayloadSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        backgroundGradient: expect.objectContaining({ enabled: false }),
        backgroundImage: {
          source: "none",
          value: undefined,
          presetId: undefined,
          presetColor: undefined,
        },
        backgroundOptions: expect.objectContaining({ transparent: true }),
        backgroundShapeId: "none",
      }),
    )
    expect(payload.originalSvgMarkup).toContain('data-drafting-qr-background="flower"')
    expect(payload.originalSvgMarkup).toContain('data-testid="qrafty-markup"')
    expect(payload.originalSvgMarkup).toContain('data-qr-layer="dot"')
    expect(payload.originalSvgMarkup).not.toContain('data-qr-layer="background-shape"')
    expect(payload.originalSvgMarkup).not.toContain("clip-path-background-color")
  })

  it("exports image and shape layers in the layered svg", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue({
      markup: '<svg width="240" height="240" viewBox="0 0 240 240"><path d="M0 0"/></svg>',
      naturalHeight: 240,
      naturalWidth: 240,
    })
    const state = createDefaultQraftyState()
    const cardState = createDefaultDraftingCardState()
    const layers = [
      ...createDefaultDraftingLayers("preview", state, cardState),
      {
        blur: 0,
        cornerRadius: 12,
        height: 120,
        id: "preview:image:1",
        imageFit: "cover",
        imageSource: "url",
        imageValue: "https://example.com/photo.png",
        isVisible: true,
        kind: "image",
        name: "Photo",
        nodeId: "preview",
        opacity: 1,
        rotation: 0,
        shadow: { blur: 0, color: "#111827", offsetX: 0, offsetY: 0, opacity: 0 },
        tiltX: 0,
        tiltY: 0,
        width: 120,
        x: 40,
        y: 40,
        zIndex: 3,
      },
      {
        blur: 0,
        fill: "#abcdef",
        fillMode: "solid",
        height: 80,
        id: "preview:shape:1",
        isVisible: true,
        kind: "shape",
        name: "Badge",
        nodeId: "preview",
        opacity: 1,
        rotation: 0,
        shapeId: "hexagon",
        shadow: { blur: 0, color: "#111827", offsetX: 0, offsetY: 0, opacity: 0 },
        stroke: "#171717",
        strokeOpacity: 100,
        strokeWidth: 0,
        tiltX: 0,
        tiltY: 0,
        width: 80,
        x: -40,
        y: -40,
        zIndex: 4,
      },
    ]

    const payload = await buildDraftingLayeredNodePayload({
      cardState,
      layers,
      name: "QR Code",
      nodeId: "preview",
      state,
    })

    expect(payload.originalSvgMarkup).toContain('href="https://example.com/photo.png"')
    expect(payload.originalSvgMarkup).toContain('fill="#abcdef"')
  })

  it("includes layer tilt skew in exported layer transforms", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue({
      markup: '<svg width="240" height="240" viewBox="0 0 240 240"><path d="M0 0"/></svg>',
      naturalHeight: 240,
      naturalWidth: 240,
    })
    const state = createDefaultQraftyState()
    const cardState = createDefaultDraftingCardState()
    const layers = createDefaultDraftingLayers("preview", state, cardState).map((layer) =>
      layer.kind === "qr"
        ? { ...layer, tiltX: 18, tiltY: -12 }
        : layer,
    )

    const payload = await buildDraftingLayeredNodePayload({
      cardState,
      layers,
      name: "QR Code",
      nodeId: "preview",
      state,
    })

    expect(payload.originalSvgMarkup).toContain("skewX")
    expect(payload.originalSvgMarkup).toContain("skewY")
  })
})
