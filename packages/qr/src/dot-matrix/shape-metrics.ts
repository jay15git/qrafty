const STAR_SPIKES = 5;
const HEART_BOUNDARY_STEP = Math.PI / 360;

type ShapePoint = {
  x: number;
  y: number;
};

function normalizeAngle(angle: number) {
  let a = angle % (Math.PI * 2);
  if (a < 0) a += Math.PI * 2;
  return a;
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
  const ny =
    (13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t)) /
    16;
  return { x: nx, y: ny };
});

const STAR_BOUNDARY = Array.from({ length: STAR_SPIKES * 2 }, (_, index) => {
  const angle = Math.PI / 2 + (index * Math.PI) / STAR_SPIKES;
  const radius = index % 2 === 0 ? 1 : 0.5;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
});

function cross(a: ShapePoint, b: ShapePoint) {
  return a.x * b.y - a.y * b.x;
}

function radialBoundaryAtAngle(boundary: readonly ShapePoint[], angle: number) {
  const ray = { x: Math.cos(angle), y: Math.sin(angle) };
  let nearest = Number.POSITIVE_INFINITY;

  for (let index = 0; index < boundary.length; index++) {
    const start = boundary[index]!;
    const end = boundary[(index + 1) % boundary.length]!;
    const edge = { x: end.x - start.x, y: end.y - start.y };
    const denominator = cross(ray, edge);

    if (Math.abs(denominator) < 1e-8) {
      continue;
    }

    const distance = cross(start, edge) / denominator;
    const edgeProgress = cross(start, ray) / denominator;

    if (distance >= 0 && edgeProgress >= 0 && edgeProgress <= 1) {
      nearest = Math.min(nearest, distance);
    }
  }

  return Number.isFinite(nearest) ? nearest : 0.01;
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
  const boundary = radialBoundaryAtAngle(HEART_BOUNDARY, Math.atan2(ny, nx));
  return (r / boundary) * radius;
}

/** Exact radial boundary of the react-qr-code five-point star. */
export function starBoundaryRadius(angle: number) {
  return radialBoundaryAtAngle(STAR_BOUNDARY, normalizeAngle(angle));
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

function getCachedMaxExpansionMetric(
  matrixSize: number,
  cache: Map<number, number>,
  metricAt: (row: number, col: number, matrixSize: number) => number,
) {
  const cached = cache.get(matrixSize);
  if (cached !== undefined) {
    return cached;
  }

  const max = maxShapeExpansionMetric(matrixSize, metricAt);
  cache.set(matrixSize, max);
  return max;
}

const heartMaxExpansionMetricCache = new Map<number, number>();
const starMaxExpansionMetricCache = new Map<number, number>();

export function heartMaxExpansionMetric(matrixSize: number) {
  return getCachedMaxExpansionMetric(
    matrixSize,
    heartMaxExpansionMetricCache,
    heartExpansionMetric,
  );
}

export function starMaxExpansionMetric(matrixSize: number) {
  return getCachedMaxExpansionMetric(
    matrixSize,
    starMaxExpansionMetricCache,
    starExpansionMetric,
  );
}

export function heartBoundarySamples() {
  return HEART_BOUNDARY.map((sample) => ({
    angle: Math.atan2(sample.y, sample.x),
    r: Math.hypot(sample.x, sample.y),
  }));
}
