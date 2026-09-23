import { QRCodeEntity } from "./animation-utils";
import { SOURCE_BASE_OPACITY } from "./opacity-triplet";
import { isMixableHexColor, mixHexColors, smoothBlendProgress } from "./color-mix";
import { clamp, easeInOut } from "./motion-math";
import { PRESERVE_MODULE_FILL, isPreserveModuleFill } from "./animation-types";
import type {
  DotMatrixAnimationFrame,
  DotMatrixAnimationSampleInput,
  DotMatrixSample,
} from "./animation-types";

export type DotMatrixCssBlendKeyframe = {
  offset: number;
  cssBlend: { base: number; mid: number; peak: number };
};

export const isCssBlendKeyframe = (frame: WebKeyframeValue): frame is DotMatrixCssBlendKeyframe =>
  typeof frame === "object" &&
  frame !== null &&
  "cssBlend" in frame &&
  typeof (frame as DotMatrixCssBlendKeyframe).cssBlend === "object";

export type WebKeyframeValue =
  number | { offset: number; value: number } | DotMatrixCssBlendKeyframe;

export const matrixCssKeyframe = (
  offset: number,
  peak: number,
  mid: number,
  base: number,
): DotMatrixCssBlendKeyframe => ({
  cssBlend: { base, mid, peak },
  offset,
});

const keyframeNumericValue = (frame: WebKeyframeValue) =>
  typeof frame === "number" ? frame : (frame as { value: number }).value;

const parseStepsEasing = (easing?: string) => {
  if (!easing) return null;
  const match = easing.match(/^steps\((\d+)\s*,\s*end\)$/);
  return match ? Math.max(1, Number(match[1])) : null;
};

const CUBIC_BEZIER_RE =
  /^cubic-bezier\(\s*(-?[\d.eE]+)\s*,\s*(-?[\d.eE]+)\s*,\s*(-?[\d.eE]+)\s*,\s*(-?[\d.eE]+)\s*\)$/;

const cubicBezierCache = new Map<string, ((x: number) => number) | null>();

const bezierCurveAt = (t: number, a1: number, a2: number) =>
  ((1 - 3 * a2 + 3 * a1) * t + (3 * a2 - 6 * a1)) * t * t + 3 * a1 * t;

const bezierSlopeAt = (t: number, a1: number, a2: number) =>
  3 * (1 - 3 * a2 + 3 * a1) * t * t + 2 * (3 * a2 - 6 * a1) * t + 3 * a1;

/** Solve cubic-bezier(x1,y1,x2,y2) progress for a linear phase, memoized per easing string. */
const cubicBezierEasing = (easing?: string) => {
  if (!easing) return null;
  const cached = cubicBezierCache.get(easing);
  if (cached !== undefined) return cached;

  const match = easing.match(CUBIC_BEZIER_RE);
  let fn: ((x: number) => number) | null = null;
  if (match) {
    const x1 = Number(match[1]);
    const y1 = Number(match[2]);
    const x2 = Number(match[3]);
    const y2 = Number(match[4]);
    fn = (x: number) => {
      const target = clamp(x, 0, 1);
      if (target === 0 || target === 1) return target;

      let t = target;
      for (let i = 0; i < 8; i += 1) {
        const error = bezierCurveAt(t, x1, x2) - target;
        if (Math.abs(error) < 1e-6) return bezierCurveAt(t, y1, y2);
        const slope = bezierSlopeAt(t, x1, x2);
        if (Math.abs(slope) < 1e-6) break;
        t -= error / slope;
      }

      let lo = 0;
      let hi = 1;
      t = target;
      while (hi - lo > 1e-6) {
        const estimate = bezierCurveAt(t, x1, x2);
        if (Math.abs(estimate - target) < 1e-6) break;
        if (estimate < target) lo = t;
        else hi = t;
        t = (lo + hi) / 2;
      }
      return bezierCurveAt(t, y1, y2);
    };
  }
  cubicBezierCache.set(easing, fn);
  return fn;
};

const easedCyclePhase = (easing: string | undefined, linearPhase: number) => {
  const bezier = cubicBezierEasing(easing);
  if (bezier) return bezier(linearPhase);
  return easing === "ease-in-out" ? easeInOut(linearPhase) : linearPhase;
};

const keyframeValueAt = (frame: WebKeyframeValue): number | string => {
  if (typeof frame === "number") return frame;
  if (typeof frame === "object" && frame !== null && "value" in frame) {
    return (frame as { value: number | string }).value;
  }
  return 0;
};

