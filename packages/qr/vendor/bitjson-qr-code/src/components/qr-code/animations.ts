import { AddAnimationOptions } from 'just-animate/types/lib/core/types';
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
) => AddAnimationOptions;

export interface QRCodeAnimationSettings {
  animationSpeed?: number;
  dotMatrixOpacityBase?: number;
  dotMatrixOpacityMid?: number;
  dotMatrixOpacityPeak?: number;
  dotMatrixColorBase?: string;
  dotMatrixColorMid?: string;
  dotMatrixColorPeak?: string;
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
  PulseLadder = 'PulseLadder',
  CoreSpiral = 'CoreSpiral',
  TwinOrbit = 'TwinOrbit',
  FluxColumns = 'FluxColumns',
  BlockDrop = 'BlockDrop',
  StrobeStack = 'StrobeStack',
  GlyphPulse = 'GlyphPulse',
  CRTGlide = 'CRTGlide',
  EchoRing = 'EchoRing',
  OriginWave = 'OriginWave',
  CoreRotor = 'CoreRotor',
  PrismBloom = 'PrismBloom',
  HelixGlow = 'HelixGlow',
  HelixCore = 'HelixCore',
  InfinityRun = 'InfinityRun',
  MobiusRun = 'MobiusRun',
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
  AnimationPreset.PulseLadder,
  AnimationPreset.CoreSpiral,
  AnimationPreset.BlockDrop,
  AnimationPreset.EchoRing,
  AnimationPreset.MobiusRun,
  AnimationPreset.TwinOrbit,
  AnimationPreset.OriginWave,
  AnimationPreset.PrismBloom,
  AnimationPreset.FluxColumns,
  AnimationPreset.HelixGlow,
  AnimationPreset.HelixCore,
  AnimationPreset.StrobeStack,
  AnimationPreset.CRTGlide,
  AnimationPreset.GlyphPulse,
  AnimationPreset.CoreRotor,
  AnimationPreset.InfinityRun,
];

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

const keyframeOpacityAt = (
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

const rowMajorIndex = (row: number, col: number) => row * MATRIX_SIZE + col;

const matrixManhattanDistance = (row: number, col: number) =>
  Math.abs(row - 2) + Math.abs(col - 2);

const matrixSourceStyle = (
  targets: any,
  _entity: QRCodeEntity,
  from: number,
  duration: number,
  opacity: WebKeyframeValue[],
  easing: string = 'linear'
): AddAnimationOptions => ({
  targets,
  from,
  duration,
  easing,
  web: {
    opacity: opacity as any,
  },
});

const matrixEntityAnimation = (
  targets: any,
  entity: QRCodeEntity,
  duration: number = 520
) =>
  matrixSourceStyle(targets, entity, 0, duration, [1, 0.86, 1], 'ease-in-out');

const steppedOpacityFrames = (
  steps: number,
  opacityForStep: (step: number) => number
): WebKeyframeValue[] => {
  const frameCount = Math.max(1, steps);
  return Array.from({ length: frameCount }, (_, step) => ({
    offset: frameCount === 1 ? 0 : step / (frameCount - 1),
    value: opacityForStep(step),
  }));
};

const phaseOpacityFrames = (
  samples: number,
  opacityForPhase: (phase: number) => number
) =>
  steppedOpacityFrames(samples + 1, (step) =>
    opacityForPhase(step / Math.max(1, samples))
  );

const trBlPathNormFromCoord = (row: number, col: number) =>
  (row + (MATRIX_LAST - col)) / (MATRIX_LAST * 2);

const buildSpiralInwardOrderToIndexMap = () => {
  const order = new Array<number>(MATRIX_CELLS);
  let top = 0;
  let bottom = MATRIX_LAST;
  let left = 0;
  let right = MATRIX_LAST;
  let t = 0;

  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) {
      order[rowMajorIndex(top, c)] = t++;
    }
    for (let r = top + 1; r <= bottom; r++) {
      order[rowMajorIndex(r, right)] = t++;
    }
    if (top < bottom) {
      for (let c = right - 1; c >= left; c--) {
        order[rowMajorIndex(bottom, c)] = t++;
      }
    }
    if (left < right) {
      for (let r = bottom - 1; r > top; r--) {
        order[rowMajorIndex(r, left)] = t++;
      }
    }
    top++;
    bottom--;
    left++;
    right--;
  }
  return order;
};

