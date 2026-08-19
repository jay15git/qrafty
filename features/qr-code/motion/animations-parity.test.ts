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
} from "@new-qr/qr/dot-matrix";

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

  describe("OriginWave", () => {
    it("matches upstream css-blend keyframes at idle and peak", () => {
      const idle = resolveDotMatrixKeyframeOpacity(
        { cssBlend: { base: 1, mid: 0, peak: 0 }, offset: 0 },
        defaultOpacitySettings,
      );
      const peak = resolveDotMatrixKeyframeOpacity(
        { cssBlend: { base: 0, mid: 0, peak: 1 }, offset: 0.34 },
        defaultOpacitySettings,
      );
      const mid = resolveDotMatrixKeyframeOpacity(
        { cssBlend: { base: 0.5, mid: 0.5, peak: 0 }, offset: 0.6 },
        defaultOpacitySettings,
      );

      expect(idle).toBeCloseTo(1, 5);
      expect(peak).toBeCloseTo(1, 5);
      expect(mid).toBeCloseTo(0.825, 5);
    });

    it("staggers rings with interpolated origin distance", () => {
      const preset = getAnimationPreset(AnimationPreset.OriginWave);
      const origin = preset({}, 20, 20, 21, QRCodeEntity.Module, defaultOpacitySettings);
      const outer = preset({}, 0, 0, 21, QRCodeEntity.Module, defaultOpacitySettings);

      expect(origin.from).toBeGreaterThan(outer.from ?? 0);
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
      const frames = animation.web?.opacity;
      const fillFrames = animation.web?.fill;

      expect(Array.isArray(frames)).toBe(true);
      expect(Array.isArray(fillFrames)).toBe(true);
      if (!Array.isArray(frames) || !Array.isArray(fillFrames)) {
        return;
      }

      const peakFillFrame = fillFrames.find(
        (frame) =>
          typeof frame === "object" &&
          frame !== null &&
          "value" in frame &&
          (frame as { value: string }).value === "#22d3ee",
      );

      expect(peakFillFrame).toEqual(
        expect.objectContaining({ value: "#22d3ee" }),
      );
    });
  });

  describe("VortexRotate", () => {
    it("pulses dot scale with opacity during the sweep", () => {
      const preset = getAnimationPreset(AnimationPreset.VortexRotate);
      const animation = preset({}, 10, 10, 21, QRCodeEntity.Module, defaultOpacitySettings);
      const from = typeof animation.from === "number" ? animation.from : 0;
      const atRest = sampleDotMatrixAnimationFrame(animation, from);
      const atPeak = sampleDotMatrixAnimationFrame(animation, from + 240);

      expect(atRest.scale).toBeDefined();
      expect(atPeak.scale).toBeDefined();
      expect(atPeak.scale!).toBeGreaterThan(atRest.scale!);
    });

    it("gives center dots a larger pulse than outer dots", () => {
      const preset = getAnimationPreset(AnimationPreset.VortexRotate);
      const center = preset({}, 10, 10, 21, QRCodeEntity.Module, defaultOpacitySettings);
      const corner = preset({}, 0, 0, 21, QRCodeEntity.Module, defaultOpacitySettings);
      const centerFrom = typeof center.from === "number" ? center.from : 0;
      const cornerFrom = typeof corner.from === "number" ? corner.from : 0;
      const centerPeak = sampleDotMatrixAnimationFrame(center, centerFrom + 240).scale ?? 0;
      const cornerPeak = sampleDotMatrixAnimationFrame(corner, cornerFrom + 240).scale ?? 0;

      expect(centerPeak).toBeGreaterThan(cornerPeak);
    });
  });

  describe("FanRotate", () => {
    it("maps one sinusoidal field to both dot size and alpha", () => {
      const preset = getAnimationPreset(AnimationPreset.FanRotate);
      const animation = preset({}, 10, 10, 21, QRCodeEntity.Module, defaultOpacitySettings);
      const from = typeof animation.from === "number" ? animation.from : 0;
      const trough = sampleDotMatrixAnimationFrame(animation, from + 875);
      const peak = sampleDotMatrixAnimationFrame(animation, from + 2625);

      expect(trough.scale).toBeCloseTo(0.3, 3);
      expect(peak.scale).toBeCloseTo(0.95, 3);
      expect(trough.opacityMultiplier).toBeCloseTo(0.5, 3);
      expect(peak.opacityMultiplier).toBeCloseTo(1, 3);
    });
  });

  describe("DiamondExpand", () => {
    it("staggers by manhattan diamond distance from center", () => {
      const preset = getAnimationPreset(AnimationPreset.DiamondExpand);
      const center = preset({}, 10, 10, 21, QRCodeEntity.Module, defaultOpacitySettings);
      const corner = preset({}, 0, 0, 21, QRCodeEntity.Module, defaultOpacitySettings);

      expect(corner.from).toBeGreaterThan(center.from ?? 0);
    });
  });

  describe("ZigzagFlow", () => {
    it("travels in serpentine order across the matrix", () => {
      const preset = getAnimationPreset(AnimationPreset.ZigzagFlow);
      const first = preset({}, 0, 0, 21, QRCodeEntity.Module, defaultOpacitySettings);
      const later = preset({}, 0, 20, 21, QRCodeEntity.Module, defaultOpacitySettings);

      expect(later.from).toBeGreaterThan(first.from ?? 0);
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
