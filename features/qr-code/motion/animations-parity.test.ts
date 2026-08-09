import { describe, expect, it } from "vitest";

import {
  AnimationPreset,
  dotMatrixAnimationPresets,
  getAnimationPreset,
  opacityFromSquare2Tail,
  QRCodeEntity,
  remapOpacityToTriplet,
  resolveDotMatrixKeyframeOpacity,
  sampleDotMatrixAnimationFrame,
  SQUARE2_BASE_OPACITY,
  SQUARE2_ROUTE,
  SOURCE_BASE_OPACITY,
  SOURCE_MID_OPACITY,
  SOURCE_PEAK_OPACITY,
  type QRCodeAnimationSettings,
} from "@new-qr/qr/dot-matrix";

const defaultOpacitySettings: QRCodeAnimationSettings = {
  dotMatrixOpacityBase: 0.16,
  dotMatrixOpacityMid: 0.32,
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

      expect(remapOpacityToTriplet(SOURCE_BASE_OPACITY, base, mid, peak)).toBeCloseTo(0.16, 5);
      expect(remapOpacityToTriplet(SOURCE_MID_OPACITY, base, mid, peak)).toBeCloseTo(0.32, 5);
      expect(remapOpacityToTriplet(SOURCE_PEAK_OPACITY, base, mid, peak)).toBeCloseTo(1, 5);
    });

    it("lerps tail opacities between mid and peak like upstream", () => {
      const { dotMatrixOpacityBase: base, dotMatrixOpacityMid: mid, dotMatrixOpacityPeak: peak } =
        defaultOpacitySettings;
      const remapped = remapOpacityToTriplet(0.82, base, mid, peak);
      const progress = (0.82 - SOURCE_MID_OPACITY) / (SOURCE_PEAK_OPACITY - SOURCE_MID_OPACITY);

      expect(remapped).toBeCloseTo(mid + (peak - mid) * progress, 5);
    });

    it("maps idle pulse-ladder opacity to user base", () => {
      const { dotMatrixOpacityBase: base, dotMatrixOpacityMid: mid, dotMatrixOpacityPeak: peak } =
        defaultOpacitySettings;

      expect(remapOpacityToTriplet(SQUARE2_BASE_OPACITY, base, mid, peak)).toBeCloseTo(0.16, 5);
    });
  });

  describe("PulseLadder", () => {
    it("uses the upstream 33-step route with source tail falloff", () => {
      expect(SQUARE2_ROUTE).toHaveLength(33);

      const headIndex = SQUARE2_ROUTE[0]!;
      const headOpacity = opacityFromSquare2Tail(headIndex, 0);
      const tailOpacity = opacityFromSquare2Tail(headIndex, 3);

      expect(headOpacity).toBeCloseTo(1, 5);
      expect(tailOpacity).toBeCloseTo(0.54, 5);
      expect(opacityFromSquare2Tail(12, 0)).toBeCloseTo(SQUARE2_BASE_OPACITY, 5);
    });

    it("remaps pulse-ladder peak and tail through upstream triplet curve", () => {
      const preset = getAnimationPreset(AnimationPreset.PulseLadder);
      const animation = preset({}, 2, 2, 21, QRCodeEntity.Module, defaultOpacitySettings);
      const frames = animation.web?.opacity;

      expect(Array.isArray(frames)).toBe(true);
      if (!Array.isArray(frames)) {
        return;
      }

      const peakFrame = frames.find(
        (frame) => typeof frame === "object" && frame !== null && "value" in frame && frame.value > 0.9,
      );
      const idleFrame = frames.find(
        (frame) => typeof frame === "object" && frame !== null && "value" in frame && frame.value < 0.2,
      );

      expect(peakFrame).toBeTruthy();
      expect(idleFrame).toBeTruthy();
    });
  });

  describe("OriginWave", () => {
    it("matches upstream css-blend keyframes at idle and peak", () => {
      const idle = resolveDotMatrixKeyframeOpacity(
        { cssBlend: { base: 0.625, mid: 0, peak: 0 }, offset: 0 },
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

      expect(idle).toBeCloseTo(0.625 * 0.16, 5);
      expect(peak).toBeCloseTo(1, 5);
      expect(mid).toBeCloseTo(0.5 * (0.16 + 0.32), 5);
    });

    it("staggers rings with interpolated origin distance", () => {
      const preset = getAnimationPreset(AnimationPreset.OriginWave);
      const origin = preset({}, 20, 20, 21, QRCodeEntity.Module, defaultOpacitySettings);
      const outer = preset({}, 0, 0, 21, QRCodeEntity.Module, defaultOpacitySettings);

      expect(origin.from).toBeGreaterThan(outer.from ?? 0);
    });
  });

  describe("CoreRotor", () => {
    it("uses continuous phase sampling instead of stepped frames", () => {
      const preset = getAnimationPreset(AnimationPreset.CoreRotor);
      const animation = preset({}, 0, 0, 21, QRCodeEntity.Module, defaultOpacitySettings);
      const opacityFrames = animation.web?.opacity;

      expect(animation.easing).toBe("linear");
      expect(animation.easing).not.toMatch(/^steps\(/);
      expect(Array.isArray(opacityFrames)).toBe(true);
      if (Array.isArray(opacityFrames)) {
        expect(opacityFrames.length).toBeGreaterThan(20);
      }
    });
  });

  describe("RadialExpand", () => {
    it("staggers by euclidean radius from center", () => {
      const preset = getAnimationPreset(AnimationPreset.RadialExpand);
      const center = preset({}, 10, 10, 21, QRCodeEntity.Module, defaultOpacitySettings);
      const corner = preset({}, 0, 0, 21, QRCodeEntity.Module, defaultOpacitySettings);

      expect(corner.from).toBeGreaterThan(center.from ?? 0);
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

    it("matches upstream Block Drop frame count", () => {
      const animation = getAnimationPreset(AnimationPreset.BlockDrop)(
        {},
        2,
        2,
        21,
        QRCodeEntity.Module,
        defaultOpacitySettings,
      );
      const frames = animation.web?.opacity;

      expect(Array.isArray(frames)).toBe(true);
      if (!Array.isArray(frames)) {
        return;
      }

      expect(frames).toHaveLength(11);
      expect(animation.easing).toBe("steps(11, end)");
    });

    it("matches upstream Strobe Stack full sequence length", () => {
      const animation = getAnimationPreset(AnimationPreset.StrobeStack)(
        {},
        2,
        2,
        21,
        QRCodeEntity.Module,
        defaultOpacitySettings,
      );
      const frames = animation.web?.opacity;

      expect(Array.isArray(frames)).toBe(true);
      if (!Array.isArray(frames)) {
        return;
      }

      expect(frames).toHaveLength(24);
      expect(animation.easing).toBe("steps(24, end)");
    });
  });
});
