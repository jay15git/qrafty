// Pure dot-matrix metrics and palette-assignment logic shared by the emit
// path (subpath strings) and the DOM annotation path (element shapes).
import {
  getNumericSvgAttribute,
  getSmallestPositiveDelta,
  getSvgPathSubpathStartPoint,
} from "./svg-utils";

export type DotMatrixAnchor = {
  size?: number;
  x: number;
  y: number;
};

export type DotMatrixMetrics = {
  cellSize: number;
  maxCol: number;
  maxRow: number;
  maxX: number;
  maxY: number;
  originX: number;
  originY: number;
};

export type DotMatrixCoordinates = {
  col: number;
  row: number;
};

export type DotPaletteShapeGroup<T> = {
  coordinates: DotMatrixCoordinates | null;
  fallbackIndex: number;
  shapes: T[];
};

export type DotPaletteGroupAssignment<T> = {
  group: DotPaletteShapeGroup<T>;
  paletteIndex: number;
};

export type DotMatrixShapeLike = {
  tagName: string;
  getAttribute(name: string): string | null;
};

export function getDotMatrixAnchor(shape: DotMatrixShapeLike): DotMatrixAnchor | null {
  const anchorTag = shape.tagName.toLowerCase();

  if (anchorTag === "g" || anchorTag === "svg") {
    const x = getNumericSvgAttribute((name) => shape.getAttribute(name), "data-anchor-x");
    const y = getNumericSvgAttribute((name) => shape.getAttribute(name), "data-anchor-y");

    if (x !== null && y !== null) {
      const size = getNumericSvgAttribute((name) => shape.getAttribute(name), "data-anchor-size");
      return { size: size ?? undefined, x, y };
    }

    return null;
  }

  if (anchorTag === "rect") {
    const get = (name: string) => shape.getAttribute(name);
    const x = getNumericSvgAttribute(get, "x");
    const y = getNumericSvgAttribute(get, "y");
    const width = getNumericSvgAttribute(get, "width");
    const height = getNumericSvgAttribute(get, "height");

    if (x !== null && y !== null && width !== null && height !== null) {
      return { size: Math.min(width, height), x, y };
    }
  }

  if (anchorTag === "circle") {
    const get = (name: string) => shape.getAttribute(name);
    const cx = getNumericSvgAttribute(get, "cx");
    const cy = getNumericSvgAttribute(get, "cy");
    const r = getNumericSvgAttribute(get, "r");

    if (cx !== null && cy !== null && r !== null) {
      return { size: r * 2, x: cx - r, y: cy - r };
    }
  }

  if (anchorTag === "path") {
    const start = getSvgPathSubpathStartPoint(shape.getAttribute("d"));

    if (!start) {
      return null;
    }

    return { size: 1, x: Math.floor(start.x), y: Math.floor(start.y) };
  }

  return null;
}

export function collectDotMatrixAnchors<T>(
  shapes: T[],
  getAnchor: (shape: T) => DotMatrixAnchor | null,
) {
  return shapes
    .map((shape) => getAnchor(shape))
    .filter((anchor): anchor is DotMatrixAnchor => anchor !== null);
}

export function collectDotMatrixMetricsFromAnchors(anchors: DotMatrixAnchor[]) {
  if (anchors.length === 0) {
    return null;
  }

  const explicitSizes = anchors
    .map((anchor) => anchor.size)
    .filter((size): size is number => size !== undefined && Number.isFinite(size) && size > 0);
  const cellSize =
    explicitSizes.length > 0
      ? Math.min(...explicitSizes)
      : getSmallestPositiveDelta([
          ...anchors.map((anchor) => anchor.x),
          ...anchors.map((anchor) => anchor.y),
        ]);

  if (!Number.isFinite(cellSize) || cellSize <= 0) {
    return null;
  }

  const originX = Math.min(...anchors.map((anchor) => anchor.x));
  const originY = Math.min(...anchors.map((anchor) => anchor.y));
  const coordinates = anchors.map((anchor) => ({
    col: Math.max(0, Math.round((anchor.x - originX) / cellSize)),
    row: Math.max(0, Math.round((anchor.y - originY) / cellSize)),
  }));

  return {
    cellSize,
    maxCol: Math.max(...coordinates.map((coordinate) => coordinate.col)),
    maxRow: Math.max(...coordinates.map((coordinate) => coordinate.row)),
    maxX: Math.max(...anchors.map((anchor) => anchor.x + (anchor.size ?? cellSize))),
    maxY: Math.max(...anchors.map((anchor) => anchor.y + (anchor.size ?? cellSize))),
    originX,
    originY,
  } satisfies DotMatrixMetrics;
}

export function getFallbackDotMatrixMetricsFromAnchors(anchors: DotMatrixAnchor[]) {
  const maxX =
    anchors.length > 0 ? Math.max(...anchors.map((anchor) => anchor.x + (anchor.size ?? 0))) : 0;
  const maxY =
    anchors.length > 0 ? Math.max(...anchors.map((anchor) => anchor.y + (anchor.size ?? 0))) : 0;

  return {
    cellSize: 1,
    maxCol: 0,
    maxRow: 0,
    maxX,
    maxY,
    originX: 0,
    originY: 0,
  } satisfies DotMatrixMetrics;
}

