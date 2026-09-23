import {
  DEFAULT_DOT_MATRIX_ANIMATION,
  QR_DOT_MATRIX_ANIMATION_SPEED_MAX,
  QR_DOT_MATRIX_ANIMATION_SPEED_MIN,
  QR_DOT_MATRIX_MATRIX_SIZE_MAX,
  QR_DOT_MATRIX_MATRIX_SIZE_MIN,
  QR_DOT_MATRIX_MATRIX_SIZE_STEP,
  type QrDotMatrixAnimationOptions,
  type QrDotMatrixSquareLoader,
} from "@/features/qr/model/state";
import {
  diamondExpansionMetric,
  diamondMaxExpansionMetric,
  heartExpansionMetric,
  heartMaxExpansionMetric,
  starExpansionMetric,
  starMaxExpansionMetric,
} from "@qrafty/qr/dot-matrix";
import {
  DEFAULT_DOT_MATRIX_TILE_SIZE,
  DOT_MATRIX_QUIET_TRACK_INDEX,
  type DotMatrixMetrics,
  type DotMatrixCoordinates,
  type DotMatrixModule,
  type DotMatrixTrack,
  type DotMatrixCellAnimation,
  type DotMatrixLoaderSpec,
  type DotMatrixLoaderResolver,
  type DotMatrixSquareLoaderId,
} from "./dot-matrix-model";
import {
  getDotMatrixRegionCoordinate,
  getDotMatrixCell,
  radialDistanceFromCenter,
  getShapeExpansionProgress,
  chevronDistance,
  trBlPathNormFromIndex,
  getDotMatrixPatternIndexes,
  stableDotMatrixStyleVarSignature,
  getDotMatrixPerimeterIndex,
  getDotMatrixRing,
  getDotMatrixHash01,
} from "./dot-matrix-cell-math";

export function getDotMatrixAnimationSpeedMultiplier(animation: QrDotMatrixAnimationOptions) {
  const speed = Math.min(
    QR_DOT_MATRIX_ANIMATION_SPEED_MAX,
    Math.max(QR_DOT_MATRIX_ANIMATION_SPEED_MIN, animation.speed),
  );

  return 2 ** ((3 - speed) / 2) / getDotMatrixDensitySpeedFactor(animation);
}

export function getDotMatrixDensitySpeedFactor(animation: QrDotMatrixAnimationOptions) {
  return Math.sqrt(getDotMatrixTileSize(animation) / DEFAULT_DOT_MATRIX_TILE_SIZE);
}

export function getDotMatrixTileSize(animation: QrDotMatrixAnimationOptions) {
  const matrixSize = Number(animation.matrixSize);
  const clamped = Number.isFinite(matrixSize)
    ? Math.min(QR_DOT_MATRIX_MATRIX_SIZE_MAX, Math.max(QR_DOT_MATRIX_MATRIX_SIZE_MIN, matrixSize))
    : DEFAULT_DOT_MATRIX_ANIMATION.matrixSize;

  return Math.round(clamped / QR_DOT_MATRIX_MATRIX_SIZE_STEP) * QR_DOT_MATRIX_MATRIX_SIZE_STEP;
}