const SPIRAL_INWARD_ORDER = buildSpiralInwardOrderToIndexMap();

const spiralInwardOrderValue = (index: number) => SPIRAL_INWARD_ORDER[index];

const OUTER_RING_CLOCKWISE_ORDER = [
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [1, 4],
  [2, 4],
  [3, 4],
  [4, 4],
  [4, 3],
  [4, 2],
  [4, 1],
  [4, 0],
  [3, 0],
  [2, 0],
  [1, 0],
].reduce((order, [row, col], index) => {
  order[rowMajorIndex(row, col)] = index;
  return order;
}, new Array<number>(MATRIX_CELLS).fill(-1));

const MIDDLE_RING_ANTI_CLOCKWISE_ORDER = [
  [1, 1],
  [2, 1],
  [3, 1],
  [3, 2],
  [3, 3],
  [2, 3],
  [1, 3],
  [1, 2],
].reduce((order, [row, col], index) => {
  order[rowMajorIndex(row, col)] = index;
  return order;
}, new Array<number>(MATRIX_CELLS).fill(-1));

const outerRingClockwiseOrderValue = (index: number) =>
  OUTER_RING_CLOCKWISE_ORDER[index];

const middleRingAntiClockwiseOrderValue = (index: number) =>
  MIDDLE_RING_ANTI_CLOCKWISE_ORDER[index];

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

const SQUARE2_TAIL = [1, 0.82, 0.68, 0.54, 0.42, 0.31, 0.22, 0.14];
const SQUARE2_BASE_OPACITY = 0.08;
const SQUARE2_ROUTE = (() => {
  const path: number[] = [];
  const push = (row: number, col: number) => path.push(rowMajorIndex(row, col));
  for (let row = 4; row >= 0; row--) push(row, 0);
  push(0, 1);
  push(0, 2);
  for (let row = 1; row <= 4; row++) push(row, 2);
  push(4, 1);
  for (let row = 3; row >= 0; row--) push(row, 1);
  push(0, 2);
  push(0, 3);
  for (let row = 1; row <= 4; row++) push(row, 3);
  push(4, 2);
  for (let row = 3; row >= 0; row--) push(row, 2);
  push(0, 3);
  push(0, 4);
  for (let row = 1; row <= 4; row++) push(row, 4);
  return path;
})();

const opacityFromSquare2Tail = (index: number, head: number) => {
  let opacity = SQUARE2_BASE_OPACITY;
  for (let step = 0; step < SQUARE2_ROUTE.length; step++) {
    if (SQUARE2_ROUTE[step] !== index) continue;
    const distance = (head - step + SQUARE2_ROUTE.length) % SQUARE2_ROUTE.length;
    if (distance >= 0 && distance < SQUARE2_TAIL.length) {
      opacity = Math.max(opacity, SQUARE2_TAIL[distance]);
    }
  }
  return opacity;
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
      matrixCssKeyframe(0, 0, 0, 0.5),
      matrixCssKeyframe(0.14, 1, 0, 0),
      matrixCssKeyframe(0.3, 0, 0, 0.75),
      matrixCssKeyframe(1, 0, 0, 0.5),
    ]
  );
};

const PulseLadder: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  return matrixSourceStyle(
    targets,
    entity,
    0,
    1500,
    steppedOpacityFrames(SQUARE2_ROUTE.length, (step) =>
      discreteCellField(fRow, fCol, (row, col) =>
        opacityFromSquare2Tail(rowMajorIndex(row, col), step)
      )
    ),
    'steps(33, end)'
  );
};

