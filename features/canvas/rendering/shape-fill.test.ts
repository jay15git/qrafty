import { describe, expect, it } from "vitest";

import { formatFill } from "@/components/ui/fill-picker/public-api";
import { fillFromHex } from "@/features/shell/inspector/FillPicker.utils";
import { patchDraftingCanvasLayer } from "@/features/canvas/model/layers/patch";
import {
  createDraftingShapeLayer,
  createDraftingTextLayer,
} from "@/features/canvas/model/layers/factories";
import {
  getShapeLayerFillCssValue,
  getTextLayerFillCssValue,
  patchShapeLayerFillFromPicker,
  patchTextLayerFillFromPicker,
} from "@/features/canvas/rendering/layer-fill";

describe("shape-fill", () => {
  it("stores shape gradients on fillGradient instead of fill css", () => {
    const layer = createDraftingShapeLayer("preview", "flower");
    const gradientCss = formatFill({
      kind: "gradient",
      gradient: {
        type: "linear",
        angle: 135,
        interp: "oklch",
        stops: [
          {
            color: { l: 0.2, c: 0.05, h: 260, alpha: 1 },
            position: 0,
          },
          {
            color: { l: 0.85, c: 0.08, h: 40, alpha: 1 },
            position: 1,
          },
        ],
      },
    });

    const patch = patchShapeLayerFillFromPicker(
      layer,
      {
        kind: "gradient",
        gradient: {
          type: "linear",
          angle: 135,
          interp: "oklch",
          stops: [
            { color: { l: 0.2, c: 0.05, h: 260, alpha: 1 }, position: 0 },
            { color: { l: 0.85, c: 0.08, h: 40, alpha: 1 }, position: 1 },
          ],
        },
      },
      gradientCss,
    );
    const nextLayer = patchDraftingCanvasLayer(layer, patch);

    expect(nextLayer.fillMode).toBe("gradient");
    expect(nextLayer.fillGradient?.enabled).toBe(true);
    expect(nextLayer.fill).toMatch(/^#[0-9a-f]{6}$/i);
    expect(getShapeLayerFillCssValue(nextLayer)).toContain("gradient");
  });

  it("keeps solid fills as hex", () => {
    const layer = createDraftingShapeLayer("preview", "rect");
    const solidCss = formatFill(fillFromHex("#ff3366"));
    const patch = patchShapeLayerFillFromPicker(
      layer,
      { kind: "color", color: { l: 0.6, c: 0.2, h: 10, alpha: 1 } },
      solidCss,
    );
    const nextLayer = patchDraftingCanvasLayer(layer, patch);

    expect(nextLayer.fillMode).toBe("solid");
    expect(nextLayer.fill).toBe("#FF3366");
  });
});

describe("text-fill", () => {
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

  it("stores text gradients on fillGradient instead of fill css", () => {
    const layer = createDraftingTextLayer("preview");
    const gradientCss = formatFill(gradientFill);
    const patch = patchTextLayerFillFromPicker(layer, gradientFill, gradientCss);
    const nextLayer = patchDraftingCanvasLayer(layer, patch);

    expect(nextLayer.fillMode).toBe("gradient");
    expect(nextLayer.fillGradient?.enabled).toBe(true);
    expect(nextLayer.fill).toMatch(/^#[0-9a-f]{6}$/i);
    expect(getTextLayerFillCssValue(nextLayer)).toContain("gradient");
  });

  it("keeps text solid fills as hex", () => {
    const layer = createDraftingTextLayer("preview");
    const solidCss = formatFill(fillFromHex("#ff3366"));
    const patch = patchTextLayerFillFromPicker(
      layer,
      { kind: "color", color: { l: 0.6, c: 0.2, h: 10, alpha: 1 } },
      solidCss,
    );
    const nextLayer = patchDraftingCanvasLayer(layer, patch);

    expect(nextLayer.fillMode).toBe("solid");
    expect(nextLayer.fill).toBe("#FF3366");
    expect(getTextLayerFillCssValue(nextLayer)).toContain("oklch");
  });
});
