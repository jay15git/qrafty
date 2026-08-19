export type DotMatrixAnimationFrame = {
  targets: SVGElement | HTMLElement;
  from?: number;
  duration?: number;
  easing?: string;
  web?: {
    opacity?: unknown;
    opacityMultiplier?: unknown;
    fill?: unknown;
    scale?: unknown;
    x?: unknown;
    y?: unknown;
    rotate?: unknown;
    filter?: unknown;
    shapeReveal?: DotMatrixShapeReveal;
  };
};

export type DotMatrixShapeReveal = {
  edgeWidth?: number;
  maxMetric: number;
  metric: number;
};

import {
  innermostPoint,
  distanceBetween,
  underdampedHarmonicOscillationMaximums,
  applyToValues,
  scaleOscillationsToOffset,
} from './animation-utils';
import {
  remapOpacityToTriplet,
  SOURCE_BASE_OPACITY,
  SOURCE_PEAK_OPACITY,
} from './opacity-triplet';
import {
  dualAccentMixFromCssBlend,
  dualAccentMixFromOpacity,
  isMixableHexColor,
  mixHexColors,
} from './color-mix';
import {
  heartExpansionMetric,
  heartMaxExpansionMetric,
  rippleRingIndex,
  starExpansionMetric,
  starMaxExpansionMetric,
} from './shape-metrics';

export {
  remapOpacityToTriplet,
  SOURCE_BASE_OPACITY,
  SOURCE_MID_OPACITY,
  SOURCE_PEAK_OPACITY,
} from './opacity-triplet';

export enum QRCodeEntity {
  Module = 'module',
  PositionRing = 'position-ring',
  PositionCenter = 'position-center',
  Icon = 'icon',
}

export type QRCodeAnimation = (
  targets: any,
  modulePositionX: number,
  modulePositionY: number,
  count: number,
  entityType: QRCodeEntity,
  settings?: QRCodeAnimationSettings
) => DotMatrixAnimationFrame;

export interface QRCodeAnimationSettings {
  animationSpeed?: number;
  dotMatrixColorMode?: 'dual';
  dotMatrixOpacityBase?: number;
  dotMatrixOpacityMid?: number;
  dotMatrixOpacityPeak?: number;
  dotMatrixColorBase?: string;
  dotMatrixColorMid?: string;
  dotMatrixColorPeak?: string;
  preserveModuleFills?: boolean;
}

export const PRESERVE_MODULE_FILL = '__qr-preserve-module-fill__';

export function isPreserveModuleFill(fill: string | undefined | null) {
  return fill === PRESERVE_MODULE_FILL;
}

export enum AnimationPreset {
  FadeInTopDown = 'FadeInTopDown',
  FadeInCenterOut = 'FadeInCenterOut',
  RadialRipple = 'RadialRipple',
  RadialRippleIn = 'RadialRippleIn',
  MaterializeIn = 'MaterializeIn',
  SubtlePulse = 'SubtlePulse',
  FinderPing = 'FinderPing',
  SoftMaterialize = 'SoftMaterialize',
  CenterBloom = 'CenterBloom',
  CornerSweep = 'CornerSweep',
  OrbitReveal = 'OrbitReveal',
  DiamondGlint = 'DiamondGlint',
  SignalScan = 'SignalScan',
  ConfettiPop = 'ConfettiPop',
  SpiralBloom = 'SpiralBloom',
  BubbleCascade = 'BubbleCascade',
  KaleidoPulse = 'KaleidoPulse',
  FireflyTwinkle = 'FireflyTwinkle',
  MagneticRipple = 'MagneticRipple',
  ParallaxTiles = 'ParallaxTiles',
  ConstellationTrace = 'ConstellationTrace',
  ApertureReveal = 'ApertureReveal',
  LensFocus = 'LensFocus',
  ReceiptPrint = 'ReceiptPrint',
  FlipClock = 'FlipClock',
  WaveInterference = 'WaveInterference',
  QuantumMaterialize = 'QuantumMaterialize',
  MagneticSnap = 'MagneticSnap',
  HoloFlicker = 'HoloFlicker',
  SignalGlitch = 'SignalGlitch',
  ShockwaveJolt = 'ShockwaveJolt',
  TideRise = 'TideRise',
  GravityCollapse = 'GravityCollapse',
  NeonDrift = 'NeonDrift',
  FluxColumns = 'FluxColumns',
  EchoRing = 'EchoRing',
  OriginWave = 'OriginWave',
  RadialExpand = 'RadialExpand',
  VortexRotate = 'VortexRotate',
  FanRotate = 'FanRotate',
  RadiusPing = 'RadiusPing',
  DiamondExpand = 'DiamondExpand',
  HeartExpand = 'HeartExpand',
  StarExpand = 'StarExpand',
  RippleExpand = 'RippleExpand',
  ZigzagFlow = 'ZigzagFlow',
  CrossBloom = 'CrossBloom',
  ChevronSweep = 'ChevronSweep',
  WaveRide = 'WaveRide',
  CornerPop = 'CornerPop',
}

export const standardAnimationPresets = [
  AnimationPreset.FadeInTopDown,
  AnimationPreset.FadeInCenterOut,
  AnimationPreset.RadialRipple,
  AnimationPreset.RadialRippleIn,
  AnimationPreset.MaterializeIn,
  AnimationPreset.SubtlePulse,
  AnimationPreset.FinderPing,
  AnimationPreset.SoftMaterialize,
  AnimationPreset.CenterBloom,
  AnimationPreset.CornerSweep,
  AnimationPreset.OrbitReveal,
  AnimationPreset.DiamondGlint,
  AnimationPreset.SignalScan,
  AnimationPreset.ConfettiPop,
  AnimationPreset.SpiralBloom,
  AnimationPreset.BubbleCascade,
  AnimationPreset.KaleidoPulse,
  AnimationPreset.FireflyTwinkle,
  AnimationPreset.MagneticRipple,
  AnimationPreset.ParallaxTiles,
  AnimationPreset.ConstellationTrace,
  AnimationPreset.ApertureReveal,
  AnimationPreset.LensFocus,
  AnimationPreset.ReceiptPrint,
  AnimationPreset.FlipClock,
  AnimationPreset.WaveInterference,
  AnimationPreset.QuantumMaterialize,
  AnimationPreset.MagneticSnap,
  AnimationPreset.HoloFlicker,
  AnimationPreset.SignalGlitch,
  AnimationPreset.ShockwaveJolt,
  AnimationPreset.TideRise,
  AnimationPreset.GravityCollapse,
];

export const dotMatrixAnimationPresets = [
  AnimationPreset.NeonDrift,
  AnimationPreset.EchoRing,
  AnimationPreset.OriginWave,
  AnimationPreset.RadialExpand,
  AnimationPreset.VortexRotate,
  AnimationPreset.FanRotate,
  AnimationPreset.RadiusPing,
  AnimationPreset.DiamondExpand,
  AnimationPreset.HeartExpand,
  AnimationPreset.StarExpand,
  AnimationPreset.RippleExpand,
  AnimationPreset.ZigzagFlow,
  AnimationPreset.CrossBloom,
  AnimationPreset.ChevronSweep,
  AnimationPreset.WaveRide,
  AnimationPreset.CornerPop,
  AnimationPreset.FluxColumns,
];

/** All square-loader presets use base + accent dual-color motion. */
export const dualColorDotMatrixPresets = dotMatrixAnimationPresets;

const FadeInTopDown: QRCodeAnimation = (targets, _x, y, _count, _entity) => {
  return {
    targets,
    from: y * 20,
    duration: 300,
    web: {
      opacity: [0, 1],
    },
  };
};

const FadeInCenterOut: QRCodeAnimation = (targets, x, y, count, entity) => {
  const { adjustedX, adjustedY } = innermostPoint(x, y, count, entity);
  const center = count / 2;
  const distance = distanceBetween(adjustedX, adjustedY, center, center);
  return {
    targets,
    from: distance * 20,
    duration: 200,
    web: {
      opacity: [0, 1],
    },
  };
};

const MaterializeIn: QRCodeAnimation = (targets, _x, _y, _count, entity) => ({
  targets,
  from: entity === QRCodeEntity.Module ? Math.random() * 200 : 200,
  duration: 200,
  web: {
    opacity: [0, 1],
  },
});

const SoftMaterialize: QRCodeAnimation = (targets, x, y, count, entity) => {
  const center = count / 2;
  const distanceFromCenter = distanceBetween(x, y, center, center);
  return {
    targets,
    from:
      entity === QRCodeEntity.Module
        ? Math.random() * 120 + distanceFromCenter * 4
        : 120,
    duration: 520,
    easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
    web: {
      opacity: [0, 1],
      scale: [0.72, 1.04, 1],
    },
  };
};

const SubtlePulse: QRCodeAnimation = (targets, _x, _y, _count, entity) => ({
  targets,
  from: entity === QRCodeEntity.Module ? Math.random() * 260 : 0,
  duration: entity === QRCodeEntity.Icon ? 1100 : 900,
  easing: 'cubic-bezier(0.445, 0.050, 0.550, 0.950)',
  web: {
    opacity:
      entity === QRCodeEntity.Module
        ? [1, 0.78, 1]
        : entity === QRCodeEntity.Icon
        ? [1, 0.86, 1]
        : [1, 0.9, 1],
    scale:
      entity === QRCodeEntity.Module
        ? [1, 1.08, 1]
        : entity === QRCodeEntity.Icon
        ? [1, 0.95, 1.02, 1]
        : [1, 1.03, 1],
  },
});

const FinderPing: QRCodeAnimation = (targets, _x, _y, _count, entity) => ({
  targets,
  from: entity === QRCodeEntity.Module ? 120 : 0,
  duration:
    entity === QRCodeEntity.PositionRing ||
    entity === QRCodeEntity.PositionCenter ||
    entity === QRCodeEntity.Icon
      ? 850
      : 360,
  easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
  web:
    entity === QRCodeEntity.PositionRing ||
    entity === QRCodeEntity.PositionCenter ||
    entity === QRCodeEntity.Icon
      ? {
          opacity: [1, 0.72, 1],
          scale: [1, 1.12, 0.98, 1],
        }
      : {
          opacity: [1, 0.92, 1],
        },
});

