// @vitest-environment jsdom

import { describe, expect, it } from "vitest"

import { createDefaultQraftyState, setSquareQrSize } from "@/features/qr-code/model/state"
import { buildDraftingQrBackgroundSvgPayload } from "@/features/workspace/components/QrBackground"
import { createDefaultDraftingLayers } from "@/features/workspace/model/layers"
import { createDefaultDraftingCardState } from "@/features/workspace/model/card-state"

describe("background shape svg payload", () => {
  it("renders decorative shapes as inline svg markup", () => {
    const state = setSquareQrSize(createDefaultQraftyState(), 240)
    state.backgroundShapeId = "flower"
    const [layer] = createDefaultDraftingLayers(
      "preview",
      state,
      createDefaultDraftingCardState(),
    ).filter((entry) => entry.kind === "qr")

    const payload = buildDraftingQrBackgroundSvgPayload(layer, state)

    expect(payload?.shapeId).toBe("flower")
    expect(payload?.markup).toContain("<svg")
    expect(payload?.markup).toContain("<path")
    expect(payload?.width).toBeGreaterThan(0)
    expect(payload?.height).toBeGreaterThan(0)
  })

  it("keeps gradient and stroke attributes in inline svg markup", () => {
    const state = setSquareQrSize(createDefaultQraftyState(), 240)
    state.backgroundShapeId = "circle"
    state.backgroundShapeOptions = {
      ...state.backgroundShapeOptions,
      strokeWidth: 6,
      strokeColor: "#ff00aa",
    }
    state.backgroundGradient = {
      ...state.backgroundGradient,
      enabled: true,
    }
    const [layer] = createDefaultDraftingLayers(
      "preview",
      state,
      createDefaultDraftingCardState(),
    ).filter((entry) => entry.kind === "qr")

    const payload = buildDraftingQrBackgroundSvgPayload(layer, state)
    const markup = payload?.markup ?? ""

    expect(markup).toContain("linearGradient")
    expect(markup).toContain('stroke-width="6"')
    expect(markup).toContain('stroke="#ff00aa"')
  })

  it("keeps decorative shape layout proportional when the qr layer is resized", () => {
    const state = setSquareQrSize(createDefaultQraftyState(), 240)
    state.backgroundShapeId = "flower"
    state.backgroundShapeOptions = {
      ...state.backgroundShapeOptions,
      paddingPx: 24,
    }
    const [layer] = createDefaultDraftingLayers(
      "preview",
      state,
      createDefaultDraftingCardState(),
    ).filter((entry) => entry.kind === "qr")

    const fullSize = buildDraftingQrBackgroundSvgPayload(layer, state)
    const resizeScale = 0.6
    const resizedLayer = {
      ...layer,
      width: Math.round(layer.width * resizeScale),
      height: Math.round(layer.height * resizeScale),
    }
    const resized = buildDraftingQrBackgroundSvgPayload(resizedLayer, state)

    expect(resized?.width).toBeCloseTo((fullSize?.width ?? 0) * resizeScale, 0)
    expect(resized?.height).toBeCloseTo((fullSize?.height ?? 0) * resizeScale, 0)
    expect(resized?.markup).toContain("<path")
    expect(resized?.width).toBeLessThan(fullSize?.width ?? 0)
  })

  it("fits background outer metrics to the layer box at small resize sizes", () => {
    const state = setSquareQrSize(createDefaultQraftyState(), 240)
    state.backgroundShapeId = "flower"
    state.backgroundShapeOptions = {
      ...state.backgroundShapeOptions,
      edgeBlur: 10,
      paddingPx: 20,
      shadowOffsetX: -14,
      shadowOffsetY: 18,
      strokeWidth: 8,
    }
    const [layer] = createDefaultDraftingLayers(
      "preview",
      state,
      createDefaultDraftingCardState(),
    ).filter((entry) => entry.kind === "qr")

    for (const size of [100, 50, 30, 24]) {
      const resizedLayer = { ...layer, width: size, height: size }
      const payload = buildDraftingQrBackgroundSvgPayload(resizedLayer, state)

      expect(payload?.width).toBe(size)
      expect(payload?.height).toBe(size)
    }
  })

  it("skips background markup when shape is none and surface options are inactive", () => {
    const state = setSquareQrSize(createDefaultQraftyState(), 240)
    state.backgroundOptions.round = 0.2
    const [layer] = createDefaultDraftingLayers(
      "preview",
      state,
      createDefaultDraftingCardState(),
    ).filter((entry) => entry.kind === "qr")

    const payload = buildDraftingQrBackgroundSvgPayload(layer, state)

    expect(payload).toBeNull()
  })

  it("uses rounded rect markup when shape is none but surface options are active", () => {
    const state = setSquareQrSize(createDefaultQraftyState(), 240)
    state.backgroundOptions.round = 0.2
    state.backgroundShapeOptions = {
      ...state.backgroundShapeOptions,
      paddingPx: 24,
    }
    const [layer] = createDefaultDraftingLayers(
      "preview",
      state,
      createDefaultDraftingCardState(),
    ).filter((entry) => entry.kind === "qr")

    const payload = buildDraftingQrBackgroundSvgPayload(layer, state)

    expect(payload?.shapeId).toBe("rect")
    expect(payload?.markup).toContain("<rect")
    expect(payload?.markup).toMatch(/rx="[^"]+"/)
  })
})