const CoreSpiral: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  const order = sampleCellField(fRow, fCol, (row, col) =>
    spiralInwardOrderValue(rowMajorIndex(row, col))
  );
  return matrixSourceStyle(
    targets,
    entity,
    order * 0.04 * MATRIX_CYCLE_MS,
    MATRIX_CYCLE_MS,
    [
      matrixCssKeyframe(0, 0, 0, 0.5),
      matrixCssKeyframe(0.08, 1, 0, 0),
      matrixCssKeyframe(0.16, 0.5, 0.4, 0.1),
      matrixCssKeyframe(0.24, 0.25, 0.45, 0.3),
      matrixCssKeyframe(0.32, 0, 0.5, 0.5),
      matrixCssKeyframe(0.4, 0, 0, 0.75),
      matrixCssKeyframe(1, 0, 0, 0.5),
    ]
  );
};

const twinOrbitDelayNorm = (row: number, col: number) => {
  if (row === 2 && col === 2) return -1;
  const outer = outerRingClockwiseOrderValue(rowMajorIndex(row, col));
  if (outer >= 0) return outer * 0.0625;
  const middle = middleRingAntiClockwiseOrderValue(rowMajorIndex(row, col));
  return middle >= 0 ? middle * 0.125 : -1;
};

const TwinOrbit: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  const delayNorm = sampleCellField(fRow, fCol, twinOrbitDelayNorm);
  const quietKeyframes: WebKeyframeValue[] = [
    matrixCssKeyframe(0, 0, 0, 0.5),
    matrixCssKeyframe(1, 0, 0, 0.5),
  ];
  const ringKeyframes: WebKeyframeValue[] = [
    matrixCssKeyframe(0, 0, 0, 0.5),
    matrixCssKeyframe(0.1, 1, 0, 0),
    matrixCssKeyframe(0.2, 0.45, 0.45, 0.1),
    matrixCssKeyframe(0.3, 0.2, 0.4, 0.4),
    matrixCssKeyframe(0.4, 0, 0, 0.875),
    matrixCssKeyframe(1, 0, 0, 0.5),
  ];
  return matrixSourceStyle(
    targets,
    entity,
    Math.max(0, delayNorm) * MATRIX_CYCLE_MS,
    MATRIX_CYCLE_MS,
    delayNorm < 0 ? quietKeyframes : ringKeyframes
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
      matrixCssKeyframe(0, 0.6, 0.25, 0.15),
      matrixCssKeyframe(0.2, 0.3, 0.5, 0.2),
      matrixCssKeyframe(0.4, 0, 0.6, 0.4),
      matrixCssKeyframe(0.6, 0, 0.2, 0.8),
      matrixCssKeyframe(0.8, 0, 0, 0.625),
      matrixCssKeyframe(1, 0, 0, 0.625),
    ],
    'steps(5, end)'
  );
};

const SQUARE7_FRAME_MASKS = [
  '.....' + '.....' + '.....' + '.....' + 'ooooo',
  '.....' + '.....' + '.....' + 'ooooo' + 'ooooo',
  '.....' + '.....' + 'ooooo' + 'ooooo' + 'ooooo',
  '.....' + 'ooooo' + 'ooooo' + 'ooooo' + 'ooooo',
  'ooooo' + 'ooooo' + 'ooooo' + 'ooooo' + 'ooooo',
  'ccccc' + 'ccccc' + 'ccccc' + 'ccccc' + 'ccccc',
  '.....' + '.....' + '.....' + '.....' + '.....',
  'ccccc' + 'ccccc' + 'ccccc' + 'ccccc' + 'ccccc',
  '.....' + '.....' + '.....' + '.....' + '.....',
  '.....' + '.....' + '.....' + '.....' + '.....',
];
const SQUARE7_FRAME_SEQUENCE = [0, 1, 2, 3, 4, 4, 5, 6, 7, 8, 9];