const CenterBloom: QRCodeAnimation = (targets, x, y, count, entity) => {
  const { adjustedX, adjustedY } = innermostPoint(x, y, count, entity);
  const center = count / 2;
  const distanceFromCenter = distanceBetween(
    adjustedX,
    adjustedY,
    center,
    center
  );
  return {
    targets,
    from: distanceFromCenter * 13,
    duration: 560,
    easing: 'cubic-bezier(0.190, 1.000, 0.220, 1.000)',
    web: {
      opacity: [0, 1],
      scale:
        entity === QRCodeEntity.Icon ? [0.82, 1.08, 1] : [0.2, 1.15, 0.96, 1],
    },
  };
};

const CornerSweep: QRCodeAnimation = (targets, x, y, count, entity) => {
  const distances = [
    distanceBetween(x, y, 0, 0),
    distanceBetween(x, y, count, 0),
    distanceBetween(x, y, 0, count),
  ];
  return {
    targets,
    from: Math.min(...distances) * 15,
    duration: 520,
    easing: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)',
    web: {
      opacity: [0, 1],
      scale: entity === QRCodeEntity.Module ? [0.35, 1.08, 1] : [0.72, 1.05, 1],
    },
  };
};

const beginOscillation = 0.2;
const endOscillation = 1;
const amplitude = 5;
const stiffness = 50;
const damping = 3;

const radialRippleMaximums = underdampedHarmonicOscillationMaximums(
  amplitude,
  stiffness,
  damping
);

const radialRippleOscillationKeyframes = scaleOscillationsToOffset(
  beginOscillation,
  endOscillation,
  radialRippleMaximums
);

const RadialRipple: QRCodeAnimation = (targets, x, y, count, entity) => {
  const { adjustedX, adjustedY } = innermostPoint(x, y, count, entity);
  const center = count / 2;
  const distanceFromCenter = distanceBetween(
    adjustedX,
    adjustedY,
    center,
    center
  );

  const waveResistance = 7;

  return {
    targets,
    from: distanceFromCenter * waveResistance,
    easing: 'cubic-bezier(0.445,  0.050, 0.550, 0.950)',
    duration: 1000,
    web: {
      scale: [
        ...(entity === QRCodeEntity.Icon
          ? [
              { offset: 0, value: 1 },
              { offset: 0.1, value: 0.7 },
              { offset: 0.2, value: 1 },
            ]
          : [{ offset: 0, value: 1 }]),
        ...applyToValues(
          radialRippleOscillationKeyframes,
          (x) => 1 + (x / amplitude) * 0.1
        ),
        1,
      ],
    },
  };
};

const OrbitReveal: QRCodeAnimation = (targets, x, y, count, entity) => {
  const center = count / 2;
  const angle = Math.atan2(y - center, x - center);
  const normalizedAngle = (angle + Math.PI) / (Math.PI * 2);
  const distanceFromCenter = distanceBetween(x, y, center, center);
  return {
    targets,
    from: normalizedAngle * 520 + distanceFromCenter * 5,
    duration: 560,
    easing: 'cubic-bezier(0.190, 1.000, 0.220, 1.000)',
    web: {
      opacity: [0, 1],
      scale: entity === QRCodeEntity.Module ? [0.18, 1.18, 1] : [0.68, 1.08, 1],
    },
  };
};

const finderPulseEntities = [
  QRCodeEntity.PositionRing,
  QRCodeEntity.PositionCenter,
  QRCodeEntity.Icon,
];

const isFinderPulseEntity = (entity: QRCodeEntity) =>
  finderPulseEntities.indexOf(entity) > -1;

const DiamondGlint: QRCodeAnimation = (targets, x, y, count, entity) => {
  const center = count / 2;
  const diamondDistance = Math.abs(x - center) + Math.abs(y - center);
  const sparkleOffset = ((x * 17 + y * 31) % 7) * 18;
  return {
    targets,
    from:
      entity === QRCodeEntity.Module
        ? diamondDistance * 18 + sparkleOffset
        : diamondDistance * 8,
    duration: 640,
    easing: 'cubic-bezier(0.175, 0.885, 0.320, 1.275)',
    web: {
      opacity: entity === QRCodeEntity.Module ? [1, 0.58, 1] : [1, 0.82, 1],
      scale:
        entity === QRCodeEntity.Module
          ? [1, 0.72, 1.2, 1]
          : [1, 0.92, 1.08, 1],
    },
  };
};

const SignalScan: QRCodeAnimation = (targets, x, y, count, entity) => {
  const center = count / 2;
  const verticalDistance = Math.abs(y - center);
  const columnOffset = ((x * 19) % 11) * 10;
  return {
    targets,
    from:
      entity === QRCodeEntity.Module
        ? verticalDistance * 30 + columnOffset
        : verticalDistance * 16,
    duration: 700,
    easing: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)',
    web: {
      opacity: entity === QRCodeEntity.Module ? [1, 0.64, 1] : [1, 0.8, 1],
      scale:
        entity === QRCodeEntity.Module
          ? [1, 0.84, 1.18, 1]
          : [1, 0.94, 1.08, 1],
    },
  };
};

const coordinateSeed = (x: number, y: number, count: number) =>
  Math.abs(Math.round((x + 1) * 37 + (y + 1) * 61 + count * 17));

const hashNoise = (x: number, y: number, seed: number) => {
  const value =
    Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233 + seed * 43.758) * 43758.5453;
  return value - Math.floor(value);
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

type DotMatrixCssBlendKeyframe = {
  offset: number;
  cssBlend: { base: number; mid: number; peak: number };
};

const isCssBlendKeyframe = (
  frame: WebKeyframeValue
): frame is DotMatrixCssBlendKeyframe =>
  typeof frame === 'object' &&
  frame !== null &&
  'cssBlend' in frame &&
  typeof (frame as DotMatrixCssBlendKeyframe).cssBlend === 'object';

type WebKeyframeValue =
  | number
  | { offset: number; value: number }
  | DotMatrixCssBlendKeyframe;

const MATRIX_SIZE = 5;
const MATRIX_LAST = MATRIX_SIZE - 1;
const MATRIX_CELLS = MATRIX_SIZE * MATRIX_SIZE;
const MATRIX_CYCLE_MS = 1500;

const matrixFracCoord = (x: number, y: number, count: number) => {
  const max = Math.max(1, count - 1);
  return {
    fRow: clamp((y / max) * MATRIX_LAST, 0, MATRIX_LAST),
    fCol: clamp((x / max) * MATRIX_LAST, 0, MATRIX_LAST),
  };
};

const discreteCellField = (
  fRow: number,
  fCol: number,
  fn: (row: number, col: number) => number
) => {
  const row = clamp(Math.round(fRow), 0, MATRIX_LAST);
  const col = clamp(Math.round(fCol), 0, MATRIX_LAST);
  return fn(row, col);
};

/** Bilinear sample of a 5×5 cell field — smooth when mapped onto large QR grids. */
const sampleCellField = (
  fRow: number,
  fCol: number,
  fn: (row: number, col: number) => number
) => {
  const r0 = clamp(Math.floor(fRow), 0, MATRIX_LAST);
  const c0 = clamp(Math.floor(fCol), 0, MATRIX_LAST);
  const r1 = clamp(r0 + 1, 0, MATRIX_LAST);
  const c1 = clamp(c0 + 1, 0, MATRIX_LAST);
  const dr = fRow - r0;
  const dc = fCol - c0;
  const v00 = fn(r0, c0);
  const v01 = fn(r0, c1);
  const v10 = fn(r1, c0);
  const v11 = fn(r1, c1);
  return (
    v00 * (1 - dr) * (1 - dc) +
    v01 * (1 - dr) * dc +
    v10 * dr * (1 - dc) +
    v11 * dr * dc
  );
};

const matrixCssKeyframe = (
  offset: number,
  peak: number,
  mid: number,
  base: number
): DotMatrixCssBlendKeyframe => ({
  cssBlend: { base, mid, peak },
  offset,
});

const keyframeNumericValue = (frame: WebKeyframeValue) =>
  typeof frame === 'number' ? frame : (frame as { value: number }).value;

const parseStepsEasing = (easing?: string) => {
  if (!easing) return null;
  const match = easing.match(/^steps\((\d+)\s*,\s*end\)$/);
  return match ? Math.max(1, Number(match[1])) : null;
};

const easeInOut = (phase: number) =>
  phase < 0.5 ? 2 * phase * phase : 1 - Math.pow(-2 * phase + 2, 2) / 2;

const keyframeValueAt = (frame: WebKeyframeValue): number | string => {
  if (typeof frame === 'number') return frame;
  if (typeof frame === 'object' && frame !== null && 'value' in frame) {
    return (frame as { value: number | string }).value;
  }
  return 0;
};

