import { describe, expect, it } from "vitest";

import { patchCanvasLayer } from "@/features/canvas/model/layers/patch";
import { createCanvasTextLayer } from "@/features/canvas/model/layers/factories";
import { paintFromCss, paintSolidColor, solidPaint } from "@/features/canvas/model/paint";
import { getTextLayerStyle } from "@/features/canvas/rendering/layer-dom-styles";
import { qraftyGradientToFillCss } from "@/features/shell/settings/settings-bridge";
import type { QraftyGradient } from "@/features/qr/model/state";

const gradient: QraftyGradient = {
  enabled: true,
  type: "linear",
  rotation: 0,
  colorStops: [
    { offset: 0, color: "#ff0000" },
    { offset: 1, color: "#0000ff" },
  ],
};

describe("getTextLayerStyle", () => {
  it("uses flat color for solid text", () => {
    const layer = createCanvasTextLayer("preview", { fill: solidPaint("#123456") });
    const style = getTextLayerStyle(layer);

    expect(style.color).toBe("#123456");
    expect(style.backgroundImage).toBeUndefined();
  });

  it("clips gradient fills to the text glyphs", () => {
    const layer = patchCanvasLayer(createCanvasTextLayer("preview"), {
      fill: paintFromCss(qraftyGradientToFillCss(gradient)),
    });
    const style = getTextLayerStyle(layer);

    expect(style.backgroundImage).toContain("gradient");
    expect(style.backgroundClip).toBe("text");
    expect(style.color).toBe("transparent");
    expect(style.caretColor).toBe(paintSolidColor(layer.fill));
  });

  it("ignores remembered gradients when the fill is solid", () => {
    const gradientFill = paintFromCss(qraftyGradientToFillCss(gradient));
    const layer = patchCanvasLayer(createCanvasTextLayer("preview"), {
      fill: solidPaint("#123456", gradientFill),
    });
    const style = getTextLayerStyle(layer);

    expect(style.color).toBe("#123456");
    expect(style.backgroundImage).toBeUndefined();
  });
});
