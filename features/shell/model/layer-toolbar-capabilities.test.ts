import { describe, expect, it } from "vitest";

import { getLayerToolbarCapabilities } from "@/features/shell/model/layer-toolbar-capabilities";
import { createCanvasTextLayer } from "@/features/canvas/model/layers/factories";

describe("layer-toolbar-capabilities", () => {
  it("allows two effects for element layers", () => {
    const layer = createCanvasTextLayer("node", { text: "Hello" });

    expect(getLayerToolbarCapabilities(layer)).toEqual({ maxEffects: 2 });
  });

  it("limits card layers to one effect", () => {
    const layer = createCanvasTextLayer("node", { text: "Card" });

    expect(getLayerToolbarCapabilities({ ...layer, kind: "card" }).maxEffects).toBe(1);
  });

  it("disables effects for group layers", () => {
    const layer = createCanvasTextLayer("node", { text: "Hello" });

    expect(getLayerToolbarCapabilities({ ...layer, kind: "group" }).maxEffects).toBe(0);
  });
});