export const keyframeOpacityAt = (
  frames: WebKeyframeValue[],
  phase: number
) => {
  const clampedPhase = clamp(phase, 0, 1);
  if (frames.length === 0) return SOURCE_BASE_OPACITY;
  if (frames.length === 1) {
    return keyframeNumericValue(frames[0]);
  }

  let previous = frames[0];
  let previousOffset =
    typeof previous === 'number' ? 0 : previous.offset;
  let previousValue = keyframeNumericValue(previous);

  for (let index = 1; index < frames.length; index++) {
    const frame = frames[index];
    const offset = typeof frame === 'number' ? index / (frames.length - 1) : frame.offset;
    const value = keyframeNumericValue(frame);
    if (clampedPhase <= offset) {
      const span = offset - previousOffset;
      if (span <= 0) return value;
      const progress = (clampedPhase - previousOffset) / span;
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

  let previous = frames[0];
  let previousOffset =
    typeof previous === 'number' ? 0 : previous.offset;
  let previousValue = String(keyframeValueAt(previous));

  for (let index = 1; index < frames.length; index++) {
    const frame = frames[index];
    const offset =
      typeof frame === 'number' ? index / (frames.length - 1) : frame.offset;
    const value = String(keyframeValueAt(frame));
    if (clampedPhase <= offset) {
      const span = offset - previousOffset;
      if (span <= 0) {
        return value;
      }
      const progress = (clampedPhase - previousOffset) / span;
      if (
        isMixableHexColor(previousValue) &&
        isMixableHexColor(value)
      ) {
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
  animation: DotMatrixAnimationFrame,
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
  const pingPong =
    linearPhase < 0.5 ? linearPhase * 2 : 2 - linearPhase * 2;
  const revealPhase =
    animation.easing === 'ease-in-out' ? easeInOut(pingPong) : pingPong;
  const threshold = revealPhase * shapeReveal.maxMetric;
  const edgeWidth = shapeReveal.edgeWidth ?? 1.4;
  const blend = clamp((threshold - shapeReveal.metric) / edgeWidth, 0, 1);

  const baseFill = String(
    typeof fillFrames[0] === 'string'
      ? fillFrames[0]
      : keyframeValueAt(fillFrames[0] as WebKeyframeValue),
  );
  const accentFill = String(
    typeof fillFrames[fillFrames.length > 1 ? 1 : 0] === 'string'
      ? fillFrames[fillFrames.length > 1 ? 1 : 0]
      : keyframeValueAt(
          fillFrames[fillFrames.length > 1 ? 1 : 0] as WebKeyframeValue,
        ),
  );
  const baseOpacity = Number(
    keyframeValueAt(
      Array.isArray(web?.opacity) ? (web.opacity as WebKeyframeValue[])[0] : 1,
    ),
  );
  const accentOpacity = Number(
    keyframeValueAt(
      Array.isArray(web?.opacity)
        ? (web.opacity as WebKeyframeValue[])[
            web.opacity.length > 1 ? 1 : 0
          ]
        : 1,
    ),
  );
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

export const sampleDotMatrixAnimationFrame = (
  animation: DotMatrixAnimationFrame,
  globalTimeMs: number
): { opacity: number; fill?: string; opacityMultiplier?: number; scale?: number } => {
  const from = typeof animation.from === 'number' ? animation.from : 0;
  const duration =
    typeof animation.duration === 'number' && animation.duration > 0
      ? animation.duration
      : 1500;
  const elapsed = Math.max(0, globalTimeMs - from);
  const cycleElapsed = elapsed % duration;
  const web = animation.web;
  const shapeRevealSample = sampleShapeRevealFrame(
    animation,
    cycleElapsed,
    duration,
  );
  if (shapeRevealSample) {
    return shapeRevealSample;
  }
  const rawFrames = web && web.opacity;
  const frames = Array.isArray(rawFrames)
    ? (rawFrames as WebKeyframeValue[])
    : [];
  const rawFillFrames = web && web.fill;
  const fillFrames = Array.isArray(rawFillFrames)
    ? (rawFillFrames as WebKeyframeValue[])
    : undefined;
  const rawOpacityMultiplierFrames = web && web.opacityMultiplier;
  const opacityMultiplierFrames = Array.isArray(rawOpacityMultiplierFrames)
    ? (rawOpacityMultiplierFrames as WebKeyframeValue[])
    : undefined;
  const rawScaleFrames = web && web.scale;
  const scaleFrames = Array.isArray(rawScaleFrames)
    ? (rawScaleFrames as WebKeyframeValue[])
    : undefined;
  const steps = parseStepsEasing(animation.easing);

  if (frames.length === 0) {
    return { opacity: SOURCE_BASE_OPACITY };
  }

  if (steps) {
    const stepMs = duration / steps;
    const stepIndex = Math.floor(cycleElapsed / stepMs) % frames.length;
    const stepProgress = (cycleElapsed % stepMs) / stepMs;
    const opacity = Number(keyframeValueAt(frames[stepIndex]));
    const fill = fillFrames
      ? keyframeFillAt(
          fillFrames,
          (stepIndex + stepProgress) / Math.max(1, frames.length - 1),
        )
      : undefined;
    const scale = scaleFrames
      ? keyframeOpacityAt(
          scaleFrames,
          (stepIndex + stepProgress) / Math.max(1, frames.length - 1),
        )
      : undefined;
    const opacityMultiplier = opacityMultiplierFrames
      ? keyframeOpacityAt(
          opacityMultiplierFrames,
          (stepIndex + stepProgress) / Math.max(1, frames.length - 1),
        )
      : undefined;
    return { opacity, fill, opacityMultiplier, scale };
  }

  const linearPhase = cycleElapsed / duration;
  const easedPhase =
    animation.easing === 'ease-in-out'
      ? easeInOut(linearPhase)
      : linearPhase;
  const opacity = keyframeOpacityAt(frames, easedPhase);
  const fill = fillFrames ? keyframeFillAt(fillFrames, easedPhase) : undefined;
  const scale = scaleFrames
    ? keyframeOpacityAt(scaleFrames, easedPhase)
    : undefined;
  const opacityMultiplier = opacityMultiplierFrames
    ? keyframeOpacityAt(opacityMultiplierFrames, easedPhase)
    : undefined;
  return { opacity, fill, opacityMultiplier, scale };
};

const rowMajorIndex = (row: number, col: number) => row * MATRIX_SIZE + col;

const matrixManhattanDistance = (row: number, col: number) =>
  Math.abs(row - 2) + Math.abs(col - 2);

const cloneCssBlendKeyframe = (
  frame: DotMatrixCssBlendKeyframe
): DotMatrixCssBlendKeyframe => ({
  cssBlend: { ...frame.cssBlend },
  offset: frame.offset,
});

const cloneNumericKeyframe = (frame: WebKeyframeValue): WebKeyframeValue => {
  if (typeof frame === 'number') return frame;
  if (isCssBlendKeyframe(frame)) return cloneCssBlendKeyframe(frame);
  if (typeof frame === 'object' && frame !== null && 'value' in frame) {
    return { ...frame };
  }
  return frame;
};

export const closeOpacityLoop = (
  frames: WebKeyframeValue[]
): WebKeyframeValue[] => {
  if (frames.length < 2) return frames;
  const closed = frames.map((frame) => cloneNumericKeyframe(frame));
  const first = closed[0];
  const last = closed[closed.length - 1];
  if (isCssBlendKeyframe(first) && isCssBlendKeyframe(last)) {
    last.cssBlend = { ...first.cssBlend };
    last.offset = 1;
    return closed;
  }
  const firstValue = keyframeNumericValue(first);
  if (typeof last === 'number') {
    closed[closed.length - 1] = firstValue;
  } else if (typeof last === 'object' && last !== null && 'value' in last) {
    last.value = firstValue;
    last.offset = 1;
  }
  return closed;
};

export const closeCssBlendLoop = (
  frames: WebKeyframeValue[]
): WebKeyframeValue[] => {
  if (frames.length < 2) return frames;
  const first = frames[0];
  if (!isCssBlendKeyframe(first)) {
    return closeOpacityLoop(frames);
  }
  const closed = frames.map((frame) => cloneNumericKeyframe(frame));
  const closedFirst = closed[0] as DotMatrixCssBlendKeyframe;
  const closedLast = closed[closed.length - 1] as DotMatrixCssBlendKeyframe;
  closedLast.cssBlend = { ...closedFirst.cssBlend };
  closedLast.offset = 1;
  return closed;
};

const matrixSourceStyle = (
  targets: any,
  _entity: QRCodeEntity,
  from: number,
  duration: number,
  opacity: WebKeyframeValue[],
  easing: string = 'linear'
): DotMatrixAnimationFrame => ({
  targets,
  from,
  duration,
  easing,
  web: {
    opacity: opacity as any,
  },
});

const matrixMotionStyle = (
  targets: any,
  from: number,
  duration: number,
  opacity: WebKeyframeValue[],
  scale: WebKeyframeValue[],
  easing: string = 'linear',
): DotMatrixAnimationFrame => ({
  targets,
  from,
  duration,
  easing,
  web: {
    opacity: opacity as any,
    scale: scale as any,
  },
});

const scaleKeyframe = (offset: number, value: number) => ({ offset, value });

const matrixEntityAnimation = (
  targets: any,
  entity: QRCodeEntity,
  duration: number = 520
) =>
  matrixSourceStyle(targets, entity, 0, duration, [1, 0.86, 1], 'ease-in-out');

const trBlPathNormFromCoord = (row: number, col: number) =>
  (row + (MATRIX_LAST - col)) / (MATRIX_LAST * 2);

const ConfettiPop: QRCodeAnimation = (targets, x, y, count, entity) => {
  const seed = coordinateSeed(x, y, count);
  const scatterDelay = ((seed % 13) * 28 + ((x * y) % 7) * 18) % 420;
  const finderDelay = isFinderPulseEntity(entity) ? 48 : scatterDelay;
  return {
    targets,
    from: entity === QRCodeEntity.Module ? scatterDelay : finderDelay,
    duration: isFinderPulseEntity(entity) ? 760 : 620,
    easing: 'cubic-bezier(0.175, 0.885, 0.320, 1.275)',
    web: {
      opacity:
        entity === QRCodeEntity.Module ? [0, 1, 0.82, 1] : [1, 0.72, 1],
      scale:
        entity === QRCodeEntity.Module
          ? [0.08, 1.36, 0.88, 1]
          : [0.86, 1.18, 0.97, 1],
    },
  };
};

const SpiralBloom: QRCodeAnimation = (targets, x, y, count, entity) => {
  const { adjustedX, adjustedY } = innermostPoint(x, y, count, entity);
  const center = count / 2;
  const angle = Math.atan2(adjustedY - center, adjustedX - center);
  const normalizedAngle = (angle + Math.PI) / (Math.PI * 2);
  const distanceFromCenter = distanceBetween(
    adjustedX,
    adjustedY,
    center,
    center
  );
  return {
    targets,
    from: normalizedAngle * 520 + distanceFromCenter * 14,
    duration: entity === QRCodeEntity.Icon ? 940 : 720,
    easing: 'cubic-bezier(0.190, 1.000, 0.220, 1.000)',
    web: {
      opacity: entity === QRCodeEntity.Module ? [0, 1] : [0.72, 1],
      scale:
        entity === QRCodeEntity.Module
          ? [0.12, 1.28, 0.94, 1]
          : [0.76, 1.12, 0.98, 1],
    },
  };
};

const BubbleCascade: QRCodeAnimation = (targets, x, y, count, entity) => {
  const center = count / 2;
  const columnDrift = Math.abs(x - center) * 8;
  const bubbleOffset = (coordinateSeed(x, y, count) % 5) * 32;
  return {
    targets,
    from:
      entity === QRCodeEntity.Module
        ? (count - y) * 22 + columnDrift + bubbleOffset
        : 120,
    duration: entity === QRCodeEntity.Icon ? 1040 : 820,
    easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
    web: {
      opacity: entity === QRCodeEntity.Module ? [0, 0.92, 1] : [1, 0.76, 1],
      scale:
        entity === QRCodeEntity.Module
          ? [0.22, 1.22, 0.9, 1.08, 1]
          : [0.84, 1.1, 0.97, 1],
    },
  };
};

const KaleidoPulse: QRCodeAnimation = (targets, x, y, count, entity) => {
  const center = count / 2;
  const mirroredX = Math.min(x, count - x);
  const mirroredY = Math.min(y, count - y);
  const quadrantPulse = Math.abs(mirroredX - mirroredY) * 24;
  const centerPull = distanceBetween(x, y, center, center) * 5;
  return {
    targets,
    from:
      entity === QRCodeEntity.Module
        ? quadrantPulse + centerPull
        : Math.max(0, quadrantPulse - 80),
    duration: isFinderPulseEntity(entity) ? 980 : 760,
    easing: 'cubic-bezier(0.445, 0.050, 0.550, 0.950)',
    web: {
      opacity: entity === QRCodeEntity.Module ? [1, 0.58, 1, 0.84, 1] : [1, 0.7, 1],
      scale:
        entity === QRCodeEntity.Module
          ? [1, 0.68, 1.24, 0.92, 1]
          : [1, 0.9, 1.14, 1],
    },
  };
};

const FireflyTwinkle: QRCodeAnimation = (targets, x, y, count, entity) => {
  const seed = coordinateSeed(x, y, count);
  const constellationDelay = ((seed * 29) % 23) * 24;
  const distanceFromCenter = distanceBetween(x, y, count / 2, count / 2);
  return {
    targets,
    from:
      entity === QRCodeEntity.Module
        ? constellationDelay + distanceFromCenter * 7
        : constellationDelay * 0.4,
    duration: entity === QRCodeEntity.Icon ? 1280 : 980,
    easing: 'cubic-bezier(0.445, 0.050, 0.550, 0.950)',
    web: {
      opacity:
        entity === QRCodeEntity.Module
          ? [1, 0.48, 1, 0.72, 1]
          : [1, 0.74, 1, 0.88, 1],
      scale:
        entity === QRCodeEntity.Module
          ? [1, 0.76, 1.18, 0.94, 1]
          : [1, 0.96, 1.08, 1],
    },
  };
};

const MagneticRipple: QRCodeAnimation = (targets, x, y, count, entity) => {
  const { adjustedX, adjustedY } = innermostPoint(x, y, count, entity);
  const leftPull = distanceBetween(
    adjustedX,
    adjustedY,
    count * 0.18,
    count * 0.72
  );
  const rightPull = distanceBetween(
    adjustedX,
    adjustedY,
    count * 0.82,
    count * 0.28
  );
  const closestPull = Math.min(leftPull, rightPull);
  const polarity = leftPull < rightPull ? 0 : 120;
  return {
    targets,
    from: closestPull * 17 + polarity,
    duration: isFinderPulseEntity(entity) ? 920 : 740,
    easing: 'cubic-bezier(0.190, 1.000, 0.220, 1.000)',
    web: {
      opacity: entity === QRCodeEntity.Module ? [1, 0.62, 1] : [1, 0.78, 1],
      scale:
        entity === QRCodeEntity.Module
          ? [1, 0.78, 1.2, 0.96, 1]
          : [1, 0.9, 1.12, 1],
    },
  };
};

const ParallaxTiles: QRCodeAnimation = (targets, x, y, count, entity) => {
  const tileX = Math.floor((x / Math.max(1, count)) * 6);
  const tileY = Math.floor((y / Math.max(1, count)) * 6);
  const tileDepth = (tileX + tileY) % 2;
  const tileDelay = (tileX * 73 + tileY * 41) % 420;
  return {
    targets,
    from:
      entity === QRCodeEntity.Module
        ? tileDelay + tileDepth * 120
        : 80 + tileDepth * 60,
    duration: entity === QRCodeEntity.Icon ? 980 : 760,
    easing: 'cubic-bezier(0.175, 0.885, 0.320, 1.275)',
    web: {
      opacity:
        entity === QRCodeEntity.Module ? [0.18, 1, 0.84, 1] : [1, 0.74, 1],
      scale:
        entity === QRCodeEntity.Module
          ? tileDepth === 0
            ? [0.42, 1.22, 0.95, 1]
            : [1.28, 0.82, 1.1, 1]
          : [0.86, 1.1, 0.98, 1],
    },
  };
};

const PREMIUM_GRID_SIZE = 7;
const PREMIUM_GRID_LAST = PREMIUM_GRID_SIZE - 1;

const premiumGridBand = (value: number, count: number) =>
  clamp(
    Math.floor((value / Math.max(1, count)) * PREMIUM_GRID_SIZE),
    0,
    PREMIUM_GRID_LAST
  );

const premiumGridCoord = (x: number, y: number, count: number) => ({
  row: premiumGridBand(y, count),
  col: premiumGridBand(x, count),
});

const premiumDiagonalSnakeOrder = (row: number, col: number) => {
  let order = 0;
  for (let diagonal = 0; diagonal <= PREMIUM_GRID_LAST * 2; diagonal++) {
    const rowStart = Math.max(0, diagonal - PREMIUM_GRID_LAST);
    const rowEnd = Math.min(PREMIUM_GRID_LAST, diagonal);
    if (diagonal % 2 === 0) {
      for (let r = rowEnd; r >= rowStart; r--) {
        if (r === row && diagonal - r === col) return order;
        order++;
      }
    } else {
      for (let r = rowStart; r <= rowEnd; r++) {
        if (r === row && diagonal - r === col) return order;
        order++;
      }
    }
  }
  return order;
};

const ConstellationTrace: QRCodeAnimation = (targets, x, y, count, entity) => {
  const { row, col } = premiumGridCoord(x, y, count);
  const seed = coordinateSeed(x, y, count);
  const diagonalOrder = premiumDiagonalSnakeOrder(row, col);
  const elbowOrder =
    row <= 3
      ? row * PREMIUM_GRID_SIZE + Math.abs(col - 1) * 2
      : (PREMIUM_GRID_LAST - row) * PREMIUM_GRID_SIZE +
        Math.abs(col - 5) * 2 +
        18;
  const ladderOrder =
    col * PREMIUM_GRID_SIZE + (col % 2 === 0 ? row : PREMIUM_GRID_LAST - row);
  const routeOrder =
    seed % 3 === 0 ? diagonalOrder : seed % 3 === 1 ? elbowOrder : ladderOrder;
  const sparkleOffset = (seed % 4) * 22;
  return {
    targets,
    from:
      entity === QRCodeEntity.Module
        ? routeOrder * 12 + sparkleOffset
        : Math.min(row, col) * 36,
    duration: entity === QRCodeEntity.Icon ? 1240 : 940,
    easing: 'steps(7, end)',
    web: {
      opacity:
        entity === QRCodeEntity.Module
          ? [1, 0.46, 1, 0.6, 1, 0.82, 1]
          : [1, 0.72, 1, 0.86, 1],
      scale:
        entity === QRCodeEntity.Module
          ? [1, 0.7, 1.22, 0.88, 1.08, 0.98, 1]
          : [1, 0.94, 1.08, 1],
    },
  };
};

const ApertureReveal: QRCodeAnimation = (targets, x, y, count, entity) => {
  const { row, col } = premiumGridCoord(x, y, count);
  const edgeDepth = Math.min(row, col, PREMIUM_GRID_LAST - row, PREMIUM_GRID_LAST - col);
  const verticalBlade = Math.abs(col - 3);
  const horizontalBlade = Math.abs(row - 3);
  const bladeOffset =
    row % 2 === 0 ? verticalBlade * 30 : horizontalBlade * 30 + 42;
  const interlockOffset = (row + col) % 2 === 0 ? 0 : 68;
  return {
    targets,
    from:
      entity === QRCodeEntity.Module
        ? edgeDepth * 130 + bladeOffset + interlockOffset
        : 180,
    duration: entity === QRCodeEntity.Icon ? 1040 : 860,
    easing: 'steps(6, end)',
    web: {
      opacity:
        entity === QRCodeEntity.Module ? [0, 0.72, 1, 0.82, 1] : [0.78, 1],
      scale:
        entity === QRCodeEntity.Module
          ? [0.46, 1.12, 0.94, 1.04, 1]
          : [0.78, 1.12, 0.98, 1],
    },
  };
};

const LensFocus: QRCodeAnimation = (targets, x, y, count, entity) => {
  const { row, col } = premiumGridCoord(x, y, count);
  const outerRow = row === 0 || row === PREMIUM_GRID_LAST;
  const outerCol = col === 0 || col === PREMIUM_GRID_LAST;
  const innerGrid = row >= 2 && row <= 4 && col >= 2 && col <= 4;
  const focusZone = outerRow && outerCol ? 0 : outerRow || outerCol ? 1 : innerGrid ? 2 : 3;
  const quadrant = (row > 3 ? 2 : 0) + (col > 3 ? 1 : 0);
  const settleOffset = (coordinateSeed(x, y, count) % 4) * 18;
  const anchorLead = isFinderPulseEntity(entity) ? 0 : 120;
  return {
    targets,
    from:
      entity === QRCodeEntity.Module
        ? focusZone * 116 + quadrant * 34 + settleOffset
        : anchorLead,
    duration: isFinderPulseEntity(entity) ? 940 : 780,
    easing: 'cubic-bezier(0.190, 1.000, 0.220, 1.000)',
    web: {
      opacity:
        entity === QRCodeEntity.Module
          ? [0.5, 0.86, 1, 0.78, 1]
          : [1, 0.66, 1, 0.9, 1],
      scale:
        entity === QRCodeEntity.Module
          ? [0.72, 1.14, 0.94, 1.04, 1]
          : [1, 1.18, 0.96, 1.06, 1],
    },
  };
};

const ReceiptPrint: QRCodeAnimation = (targets, x, y, count, entity) => {
  const printBand = clamp(Math.floor((y / Math.max(1, count)) * 12), 0, 11);
  const printHead = clamp(Math.floor((x / Math.max(1, count)) * 4), 0, 3);
  const paperGrain = (coordinateSeed(x, y, count) % 5) * 16;
  return {
    targets,
    from:
      entity === QRCodeEntity.Module
        ? printBand * 82 + printHead * 22 + paperGrain
        : printBand * 24,
    duration: entity === QRCodeEntity.Icon ? 980 : 690,
    easing: 'cubic-bezier(0.230, 1.000, 0.320, 1.000)',
    web: {
      opacity:
        entity === QRCodeEntity.Module
          ? [0.14, 0.42, 1, 0.86, 1]
          : [0.64, 1, 0.88, 1],
      scale:
        entity === QRCodeEntity.Module
          ? [0.84, 0.96, 1.08, 0.98, 1]
          : [0.9, 1.08, 0.98, 1],
    },
  };
};

const FlipClock: QRCodeAnimation = (targets, x, y, count, entity) => {
  const panelCol = clamp(Math.floor((x / Math.max(1, count)) * 5), 0, 4);
  const panelRow = clamp(Math.floor((y / Math.max(1, count)) * 4), 0, 3);
  const panelOrder = panelRow * 5 + (panelRow % 2 === 0 ? panelCol : 4 - panelCol);
  const columnAlternate = panelCol % 2 === 0 ? 0 : 70;
  const splitOffset = (premiumGridBand(y, count) % 2) * 32;
  return {
    targets,
    from:
      entity === QRCodeEntity.Module
        ? panelOrder * 48 + columnAlternate + splitOffset
        : 140,
    duration: entity === QRCodeEntity.Icon ? 1040 : 760,
    easing: 'cubic-bezier(0.175, 0.885, 0.320, 1.275)',
    web: {
      opacity:
        entity === QRCodeEntity.Module
          ? [0.22, 0.7, 1, 0.88, 1]
          : [0.72, 1, 0.86, 1],
      scale:
        entity === QRCodeEntity.Module
          ? [0.58, 1.2, 0.82, 1.08, 1]
          : [0.84, 1.12, 0.96, 1],
    },
  };
};

const WaveInterference: QRCodeAnimation = (targets, x, y, _count, entity) => {
  const waveField =
    Math.sin(x * 0.9) + Math.sin(y * 0.9) + Math.sin((x + y) * 0.6);
  const normalizedWave = (waveField + 3) / 6;
  const shimmerDelay = normalizedWave * 520 + hashNoise(x, y, 41) * 80;
  return {
    targets,
    from: entity === QRCodeEntity.Module ? shimmerDelay : shimmerDelay * 0.35,
    duration: entity === QRCodeEntity.Icon ? 1080 : 860,
    easing: 'cubic-bezier(0.445, 0.050, 0.550, 0.950)',
    web: {
      opacity:
        entity === QRCodeEntity.Module
          ? [0.42, 0.78, 1, 0.86, 1]
          : [0.74, 1, 0.9, 1],
      scale:
        entity === QRCodeEntity.Module
          ? [0.88, 1.14, 0.96, 1.05, 1]
          : [0.94, 1.08, 1],
    },
  };
};

const QuantumMaterialize: QRCodeAnimation = (targets, x, y, count, entity) => {
  const seed = coordinateSeed(x, y, count);
  const phaseDelay = hashNoise(x, y, seed % 97) * 640;
  const jitterX = (hashNoise(x, y, 13) - 0.5) * 3;
  const jitterY = (hashNoise(x, y, 29) - 0.5) * 3;
  return {
    targets,
    from: entity === QRCodeEntity.Module ? phaseDelay : phaseDelay * 0.25,
    duration: entity === QRCodeEntity.Icon ? 1120 : 920,
    easing: 'steps(8, end)',
    web: {
      opacity:
        entity === QRCodeEntity.Module
          ? [0, 1, 0.15, 1, 0.4, 1]
          : [0.5, 1, 0.7, 1],
      scale:
        entity === QRCodeEntity.Module
          ? [0.7, 1.1, 0.9, 1.04, 1]
          : [0.9, 1.06, 1],
      x:
        entity === QRCodeEntity.Module
          ? [jitterX, -jitterX * 0.6, jitterX * 0.3, 0]
          : [jitterX * 0.4, 0],
      y:
        entity === QRCodeEntity.Module
          ? [jitterY, -jitterY * 0.6, jitterY * 0.3, 0]
          : [jitterY * 0.4, 0],
      filter:
        entity === QRCodeEntity.Module
          ? [
              'brightness(1.35)',
              'brightness(1.65)',
              'brightness(0.88)',
              'brightness(1)',
            ]
          : ['brightness(1.12)', 'brightness(1)'],
    },
  };
};

const MagneticSnap: QRCodeAnimation = (targets, x, y, count, entity) => {
  const noise = hashNoise(x, y, 73);
  const scatterX =
    (hashNoise(x, y, 11) - 0.5) *
    (entity === QRCodeEntity.Module ? 22 : 10);
  const scatterY =
    (hashNoise(x, y, 37) - 0.5) *
    (entity === QRCodeEntity.Module ? 22 : 10);
  const spin =
    (hashNoise(x, y, 53) - 0.5) *
    (entity === QRCodeEntity.Module ? 48 : 20);
  const hue = Math.round((noise - 0.5) * 40);
  const snapDelay = noise * 480 + hashNoise(x, y, count) * 120;
  return {
    targets,
    from: entity === QRCodeEntity.Module ? snapDelay : snapDelay * 0.3,
    duration: isFinderPulseEntity(entity) ? 880 : 740,
    easing: 'cubic-bezier(0.175, 0.885, 0.320, 1.275)',
    web: {
      opacity:
        entity === QRCodeEntity.Module
          ? [0.2, 0.6, 1, 0.92, 1]
          : [0.65, 1, 0.9, 1],
      scale:
        entity === QRCodeEntity.Module
          ? [0.5, 1.24, 0.92, 1.06, 1]
          : [0.82, 1.12, 1],
      x:
        entity === QRCodeEntity.Module
          ? [scatterX, scatterX * 0.35, -scatterX * 0.08, 0]
          : [scatterX * 0.4, 0],
      y:
        entity === QRCodeEntity.Module
          ? [scatterY, scatterY * 0.35, -scatterY * 0.08, 0]
          : [scatterY * 0.4, 0],
      rotate:
        entity === QRCodeEntity.Module
          ? [spin, spin * 0.4, -spin * 0.15, 0]
          : [spin * 0.5, 0],
      filter:
        entity === QRCodeEntity.Module
          ? [
              `hue-rotate(${hue}deg) brightness(0.88)`,
              `hue-rotate(${-hue}deg) brightness(1.45)`,
              'hue-rotate(0deg) brightness(1)',
            ]
          : [`hue-rotate(${hue}deg)`, 'hue-rotate(0deg) brightness(1)'],
    },
  };
};

const HoloFlicker: QRCodeAnimation = (targets, x, y, count, entity) => {
  const seed = coordinateSeed(x, y, count);
  const flickerDelay = (seed % 19) * 22;
  const hueShift = (seed % 5) * 18;
  return {
    targets,
    from:
      entity === QRCodeEntity.Module ? flickerDelay : flickerDelay * 0.3,
    duration: entity === QRCodeEntity.Module ? 1020 : 1140,
    easing: 'cubic-bezier(0.445, 0.050, 0.550, 0.950)',
    web: {
      opacity:
        entity === QRCodeEntity.Module
          ? [1, 0.44, 1, 0.68, 1, 0.88, 1]
          : [1, 0.78, 1],
      scale:
        entity === QRCodeEntity.Module
          ? [1, 1.08, 0.94, 1.12, 0.98, 1.04, 1]
          : [1, 1.04, 1],
      filter:
        entity === QRCodeEntity.Module
          ? [
              'brightness(1) hue-rotate(0deg)',
              `brightness(1.6) hue-rotate(${hueShift}deg)`,
              'brightness(0.85) hue-rotate(0deg)',
              `brightness(1.3) hue-rotate(${-hueShift * 0.5}deg)`,
              'brightness(1) hue-rotate(0deg)',
            ]
          : ['brightness(1)', 'brightness(1.2)', 'brightness(1)'],
    },
  };
};

const SignalGlitch: QRCodeAnimation = (targets, x, y, count, entity) => {
  const rowBand = Math.floor(y) % 5;
  const seed = coordinateSeed(x, y, count);
  const glitchDelay = hashNoise(x, y, rowBand * 17) * 520 + rowBand * 36;
  const jumpX =
    (hashNoise(x, y, seed % 41) - 0.5) *
    (entity === QRCodeEntity.Module ? 16 : 8);
  const rgbShift = ((seed % 7) - 3) * 14;
  return {
    targets,
    from: entity === QRCodeEntity.Module ? glitchDelay : glitchDelay * 0.28,
    duration: entity === QRCodeEntity.Icon ? 980 : 760,
    easing: 'steps(6, end)',
    web: {
      opacity:
        entity === QRCodeEntity.Module
          ? [0.35, 1, 0.2, 1, 0.55, 1]
          : [0.7, 1, 0.85, 1],
      scale:
        entity === QRCodeEntity.Module
          ? [1, 1.06, 0.94, 1.02, 1]
          : [1, 1.04, 1],
      x:
        entity === QRCodeEntity.Module
          ? [jumpX, -jumpX * 0.7, jumpX * 0.4, 0]
          : [jumpX * 0.5, 0],
      filter:
        entity === QRCodeEntity.Module
          ? [
              `hue-rotate(${rgbShift}deg) brightness(1.2)`,
              `hue-rotate(${-rgbShift}deg) brightness(1.45)`,
              `hue-rotate(${rgbShift * 0.5}deg) brightness(0.92)`,
              'hue-rotate(0deg) brightness(1)',
            ]
          : [`hue-rotate(${rgbShift}deg)`, 'hue-rotate(0deg)'],
    },
  };
};

const ShockwaveJolt: QRCodeAnimation = (targets, x, y, _count, entity) => {
  const clusterId = Math.floor(hashNoise(x, y, 91) * 9);
  const clusterDelay = clusterId * 58 + hashNoise(x, y, clusterId + 3) * 140;
  const punch = entity === QRCodeEntity.Module ? 1.3 : 1.14;
  return {
    targets,
    from: entity === QRCodeEntity.Module ? clusterDelay : clusterDelay * 0.32,
    duration: isFinderPulseEntity(entity) ? 920 : 700,
    easing: 'cubic-bezier(0.445, 0.050, 0.550, 0.950)',
    web: {
      opacity:
        entity === QRCodeEntity.Module
          ? [0.3, 1, 0.65, 1]
          : [0.75, 1, 0.92, 1],
      scale:
        entity === QRCodeEntity.Module
          ? [0.82, punch, 0.85, 1.08, 1]
          : [0.92, punch, 0.96, 1],
      filter:
        entity === QRCodeEntity.Module
          ? [
              'brightness(0.9)',
              'brightness(1.55)',
              'brightness(1.08)',
              'brightness(1)',
            ]
          : ['brightness(1.15)', 'brightness(1)'],
    },
  };
};

const TideRise: QRCodeAnimation = (targets, x, y, count, entity) => {
  const riseDelay = (count - y) * 16;
  const waveOffset = Math.sin((x / Math.max(1, count)) * Math.PI * 2) * 18;
  const riseDistance = entity === QRCodeEntity.Module ? 14 : 8;
  return {
    targets,
    from:
      entity === QRCodeEntity.Module
        ? riseDelay + waveOffset
        : riseDelay * 0.3,
    duration: entity === QRCodeEntity.Icon ? 1000 : 760,
    easing: 'cubic-bezier(0.190, 1.000, 0.220, 1.000)',
    web: {
      opacity:
        entity === QRCodeEntity.Module
          ? [0.28, 0.72, 1, 0.92, 1]
          : [0.76, 1, 0.9, 1],
      scale:
        entity === QRCodeEntity.Module
          ? [0.72, 1.12, 0.96, 1.06, 1]
          : [0.88, 1.1, 1],
      y:
        entity === QRCodeEntity.Module
          ? [riseDistance, -2, 1, 0]
          : [riseDistance * 0.5, 0],
    },
  };
};

const GravityCollapse: QRCodeAnimation = (targets, x, y, count, entity) => {
  const seed = coordinateSeed(x, y, count);
  const angle = hashNoise(x, y, seed % 61) * Math.PI * 2;
  const distance =
    entity === QRCodeEntity.Module ? 18 + hashNoise(x, y, 7) * 14 : 10;
  const startX = Math.cos(angle) * distance;
  const startY = Math.sin(angle) * distance;
  const collapseDelay = hashNoise(x, y, 19) * 560 + hashNoise(x, y, 31) * 120;
  const spin = (hashNoise(x, y, 47) - 0.5) * 36;
  return {
    targets,
    from: entity === QRCodeEntity.Module ? collapseDelay : collapseDelay * 0.3,
    duration: entity === QRCodeEntity.Icon ? 1040 : 820,
    easing: 'cubic-bezier(0.190, 1.000, 0.220, 1.000)',
    web: {
      opacity:
        entity === QRCodeEntity.Module
          ? [0.12, 0.52, 0.92, 1, 0.96, 1]
          : [0.55, 0.9, 1],
      scale:
        entity === QRCodeEntity.Module
          ? [0.4, 0.78, 1.16, 0.94, 1.04, 1]
          : [0.72, 1.08, 1],
      x:
        entity === QRCodeEntity.Module
          ? [startX, startX * 0.45, -startX * 0.06, 0]
          : [startX * 0.5, 0],
      y:
        entity === QRCodeEntity.Module
          ? [startY, startY * 0.45, -startY * 0.06, 0]
          : [startY * 0.5, 0],
      rotate:
        entity === QRCodeEntity.Module
          ? [spin, spin * 0.35, -spin * 0.1, 0]
          : [spin * 0.4, 0],
    },
  };
};

const frameMaskCell = (mask: string, row: number, col: number) =>
  mask[rowMajorIndex(row, col)] || '.';

const NeonDrift: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  const path = sampleCellField(fRow, fCol, (row, col) =>
    trBlPathNormFromCoord(row, col)
  );
  const parity = sampleCellField(fRow, fCol, (row, col) =>
    (row + (MATRIX_LAST - col)) % 2
  );
  return matrixSourceStyle(
    targets,
    entity,
    (path * 0.2 + parity * 0.5) * MATRIX_CYCLE_MS,
    MATRIX_CYCLE_MS,
    [
      matrixCssKeyframe(0, 0, 0, 1),
      matrixCssKeyframe(0.14, 1, 0, 0),
      matrixCssKeyframe(0.3, 0, 0, 0.75),
      matrixCssKeyframe(1, 0, 0, 1),
    ]
  );
};

const FluxColumns: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  const position = sampleCellField(fRow, fCol, (row, col) =>
    col % 2 === 0 ? MATRIX_LAST - row : row
  );
  return matrixSourceStyle(
    targets,
    entity,
    position * 0.2 * MATRIX_CYCLE_MS,
    MATRIX_CYCLE_MS,
    [
      matrixCssKeyframe(0, 0, 0, 1),
      matrixCssKeyframe(0.2, 0.3, 0.5, 0.2),
      matrixCssKeyframe(0.4, 0, 0.6, 0.4),
      matrixCssKeyframe(0.6, 0, 0.2, 0.8),
      matrixCssKeyframe(0.8, 0, 0, 1),
      matrixCssKeyframe(1, 0, 0, 1),
    ],
    'steps(5, end)'
  );
};

const EchoRing: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  const ring = sampleCellField(fRow, fCol, (row, col) =>
    clamp(matrixManhattanDistance(row, col), 0, 4)
  );
  const parity = Math.round(ring) % 2;
  return matrixSourceStyle(
    targets,
    entity,
    (ring * 0.14 + parity * 0.03) * MATRIX_CYCLE_MS,
    MATRIX_CYCLE_MS,
    [
      matrixCssKeyframe(0, 0, 0, 1),
      matrixCssKeyframe(0.28, 0.98, 0, 0),
      matrixCssKeyframe(0.56, 0, 1, 0),
      matrixCssKeyframe(0.78, 0.68, 0.32, 0),
      matrixCssKeyframe(1, 0, 0, 1),
    ],
    'ease-in-out'
  );
};

const OriginWave: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  const ring = sampleCellField(fRow, fCol, (row, col) =>
    clamp(Math.abs(row - 1) + Math.abs(col - 1), 0, 6)
  );
  return matrixSourceStyle(
    targets,
    entity,
    ring * 0.16 * MATRIX_CYCLE_MS,
    MATRIX_CYCLE_MS,
    [
      matrixCssKeyframe(0, 0, 0, 1),
      matrixCssKeyframe(0.34, 1, 0, 0),
      matrixCssKeyframe(0.6, 0, 0.5, 0.5),
      matrixCssKeyframe(1, 0, 0, 1),
    ],
    'ease-in-out'
  );
};

const MATRIX_CENTER = 2;

const radialDistanceFromCenter = (row: number, col: number) =>
  Math.hypot(row - MATRIX_CENTER, col - MATRIX_CENTER);

const vortexAnglePhase = (x: number, y: number, count: number) => {
  const center = count / 2;
  const angle = Math.atan2(y - center, x - center);
  return (angle + Math.PI) / (Math.PI * 2);
};

const clockwiseAnglePhase = (x: number, y: number, count: number) =>
  1 - vortexAnglePhase(x, y, count);

const FAN_ROTATE_CYCLE_MS = 3500;

const normalizedRadiusFromCenter = (x: number, y: number, count: number) => {
  const center = count / 2;
  const maxRadius = Math.hypot(center, center);
  const radius = Math.hypot(x - center, y - center);
  return maxRadius > 0 ? clamp(radius / maxRadius, 0, 1) : 0;
};

const fanFieldPhase = (x: number, y: number, count: number) => {
  const center = (count - 1) / 2;
  const normalizedRadius =
    Math.hypot(x - center, y - center) / Math.max(1, Math.hypot(center, center));
  const angle = Math.atan2(y - center, x - center);
  const phase = (angle * 4 + normalizedRadius * 8) / (Math.PI * 2);
  return phase - Math.floor(phase);
};

const dotMotionScale = (x: number, y: number, count: number) => {
  const inward = 1 - normalizedRadiusFromCenter(x, y, count);
  return {
    rest: 0.4 + inward * 0.2,
    peak: 1.1 + inward * 0.45,
  };
};

const motionScaleKeyframes = (rest: number, peak: number) => [
  scaleKeyframe(0, rest),
  scaleKeyframe(0.08, rest * 1.08),
  scaleKeyframe(0.16, peak),
  scaleKeyframe(0.38, peak * 0.94),
  scaleKeyframe(0.5, rest),
  scaleKeyframe(1, rest),
];

const diamondDistanceFromCenter = (row: number, col: number) =>
  Math.abs(row - MATRIX_CENTER) + Math.abs(col - MATRIX_CENTER);

const zigzagOrder = (row: number, col: number) =>
  row * MATRIX_SIZE + (row % 2 === 0 ? col : MATRIX_LAST - col);

const crossBloomDistance = (row: number, col: number) =>
  Math.max(Math.abs(row - MATRIX_CENTER), Math.abs(col - MATRIX_CENTER));

const chevronDistance = (row: number, col: number) =>
  MATRIX_LAST - row + Math.abs(col - MATRIX_CENTER);

const waveRidePhase = (row: number, col: number) =>
  row + Math.sin(col * 1.1) * 0.75;

const cornerDistance = (row: number, col: number) =>
  Math.min(
    row + col,
    row + (MATRIX_LAST - col),
    MATRIX_LAST - row + col,
    MATRIX_LAST - row + (MATRIX_LAST - col)
  );

const RadialExpand: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  const radius = sampleCellField(fRow, fCol, radialDistanceFromCenter);
  return matrixSourceStyle(
    targets,
    entity,
    radius * 0.14 * MATRIX_CYCLE_MS,
    MATRIX_CYCLE_MS,
    [
      matrixCssKeyframe(0, 0, 0, 1),
      matrixCssKeyframe(0.28, 1, 0, 0),
      matrixCssKeyframe(0.52, 0, 0, 1),
      matrixCssKeyframe(1, 0, 0, 1),
    ],
    'ease-in-out'
  );
};

const VortexRotate: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const phase = vortexAnglePhase(x, y, count);
  const { rest, peak } = dotMotionScale(x, y, count);
  return matrixMotionStyle(
    targets,
    phase * MATRIX_CYCLE_MS,
    MATRIX_CYCLE_MS,
    [
      matrixCssKeyframe(0, 0, 0, 1),
      matrixCssKeyframe(0.08, 0.35, 0.45, 0.12),
      matrixCssKeyframe(0.16, 1, 0, 0),
      matrixCssKeyframe(0.38, 1, 0, 0),
      matrixCssKeyframe(0.5, 0, 0.35, 0.15),
      matrixCssKeyframe(1, 0, 0, 1),
    ],
    motionScaleKeyframes(rest, peak),
    'linear',
  );
};