export function resolveDotMatrixAnchorCoordinates(
  anchor: DotMatrixAnchor,
  metrics: DotMatrixMetrics,
): DotMatrixCoordinates {
  return {
    col: Math.max(0, Math.round((anchor.x - metrics.originX) / metrics.cellSize)),
    row: Math.max(0, Math.round((anchor.y - metrics.originY) / metrics.cellSize)),
  };
}

export function getActiveDotsPalette(colors: string[]) {
  const seen = new Set<string>();

  return colors.flatMap((color) => {
    const trimmed = color.trim();
    if (!trimmed.length || seen.has(trimmed)) {
      return [];
    }

    seen.add(trimmed);
    return [trimmed];
  });
}

export function createDotPaletteShapeGroups<T>(
  shapes: T[],
  metrics: DotMatrixMetrics | null,
  getCoordinates: (shape: T, metrics: DotMatrixMetrics) => DotMatrixCoordinates | null,
): DotPaletteShapeGroup<T>[] {
  const groups = new Map<string, DotPaletteShapeGroup<T>>();

  for (const [fallbackIndex, shape] of shapes.entries()) {
    const coordinates = metrics ? getCoordinates(shape, metrics) : null;
    const key = coordinates ? `${coordinates.row}:${coordinates.col}` : `fallback:${fallbackIndex}`;
    const group = groups.get(key);

    if (group) {
      group.shapes.push(shape);
      continue;
    }

    groups.set(key, {
      coordinates,
      fallbackIndex,
      shapes: [shape],
    });
  }

  return Array.from(groups.values()).sort(compareDotPaletteShapeGroups);
}

function compareDotPaletteShapeGroups<T>(
  left: DotPaletteShapeGroup<T>,
  right: DotPaletteShapeGroup<T>,
) {
  if (left.coordinates && right.coordinates) {
    return (
      left.coordinates.row - right.coordinates.row ||
      left.coordinates.col - right.coordinates.col ||
      left.fallbackIndex - right.fallbackIndex
    );
  }

  if (left.coordinates) {
    return -1;
  }

  if (right.coordinates) {
    return 1;
  }

  return left.fallbackIndex - right.fallbackIndex;
}

export function getDotPaletteIndex<T>(
  group: DotPaletteShapeGroup<T>,
  paletteLength: number,
  seed: number,
) {
  if (paletteLength <= 0) {
    return 0;
  }

  return hashDotPaletteGroup(group, seed) % paletteLength;
}

export function balanceDotPaletteAssignments<T>(
  assignments: DotPaletteGroupAssignment<T>[],
  paletteLength: number,
  seed: number,
) {
  if (assignments.length < paletteLength || paletteLength <= 1) {
    return;
  }

  const counts = countDotPaletteAssignments(assignments, paletteLength);
  const missingPaletteIndexes = counts
    .map((count, paletteIndex) => (count === 0 ? paletteIndex : null))
    .filter((paletteIndex): paletteIndex is number => paletteIndex !== null);

  for (const missingPaletteIndex of missingPaletteIndexes) {
    let candidateIndex = -1;
    let candidateScore = -1;

    for (const [assignmentIndex, assignment] of assignments.entries()) {
      if (counts[assignment.paletteIndex] <= 1) {
        continue;
      }

      const score = hashDotPaletteNumbers([
        seed,
        missingPaletteIndex,
        assignmentIndex,
        assignment.group.coordinates?.row ?? -1,
        assignment.group.coordinates?.col ?? assignment.group.fallbackIndex,
      ]);

      if (score > candidateScore) {
        candidateIndex = assignmentIndex;
        candidateScore = score;
      }
    }

    if (candidateIndex === -1) {
      return;
    }

    const assignment = assignments[candidateIndex];
    counts[assignment.paletteIndex] -= 1;
    assignment.paletteIndex = missingPaletteIndex;
    counts[missingPaletteIndex] += 1;
  }
}

function countDotPaletteAssignments<T>(
  assignments: DotPaletteGroupAssignment<T>[],
  paletteLength: number,
) {
  const counts = Array.from({ length: paletteLength }, () => 0);

  for (const assignment of assignments) {
    counts[assignment.paletteIndex] += 1;
  }

  return counts;
}

function hashDotPaletteGroup<T>(group: DotPaletteShapeGroup<T>, seed: number) {
  return hashDotPaletteNumbers([
    seed,
    group.coordinates?.row ?? -1,
    group.coordinates?.col ?? -1,
    group.fallbackIndex,
  ]);
}

export function hashDotPaletteString(value: string) {
  const input = value.length > 0 ? value : "qr-dot-palette";
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function hashDotPaletteNumbers(values: number[]) {
  let hash = 0x811c9dc5;

  for (const value of values) {
    hash ^= value | 0;
    hash = Math.imul(hash, 0x45d9f3b);
    hash ^= hash >>> 16;
  }

  hash = Math.imul(hash ^ (hash >>> 15), 0x2c1b3c6d);
  hash = Math.imul(hash ^ (hash >>> 12), 0x297a2d39);

  return (hash ^ (hash >>> 15)) >>> 0;
}
