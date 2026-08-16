import { describe, expect, it } from "vitest";

import { DEFAULT_DOT_MATRIX_ANIMATION } from "@/features/qr-code/model/state";

import {
  MOTION_OPACITY_ANCHORS,
  motionColorRgbHex,
  resolveMotionColors,
  resolveMotionOpacityAnchors,
} from "./motion-color";

const QR_MODULE_COLOR = "#111827";

describe("motion-color", () => {
  it("uses qr module color as base and preset accent as peak", () => {
    const colors = resolveMotionColors(
      {
        ...DEFAULT_DOT_MATRIX_ANIMATION,
        colorPreset: "neon",
      },
      QR_MODULE_COLOR,
    );

    expect(colors).toEqual({
      base: "#111827",
      accent: "#f8fafc",
    });
  });

  it("uses preset opacity anchors for named presets with qr base opacity", () => {
    const anchors = resolveMotionOpacityAnchors(
      {
        ...DEFAULT_DOT_MATRIX_ANIMATION,
        colorPreset: "mint",
        opacityBase: 0.9,
        opacityMid: 0.5,
        opacityPeak: 0.2,
      },
      QR_MODULE_COLOR,
    );

    expect(anchors).toEqual({
      base: 1,
      mid: 1,
      peak: MOTION_OPACITY_ANCHORS.peak,
    });
  });

  it("uses full opacity for solid theme colors without alpha", () => {
    const anchors = resolveMotionOpacityAnchors(
      {
        ...DEFAULT_DOT_MATRIX_ANIMATION,
        colorPreset: "theme",
        customColorPeak: "#f8fafc",
      },
      "#22d3ee",
    );

    expect(anchors).toEqual({
      base: 1,
      mid: 1,
      peak: 1,
    });
  });

  it("derives theme opacity from qr base and peak color picker alpha", () => {
    const anchors = resolveMotionOpacityAnchors(
      {
        ...DEFAULT_DOT_MATRIX_ANIMATION,
        colorPreset: "theme",
        customColorPeak: "#a855f780",
      },
      "rgba(17, 24, 39, 0.55)",
    );

    expect(anchors.base).toBeCloseTo(0.55, 5);
    expect(anchors.mid).toBeCloseTo(0.55, 5);
    expect(anchors.peak).toBeCloseTo(0.5, 2);
    expect(motionColorRgbHex("#a855f780")).toBe("#a855f7");
  });
});