const fanActivityKeyframes = [
  { offset: 0, value: 0.5 },
  { offset: 0.125, value: 0.1464 },
  { offset: 0.25, value: 0 },
  { offset: 0.375, value: 0.1464 },
  { offset: 0.5, value: 0.5 },
  { offset: 0.625, value: 0.8536 },
  { offset: 0.75, value: 1 },
  { offset: 0.875, value: 0.8536 },
  { offset: 1, value: 0.5 },
];

const fanScaleKeyframes = fanActivityKeyframes.map(({ offset, value }) =>
  scaleKeyframe(offset, 0.3 + value * 0.65),
);

const fanOpacityMultiplierKeyframes = fanActivityKeyframes.map(
  ({ offset, value }) => ({ offset, value: 0.5 + value * 0.5 }),
);

const FanRotate: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) {
    return {
      targets,
      duration: FAN_ROTATE_CYCLE_MS,
      web: { opacity: [1], scale: [1] },
    };
  }
  const phase = fanFieldPhase(x, y, count);
  return {
    targets,
    from: -(1 - phase) * FAN_ROTATE_CYCLE_MS,
    duration: FAN_ROTATE_CYCLE_MS,
    easing: 'linear',
    web: {
      opacity: [1],
      opacityMultiplier: fanOpacityMultiplierKeyframes,
      scale: fanScaleKeyframes,
    },
  };
};

