import {
  SVG_NS,
  splitSvgPathData,
  getClipPathId,
  isSvgElementLike,
  getDotNumericAttribute,
  getSmallestPositiveDelta,
} from "./svg-dom-utils";

export const DOTS_CLIP_PATH_PREFIX = "clip-path-dot-color-";

export const QR_MODULE_CLIP_PATH_PREFIXES = [DOTS_CLIP_PATH_PREFIX];

export const DEFAULT_DOT_MATRIX_TILE_SIZE = 5;

export const DOT_MATRIX_QUIET_TRACK_INDEX = -1;

export type DotClipLayer = {
  element: SVGRectElement;
  fill: string;
  shapes: SVGElement[];
};

export type DotPathLayer = {
  element: SVGPathElement;
  fill: string;
  shapes: SVGPathElement[];
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

export type DotPaletteShapeGroup = {
  coordinates: DotMatrixCoordinates | null;
  fallbackIndex: number;
  shapes: SVGElement[];
};

export type DotPaletteGroupAssignment = {
  group: DotPaletteShapeGroup;
  paletteIndex: number;
};

export type DotMatrixModule = DotMatrixCoordinates & {
  angle: number;
  colN: number;
  diagonal: number;
  distance: number;
  distanceN: number;
  hash: number;
  index: number;
  matrixSize: number;
  outline: number;
  outlineN: number;
  perimeterIndex: number;
  regionCol: number;
  regionIndex: number;
  regionRow: number;
  ring: number;
  rowN: number;
  shape: SVGElement;
};

export type DotMatrixAnchor = {
  size?: number;
  x: number;
  y: number;
};

export type DotMatrixTrack = {
  durationMs: number;
  index: number;
  keyframes: string;
  modules: DotMatrixModule[];
  opacity?: number;
  region: string;
  speedMultiplier: number;
  state: "active" | "quiet";
  styleVars: Record<string, number | string>;
  timingFunction: string;
  topology: string;
  upstreamClass?: string;
  upstreamLoader: DotMatrixSquareLoaderId;
};

export type DotMatrixCell = {
  col: number;
  index: number;
  matrixSize: number;
  row: number;
};

export type DotMatrixCellAnimation = {
  active: boolean;
  durationMs: number;
  keyframes: string;
  opacity?: number;
  styleVars?: Record<string, number | string>;
  timingFunction: string;
  topology: string;
  upstreamClass?: string;
  upstreamLoader: DotMatrixSquareLoaderId;
};

export type DotMatrixLoaderSpec = {
  resolve: (cell: DotMatrixCell) => DotMatrixCellAnimation;
  topology: string;
  upstreamLoader: DotMatrixSquareLoaderId;
};

export type DotMatrixLoaderResolver = (
  cell: DotMatrixCell,
  upstreamLoader: DotMatrixSquareLoaderId,
  topology: string,
) => DotMatrixCellAnimation;

export type DotMatrixSquareLoaderId =
  | "dotm-square-1"
  | "dotm-square-6"
  | "dotm-square-21"
  | "dotm-square-23"
  | "dotm-square-26"
  | "dotm-square-28"
  | "dotm-square-30";

export function getQrModuleClipLayers(svg: SVGElement): DotClipLayer[] {
  return Array.from(svg.querySelectorAll("rect"))
    .map((element) => {
      const clipPathId = getClipPathId(element.getAttribute("clip-path"));

      if (
        !clipPathId ||
        !QR_MODULE_CLIP_PATH_PREFIXES.some((prefix) => clipPathId.startsWith(prefix))
      ) {
        return null;
      }

      const clipPath = Array.from(svg.querySelectorAll("clipPath")).find(
        (candidate) => candidate.getAttribute("id") === clipPathId,
      );

      if (!clipPath) {
        return null;
      }

      const shapes = Array.from(clipPath.children).filter((child): child is SVGElement =>
        isSvgElementLike(child),
      );

      if (shapes.length === 0) {
        return null;
      }

      return {
        element,
        fill: element.getAttribute("fill") ?? "currentColor",
        shapes,
      } satisfies DotClipLayer;
    })
    .filter((layer): layer is DotClipLayer => layer !== null);
}

export function getQrModulePathLayers(svg: SVGElement): DotPathLayer[] {
  return Array.from(svg.querySelectorAll("path"))
    .map((element) => {
      if (element.getAttribute("data-testid") !== "data-modules") {
        return null;
      }

      const pathData = element.getAttribute("d");
      const pathSegments = splitSvgPathData(pathData);

      if (pathSegments.length === 0) {
        return null;
      }

      const document = element.ownerDocument;
      const shapes = pathSegments.map((segment) => {
        const shape = document.createElementNS(SVG_NS, "path");
        shape.setAttribute("d", segment);
        return shape;
      });

      return {
        element,
        fill: element.getAttribute("fill") ?? "currentColor",
        shapes,
      } satisfies DotPathLayer;
    })
    .filter((layer): layer is DotPathLayer => layer !== null);
}

export function collectDotMatrixMetrics(dotShapes: SVGElement[]): DotMatrixMetrics | null {
  const anchors = dotShapes
    .map((shape) => getDotMatrixAnchor(shape))
    .filter((anchor): anchor is DotMatrixAnchor => anchor !== null);

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
  };
}

