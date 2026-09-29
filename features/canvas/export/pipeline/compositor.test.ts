import { describe, expect, it } from "vitest";

import { gradientPaint } from "@/features/canvas/model/paint";
import { createDefaultQraftyState } from "@/features/qr/model/state";
import { createDefaultCanvasCardState } from "@/features/canvas/model/card-state";
import { createDefaultCanvasLayers } from "@/features/canvas/model/layers/card-qr";

import {
  cardLayerNeedsCanvasFace,
  computeObjectFitRect,
} from "@/features/canvas/export/pipeline/compositor-face";

describe("export compositor faces", () => {
  it("paints shader and image card faces on canvas, not via nested svg images", () => {
    const state = createDefaultQraftyState();
    const shaderCard = createDefaultCanvasCardState();
    const layers = createDefaultCanvasLayers("node", state, shaderCard);
    const cardLayer = layers.find((layer) => layer.kind === "card");
    const qrLayer = layers.find((layer) => layer.kind === "qr");

    if (!cardLayer || !qrLayer) {
      throw new Error("Expected default card and qr layers.");
    }

    expect(cardLayerNeedsCanvasFace(cardLayer, shaderCard)).toBe(true);
    expect(cardLayerNeedsCanvasFace(qrLayer, shaderCard)).toBe(false);

    const imageCard = {
      ...shaderCard,
      styleMode: "image" as const,
      cardImage: {
        ...shaderCard.cardImage,
        source: "url" as const,
        value: "https://example.com/card-bg.png",
      },
    };

    expect(cardLayerNeedsCanvasFace(cardLayer, imageCard)).toBe(true);

    const solidCard = {
      ...shaderCard,
      styleMode: "solid" as const,
    };

    expect(cardLayerNeedsCanvasFace(cardLayer, solidCard)).toBe(false);

    const conicCard = {
      ...solidCard,
      fill: gradientPaint({
        type: "conic",
        startAngle: 0,
        center: { x: 0.5, y: 0.5 },
        interp: "oklch",
        stops: [
          { position: 0, color: { l: 1, c: 0, h: 0, alpha: 1 } },
          { position: 1, color: { l: 0, c: 0, h: 0, alpha: 1 } },
        ],
      }),
    };

    expect(cardLayerNeedsCanvasFace(cardLayer, conicCard)).toBe(true);
  });

  it("covers and contains images inside the card box", () => {
    expect(computeObjectFitRect(200, 100, 100, 100, "cover")).toEqual({
      height: 100,
      width: 200,
      x: -50,
      y: 0,
    });
    expect(computeObjectFitRect(200, 100, 100, 100, "contain")).toEqual({
      height: 50,
      width: 100,
      x: 0,
      y: 25,
    });
  });
});
