export const coordinateSeed = (x: number, y: number, count: number) =>
  Math.abs(Math.round((x + 1) * 37 + (y + 1) * 61 + count * 17));

export const hashNoise = (x: number, y: number, seed: number) => {
  const value =
    Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233 + seed * 43.758) * 43758.5453;
  return value - Math.floor(value);
};

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const MATRIX_SIZE = 5;
export const MATRIX_LAST = MATRIX_SIZE - 1;
export const NEON_DRIFT_CYCLE_MS = 2400;
export const FLUX_COLUMNS_CYCLE_MS = 1100;
export const RADIAL_EXPAND_CYCLE_MS = 1800;
export const SHAPE_EXPAND_CYCLE_MS = 2000;
export const CHEVRON_SWEEP_CYCLE_MS = 1300;

export const matrixFracCoord = (x: number, y: number, count: number) => {
  const max = Math.max(1, count - 1);
  return {
    fRow: clamp((y / max) * MATRIX_LAST, 0, MATRIX_LAST),
    fCol: clamp((x / max) * MATRIX_LAST, 0, MATRIX_LAST),
  };
};

/** Bilinear sample of a 5×5 cell field — smooth when mapped onto large QR grids. */
export const sampleCellField = (
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

export const easeInOut = (phase: number) =>
  phase < 0.5 ? 2 * phase * phase : 1 - Math.pow(-2 * phase + 2, 2) / 2;

const rowMajorIndex = (row: number, col: number) => row * MATRIX_SIZE + col;

export const trBlPathNormFromCoord = (row: number, col: number) =>
  (row + (MATRIX_LAST - col)) / (MATRIX_LAST * 2);

export const PREMIUM_GRID_SIZE = 7;
export const PREMIUM_GRID_LAST = PREMIUM_GRID_SIZE - 1;

export const premiumGridBand = (value: number, count: number) =>
  clamp(
    Math.floor((value / Math.max(1, count)) * PREMIUM_GRID_SIZE),
    0,
    PREMIUM_GRID_LAST
  );

export const premiumGridCoord = (x: number, y: number, count: number) => ({
  row: premiumGridBand(y, count),
  col: premiumGridBand(x, count),
});

export const premiumDiagonalSnakeOrder = (row: number, col: number) => {
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

const frameMaskCell = (mask: string, row: number, col: number) =>
  mask[rowMajorIndex(row, col)] || '.';

const MATRIX_CENTER = 2;

export const radialDistanceFromCenter = (row: number, col: number) =>
  Math.hypot(row - MATRIX_CENTER, col - MATRIX_CENTER);

export const chevronDistance = (row: number, col: number) =>
  MATRIX_LAST - row + Math.abs(col - MATRIX_CENTER);

export const RADIAL_MAX_DISTANCE = Math.hypot(MATRIX_CENTER, MATRIX_CENTER);

export const moduleDirectionFromCenter = (x: number, y: number, count: number) => {
  const center = (count - 1) / 2;
  const dirX = x - center;
  const dirY = y - center;
  const dist = Math.hypot(dirX, dirY);
  if (dist === 0) return { dirX: 0, dirY: 0 };
  return { dirX: dirX / dist, dirY: dirY / dist };
};

export const CHEVRON_MAX_DISTANCE = MATRIX_LAST + MATRIX_CENTER;