export function getFallbackDotMatrixMetrics(dotShapes: SVGElement[]): DotMatrixMetrics {
  const anchors = dotShapes
    .map((shape) => getDotMatrixAnchor(shape))
    .filter((anchor): anchor is DotMatrixAnchor => anchor !== null);
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
  };
}

export function resolveDotMatrixCoordinates(shape: SVGElement, metrics: DotMatrixMetrics) {
  const anchor = getDotMatrixAnchor(shape);

  if (!anchor) {
    return null;
  }

  return {
    col: Math.max(0, Math.round((anchor.x - metrics.originX) / metrics.cellSize)),
    row: Math.max(0, Math.round((anchor.y - metrics.originY) / metrics.cellSize)),
  };
}

export function getDotMatrixAnchor(shape: SVGElement): DotMatrixAnchor | null {
  const anchorTag = shape.tagName.toLowerCase();

  if (anchorTag === "g" || anchorTag === "svg") {
    const x = getDotNumericAttribute(shape, "data-anchor-x");
    const y = getDotNumericAttribute(shape, "data-anchor-y");

    if (x !== null && y !== null) {
      const size = getDotNumericAttribute(shape, "data-anchor-size");
      return { size: size ?? undefined, x, y };
    }

    return null;
  }

  if (shape.tagName.toLowerCase() === "rect") {
    const x = getDotNumericAttribute(shape, "x");
    const y = getDotNumericAttribute(shape, "y");
    const width = getDotNumericAttribute(shape, "width");
    const height = getDotNumericAttribute(shape, "height");

    if (x !== null && y !== null && width !== null && height !== null) {
      return { size: Math.min(width, height), x, y };
    }
  }

  if (shape.tagName.toLowerCase() === "circle") {
    const cx = getDotNumericAttribute(shape, "cx");
    const cy = getDotNumericAttribute(shape, "cy");
    const r = getDotNumericAttribute(shape, "r");

    if (cx !== null && cy !== null && r !== null) {
      return { size: r * 2, x: cx - r, y: cy - r };
    }
  }

  if (shape.tagName.toLowerCase() === "path") {
    return getPathAnchor(shape.getAttribute("d"));
  }

  return null;
}

export function getPathAnchor(pathDefinition: string | null): DotMatrixAnchor | null {
  if (!pathDefinition) {
    return null;
  }

  const match = /M\s*([+-]?(?:\d+\.?\d*|\.\d+))[\s,]+([+-]?(?:\d+\.?\d*|\.\d+))/.exec(
    pathDefinition,
  );

  if (!match) {
    return null;
  }

  const x = Number(match[1]);
  const y = Number(match[2]);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return { size: 1, x: Math.floor(x), y: Math.floor(y) };
}

export function removeOrphanedModuleClipPaths(svg: SVGElement) {
  for (const clipPath of svg.querySelectorAll("clipPath")) {
    const clipPathId = clipPath.getAttribute("id") ?? "";

    if (QR_MODULE_CLIP_PATH_PREFIXES.some((prefix) => clipPathId.startsWith(prefix))) {
      clipPath.remove();
    }
  }
}

export function removeDotMatrixBaseLayers(
  dotClipLayers: DotClipLayer[],
  dotPathLayers: DotPathLayer[],
) {
  for (const layer of dotClipLayers) {
    layer.element.remove();
  }

  for (const layer of dotPathLayers) {
    layer.element.remove();
  }
}
