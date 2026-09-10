import { describe, expect, it } from "vitest";

import {
  AnimationPreset,
  dotMatrixAnimationPresets,
  getAnimationPreset,
  QRCodeEntity,
  remapOpacityToTriplet,
  resolveDotMatrixKeyframeOpacity,
  sampleDotMatrixAnimationFrame,
  SOURCE_BASE_OPACITY,
  SOURCE_MID_OPACITY,
  SOURCE_PEAK_OPACITY,
  type QRCodeAnimationSettings,
} from "@qrafty/qr/dot-matrix";

const defaultOpacitySettings: QRCodeAnimationSettings = {
  dotMatrixOpacityBase: 1,
  dotMatrixOpacityMid: 0.65,
  dotMatrixOpacityPeak: 1,
};

function resolvedAnimationFrameOpacity(frame: unknown) {
  if (typeof frame === "object" && frame !== null && "value" in frame) {
    return (frame as { value: number }).value;
  }
  if (typeof frame === "number") {
    return frame;
  }
  return resolveDotMatrixKeyframeOpacity(
    frame as Parameters<typeof resolveDotMatrixKeyframeOpacity>[0],
    defaultOpacitySettings,
  );
}

describe("matrix animation parity", () => {
  describe("remapOpacityToTriplet", () => {
    it("maps upstream source anchors to user triplet defaults", () => {
      const { dotMatrixOpacityBase: base, dotMatrixOpacityMid: mid, dotMatrixOpacityPeak: peak } =
        defaultOpacitySettings;

      expect(remapOpacityToTriplet(SOURCE_BASE_OPACITY, base, mid, peak)).toBeCloseTo(1, 5);
      expect(remapOpacityToTriplet(SOURCE_MID_OPACITY, base, mid, peak)).toBeCloseTo(0.65, 5);
      expect(remapOpacityToTriplet(SOURCE_PEAK_OPACITY, base, mid, peak)).toBeCloseTo(1, 5);
    });

    it("lerps tail opacities between mid and peak like upstream", () => {
      const { dotMatrixOpacityBase: base, dotMatrixOpacityMid: mid, dotMatrixOpacityPeak: peak } =
        defaultOpacitySettings;
      const remapped = remapOpacityToTriplet(0.82, base, mid, peak);
      const progress = (0.82 - SOURCE_MID_OPACITY) / (SOURCE_PEAK_OPACITY - SOURCE_MID_OPACITY);

      expect(remapped).toBeCloseTo(mid + (peak - mid) * progress, 5);
    });
  });

  describe("RadialExpand", () => {
    it("staggers by euclidean radius from center", () => {
      const preset = getAnimationPreset(AnimationPreset.RadialExpand);
      const center = preset({}, 10, 10, 21, QRCodeEntity.Module, defaultOpacitySettings);
      const corner = preset({}, 0, 0, 21, QRCodeEntity.Module, defaultOpacitySettings);

      expect(corner.from).toBeGreaterThan(center.from ?? 0);
    });

    it("rests at user opacity base with dual base/accent colors", () => {
      const preset = getAnimationPreset(AnimationPreset.RadialExpand);
      const animation = preset(
        {},
        10,
        10,
        21,
        QRCodeEntity.Module,
        {
          ...defaultOpacitySettings,
          dotMatrixColorBase: "#111827",
          dotMatrixColorMid: "#22d3ee",
          dotMatrixColorPeak: "#22d3ee",
        },
      );
      const from = typeof animation.from === "number" ? animation.from : 0;
      const atRest = sampleDotMatrixAnimationFrame(animation, from);

      expect(atRest.opacity).toBeCloseTo(1, 5);
      expect(atRest.fill).toBe("#111827");
    });

    it("uses accent color at peak", () => {
      const preset = getAnimationPreset(AnimationPreset.RadialExpand);
      const settings = {
        ...defaultOpacitySettings,
        dotMatrixColorBase: "#111827",
        dotMatrixColorMid: "#22d3ee",
        dotMatrixColorPeak: "#22d3ee",
      };
      const animation = preset({}, 10, 10, 21, QRCodeEntity.Module, settings);
      const from = typeof animation.from === "number" ? animation.from : 0;
      const duration =
        typeof animation.duration === "number" ? animation.duration : 1500;
      const atRest = sampleDotMatrixAnimationFrame(animation, from);
      const atPeak = sampleDotMatrixAnimationFrame(animation, from + duration * 0.32);

      expect(atRest.fill).toBe("#111827");
      expect(atPeak.fill).not.toBe("#111827");
      expect(atPeak.fill).toMatch(/^#/);
    });
  });

  describe("DiamondExpand", () => {
    it("staggers outward across the diamond contour like heart and star", () => {
      const preset = getAnimationPreset(AnimationPreset.DiamondExpand);
      const center = preset({}, 10, 10, 21, QRCodeEntity.Module, defaultOpacitySettings);
      const tip = preset({}, 0, 10, 21, QRCodeEntity.Module, defaultOpacitySettings);

      expect(center.from).toBe(0);
      expect(tip.from).toBeGreaterThan(center.from ?? 0);
    });
  });

  describe("dot matrix loop seams", () => {
    it.each(dotMatrixAnimationPresets)("loops %s without a sampled seam", (preset) => {
      const animation = getAnimationPreset(preset)(
        {},
        10,
        10,
        21,
        QRCodeEntity.Module,
        defaultOpacitySettings,
      );
      const from = typeof animation.from === "number" ? animation.from : 0;
      const duration =
        typeof animation.duration === "number" ? animation.duration : 1500;
      const atStart = sampleDotMatrixAnimationFrame(animation, from);
      const atWrap = sampleDotMatrixAnimationFrame(animation, from + duration);

      expect(atWrap.opacity).toBeCloseTo(atStart.opacity, 2);
    });

  });
});
