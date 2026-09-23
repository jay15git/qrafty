import { remapOpacityToTriplet } from "./opacity-triplet";
import { dualAccentMixFromCssBlend, dualAccentMixFromOpacity, mixHexColors } from "./color-mix";
import { clamp } from "./motion-math";
import { isCssBlendKeyframe } from "./animation-keyframes";
import type { DotMatrixCssBlendKeyframe, WebKeyframeValue } from "./animation-keyframes";
import { PRESERVE_MODULE_FILL } from "./animation-types";
import type {
  AnimationPreset,
  DotMatrixAnimationFrame,
  QRCodeAnimation,
  QRCodeAnimationSettings,
} from "./animation-types";

const DEFAULT_ANIMATION_SPEED = 1;
const DEFAULT_DOT_MATRIX_OPACITY_BASE = 1;
const DEFAULT_DOT_MATRIX_OPACITY_MID = 0.65;
const DEFAULT_DOT_MATRIX_OPACITY_PEAK = 1;

const dotMatrixColorSettings = (settings?: QRCodeAnimationSettings) => {
  const base = settings && settings.dotMatrixColorBase;
  const mid = settings && settings.dotMatrixColorMid;
  const peak = settings && settings.dotMatrixColorPeak;
  if (!base || !mid || !peak) return undefined;
  return { base, mid, peak };
};

const safeAnimationSpeed = (settings?: QRCodeAnimationSettings) => {
  const speed = Number(settings && settings.animationSpeed);
  return speed > 0 && Number.isFinite(speed) ? speed : DEFAULT_ANIMATION_SPEED;
};

const dotMatrixOpacitySettings = (settings?: QRCodeAnimationSettings) => ({
  base: clamp(
    Number(
      settings && settings.dotMatrixOpacityBase !== undefined
        ? settings.dotMatrixOpacityBase
        : DEFAULT_DOT_MATRIX_OPACITY_BASE,
    ),
    0,
    1,
  ),
  mid: clamp(
    Number(
      settings && settings.dotMatrixOpacityMid !== undefined
        ? settings.dotMatrixOpacityMid
        : DEFAULT_DOT_MATRIX_OPACITY_MID,
    ),
    0,
    1,
  ),
  peak: clamp(
    Number(
      settings && settings.dotMatrixOpacityPeak !== undefined
        ? settings.dotMatrixOpacityPeak
        : DEFAULT_DOT_MATRIX_OPACITY_PEAK,
    ),
    0,
    1,
  ),
});

const resolveCssBlendOpacity = (
  blend: DotMatrixCssBlendKeyframe["cssBlend"],
  settings?: QRCodeAnimationSettings,
) => {
  const { base, mid, peak } = dotMatrixOpacitySettings(settings);
  return clamp(blend.peak * peak + blend.mid * mid + blend.base * base, 0, 1);
};

export const resolveDotMatrixKeyframeOpacity = (
  frame: WebKeyframeValue,
  settings?: QRCodeAnimationSettings,
) => {
  if (isCssBlendKeyframe(frame)) {
    return resolveCssBlendOpacity(frame.cssBlend, settings);
  }
  const raw =
    typeof frame === "number"
      ? frame
      : typeof frame === "object" && frame !== null && "value" in frame
        ? frame.value
        : 0;
  const { base, mid, peak } = dotMatrixOpacitySettings(settings);
  return remapOpacityToTriplet(raw, base, mid, peak);
};

const remapDotMatrixOpacityValue = (value: number, settings?: QRCodeAnimationSettings) => {
  if (!Number.isFinite(value)) return value;
  const { base, mid, peak } = dotMatrixOpacitySettings(settings);
  return remapOpacityToTriplet(clamp(value, 0, 1), base, mid, peak);
};

const remapDotMatrixOpacity = (opacity: unknown, settings?: QRCodeAnimationSettings) => {
  if (!Array.isArray(opacity)) return opacity;
  const frames = opacity as WebKeyframeValue[];
  return frames.map((frame) => {
    if (isCssBlendKeyframe(frame)) {
      const value = resolveCssBlendOpacity(frame.cssBlend, settings);
      return { offset: frame.offset, value };
    }
    return typeof frame === "number"
      ? remapDotMatrixOpacityValue(frame, settings)
      : { ...frame, value: remapDotMatrixOpacityValue(frame.value, settings) };
  });
};

const dotMatrixColorForOpacityValue = (value: number, settings?: QRCodeAnimationSettings) => {
  const colors = dotMatrixColorSettings(settings);
  if (!colors || !Number.isFinite(value)) return undefined;
  const opacity = clamp(value, 0, 1);
  const { peak } = dotMatrixOpacitySettings(settings);

  if (settings?.dotMatrixColorMode === "dual") {
    return opacity >= peak ? colors.peak : colors.base;
  }

  const { base, mid, peak: peakAnchor } = dotMatrixOpacitySettings(settings);
  const baseCutoff = (base + mid) / 2;
  const peakCutoff = (mid + peakAnchor) / 2;
  if (opacity <= baseCutoff) return colors.base;
  if (opacity <= peakCutoff) return colors.mid;
  return colors.peak;
};