const RadiusPing: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  const radius = sampleCellField(fRow, fCol, radialDistanceFromCenter);
  return matrixSourceStyle(
    targets,
    entity,
    radius * 0.18 * MATRIX_CYCLE_MS,
    MATRIX_CYCLE_MS,
    [
      matrixCssKeyframe(0, 0, 0, 1),
      matrixCssKeyframe(0.1, 1, 0, 0),
      matrixCssKeyframe(0.2, 0, 0, 1),
      matrixCssKeyframe(1, 0, 0, 1),
    ],
    'ease-in-out'
  );
};

const DiamondExpand: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  const distance = sampleCellField(fRow, fCol, diamondDistanceFromCenter);
  return matrixSourceStyle(
    targets,
    entity,
    distance * 0.12 * MATRIX_CYCLE_MS,
    MATRIX_CYCLE_MS,
    [
      matrixCssKeyframe(0, 0, 0, 1),
      matrixCssKeyframe(0.3, 1, 0, 0),
      matrixCssKeyframe(0.55, 0, 0, 1),
      matrixCssKeyframe(1, 0, 0, 1),
    ],
    'ease-in-out'
  );
};

const shapeRevealAnimation = (
  targets: any,
  metric: number,
  maxMetric: number,
): DotMatrixAnimationFrame => ({
  targets,
  // Keep the full contour travel inside one cycle. Raw shape metrics scale
  // with the QR size; using them directly starts additional hearts/stars
  // before the first one has left the QR.
  from: (maxMetric > 0 ? metric / maxMetric : 0) * 0.42 * MATRIX_CYCLE_MS,
  duration: MATRIX_CYCLE_MS,
  easing: 'ease-in-out',
  web: {
    opacity: [
      matrixCssKeyframe(0, 0, 0, 1),
      matrixCssKeyframe(0.12, 1, 0, 0),
      matrixCssKeyframe(0.24, 0, 0, 1),
      matrixCssKeyframe(1, 0, 0, 1),
    ],
  },
});

