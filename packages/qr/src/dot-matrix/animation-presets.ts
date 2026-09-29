import { QRCodeEntity } from "./animation-utils";
import {
  diamondExpansionMetric,
  diamondMaxExpansionMetric,
  heartExpansionMetric,
  heartMaxExpansionMetric,
  starExpansionMetric,
  starMaxExpansionMetric,
} from "./shape-metrics";
import {
  matrixFracCoord,
  sampleCellField,
  trBlPathNormFromCoord,
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
} from "./motion-math";
import { matrixCssKeyframe, matrixMotionStyle, matrixEntityAnimation } from "./animation-keyframes";
import type { WebKeyframeValue } from "./animation-keyframes";
import type { DotMatrixAnimationFrame, QRCodeAnimation } from "./animation-types";

export const NeonDrift: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  const path = sampleCellField(fRow, fCol, (row, col) => trBlPathNormFromCoord(row, col));
  const parity = sampleCellField(fRow, fCol, (row, col) => (row + (MATRIX_LAST - col)) % 2);
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
    "ease-in-out",
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
    },
  );
};

export const FluxColumns: QRCodeAnimation = (targets, x, y, count, entity) => {
  if (entity !== QRCodeEntity.Module) return matrixEntityAnimation(targets, entity);
  const { fRow, fCol } = matrixFracCoord(x, y, count);
  const position = sampleCellField(fRow, fCol, (row, col) =>
    col % 2 === 0 ? MATRIX_LAST - row : row,
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
    "steps(5, end)",
    {
      // Stepped vertical jitter — reads as mechanical actuation, not smooth drift.
      y: [0, -0.3, 0.16, -0.2, 0.1, 0],
    },
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
    "ease-in-out",
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
    },
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
  easing: "ease-in-out",
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
    "ease-in-out",
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
    },
  );
};