const dualColorForCssBlendKeyframe = (
  frame: DotMatrixCssBlendKeyframe,
  colors: { base: string; mid: string; peak: string },
) => mixHexColors(colors.base, colors.peak, dualAccentMixFromCssBlend(frame.cssBlend));

const dualColorForResolvedOpacity = (
  opacity: number,
  settings?: QRCodeAnimationSettings,
  colors?: { base: string; mid: string; peak: string },
) => {
  const resolvedColors = colors ?? dotMatrixColorSettings(settings);
  if (!resolvedColors) return undefined;
  const { base, peak } = dotMatrixOpacitySettings(settings);
  return mixHexColors(
    resolvedColors.base,
    resolvedColors.peak,
    dualAccentMixFromOpacity(opacity, base, peak),
  );
};

const resolvePeakAccentMix = (frame: WebKeyframeValue, settings: QRCodeAnimationSettings) => {
  if (settings.dotMatrixColorMode === "dual") {
    if (isCssBlendKeyframe(frame)) {
      return dualAccentMixFromCssBlend(frame.cssBlend);
    }
    const { base, peak } = dotMatrixOpacitySettings(settings);
    return dualAccentMixFromOpacity(resolveDotMatrixKeyframeOpacity(frame, settings), base, peak);
  }

  const { base, peak } = dotMatrixOpacitySettings(settings);
  return dualAccentMixFromOpacity(resolveDotMatrixKeyframeOpacity(frame, settings), base, peak);
};

const fillForPreserveFrame = (
  frame: WebKeyframeValue,
  settings: QRCodeAnimationSettings,
  peakColor: string,
) => (resolvePeakAccentMix(frame, settings) > 0 ? peakColor : PRESERVE_MODULE_FILL);

const remapDotMatrixFill = (opacity: unknown, settings?: QRCodeAnimationSettings) => {
  if (!Array.isArray(opacity)) {
    return undefined;
  }
  const frames = opacity as WebKeyframeValue[];

  if (settings?.preserveModuleFills) {
    const peakColor = settings.dotMatrixColorPeak;
    if (!peakColor) {
      return undefined;
    }

    return frames.map((frame) => {
      const fill = fillForPreserveFrame(frame, settings, peakColor);
      if (isCssBlendKeyframe(frame)) {
        return { offset: frame.offset, value: fill };
      }
      if (typeof frame === "number") {
        return fill;
      }
      return { ...frame, value: fill };
    });
  }

  if (!dotMatrixColorSettings(settings)) {
    return undefined;
  }
  const colors = dotMatrixColorSettings(settings)!;
  return frames.map((frame) => {
    const color =
      settings?.dotMatrixColorMode === "dual"
        ? isCssBlendKeyframe(frame)
          ? dualColorForCssBlendKeyframe(frame, colors)
          : dualColorForResolvedOpacity(
              resolveDotMatrixKeyframeOpacity(frame, settings),
              settings,
              colors,
            )
        : dotMatrixColorForOpacityValue(resolveDotMatrixKeyframeOpacity(frame, settings), settings);
    if (isCssBlendKeyframe(frame)) {
      return { offset: frame.offset, value: color };
    }
    if (typeof frame === "number") {
      return color;
    }
    return { ...frame, value: color };
  });
};

const resolvePresetAnimationSettings = (
  settings: QRCodeAnimationSettings | undefined,
  isDotMatrixPreset: boolean,
): QRCodeAnimationSettings | undefined => {
  if (!isDotMatrixPreset) {
    return settings;
  }

  return {
    ...settings,
    dotMatrixColorMode: settings?.dotMatrixColorMode ?? "dual",
  };
};

const applyPresetSettings = (
  animation: DotMatrixAnimationFrame,
  settings: QRCodeAnimationSettings | undefined,
  isDotMatrixPreset: boolean,
  _presetName?: AnimationPreset,
): DotMatrixAnimationFrame => {
  const resolvedSettings = resolvePresetAnimationSettings(settings, isDotMatrixPreset);
  const speed = safeAnimationSpeed(resolvedSettings);
  const dotMatrixFill = isDotMatrixPreset
    ? remapDotMatrixFill(animation.web && animation.web.opacity, resolvedSettings)
    : undefined;
  const web = isDotMatrixPreset
    ? {
        ...animation.web,
        opacity: remapDotMatrixOpacity(animation.web && animation.web.opacity, resolvedSettings),
        ...(dotMatrixFill ? { fill: dotMatrixFill } : {}),
      }
    : animation.web;
  return {
    ...animation,
    from: typeof animation.from === "number" ? animation.from / speed : animation.from,
    duration:
      typeof animation.duration === "number" ? animation.duration / speed : animation.duration,
    web,
  };
};

export const wrapPreset =
  (
    animation: QRCodeAnimation,
    isDotMatrixPreset: boolean,
    presetName?: AnimationPreset,
  ): QRCodeAnimation =>
  (targets, x, y, count, entity, settings) =>
    applyPresetSettings(
      animation(targets, x, y, count, entity, settings),
      settings,
      isDotMatrixPreset,
      presetName,
    );
