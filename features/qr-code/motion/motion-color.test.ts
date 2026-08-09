import { describe, expect, it } from "vitest";

import { DEFAULT_DOT_MATRIX_ANIMATION } from "@/features/qr-code/model/state";

import {
  MOTION_OPACITY_ANCHORS,
  motionColorRgbHex,
  resolveMotionColors,
  resolveMotionOpacityAnchors,
} from "./motion-color";

describe("motion-color", () => {
  it("uses preset base/accent pairs for named loader colors", () => {
    const colors = resolveMotionColors({
      ...DEFAULT_DOT_MATRIX_ANIMATION,
      colorPreset: "neon",
    });

    expect(colors).toEqual({
      base: "#22d3ee",
      accent: "#f8fafc",
    });
  });

  it("uses preset opacity anchors for named presets", () => {
    const anchors = resolveMotionOpacityAnchors({
      ...DEFAULT_DOT_MATRIX_ANIMATION,
      colorPreset: "mint",
      opacityBase: 0.9,
      opacityMid: 0.5,
      opacityPeak: 0.2,
    });

    expect(anchors).toEqual(MOTION_OPACITY_ANCHORS);
  });

  it("uses full opacity for solid theme colors without alpha", () => {
    const anchors = resolveMotionOpacityAnchors({
      ...DEFAULT_DOT_MATRIX_ANIMATION,
      colorPreset: "theme",
      customColorBase: "#22d3ee",
      customColorPeak: "#f8fafc",
    });

    expect(anchors).toEqual({
      base: 1,
      mid: 1,
      peak: 1,
    });
  });

  it("derives theme opacity from color picker alpha", () => {
    const anchors = resolveMotionOpacityAnchors({
      ...DEFAULT_DOT_MATRIX_ANIMATION,
      colorPreset: "theme",
      customColorBase: "rgba(17, 24, 39, 0.55)",
      customColorPeak: "#a855f780",
    });

    expect(anchors.base).toBeCloseTo(0.55, 5);
    expect(anchors.mid).toBeCloseTo(0.55, 5);
    expect(anchors.peak).toBeCloseTo(0.5, 2);
    expect(motionColorRgbHex("#a855f780")).toBe("#a855f7");
  });
});
