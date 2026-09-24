import { describe, expect, it } from "vitest";

import { createUniformPerSideBorder } from "@/features/canvas/model/effects";
import { createDefaultCanvasFilterEffect } from "@/features/canvas/model/filters";
import {
  buildCssFilterString,
  getCanvasLayerDropShadowFilter,
  getCanvasOutlineStyle,
  getCanvasPerSideBorderStyle,
  getCanvasUniformBorderStyle,
  mergeCssFilterStrings,
} from "@/features/canvas/rendering/layer-appearance";

describe("layer appearance css builders", () => {
  it("builds drop shadows", () => {
    expect(
      getCanvasLayerDropShadowFilter([
        {
          blur: 12,
          color: "#111827",
          inset: false,
          kind: "drop",
          offsetX: 2,
          offsetY: 4,
          opacity: 50,
          spread: 0,
          visible: true,
        },
      ]),
    ).toBe("drop-shadow(2px 4px 12px rgba(17, 24, 39, 0.5))");
  });

  it("builds outline css", () => {
    expect(
      getCanvasOutlineStyle({
        color: "#000000",
        offset: 4,
        opacity: 100,
        style: "solid",
        visible: true,
        width: 2,
      }),
    ).toEqual({
      outline: "2px solid rgba(0, 0, 0, 1)",
      outlineOffset: "4px",
    });
  });

  it("builds per-side border css", () => {
    const sides = createUniformPerSideBorder({
      color: "#111827",
      opacity: 100,
      style: "solid",
      width: 0,
    });
    sides.bottom = { color: "#111827", opacity: 100, style: "solid", width: 2 };

    expect(getCanvasPerSideBorderStyle(sides)).toEqual({
      borderTopWidth: "0",
      borderRightWidth: "0",
      borderLeftWidth: "0",
      borderBottomWidth: "2px",
      borderBottomStyle: "solid",
      borderBottomColor: "rgba(17, 24, 39, 1)",
    });
  });

  it("builds uniform border shorthand", () => {
    expect(
      getCanvasUniformBorderStyle({
        color: "#111827",
        opacity: 100,
        style: "solid",
        width: 1,
      }),
    ).toBe("1px solid rgba(17, 24, 39, 1)");
  });

  it("chains css filters and drop shadows", () => {
    const filter = buildCssFilterString([
      createDefaultCanvasFilterEffect("blur", { amount: 4 }),
      createDefaultCanvasFilterEffect("brightness", { amount: 120 }),
    ]);

    expect(filter).toBe("blur(4px) brightness(1.2)");
    expect(mergeCssFilterStrings(filter, "drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.4))")).toBe(
      "blur(4px) brightness(1.2) drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.4))",
    );
  });
});
