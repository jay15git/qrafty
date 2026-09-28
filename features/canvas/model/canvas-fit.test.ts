import { describe, expect, it } from "vitest";

import {
  computeCanvasFit,
  MOBILE_ARTBOARD_VIEW_INSETS,
  CANVAS_FIT_PADDING,
} from "@/features/canvas/model/canvas-fit";

describe("canvas-fit", () => {
  it("fits a landscape card into a portrait viewport by width", () => {
    const scale = computeCanvasFit({ width: 1920, height: 1080 }, { width: 800, height: 600 });

    expect(scale).toBeCloseTo((800 - CANVAS_FIT_PADDING * 2) / 1920, 5);
  });

  it("fits a portrait card into a landscape viewport by height", () => {
    const scale = computeCanvasFit({ width: 1080, height: 1920 }, { width: 900, height: 700 });

    expect(scale).toBeCloseTo((700 - CANVAS_FIT_PADDING * 2) / 1920, 5);
  });

  it("never upscales past 100% without allowUpscale", () => {
    const scale = computeCanvasFit({ width: 320, height: 320 }, { width: 1200, height: 900 });

    expect(scale).toBe(1);
  });

  it("upscales to fill the viewport when allowUpscale is enabled", () => {
    const scale = computeCanvasFit(
      { width: 320, height: 320 },
      { width: 1200, height: 900 },
      { allowUpscale: true, padding: CANVAS_FIT_PADDING },
    );

    expect(scale).toBeCloseTo((900 - CANVAS_FIT_PADDING * 2) / 320, 5);
  });

  it("handles tiny viewports with a sensible minimum scale", () => {
    const scale = computeCanvasFit({ width: 1080, height: 1080 }, { width: 120, height: 120 });

    expect(scale).toBeGreaterThan(0);
    expect(scale).toBeLessThan(1);
  });

  it("uses tighter mobile insets for more artboard area", () => {
    const viewport = { width: 390, height: 420 };
    const card = { width: 1080, height: 1080 };

    const mobileScale = computeCanvasFit(card, viewport, {
      allowUpscale: true,
      insets: MOBILE_ARTBOARD_VIEW_INSETS,
    });
    const desktopScale = computeCanvasFit(card, viewport, {
      allowUpscale: true,
      insets: { top: 56, right: 72, bottom: 56, left: 40 },
    });

    expect(mobileScale).toBeGreaterThan(desktopScale);
  });

  it("respects asymmetric viewport insets", () => {
    const scale = computeCanvasFit(
      { width: 800, height: 800 },
      { width: 1000, height: 900 },
      {
        allowUpscale: true,
        insets: { top: 56, right: 72, bottom: 56, left: 40 },
      },
    );

    expect(scale).toBeCloseTo(Math.min((1000 - 40 - 72) / 800, (900 - 56 - 56) / 800), 5);
  });
});
