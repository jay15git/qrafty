// Shared string/number helpers for the SVG emit path and the DOM-based
// dot-matrix annotation path. Pure functions only — no DOM access.

/** Formats numbers the way the pipeline historically wrote them into markup. */
export function formatSvgNumber(value: number) {
  if (Math.abs(value) < 0.000001) {
    return "0";
  }

  return Number(value.toFixed(4)).toString();
}

/** Splits path data into `M…` subpaths (uppercase moveto starts a segment). */
export function splitSvgPathData(pathData: string | null | undefined) {
  return (pathData ?? "")
    .split(/(?=M\s*[+-]?(?:\d+\.?\d*|\.\d+)[\s,])/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function getSvgPathSubpathStartPoint(pathData: string | null | undefined) {
  const match = (pathData ?? "")
    .trim()
    .match(/^M\s*([+-]?(?:\d+\.?\d*|\.\d+))[\s,]+([+-]?(?:\d+\.?\d*|\.\d+))/);

  if (!match) {
    return null;
  }

  const x = Number.parseFloat(match[1] ?? "");
  const y = Number.parseFloat(match[2] ?? "");

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return { x, y };
}

/** Anchor a dot shape for module-grid metrics; mirrors DOM-attr reads. */
export function getNumericSvgAttribute(
  getAttribute: (name: string) => string | null,
  name: string,
) {
  const value = getAttribute(name);

  if (value === null) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export function getSmallestPositiveDelta(values: number[]) {
  const uniqueValues = Array.from(new Set(values.filter(Number.isFinite))).sort((a, b) => a - b);
  let smallestDelta = Number.POSITIVE_INFINITY;

  for (let index = 1; index < uniqueValues.length; index += 1) {
    const delta = uniqueValues[index] - uniqueValues[index - 1];

    if (delta > 0 && delta < smallestDelta) {
      smallestDelta = delta;
    }
  }

  return smallestDelta;
}

/**
 * Linear gradient endpoints for a rect region in user space.
 * `round` mirrors the legacy emit path which Math.round()s each endpoint.
 */
export function getLinearGradientEndpoints({
  height,
  rotation,
  width,
  x,
  y,
  round = false,
}: {
  height: number;
  rotation: number;
  width: number;
  x: number;
  y: number;
  round?: boolean;
}) {
  const normalizedRotation = (rotation + 2 * Math.PI) % (2 * Math.PI);
  let x1 = x + width / 2;
  let y1 = y + height / 2;
  let x2 = x + width / 2;
  let y2 = y + height / 2;

  if (
    (normalizedRotation >= 0 && normalizedRotation <= 0.25 * Math.PI) ||
    (normalizedRotation > 1.75 * Math.PI && normalizedRotation <= 2 * Math.PI)
  ) {
    x1 -= width / 2;
    y1 -= (height / 2) * Math.tan(rotation);
    x2 += width / 2;
    y2 += (height / 2) * Math.tan(rotation);
  } else if (normalizedRotation > 0.25 * Math.PI && normalizedRotation <= 0.75 * Math.PI) {
    y1 -= height / 2;
    x1 -= width / 2 / Math.tan(rotation);
    y2 += height / 2;
    x2 += width / 2 / Math.tan(rotation);
  } else if (normalizedRotation > 0.75 * Math.PI && normalizedRotation <= 1.25 * Math.PI) {
    x1 += width / 2;
    y1 += (height / 2) * Math.tan(rotation);
    x2 -= width / 2;
    y2 -= (height / 2) * Math.tan(rotation);
  } else if (normalizedRotation > 1.25 * Math.PI && normalizedRotation <= 1.75 * Math.PI) {
    y1 += height / 2;
    x1 += width / 2 / Math.tan(rotation);
    y2 -= height / 2;
    x2 -= width / 2 / Math.tan(rotation);
  }

  if (round) {
    return {
      x1: Math.round(x1),
      x2: Math.round(x2),
      y1: Math.round(y1),
      y2: Math.round(y2),
    };
  }

  return { x1, x2, y1, y2 };
}

export function coerceSvgNumber(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return value;
}

export function coerceNonNegativeSvgNumber(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, value);
}