const blockDropCellOpacity = (row: number, col: number, step: number) => {
  const mask = SQUARE7_FRAME_MASKS[SQUARE7_FRAME_SEQUENCE[step]];
  const cell = frameMaskCell(mask, row, col);
  if (cell === 'o') return 0.42;
  if (cell === 'c') return 0.88;
  return 0.08;
};

const BlockDrop: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  return matrixSourceStyle(
    targets,
    entity,
    0,
    1900,
    steppedOpacityFrames(SQUARE7_FRAME_SEQUENCE.length, (step) =>
      discreteCellField(fRow, fCol, (row, col) => blockDropCellOpacity(row, col, step))
    ),
    'steps(11, end)'
  );
};

const strobeStackCellOpacity = (row: number, col: number, step: number) => {
  const fillLast = MATRIX_SIZE + MATRIX_SIZE - 1;
  const blinkSteps = 4;
  const blinkOpacities = [0.38, 1, 0.38, 1];
  let height = 0;
  let blinkOpacity: number | null = null;
  if (step <= fillLast) {
    height = Math.max(0, Math.min(MATRIX_SIZE, step - col));
  } else if (step < fillLast + 1 + blinkSteps) {
    height = MATRIX_SIZE;
    blinkOpacity = blinkOpacities[step - (fillLast + 1)];
  } else {
    const drainTick = step - (fillLast + 1 + blinkSteps);
    height = Math.max(
      0,
      Math.min(MATRIX_SIZE, MATRIX_SIZE - Math.max(0, drainTick - col))
    );
  }
  const topLitRow = MATRIX_SIZE - height;
  const isLit = height > 0 && row >= topLitRow && row <= MATRIX_LAST;
  if (!isLit) return 0.08;
  if (blinkOpacity !== null) return blinkOpacity;
  return row === topLitRow && height < MATRIX_SIZE ? 1 : 0.52;
};

const StrobeStack: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  const fillLast = MATRIX_SIZE + MATRIX_SIZE - 1;
  const blinkSteps = 4;
  const sequenceLen = fillLast + 1 + blinkSteps + fillLast + 1;
  return matrixSourceStyle(
    targets,
    entity,
    0,
    2000,
    steppedOpacityFrames(sequenceLen, (step) =>
      discreteCellField(fRow, fCol, (row, col) =>
        strobeStackCellOpacity(row, col, step)
      )
    ),
    'steps(24, end)'
  );
};

const square9KeyframesForBit = (bitIndex: number) => {
  const windows = [
    [[0.03846154, 0.30769231], [0.46153846, 0.5], [0.53846154, 0.57692308], [0.65384615, 0.71153846], [0.80769231, 0.84615385], [0.88461538, 0.92307692]],
    [[0.05769231, 0.25], [0.30769231, 0.36538462], [0.5, 0.53846154], [0.57692308, 0.61538462], [0.65384615, 0.76923077], [0.80769231, 0.84615385], [0.88461538, 0.92307692]],
    [[0.07692308, 0.25], [0.36538462, 0.42307692], [0.46153846, 0.5], [0.53846154, 0.57692308], [0.71153846, 0.76923077], [0.80769231, 0.84615385], [0.88461538, 0.92307692]],
    [[0.13461538, 0.30769231], [0.5, 0.53846154], [0.57692308, 0.61538462], [0.65384615, 0.71153846], [0.84615385, 0.88461538], [0.92307692, 0.96153846]],
    [[0.15384615, 0.25], [0.30769231, 0.36538462], [0.46153846, 0.5], [0.53846154, 0.57692308], [0.65384615, 0.76923077], [0.84615385, 0.88461538], [0.92307692, 0.96153846]],
    [[0.17307692, 0.25], [0.36538462, 0.42307692], [0.5, 0.53846154], [0.57692308, 0.61538462], [0.71153846, 0.76923077], [0.84615385, 0.88461538], [0.92307692, 0.96153846]],
  ][bitIndex];
  const frames: WebKeyframeValue[] = [{ offset: 0, value: SOURCE_BASE_OPACITY }];
  windows.forEach(([start, end]) => {
    frames.push({ offset: start, value: SOURCE_BASE_OPACITY });
    frames.push({ offset: start, value: SOURCE_PEAK_OPACITY });
    frames.push({ offset: end, value: SOURCE_PEAK_OPACITY });
    frames.push({ offset: end, value: SOURCE_BASE_OPACITY });
  });
  frames.push({ offset: 1, value: SOURCE_BASE_OPACITY });
  return frames;
};

