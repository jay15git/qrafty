const STAR_SPIKES = 5;
const HEART_BOUNDARY_STEP = Math.PI / 120;

function normalizeAngle(angle: number) {
  let a = angle % (Math.PI * 2);
  if (a < 0) a += Math.PI * 2;
  return a;
}

function angleDelta(a: number, b: number) {
  const delta = Math.abs(normalizeAngle(a) - normalizeAngle(b));
  return Math.min(delta, Math.PI * 2 - delta);
}

/** Normalized grid coords: x right, y up (screen row flipped). */
export function normalizedGridCoords(
  row: number,
  col: number,
  matrixSize: number,
) {
  const center = (matrixSize - 1) / 2;
  const radius = Math.max(center, 1);
  return {
    nx: (col - center) / radius,
    ny: -(row - center) / radius,
    radius,
  };
}

/** Classic implicit heart: inside when value <= 0. */
export function heartImplicit(x: number, y: number) {
  const a = x * x + y * y - 1;
  return a * a * a - x * x * y * y * y;
}

const HEART_BOUNDARY = Array.from({ length: Math.ceil((Math.PI * 2) / HEART_BOUNDARY_STEP) }, (_, index) => {
  const t = index * HEART_BOUNDARY_STEP;
  const nx = Math.pow(Math.sin(t), 3);
  const ny = -(
    (13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t)) /
    16
  );
  const angle = Math.atan2(ny, nx);
  const r = Math.hypot(nx, ny);
  return { angle, r };
});

const HEART_MAX_RADIUS = Math.max(...HEART_BOUNDARY.map((sample) => sample.r), 0.1);

function heartBoundaryAtAngle(angle: number) {
  let best = 0.01;
  for (const sample of HEART_BOUNDARY) {
    if (angleDelta(sample.angle, angle) < Math.PI / 14) {
      best = Math.max(best, sample.r);
    }
  }
  return best;
}

/** Expansion scale where the point hits the parametric heart boundary (grid units). */
export function heartExpansionMetric(
  row: number,
  col: number,
  matrixSize: number,
) {
  const { nx, ny, radius } = normalizedGridCoords(row, col, matrixSize);
  const r = Math.hypot(nx, ny);
  if (r < 1e-6) return 0;
  const boundary = heartBoundaryAtAngle(Math.atan2(ny, nx));
  return (r / boundary) * radius;
}

/** Outer star radius at angle — matches react-qr-code 5-point star. */
export function starBoundaryRadius(angle: number) {
  const step = Math.PI / STAR_SPIKES;
  const a = normalizeAngle(angle - Math.PI / 2);
  const segment = (a % (step * 2)) / step;
  const t = segment <= 1 ? segment : 2 - segment;
  const outer = 1;
  const inner = 0.5;
  return outer - (outer - inner) * t;
}

/** Distance to star boundary along the ray from center (grid units). */
export function starExpansionMetric(
  row: number,
  col: number,
  matrixSize: number,
) {
  const { nx, ny, radius } = normalizedGridCoords(row, col, matrixSize);
  const r = Math.hypot(nx, ny);
  if (r < 1e-6) return 0;
  const boundary = starBoundaryRadius(Math.atan2(ny, nx));
  return (r / Math.max(boundary, 0.1)) * radius;
}

/** Integer ring index for concentric circular ripples. */
export function rippleRingIndex(row: number, col: number, matrixSize: number) {
  const center = (matrixSize - 1) / 2;
  const dx = col - center;
  const dy = row - center;
  return Math.round(Math.hypot(dx, dy));
}

function maxShapeExpansionMetric(
  matrixSize: number,
  metricAt: (row: number, col: number, matrixSize: number) => number,
) {
  let max = 0;
  for (let row = 0; row < matrixSize; row++) {
    for (let col = 0; col < matrixSize; col++) {
      max = Math.max(max, metricAt(row, col, matrixSize));
    }
  }
  return max;
}

export function heartMaxExpansionMetric(matrixSize: number) {
  return maxShapeExpansionMetric(matrixSize, heartExpansionMetric);
}

export function starMaxExpansionMetric(matrixSize: number) {
  return maxShapeExpansionMetric(matrixSize, starExpansionMetric);
}

export function heartBoundarySamples() {
  return HEART_BOUNDARY.map((sample) => ({
    angle: sample.angle,
    r: sample.r / HEART_MAX_RADIUS,
  }));
}