export const DOT_MATRIX_LOADER_SPECS: Record<QrDotMatrixSquareLoader, DotMatrixLoaderSpec> = {
  "flux-columns": createDotMatrixLoaderSpec("dotm-square-6", "column-snake", (cell) =>
    createClassCellAnimation(
      "dotm-square-6",
      "column-snake",
      "dmx-square6-col-snake",
      "dmx-square6-col-snake",
      1500,
      {
        "--dmx-col-pos": cell.col % 2 === 0 ? cell.matrixSize - 1 - cell.row : cell.row,
      },
    ),
  ),
  "neon-drift": createDotMatrixLoaderSpec("dotm-square-1", "diagonal-alt-sweep", (cell) =>
    createClassCellAnimation(
      "dotm-square-1",
      "diagonal-alt-sweep",
      "dmx-diagonal-alt-sweep",
      "dmx-diagonal-alt-sweep",
      1500,
      {
        "--dmx-diagonal-parity": (cell.row + cell.col) % 2,
        "--dmx-path": trBlPathNormFromIndex(cell),
      },
    ),
  ),
  "radial-expand": createDotMatrixLoaderSpec("dotm-square-21", "radial-expand", (cell) =>
    createClassCellAnimation(
      "dotm-square-21",
      "radial-expand",
      "dmx-radial-expand",
      "dmx-radial-expand",
      1500,
      {
        "--dmx-radial-radius": radialDistanceFromCenter(cell),
      },
    ),
  ),
  "diamond-expand": createDotMatrixLoaderSpec("dotm-square-23", "diamond-expand", (cell) =>
    createClassCellAnimation(
      "dotm-square-23",
      "diamond-expand",
      "dmx-diamond-expand",
      "dmx-diamond-expand",
      1500,
      {
        "--dmx-diamond-progress": getShapeExpansionProgress(
          cell,
          diamondExpansionMetric,
          diamondMaxExpansionMetric,
        ),
      },
    ),
  ),
  "heart-expand": createDotMatrixLoaderSpec("dotm-square-28", "heart-expand", (cell) =>
    createClassCellAnimation(
      "dotm-square-28",
      "heart-expand",
      "dmx-heart-expand",
      "dmx-heart-expand",
      1500,
      {
        "--dmx-heart-progress": getShapeExpansionProgress(
          cell,
          heartExpansionMetric,
          heartMaxExpansionMetric,
        ),
      },
    ),
  ),
  "star-expand": createDotMatrixLoaderSpec("dotm-square-30", "star-expand", (cell) =>
    createClassCellAnimation(
      "dotm-square-30",
      "star-expand",
      "dmx-star-expand",
      "dmx-star-expand",
      1500,
      {
        "--dmx-star-progress": getShapeExpansionProgress(
          cell,
          starExpansionMetric,
          starMaxExpansionMetric,
        ),
      },
    ),
  ),
  "chevron-sweep": createDotMatrixLoaderSpec("dotm-square-26", "chevron-sweep", (cell) =>
    createClassCellAnimation(
      "dotm-square-26",
      "chevron-sweep",
      "dmx-chevron-sweep",
      "dmx-chevron-sweep",
      1500,
      {
        "--dmx-chevron-distance": chevronDistance(cell),
      },
    ),
  ),
};

export function createDotMatrixLoaderSpec(
  upstreamLoader: DotMatrixSquareLoaderId,
  topology: string,
  resolve: DotMatrixLoaderResolver,
): DotMatrixLoaderSpec {
  return {
    resolve: (cell) => resolve(cell, upstreamLoader, topology),
    topology,
    upstreamLoader,
  };
}

export function createClassCellAnimation(
  upstreamLoader: DotMatrixSquareLoaderId,
  topology: string,
  upstreamClass: string,
  keyframes: string,
  durationMs: number,
  styleVars: Record<string, number | string>,
  timingFunction = "linear",
): DotMatrixCellAnimation {
  return {
    active: true,
    durationMs,
    keyframes,
    styleVars,
    timingFunction,
    topology,
    upstreamClass,
    upstreamLoader,
  };
}

export function createQuietCellAnimation(
  upstreamLoader: DotMatrixSquareLoaderId,
  topology: string,
): DotMatrixCellAnimation {
  return {
    active: false,
    durationMs: 1500,
    keyframes: `${upstreamLoader}-quiet`,
    timingFunction: "linear",
    topology,
    upstreamLoader,
  };
}