const square9BitForCell = (row: number, col: number) => {
  if (row < 1 || row > 3) return null;
  const dr = row - 1;
  if (col === 0) return dr;
  if (col === 1) return dr + 3;
  if (col === 3) return dr;
  if (col === 4) return dr + 3;
  return null;
};

const square9StaticOpacityForCell = (row: number, col: number) =>
  row >= 1 && row <= 3 && col === 2 ? 0.12 : 0.08;

const glyphPulseCellOpacity = (row: number, col: number, phase: number) => {
  const bit = square9BitForCell(row, col);
  if (bit === null) return square9StaticOpacityForCell(row, col);
  return keyframeOpacityAt(square9KeyframesForBit(bit), phase);
};

const GlyphPulse: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  return matrixSourceStyle(
    targets,
    entity,
    0,
    5200,
    phaseOpacityFrames(52, (phase) =>
      discreteCellField(fRow, fCol, (row, col) =>
        glyphPulseCellOpacity(row, col, phase)
      )
    ),
    'steps(52, end)'
  );
};

const crtGlideCellOpacity = (
  row: number,
  col: number,
  scanRow: number
) => {
  if (row > scanRow) return 0.08;
  const colGain = 1 + 0.07 * Math.sin(col * 1.72 + scanRow * 0.61);
  const trail = Math.exp(-(scanRow - row) * 0.72);
  return Math.min(1, 0.08 + (1 - 0.08) * trail * colGain);
};

const CRTGlide: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  return matrixSourceStyle(
    targets,
    entity,
    0,
    1500,
    steppedOpacityFrames(MATRIX_SIZE, (scanRow) =>
      crtGlideCellOpacity(fRow, fCol, scanRow)
    ),
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
      matrixCssKeyframe(0, 0, 0, 0.625),
      matrixCssKeyframe(0.28, 0.98, 0, 0),
      matrixCssKeyframe(0.56, 0, 1, 0),
      matrixCssKeyframe(0.78, 0.68, 0.32, 0),
      matrixCssKeyframe(1, 0, 0, 0.625),
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
      matrixCssKeyframe(0, 0, 0, 0.625),
      matrixCssKeyframe(0.34, 1, 0, 0),
      matrixCssKeyframe(0.6, 0, 0.5, 0.5),
      matrixCssKeyframe(1, 0, 0, 0.625),
    ],
    'ease-in-out'
  );
};

const MATRIX_CENTER = 2;

const coreRotorCellOpacity = (row: number, col: number, phase: number) => {
  const outline = Math.min(row, col, MATRIX_LAST - row, MATRIX_LAST - col);
  const distFromCenter = Math.hypot(row - MATRIX_CENTER, col - MATRIX_CENTER);

  if (distFromCenter < 0.55) {
    const hub = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2);
    return 0.08 + hub * 0.56;
  }

  if (outline > 0.12) {
    return 0.08;
  }

  const angle = Math.atan2(row - MATRIX_CENTER, col - MATRIX_CENTER);
  const angularPhase = (angle + Math.PI) / (2 * Math.PI);
  let delta = phase - angularPhase;

  while (delta > 0.5) {
    delta -= 1;
  }
  while (delta < -0.5) {
    delta += 1;
  }

  const wrapped = Math.abs(delta) * 2;
  const bump = Math.max(0, Math.cos(wrapped * Math.PI * 0.62));

  return 0.08 + bump * 0.92;
};