const HeartExpand: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  return shapeRevealAnimation(
    targets,
    heartExpansionMetric(y, x, count),
    heartMaxExpansionMetric(count),
  );
};

const StarExpand: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  return shapeRevealAnimation(
    targets,
    starExpansionMetric(y, x, count),
    starMaxExpansionMetric(count),
  );
};

const RippleExpand: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const ring = rippleRingIndex(y, x, count);
  return matrixSourceStyle(
    targets,
    entity,
    ring * 0.09 * MATRIX_CYCLE_MS,
    MATRIX_CYCLE_MS,
    [
      matrixCssKeyframe(0, 0, 0, 1),
      matrixCssKeyframe(0.07, 1, 0, 0),
      matrixCssKeyframe(0.14, 0.35, 0.45, 0.2),
      matrixCssKeyframe(0.28, 0, 0, 1),
      matrixCssKeyframe(1, 0, 0, 1),
    ],
    'ease-in-out'
  );
};

const ZigzagFlow: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  const order = sampleCellField(fRow, fCol, zigzagOrder);
  return matrixSourceStyle(
    targets,
    entity,
    order * 0.035 * MATRIX_CYCLE_MS,
    MATRIX_CYCLE_MS,
    [
      matrixCssKeyframe(0, 0, 0, 1),
      matrixCssKeyframe(0.12, 0.35, 0.55, 0.1),
      matrixCssKeyframe(0.24, 1, 0, 0),
      matrixCssKeyframe(0.38, 0, 0.5, 0.5),
      matrixCssKeyframe(1, 0, 0, 1),
    ],
    'ease-in-out'
  );
};

