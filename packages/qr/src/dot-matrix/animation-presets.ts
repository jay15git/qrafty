import {
  innermostPoint,
  distanceBetween,
  underdampedHarmonicOscillationMaximums,
  applyToValues,
  scaleOscillationsToOffset,
  QRCodeEntity,
} from './animation-utils';
import {
  diamondExpansionMetric,
  diamondMaxExpansionMetric,
  heartExpansionMetric,
  heartMaxExpansionMetric,
  starExpansionMetric,
  starMaxExpansionMetric,
} from './shape-metrics';
import {
  clamp,
  coordinateSeed,
  hashNoise,
  matrixFracCoord,
  sampleCellField,
  trBlPathNormFromCoord,
  premiumGridBand,
  premiumGridCoord,
  premiumDiagonalSnakeOrder,
  PREMIUM_GRID_SIZE,
  PREMIUM_GRID_LAST,
  radialDistanceFromCenter,
  chevronDistance,
  RADIAL_MAX_DISTANCE,
  moduleDirectionFromCenter,
  CHEVRON_MAX_DISTANCE,
  MATRIX_LAST,
  NEON_DRIFT_CYCLE_MS,
  FLUX_COLUMNS_CYCLE_MS,
  RADIAL_EXPAND_CYCLE_MS,
  SHAPE_EXPAND_CYCLE_MS,
  CHEVRON_SWEEP_CYCLE_MS,
} from './motion-math';
import {
  matrixCssKeyframe,
  matrixMotionStyle,
  matrixEntityAnimation,
} from './animation-keyframes';
import type { WebKeyframeValue } from './animation-keyframes';
import type {
  DotMatrixAnimationFrame,
  QRCodeAnimation,
} from './animation-types';

export const FadeInTopDown: QRCodeAnimation = (targets, _x, y, _count, _entity) => {
  return {
    targets,
    from: y * 20,
    duration: 300,
    web: {
      opacity: [0, 1],
    },
  };
};

export const FadeInCenterOut: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const MaterializeIn: QRCodeAnimation = (targets, _x, _y, _count, entity) => ({
  targets,
  from: entity === QRCodeEntity.Module ? Math.random() * 200 : 200,
  duration: 200,
  web: {
    opacity: [0, 1],
  },
});