const CoreRotor: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  return matrixSourceStyle(
    targets,
    entity,
    0,
    MATRIX_CYCLE_MS,
    phaseOpacityFrames(56, (phase) =>
      sampleCellField(fRow, fCol, (row, col) =>
        coreRotorCellOpacity(row, col, phase)
      )
    ),
    'linear'
  );
};

const SQUARE14_FRAME_MASKS = [
  'x...x' + '.x.x.' + '..o..' + '.x.x.' + 'x...x',
  '..x..' + '.oxo.' + 'xooox' + '.oxo.' + '..x..',
  '.x.x.' + 'x.o.x' + '..o..' + 'x.o.x' + '.x.x.',
  'x.x.x' + '.o.o.' + 'x.o.x' + '.o.o.' + 'x.x.x',
];
const SQUARE14_FRAME_SEQUENCE = [0, 1, 2, 3, 2, 1];

const prismBloomCellOpacity = (row: number, col: number, step: number) => {
  const mask = SQUARE14_FRAME_MASKS[SQUARE14_FRAME_SEQUENCE[step]];
  const cell = frameMaskCell(mask, row, col);
  if (cell === 'x') return 1;
  if (cell === 'o') return 0.52;
  return 0.08;
};

const PrismBloom: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  return matrixSourceStyle(
    targets,
    entity,
    0,
    1700,
    steppedOpacityFrames(SQUARE14_FRAME_SEQUENCE.length, (step) =>
      discreteCellField(fRow, fCol, (row, col) =>
        prismBloomCellOpacity(row, col, step)
      )
    ),
    'steps(6, end)'
  );
};

const helixGlowCellOpacity = (
  row: number,
  col: number,
  phase: number
) => {
  const rowPhase = phase * 4 * Math.PI + row * 1.24;
  const left = Math.round(1 + Math.sin(rowPhase));
  const right = 4 - left;
  if (col === left || col === right) return 1;
  if (Math.abs(col - left) === 1 || Math.abs(col - right) === 1) return 0.24;
  return 0.08;
};

const HelixGlow: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  return matrixSourceStyle(
    targets,
    entity,
    0,
    1600,
    phaseOpacityFrames(32, (phase) =>
      sampleCellField(fRow, fCol, (row, col) =>
        helixGlowCellOpacity(row, col, phase)
      )
    )
  );
};

const helixCoreCellOpacity = (
  row: number,
  col: number,
  phase: number
) => {
  const rowPhase = phase * 20 * ((Math.PI * 2) / 19) + row * 1.24;
  const left = Math.round(1.5 + 0.5 * Math.sin(rowPhase));
  const right = 4 - left;
  if (col === left || col === right) return 1;
  if (col > left && col < right && Math.cos(rowPhase * 2) > 0.82) return 0.58;
  if (Math.abs(col - left) === 1 || Math.abs(col - right) === 1) return 0.24;
  return 0.08;
};

const HelixCore: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  return matrixSourceStyle(
    targets,
    entity,
    0,
    1400,
    phaseOpacityFrames(20, (phase) =>
      sampleCellField(fRow, fCol, (row, col) =>
        helixCoreCellOpacity(row, col, phase)
      )
    )
  );
};

interface MatrixPoint {
  x: number;
  y: number;
}

const SQUARE19_STEP_COUNT = 48;

const square19GridPoint = (row: number, col: number): MatrixPoint => ({
  x: (col - 2) / 2,
  y: (2 - row) / 2,
});

const square19LoopPoint = (step: number): MatrixPoint => {
  const t = ((step % SQUARE19_STEP_COUNT) / SQUARE19_STEP_COUNT) * Math.PI * 2;
  return { x: Math.sin(t), y: 0.58 * Math.sin(2 * t) };
};

const square19DistanceSq = (a: MatrixPoint, b: MatrixPoint) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
};

const square19HeadInfluence = (dot: MatrixPoint, head: MatrixPoint) =>
  Math.exp(-square19DistanceSq(dot, head) / 0.19);

