import { describe, expect, it } from "vitest";

import { patchCanvasLayer } from "@/features/canvas/model/layers/patch";
import {
  createCanvasShapeLayer,
  createCanvasTextLayer,
} from "@/features/canvas/model/layers/factories";
import {
  getShapeLayerFillCssValue,
  getTextLayerFillCssValue,
  patchShapeLayerFillFromPicker,
  patchTextLayerFillFromPicker,
} from "@/features/canvas/rendering/layer-fill";

const gradientFill = {
  kind: "gradient" as const,
  gradient: {
    type: "linear" as const,
    angle: 135,
    interp: "oklch" as const,
    stops: [
      { color: { l: 0.2, c: 0.05, h: 260, alpha: 1 }, position: 0 },
      { color: { l: 0.85, c: 0.08, h: 40, alpha: 1 }, position: 1 },
    ],
  },
};

describe("shape-fill", () => {
  it("stores shape gradients as gradient paint with a solid fallback color", () => {
    const layer = createCanvasShapeLayer("preview", "flower");

    const patch = patchShapeLayerFillFromPicker(layer, gradientFill);
    const nextLayer = patchCanvasLayer(layer, patch);

    expect(nextLayer.fill?.kind).toBe("gradient");
    expect(nextLayer.fill?.gradient?.stops).toHaveLength(2);
    expect(nextLayer.fill?.solid).toMatch(/^#[0-9a-f]{6}$/i);
    expect(getShapeLayerFillCssValue(nextLayer)).toContain("gradient");
  });

  it("keeps solid fills as hex", () => {
    const layer = createCanvasShapeLayer("preview", "rect");
    const patch = patchShapeLayerFillFromPicker(layer, {
      kind: "color",
      color: { l: 0.6, c: 0.2, h: 10, alpha: 1 },
    });
    const nextLayer = patchCanvasLayer(layer, patch);

    expect(nextLayer.fill?.kind).toBe("solid");
    expect(nextLayer.fill?.solid).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe("text-fill", () => {
  it("stores text gradients as gradient paint with a solid fallback color", () => {
    const layer = createCanvasTextLayer("preview");
    const patch = patchTextLayerFillFromPicker(layer, gradientFill);
    const nextLayer = patchCanvasLayer(layer, patch);

    expect(nextLayer.fill?.kind).toBe("gradient");
    expect(nextLayer.fill?.gradient?.stops).toHaveLength(2);
    expect(nextLayer.fill?.solid).toMatch(/^#[0-9a-f]{6}$/i);
    expect(getTextLayerFillCssValue(nextLayer)).toContain("gradient");
  });

  it("keeps text solid fills as hex", () => {
    const layer = createCanvasTextLayer("preview");
    const patch = patchTextLayerFillFromPicker(layer, {
      kind: "color",
      color: { l: 0.6, c: 0.2, h: 10, alpha: 1 },
    });
    const nextLayer = patchCanvasLayer(layer, patch);

    expect(nextLayer.fill?.kind).toBe("solid");
    expect(nextLayer.fill?.solid).toMatch(/^#[0-9a-f]{6}$/i);
    expect(getTextLayerFillCssValue(nextLayer)).toContain("oklch");
  });
});