export const keyframeOpacityAt = (frames: WebKeyframeValue[], phase: number) => {
  const clampedPhase = clamp(phase, 0, 1);
  if (frames.length === 0) return SOURCE_BASE_OPACITY;
  if (frames.length === 1) {
    return keyframeNumericValue(frames[0]);
  }

  const previous = frames[0];
  let previousOffset = typeof previous === "number" ? 0 : previous.offset;
  let previousValue = keyframeNumericValue(previous);

  for (let index = 1; index < frames.length; index++) {
    const frame = frames[index];
    const offset = typeof frame === "number" ? index / (frames.length - 1) : frame.offset;
    const value = keyframeNumericValue(frame);
    if (clampedPhase <= offset) {
      const span = offset - previousOffset;
      if (span <= 0) return value;
      const progress = smoothBlendProgress((clampedPhase - previousOffset) / span);
      return previousValue + (value - previousValue) * progress;
    }
    previousOffset = offset;
    previousValue = value;
  }

  const last = frames[frames.length - 1];
  return keyframeNumericValue(last);
};

const keyframeFillAt = (frames: WebKeyframeValue[], phase: number) => {
  const clampedPhase = clamp(phase, 0, 1);
  if (frames.length === 0) return undefined;
  if (frames.length === 1) {
    return String(keyframeValueAt(frames[0]));
  }

  const previous = frames[0];
  let previousOffset = typeof previous === "number" ? 0 : previous.offset;
  let previousValue = String(keyframeValueAt(previous));

  for (let index = 1; index < frames.length; index++) {
    const frame = frames[index];
    const offset = typeof frame === "number" ? index / (frames.length - 1) : frame.offset;
    const value = String(keyframeValueAt(frame));
    if (clampedPhase <= offset) {
      const span = offset - previousOffset;
      if (span <= 0) {
        return value;
      }
      const progress = smoothBlendProgress((clampedPhase - previousOffset) / span);
      if (isMixableHexColor(previousValue) && isMixableHexColor(value)) {
        return mixHexColors(previousValue, value, progress);
      }
      return progress < 0.5 ? previousValue : value;
    }
    previousOffset = offset;
    previousValue = value;
  }

  return String(keyframeValueAt(frames[frames.length - 1]));
};

const sampleShapeRevealFrame = (
  animation: DotMatrixAnimationSampleInput,
  cycleElapsed: number,
  duration: number,
): { opacity: number; fill?: string } | null => {
  const web = animation.web;
  const shapeReveal = web?.shapeReveal;
  const fillFrames = web?.fill;
  if (!shapeReveal || !Array.isArray(fillFrames) || fillFrames.length === 0) {
    return null;
  }

  const linearPhase = clamp(cycleElapsed / duration, 0, 1);
  // Expand to full shape by midpoint, contract back — loop closes at base like RadialExpand.
  const pingPong = linearPhase < 0.5 ? linearPhase * 2 : 2 - linearPhase * 2;
  const revealPhase = animation.easing === "ease-in-out" ? easeInOut(pingPong) : pingPong;
  const threshold = revealPhase * shapeReveal.maxMetric;
  const edgeWidth = shapeReveal.edgeWidth ?? 2.25;
  const blend = smoothBlendProgress(clamp((threshold - shapeReveal.metric) / edgeWidth, 0, 1));

  const fillFrameAt = (index: number) =>
    String(
      typeof fillFrames[index] === "string"
        ? fillFrames[index]
        : keyframeValueAt(fillFrames[index] as WebKeyframeValue),
    );
  const opacityFrames = Array.isArray(web?.opacity)
    ? (web.opacity as WebKeyframeValue[])
    : undefined;
  const opacityFrameAt = (index: number) =>
    Number(keyframeValueAt(opacityFrames ? opacityFrames[index] : 1));

  const baseFill = fillFrameAt(0);
  const accentFill = fillFrameAt(fillFrames.length > 1 ? 1 : 0);
  const baseOpacity = opacityFrameAt(0);
  const accentOpacity = opacityFrameAt(opacityFrames && opacityFrames.length > 1 ? 1 : 0);
  const opacity = baseOpacity + (accentOpacity - baseOpacity) * blend;
  const fill = isPreserveModuleFill(baseFill)
    ? blend >= 0.5
      ? accentFill
      : PRESERVE_MODULE_FILL
    : isMixableHexColor(baseFill) && isMixableHexColor(accentFill)
      ? mixHexColors(baseFill, accentFill, blend)
      : blend >= 0.5
        ? accentFill
        : baseFill;

  return { opacity, fill };
};