const InfinityRun: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  const dot = square19GridPoint(fRow, fCol);
  return matrixSourceStyle(
    targets,
    entity,
    0,
    1700,
    steppedOpacityFrames(SQUARE19_STEP_COUNT, (step) => {
      const headA = square19LoopPoint(step);
      const headB = square19LoopPoint(step + SQUARE19_STEP_COUNT / 2);
      const trailA = square19LoopPoint(step - 4);
      const trailB = square19LoopPoint(step + SQUARE19_STEP_COUNT / 2 - 4);
      const lead = Math.max(
        square19HeadInfluence(dot, headA),
        square19HeadInfluence(dot, headB)
      );
      const trail = Math.max(
        square19HeadInfluence(dot, trailA),
        square19HeadInfluence(dot, trailB)
      );
      const centerPulse =
        Math.exp(-(dot.x * dot.x + dot.y * dot.y) / 0.05) * (0.45 + 0.55 * lead);
      return Math.min(1, 0.08 + 0.32 * trail + 0.62 * lead + 0.16 * centerPulse);
    }),
    'steps(48, end)'
  );
};

const SQUARE20_PERIMETER_PATH = [
  rowMajorIndex(0, 0),
  rowMajorIndex(0, 1),
  rowMajorIndex(0, 2),
  rowMajorIndex(0, 3),
  rowMajorIndex(0, 4),
  rowMajorIndex(1, 4),
  rowMajorIndex(2, 4),
  rowMajorIndex(3, 4),
  rowMajorIndex(4, 4),
  rowMajorIndex(4, 3),
  rowMajorIndex(4, 2),
  rowMajorIndex(4, 1),
  rowMajorIndex(4, 0),
  rowMajorIndex(3, 0),
  rowMajorIndex(2, 0),
  rowMajorIndex(1, 0),
];
const SQUARE20_TAIL_BRIGHT = [1, 0.82, 0.64, 0.46, 0.3, 0.18];
const SQUARE20_BACK_TAIL_BRIGHT = [0.38, 0.3, 0.22, 0.14];
const SQUARE20_TWIST_INNER_BY_HEAD_STEP = new Map([
  [0, rowMajorIndex(1, 1)],
  [4, rowMajorIndex(1, 3)],
  [8, rowMajorIndex(3, 3)],
  [12, rowMajorIndex(3, 1)],
]);

const square20OpacityFromTail = (distance: number, tail: number[]) =>
  distance >= 0 && distance < tail.length ? tail[distance] : 0;

const mobiusRunCellOpacity = (row: number, col: number, step: number) => {
  const index = rowMajorIndex(row, col);
  let opacity = 0.08;
  const onLoop = SQUARE20_PERIMETER_PATH.indexOf(index);
  const backHead =
    (step + Math.floor(SQUARE20_PERIMETER_PATH.length / 2)) %
    SQUARE20_PERIMETER_PATH.length;
  if (onLoop >= 0) {
    const forward =
      (step - onLoop + SQUARE20_PERIMETER_PATH.length) %
      SQUARE20_PERIMETER_PATH.length;
    const alongBack =
      (backHead - onLoop + SQUARE20_PERIMETER_PATH.length) %
      SQUARE20_PERIMETER_PATH.length;
    opacity = Math.max(
      opacity,
      square20OpacityFromTail(forward, SQUARE20_TAIL_BRIGHT),
      square20OpacityFromTail(alongBack, SQUARE20_BACK_TAIL_BRIGHT)
    );
  }
  if (SQUARE20_TWIST_INNER_BY_HEAD_STEP.get(step) === index) {
    opacity = Math.max(opacity, 0.52);
  }
  if (index === rowMajorIndex(2, 2) && step % 4 === 0) {
    opacity = Math.max(opacity, 0.55);
  }
  return Math.min(1, opacity);
};

