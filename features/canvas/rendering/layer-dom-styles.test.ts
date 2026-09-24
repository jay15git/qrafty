import { describe, expect, it } from "vitest";

import { patchCanvasLayer } from "@/features/canvas/model/layers/patch";
import { createCanvasTextLayer } from "@/features/canvas/model/layers/factories";
import { getTextLayerStyle } from "@/features/canvas/rendering/layer-dom-styles";
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
    const layer = createCanvasTextLayer("preview", { fill: "#123456" });
    const style = getTextLayerStyle(layer);

    expect(style.color).toBe("#123456");
    expect(style.backgroundImage).toBeUndefined();
  });

  it("clips gradient fills to the text glyphs", () => {
    const layer = patchCanvasLayer(createCanvasTextLayer("preview"), {
      fillGradient: gradient,
      fillMode: "gradient",
    });
    const style = getTextLayerStyle(layer);

    expect(style.backgroundImage).toContain("gradient");
    expect(style.backgroundClip).toBe("text");
    expect(style.color).toBe("transparent");
    expect(style.caretColor).toBe(layer.fill);
  });

  it("ignores disabled gradients", () => {
    const layer = patchCanvasLayer(createCanvasTextLayer("preview"), {
      fillGradient: { ...gradient, enabled: false },
      fillMode: "gradient",
    });
    const style = getTextLayerStyle(layer);

    expect(style.color).toBe(layer.fill);
    expect(style.backgroundImage).toBeUndefined();
  });
});
