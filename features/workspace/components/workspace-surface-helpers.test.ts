import { describe, expect, it } from "vitest"

import { createDefaultQraftyState } from "@/features/qr-code/model/state"
import { createDefaultDraftingCardState } from "@/features/workspace/model/card-state"
import { createDefaultDraftingLayers } from "@/features/workspace/model/layers"
import {
  ensureMandatoryDesktopLayerRows,
  patchDraftingLayerById,
  toDesktopLayerRow,
} from "@/features/workspace/components/workspace-surface-helpers"

describe("ensureMandatoryDesktopLayerRows", () => {
  it("re-appends the card layer when layer patches omit it", () => {
    const qrState = createDefaultQraftyState()
    const cardState = createDefaultDraftingCardState()
    const layers = createDefaultDraftingLayers("preview", qrState, cardState)
    const cardLayer = layers.find((layer) => layer.kind === "card")
    const qrLayer = layers.find((layer) => layer.kind === "qr")

    expect(cardLayer).toBeDefined()
    expect(qrLayer).toBeDefined()

    const restored = ensureMandatoryDesktopLayerRows(
      [toDesktopLayerRow(qrLayer!)],
      layers,
    )

    expect(restored).toHaveLength(2)
    expect(restored.map((row) => row.id)).toEqual([qrLayer!.id, cardLayer!.id])
  })
})

describe("patchDraftingLayerById", () => {
  it("keeps untouched sibling layer object identity", () => {
    const qrState = createDefaultQraftyState()
    const cardState = createDefaultDraftingCardState()
    const layers = createDefaultDraftingLayers("preview", qrState, cardState)
    const cardLayer = layers.find((layer) => layer.kind === "card")
    const qrLayer = layers.find((layer) => layer.kind === "qr")

    expect(cardLayer).toBeDefined()
    expect(qrLayer).toBeDefined()

    const nextLayers = layers.map((layer) =>
      patchDraftingLayerById(layer, qrLayer!.id, { x: qrLayer!.x + 12, y: qrLayer!.y + 8 }),
    )
    const nextCardLayer = nextLayers.find((layer) => layer.kind === "card")
    const nextQrLayer = nextLayers.find((layer) => layer.kind === "qr")

    expect(nextCardLayer).toBe(cardLayer)
    expect(nextQrLayer).not.toBe(qrLayer)
    expect(nextQrLayer).toMatchObject({
      id: qrLayer!.id,
      x: qrLayer!.x + 12,
      y: qrLayer!.y + 8,
    })
  })
})