const MobiusRun: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  return matrixSourceStyle(
    targets,
    entity,
    0,
    1600,
    steppedOpacityFrames(SQUARE20_PERIMETER_PATH.length, (step) =>
      discreteCellField(fRow, fCol, (row, col) =>
        mobiusRunCellOpacity(row, col, step)
      )
    ),
    'steps(16, end)'
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
const DEFAULT_DOT_MATRIX_OPACITY_BASE = 0.16;
const DEFAULT_DOT_MATRIX_OPACITY_MID = 0.32;
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

const isCssBlendKeyframe = (
  frame: WebKeyframeValue
): frame is DotMatrixCssBlendKeyframe =>
  typeof frame === 'object' &&
  frame !== null &&
  'cssBlend' in frame &&
  typeof (frame as DotMatrixCssBlendKeyframe).cssBlend === 'object';

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
  const { base, mid, peak } = dotMatrixOpacitySettings(settings);
  const baseCutoff = (base + mid) / 2;
  const peakCutoff = (mid + peak) / 2;
  if (opacity <= baseCutoff) return colors.base;
  if (opacity <= peakCutoff) return colors.mid;
  return colors.peak;
};

const remapDotMatrixFill = (
  opacity: any,
  settings?: QRCodeAnimationSettings
) => {
  if (!Array.isArray(opacity) || !dotMatrixColorSettings(settings)) {
    return undefined;
  }
  return opacity.map((frame) => {
    const resolved = resolveDotMatrixKeyframeOpacity(frame, settings);
    const color = dotMatrixColorForOpacityValue(resolved, settings);
    if (isCssBlendKeyframe(frame)) {
      return { offset: frame.offset, value: color };
    }
    if (typeof frame === 'number') {
      return color;
    }
    return { ...frame, value: color };
  });
};

const applyPresetSettings = (
  animation: AddAnimationOptions,
  settings: QRCodeAnimationSettings | undefined,
  isDotMatrixPreset: boolean
): AddAnimationOptions => {
  const speed = safeAnimationSpeed(settings);
  const dotMatrixFill = isDotMatrixPreset
    ? remapDotMatrixFill(animation.web && animation.web.opacity, settings)
    : undefined;
  const web = isDotMatrixPreset
    ? {
        ...animation.web,
        opacity: remapDotMatrixOpacity(animation.web && animation.web.opacity, settings),
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
  isDotMatrixPreset: boolean
): QRCodeAnimation => (targets, x, y, count, entity, settings) =>
  applyPresetSettings(
    animation(targets, x, y, count, entity, settings),
    settings,
    isDotMatrixPreset
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
    case AnimationPreset.PulseLadder:
      return PulseLadder;
    case AnimationPreset.CoreSpiral:
      return CoreSpiral;
    case AnimationPreset.TwinOrbit:
      return TwinOrbit;
    case AnimationPreset.FluxColumns:
      return FluxColumns;
    case AnimationPreset.BlockDrop:
      return BlockDrop;
    case AnimationPreset.StrobeStack:
      return StrobeStack;
    case AnimationPreset.GlyphPulse:
      return GlyphPulse;
    case AnimationPreset.CRTGlide:
      return CRTGlide;
    case AnimationPreset.EchoRing:
      return EchoRing;
    case AnimationPreset.OriginWave:
      return OriginWave;
    case AnimationPreset.CoreRotor:
      return CoreRotor;
    case AnimationPreset.PrismBloom:
      return PrismBloom;
    case AnimationPreset.HelixGlow:
      return HelixGlow;
    case AnimationPreset.HelixCore:
      return HelixCore;
    case AnimationPreset.InfinityRun:
      return InfinityRun;
    case AnimationPreset.MobiusRun:
      return MobiusRun;
    default:
      throw new Error(`${name} is not a valid AnimationPreset.`);
  }
};

export const getAnimationPreset = (name: string) =>
  wrapPreset(
    resolveAnimationPreset(name),
    dotMatrixAnimationPresets.indexOf(name as AnimationPreset) > -1
  );

export { opacityFromSquare2Tail, SQUARE2_ROUTE, SQUARE2_BASE_OPACITY, SQUARE2_TAIL };
