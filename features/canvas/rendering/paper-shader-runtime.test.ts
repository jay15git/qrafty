import { describe, expect, it } from "vitest";

import { createDefaultCanvasCardPaperShader } from "@/features/canvas/model/card-state";
import {
  hasValidPaperShaderLayout,
  readPaperShaderFallbackColor,
} from "@/features/canvas/rendering/paper-shader-runtime";

describe("paper shader runtime helpers", () => {
  it("rejects zero-sized shader layouts", () => {
    expect(hasValidPaperShaderLayout(0, 320)).toBe(false);
    expect(hasValidPaperShaderLayout(320, 0)).toBe(false);
    expect(hasValidPaperShaderLayout(320, 608)).toBe(true);
  });

  it("reads a fallback color from shader params", () => {
    const shader = createDefaultCanvasCardPaperShader("mesh-gradient");

    expect(readPaperShaderFallbackColor(shader)).toMatch(/^#/);
  });
});