const numericChannel = (value: unknown): WebKeyframeValue[] | undefined =>
  Array.isArray(value) ? (value as WebKeyframeValue[]) : undefined;

export const sampleDotMatrixAnimationFrame = (
  animation: DotMatrixAnimationSampleInput,
  globalTimeMs: number,
): DotMatrixSample => {
  const from = typeof animation.from === "number" ? animation.from : 0;
  const duration =
    typeof animation.duration === "number" && animation.duration > 0 ? animation.duration : 1500;
  const elapsed = Math.max(0, globalTimeMs - from);
  const cycleElapsed = elapsed % duration;
  const web = animation.web;
  const shapeRevealSample = sampleShapeRevealFrame(animation, cycleElapsed, duration);
  if (shapeRevealSample) {
    return shapeRevealSample;
  }
  const rawFrames = web && web.opacity;
  const frames = Array.isArray(rawFrames) ? (rawFrames as WebKeyframeValue[]) : [];
  const fillFrames = numericChannel(web && web.fill);
  const opacityMultiplierFrames = numericChannel(web && web.opacityMultiplier);
  const scaleFrames = numericChannel(web && web.scale);
  const xFrames = numericChannel(web && web.x);
  const yFrames = numericChannel(web && web.y);
  const rotateFrames = numericChannel(web && web.rotate);
  const steps = parseStepsEasing(animation.easing);

  if (frames.length === 0) {
    return { opacity: SOURCE_BASE_OPACITY };
  }

  if (steps) {
    const stepMs = duration / steps;
    const stepIndex = Math.floor(cycleElapsed / stepMs) % frames.length;
    const stepProgress = (cycleElapsed % stepMs) / stepMs;
    const steppedPhase = (stepIndex + stepProgress) / Math.max(1, frames.length - 1);
    const opacity = Number(keyframeValueAt(frames[stepIndex]));
    const fill = fillFrames ? keyframeFillAt(fillFrames, steppedPhase) : undefined;
    const sampleChannel = (channel?: WebKeyframeValue[]) =>
      channel ? keyframeOpacityAt(channel, steppedPhase) : undefined;
    return {
      opacity,
      fill,
      opacityMultiplier: sampleChannel(opacityMultiplierFrames),
      scale: sampleChannel(scaleFrames),
      x: sampleChannel(xFrames),
      y: sampleChannel(yFrames),
      rotate: sampleChannel(rotateFrames),
    };
  }

  const easedPhase = easedCyclePhase(animation.easing, cycleElapsed / duration);
  const opacity = keyframeOpacityAt(frames, easedPhase);
  const fill = fillFrames ? keyframeFillAt(fillFrames, easedPhase) : undefined;
  const sampleChannel = (channel?: WebKeyframeValue[]) =>
    channel ? keyframeOpacityAt(channel, easedPhase) : undefined;
  return {
    opacity,
    fill,
    opacityMultiplier: sampleChannel(opacityMultiplierFrames),
    scale: sampleChannel(scaleFrames),
    x: sampleChannel(xFrames),
    y: sampleChannel(yFrames),
    rotate: sampleChannel(rotateFrames),
  };
};

const cloneCssBlendKeyframe = (frame: DotMatrixCssBlendKeyframe): DotMatrixCssBlendKeyframe => ({
  cssBlend: { ...frame.cssBlend },
  offset: frame.offset,
});

export const matrixMotionStyle = (
  targets: Element,
  from: number,
  duration: number,
  opacity: WebKeyframeValue[],
  scale: WebKeyframeValue[],
  easing: string = "linear",
  spatial?: {
    x?: WebKeyframeValue[];
    y?: WebKeyframeValue[];
    rotate?: WebKeyframeValue[];
  },
): DotMatrixAnimationFrame => ({
  targets,
  from,
  duration,
  easing,
  web: {
    opacity,
    scale,
    ...(spatial?.x ? { x: spatial.x } : {}),
    ...(spatial?.y ? { y: spatial.y } : {}),
    ...(spatial?.rotate ? { rotate: spatial.rotate } : {}),
  },
});

export const matrixEntityAnimation = (
  targets: Element,
  entity: QRCodeEntity,
  duration: number = 560,
): DotMatrixAnimationFrame => {
  if (entity === QRCodeEntity.PositionRing || entity === QRCodeEntity.PositionCenter) {
    return {
      targets,
      duration,
      easing: "ease-in-out",
      web: { opacity: [1, 0.94, 1], scale: [1, 1.025, 1] },
    };
  }

  return matrixMotionStyle(targets, 0, duration, [1, 0.9, 1], [1, 1.02, 1], "ease-in-out");
};