const CrossBloom: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  const distance = sampleCellField(fRow, fCol, crossBloomDistance);
  return matrixSourceStyle(
    targets,
    entity,
    distance * 0.14 * MATRIX_CYCLE_MS,
    MATRIX_CYCLE_MS,
    [
      matrixCssKeyframe(0, 0, 0, 1),
      matrixCssKeyframe(0.26, 1, 0, 0),
      matrixCssKeyframe(0.48, 0, 0.55, 0.1),
      matrixCssKeyframe(1, 0, 0, 1),
    ],
    'ease-in-out'
  );
};

const ChevronSweep: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  const distance = sampleCellField(fRow, fCol, chevronDistance);
  return matrixSourceStyle(
    targets,
    entity,
    distance * 0.11 * MATRIX_CYCLE_MS,
    MATRIX_CYCLE_MS,
    [
      matrixCssKeyframe(0, 0, 0, 1),
      matrixCssKeyframe(0.18, 0.4, 0.45, 0.15),
      matrixCssKeyframe(0.32, 1, 0, 0),
      matrixCssKeyframe(0.5, 0, 0.5, 0.5),
      matrixCssKeyframe(1, 0, 0, 1),
    ],
    'ease-in-out'
  );
};

const WaveRide: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  const phase = sampleCellField(fRow, fCol, waveRidePhase);
  return matrixSourceStyle(
    targets,
    entity,
    phase * 0.1 * MATRIX_CYCLE_MS,
    MATRIX_CYCLE_MS,
    [
      matrixCssKeyframe(0, 0, 0, 1),
      matrixCssKeyframe(0.22, 0.55, 0.35, 0.1),
      matrixCssKeyframe(0.4, 1, 0, 0),
      matrixCssKeyframe(0.62, 0, 0.5, 0.5),
      matrixCssKeyframe(1, 0, 0, 1),
    ],
    'ease-in-out'
  );
};

const CornerPop: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  const distance = sampleCellField(fRow, fCol, cornerDistance);
  return matrixSourceStyle(
    targets,
    entity,
    distance * 0.12 * MATRIX_CYCLE_MS,
    MATRIX_CYCLE_MS,
    [
      matrixCssKeyframe(0, 0, 0, 1),
      matrixCssKeyframe(0.16, 0.5, 0.4, 0.1),
      matrixCssKeyframe(0.3, 1, 0, 0),
      matrixCssKeyframe(0.48, 0, 0.45, 0.1),
      matrixCssKeyframe(1, 0, 0, 1),
    ],
    'ease-in-out'
  );
};

const RadialRippleIn: QRCodeAnimation = (targets, x, y, count, entity) => {
  const { adjustedX, adjustedY } = innermostPoint(x, y, count, entity);
  const center = count / 2;
  const distanceFromCenter = distanceBetween(
    adjustedX,
    adjustedY,
    center,
    center
  );

  const waveResistance = 7;

  return {
    targets,
    from: distanceFromCenter * waveResistance,
    easing: 'cubic-bezier(0.445,  0.050, 0.550, 0.950)',
    duration: 1000,
    web: {
      scale: [
        ...(entity === QRCodeEntity.Icon
          ? [
              { offset: 0, value: 1 },
              { offset: 0.1, value: 0.7 },
              { offset: 0.2, value: 1 },
            ]
          : [{ offset: 0, value: 0 }]),
        ...applyToValues(
          radialRippleOscillationKeyframes,
          (x) => 1 + (x / amplitude) * 0.1
        ),
        1,
      ],
      opacity: [
        { offset: 0, value: 0 },
        { offset: 0.05, value: 1 },
      ],
    },
  };
};

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
  return speed > 0 && Number.isFinite(speed)
    ? speed
    : DEFAULT_ANIMATION_SPEED;
};

const dotMatrixOpacitySettings = (settings?: QRCodeAnimationSettings) => ({
  base: clamp(
    Number(
      settings && settings.dotMatrixOpacityBase !== undefined
        ? settings.dotMatrixOpacityBase
        : DEFAULT_DOT_MATRIX_OPACITY_BASE
    ),
    0,
    1
  ),
  mid: clamp(
    Number(
      settings && settings.dotMatrixOpacityMid !== undefined
        ? settings.dotMatrixOpacityMid
        : DEFAULT_DOT_MATRIX_OPACITY_MID
    ),
    0,
    1
  ),
  peak: clamp(
    Number(
      settings && settings.dotMatrixOpacityPeak !== undefined
        ? settings.dotMatrixOpacityPeak
        : DEFAULT_DOT_MATRIX_OPACITY_PEAK
    ),
    0,
    1
  ),
});