export function createDotMatrixModule(
  shape: SVGElement,
  coordinates: DotMatrixCoordinates,
  metrics: DotMatrixMetrics,
  matrixSize: number,
): DotMatrixModule {
  const centerRow = metrics.maxRow / 2;
  const centerCol = metrics.maxCol / 2;
  const distance = Math.hypot(coordinates.row - centerRow, coordinates.col - centerCol);
  const maxDistance = Math.max(1, Math.hypot(centerRow, centerCol));
  const angle = Math.atan2(coordinates.row - centerRow, coordinates.col - centerCol);
  const index = coordinates.row * (metrics.maxCol + 1) + coordinates.col;
  const outlineDistance = Math.min(
    coordinates.row,
    coordinates.col,
    metrics.maxRow - coordinates.row,
    metrics.maxCol - coordinates.col,
  );
  const maxOutlineDistance = Math.max(1, Math.min(centerRow, centerCol));
  const perimeterIndex = getDotMatrixPerimeterIndex(coordinates, metrics);
  const colN = metrics.maxCol > 0 ? coordinates.col / metrics.maxCol : 0;
  const rowN = metrics.maxRow > 0 ? coordinates.row / metrics.maxRow : 0;
  const regionCol = getDotMatrixRegionCoordinate(colN, matrixSize);
  const regionRow = getDotMatrixRegionCoordinate(rowN, matrixSize);

  return {
    ...coordinates,
    angle,
    colN,
    diagonal: rowN + colN,
    distance,
    distanceN: distance / maxDistance,
    hash: getDotMatrixHash01(index, coordinates.row + coordinates.col * 17),
    index,
    matrixSize,
    outline: outlineDistance,
    outlineN: outlineDistance / maxOutlineDistance,
    perimeterIndex,
    regionCol,
    regionIndex: regionRow * matrixSize + regionCol,
    regionRow,
    ring: getDotMatrixRing(coordinates, metrics),
    rowN,
    shape,
  };
}

export function createDotMatrixLoaderTracks(
  modules: DotMatrixModule[],
  animation: QrDotMatrixAnimationOptions,
  matrixSize: number,
) {
  const spec = DOT_MATRIX_LOADER_SPECS[animation.loader] ?? DOT_MATRIX_LOADER_SPECS["neon-drift"];
  const tracks = new Map<string, DotMatrixTrack>();
  const speedMultiplier = getDotMatrixAnimationSpeedMultiplier(animation);
  const activePatternIndexes = new Set(getDotMatrixPatternIndexes(animation.pattern, matrixSize));

  for (const qrModule of modules) {
    const cell = getDotMatrixCell(qrModule);
    const resolved = activePatternIndexes.has(cell.index)
      ? spec.resolve(cell)
      : createQuietCellAnimation(spec.upstreamLoader, spec.topology);
    const assignment = {
      ...resolved,
      durationMs: Math.round(resolved.durationMs * speedMultiplier),
    };
    const trackIndex = assignment.active ? tracks.size : DOT_MATRIX_QUIET_TRACK_INDEX;
    const styleVars = assignment.styleVars ?? {};
    const upstreamClass = assignment.upstreamClass ?? "";
    const trackKey = [
      assignment.active ? "active" : "quiet",
      assignment.upstreamLoader,
      assignment.topology,
      upstreamClass,
      assignment.keyframes,
      assignment.durationMs,
      assignment.timingFunction,
      assignment.opacity ?? "",
      stableDotMatrixStyleVarSignature(styleVars),
    ].join(":");
    const existing = tracks.get(trackKey);
    const region = `${qrModule.regionCol},${qrModule.regionRow}`;

    if (existing) {
      existing.modules.push(qrModule);
      if (!existing.region.split(" ").includes(region)) {
        existing.region = `${existing.region} ${region}`;
      }
      continue;
    }

    tracks.set(trackKey, {
      durationMs: assignment.durationMs,
      index: trackIndex,
      keyframes: assignment.keyframes,
      modules: [qrModule],
      opacity: assignment.opacity,
      region,
      speedMultiplier,
      state: assignment.active ? "active" : "quiet",
      styleVars,
      timingFunction: assignment.timingFunction,
      topology: assignment.topology,
      upstreamClass: assignment.upstreamClass,
      upstreamLoader: assignment.upstreamLoader,
    });
  }

  return tracks;
}
