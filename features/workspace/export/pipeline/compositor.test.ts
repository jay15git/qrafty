import { describe, expect, it } from "vitest"

import { formatFill } from "@/components/ui/fill-picker-base/public-api"
import { createDefaultQrStudioState } from "@/features/qr-code/model/state"
import { createDefaultDraftingCardState } from "@/features/workspace/model/card-state"
import {
  createDefaultDraftingLayers,
  createDraftingShaderLayer,
} from "@/features/workspace/model/layers"
import {
  cardLayerNeedsCanvasFace,
  computeObjectFitRect,
} from "@/features/workspace/export/pipeline/compositor-face"

describe("export compositor faces", () => {
  it("paints shader and image card faces on canvas, not via nested svg images", () => {
    const state = createDefaultQrStudioState()
    const shaderCard = createDefaultDraftingCardState()
    const layers = createDefaultDraftingLayers("node", state, shaderCard)
    const cardLayer = layers.find((layer) => layer.kind === "card")
    const qrLayer = layers.find((layer) => layer.kind === "qr")

    if (!cardLayer || !qrLayer) {
      throw new Error("Expected default card and qr layers.")
    }

    expect(cardLayerNeedsCanvasFace(cardLayer, shaderCard)).toBe(true)
    expect(cardLayerNeedsCanvasFace(qrLayer, shaderCard)).toBe(false)

    const imageCard = {
      ...shaderCard,
      styleMode: "image" as const,
      cardImage: {
        ...shaderCard.cardImage,
        source: "url" as const,
        value: "https://example.com/card-bg.png",
      },
    }

    expect(cardLayerNeedsCanvasFace(cardLayer, imageCard)).toBe(true)

    const solidCard = {
      ...shaderCard,
      styleMode: "solid" as const,
    }

    expect(cardLayerNeedsCanvasFace(cardLayer, solidCard)).toBe(false)

    const conicCard = {
      ...solidCard,
      fill: formatFill({
        kind: "gradient",
        gradient: {
          type: "conic",
          startAngle: 0,
          center: { x: 0.5, y: 0.5 },
          interp: "oklch",
          stops: [
            { position: 0, color: { l: 1, c: 0, h: 0, alpha: 1 } },
            { position: 1, color: { l: 0, c: 0, h: 0, alpha: 1 } },
          ],
        },
      }),
    }

    expect(cardLayerNeedsCanvasFace(cardLayer, conicCard)).toBe(true)

    const overlayShader = createDraftingShaderLayer("node", "mesh-gradient", {
      height: 120,
      id: "node:shader-overlay",
      width: 120,
      x: 40,
      y: 40,
    })

    expect(cardLayerNeedsCanvasFace(overlayShader, solidCard)).toBe(true)
  })

  it("covers and contains images inside the card box", () => {
    expect(computeObjectFitRect(200, 100, 100, 100, "cover")).toEqual({
      height: 100,
      width: 200,
      x: -50,
      y: 0,
    })
    expect(computeObjectFitRect(200, 100, 100, 100, "contain")).toEqual({
      height: 50,
      width: 100,
      x: 0,
      y: 25,
    })
  })
})