export const SoftMaterialize: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const SubtlePulse: QRCodeAnimation = (targets, _x, _y, _count, entity) => ({
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

export const FinderPing: QRCodeAnimation = (targets, _x, _y, _count, entity) => ({
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

export const CenterBloom: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const CornerSweep: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const RadialRipple: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const OrbitReveal: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const DiamondGlint: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const SignalScan: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const ConfettiPop: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const SpiralBloom: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const BubbleCascade: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const KaleidoPulse: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const FireflyTwinkle: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const MagneticRipple: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const ParallaxTiles: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const ConstellationTrace: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const ApertureReveal: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const LensFocus: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const ReceiptPrint: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const FlipClock: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const WaveInterference: QRCodeAnimation = (targets, x, y, _count, entity) => {
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

export const QuantumMaterialize: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const MagneticSnap: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const HoloFlicker: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const SignalGlitch: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const ShockwaveJolt: QRCodeAnimation = (targets, x, y, _count, entity) => {
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

export const TideRise: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const GravityCollapse: QRCodeAnimation = (targets, x, y, count, entity) => {
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

export const NeonDrift: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  const path = sampleCellField(fRow, fCol, (row, col) =>
    trBlPathNormFromCoord(row, col)
  );
  const parity = sampleCellField(fRow, fCol, (row, col) =>
    (row + (MATRIX_LAST - col)) % 2
  );
  return matrixMotionStyle(
    targets,
    (path * 0.2 + parity * 0.5) * NEON_DRIFT_CYCLE_MS,
    NEON_DRIFT_CYCLE_MS,
    [
      matrixCssKeyframe(0, 0, 0, 1),
      matrixCssKeyframe(0.13, 1, 0, 0),
      matrixCssKeyframe(0.28, 0, 0.5, 0.4),
      matrixCssKeyframe(0.48, 0, 0.12, 0.88),
      matrixCssKeyframe(1, 0, 0, 1),
    ],
    [
      { offset: 0, value: 1 },
      { offset: 0.13, value: 1.14 },
      { offset: 0.3, value: 0.97 },
      { offset: 0.48, value: 1 },
      { offset: 1, value: 1 },
    ],
    'ease-in-out',
    {
      // Surge up-right as the wave front passes, then settle back.
      x: [
        { offset: 0, value: 0 },
        { offset: 0.13, value: -0.34 },
        { offset: 0.42, value: 0.08 },
        { offset: 1, value: 0 },
      ],
      y: [
        { offset: 0, value: 0 },
        { offset: 0.13, value: -0.34 },
        { offset: 0.42, value: 0.08 },
        { offset: 1, value: 0 },
      ],
    }
  );
};

export const FluxColumns: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  const position = sampleCellField(fRow, fCol, (row, col) =>
    col % 2 === 0 ? MATRIX_LAST - row : row
  );
  return matrixMotionStyle(
    targets,
    position * 0.2 * FLUX_COLUMNS_CYCLE_MS,
    FLUX_COLUMNS_CYCLE_MS,
    [
      matrixCssKeyframe(0, 0, 0, 1),
      matrixCssKeyframe(0.2, 0.3, 0.5, 0.2),
      matrixCssKeyframe(0.4, 0, 0.6, 0.4),
      matrixCssKeyframe(0.6, 0, 0.2, 0.8),
      matrixCssKeyframe(0.8, 0, 0, 1),
      matrixCssKeyframe(1, 0, 0, 1),
    ],
    [1, 0.86, 1.12, 0.92, 1.06, 1],
    'steps(5, end)',
    {
      // Stepped vertical jitter — reads as mechanical actuation, not smooth drift.
      y: [0, -0.3, 0.16, -0.2, 0.1, 0],
    }
  );
};

const ECHO_RING_BLEND_KEYFRAMES = [
  matrixCssKeyframe(0, 0, 0, 1),
  matrixCssKeyframe(0.2, 0.12, 0.28, 0.6),
  matrixCssKeyframe(0.32, 0.72, 0.18, 0.1),
  matrixCssKeyframe(0.45, 0.22, 0.48, 0.3),
  matrixCssKeyframe(0.58, 0.05, 0.32, 0.63),
  matrixCssKeyframe(0.72, 0.02, 0.14, 0.84),
  matrixCssKeyframe(1, 0, 0, 1),
];

export const RadialExpand: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  const radius = sampleCellField(fRow, fCol, radialDistanceFromCenter);
  // Decelerating front: compress outer delays so the ring loses speed as it expands.
  const easedRadius = Math.pow(radius / RADIAL_MAX_DISTANCE, 0.72);
  const center = (count - 1) / 2;
  const dirX = x - center;
  const dirY = y - center;
  const dist = Math.hypot(dirX, dirY);
  // Physical shove: modules push outward along their own radius as the front passes.
  const push = dist > 0 ? 0.36 : 0;
  const outX = dist > 0 ? (dirX / dist) * push : 0;
  const outY = dist > 0 ? (dirY / dist) * push : 0;
  return matrixMotionStyle(
    targets,
    easedRadius * 0.3 * RADIAL_EXPAND_CYCLE_MS,
    RADIAL_EXPAND_CYCLE_MS,
    ECHO_RING_BLEND_KEYFRAMES,
    [
      { offset: 0, value: 1 },
      { offset: 0.32, value: 1.16 },
      { offset: 0.62, value: 1 },
      { offset: 1, value: 1 },
    ],
    'ease-in-out',
    {
      x: [
        { offset: 0, value: 0 },
        { offset: 0.32, value: outX },
        { offset: 0.62, value: 0 },
        { offset: 1, value: 0 },
      ],
      y: [
        { offset: 0, value: 0 },
        { offset: 0.32, value: outY },
        { offset: 0.62, value: 0 },
        { offset: 1, value: 0 },
      ],
    }
  );
};

export const DiamondExpand: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  return shapeRevealAnimation(
    targets,
    diamondExpansionMetric(y, x, count),
    diamondMaxExpansionMetric(count),
    moduleDirectionFromCenter(x, y, count),
  );
};

const SHAPE_BLOOM_BLEND_KEYFRAMES = [
  matrixCssKeyframe(0, 0, 0, 1),
  matrixCssKeyframe(0.16, 0.6, 0.3, 0.1),
  matrixCssKeyframe(0.26, 1, 0, 0),
  matrixCssKeyframe(0.42, 0.85, 0.15, 0),
  matrixCssKeyframe(0.68, 0, 0.3, 0.7),
  matrixCssKeyframe(1, 0, 0, 1),
];

const SHAPE_BLOOM_SCALE_KEYFRAMES: WebKeyframeValue[] = [
  { offset: 0, value: 1 },
  { offset: 0.26, value: 1.2 },
  { offset: 0.42, value: 1.07 },
  { offset: 0.7, value: 1 },
  { offset: 1, value: 1 },
];

const SHAPE_PUSH_UNITS = 0.3;

const shapeRevealAnimation = (
  targets: Element,
  metric: number,
  maxMetric: number,
  direction: { dirX: number; dirY: number },
): DotMatrixAnimationFrame => ({
  targets,
  // Keep the full contour travel inside one cycle. Raw shape metrics scale
  // with the QR size; using them directly starts additional hearts/stars
  // before the first one has left the QR.
  from: (maxMetric > 0 ? metric / maxMetric : 0) * 0.42 * SHAPE_EXPAND_CYCLE_MS,
  duration: SHAPE_EXPAND_CYCLE_MS,
  easing: 'ease-in-out',
  web: {
    opacity: SHAPE_BLOOM_BLEND_KEYFRAMES,
    scale: SHAPE_BLOOM_SCALE_KEYFRAMES,
    // Modules shove outward as the contour blooms through them, then settle.
    x: [
      { offset: 0, value: 0 },
      { offset: 0.26, value: direction.dirX * SHAPE_PUSH_UNITS },
      { offset: 0.55, value: direction.dirX * SHAPE_PUSH_UNITS * 0.25 },
      { offset: 1, value: 0 },
    ],
    y: [
      { offset: 0, value: 0 },
      { offset: 0.26, value: direction.dirY * SHAPE_PUSH_UNITS },
      { offset: 0.55, value: direction.dirY * SHAPE_PUSH_UNITS * 0.25 },
      { offset: 1, value: 0 },
    ],
  },
});

export const HeartExpand: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  return shapeRevealAnimation(
    targets,
    heartExpansionMetric(y, x, count),
    heartMaxExpansionMetric(count),
    moduleDirectionFromCenter(x, y, count),
  );
};

export const StarExpand: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  return shapeRevealAnimation(
    targets,
    starExpansionMetric(y, x, count),
    starMaxExpansionMetric(count),
    moduleDirectionFromCenter(x, y, count),
  );
};

export const ChevronSweep: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  const distance = sampleCellField(fRow, fCol, chevronDistance);
  // Ease the delay field so the sweep gathers speed out of the top edge.
  const easedDistance = Math.pow(distance / CHEVRON_MAX_DISTANCE, 0.8);
  // Crest travels bottom-center → top corners; modules kick along it.
  const spread = x - (count - 1) / 2 >= 0 ? 0.12 : -0.12;
  return matrixMotionStyle(
    targets,
    easedDistance * 0.32 * CHEVRON_SWEEP_CYCLE_MS,
    CHEVRON_SWEEP_CYCLE_MS,
    [
      matrixCssKeyframe(0, 0, 0, 1),
      matrixCssKeyframe(0.2, 1, 0, 0),
      matrixCssKeyframe(0.3, 1, 0, 0),
      matrixCssKeyframe(0.52, 0, 0.45, 0.55),
      matrixCssKeyframe(1, 0, 0, 1),
    ],
    [
      { offset: 0, value: 1 },
      { offset: 0.25, value: 1.15 },
      { offset: 0.55, value: 1 },
      { offset: 1, value: 1 },
    ],
    'ease-in-out',
    {
      x: [
        { offset: 0, value: 0 },
        { offset: 0.25, value: spread },
        { offset: 0.55, value: 0 },
        { offset: 1, value: 0 },
      ],
      y: [
        { offset: 0, value: 0 },
        { offset: 0.25, value: -0.32 },
        { offset: 0.55, value: 0 },
        { offset: 1, value: 0 },
      ],
    }
  );
};

export const RadialRippleIn: QRCodeAnimation = (targets, x, y, count, entity) => {
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