const resolveCssBlendOpacity = (
  blend: DotMatrixCssBlendKeyframe['cssBlend'],
  settings?: QRCodeAnimationSettings
) => {
  const { base, mid, peak } = dotMatrixOpacitySettings(settings);
  return clamp(
    blend.peak * peak + blend.mid * mid + blend.base * base,
    0,
    1
  );
};

export const resolveDotMatrixKeyframeOpacity = (
  frame: WebKeyframeValue,
  settings?: QRCodeAnimationSettings
) => {
  if (isCssBlendKeyframe(frame)) {
    return resolveCssBlendOpacity(frame.cssBlend, settings);
  }
  const raw =
    typeof frame === 'number'
      ? frame
      : typeof frame === 'object' && frame !== null && 'value' in frame
      ? frame.value
      : 0;
  const { base, mid, peak } = dotMatrixOpacitySettings(settings);
  return remapOpacityToTriplet(raw, base, mid, peak);
};

const remapDotMatrixOpacityValue = (
  value: number,
  settings?: QRCodeAnimationSettings
) => {
  if (!Number.isFinite(value)) return value;
  const { base, mid, peak } = dotMatrixOpacitySettings(settings);
  return remapOpacityToTriplet(clamp(value, 0, 1), base, mid, peak);
};

const remapDotMatrixOpacity = (
  opacity: any,
  settings?: QRCodeAnimationSettings
) => {
  if (!Array.isArray(opacity)) return opacity;
  return opacity.map((frame) => {
    if (isCssBlendKeyframe(frame)) {
      const value = resolveCssBlendOpacity(frame.cssBlend, settings);
      return { offset: frame.offset, value };
    }
    return typeof frame === 'number'
      ? remapDotMatrixOpacityValue(frame, settings)
      : { ...frame, value: remapDotMatrixOpacityValue(frame.value, settings) };
  });
};

const dotMatrixColorForOpacityValue = (
  value: number,
  settings?: QRCodeAnimationSettings
) => {
  const colors = dotMatrixColorSettings(settings);
  if (!colors || !Number.isFinite(value)) return undefined;
  const opacity = clamp(value, 0, 1);
  const { peak } = dotMatrixOpacitySettings(settings);

  if (settings?.dotMatrixColorMode === 'dual') {
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
) =>
  mixHexColors(
    colors.base,
    colors.peak,
    dualAccentMixFromCssBlend(frame.cssBlend),
  );

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

const resolvePeakAccentMix = (
  frame: WebKeyframeValue,
  settings: QRCodeAnimationSettings,
) => {
  if (settings.dotMatrixColorMode === 'dual') {
    if (isCssBlendKeyframe(frame)) {
      return dualAccentMixFromCssBlend(frame.cssBlend);
    }
    const { base, peak } = dotMatrixOpacitySettings(settings);
    return dualAccentMixFromOpacity(
      resolveDotMatrixKeyframeOpacity(frame, settings),
      base,
      peak,
    );
  }

  const { base, peak } = dotMatrixOpacitySettings(settings);
  return dualAccentMixFromOpacity(
    resolveDotMatrixKeyframeOpacity(frame, settings),
    base,
    peak,
  );
};

const fillForPreserveFrame = (
  frame: WebKeyframeValue,
  settings: QRCodeAnimationSettings,
  peakColor: string,
) => (resolvePeakAccentMix(frame, settings) > 0 ? peakColor : PRESERVE_MODULE_FILL);

const remapDotMatrixFill = (
  opacity: any,
  settings?: QRCodeAnimationSettings
) => {
  if (!Array.isArray(opacity)) {
    return undefined;
  }

  if (settings?.preserveModuleFills) {
    const peakColor = settings.dotMatrixColorPeak;
    if (!peakColor) {
      return undefined;
    }

    return opacity.map((frame) => {
      const fill = fillForPreserveFrame(frame, settings, peakColor);
      if (isCssBlendKeyframe(frame)) {
        return { offset: frame.offset, value: fill };
      }
      if (typeof frame === 'number') {
        return fill;
      }
      return { ...frame, value: fill };
    });
  }

  if (!dotMatrixColorSettings(settings)) {
    return undefined;
  }
  const colors = dotMatrixColorSettings(settings)!;
  return opacity.map((frame) => {
    const color =
      settings?.dotMatrixColorMode === 'dual'
        ? isCssBlendKeyframe(frame)
          ? dualColorForCssBlendKeyframe(frame, colors)
          : dualColorForResolvedOpacity(
              resolveDotMatrixKeyframeOpacity(frame, settings),
              settings,
              colors,
            )
        : dotMatrixColorForOpacityValue(
            resolveDotMatrixKeyframeOpacity(frame, settings),
            settings,
          );
    if (isCssBlendKeyframe(frame)) {
      return { offset: frame.offset, value: color };
    }
    if (typeof frame === 'number') {
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
    dotMatrixColorMode: settings?.dotMatrixColorMode ?? 'dual',
  };
};

const applyPresetSettings = (
  animation: DotMatrixAnimationFrame,
  settings: QRCodeAnimationSettings | undefined,
  isDotMatrixPreset: boolean,
  presetName?: AnimationPreset
): DotMatrixAnimationFrame => {
  const resolvedSettings = resolvePresetAnimationSettings(settings, isDotMatrixPreset);
  const speed = safeAnimationSpeed(resolvedSettings);
  const dotMatrixFill = isDotMatrixPreset
    ? remapDotMatrixFill(animation.web && animation.web.opacity, resolvedSettings)
    : undefined;
  const web = isDotMatrixPreset
    ? {
        ...animation.web,
        opacity: remapDotMatrixOpacity(
          animation.web && animation.web.opacity,
          resolvedSettings
        ),
        ...(dotMatrixFill ? { fill: dotMatrixFill } : {}),
      }
    : animation.web;
  return {
    ...animation,
    from:
      typeof animation.from === 'number' ? animation.from / speed : animation.from,
    duration:
      typeof animation.duration === 'number'
        ? animation.duration / speed
        : animation.duration,
    web,
  };
};

const wrapPreset = (
  animation: QRCodeAnimation,
  isDotMatrixPreset: boolean,
  presetName?: AnimationPreset
): QRCodeAnimation => (targets, x, y, count, entity, settings) =>
  applyPresetSettings(
    animation(targets, x, y, count, entity, settings),
    settings,
    isDotMatrixPreset,
    presetName
  );

const resolveAnimationPreset = (name: string) => {
  switch (name) {
    case AnimationPreset.FadeInTopDown:
      return FadeInTopDown;
    case AnimationPreset.FadeInCenterOut:
      return FadeInCenterOut;
    case AnimationPreset.RadialRipple:
      return RadialRipple;
    case AnimationPreset.RadialRippleIn:
      return RadialRippleIn;
    case AnimationPreset.MaterializeIn:
      return MaterializeIn;
    case AnimationPreset.SubtlePulse:
      return SubtlePulse;
    case AnimationPreset.FinderPing:
      return FinderPing;
    case AnimationPreset.SoftMaterialize:
      return SoftMaterialize;
    case AnimationPreset.CenterBloom:
      return CenterBloom;
    case AnimationPreset.CornerSweep:
      return CornerSweep;
    case AnimationPreset.OrbitReveal:
      return OrbitReveal;
    case AnimationPreset.DiamondGlint:
      return DiamondGlint;
    case AnimationPreset.SignalScan:
      return SignalScan;
    case AnimationPreset.ConfettiPop:
      return ConfettiPop;
    case AnimationPreset.SpiralBloom:
      return SpiralBloom;
    case AnimationPreset.BubbleCascade:
      return BubbleCascade;
    case AnimationPreset.KaleidoPulse:
      return KaleidoPulse;
    case AnimationPreset.FireflyTwinkle:
      return FireflyTwinkle;
    case AnimationPreset.MagneticRipple:
      return MagneticRipple;
    case AnimationPreset.ParallaxTiles:
      return ParallaxTiles;
    case AnimationPreset.ConstellationTrace:
      return ConstellationTrace;
    case AnimationPreset.ApertureReveal:
      return ApertureReveal;
    case AnimationPreset.LensFocus:
      return LensFocus;
    case AnimationPreset.ReceiptPrint:
      return ReceiptPrint;
    case AnimationPreset.FlipClock:
      return FlipClock;
    case AnimationPreset.WaveInterference:
      return WaveInterference;
    case AnimationPreset.QuantumMaterialize:
      return QuantumMaterialize;
    case AnimationPreset.MagneticSnap:
      return MagneticSnap;
    case AnimationPreset.HoloFlicker:
      return HoloFlicker;
    case AnimationPreset.SignalGlitch:
      return SignalGlitch;
    case AnimationPreset.ShockwaveJolt:
      return ShockwaveJolt;
    case AnimationPreset.TideRise:
      return TideRise;
    case AnimationPreset.GravityCollapse:
      return GravityCollapse;
    case AnimationPreset.NeonDrift:
      return NeonDrift;
    case AnimationPreset.FluxColumns:
      return FluxColumns;
    case AnimationPreset.EchoRing:
      return EchoRing;
    case AnimationPreset.OriginWave:
      return OriginWave;
    case AnimationPreset.RadialExpand:
      return RadialExpand;
    case AnimationPreset.VortexRotate:
      return VortexRotate;
    case AnimationPreset.FanRotate:
      return FanRotate;
    case AnimationPreset.RadiusPing:
      return RadiusPing;
    case AnimationPreset.DiamondExpand:
      return DiamondExpand;
    case AnimationPreset.HeartExpand:
      return HeartExpand;
    case AnimationPreset.StarExpand:
      return StarExpand;
    case AnimationPreset.RippleExpand:
      return RippleExpand;
    case AnimationPreset.ZigzagFlow:
      return ZigzagFlow;
    case AnimationPreset.CrossBloom:
      return CrossBloom;
    case AnimationPreset.ChevronSweep:
      return ChevronSweep;
    case AnimationPreset.WaveRide:
      return WaveRide;
    case AnimationPreset.CornerPop:
      return CornerPop;
    default:
      throw new Error(`${name} is not a valid AnimationPreset.`);
  }
};

export const getAnimationPreset = (name: string) => {
  const presetName = name as AnimationPreset;
  return wrapPreset(
    resolveAnimationPreset(name),
    dotMatrixAnimationPresets.indexOf(presetName) > -1,
    presetName
  );
};
