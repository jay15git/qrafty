import { describe, expect, it } from "vitest"

import {
  getKonvaLayerPlacement,
  placementToLayerPatch,
} from "@/features/workspace/konva/konva-layer-placement"

describe("konva-layer-placement", () => {
  it("maps card inset layout to Konva center coordinates", () => {
    const artboardWidth = 1050
    const artboardHeight = 600
    const cardLayer = {
      height: 600,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      width: 1050,
      x: -525,
      y: -300,
    }

    expect(getKonvaLayerPlacement(cardLayer, artboardWidth, artboardHeight)).toMatchObject({
      x: 525,
      y: 300,
      offsetX: 525,
      offsetY: 300,
    })
  })

  it("centers QR layers horizontally on the artboard", () => {
    const artboardWidth = 1050
    const artboardHeight = 600
    const qrLayer = {
      height: 240,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      width: 240,
      x: -120,
      y: -72,
    }

    expect(getKonvaLayerPlacement(qrLayer, artboardWidth, artboardHeight)).toMatchObject({
      x: 525,
      y: 348,
      offsetX: 120,
      offsetY: 120,
    })
  })

  it("round-trips placement back to layer coordinates", () => {
    const artboardWidth = 1050
    const artboardHeight = 600
    const layer = {
      height: 240,
      rotation: 12,
      scaleX: 1,
      scaleY: 1,
      width: 240,
      x: -120,
      y: -72,
    }

    const placement = getKonvaLayerPlacement(layer, artboardWidth, artboardHeight)
    const patch = placementToLayerPatch(placement, artboardWidth, artboardHeight)

    expect(patch).toMatchObject({
      height: 240,
      rotation: 12,
      scaleX: 1,
      scaleY: 1,
      width: 240,
      x: -120,
      y: -72,
    })
  })
})
